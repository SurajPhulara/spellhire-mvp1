from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets
import logging

from fastapi import BackgroundTasks
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import AppException, ConflictError, NotFoundError
from app.core.security import SecurityService
from app.models.enums import AuthMethod, EmployerProfileStatus, EmployerRole, UserStatus, UserType
from app.models.organization import Organization
from app.models.user import EmployerProfile, User, UserRole
from app.schemas.team import TeamMemberCreateSchema, TeamInviteAcceptSchema
from app.services.email_service import EmailService
from app.services.employer_service import EmployerService

logger = logging.getLogger(__name__)

INVITATION_TTL_DAYS = 7


class TeamService:
    @staticmethod
    def _email_key(email: str) -> str:
        return (email or "").strip().lower()

    @staticmethod
    async def list_members(db: AsyncSession, user_id: str) -> list[EmployerProfile]:
        actor = await EmployerService.get_recruiting_member(db, user_id)
        q = (
            select(EmployerProfile)
            .where(EmployerProfile.organization_id == actor.organization_id)
            .order_by(EmployerProfile.created_at.asc())
        )
        res = await db.execute(q)
        return list(res.scalars().all())

    @staticmethod
    async def invite_member(
        db: AsyncSession,
        user_id: str,
        payload: TeamMemberCreateSchema,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> EmployerProfile:
        actor = await EmployerService.get_recruiting_member(db, user_id)
        if payload.role == EmployerRole.ADMIN:
            raise AppException("Cannot create another ADMIN through team invites", status_code=400)
        if payload.role not in (EmployerRole.RECRUITER, EmployerRole.INTERVIEWER):
            raise AppException("Team invites only support RECRUITER or INTERVIEWER", status_code=400)

        email = TeamService._email_key(str(payload.email))
        existing_q = select(EmployerProfile).where(
            EmployerProfile.organization_id == actor.organization_id,
            func.lower(EmployerProfile.email) == email,
        )
        existing = (await db.execute(existing_q)).scalars().first()
        if existing:
            raise ConflictError("A team member with this email already exists in the organization")

        now = datetime.now(timezone.utc)
        member = EmployerProfile(
            user_id=None,
            organization_id=actor.organization_id,
            invited_by_employer_id=actor.id,
            first_name=payload.first_name,
            last_name=payload.last_name or "",
            email=email,
            phone=payload.phone or "",
            job_title=payload.job_title or "",
            department=payload.department,
            bio=payload.bio or "",
            skills=payload.skills or [],
            experience_years=payload.experience_years,
            role=payload.role,
            status=EmployerProfileStatus.INVITED,
            invitation_token=secrets.token_urlsafe(32),
            invitation_expires_at=now + timedelta(days=INVITATION_TTL_DAYS),
            invited_at=now,
            is_active=True,
        )
        db.add(member)
        await db.flush()

        org = (
            await db.execute(select(Organization).where(Organization.id == actor.organization_id))
        ).scalars().first()
        TeamService._send_invitation_email(
            member=member,
            organization_name=(org.name if org and org.name else settings.APP_NAME),
            background_tasks=background_tasks,
        )
        return member

    @staticmethod
    def _send_invitation_email(
        *,
        member: EmployerProfile,
        organization_name: str,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> None:
        base = (settings.FRONTEND_BASE_URL or "").rstrip("/")
        action_url = f"{base}/invite?token={member.invitation_token}" if base else (member.invitation_token or "")
        ctx = {
            "name": member.first_name or "",
            "role": member.role.value if hasattr(member.role, "value") else str(member.role),
            "organization_name": organization_name,
            "action_url": action_url,
            "expires_at": member.invitation_expires_at.isoformat() if member.invitation_expires_at else "",
            "app_name": settings.APP_NAME,
        }
        try:
            if background_tasks:
                background_tasks.add_task(
                    EmailService.send_team_invitation_email,
                    to_email=member.email,
                    context=ctx,
                )
            else:
                EmailService.send_team_invitation_email(to_email=member.email, context=ctx)
        except Exception:
            logger.exception("Failed to send team invitation to %s", member.email)

    @staticmethod
    async def get_invitation(db: AsyncSession, token: str) -> EmployerProfile:
        q = (
            select(EmployerProfile)
            .options(selectinload(EmployerProfile.organization))
            .where(EmployerProfile.invitation_token == token)
        )
        member = (await db.execute(q)).scalars().first()
        if not member:
            raise NotFoundError("Invitation not found")
        if EmployerService._status_value(member) != EmployerProfileStatus.INVITED.value:
            raise AppException("Invitation is no longer pending", status_code=400)
        if member.invitation_expires_at and member.invitation_expires_at < datetime.now(timezone.utc):
            raise AppException("Invitation has expired", status_code=400)
        return member

    @staticmethod
    async def accept_invitation(
        db: AsyncSession,
        token: str,
        payload: Optional[TeamInviteAcceptSchema] = None,
    ) -> EmployerProfile:
        member = await TeamService.get_invitation(db, token)
        now = datetime.now(timezone.utc)
        role = EmployerService._role_value(member)

        if payload and payload.first_name:
            member.first_name = payload.first_name
        if payload and payload.last_name is not None:
            member.last_name = payload.last_name

        if role == EmployerRole.RECRUITER.value:
            password = payload.password if payload else None
            if not password:
                raise AppException("Password is required to accept a recruiter invitation", status_code=400)
            await TeamService._activate_recruiter(db, member, password)
        elif role == EmployerRole.INTERVIEWER.value:
            member.user_id = None
        else:
            raise AppException("This invitation cannot be accepted", status_code=400)

        member.status = EmployerProfileStatus.ACTIVE
        member.accepted_at = now
        member.rejected_at = None
        member.invitation_token = None
        member.invitation_expires_at = None
        member.is_active = True
        member.updated_at = now
        await db.flush()
        return member

    @staticmethod
    async def _activate_recruiter(db: AsyncSession, member: EmployerProfile, password: str) -> None:
        email = TeamService._email_key(member.email or "")
        user_q = (
            select(User)
            .options(selectinload(User.roles), selectinload(User.employer_profile))
            .where(func.lower(User.email) == email)
        )
        user = (await db.execute(user_q)).scalars().first()

        if user and user.employer_profile and str(user.employer_profile.id) != str(member.id):
            raise ConflictError("This email already has an employer membership")

        if not user:
            user = User(
                email=email,
                password_hash=SecurityService.hash_password(password),
                provider=AuthMethod.EMAIL,
                status=UserStatus.ACTIVE,
                email_verified_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(user)
            await db.flush()
            db.add(UserRole(user_id=user.id, role=UserType.EMPLOYER))
        else:
            if user.password_hash:
                if not SecurityService.verify_password(password, user.password_hash):
                    raise AppException("Invalid password for existing account", status_code=400)
            else:
                user.password_hash = SecurityService.hash_password(password)
            if not any(r.role == UserType.EMPLOYER for r in (user.roles or [])):
                db.add(UserRole(user_id=user.id, role=UserType.EMPLOYER))
            if user.status != UserStatus.ACTIVE:
                user.status = UserStatus.ACTIVE
            if not user.email_verified_at:
                user.email_verified_at = datetime.now(timezone.utc)
            user.updated_at = datetime.now(timezone.utc)

        member.user_id = user.id

    @staticmethod
    async def reject_invitation(db: AsyncSession, token: str) -> EmployerProfile:
        member = await TeamService.get_invitation(db, token)
        now = datetime.now(timezone.utc)
        member.status = EmployerProfileStatus.REJECTED
        member.rejected_at = now
        member.invitation_token = None
        member.invitation_expires_at = None
        member.is_active = False
        member.updated_at = now
        await db.flush()
        return member
