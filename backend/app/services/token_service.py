# Path: backend/app/core/token_service.py
"""
TokenService - DB-backed session storage using UserSession.jti.

Responsibilities:
- create_token_pair(user_id, db=None, user_agent=None, ip_address=None)
    * returns access_token (JWT) + refresh_token (JWT) and session metadata
    * stores session row in user_sessions with jti and expires_at
- refresh_access_token(refresh_token, db=None, user_agent=None, ip_address=None)
    * verifies refresh JWT, checks DB session row (jti), rotates (create new session) and revokes old session
- revoke_token(refresh_token, db=None)
- revoke_all_user_tokens(user_id, db=None)
"""

from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import uuid
import logging

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import SecurityService
from app.core.exceptions import AuthenticationError
from app.models.base import AsyncSessionLocal
from app.models.user import User
from app.models.user import UserSession
from app.models.enums import UserType

logger = logging.getLogger(__name__)


class TokenService:
    """DB-backed token management using JTI stored in user_sessions."""

    @staticmethod
    async def _fetch_user_claims(user_id: str, db: AsyncSession) -> dict:
        stmt = (
            select(User)
            .options(
                selectinload(User.candidate_profile),
                selectinload(User.employer_profile),
                selectinload(User.roles),
            )
            .where(User.id == user_id)
        )

        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise AuthenticationError("User not found")

        if user.status in ("SUSPENDED", "DEACTIVATED"):
            raise AuthenticationError(f"Account is {user.status.lower()}")

        # Base claims
        claims = {
            "email": user.email,
            "email_verified": user.email_verified_at is not None,
            "status": user.status,
        }

        # Determine role
        primary_role = user.roles[0].role if user.roles else None
        claims["user_type"] = primary_role.value if primary_role else None

        # Candidate
        if user.candidate_profile:
            claims.update({
                "first_name": user.candidate_profile.first_name,
                "last_name": user.candidate_profile.last_name,
                "profile_complete": user.candidate_profile.is_profile_complete,
            })

        # Employer
        if user.employer_profile:
            claims.update({
                "first_name": user.employer_profile.first_name,
                "last_name": user.employer_profile.last_name,
                "organization_id": str(user.employer_profile.organization_id),
                "role": user.employer_profile.role,
                "profile_complete": user.employer_profile.is_profile_complete,
            })

        return claims


    @staticmethod
    async def create_token_pair(
        user_id: str,
        user_type: UserType,
        db: Optional[AsyncSession] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create an access token (JWT) and a refresh token (JWT with jti).
        If db is None the method opens its own session and commits the changes.
        Returns: { access_token, refresh_token, token_type, expires_in, session_id, jti }
        """
        manage_session = False
        if db is None:
            async with AsyncSessionLocal() as session:
                result = await TokenService._create_token_pair_internal(user_id, session, user_agent, ip_address, commit=True)
                return result

        return await TokenService._create_token_pair_internal(user_id, db, user_agent, ip_address, commit=False)

    @staticmethod
    async def _create_token_pair_internal(user_id: str, db: AsyncSession, user_agent: Optional[str], ip_address: Optional[str], commit: bool) -> Dict[str, Any]:
        # 1) fetch latest claims for user
        user_claims = await TokenService._fetch_user_claims(user_id, db)

        # 2) base claims - minimal identity
        base_claims = {"sub": user_id}
        claims = {**base_claims, **user_claims}

        # 3) create access token
        access_token = SecurityService.create_access_token(claims)

        # 4) create refresh token (JWT) and jti
        refresh_token, jti = SecurityService.create_refresh_token(claims)

        # 5) persist session row with jti
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        session_row = UserSession(
            user_id=uuid.UUID(user_id),
            jti=jti,
            device=user_agent,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
            revoked_at=None,
            last_used_at=None,
        )
        db.add(session_row)
        # flush to populate PK
        await db.flush()

        if commit:
            await db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "session_id": str(session_row.id),
            "jti": jti,
        }

    @staticmethod
    async def refresh_access_token(
        refresh_token: str,
        db: Optional[AsyncSession] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Rotate refresh token:
         - Verify JWT refresh token
         - Ensure corresponding session row exists, not revoked and not expired
         - Create a new token pair (new jti & session)
         - Revoke old session
        """
        manage_session = False
        if db is None:
            async with AsyncSessionLocal() as session:
                result = await TokenService._refresh_internal(refresh_token, session, user_agent, ip_address, commit=True)
                return result

        return await TokenService._refresh_internal(refresh_token, db, user_agent, ip_address, commit=False)

    @staticmethod
    async def _refresh_internal(refresh_token: str, db: AsyncSession, user_agent: Optional[str], ip_address: Optional[str], commit: bool) -> Dict[str, Any]:
        try:
            payload = SecurityService.verify_refresh_token(refresh_token)
            jti = payload.get("jti")
            user_id = payload.get("sub")
            if not jti or not user_id:
                raise AuthenticationError("Invalid refresh token payload")

            # find session
            q = await db.execute(select(UserSession).where(UserSession.jti == jti))
            session_row = q.scalar_one_or_none()
            if not session_row:
                raise AuthenticationError("Refresh token session not found")

            # checks
            if session_row.revoked_at is not None:
                raise AuthenticationError("Refresh token revoked")
            if session_row.expires_at < datetime.utcnow():
                raise AuthenticationError("Refresh token expired")

            # create new token pair (rotation)
            new_tokens = await TokenService.create_token_pair(user_id=str(session_row.user_id), db=db, user_agent=user_agent, ip_address=ip_address)

            # revoke old session
            await db.execute(
                update(UserSession)
                .where(UserSession.id == session_row.id)
                .values(revoked_at=datetime.utcnow())
            )

            if commit:
                await db.commit()

            return new_tokens

        except AuthenticationError:
            raise
        except Exception as e:
            logger.exception("Error refreshing token")
            raise AuthenticationError("Failed to refresh token")

    @staticmethod
    async def revoke_token(refresh_token: str, db: Optional[AsyncSession] = None) -> bool:
        """
        Revoke a single refresh token by its JWT value (marks session.revoked_at).
        Returns True on success.
        """
        try:
            payload = SecurityService.verify_refresh_token(refresh_token)
            jti = payload.get("jti")
            if not jti:
                return False

            if db is None:
                async with AsyncSessionLocal() as session:
                    await session.execute(update(UserSession).where(UserSession.jti == jti).values(revoked_at=datetime.utcnow()))
                    await session.commit()
                    return True

            await db.execute(update(UserSession).where(UserSession.jti == jti).values(revoked_at=datetime.utcnow()))
            return True
        except AuthenticationError:
            return False
        except Exception as e:
            logger.exception("Error revoking token")
            return False

    @staticmethod
    async def revoke_all_user_tokens(user_id: str, db: Optional[AsyncSession] = None) -> bool:
        """Revoke all sessions for a user (logout all devices)."""
        try:
            user_uuid = uuid.UUID(user_id)
            if db is None:
                async with AsyncSessionLocal() as session:
                    await session.execute(update(UserSession).where(UserSession.user_id == user_uuid).values(revoked_at=datetime.utcnow()))
                    await session.commit()
                    return True

            await db.execute(update(UserSession).where(UserSession.user_id == user_uuid).values(revoked_at=datetime.utcnow()))
            return True
        except Exception as e:
            logger.exception("Error revoking all tokens")
            return False
