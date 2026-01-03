# Path: backend/app/core/security.py
"""
Security utilities for password hashing and JWT access/refresh tokens.

Design:
- Access tokens: short-lived JWT (type="access")
- Refresh tokens: JWT with a long expiry and `jti` claim (type="refresh"). The JTI is stored
  in the DB (user_sessions.jti). On refresh we rotate: new JTI/session + revoke old one.

This file exposes:
- SecurityService: password hashing + access/refresh token creation/verification
- get_current_user dependency: verifies access token, returns payload
- helper dependency factories: require_user_type, require_verified_email, require_complete_profile, require_employer_permission
"""

from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional, Iterable, Callable

import uuid
import logging

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AuthenticationError

# Import your models & session factory (adjust path if different)
from app.models.base import AsyncSessionLocal
from app.models.user import User  # unified user model (if present)
from app.models.user import UserSession  # user_sessions table

logger = logging.getLogger(__name__)

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

# FastAPI HTTP bearer security for access tokens
security = HTTPBearer()


class SecurityService:
    """
    Helpers for password hashing and JWT tokens.
    - create_access_token: short-lived JWT (type="access")
    - create_refresh_token: long-lived JWT (type="refresh") containing `jti`
    - verify_access_token / verify_refresh_token: validate and return payload
    """

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt (passlib)."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        """Verify plaintext password against bcrypt hash."""
        return pwd_context.verify(plain, hashed)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a signed JWT access token.
        - data: claims to include (will be copied)
        - expires_delta: optional custom expiry; otherwise uses settings.ACCESS_TOKEN_EXPIRE_MINUTES
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta if expires_delta is not None else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire, "type": "access"})
        token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return token

    @staticmethod
    def create_refresh_token(claims: dict, expires_delta: Optional[timedelta] = None) -> tuple[str, str]:
        """
        Create a signed JWT refresh token that includes a jti (UUID).
        Returns (refresh_token_jwt, jti).
        `claims` should contain at least 'sub' (user_id) and optional metadata.
        """
        jti = str(uuid.uuid4())
        to_encode = claims.copy()
        expire = datetime.utcnow() + (expires_delta if expires_delta is not None else timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
        to_encode.update({"exp": expire, "type": "refresh", "jti": jti})
        token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return token, jti

    @staticmethod
    def verify_access_token(token: str) -> dict:
        """Decode and validate an access token; raises AuthenticationError on failure."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "access":
                raise AuthenticationError("Invalid token type")
            return payload
        except JWTError as e:
            logger.debug("Access token verification failed: %s", e)
            raise AuthenticationError("Invalid access token")

    @staticmethod
    def verify_refresh_token(token: str) -> dict:
        """Decode and validate a refresh token; raises AuthenticationError on failure."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "refresh":
                raise AuthenticationError("Invalid token type")
            return payload
        except JWTError as e:
            logger.debug("Refresh token verification failed: %s", e)
            raise AuthenticationError("Invalid refresh token")


# ------------------------
# Request Dependencies
# ------------------------
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    FastAPI dependency to get user payload from access token.
    Raises AuthenticationError if token invalid.
    """
    try:
        token = credentials.credentials
        payload = SecurityService.verify_access_token(token)
        sub = payload.get("sub")
        if not sub:
            raise AuthenticationError("Invalid token payload")
        return payload
    except AuthenticationError:
        raise
    except Exception as e:
        logger.exception("Unexpected token validation error")
        raise AuthenticationError("Invalid authentication credentials")


def require_user_type(*allowed_types: str) -> Callable:
    """
    Factory that returns a dependency function which asserts current_user.user_type is in allowed_types.
    Example usage:
        @router.get("/secure")
        async def secure_endpoint(current_user = Depends(require_user_type("EMPLOYER"))):
            ...
    """
    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        user_type = current_user.get("user_type")
        if user_type not in allowed_types:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return current_user
    return dependency


# Convenience specific dependencies
require_candidate = require_user_type("CANDIDATE")
require_employer = require_user_type("EMPLOYER")


def require_complete_profile(current_user: dict = Depends(get_current_user)) -> dict:
    """Require that `profile_complete` claim is true on the payload."""
    if not current_user.get("profile_complete", False):
        raise HTTPException(status_code=status.HTTP_412_PRECONDITION_FAILED, detail="Profile completion required")
    return current_user


def require_verified_email(current_user: dict = Depends(get_current_user)) -> dict:
    """Require that `email_verified` claim is true on the payload."""
    if not current_user.get("email_verified", False):
        raise HTTPException(status_code=status.HTTP_412_PRECONDITION_FAILED, detail="Email verification required")
    return current_user


def require_employer_permission(*required_permissions: str):
    """Factory dependency to require a permission inside current_user['permissions']"""
    def dependency(current_user: dict = Depends(require_employer)) -> dict:
        perms = current_user.get("permissions", [])
        if not any(p in perms for p in required_permissions):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return current_user
    return dependency


require_admin = require_employer_permission("ADMIN")
require_hr = require_employer_permission("HR", "ADMIN")
require_recruiter = require_employer_permission("RECRUITER", "ADMIN")
