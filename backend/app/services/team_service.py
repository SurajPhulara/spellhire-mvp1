import secrets
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.organization_member import OrganizationMember
from app.models.user import EmployerProfile
from app.models.enums import TeamMemberStatus, TeamMemberRole
from app.schemas.team import TeamMemberCreate


class TeamService:

    @staticmethod
    async def get_employer_profile(
        db: AsyncSession,
        user_id: str,
    ) -> EmployerProfile:

        result = await db.execute(
            select(EmployerProfile).where(
                EmployerProfile.user_id == user_id
            )
        )

        employer = result.scalar_one_or_none()

        if not employer:
            raise NotFoundError("Employer profile not found")

        if not employer.organization_id:
            raise NotFoundError("Employer is not associated with an organization")

        return employer

    @staticmethod
    async def list_members(
        db: AsyncSession,
        organization_id,
    ) -> List[OrganizationMember]:

        result = await db.execute(
            select(OrganizationMember)
            .where(
                OrganizationMember.organization_id == organization_id
            )
            .order_by(
                OrganizationMember.created_at.desc()
            )
        )

        return list(result.scalars().all())

    @staticmethod
    async def create_member(
        db: AsyncSession,
        *,
        employer_user_id: str,
        payload: TeamMemberCreate,
    ) -> OrganizationMember:

        employer = await TeamService.get_employer_profile(
            db,
            employer_user_id,
        )

        existing = await db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == employer.organization_id,
                OrganizationMember.email == payload.email,
                OrganizationMember.status.in_([
                    TeamMemberStatus.INVITED,
                    TeamMemberStatus.ACTIVE,
                ])
            )
        )

        if existing:
            raise ConflictError(
                "A team member with this email already exists"
            )

        invitation_token = secrets.token_urlsafe(48)

        member = OrganizationMember(
            organization_id=employer.organization_id,
            invited_by_employer_id=employer.id,

            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip() if payload.last_name else None,
            email=payload.email.lower(),

            role=payload.role,

            status=TeamMemberStatus.INVITED,

            job_title=payload.job_title,
            experience_years=payload.experience_years,
            skills=payload.skills or [],

            invitation_token=invitation_token,
            invitation_expires_at=datetime.utcnow() + timedelta(days=7),
        )

        db.add(member)
        await db.flush()
        await db.refresh(member)

        return member