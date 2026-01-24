# Path: backend/app/services/candidate_service.py
"""
CandidateService

Contains business logic around candidate profiles. Designed to be called
from API endpoints. Does not commit transactions — caller (endpoint) should
manage commit/rollback to keep transaction boundaries consistent.

Common usage:
    profile = await CandidateService.get_profile(db, user_id)
    profile = await CandidateService.create_profile(db, user_id, payload)
    profile = await CandidateService.update_profile(db, user_id, payload)

Design principles:
- Keep methods small and single-purpose.
- Return SQLAlchemy model instances (caller can convert to Pydantic schema).
- Raise AppException / NotFoundError / ConflictError for predictable handling.
"""
from __future__ import annotations
from typing import Optional, List, Dict, Any, Iterable
from datetime import datetime

from sqlalchemy import select, update, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundError, ConflictError
from app.models.user import CandidateProfile, User  # assumes models exist at this path
import logging

logger = logging.getLogger(__name__)

# Build profile row; only set known keys to avoid unexpected columns
allowed = {
            "first_name", "last_name", "phone", "date_of_birth", "gender",
            "address", "professional_summary", "total_experience",
            "current_salary", "expected_salary", "preferred_job_type",
            "preferred_work_mode", "preferred_locations", "notice_period",
            "skills", "experience", "education", "languages", "certifications",
            "portfolio_url", "linkedin_url", "github_url", "resume_url",
            "is_active", "is_available_for_work"
        }

class CandidateService:
    @staticmethod
    async def get_profile(db: AsyncSession, user_id: str) -> CandidateProfile:
        """
        Fetch candidate profile for a given user_id.
        Raises NotFoundError if missing.
        """
        q = select(CandidateProfile).where(CandidateProfile.user_id == user_id)
        result = await db.execute(q)
        profile = result.scalars().first()
        if not profile:
            raise NotFoundError("Candidate profile not found")
        return profile

    @staticmethod
    async def get_profile_optional(db: AsyncSession, user_id: str) -> Optional[CandidateProfile]:
        """
        Fetch candidate profile if exists, otherwise return None.
        """
        q = select(CandidateProfile).where(CandidateProfile.user_id == user_id)
        result = await db.execute(q)
        return result.scalars().first()

    @staticmethod
    async def create_profile(db: AsyncSession, user_id: str, payload: Dict[str, Any]) -> CandidateProfile:
        """
        Create a candidate profile for a given user.
        - If profile already exists -> raise ConflictError.
        - `payload` is plain dict with candidate fields (first_name, last_name, skills, etc).
        Note: caller must commit the transaction.
        """
        existing = await CandidateService.get_profile_optional(db, user_id)
        if existing:
            raise ConflictError("Candidate profile already exists")

        # ensure user exists
        q = select(User).where(User.id == user_id)
        res = await db.execute(q)
        user = res.scalars().first()
        if not user:
            raise NotFoundError("User not found")

        profile_kwargs = {k: v for k, v in payload.items() if k in allowed}

        profile = CandidateProfile(user_id=user_id, **profile_kwargs)
        db.add(profile)
        await db.flush()  # ensure id and defaults are populated
        return profile

    @staticmethod
    async def update_profile(db: AsyncSession, user_id: str, payload: Dict[str, Any]) -> CandidateProfile:
        """
        Update an existing candidate profile.
        - If profile does not exist -> raise NotFoundError.
        - Only updates allowed fields and updates updated_at timestamp.
        Note: caller must commit the transaction.
        """
        
        profile = await CandidateService.get_profile(db, user_id)

        updated = False
        for k, v in payload.items():
            if k in allowed:
                setattr(profile, k, v)
                updated = True

        if updated:
            profile.updated_at = datetime.utcnow()
            profile.is_profile_complete = True
            await db.flush()

        return profile

    @staticmethod
    async def set_resume_url(db: AsyncSession, user_id: str, resume_url: str) -> CandidateProfile:
        """
        Store a resume URL (uploaded to S3/Cloudinary) on candidate profile.
        Creates profile if missing.
        """
        profile = await CandidateService.get_profile_optional(db, user_id)
        if not profile:
            # create minimal profile
            profile = CandidateProfile(user_id=user_id, resume_url=resume_url)
            db.add(profile)
            await db.flush()
            return profile

        profile.resume_url = resume_url
        profile.updated_at = datetime.utcnow()
        await db.flush()
        return profile

    @staticmethod
    async def search_candidates(
        db: AsyncSession,
        q: Optional[str] = None,
        skills: Optional[List[str]] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[CandidateProfile]:
        """
        Basic search over candidate profiles:
          - if `q` provided, matches first_name or last_name or professional_summary (ILIKE)
          - if `skills` provided, attempts to match any skill (simple JSON/text search)
        This is intentionally simple for MVP. For production use, use Postgres full-text search
        or an external search engine (Elasticsearch/Opensearch).
        """
        stmt = select(CandidateProfile)

        filters = []
        if q:
            ilike_q = f"%{q}%"
            filters.append(
                or_(
                    CandidateProfile.first_name.ilike(ilike_q),
                    CandidateProfile.last_name.ilike(ilike_q),
                    CandidateProfile.professional_summary.ilike(ilike_q),
                )
            )

        if skills:
            # naive skills search:
            for s in skills:
                filters.append(func.coalesce(CandidateProfile.skills.cast(String), "").ilike(f"%{s}%"))

        if filters:
            stmt = stmt.where(*filters)

        stmt = stmt.order_by(CandidateProfile.created_at.desc()).limit(limit).offset(offset)
        res = await db.execute(stmt)
        return res.scalars().all()
