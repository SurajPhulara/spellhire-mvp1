"""
Path: backend/app/api/v1/endpoints/auth.py

Auth endpoints for v1:
- register (candidate/employer)
- login (candidate/employer)
- google oauth (candidate/employer)
- logout
- refresh (exchange refresh cookie for new access token)
- forgot / reset password
- verify / resend verification
- sessions: list + revoke
- logout-all

This file is intentionally thin: it delegates business logic to service layer
(e.g. app.services.auth_service or app.services.session_service). It handles
HTTP concerns: request validation, cookies for refresh token, background tasks,
and mapping service results to API responses.

Responses use the success_response / error_response helpers from app.core.responses
so the frontend gets a consistent API shape.

Note: adjust imports if your concrete service names/paths differ.
"""
from typing import Optional
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.responses import success_response, error_response
from app.core.exceptions import AppException
from app.services.auth_service import AuthService  # server-side business logic (implementation expected in services/)
from app.services.session_service import (
    create_user_session,
    list_user_sessions,
    revoke_session_by_id,
    revoke_all_user_sessions,
)
from app.schemas.auth import AuthRequest, VerifyEmailRequest
from app.schemas.user import UserSummary
from app.core.security import get_current_user
from app.core.rate_limit import limiter  # dependency that returns token payload / user claims

logger = logging.getLogger(__name__)

router = APIRouter()


# ------------------------
# Helpers
# ------------------------
def _set_refresh_cookie(resp: Response, refresh_token: str, max_age_seconds: int):
    """
    Set refresh token as HttpOnly, Secure cookie. Use settings for domain, secure, sameSite.
    The refresh token is stored in cookie to avoid exposing to JS.
    """
    secure_flag = not settings.DEBUG  # secure in production
    resp.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure_flag,
        samesite="lax",
        max_age=max_age_seconds,
        path="/api/v1/auth/",  # limit cookie to refresh endpoint (optional)
    )


# ------------------------
# Endpoints
# ------------------------

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: AuthRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user (candidate or employer).
    - Validates input via pydantic AuthRequest
    - Delegates user creation to AuthService.register_user
    - Optionally schedule verification email via BackgroundTasks (service handles this)
    - Returns created user summary and token pair in `data`
    """
    try:
        # AuthService.register should create user, persist and return {"user": User, "tokens": {...}}
        result = await AuthService.register_user(db=db, email=payload.email, password=payload.password, user_type=payload.user_type, background_tasks=background_tasks)

        user = result["user"]
        tokens = result["tokens"]

        # 🔐 CRITICAL: commit before issuing tokens
        await db.commit()
        # await db.refresh(user)

        # Set refresh token cookie if present
        refresh_token = tokens.get("refresh_token")
        if refresh_token:
            _set_refresh_cookie(response, refresh_token, tokens.get("expires_in", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60))
            tokens.pop("refresh_token")


        return success_response(
            message="Account created",
            data={"user": user, "tokens": tokens},
            status_code=status.HTTP_201_CREATED,
            response=response,
        )
    except AppException as e:
        # AppException will be handled by the global handler too, but return explicit here for clarity
        logger.warning("Register failed: %s", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(
    payload: AuthRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Login with email + password.
    - On success returns user summary and tokens in `data`.
    - Sets refresh token in HttpOnly cookie (if tokens include refresh_token).
    """
    try:
        result = await AuthService.login_user(db=db, email=payload.email, password=payload.password, user_type=payload.user_type, background_tasks=background_tasks)
        user = result["user"]
        tokens = result["tokens"]

        # 🔐 commit before setting cookie
        await db.commit()
        # await db.refresh(user)

        # Set refresh token cookie if present
        refresh_token = tokens.get("refresh_token")
        if refresh_token:
            _set_refresh_cookie(response, refresh_token, tokens.get("expires_in", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60))
            tokens.pop("refresh_token")

        return success_response(
            message="Logged in",
            # data={"user": UserSummary.model_validate(user), "tokens": {k: v for k, v in tokens.items() if k != "refresh_token"}},
            data={"user": user, "tokens": tokens},
            response=response,
        )
    except AppException as e:
        logger.info("Login failed for %s: %s", payload.email, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


# @limiter.limit("10/minute")
@router.post("/google", status_code=status.HTTP_200_OK)
async def google_auth(
    token: str,
    user_type: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Sign in / sign up via Google token.
    Expects `token` (google id token) and `user_type` ("CANDIDATE"|"EMPLOYER").
    """
    try:
        result = await AuthService.google_auth(db=db, google_token=token, user_type=user_type)
        user = result["user"]
        tokens = result["tokens"]

        refresh_token = tokens.get("refresh_token")
        if refresh_token:
            _set_refresh_cookie(response, refresh_token, tokens.get("expires_in", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60))

        return success_response(message="Logged in (google)", data={"user": UserSummary.model_validate(user), "tokens": {k: v for k, v in tokens.items() if k != "refresh_token"}})
    except AppException as e:
        logger.info("Google auth failed: %s", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


@router.get("/me", status_code=status.HTTP_200_OK)
async def me(request: Request, response: Response, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Get current user information.
    Note: the frontend should call this endpoint while sending the Authorization header.
    """
    try:
        user_id = current_user["sub"]
        user_type = current_user["user_type"]
        email = current_user["email"]
        # Revoke current session if AuthService can handle it (e.g. reads jti from access token)
        result = await AuthService.refetch_user(db=db, user_id=user_id, email=email, user_type=user_type)

    except AppException as e:
        logger.info("fetching user data failed ", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)

    return success_response(message="ok", data={"user" : result["user"]}, response=response,)




@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Logout current user: revoke current session (if any) & clear cookie.
    Note: the frontend should call this endpoint while sending the Authorization header.
    """
    try:
        # Revoke current session if AuthService can handle it (e.g. reads jti from access token)
        await AuthService.logout_user(db=db, user_id=current_user["sub"], refresh_token=request.cookies.get("refresh_token"))
        await db.commit()
    finally:
        # Always clear refresh cookie client-side
        response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
    return success_response(message="Logged out", data={})


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(request: Request, response: Response, refresh_token: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """
    Exchange refresh token (from cookie or body) for a new access token.
    - By default the client should rely on HttpOnly cookie; we accept explicit token param for testing.
    - Sets a new refresh cookie and returns new access_token in response.data.tokens.access_token
    """
    try:
        # If refresh_token not provided, AuthService should read cookie from request (implementation detail)
        result = await AuthService.refresh_access_token(db=db, refresh_token=refresh_token)
        tokens = result["tokens"]

        # Set new refresh cookie
        refresh_token_value = tokens.get("refresh_token")
        if refresh_token_value:
            _set_refresh_cookie(response, refresh_token_value, tokens.get("expires_in", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60))
            tokens.pop("refresh_token")

        # Return tokens but not the refresh token in JSON body
        # masked_tokens = {k: v for k, v in tokens.items() if k != "refresh_token"}
        return success_response(message="Token refreshed", data={"tokens": tokens}, response=response)
    except AppException as e:
        logger.info("Refresh failed: %s", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """
    Trigger password reset email. Body expected: {"email": "...", "user_type": "CANDIDATE"|"EMPLOYER"}
    """
    try:
        await AuthService.forgot_password(db=db, email=request.get("email"), user_type=request.get("user_type"), background_tasks=background_tasks)
        return success_response(message="Password reset email sent", data={})
    except AppException as e:
        logger.info("Forgot password failed: %s", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Reset password endpoint.
    Body expected: {"email": "...", "user_type": "...", "otp": "...", "new_password": "..."}
    """
    try:
        await AuthService.reset_password(db=db, email=request.get("email"), user_type=request.get("user_type"), otp=request.get("otp"), new_password=request.get("new_password"))
        return success_response(message="Password reset", data={})
    except AppException as e:
        logger.info("Reset password failed: %s", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(request: VerifyEmailRequest, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Verify email with OTP/token. Body: {"otp": "..."}
    """
    try:
        user_id = current_user["sub"]
        user_type = current_user["user_type"]
        email = current_user["email"]

        await AuthService.verify_email_with_otp(db=db, user_id=user_id, otp=request.otp)
        return success_response(message="Email verified", data={})
    except AppException as e:
        logger.info("Verify email failed: %s", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
@limiter.limit("1/2minute")
async def resend_verification(request: Request, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Resend verification email
    """
    try:
        user_id = current_user["sub"]
        await AuthService.resend_verification_otp(db=db, user_id=user_id, background_tasks=background_tasks)
        return success_response(message="Verification email resent", data={})
    except AppException as e:
        logger.info("Resend verification failed: %s", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


# ------------------------
# Session management (UI / audit)
# ------------------------
# @limiter.limit("10/minute")
@router.get("/sessions", status_code=status.HTTP_200_OK)
async def get_sessions(request: Request, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    List sessions for current user (for "Manage sessions" UI).
    Delegates to session_service.list_user_sessions (which returns DB rows).
    """
    try:
        user_id = current_user.get("sub")
        sessions = await list_user_sessions(db, user_id)
        # Convert ORM rows to serializable dicts if necessary (caller / schema should handle)
        return success_response(message="OK", data={"sessions": [s.__dict__ for s in sessions]})
    except AppException as e:
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


# @limiter.limit("10/minute")
@router.post("/sessions/{session_id}/revoke", status_code=status.HTTP_200_OK)
async def revoke_session(request: Request, session_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Revoke a single session by id (soft revoke).
    """
    try:
        # Verify session belongs to current user inside service
        await revoke_session_by_id(db, session_id)
        return success_response(message="Session revoked", data={})
    except AppException as e:
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)


# @limiter.limit("10/minute")
@router.post("/logout-all", status_code=status.HTTP_200_OK)
async def logout_all(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user), response: Response = None):
    """
    Revoke all sessions for user (logout everywhere).
    """
    try:
        user_id = current_user.get("sub")
        await revoke_all_user_sessions(db, user_id)
        # Clear refresh cookie
        if response:
            response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
        return success_response(message="Logged out from all devices", data={})
    except AppException as e:
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
