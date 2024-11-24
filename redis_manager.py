import redis
from redis.connection import ConnectionPool
from redis.exceptions import ConnectionError, TimeoutError
import time
import logging
import json
from typing import Optional, Any, Dict, List, Union, Tuple
from datetime import datetime, timedelta
import random
from enum import Enum
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class TaskPriority(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskType(Enum):
    VIDEO_PROCESSING = "video_processing"
    VIDEO_ANALYSIS = "video_analysis"
    MAINTENANCE = "maintenance"

class TaskStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class RedisManager:
    def __init__(self, redis_url: str):
        self.pool = ConnectionPool.from_url(
            url=redis_url,
            max_connections=10,
            socket_timeout=5.0,
            socket_connect_timeout=2.0,
            retry_on_timeout=True
        )
        
        self.redis = redis.Redis(connection_pool=self.pool)
        
        self.circuit_state = CircuitState.CLOSED
        self.error_threshold = 5
        self.reset_timeout = 60
        self.error_count = 0
        self.last_error_time = 0
        
        self.session_prefix = "session:"
        self.cache_prefix = "cache:"
        self.rate_prefix = "rate:"
        self.queue_prefix = "queue:"
        self.dlq_prefix = "dlq:"
        self.result_prefix = "result:"
        
        self.session_ttl = 3600
        self.cache_ttl = 300
        self.rate_limit_ttl = 60
        self.result_ttl = 86400
        
        self.rate_limit_requests = 100
        self.rate_limit_window = 60
        
        self.max_retries = 3
        self.base_delay = 0.1
        self.max_delay = 2.0
        self.retry_delay = 5
        self.task_timeout = 300

    def _build_key(self, prefix: str, key: str) -> str:
        return f"{prefix}{key}"

    def _check_circuit_state(self):
        if self.circuit_state == CircuitState.OPEN:
            if time.time() - self.last_error_time > self.reset_timeout:
                self.circuit_state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker state changed to HALF_OPEN")
            else:
                raise ConnectionError("Circuit breaker is OPEN")
        return self.circuit_state == CircuitState.CLOSED

    def _handle_error(self, error: Exception):
        self.error_count += 1
        if self.error_count >= self.error_threshold:
            self.circuit_state = CircuitState.OPEN
            self.last_error_time = time.time()
            logger.warning(f"Circuit breaker opened due to {self.error_count} errors")
        logger.error(f"Redis operation error: {str(error)}")

    def _handle_success(self):
        if self.circuit_state == CircuitState.HALF_OPEN:
            self.circuit_state = CircuitState.CLOSED
            self.error_count = 0
            logger.info("Circuit breaker reset to CLOSED state")

    def _retry_operation(self, operation, *args, **kwargs):
        if not self._check_circuit_state():
            raise ConnectionError("Circuit breaker is preventing operation")
        
        for attempt in range(self.max_retries):
            try:
                result = operation(*args, **kwargs)
                self._handle_success()
                return result
            except (ConnectionError, TimeoutError) as e:
                if attempt == self.max_retries - 1:
                    self._handle_error(e)
                    raise
                delay = min(self.base_delay * (2 ** attempt) + random.uniform(0, 0.1), self.max_delay)
                logger.warning(f"Redis operation failed, retrying in {delay:.2f}s. Error: {str(e)}")
                time.sleep(delay)

    def _serialize_value(self, value: Any) -> str:
        try:
            if isinstance(value, (dict, list)):
                return json.dumps(value)
            elif isinstance(value, (int, float, bool)):
                return str(value)
            elif isinstance(value, bytes):
                return value.decode('utf-8')
            return str(value)
        except Exception as e:
            logger.error(f"Error serializing value: {str(e)}")
            raise ValueError(f"Unable to serialize value: {str(e)}")

    def _deserialize_value(self, value: Optional[bytes], default_type: Any = str) -> Any:
        if value is None:
            return None
        try:
            str_value = value.decode('utf-8')
            if default_type == bool:
                return str_value.lower() == "true"
            elif default_type == int:
                return int(str_value)
            elif default_type == float:
                return float(str_value)
            elif default_type in (dict, list):
                return json.loads(str_value)
            return str_value
        except (ValueError, json.JSONDecodeError) as e:
            logger.error(f"Error deserializing value: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during deserialization: {e}")
            return None

    def validate_session(self, session_id: str) -> Tuple[bool, Optional[Dict]]:
        """Validate a session and return its data if valid"""
        try:
            key = self._build_key(self.session_prefix, session_id)
            session_data = self._retry_operation(self.redis.get, key)
            
            if not session_data:
                return False, None
                
            session_data = self._deserialize_value(session_data, dict)
            if not session_data or not isinstance(session_data, dict):
                return False, None
                
            last_refresh = session_data.get('last_refresh', 0)
            current_time = time.time()
            
            if current_time - last_refresh > self.session_ttl:
                self._retry_operation(self.redis.delete, key)
                return False, None
                
            return True, session_data
            
        except Exception as e:
            logger.error(f"Error validating session: {str(e)}")
            return False, None

    def set_session(self, session_id: str, data: Dict, ttl: Optional[int] = None) -> bool:
        """Set a new session with the given data"""
        try:
            key = self._build_key(self.session_prefix, session_id)
            data['last_refresh'] = time.time()
            serialized_data = self._serialize_value(data)
            return bool(self._retry_operation(self.redis.set, key, serialized_data, ex=(ttl or self.session_ttl)))
        except Exception as e:
            logger.error(f"Error setting session: {str(e)}")
            return False

    def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session data if it exists and is valid"""
        try:
            is_valid, session_data = self.validate_session(session_id)
            return session_data if is_valid else None
        except Exception as e:
            logger.error(f"Error getting session: {str(e)}")
            return None

    def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        try:
            key = self._build_key(self.session_prefix, session_id)
            return bool(self._retry_operation(self.redis.delete, key))
        except Exception as e:
            logger.error(f"Error deleting session: {str(e)}")
            return False

    async def refresh_session(self, session_id: str) -> bool:
        """Refresh a session if it exists and is within refresh threshold"""
        try:
            is_valid, session_data = self.validate_session(session_id)
            if not is_valid or not session_data:
                return False

            current_time = time.time()
            last_refresh = session_data.get('last_refresh', 0)
            
            # Only refresh if within threshold of expiration
            if current_time - last_refresh > (self.session_ttl - self.session_ttl / 6):
                session_data['last_refresh'] = current_time
                return self.set_session(session_id, session_data, self.session_ttl)
            
            return True
            
        except Exception as e:
            logger.error(f"Error refreshing session: {str(e)}")
            return False

    async def cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        try:
            pattern = f"{self.session_prefix}*"
            cursor = 0
            cleaned = 0
            
            while True:
                cursor, keys = self._retry_operation(self.redis.scan, cursor, match=pattern)
                current_time = time.time()
                
                for key in keys:
                    try:
                        session_data = self._retry_operation(self.redis.get, key)
                        if session_data:
                            session_data = self._deserialize_value(session_data, dict)
                            if session_data and isinstance(session_data, dict):
                                last_refresh = session_data.get('last_refresh', 0)
                                if current_time - last_refresh > self.session_ttl:
                                    self._retry_operation(self.redis.delete, key)
                                    cleaned += 1
                    except Exception as e:
                        logger.error(f"Error processing session key {key}: {str(e)}")
                        continue
                        
                if cursor == 0:
                    break
                    
            logger.info(f"Cleaned up {cleaned} expired sessions")
            
        except Exception as e:
            logger.error(f"Error in session cleanup: {str(e)}")

    def check_rate_limit(self, resource: str, identifier: str) -> bool:
        try:
            key = f"{self.rate_prefix}{resource}:{identifier}"
            with self.redis.pipeline() as pipe:
                try:
                    pipe.watch(key)
                    current = pipe.get(key)
                    if current is None:
                        pipe.multi()
                        pipe.set(key, 1, ex=self.rate_limit_ttl)
                        pipe.execute()
                        return True
                    count = int(current)
                    if count >= self.rate_limit_requests:
                        return False
                    pipe.multi()
                    pipe.incr(key)
                    pipe.execute()
                    return True
                except redis.WatchError:
                    return self.check_rate_limit(resource, identifier)
        except Exception as e:
            logger.error(f"Error checking rate limit: {str(e)}")
            return True

    def set_cache(self, cache_key: str, data: Any, ttl: Optional[int] = None) -> bool:
        try:
            key = self._build_key(self.cache_prefix, cache_key)
            serialized_data = self._serialize_value(data)
            return bool(self._retry_operation(self.redis.set, key, serialized_data, ex=(ttl or self.cache_ttl)))
        except Exception as e:
            logger.error(f"Error setting cache: {str(e)}")
            return False

    def get_cache(self, cache_key: str) -> Optional[Any]:
        try:
            key = self._build_key(self.cache_prefix, cache_key)
            data = self._retry_operation(self.redis.get, key)
            if data:
                return self._deserialize_value(data, dict)
            return None
        except Exception as e:
            logger.error(f"Error getting cache: {str(e)}")
            return None

    def invalidate_cache(self, pattern: str) -> bool:
        try:
            pattern = self._build_key(self.cache_prefix, pattern)
            cursor = 0
            deleted_keys = 0
            while True:
                cursor, keys = self._retry_operation(self.redis.scan, cursor, match=pattern)
                if keys:
                    self._retry_operation(self.redis.delete, *keys)
                    deleted_keys += len(keys)
                if cursor == 0:
                    break
            return True
        except Exception as e:
            logger.error(f"Error invalidating cache: {str(e)}")
            return False

    async def refresh_session(self, session_id: str) -> bool:
        try:
            key = self._build_key(self.session_prefix, session_id)
            session_data = self.get_session(session_id)
            if session_data:
                session_data['last_keepalive'] = time.time()
                return self.set_session(session_id, session_data, self.session_ttl)
            return False
        except Exception as e:
            logger.error(f"Error refreshing session: {str(e)}")
            return False

    def _get_queue_key(self, priority: TaskPriority, task_type: TaskType) -> str:
        return f"{self.queue_prefix}{priority.value}:{task_type.value}"

    def _get_dlq_key(self, task_type: TaskType) -> str:
        return f"{self.dlq_prefix}{task_type.value}"

    def _get_result_key(self, task_id: str) -> str:
        return f"{self.result_prefix}{task_id}"

    def enqueue_task(self, task_type: TaskType, payload: Dict[str, Any], priority: TaskPriority = TaskPriority.MEDIUM) -> Optional[str]:
        try:
            task_id = str(random.getrandbits(64))
            timestamp = time.time()
            task_data = {
                "task_id": task_id,
                "type": task_type.value,
                "payload": payload,
                "status": TaskStatus.PENDING.value,
                "priority": priority.value,
                "created_at": timestamp,
                "retries": 0,
                "last_retry": None,
                "error": None
            }
            
            queue_key = self._get_queue_key(priority, task_type)
            with self.redis.pipeline() as pipe:
                try:
                    pipe.watch(queue_key)
                    pipe.multi()
                    pipe.zadd(queue_key, {json.dumps(task_data): timestamp})
                    pipe.execute()
                    logger.info(f"Task {task_id} enqueued successfully")
                    return task_id
                except redis.WatchError:
                    logger.error(f"Queue {queue_key} was modified, retrying operation")
                    return self.enqueue_task(task_type, payload, priority)
        except Exception as e:
            logger.error(f"Error enqueueing task: {str(e)}")
            return None

    def dequeue_task(self, queue_name: str) -> Optional[Dict[str, Any]]:
        try:
            with self.redis.pipeline() as pipe:
                while True:
                    try:
                        pipe.watch(queue_name)
                        tasks = self.redis.zrange(queue_name, 0, 0, withscores=True)
                        if not tasks:
                            return None
                        task_json, score = tasks[0]
                        task_data = json.loads(task_json)
                        pipe.multi()
                        pipe.zrem(queue_name, task_json)
                        task_data["status"] = TaskStatus.PROCESSING.value
                        task_data["started_at"] = time.time()
                        pipe.execute()
                        return task_data
                    except redis.WatchError:
                        continue
        except Exception as e:
            logger.error(f"Error dequeuing task: {str(e)}")
            return None

    def get_queue_status(self) -> Dict[str, Any]:
        try:
            status = {
                "queues": {},
                "dead_letter_queues": {},
                "total_pending": 0,
                "total_processing": 0,
                "total_failed": 0
            }
            
            for priority in TaskPriority:
                for task_type in TaskType:
                    queue_key = self._get_queue_key(priority, task_type)
                    dlq_key = self._get_dlq_key(task_type)
                    queue_length = self.redis.zcard(queue_key)
                    dlq_length = self.redis.zcard(dlq_key)
                    status["queues"][f"{priority.value}:{task_type.value}"] = queue_length
                    status["dead_letter_queues"][task_type.value] = dlq_length
                    status["total_pending"] += queue_length
                    status["total_failed"] += dlq_length
                    
            return status
        except Exception as e:
            logger.error(f"Error getting queue status: {str(e)}")
            return {}

    async def cleanup_expired_cache(self):
        try:
            pattern = f"{self.cache_prefix}*"
            cursor = 0
            cleaned = 0
            while True:
                cursor, keys = self._retry_operation(self.redis.scan, cursor, match=pattern)
                for key in keys:
                    if not self._retry_operation(self.redis.ttl, key):
                        self._retry_operation(self.redis.delete, key)
                        cleaned += 1
                if cursor == 0:
                    break
            logger.info(f"Cleaned up {cleaned} expired cache entries")
        except Exception as e:
            logger.error(f"Error cleaning up cache: {str(e)}")

    async def health_check(self) -> Dict[str, Any]:
        health_info = {
            "status": "healthy",
            "circuit_state": self.circuit_state.value,
            "pool_stats": self.get_pool_stats(),
            "latency_ms": None,
            "errors": []
        }

        try:
            start_time = time.time()
            await asyncio.to_thread(self._retry_operation, self.redis.ping)
            latency = (time.time() - start_time) * 1000
            health_info["latency_ms"] = round(latency, 2)
            keyspace_info = await asyncio.to_thread(self._retry_operation, self.redis.info, "keyspace")
            health_info["keyspace"] = keyspace_info
        except Exception as e:
            health_info["status"] = "unhealthy"
            health_info["errors"].append(str(e))

        return health_info

    async def get_metrics(self) -> Dict[str, Any]:
        try:
            metrics = {
                "pool_stats": self.get_pool_stats(),
                "operations": {
                    "processed_tasks": 0,
                    "failed_tasks": 0,
                    "queued_tasks": 0,
                    "used_memory": "0",
                    "used_memory_peak": "0"
                }
            }

            info = await asyncio.to_thread(self._retry_operation, self.redis.info)
            if info:
                metrics["operations"].update({
                    "processed_tasks": info.get("total_commands_processed", 0),
                    "used_memory": info.get("used_memory_human", "0"),
                    "used_memory_peak": info.get("used_memory_peak_human", "0")
                })

            queue_status = self.get_queue_status()
            metrics["operations"]["queued_tasks"] = queue_status.get("total_pending", 0)
            metrics["operations"]["failed_tasks"] = queue_status.get("total_failed", 0)

            return metrics
        except Exception as e:
            logger.error(f"Error getting metrics: {str(e)}")
            return {}

    def get_pool_stats(self) -> Dict:
        return {
            "max_connections": self.pool.max_connections,
            "current_connections": len(self.pool._in_use_connections),
            "available_connections": len(self.pool._available_connections)
        }