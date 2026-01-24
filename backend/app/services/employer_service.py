# Path: backend/app/services/employer_service.py
"""
EmployerService

Business logic for employer profiles.

Design notes:
- Methods do NOT commit. Endpoints (or higher-level service) should commit/rollback.
- Keep responsibilities focused: create / read / update / attach organization / set permissions.
- Raise NotFoundError / ConflictError / AppException for predictable error handling.
- Uses AsyncSession passed by caller (dependency injection via get_db).
"""

from __future__ import annotations
from typing import Optional, Dict, Any, Iterable
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ConflictError, AppException
from app.models.user import EmployerProfile, User  # models paths per your repo
from app.models.organization import Organization
import logging
import uuid

logger = logging.getLogger(__name__)


class EmployerService:
    @staticmethod
    async def get_employer_profile(db: AsyncSession, user_id: str) -> EmployerProfile:
        """
        Fetch an employer_profile by user_id.
        Raises NotFoundError if not found.
        """
        q = select(EmployerProfile).where(EmployerProfile.user_id == user_id)
        res = await db.execute(q)
        profile = res.scalars().first()
        if not profile:
            raise NotFoundError("Employer profile not found")
        return profile

    @staticmethod
    async def get_employer_profile_optional(db: AsyncSession, user_id: str) -> Optional[EmployerProfile]:
        """Return employer profile or None if missing."""
        q = select(EmployerProfile).where(EmployerProfile.user_id == user_id)
        res = await db.execute(q)
        return res.scalars().first()

    @staticmethod
    async def create_employer_profile(db: AsyncSession, user_id: str, payload: Dict[str, Any]) -> EmployerProfile:
        """
        Create an employer profile.
        - Ensures a User exists for user_id.
        - If profile exists -> raise ConflictError.
        - If organization_id provided, it must exist.
        Note: caller must commit.
        """
        existing = await EmployerService.get_employer_profile_optional(db, user_id)
        if existing:
            raise ConflictError("Employer profile already exists")

        # ensure user exists
        q = select(User).where(User.id == user_id)
        res = await db.execute(q)
        user = res.scalars().first()
        if not user:
            raise NotFoundError("User not found")

        organization_id = payload.get("organization_id")
        if organization_id:
            q = select(Organization).where(Organization.id == organization_id)
            r = await db.execute(q)
            org = r.scalars().first()
            if not org:
                raise NotFoundError("Organization not found")

        # Only set allowed fields to prevent unexpected kwargs
        allowed = {
            "organization_id", "reporting_manager_id", "first_name", "last_name",
            "phone", "gender", "department", "job_title",
            "employment_type", "role", "hire_date", "work_phone", "work_location",
            "bio", "has_recruiter_permission", "can_interview", "skills",
            "is_active", "is_profile_complete"
        }
        profile_kwargs = {k: v for k, v in payload.items() if k in allowed}

        profile = EmployerProfile(user_id=user_id, **profile_kwargs)
        db.add(profile)
        await db.flush()
        return profile

    @staticmethod
    async def update_employer_profile(db: AsyncSession, user_id: str, payload: Dict[str, Any]) -> EmployerProfile:
        """
        Update existing employer profile.
        Raises NotFoundError if profile missing.
        """
        profile = await EmployerService.get_employer_profile(db, user_id)

        allowed = {
            "organization_id", "reporting_manager_id", "first_name", "last_name",
            "phone", "gender", "department", "profile_picture_url", "job_title",
            "employment_type", "role", "hire_date", "work_phone", "work_location",
            "bio", "has_recruiter_permission", "can_interview", "skills",
            "is_active", "is_profile_complete"
        }

        updated = False
        for k, v in payload.items():
            if k in allowed:
                # if setting organization_id, ensure org exists
                if k == "organization_id" and v is not None:
                    q = select(Organization).where(Organization.id == v)
                    r = await db.execute(q)
                    if not r.scalars().first():
                        raise NotFoundError("Organization not found")
                setattr(profile, k, v)
                updated = True

        if updated:
            profile.updated_at = datetime.utcnow()
            profile.is_profile_complete = True
            await db.flush()

        return profile

    @staticmethod
    async def attach_organization_to_user(db: AsyncSession, user_id: str, organization_id: str) -> EmployerProfile:
        """
        Helper: attach an existing organization to an employer profile.
        Creates employer profile if missing.
        """
        # validate organization
        q = select(Organization).where(Organization.id == organization_id)
        r = await db.execute(q)
        org = r.scalars().first()
        if not org:
            raise NotFoundError("Organization not found")

        profile = await EmployerService.get_employer_profile_optional(db, user_id)
        if not profile:
            # create minimal profile with organization
            profile = EmployerProfile(user_id=user_id, organization_id=organization_id)
            db.add(profile)
            await db.flush()
            return profile

        profile.organization_id = organization_id
        profile.updated_at = datetime.utcnow()
        await db.flush()
        return profile

    @staticmethod
    async def set_employer_permission(db: AsyncSession, user_id: str, permission_flag: str, value: bool) -> EmployerProfile:
        """
        Toggle simple permission flags (e.g., has_recruiter_permission).
        `permission_flag` must be a valid attribute on EmployerProfile.
        """
        profile = await EmployerService.get_employer_profile(db, user_id)
        if not hasattr(profile, permission_flag):
            raise AppException(f"Invalid permission flag: {permission_flag}")
        setattr(profile, permission_flag, value)
        profile.updated_at = datetime.utcnow()
        await db.flush()
        return profile

    @staticmethod
    async def list_employers_for_org(db: AsyncSession, organization_id: str, limit: int = 50, offset: int = 0) -> Iterable[EmployerProfile]:
        """
        Return employer profiles under an organization.
        """
        q = select(EmployerProfile).where(EmployerProfile.organization_id == organization_id).limit(limit).offset(offset)
        res = await db.execute(q)
        return res.scalars().all()
