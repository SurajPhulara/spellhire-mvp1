# Path: backend/app/services/organization_service.py
"""
OrganizationService

Business logic for organizations.

Design notes:
- Methods do NOT commit. Endpoints should manage commit/rollback.
- Provide CRUD-style helpers and search/list helpers for basic UI needs.
- Raise NotFoundError / ConflictError for predictable handling.
"""

from __future__ import annotations
from typing import Optional, List, Dict, Any
from datetime import datetime

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundError, ConflictError
from app.models.organization import Organization
import logging
import uuid
from app.models.user import EmployerProfile


logger = logging.getLogger(__name__)


class OrganizationService:
    @staticmethod
    async def get_organization(db: AsyncSession, organization_id: str) -> Organization:
        """Fetch organization by id. Raise NotFoundError if missing."""
        q = select(Organization).where(Organization.id == organization_id)
        res = await db.execute(q)
        org = res.scalars().first()
        if not org:
            raise NotFoundError("Organization not found")
        return org

    @staticmethod
    async def get_by_contact_email(db: AsyncSession, email: str) -> Optional[Organization]:
        """Return organization by contact_email or None."""
        q = select(Organization).where(Organization.contact_email == email)
        res = await db.execute(q)
        return res.scalars().first()

    @staticmethod
    async def get_organization_for_user(
        db: AsyncSession,
        user_id,
    ) -> Organization:
        """
        Fetch the organization associated with an employer (by user_id).
        """

        stmt = (
            select(Organization)
            .join(EmployerProfile, EmployerProfile.organization_id == Organization.id)
            .where(EmployerProfile.user_id == user_id)
        )

        result = await db.execute(stmt)
        org = result.scalar_one_or_none()

        if not org:
            raise NotFoundError("Organization not found for this user")

        return org

    @staticmethod
    async def create_organization(db: AsyncSession, payload: Dict[str, Any]={}) -> Organization:
        """
        Create a new organization.
        - If contact_email provided and already exists -> ConflictError.
        """
        # contact_email = payload.get("contact_email")
        # if contact_email:
        #     existing = await OrganizationService.get_by_contact_email(db, contact_email)
        #     if existing:
        #         raise ConflictError("Organization with this contact_email already exists")

        allowed = {
            "name", "description", "industry", "company_size", "headquarters_location",
            "website", "contact_email", "phone", "additional_locations", "founded_on",
            "mission", "benefits_overview", "company_culture", "logo_url",
            "is_profile_complete", "is_active"
        }
        org_kwargs = {k: v for k, v in payload.items() if k in allowed}
        org = Organization(**org_kwargs)
        db.add(org)
        await db.flush()
        return org

    @staticmethod
    async def update_organization(db: AsyncSession, organization_id: str, payload: Dict[str, Any]) -> Organization:
        """
        Update organization fields. Raises NotFoundError if missing.
        """
        org = await OrganizationService.get_organization(db, organization_id)

        allowed = {
            "name", "description", "industry", "company_size", "headquarters_location",
            "website", "contact_email", "phone", "additional_locations", "founded_on",
            "mission", "benefits_overview", "company_culture",
            "is_profile_complete", "is_active"
        }
        updated = False
        for k, v in payload.items():
            if k in allowed:
                setattr(org, k, v)
                updated = True

        if updated:
            org.updated_at = datetime.utcnow()
            await db.flush()

        return org

    @staticmethod
    async def list_organizations(db: AsyncSession, query: Optional[str] = None, limit: int = 20, offset: int = 0) -> List[Organization]:
        """
        Simple listing/search for organizations.
        - If query provided, searches name and industry (ILIKE).
        """
        stmt = select(Organization)
        if query:
            ilike_q = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Organization.name.ilike(ilike_q),
                    Organization.industry.ilike(ilike_q),
                )
            )
        stmt = stmt.order_by(Organization.created_at.desc()).limit(limit).offset(offset)
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def delete_organization(db: AsyncSession, organization_id: str) -> bool:
        """
        Hard delete organization.
        Note: for production you may prefer soft-delete (is_active flag) to preserve history.
        """
        org = await OrganizationService.get_organization(db, organization_id)
        await db.delete(org)
        # caller must commit
        return True
