# Path: backend/app/services/auth_service.py
"""
AuthService
-----------
Provides high-level authentication & registration logic used by API endpoints.

Design notes (short):
- Keeps DB operations and business rules in one place (service layer).
- Uses SQLAlchemy async sessions (AsyncSession) passed from dependency injection.
- Creates user, role, profile, verification token and (optionally) returns token pair.
- Schedules outgoing email via BackgroundTasks (do not send synchronously).
- Raises domain AppException/ConflictError for predictable HTTP responses.

Assumptions:
- Models: User, UserRole, CandidateProfile, EmployerProfile, Token (see your models).
- Utilities/services: SecurityService (hash/verify), TokenService (creates access+refresh and persists JTI in DB),
  EmailService (send verification email), and AppException / ConflictError / AuthenticationError exist.
- Endpoint will pass BackgroundTasks instance from FastAPI when an async background task is needed.
"""

from datetime import datetime, timedelta, timezone
import secrets
import random
from typing import Optional, Dict, Any

from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import SecurityService
from app.core.config import settings
from app.core.exceptions import AppException, ConflictError, AuthenticationError
from app.models.user import (
    User,
    UserRole,
    CandidateProfile,
    EmployerProfile,
    Token as TokenModel,
    UserSession,
)
from app.models.enums import UserType, UserStatus
from app.services.email_service import EmailService
from app.services.token_service import TokenService
from app.schemas.user import UserSummary


def user_to_summary(user: "User") -> Dict[str, Any]:
    """
    Flatten a SQLAlchemy User model into a dictionary suitable for UserSummary.
    Combines User, CandidateProfile, and EmployerProfile.
    """
    user_type = user.roles[0].role if user.roles else None
    candidate = user.candidate_profile
    employer = user.employer_profile

    data = {
        "id": str(user.id),
        "first_name": candidate.first_name if candidate else (employer.first_name if employer else ""),
        "last_name": candidate.last_name if candidate else (employer.last_name if employer else ""),
        "email": user.email,
        "email_verified": user.email_verified_at is not None,
        "user_type": user_type,
        "status": user.status,
        "profile_picture_url": user.profile_picture_url,
        "organization_name": employer.organization.name if employer and employer.organization else None,
        "is_profile_complete": user.is_profile_complete,
    }

    return data


class AuthService:
    """
    High-level authentication service with register/login/logout helpers.
    """

    @staticmethod
    def _generate_otp(length: int = 6) -> str:
        """Generate a numeric OTP of specified length."""
        return ''.join([str(random.randint(0, 9)) for _ in range(length)])

    @staticmethod
    async def _get_user_by_email(
        db: AsyncSession, 
        email: str, 
        role: Optional[UserType] = None
    ) -> Optional[User]:
        """Fetch user by email, optionally filtered by role."""
        q = select(User).where(User.email == email)
        if role is not None:
            q = q.join(UserRole).where(UserRole.role == role)
        res = await db.execute(q)
        return res.scalars().first()

    @staticmethod
    async def _create_and_send_verification_otp(
        *,
        db: AsyncSession,
        user: User,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> str:
        """
        Create OTP and send verification email.
        Returns the generated OTP.
        
        This is a helper to avoid code duplication between register and resend.
        """
        # 1. Invalidate old OTPs
        q = select(TokenModel).where(
            TokenModel.user_id == user.id,
            TokenModel.type == "email_verification",
            TokenModel.used_at == None
        )
        res = await db.execute(q)
        old_tokens = res.scalars().all()
        for old_token in old_tokens:
            old_token.used_at = datetime.now(timezone.utc)

        # 2. Generate new OTP
        otp = AuthService._generate_otp(6)
        print(otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)  # 10 minutes validity
        
        token_row = TokenModel(
            user_id=user.id,
            token=otp,
            type="email_verification",
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
        )
        db.add(token_row)
        await db.flush()

        # 3. Send OTP via email
        try:
            if background_tasks:
                background_tasks.add_task(
                    EmailService.send_verification_otp,
                    to_email=user.email,
                    otp=otp,
                    expires_at=expires_at,
                    user_id=str(user.id),
                )
            else:
                EmailService.send_verification_otp(
                    to_email=user.email,
                    otp=otp,
                    expires_at=expires_at,
                    user_id=str(user.id),
                )
        except Exception as e:
            # Log error but don't fail the operation
            # logger.error(f"Failed to send verification OTP: {e}")
            pass

        return otp

    @staticmethod
    async def register_user(
        *,
        db: AsyncSession,
        email: str,
        password: Optional[str],
        user_type: UserType,
        background_tasks: Optional[BackgroundTasks] = None,
        send_verification: bool = True,
        create_tokens: bool = True,
        provider: str = "EMAIL",
        organization_id: Optional[str] = None,  # For employer registration
    ) -> Dict[str, Any]:
        """
        Register a new user with OTP-based email verification.

        Steps:
        1. Validate email uniqueness
        2. Hash password (if EMAIL provider)
        3. Create user record
        4. Assign role
        5. Create profile (candidate or employer)
        6. Generate and send OTP
        7. Optionally create token pair for immediate login

        Args:
            db: Database session
            email: User email
            password: User password (required for EMAIL provider)
            user_type: CANDIDATE or EMPLOYER
            background_tasks: FastAPI background tasks for async email
            send_verification: Whether to send verification email
            create_tokens: Whether to return access/refresh tokens
            provider: AUTH method (EMAIL or GOOGLE)
            organization_id: Required for EMPLOYER registration

        Returns:
            dict: {"user": UserSummary, "tokens": {...} | None}

        Raises:
            ConflictError: Email already registered
            AppException: Invalid parameters or registration failure
        """
        # 1. Check for existing user
        existing = await AuthService._get_user_by_email(db, email)
        if existing:
            raise ConflictError(f"Email {email} is already registered")

        # 2. Hash password (if using email provider)
        password_hash = None
        if provider.upper() == "EMAIL":
            if not password:
                raise AppException("Password is required for email registration", status_code=400)
            password_hash = SecurityService.hash_password(password)

        # 3. Create user
        user = User(
            email=email,
            password_hash=password_hash,
            provider=provider,
            provider_id=None,
            status=UserStatus.PENDING_VERIFICATION,
            is_profile_complete=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.flush()  # Get user.id

        # 4. Assign role
        role_row = UserRole(user_id=user.id, role=user_type)
        db.add(role_row)

        # 5. Create profile based on user type
        if user_type == UserType.CANDIDATE:
            profile = CandidateProfile(user_id=user.id)
            db.add(profile)
        elif user_type == UserType.EMPLOYER:
            if not organization_id:
                # For MVP: allow None, but in production you might require it
                # raise AppException("Organization ID is required for employer registration", status_code=400)
                pass
            profile = EmployerProfile(
                user_id=user.id, 
                organization_id=organization_id
            )
            db.add(profile)
        else:
            raise AppException("Unsupported user type", status_code=400)

        await db.flush()

        # 6. Generate and send OTP (using helper to avoid duplication)
        if send_verification:
            await AuthService._create_and_send_verification_otp(
                db=db,
                user=user,
                background_tasks=background_tasks,
            )

        # 7. Optionally create token pair
        tokens = None
        if create_tokens:
            tokens = await TokenService.create_token_pair(
                user_id=str(user.id),
                user_type=user_type,
                db=db,
            )

        return {
            "user": UserSummary.from_orm(user_to_summary(user)),
            "tokens": tokens
        }

    @staticmethod
    async def login_user(
        *,
        db: AsyncSession,
        email: str,
        password: str,
        user_type: UserType,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> Dict[str, Any]:
        """
        Authenticate user by email + password for a specific user type.

        Why user_type is required:
        - Single email can have multiple roles (CANDIDATE, EMPLOYER)
        - Prevents privilege confusion
        - Explicit login intent

        Args:
            db: Database session
            email: User email
            password: User password
            user_type: Role to authenticate as
            user_agent: Browser/device user agent
            ip_address: Client IP address

        Returns:
            dict: {"user": UserSummary, "tokens": {...}}

        Raises:
            AuthenticationError: Invalid credentials, suspended account, etc.
        """
        # 1. Fetch user by email and role
        user = await AuthService._get_user_by_email(db, email, user_type)
        if not user:
            raise AuthenticationError("Invalid credentials")

        # 2. Reject OAuth-only users attempting password login
        if not user.password_hash:
            raise AuthenticationError("This account uses social login. Please use the appropriate login method.")

        # 3. Verify password
        if not SecurityService.verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid credentials")

        # 4. Check account status
        if user.status == UserStatus.SUSPENDED:
            raise AuthenticationError("Your account has been suspended. Please contact support.")
        
        if user.status == UserStatus.DEACTIVATED:
            raise AuthenticationError("Your account has been deactivated.")

        # 5. Update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        await db.flush()

        # 6. Create token pair with session tracking
        tokens = await TokenService.create_token_pair(
            user_id=str(user.id),
            user_type=user_type,
            db=db,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        # 6. Check if already verified
        if not user.email_verified_at:
            # 6.5. Create and send new OTP (using helper)
            await AuthService._create_and_send_verification_otp(
                db=db,
                user=user,
                background_tasks=background_tasks,
            )

        return {
            "user": UserSummary.from_orm(user_to_summary(user)),
            "tokens": tokens,
        }

    @staticmethod
    async def logout_user(
        *,
        db: AsyncSession,
        refresh_token: Optional[str] = None,
        user_id: Optional[str] = None,
        logout_all: bool = False,
    ) -> Dict[str, Any]:
        """
        Logout user by revoking session(s).

        Three logout modes:
        1. Single session: Provide refresh_token
        2. All sessions: Provide user_id and logout_all=True
        3. Current session: Provide refresh_token (extracted from JWT)

        Args:
            db: Database session
            refresh_token: JWT refresh token to revoke
            user_id: User ID (for logout all)
            logout_all: If True, revoke all user sessions

        Returns:
            dict: {"message": "..."}

        Raises:
            AppException: Invalid parameters
        """
        if logout_all and user_id:
            # Revoke all sessions for user
            success = await TokenService.revoke_all_user_tokens(
                user_id=user_id,
                db=db
            )
            if success:
                return {"message": "Logged out from all devices successfully"}
            raise AppException("Failed to logout from all devices", status_code=500)

        if refresh_token:
            # Revoke single session
            success = await TokenService.revoke_token(
                refresh_token=refresh_token,
                db=db
            )
            if success:
                return {"message": "Logged out successfully"}
            raise AuthenticationError("Invalid or expired refresh token")

        raise AppException("Either refresh_token or (user_id + logout_all) must be provided", status_code=400)

    @staticmethod
    async def verify_email_with_otp(
        *,
        db: AsyncSession,
        user_id: str,
        otp: str,
    ) -> Dict[str, Any]:
        """
        Verify user's email using 6-digit OTP.

        Security measures:
        - Requires both email and OTP (prevents brute-force across all users)
        - Rate limiting should be applied at endpoint level
        - OTP expires after 10 minutes

        Args:
            db: Database session
            email: User email
            otp: 6-digit verification code

        Returns:
            dict: {"message": "...", "user": UserSummary}

        Raises:
            AppException: Invalid OTP, expired OTP, or user not found
        """
        # 1. Find user
        q = select(User).where(User.id == user_id)
        res = await db.execute(q)
        user = res.scalars().first()

        if not user:
            raise AppException("Invalid verification code", status_code=400)

        # 2. Check if already verified
        if user.email_verified_at:
            raise AppException("Email is already verified", status_code=400)

        # 3. Find matching OTP
        q = select(TokenModel).where(
            TokenModel.user_id == user.id,
            TokenModel.token == otp,
            TokenModel.type == "email_verification",
            TokenModel.used_at == None
        )
        res = await db.execute(q)
        token_row = res.scalars().first()

        if not token_row:
            raise AppException("Invalid verification code", status_code=400)

        # 4. Check expiry
        if token_row.expires_at < datetime.now(timezone.utc):
            # Calculate difference
            time_diff = datetime.now(timezone.utc) - token_row.expires_at

            # Optional debug / logging
            print(
                f"[VERIFY EMAIL]"
                f"delta_minutes={time_diff.total_seconds()/60}"
            )

            raise AppException("Verification code has expired. Please request a new one.", status_code=400)

        # 5. Mark user as verified
        user.email_verified_at = datetime.now(timezone.utc)
        user.status = UserStatus.ACTIVE
        user.updated_at = datetime.now(timezone.utc)

        # 6. Mark OTP as used
        token_row.used_at = datetime.now(timezone.utc)

        await db.flush()

        return {
            "message": "Email verified successfully",
            # "user": UserSummary.from_orm(user_to_summary(user))
        }

    @staticmethod
    async def resend_verification_otp(
        *,
        db: AsyncSession,
        user_id: str,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> Dict[str, Any]:
        """
        Resend OTP for email verification.

        Rate limiting (apply at endpoint level):
        - Max 3 requests per 10 minutes per email
        - Prevents OTP flooding attacks

        Args:
            db: Database session
            email: User email
            background_tasks: FastAPI background tasks

        Returns:
            dict: {"message": "Verification code sent successfully"}

        Raises:
            AppException: User not found or already verified
        """
        # 1. Find user
        q = select(User).where(User.id == user_id)
        res = await db.execute(q)
        user = res.scalars().first()

        if not user:
            raise AppException("User not found", status_code=404)

        # 2. Check if already verified
        if user.email_verified_at:
            raise AppException("Email is already verified", status_code=400)

        # 3. Create and send new OTP (using helper)
        await AuthService._create_and_send_verification_otp(
            db=db,
            user=user,
            background_tasks=background_tasks,
        )

        return {"message": "Verification code sent successfully"}

    @staticmethod
    async def forgot_password(
        *,
        db: AsyncSession,
        email: str,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> Dict[str, Any]:
        """
        Initiate password reset with URL token.

        Why URL token for password reset (not OTP):
        - One-click experience (better UX for sensitive operation)
        - More secure (longer token, harder to brute-force)
        - Can embed in secure HTTPS URL
        - Token is 32 bytes (256 bits) vs 6-digit OTP (~20 bits)

        Security note:
        - Always returns success message (prevents email enumeration)
        - Even if user doesn't exist, response is identical

        Args:
            db: Database session
            email: User email
            background_tasks: FastAPI background tasks

        Returns:
            dict: {"message": "If an account exists..."}
        """
        # 1. Find user
        q = select(User).where(User.email == email)
        res = await db.execute(q)
        user = res.scalars().first()

        # Always return success (prevent email enumeration)
        success_message = "If an account exists with this email, a password reset link will be sent"

        if not user:
            return {"message": success_message}

        # Don't send reset email to OAuth users
        if not user.password_hash:
            return {"message": success_message}

        # 2. Invalidate old reset tokens
        q = select(TokenModel).where(
            TokenModel.user_id == user.id,
            TokenModel.type == "password_reset",
            TokenModel.used_at == None
        )
        res = await db.execute(q)
        old_tokens = res.scalars().all()
        for old_token in old_tokens:
            old_token.used_at = datetime.now(timezone.utc)

        # 3. Create new reset token (URL-safe, 32 bytes = 256 bits)
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour validity
        
        token_row = TokenModel(
            user_id=user.id,
            token=reset_token,
            type="password_reset",
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
        )
        db.add(token_row)
        await db.flush()

        # 4. Send reset link
        try:
            if background_tasks:
                background_tasks.add_task(
                    EmailService.send_password_reset_email,
                    to_email=user.email,
                    token=reset_token,
                    expires_at=expires_at,
                    user_id=str(user.id),
                )
            else:
                EmailService.send_password_reset_email(
                    to_email=user.email,
                    token=reset_token,
                    expires_at=expires_at,
                    user_id=str(user.id),
                )
        except Exception as e:
            # Log error but don't fail
            # logger.error(f"Failed to send password reset email: {e}")
            pass

        return {"message": success_message}

    @staticmethod
    async def reset_password(
        *,
        db: AsyncSession,
        token: str,
        new_password: str,
    ) -> Dict[str, Any]:
        """
        Reset password using URL token.

        Security measures:
        - Token is single-use (marked as used)
        - Token expires after 1 hour
        - All sessions are revoked (user must re-login)
        - Password is hashed with bcrypt

        Args:
            db: Database session
            token: Reset token from email link
            new_password: New password to set

        Returns:
            dict: {"message": "Password reset successfully"}

        Raises:
            AppException: Invalid/expired/used token
        """
        # 1. Find token
        q = select(TokenModel).where(
            TokenModel.token == token,
            TokenModel.type == "password_reset"
        )
        res = await db.execute(q)
        token_row = res.scalars().first()

        if not token_row:
            raise AppException("Invalid reset token", status_code=400)

        # 2. Check expiry
        if token_row.expires_at < datetime.now(timezone.utc):
            raise AppException("Reset token has expired. Please request a new one.", status_code=400)

        # 3. Check if already used
        if token_row.used_at:
            raise AppException("Reset token has already been used", status_code=400)

        # 4. Get user
        q = select(User).where(User.id == token_row.user_id)
        res = await db.execute(q)
        user = res.scalars().first()

        if not user:
            raise AppException("User not found", status_code=404)

        # 5. Update password
        user.password_hash = SecurityService.hash_password(new_password)
        user.updated_at = datetime.now(timezone.utc)

        # 6. Mark token as used
        token_row.used_at = datetime.now(timezone.utc)

        # 7. Revoke all sessions (force re-login on all devices)
        await TokenService.revoke_all_user_tokens(
            user_id=str(user.id),
            db=db
        )

        await db.flush()

        return {"message": "Password reset successfully. Please log in with your new password."}

    @staticmethod
    async def refresh_access_token(
        *,
        db: AsyncSession,
        refresh_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate new access token using refresh token.

        Token rotation (security best practice):
        - Validates old refresh token
        - Creates new token pair (new JTI)
        - Revokes old session
        - Updates session metadata

        Args:
            db: Database session
            refresh_token: JWT refresh token
            user_agent: Browser/device user agent
            ip_address: Client IP address

        Returns:
            dict: {"access_token": "...", "refresh_token": "...", ...}

        Raises:
            AuthenticationError: Invalid/revoked/expired token
        """
        return await TokenService.refresh_access_token(
            refresh_token=refresh_token,
            db=db,
            user_agent=user_agent,
            ip_address=ip_address,
        )