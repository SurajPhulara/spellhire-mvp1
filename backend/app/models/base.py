# backend/app/models/base.py
# ----------------------
# Base SQLAlchemy async setup for the application.
#
# Responsibilities:
# - Create and configure the async database engine
# - Provide a session factory (AsyncSessionLocal)
# - Define the Declarative Base class for all models
# - Expose helpers for startup/shutdown and health checks
#
# Design principles:
# - One global engine, shared across the app
# - Sessions are request-scoped (handled elsewhere via dependencies)
# - No business logic in this file

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Async Engine
# ---------------------------------------------------------------------
# The engine manages the DB connection pool.
# - Uses asyncpg via SQLAlchemy async dialect
# - Echo SQL statements in DEBUG for easier debugging
# - `future=True` opts into SQLAlchemy 2.0 behavior
engine = create_async_engine(
    settings.database_url_async_computed,
    echo=settings.DEBUG,
    future=True,
)

# ---------------------------------------------------------------------
# Async Session Factory
# ---------------------------------------------------------------------
# This factory creates AsyncSession instances.
#
# Important configuration:
# - expire_on_commit=False:
#   Prevents SQLAlchemy from expiring objects after commit,
#   which is usually what you want in APIs.
#
# Session lifecycle (open/commit/rollback/close) is handled
# in the FastAPI dependency layer, NOT here.
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,   # explicit for clarity (legacy-safe)
    autoflush=False,    # flush manually when needed
)

# ---------------------------------------------------------------------
# Declarative Base
# ---------------------------------------------------------------------
# All ORM models should inherit from this Base class.
# Example:
#   class User(Base):
#       __tablename__ = "users"
class Base(DeclarativeBase):
    pass

# ---------------------------------------------------------------------
# Lifecycle helpers
# ---------------------------------------------------------------------

async def connect_db():
    """
    Called on application startup.

    Purpose:
    - Verify database connectivity
    - Fail fast if credentials or network are misconfigured

    This does NOT open a persistent connection; it simply
    checks that the engine can connect.
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


async def disconnect_db():
    """
    Called on application shutdown.

    Disposes the engine and closes all pooled connections.
    Safe to call even if connections are already closed.
    """
    try:
        await engine.dispose()
        logger.info("Database disconnected successfully")
    except Exception as e:
        logger.error(f"Failed to disconnect from database: {e}")


async def health_check_db() -> bool:
    """
    Lightweight database health check.

    Used by:
    - /health endpoint
    - readiness/liveness probes

    Returns:
    - True if DB is reachable
    - False if connection fails
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
