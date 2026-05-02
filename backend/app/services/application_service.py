# backend/app/services/application_service.py

from __future__ import annotations
from typing import Optional, List, Tuple, Dict, Any
import uuid
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone

from app.models.job import Job, Application, Pipeline
from app.models.organization import Organization
from app.models.enums import ApplicationStatus
from app.services.candidate_service import CandidateService
from app.core.exceptions import NotFoundError, ConflictError, AppException
from app.schemas.jobs import JobPreview
from app.services.job_service import JobService

logger = logging.getLogger(__name__)


class ApplicationService:
    """
    Handles all candidate <-> job lifecycle logic.
    """

    # ============================================================
    # APPLY TO JOB
    # ============================================================
    @staticmethod
    async def create_application(
        db: AsyncSession,
        job_id: str,
        candidate_user_id: str,
    ) -> Application:

        # ── Validate job ─────────────────────────────────────────
        job_stmt = select(Job).where(Job.id == job_id)
        job_res = await db.execute(job_stmt)
        job = job_res.scalars().first()

        if not job:
            raise NotFoundError("Job not found")

        # ── Get candidate ────────────────────────────────────────
        candidate = await CandidateService.get_profile(db, candidate_user_id)

        # ── Prevent duplicate application ────────────────────────
        existing_stmt = select(Application.id).where(
            Application.job_id == job.id,
            Application.candidate_id == candidate.id
        )
        existing = await db.execute(existing_stmt)

        if existing.scalar():
            raise ConflictError("Already applied to this job")

        # ── Get pipeline ─────────────────────────────────────────
        pipeline_stmt = select(Pipeline).where(Pipeline.job_id == job.id)
        pipeline_res = await db.execute(pipeline_stmt)
        pipeline = pipeline_res.scalars().first()

        if not pipeline:
            pipeline = await JobService.create_default_pipeline(db, job)
            # raise AppException("Pipeline not configured for this job", status_code=400)

        # ── Default stage = "applied" ────────────────────────────
        default_stage_id = "applied"

        application = Application(
            job_id=job.id,
            candidate_id=candidate.id,
            pipeline_id=pipeline.id,
            current_stage_id=default_stage_id,
            status=ApplicationStatus.APPLIED,
            applied_at=datetime.now(timezone.utc),
            stage_updated_at=datetime.now(timezone.utc),
        )

        db.add(application)
        await db.flush()

        return application


    # ============================================================
    # GET APPLIED JOBS (CANDIDATE VIEW)
    # ============================================================
    @staticmethod
    async def get_applied_jobs(
        db: AsyncSession,
        candidate_user_id: str,
        limit: int = 10,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int]:

        # ── Get candidate ────────────────────────────────────────
        candidate = await CandidateService.get_profile(db, candidate_user_id)

        # ── Count ────────────────────────────────────────────────
        total = await db.scalar(
            select(func.count(Application.id))
            .where(Application.candidate_id == candidate.id)
        )

        # ── Query ────────────────────────────────────────────────
        stmt = (
            select(
                Application,
                Job,
                Organization.name,
                Organization.logo_url,
                Pipeline.stages
            )
            .join(Job, Application.job_id == Job.id)
            .join(Organization, Job.organization_id == Organization.id)
            .outerjoin(Pipeline, Pipeline.job_id == Job.id)
            .where(Application.candidate_id == candidate.id)
            .order_by(Application.applied_at.desc())
            .limit(limit)
            .offset(offset)
        )

        res = await db.execute(stmt)
        rows = res.all()

        applications = []

        for app, job, org_name, logo_url, stages in rows:

            # attach org info
            job.organization_name = org_name
            job.logo_url = logo_url

            # normalize pipeline stages
            pipeline_stages = [
                {
                    "id": s.get("id"),
                    "name": s.get("name"),
                    "order": s.get("order"),
                }
                for s in (stages or [])
            ]

            applications.append({
                "application_id": app.id,
                "applied_at": app.applied_at,
                "last_updated_at": app.last_updated_at,
                "stage_updated_at": app.stage_updated_at,
                "status": app.status,
                "current_stage_id": app.current_stage_id,
                "job": JobPreview.model_validate(job),
                "pipeline_stages": pipeline_stages,
            })

        return applications, total


    # ============================================================
    # GET APPLICATIONS FOR A JOB (EMPLOYER VIEW)
    # ============================================================
    @staticmethod
    async def get_job_applications(
        db: AsyncSession,
        job_id: str,
        limit: int = 10,
        offset: int = 0,
    ):

        # ── Count ────────────────────────────────────────────────
        total = await db.scalar(
            select(func.count(Application.id))
            .where(Application.job_id == job_id)
        )

        stmt = (
            select(Application)
            .where(Application.job_id == job_id)
            .order_by(Application.applied_at.desc())
            .limit(limit)
            .offset(offset)
        )

        res = await db.execute(stmt)
        applications = res.scalars().all()

        return applications, total


    # ============================================================
    # MOVE STAGE (future use)
    # ============================================================
    @staticmethod
    async def move_stage(
        db: AsyncSession,
        application_id: str,
        new_stage_id: str,
    ) -> Application:

        stmt = select(Application).where(Application.id == application_id)
        res = await db.execute(stmt)
        application = res.scalars().first()

        if not application:
            raise NotFoundError("Application not found")

        application.current_stage_id = new_stage_id
        application.stage_updated_at = datetime.now(timezone.utc)
        application.last_updated_at = datetime.now(timezone.utc)

        await db.flush()

        return application