# backend/app/services/session_service.py
from __future__ import annotations
"""
Path: backend/app/services/session_service.py

DB-backed session service for refresh-token management.

Responsibilities:
- Create session rows
- Lookup session by token-hash
- Revoke single session or all sessions for a user
- List sessions for UI/audit

Notes:
- Functions do not commit transactions. The caller manages commit/rollback.
- Some helpers create a session and return it; caller must commit if desired.
"""

from typing import Optional, Iterable
from datetime import datetime
import uuid
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models.user import UserSession
import logging

logger = logging.getLogger(__name__)


def hash_token(token: str) -> str:
    """SHA-256 hex digest of a token (used for storing refresh tokens)."""
    return hashlib.sha256(token.encode()).hexdigest()


async def create_user_session(
    db: AsyncSession,
    user_id: uuid.UUID,
    refresh_token_hash: str,
    expires_at: datetime,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> UserSession:
    """
    Create and persist a new user session.

    Returns the UserSession instance (flushed, not necessarily committed).
    Caller should commit the transaction if they opened the session.
    """
    session_row = UserSession(
        user_id=user_id,
        refresh_token_hash=refresh_token_hash,
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=expires_at,
    )
    db.add(session_row)
    await db.flush()  # ensure PK populated
    return session_row


async def get_session_by_hash(db: AsyncSession, refresh_token_hash: str) -> Optional[UserSession]:
    """Find a session by refresh_token_hash."""
    q = select(UserSession).where(UserSession.refresh_token_hash == refresh_token_hash)
    result = await db.execute(q)
    return result.scalar_one_or_none()


async def revoke_session_by_id(db: AsyncSession, session_id: uuid.UUID) -> bool:
    """Mark a session revoked by id (soft revoke)."""
    q = update(UserSession).where(UserSession.id == session_id).values(is_revoked=True)
    await db.execute(q)
    return True


async def revoke_session_by_hash(db: AsyncSession, refresh_token_hash: str) -> bool:
    """Mark a session revoked using the token hash."""
    session = await get_session_by_hash(db, refresh_token_hash)
    if not session:
        return True
    return await revoke_session_by_id(db, session.id)


async def revoke_all_user_sessions(db: AsyncSession, user_id: uuid.UUID) -> bool:
    """Revoke all sessions for a user (logout-all)."""
    q = update(UserSession).where(UserSession.user_id == user_id).values(is_revoked=True)
    await db.execute(q)
    return True


async def delete_session(db: AsyncSession, session_id: uuid.UUID) -> bool:
    """Permanently delete a session row (rarely needed)."""
    q = delete(UserSession).where(UserSession.id == session_id)
    await db.execute(q)
    return True


async def list_user_sessions(db: AsyncSession, user_id: uuid.UUID) -> Iterable[UserSession]:
    """Return active and inactive sessions for UI / audit."""
    q = select(UserSession).where(UserSession.user_id == user_id).order_by(UserSession.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


async def mark_session_last_used(db: AsyncSession, session_id: uuid.UUID) -> None:
    """Update last_used_at timestamp for session."""
    q = update(UserSession).where(UserSession.id == session_id).values(last_used_at=datetime.utcnow())
    await db.execute(q)
