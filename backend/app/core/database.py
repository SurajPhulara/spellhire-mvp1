"""Database connection and session management"""
from app.models.base import (
    connect_db,
    disconnect_db,
    health_check_db,
    AsyncSessionLocal,
    engine
)
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator

# Re-export for backward compatibility
__all__ = ["connect_db", "disconnect_db", "get_db", "health_check_db"]


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
