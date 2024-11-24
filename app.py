import os
import logging
import time
import asyncio
import secrets
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

import jwt
import httpx
import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2AuthorizationCodeBearer
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.requests import Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from chatbot import Chatbot
from database import Database, create_user, get_user_by_email
from redis_storage import RedisFileStorage
from redis_manager import RedisManager, TaskType, TaskPriority
from session_config import (
    SESSION_LIFETIME,
    SESSION_REFRESH_THRESHOLD,
    COOKIE_SECURE,
    COOKIE_HTTPONLY,
    COOKIE_SAMESITE,
    SESSION_CLEANUP_INTERVAL
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from dotenv import load_dotenv
load_dotenv()

redis_url = os.getenv('REDIS_URL')
if not redis_url:
    raise ValueError("REDIS_URL environment variable is not set")

redis_storage = RedisFileStorage(redis_url)
redis_manager = RedisManager(redis_url)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables")

from supabase.client import create_client
supabase = create_client(supabase_url, supabase_key)

db = Database(supabase)
chatbot = Chatbot()

class ChatSession(BaseModel):
    id: Optional[str] = None
    title: str = "New Chat"

async def get_current_user(request: Request, return_none=False):
    try:
        session_id = request.cookies.get('session_id')
        if not session_id:
            if return_none:
                return None
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        is_valid, session_data = redis_manager.validate_session(session_id)
        if not is_valid or not session_data:
            if return_none:
                return None
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        if not isinstance(session_data, dict) or 'id' not in session_data:
            if return_none:
                return None
            raise HTTPException(status_code=401, detail="Invalid session data")

        current_time = time.time()
        last_refresh = session_data.get('last_refresh', 0)
        if current_time - last_refresh > SESSION_REFRESH_THRESHOLD:
            await redis_manager.refresh_session(session_id)

        return session_data
    except Exception as e:
        logger.error(f"Error in get_current_user: {str(e)}")
        if return_none:
            return None
        raise HTTPException(status_code=401, detail="Authentication error")

app = FastAPI(
    title="Video Analysis Chatbot",
    description="A FastAPI application for video analysis with chatbot capabilities",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

@app.post("/chat_sessions")
async def create_chat_session(
    session: ChatSession,
    user: dict = Depends(get_current_user)
) -> JSONResponse:
    try:
        result = await db.create_chat_session(user['id'], session.title)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error creating chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat_sessions")
async def get_chat_sessions(
    user: dict = Depends(get_current_user)
) -> JSONResponse:
    try:
        sessions = await db.get_user_chat_sessions(user['id'])
        return JSONResponse(content=sessions)
    except Exception as e:
        logger.error(f"Error getting chat sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/chat_sessions/{session_id}")
async def update_chat_session(
    session_id: str,
    session: ChatSession,
    user: dict = Depends(get_current_user)
) -> JSONResponse:
    try:
        result = await db.update_chat_session(session_id, session.title)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error updating chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat_history")
async def get_chat_history(
    session_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
) -> JSONResponse:
    try:
        messages = await db.get_chat_history(user['id'], session_id)
        return JSONResponse(content=messages)
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send_message")
async def send_message(
    request: Request,
    message: str = Form(...),
    session_id: Optional[str] = Form(None),
    videos: Optional[List[UploadFile]] = File(None),
    user: dict = Depends(get_current_user)
) -> JSONResponse:
    try:
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")

        # Verify session belongs to user
        sessions = await db.get_user_chat_sessions(user['id'])
        if not any(session['id'] == session_id for session in sessions):
            raise HTTPException(status_code=403, detail="Invalid session ID")

        # Process videos if provided
        video_response = None
        if videos and len(videos) > 0:
            for video in videos:
                content = await video.read()
                file_id = str(uuid.uuid4())
                await redis_storage.store_file(file_id, content)
                video_response = await chatbot.analyze_video(file_id, video.filename)

        # Process the chat message
        chat_response = await chatbot.send_message(message)
        final_response = video_response if video_response else chat_response
        
        # Save the conversation to the database with session_id
        await db.save_chat_message(user['id'], message, final_response, session_id)
        
        return JSONResponse(content={"response": final_response})
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    app.state.start_time = time.time()
    app.state.request_count = 0
    
    async def cleanup_sessions():
        while True:
            await redis_manager.cleanup_expired_sessions()
            await asyncio.sleep(SESSION_CLEANUP_INTERVAL)
    
    asyncio.create_task(cleanup_sessions())

origins = [
    "http://localhost:5173",
    "http://0.0.0.0:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

@app.post('/login')
async def login_post(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    response: Response = None
):
    try:
        if not redis_manager.check_rate_limit("login", request.client.host):
            raise HTTPException(
                status_code=429,
                detail="Too many login attempts. Please try again later."
            )

        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if not auth_response.user:
            logger.error("Login failed: No user in response")
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Invalid credentials"}
            )

        user = await get_user_by_email(email)
        if not user:
            user = await create_user(email)

        session_id = secrets.token_urlsafe(32)
        session_data = {
            "id": str(user.get("id")),
            "email": email,
            "last_refresh": time.time()
        }

        if not redis_manager.set_session(session_id, session_data, SESSION_LIFETIME):
            raise HTTPException(
                status_code=500,
                detail="Failed to create session"
            )

        response = JSONResponse(content={"success": True, "message": "Login successful"})
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=COOKIE_HTTPONLY,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            max_age=SESSION_LIFETIME
        )
        return response

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": str(e)}
        )

@app.post('/logout')
async def logout(request: Request):
    session_id = request.cookies.get('session_id')
    if session_id:
        redis_manager.delete_session(session_id)
    
    response = JSONResponse(content={"success": True, "message": "Logout successful"})
    response.delete_cookie(
        key="session_id",
        secure=COOKIE_SECURE,
        httponly=COOKIE_HTTPONLY,
        samesite=COOKIE_SAMESITE
    )
    return response

@app.get("/auth_status")
async def auth_status(request: Request):
    try:
        user = await get_current_user(request, return_none=True)
        if not user:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "authenticated": False,
                    "message": "No session found"
                }
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "authenticated": True,
                "user": user
            }
        )

    except Exception as e:
        logger.error(f"Auth status check: Unexpected error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "authenticated": False,
                "error": "Internal server error"
            }
        )

@app.get("/", response_class=HTMLResponse)
async def serve_react_app(request: Request):
    return FileResponse("static/react/index.html")

app.mount("/assets", StaticFiles(directory="static/react/assets"), name="assets")
app.mount("/", StaticFiles(directory="static/react", html=True), name="spa")

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    if request.url.path.startswith("/api") or request.url.path in [
        "/login", "/logout", "/auth_status", 
        "/chat_history", "/video_analysis_history", "/send_message"
    ]:
        raise exc
    try:
        return FileResponse("static/react/index.html")
    except Exception as e:
        logger.error(f"Error serving SPA: {str(e)}")
        raise HTTPException(status_code=500, detail="Error serving application")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=3000, reload=True)