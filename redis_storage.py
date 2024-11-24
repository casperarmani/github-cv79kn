import os
import redis
import zlib
import logging
from typing import Optional, List, Union, Any
import asyncio
import time
import math

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RedisFileStorage:
    def __init__(self, redis_url: str, chunk_size: int = 1024 * 1024):  # 1MB chunks
        self.redis_client = redis.from_url(redis_url)
        self.chunk_size = chunk_size
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        self.compression_threshold = 10 * 1024 * 1024  # 10MB
        self.ttl = 3600  # 1 hour
        self.video_prefix = "video:"
        self.cache_prefix = "cache:"
        self.rate_prefix = "rate:"

    def _should_compress(self, file_size: int) -> bool:
        return file_size > self.compression_threshold

    def _compress_data(self, data: bytes) -> bytes:
        return zlib.compress(data)

    def _decompress_data(self, data: bytes) -> bytes:
        return zlib.decompress(data)

    def _encode_metadata(self, value: Any) -> str:
        """Convert value to string format suitable for Redis storage"""
        if isinstance(value, bool):
            return "true" if value else "false"
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, str):
            return value
        elif isinstance(value, bytes):
            return value.decode('utf-8')
        return str(value)

    def _decode_metadata(self, value: Union[bytes, str], expected_type: type) -> Any:
        """Convert Redis stored value back to its original type"""
        if value is None:
            return None
        
        # Convert bytes to string if needed
        if isinstance(value, bytes):
            value = value.decode('utf-8')
        
        if expected_type == bool:
            return value.lower() == "true"
        elif expected_type == int:
            return int(value)
        elif expected_type == float:
            return float(value)
        elif expected_type == bytes:
            return value.encode('utf-8')
        return value

    async def store_file(self, file_id: str, file_data: bytes) -> bool:
        """Store file in Redis with chunking and optional compression"""
        try:
            file_size = len(file_data)
            if file_size > self.max_file_size:
                logger.error(f"File size {file_size} exceeds maximum allowed size of {self.max_file_size}")
                return False

            # Compress if needed
            should_compress = self._should_compress(file_size)
            if should_compress:
                logger.info(f"Compressing video {file_id} (Original size: {file_size} bytes)")
                file_data = self._compress_data(file_data)
                logger.info(f"Compressed size: {len(file_data)} bytes")

            # Calculate number of chunks
            num_chunks = math.ceil(len(file_data) / self.chunk_size)
            logger.info(f"Creating {num_chunks} chunks for video {file_id}")
            
            try:
                # Store metadata as strings
                metadata = {
                    'size': self._encode_metadata(file_size),
                    'compressed': self._encode_metadata(should_compress),
                    'chunks': self._encode_metadata(num_chunks),
                    'timestamp': self._encode_metadata(time.time())
                }
                
                metadata_key = f"{self.video_prefix}{file_id}:metadata"
                logger.info(f"Storing video metadata with key: {metadata_key}")
                self.redis_client.delete(metadata_key)  # Clear any existing metadata
                self.redis_client.hset(metadata_key, mapping=metadata)
                self.redis_client.expire(metadata_key, self.ttl)
                logger.info(f"Set TTL {self.ttl} seconds for key: {metadata_key}")

                # Store chunks
                for i in range(num_chunks):
                    chunk = file_data[i * self.chunk_size:(i + 1) * self.chunk_size]
                    chunk_key = f"{self.video_prefix}{file_id}:chunk:{i}"
                    logger.info(f"Storing chunk {i} with key: {chunk_key}")
                    self.redis_client.set(chunk_key, chunk, ex=self.ttl)

                return True

            except redis.RedisError as e:
                logger.error(f"Redis error while storing video {file_id}: {str(e)}")
                return False

        except Exception as e:
            logger.error(f"Error storing video {file_id}: {str(e)}")
            return False

    async def retrieve_file(self, file_id: str) -> Optional[bytes]:
        """Retrieve file from Redis and reconstruct it"""
        try:
            # Get metadata
            metadata_key = f"{self.video_prefix}{file_id}:metadata"
            logger.info(f"Retrieving video metadata from key: {metadata_key}")
            metadata = self.redis_client.hgetall(metadata_key)
            if not metadata:
                logger.error(f"No metadata found for video {file_id}")
                return None

            try:
                # Convert metadata values to appropriate types
                num_chunks = self._decode_metadata(metadata[b'chunks'], int)
                is_compressed = self._decode_metadata(metadata[b'compressed'], bool)
                logger.info(f"Found {num_chunks} chunks for video {file_id}")
                chunks = []

                # Retrieve all chunks
                for i in range(num_chunks):
                    chunk_key = f"{self.video_prefix}{file_id}:chunk:{i}"
                    logger.info(f"Retrieving chunk {i} from key: {chunk_key}")
                    chunk = self.redis_client.get(chunk_key)
                    if chunk is None:
                        logger.error(f"Missing chunk {i} for video {file_id}")
                        return None
                    chunks.append(chunk)

                # Combine chunks
                file_data = b''.join(chunks)

                # Decompress if needed
                if is_compressed:
                    logger.info(f"Decompressing video {file_id}")
                    file_data = self._decompress_data(file_data)

                return file_data

            except (ValueError, KeyError) as e:
                logger.error(f"Error parsing metadata for video {file_id}: {str(e)}")
                return None

        except Exception as e:
            logger.error(f"Error retrieving video {file_id}: {str(e)}")
            return None

    async def delete_file(self, file_id: str) -> bool:
        """Delete file and its chunks from Redis"""
        try:
            metadata_key = f"{self.video_prefix}{file_id}:metadata"
            logger.info(f"Attempting to delete video with key: {metadata_key}")
            metadata = self.redis_client.hgetall(metadata_key)
            if not metadata:
                return False

            try:
                num_chunks = self._decode_metadata(metadata[b'chunks'], int)
                logger.info(f"Deleting {num_chunks} chunks for video {file_id}")

                # Delete all chunks
                for i in range(num_chunks):
                    chunk_key = f"{self.video_prefix}{file_id}:chunk:{i}"
                    logger.info(f"Deleting chunk {i} with key: {chunk_key}")
                    self.redis_client.delete(chunk_key)

                # Delete metadata
                self.redis_client.delete(metadata_key)
                logger.info(f"Deleted metadata key: {metadata_key}")

                return True

            except (ValueError, KeyError) as e:
                logger.error(f"Error parsing metadata for video {file_id}: {str(e)}")
                return False

        except Exception as e:
            logger.error(f"Error deleting video {file_id}: {str(e)}")
            return False

    async def cleanup_expired_files(self):
        """Cleanup task to remove expired files"""
        try:
            current_time = time.time()
            pattern = f"{self.video_prefix}*:metadata"
            logger.info(f"Starting cleanup task, scanning for pattern: {pattern}")
            
            # Scan for all file metadata keys
            cursor = 0
            while True:
                cursor, keys = self.redis_client.scan(cursor, match=pattern)
                
                for key in keys:
                    try:
                        metadata = self.redis_client.hgetall(key.decode('utf-8'))
                        if not metadata:
                            continue

                        file_id = key.decode('utf-8').split(':')[1]
                        timestamp = self._decode_metadata(metadata[b'timestamp'], float)
                        
                        # Check if file has expired
                        if current_time - timestamp > self.ttl:
                            logger.info(f"Found expired video: {file_id}, age: {current_time - timestamp}s")
                            await self.delete_file(file_id)
                    except Exception as e:
                        logger.error(f"Error processing metadata for key {key}: {str(e)}")
                        continue

                if cursor == 0:
                    break

        except Exception as e:
            logger.error(f"Error in cleanup task: {str(e)}")
