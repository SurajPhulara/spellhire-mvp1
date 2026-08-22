from __future__ import annotations

from typing import Optional, List, Tuple, Dict, Any
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.job import Job, Application, Pipeline, ApplicationStageHistory
from app.models.organization import Organization
from app.models.user import CandidateProfile
from app.models.enums import ApplicationStatus
from app.services.candidate_service import CandidateService
from app.core.exceptions import NotFoundError, ConflictError, AppException
from app.schemas.jobs import JobPreview, PipelineStageSchema

logger = logging.getLogger(__name__)


class ApplicationService:
    """
    Handles all candidate <-> job lifecycle logic.
    """

    @staticmethod
    async def create_application(
        db: AsyncSession,
        job_id: str,
        candidate_user_id: str,
    ) -> Application:

        job_stmt = select(Job).where(Job.id == job_id)
        job_res = await db.execute(job_stmt)
        job = job_res.scalars().first()

        if not job:
            raise NotFoundError("Job not found")

        candidate = await CandidateService.get_profile(db, candidate_user_id)

        existing_stmt = select(Application.id).where(
            Application.job_id == job.id,
            Application.candidate_id == candidate.id
        )
        existing = await db.execute(existing_stmt)

        if existing.scalar():
            raise ConflictError("Already applied to this job")

        pipeline_stmt = select(Pipeline).where(Pipeline.job_id == job.id)
        pipeline_res = await db.execute(pipeline_stmt)
        pipeline = pipeline_res.scalars().first()

        if not pipeline:
            raise AppException("Pipeline not configured for this job", status_code=400)

        default_stage_id = "applied"
        now = datetime.now(timezone.utc)

        application = Application(
            job_id=job.id,
            candidate_id=candidate.id,
            pipeline_id=pipeline.id,
            current_stage_id=default_stage_id,
            status=ApplicationStatus.APPLIED,
            applied_at=now,
            stage_updated_at=now,
            last_updated_at=now,
        )

        db.add(application)
        await db.flush()

        db.add(
            ApplicationStageHistory(
                application_id=application.id,
                from_stage_id=None,
                to_stage_id="applied",
                changed_at=now,
            )
        )

        await db.flush()
        return application

    @staticmethod
    async def get_applied_jobs(
        db: AsyncSession,
        candidate_user_id: str,
        limit: int = 10,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int, Dict[str, int]]:

        candidate = await CandidateService.get_profile(db, candidate_user_id)

        total = await db.scalar(
            select(func.count(Application.id))
            .where(Application.candidate_id == candidate.id)
        )

        stats_query = select(
            func.count(Application.id).label("total_applied"),
            func.count().filter(
                (Application.current_stage_id != "applied") &
                (Application.current_stage_id != "offer") &
                (Application.current_stage_id != "rejected")
            ).label("in_progress"),
            func.count().filter(
                Application.current_stage_id == "offer"
            ).label("offers"),
            func.count().filter(
                (Application.current_stage_id == "rejected") |
                (Application.status == "REJECTED")
            ).label("rejected"),
        ).where(Application.candidate_id == candidate.id)

        stats_res = await db.execute(stats_query)
        stats_row = stats_res.first()

        stats = {
            "total_applied": stats_row.total_applied or 0,
            "in_progress": stats_row.in_progress or 0,
            "offers": stats_row.offers or 0,
            "rejected": stats_row.rejected or 0,
        }

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
            job.organization_name = org_name
            job.logo_url = logo_url

            pipeline_stages = sorted(
                [
                    {
                        "id": s.get("id"),
                        "name": s.get("name"),
                        "order": s.get("order"),
                    }
                    for s in (stages or [])
                ],
                key=lambda x: x["order"]
            )

            if not pipeline_stages:
                raise AppException("Pipeline not configured for this job", status_code=400)

            current_index = next(
                (i for i, s in enumerate(pipeline_stages) if s["id"] == app.current_stage_id),
                0
            )

            if app.current_stage_id == "applied":
                visible_stages = [pipeline_stages[0]]
            elif app.current_stage_id == "screening":
                start = max(0, current_index - 1)
                end = min(len(pipeline_stages), current_index + 2)
                visible_stages = pipeline_stages[start:end]
            else:
                visible_stages = pipeline_stages

            applications.append({
                "application_id": app.id,
                "applied_at": app.applied_at,
                "last_updated_at": app.last_updated_at,
                "stage_updated_at": app.stage_updated_at,
                "status": app.status,
                "current_stage_id": app.current_stage_id,
                "job": JobPreview.model_validate(job),
                "pipeline_stages": visible_stages,
            })

        return applications, total, stats

    @staticmethod
    async def get_application_timeline(
        db: AsyncSession,
        candidate_user_id: str,
        application_id: str,
    ) -> Dict[str, Any]:
        candidate = await CandidateService.get_profile(db, candidate_user_id)

        stmt = (
            select(Application)
            .options(
                selectinload(Application.stage_history),
                selectinload(Application.pipeline),
                selectinload(Application.job).selectinload(Job.organization),
            )
            .where(
                Application.id == application_id,
                Application.candidate_id == candidate.id,
            )
        )

        res = await db.execute(stmt)
        app = res.scalars().first()

        if not app:
            raise NotFoundError("Application not found")

        job = app.job
        if not job:
            raise NotFoundError("Job not found")

        org = job.organization
        if org:
            job.organization_name = org.name
            job.logo_url = org.logo_url

        pipeline_stages = []
        if app.pipeline and app.pipeline.stages:
            pipeline_stages = sorted(
                [
                    {
                        "id": s.get("id"),
                        "name": s.get("name"),
                        "order": s.get("order"),
                    }
                    for s in app.pipeline.stages
                ],
                key=lambda x: x["order"]
            )

        if not pipeline_stages:
            raise AppException("Pipeline not configured for this job", status_code=400)

        stage_history = sorted(
            [
                {
                    "from_stage_id": h.from_stage_id,
                    "to_stage_id": h.to_stage_id,
                    "changed_at": h.changed_at,
                }
                for h in (app.stage_history or [])
            ],
            key=lambda x: x["changed_at"]
        )

        return {
            "application_id": app.id,
            "applied_at": app.applied_at,
            "last_updated_at": app.last_updated_at,
            "stage_updated_at": app.stage_updated_at,
            "status": app.status,
            "current_stage_id": app.current_stage_id,
            "job": JobPreview.model_validate(job),
            "pipeline_stages": pipeline_stages,
            "stage_history": stage_history,
        }

    @staticmethod
    async def get_job_applications_board(
        db: AsyncSession,
        job_id: str,
    ) -> Dict[str, Any]:
        job_stmt = (
            select(Job)
            .options(selectinload(Job.organization))
            .where(Job.id == job_id)
        )
        job_res = await db.execute(job_stmt)
        job = job_res.scalars().first()

        if not job:
            raise NotFoundError("Job not found")

        pipeline_stmt = select(Pipeline).where(Pipeline.job_id == job.id)
        pipeline_res = await db.execute(pipeline_stmt)
        pipeline = pipeline_res.scalars().first()

        if not pipeline or not pipeline.stages:
            raise AppException("Pipeline not configured for this job", status_code=400)

        org = job.organization
        if org:
            job.organization_name = org.name
            job.logo_url = org.logo_url

        # pipeline_stages = ApplicationService._normalize_pipeline_stages(pipeline.stages)
        locked_ids = {"applied", "screening", "offer", "rejected"}
        pipeline_stages = [
            PipelineStageSchema.model_validate({
                **stage,
                "locked": stage["id"] in locked_ids,
            })
            for stage in pipeline.stages
        ]

        stage_counts_res = await db.execute(
            select(Application.current_stage_id, func.count(Application.id))
            .where(Application.job_id == job.id)
            .group_by(Application.current_stage_id)
        )
        stage_counts = {row[0]: int(row[1]) for row in stage_counts_res.all()}

        for stage in pipeline_stages:
            stage.count = stage_counts.get(stage.id, 0)

        total_applications = sum(stage_counts.values())
        rejected_count = stage_counts.get("rejected", 0)
        offers_count = stage_counts.get("offer", 0)
        in_review_count = sum(
            count for sid, count in stage_counts.items()
            if sid not in {"applied", "offer", "rejected"}
        )

        applications_stmt = (
            select(Application)
            .options(
                selectinload(Application.candidate).selectinload(CandidateProfile.user)
            )
            .where(Application.job_id == job.id)
            .order_by(Application.applied_at.desc())
        )
        applications_res = await db.execute(applications_stmt)
        applications_rows = applications_res.scalars().all()

        applications: List[Dict[str, Any]] = []

        for app in applications_rows:
            candidate = app.candidate
            user = candidate.user if candidate else None

            if candidate:
                full_name = f"{candidate.first_name or ''} {candidate.last_name or ''}".strip()
            else:
                full_name = ""

            if not full_name:
                full_name = "Candidate"

            skills = []
            if candidate and candidate.skills:
                for s in candidate.skills:
                    if isinstance(s, str):
                        skills.append(s)
                    elif isinstance(s, dict):
                        val = s.get("name") or s.get("skill") or ""
                        if val:
                            skills.append(str(val))

            applications.append({
                "application_id": app.id,
                "applied_at": app.applied_at,
                "last_updated_at": app.last_updated_at,
                "stage_updated_at": app.stage_updated_at,
                "status": str(app.status),
                "current_stage_id": app.current_stage_id,
                "notes": app.notes,
                "candidate": {
                    "id": candidate.id if candidate else None,
                    "user_id": candidate.user_id if candidate else None,
                    "first_name": candidate.first_name if candidate else None,
                    "last_name": candidate.last_name if candidate else None,
                    "full_name": full_name,
                    "profile_picture_url": user.profile_picture_url if user else None,
                    "total_experience": candidate.total_experience if candidate else None,
                    "current_salary": candidate.current_salary if candidate else None,
                    "expected_salary": candidate.expected_salary if candidate else None,
                    "preferred_locations": candidate.preferred_locations if candidate else [],
                    "skills": skills,
                    "resume_url": candidate.resume_url if candidate else None,
                    "linkedin_url": candidate.linkedin_url if candidate else None,
                    "github_url": candidate.github_url if candidate else None,
                    "is_profile_complete": candidate.is_profile_complete if candidate else False,
                },
            })

        stats = {
            "total_applications": total_applications,
            "in_review": in_review_count,
            "offers": offers_count,
            "rejected": rejected_count,
        }

        return {
            "job": JobPreview.model_validate(job),
            "pipeline_stages": pipeline_stages,
            "stats": stats,
            "applications": applications,
        }

    @staticmethod
    async def move_application_stage(
        db: AsyncSession,
        job_id: str,
        application_id: str,
        new_stage_id: str,
        changed_by_id: Optional[str] = None,
    ) -> Application:

        app_stmt = select(Application).where(
            Application.id == application_id,
            Application.job_id == job_id,
        )
        app_res = await db.execute(app_stmt)
        application = app_res.scalars().first()

        if not application:
            raise NotFoundError("Application not found")

        pipeline_stmt = select(Pipeline).where(Pipeline.job_id == job_id)
        pipeline_res = await db.execute(pipeline_stmt)
        pipeline = pipeline_res.scalars().first()

        if not pipeline or not pipeline.stages:
            raise AppException("Pipeline not configured for this job", status_code=400)

        stage_ids = {s.get("id") for s in pipeline.stages}
        if new_stage_id not in stage_ids:
            raise AppException("Invalid stage selected", status_code=400)

        old_stage_id = application.current_stage_id
        now = datetime.now(timezone.utc)

        application.current_stage_id = new_stage_id
        application.stage_updated_at = now
        application.last_updated_at = now

        if new_stage_id == "rejected":
            application.status = ApplicationStatus.REJECTED
        elif new_stage_id == "offer":
            application.status = ApplicationStatus.OFFER
        elif application.status in (
            ApplicationStatus.REJECTED,
            ApplicationStatus.OFFER,
        ):
            application.status = ApplicationStatus.APPLIED

        db.add(
            ApplicationStageHistory(
                application_id=application.id,
                from_stage_id=old_stage_id,
                to_stage_id=new_stage_id,
                changed_by_id=changed_by_id,
                changed_at=now,
            )
        )

        await db.flush()
        return application

    @staticmethod
    async def update_application_notes(
        db: AsyncSession,
        job_id: str,
        application_id: str,
        notes: Optional[str],
    ) -> Application:
        stmt = select(Application).where(
            Application.id == application_id,
            Application.job_id == job_id,
        )
        res = await db.execute(stmt)
        application = res.scalars().first()

        if not application:
            raise NotFoundError("Application not found")

        application.notes = notes.strip() if notes and notes.strip() else None
        application.last_updated_at = datetime.now(timezone.utc)

        await db.flush()
        return application

    
        