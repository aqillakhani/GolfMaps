"""Caching layer with SQLite persistence and in-memory LRU."""

import json
import logging
import os
import time
from typing import Optional

import aiosqlite
from cachetools import TTLCache

from api.schemas import CourseGeometryResponse
from config import settings

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(self, db_path: str = "cache/courses.db"):
        self.db_path = db_path
        self._memory: TTLCache = TTLCache(
            maxsize=settings.memory_cache_size,
            ttl=settings.memory_cache_ttl_seconds,
        )
        self._db: Optional[aiosqlite.Connection] = None

    async def init_db(self):
        """Initialize the SQLite database."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._db = await aiosqlite.connect(self.db_path)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS geometry_cache (
                cache_key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at REAL NOT NULL,
                ttl_days INTEGER NOT NULL DEFAULT 90
            )
        """)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS handle_cache (
                course_name TEXT PRIMARY KEY,
                handle TEXT NOT NULL,
                created_at REAL NOT NULL,
                ttl_days INTEGER NOT NULL DEFAULT 30
            )
        """)
        await self._db.commit()
        logger.info(f"Cache DB initialized at {self.db_path}")

    async def close(self):
        if self._db:
            await self._db.close()

    async def get_geometry(
        self, cache_key: str
    ) -> Optional[CourseGeometryResponse]:
        """Retrieve cached geometry, checking memory first then SQLite."""
        # Memory cache
        if cache_key in self._memory:
            logger.debug(f"Memory cache hit: {cache_key}")
            return self._memory[cache_key]

        # SQLite
        if self._db:
            async with self._db.execute(
                "SELECT data, created_at, ttl_days FROM geometry_cache WHERE cache_key = ?",
                (cache_key,),
            ) as cursor:
                row = await cursor.fetchone()
                if row:
                    data_str, created_at, ttl_days = row
                    age_days = (time.time() - created_at) / 86400
                    if age_days < ttl_days:
                        result = CourseGeometryResponse.model_validate_json(data_str)
                        self._memory[cache_key] = result
                        logger.debug(f"SQLite cache hit: {cache_key}")
                        return result
                    else:
                        # Expired, clean up
                        await self._db.execute(
                            "DELETE FROM geometry_cache WHERE cache_key = ?",
                            (cache_key,),
                        )
                        await self._db.commit()

        return None

    async def store_geometry(
        self, cache_key: str, data: CourseGeometryResponse
    ):
        """Store geometry in both memory and SQLite."""
        self._memory[cache_key] = data

        if self._db:
            data_str = data.model_dump_json()
            await self._db.execute(
                """INSERT OR REPLACE INTO geometry_cache
                   (cache_key, data, created_at, ttl_days)
                   VALUES (?, ?, ?, ?)""",
                (cache_key, data_str, time.time(), settings.cache_geometry_ttl_days),
            )
            await self._db.commit()
            logger.info(f"Cached geometry: {cache_key}")

    async def get_handle(self, course_name: str) -> Optional[str]:
        """Retrieve a cached BlueGolf handle for a course name."""
        if not self._db:
            return None

        normalized = course_name.lower().strip()
        async with self._db.execute(
            "SELECT handle, created_at, ttl_days FROM handle_cache WHERE course_name = ?",
            (normalized,),
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                handle, created_at, ttl_days = row
                age_days = (time.time() - created_at) / 86400
                if age_days < ttl_days:
                    return handle

        return None

    async def store_handle(self, course_name: str, handle: str):
        """Cache a course name → handle mapping."""
        if self._db:
            normalized = course_name.lower().strip()
            await self._db.execute(
                """INSERT OR REPLACE INTO handle_cache
                   (course_name, handle, created_at, ttl_days)
                   VALUES (?, ?, ?, ?)""",
                (normalized, handle, time.time(), settings.cache_handle_ttl_days),
            )
            await self._db.commit()
