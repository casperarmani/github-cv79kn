from datetime import datetime
import uuid
from typing import List, Optional
from fastapi import HTTPException
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    async def create_chat_session(self, user_id: str, title: str = "New Chat") -> dict:
        try:
            response = self.supabase.table('chat_sessions').insert({
                'user_id': user_id,
                'title': title
            }).execute()
            return response.data[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")

    async def get_user_chat_sessions(self, user_id: str) -> List[dict]:
        try:
            response = self.supabase.table('chat_sessions')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('updated_at', desc=True)\
                .execute()
            return response.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get chat sessions: {str(e)}")

    async def update_chat_session(self, session_id: str, title: str) -> dict:
        try:
            response = self.supabase.table('chat_sessions')\
                .update({'title': title, 'updated_at': datetime.utcnow().isoformat()})\
                .eq('id', session_id)\
                .execute()
            return response.data[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update chat session: {str(e)}")

    async def get_chat_history(self, user_id: str, session_id: Optional[str] = None, limit: int = 50) -> List[dict]:
        try:
            # Validate user_id
            if not user_id:
                logger.warning("Attempted to retrieve chat history with empty user_id")
                return []

            # Build comprehensive query
            query = self.supabase.table('user_chat_history')\
                .select('id,user_id,session_id,message,chat_type,"TIMESTAMP",last_updated')\
                .eq('user_id', user_id)\
                .is_('deleted_at', 'null')\
                .order('TIMESTAMP', desc=True)\
                .limit(limit)
            
            # Optional session_id filtering
            if session_id:
                query = query.eq('session_id', session_id)
            
            response = query.execute()
            
            if not response.data:
                logger.info(f"No chat history found for user {user_id}")
                return []
                
            # Comprehensive transformation of data
            transformed_history = []
            for msg in response.data:
                try:
                    # Ensure all required fields are present with fallback values
                    transformed_msg = {
                        'TIMESTAMP': (
                            msg.get('TIMESTAMP') or 
                            msg.get('timestamp') or 
                            msg.get('last_updated') or 
                            datetime.now().isoformat()
                        ),
                        'chat_type': msg.get('chat_type', 'user'),
                        'message': msg.get('message', ''),
                        'id': str(msg.get('id') or uuid.uuid4()),
                        'session_id': msg.get('session_id')  # Include session_id
                    }
                    transformed_history.append(transformed_msg)
                except Exception as transform_error:
                    logger.error(f"Error transforming chat history item: {transform_error}")
            
            # Sort transformed history by timestamp
            transformed_history.sort(
                key=lambda x: datetime.fromisoformat(x['TIMESTAMP']), 
                reverse=True
            )
            
            # Log transformed data only at debug level
            logger.debug(f"Transformed chat history for user {user_id}: {transformed_history}")
            
            return transformed_history
        
        except Exception as e:
            logger.error(f"Comprehensive database error in get_chat_history: {str(e)}")
            if 'violates foreign key constraint' in str(e):
                logger.warning(f"Invalid user ID: {user_id}")
                raise HTTPException(status_code=400, detail="Invalid user ID")
            raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")

    async def save_chat_message(self, user_id: str, message: str, response: str, session_id: Optional[str] = None) -> dict:
        try:
            # If no session_id provided, create a new session
            if not session_id:
                session = await self.create_chat_session(user_id)
                session_id = session['id']
            
            current_time = datetime.utcnow().isoformat()
            
            # Save user message (message must not be NULL as per schema)
            user_msg = self.supabase.table('user_chat_history').insert({
                'user_id': user_id,
                'session_id': session_id,
                'message': message,  # Required field
                'chat_type': 'text',
                'TIMESTAMP': current_time,
                'last_updated': current_time
            }).execute()

            # Save bot response (bot's message is the response)
            bot_msg = self.supabase.table('user_chat_history').insert({
                'user_id': user_id,
                'session_id': session_id,
                'message': response,  # Required field
                'chat_type': 'bot',
                'TIMESTAMP': current_time,
                'last_updated': current_time
            }).execute()

            # Update session's updated_at timestamp
            self.supabase.table('chat_sessions')\
                .update({'updated_at': current_time})\
                .eq('id', session_id)\
                .execute()

            return {'user_message': user_msg.data[0], 'bot_message': bot_msg.data[0]}
        except Exception as e:
            if 'violates check constraint' in str(e):
                raise HTTPException(status_code=400, detail="Message cannot be empty")
            if 'violates foreign key constraint' in str(e):
                raise HTTPException(status_code=400, detail="Invalid session or user ID")
            raise HTTPException(status_code=500, detail=f"Failed to save chat message: {str(e)}")

async def create_user(email: str) -> Dict:
    response = supabase.table("users").insert({"email": email}).execute()
    return response.data[0] if response.data else {}

async def get_user_by_email(email: str) -> Dict:
    response = supabase.table("users").select("*").eq("email", email).execute()
    return response.data[0] if response.data else {}

async def check_user_exists(user_id: uuid.UUID) -> bool:
    response = supabase.table("users").select("id").eq("id", str(user_id)).execute()
    return len(response.data) > 0

async def insert_chat_message(user_id: uuid.UUID, message: str, chat_type: str = 'text') -> Dict:
    user_exists = await check_user_exists(user_id)
    if not user_exists:
        raise ValueError(f"User with id {user_id} does not exist")
    response = supabase.table("user_chat_history").insert({
        "user_id": str(user_id),
        "message": message,
        "chat_type": chat_type
    }).execute()
    return response.data[0] if response.data else {}

async def get_chat_history(user_id: uuid.UUID, limit: int = 50) -> List[Dict]:
    try:
        logger.info(f"Attempting to fetch chat history for user {user_id}")
        
        # Convert user_id to string and ensure it's a valid UUID
        user_id_str = str(user_id)
        
        response = supabase.table("user_chat_history")\
            .select("*")\
            .eq("user_id", user_id_str)\
            .order("TIMESTAMP", desc=True)\
            .limit(limit)\
            .execute()
        
        logger.info(f"Raw database response: {response.data}")
        
        if not response.data:
            logger.warning(f"No chat history found for user {user_id}")
            return []
        
        # Transform data to ensure consistent format
        transformed_data = []
        for item in response.data:
            try:
                transformed_item = {
                    'TIMESTAMP': item.get('TIMESTAMP') or datetime.now().isoformat(),
                    'chat_type': item.get('chat_type', 'user'),
                    'message': item.get('message', ''),
                    'id': str(item.get('id') or uuid.uuid4()),
                    'user_id': user_id_str
                }
                transformed_data.append(transformed_item)
            except Exception as transform_error:
                logger.error(f"Error transforming chat history item: {transform_error}")
        
        logger.info(f"Transformed chat history: {transformed_data}")
        return transformed_data
    
    except Exception as e:
        logger.error(f"Error fetching chat history for user {user_id}: {str(e)}")
        return []

async def insert_video_analysis(user_id: uuid.UUID, upload_file_name: str, analysis: str, video_duration: Optional[str] = None, video_format: Optional[str] = None) -> Dict:
    response = supabase.table("video_analysis_output").insert({
        "user_id": str(user_id),
        "upload_file_name": upload_file_name,
        "analysis": analysis,
        "video_duration": video_duration,
        "video_format": video_format
    }).execute()
    return response.data[0] if response.data else {}

async def get_video_analysis_history(user_id: uuid.UUID, limit: int = 10) -> List[Dict]:
    response = supabase.table("video_analysis_output").select("*").eq("user_id", str(user_id)).order("TIMESTAMP", desc=True).limit(limit).execute()
    return response.data

import os
from supabase.client import create_client, Client
from typing import List, Dict, Optional
import uuid

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables")

supabase: Client = create_client(supabase_url, supabase_key)
