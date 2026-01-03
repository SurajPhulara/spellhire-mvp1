"""
Path: backend/app/core/redis.py

Redis integration (MVP): connection lifecycle + thin utilities.

NOTES / design decisions:
- Refresh tokens / sessions were moved to the database (user_sessions). Redis is no longer used for auth session storage.
- Keep Redis for: rate-limiting counters, short-lived caches, pub/sub, and ephemeral data.
- IMPORTANT: Never use `KEYS` in production. Use `SCAN` carefully or maintain per-user sets if you need listing.
- This module exposes:
  - connect_redis / disconnect_redis
  - get_redis dependency
  - RedisService: minimal, safe helpers for get/set/delete/incr/expire
- All functions are async and use redis.asyncio client.
"""

import redis.asyncio as redis
from app.core.config import settings
import logging
import json
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Global Redis client (initialized at startup)
# ---------------------------------------------------------------------
redis_client: Optional[redis.Redis] = None


# ---------------------------------------------------------------------
# Lifecycle helpers
# ---------------------------------------------------------------------
async def connect_redis() -> None:
    """
    Initialize global Redis client and verify connectivity.

    This is called at application startup. If Redis is required and unreachable,
    startup will fail (fail-fast).
    """
    global redis_client
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            password=settings.REDIS_PASSWORD,
            decode_responses=True,
        )
        # quick ping to validate connection
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error("Failed to connect to Redis: %s", e)
        # Re-raise so startup fails if Redis is required
        raise


async def disconnect_redis() -> None:
    """
    Close the Redis connection when the application shuts down.
    """
    global redis_client
    if redis_client:
        try:
            await redis_client.close()
            logger.info("Redis disconnected successfully")
        except Exception as e:
            logger.error("Failed to disconnect from Redis: %s", e)


async def get_redis() -> redis.Redis:
    """
    Return the initialized Redis client.

    Raises:
        RuntimeError: if connect_redis hasn't been called successfully.
    """
    if not redis_client:
        raise RuntimeError("Redis not connected")
    return redis_client


# ---------------------------------------------------------------------
# Thin Redis helper wrapper
# ---------------------------------------------------------------------
class RedisService:
    """
    Minimal async Redis helpers.

    Purpose:
    - Keep JSON encoding/decoding logic in one place
    - Return sensible defaults on errors (avoid throwing in non-critical caching)
    - Keep API small and explicit; avoid over-abstracting Redis features
    """

    @staticmethod
    async def set(key: str, value: Any, expire: Optional[int] = None) -> bool:
        """
        Set a key with optional expiry (seconds).
        Accepts dictionaries/lists and serializes them to JSON automatically.
        Returns True on success, False on failure.
        """
        try:
            client = await get_redis()
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            # redis-py accepts ex for seconds
            result = await client.set(key, value, ex=expire)
            return bool(result)
        except Exception as e:
            logger.debug("Redis SET error for key=%s: %s", key, e)
            return False

    @staticmethod
    async def get(key: str, as_json: bool = False) -> Optional[Any]:
        """
        Get a value. If as_json=True, parse JSON before returning.
        Returns None if key missing or on error.
        """
        try:
            client = await get_redis()
            value = await client.get(key)
            if value is None:
                return None
            if as_json:
                try:
                    return json.loads(value)
                except Exception:
                    # If JSON parse fails, return raw value
                    logger.debug("Redis JSON parse failed for key=%s", key)
                    return value
            return value
        except Exception as e:
            logger.debug("Redis GET error for key=%s: %s", key, e)
            return None

    @staticmethod
    async def delete(key: str) -> bool:
        """Delete a key. Returns True if key was removed, False otherwise."""
        try:
            client = await get_redis()
            result = await client.delete(key)
            return bool(result)
        except Exception as e:
            logger.debug("Redis DELETE error for key=%s: %s", key, e)
            return False

    @staticmethod
    async def exists(key: str) -> bool:
        """Return True if key exists, False otherwise."""
        try:
            client = await get_redis()
            result = await client.exists(key)
            return bool(result)
        except Exception as e:
            logger.debug("Redis EXISTS error for key=%s: %s", key, e)
            return False

    @staticmethod
    async def increment(key: str, amount: int = 1) -> Optional[int]:
        """
        Increment a numeric key by `amount`. Returns new value or None on error.
        Useful for simple counters (rate limiting, counters).
        """
        try:
            client = await get_redis()
            # INCRBY returns integer value after increment
            result = await client.incrby(key, amount)
            return int(result)
        except Exception as e:
            logger.debug("Redis INCR error for key=%s: %s", key, e)
            return None

    @staticmethod
    async def expire(key: str, seconds: int) -> bool:
        """Set TTL on a key (seconds). Returns True if TTL set, False otherwise."""
        try:
            client = await get_redis()
            result = await client.expire(key, seconds)
            return bool(result)
        except Exception as e:
            logger.debug("Redis EXPIRE error for key=%s: %s", key, e)
            return False

    # Optional set helpers (kept minimal)
    @staticmethod
    async def sadd(key: str, *members: Any) -> bool:
        """Add members to a set. Returns True on success, False on error."""
        try:
            client = await get_redis()
            await client.sadd(key, *members)
            return True
        except Exception as e:
            logger.debug("Redis SADD error for key=%s: %s", key, e)
            return False

    @staticmethod
    async def srem(key: str, *members: Any) -> bool:
        """Remove members from a set."""
        try:
            client = await get_redis()
            await client.srem(key, *members)
            return True
        except Exception as e:
            logger.debug("Redis SREM error for key=%s: %s", key, e)
            return False

    @staticmethod
    async def smembers(key: str) -> Optional[set]:
        """Return set members or None on error."""
        try:
            client = await get_redis()
            members = await client.smembers(key)
            return set(members) if members is not None else set()
        except Exception as e:
            logger.debug("Redis SMEMBERS error for key=%s: %s", key, e)
            return None
