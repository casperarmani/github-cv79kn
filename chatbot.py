import os
import asyncio
import logging
import google.generativeai as genai
from google.generativeai import caching
import datetime
from datetime import timezone
from dotenv import load_dotenv
from moviepy.editor import VideoFileClip
from typing import List, Dict, Optional, Tuple
import json
import re
import tempfile
from redis_storage import RedisFileStorage

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get the API key
api_key = os.getenv("GEMINI_API_KEY")
redis_url = os.getenv("REDIS_URL")

if not api_key:
    raise ValueError("No GEMINI_API_KEY found in environment variables. Please set it in your .env file.")

if not redis_url:
    raise ValueError("No REDIS_URL found in environment variables. Please set it in your .env file.")

# Initialize Redis storage
redis_storage = RedisFileStorage(redis_url)

# Configure the generative AI
genai.configure(api_key=api_key)

class Chatbot:
    def __init__(self):
        self.generation_config = genai.types.GenerationConfig(
            temperature=0.9,
            top_p=1,
            top_k=1,
            max_output_tokens=2048,
        )
        
        # Define safety settings
        safety_settings = {
            "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
            "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
            "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
            "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
        }
        
        self.model = genai.GenerativeModel(
            model_name="models/gemini-1.5-pro-002",
            generation_config=self.generation_config,
            safety_settings=safety_settings
        )
        
        # Initialize chat history and context tracking
        self.chat_history = []
        self.video_contexts = []
        self.system_prompt = """You are an expert video and content analyzer. 
        Maintain context of ALL interactions including user information, previous chats, and video analyses. Always assume questions are about the most recently analyzed video unless another video is specifically referenced. Absolutely don't mention uploading any new videos if not asked. If asked to analyze or explain again, just explain again without mentioning it was done again. When referring to previous content, be specific about which video you're discussing.
        If you make a mistake, acknowledge it and correct yourself.
        Format your responses using clean markdown with single # for headers and proper indentation."""
        
        self.chat_session = self.model.start_chat(history=[])
        self._add_to_history("system", self.system_prompt)

    def _format_response(self, response: str, filename: str = '') -> str:
        """Format the response with clean markdown structure"""
        # Remove UUID prefix from filename if provided
        if filename:
            uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_'
            clean_filename = re.sub(uuid_pattern, '', filename)
            response = response.replace(filename, clean_filename)

        # Clean up markdown formatting
        lines = response.split('\n')
        formatted_lines = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Convert multiple # to single #
            if line.startswith('#'):
                line = re.sub(r'^#+\s*', '# ', line)
            
            # Format bullet points
            if line.startswith('•') or line.startswith('-'):
                line = re.sub(r'^[•-]\s*', '- ', line)
                if any(term in line.lower() for term in ['duration:', 'format:', 'resolution:', 'fps:', 'size:']):
                    line = f"  {line}"
            
            formatted_lines.append(line)

        return '\n\n'.join(formatted_lines)

    def _add_to_history(self, role: str, content: str):
        """Add message to chat history with timezone-aware timestamp"""
        self.chat_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.datetime.now(timezone.utc).isoformat()
        })

    async def extract_video_metadata(self, video_content: bytes) -> Optional[Dict]:
        """Extract metadata from video content"""
        temp_file = None
        try:
            # Create a temporary file with .mp4 extension
            temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_file.write(video_content)
            temp_file.flush()
            
            # Extract metadata using MoviePy
            clip = VideoFileClip(temp_file.name)
            metadata = {
                'duration': str(datetime.timedelta(seconds=int(clip.duration))),
                'format': 'mp4',
                'size': len(video_content),
                'fps': clip.fps,
                'resolution': f"{clip.size[0]}x{clip.size[1]}"
            }
            clip.close()
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting video metadata: {str(e)}")
            return None
            
        finally:
            if temp_file:
                try:
                    temp_file.close()
                    os.unlink(temp_file.name)
                except Exception as e:
                    logger.error(f"Error cleaning up temporary file: {str(e)}")

    async def analyze_video(self, file_id: str, filename: str, prompt: str = '') -> tuple[str, Optional[Dict]]:
        """Analyze video content from Redis storage"""
        try:
            logger.info(f"Retrieving video content for file ID: {file_id}")
            
            # Retrieve video content from Redis
            video_content = await redis_storage.retrieve_file(file_id)
            if video_content is None:
                raise ValueError(f"Failed to retrieve video content for file ID: {file_id}")
            
            # Extract metadata from video content
            metadata = await self.extract_video_metadata(video_content)
            
            # Create a temporary file for Gemini API
            temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            try:
                temp_file.write(video_content)
                temp_file.flush()
                logger.info(f"Uploading video file: {temp_file.name}")
                
                # Use the temporary file for Gemini API upload
                video_file = genai.upload_file(
                    path=temp_file.name,
                    mime_type="video/mp4"
                )
                
                logger.info("Waiting for video processing...")
                while video_file.state.name == "PROCESSING":
                    await asyncio.sleep(2)
                    video_file = genai.get_file(video_file.name)

                if video_file.state.name == "FAILED":
                    raise ValueError(f"Video processing failed: {video_file.state.name}")

                # Create analysis prompt with full context
                context_prompt = self._create_analysis_prompt(filename, metadata)
                
                if prompt:
                    context_prompt += f"\n\nAdditional instructions: {prompt}"

                # Use the chat session for analysis
                response = await self.chat_session.send_message_async([video_file, context_prompt])
                response_text = self._format_response(response.text, filename)
                
                # Add analysis to chat history
                self._add_to_history("system", f"Video Analysis ({filename}): {response_text}")
                
                return response_text, metadata

            finally:
                # Clean up temporary file
                try:
                    temp_file.close()
                    os.unlink(temp_file.name)
                except Exception as e:
                    logger.error(f"Error cleaning up temporary file: {str(e)}")

        except Exception as e:
            logger.error(f"Error analyzing video: {str(e)}")
            return f"An error occurred during video analysis: {str(e)}", None

    async def send_message(self, message: str) -> str:
        """Send a message while maintaining context"""
        try:
            # Add user message to history
            self._add_to_history("user", message)
            
            # Create context-aware prompt
            context_prompt = (
                f"Remember these key points from our conversation:\n"
                f"1. Previous messages: {self.chat_history[-5:] if len(self.chat_history) > 5 else self.chat_history}\n"
                f"2. Video contexts analyzed: {len(self.video_contexts)} videos\n"
                f"\nUser's current message: {message}"
            )
            
            response = await self.chat_session.send_message_async(context_prompt)
            response_text = self._format_response(response.text)
            
            # Add bot response to history
            self._add_to_history("bot", response_text)
            
            return response_text
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            if "429" in str(e) or "quota" in str(e).lower():
                return "I apologize, but the API quota has been exceeded. Please try again in a few minutes."
            return "I apologize, but there was an unexpected error. Please try again."

    def _create_analysis_prompt(self, filename: str, metadata: Optional[Dict]) -> str:
        """Create the analysis prompt with proper context"""
        context_prompt = (
            f"Analyze this video in detail with the following structure:\n"
            f"# Video Information\n"
            f"- Filename: {filename}\n"
            f"- Technical Details:\n"
        )
        
        if metadata:
            context_prompt += (
                f"  Duration: {metadata.get('duration', 'Unknown')}\n"
                f"  Format: {metadata.get('format', 'Unknown')}\n"
                f"  Resolution: {metadata.get('resolution', 'Unknown')}\n\n"
            )
        else:
            context_prompt += "  (Technical details unavailable)\n\n"
            
        context_prompt += (
            f"# Content Overview\n"
            f"(Describe the main content and key scenes)\n\n"
            f"# Technical Quality\n"
            f"(Evaluate video and audio quality)\n\n"
            f"# Key Points\n"
            f"(List main takeaways)\n\n"
            f"# Areas for Improvement\n"
            f"(Suggest potential enhancements)\n\n"
        )
        
        return context_prompt
