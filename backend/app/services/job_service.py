# backend/app/services/job_service.py
from __future__ import annotations
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
import uuid
import logging

from sqlalchemy import func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ConflictError, AppException
from app.models.job import Job, Pipeline, Application
from app.models.organization import Organization
from app.models.user import EmployerProfile, CandidateProfile

from app.models.enums import JobStatus, ApplicationStatus
from app.services.candidate_service import CandidateService
from app.services.employer_service import EmployerService

logger = logging.getLogger(__name__)


class JobService:
    """
    Job related business logic. Methods do NOT commit; caller (endpoint) must commit/rollback.
    """

    @staticmethod
    async def get_job_employer(db: AsyncSession, job_id: str, user_id: str) -> Job:
        employer : EmployerProfile = await EmployerService.get_employer_profile(db, user_id)
        q = select(Job).where(
            (Job.id == job_id) 
            &
            (
                (Job.created_by_employer_id == employer.id) 
                |
                (Job.collaborator_employer_ids.any(employer.id))
            )
        )
        res = await db.execute(q)
        job = res.scalars().first()
        if not job:
            raise NotFoundError("Job not found")
        return job

    @staticmethod
    async def get_job_organization(db: AsyncSession, job_id: str, org_id: str) -> Job:
        q = select(Job).where( (Job.id == job_id) & (Job.organization_id == org_id))
        res = await db.execute(q)
        job = res.scalars().first()
        if not job:
            raise NotFoundError("Job not found")
        return job

    @staticmethod
    async def get_job(db: AsyncSession, job_id: str) -> Job:
        q = select(Job).where((Job.id == job_id) & (Job.status != JobStatus.DRAFT))
        res = await db.execute(q)
        job = res.scalars().first()
        if not job:
            raise NotFoundError("Job not found")
        return job

    # @staticmethod
    # async def list_jobs(
    #     db: AsyncSession,
    #     q: Optional[str] = None,
    #     organization_id: Optional[str] = None,
    #     job_type: Optional[str] = None,
    #     work_mode: Optional[str] = None,
    #     status: Optional[str] = None,
    #     limit: int = 20,
    #     offset: int = 0,
    # ) -> List[Job]:
    #     stmt = select(Job)
    #     filters = []
    #     if q:
    #         ilike_q = f"%{q}%"
    #         filters.append(
    #             Job.title.ilike(ilike_q) | Job.description.ilike(ilike_q) | Job.requirements.ilike(ilike_q)
    #         )
    #     if organization_id:
    #         filters.append(Job.organization_id == organization_id)
    #     if job_type:
    #         filters.append(Job.job_type == job_type)
    #     if work_mode:
    #         filters.append(Job.work_mode == work_mode)
    #     if status:
    #         filters.append(Job.status == status)

    #     if filters:
    #         stmt = stmt.where(*filters)

    #     stmt = stmt.order_by(Job.created_at.desc()).limit(limit).offset(offset)
    #     res = await db.execute(stmt)
    #     return res.scalars().all()


    @staticmethod
    async def list_jobs_employer(
        db: AsyncSession,
        q: Optional[str] = None,
        employer_user_id: Optional[str] = None,
        job_type: Optional[str] = None,
        work_mode: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Job], int]:
        """
        Returns:
            jobs: paginated job list
            total: total matching jobs (without pagination)
        """

        filters = []

        # candidate = CandidateService.get_profile(db, employer_user_id)
        employer = await EmployerService.get_employer_profile(db, employer_user_id)


        if not employer:
            raise NotFoundError("Job not found")

        organization_id = employer.organization_id


        if q:
            ilike_q = f"%{q}%"
            filters.append(
                Job.title.ilike(ilike_q) |
                Job.description.ilike(ilike_q) |
                Job.requirements.ilike(ilike_q)
            )

        if organization_id:
            filters.append(Job.organization_id == organization_id)
        else:
            raise NotFoundError("Job not found")

        if job_type:
            filters.append(Job.job_type == job_type)

        if work_mode:
            filters.append(Job.work_mode == work_mode)

        if status:
            filters.append(Job.status == status)

        # ------------------------
        # 1️⃣ COUNT QUERY
        # ------------------------
        count_stmt = select(func.count(Job.id))
        if filters:
            count_stmt = count_stmt.where(*filters)

        total = await db.scalar(count_stmt)

        # ------------------------
        # 2️⃣ DATA QUERY
        # ------------------------
        data_stmt = select(Job)
        if filters:
            data_stmt = data_stmt.where(*filters)

        data_stmt = (
            data_stmt
            .order_by(Job.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        res = await db.execute(data_stmt)
        jobs = res.scalars().all()

        return jobs, total


    @staticmethod
    async def browse_jobs(
        db: AsyncSession,
        q: Optional[str] = None,
        job_type: Optional[str] = None,
        work_mode: Optional[str] = None,
        location: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ):
        filters = [
            Job.status == JobStatus.PUBLISHED
        ]

        if q:
            ilike_q = f"%{q}%"
            filters.append(
                Job.title.ilike(ilike_q) |
                Job.description.ilike(ilike_q)
            )

        if job_type:
            filters.append(Job.job_type == job_type)

        if work_mode:
            filters.append(Job.work_mode == work_mode)

        # COUNT
        total = await db.scalar(
            select(func.count(Job.id)).where(*filters)
        )

        # DATA
        stmt = (
            select(Job)
            .where(*filters)
            .order_by(Job.published_at.desc())
            .limit(limit)
            .offset(offset)
        )

        res = await db.execute(stmt)
        jobs = res.scalars().all()

        return jobs, total

    @staticmethod
    async def create_job(db: AsyncSession, employer_user_id: str, payload: Dict[str, Any]) -> Job:
        """
        Create a job:
        - Ensure employer profile exists and organization exists.
        - Does not commit.
        """
        # Validate employer profile exists
        q = select(EmployerProfile).where(EmployerProfile.user_id == employer_user_id)
        r = await db.execute(q)
        employer_profile = r.scalars().first()
        if not employer_profile:
            raise NotFoundError("Employer profile not found")

        org_id = employer_profile.organization_id
        if not org_id:
            raise AppException("Organization id required to create a job", status_code=400)

        q = select(Organization).where(Organization.id == org_id)
        r = await db.execute(q)
        org = r.scalars().first()
        if not org:
            raise NotFoundError("Organization not found")

        allowed = {
            "organization_id", "title", "description", "requirements", "responsibilities", "vacancies",
            "job_type", "work_mode", "experience_level", "required_skills", "preferred_skills",
            "minimum_years_experience", "location", "salary_min", "salary_max", "salary_currency",
            "salary_period", "category", "department", "benefits", "application_deadline",
            "application_url", "is_featured", "collaborator_employer_ids", "status"
        }
        job_kwargs = {k: v for k, v in payload.items() if k in allowed}
        # ensure organization_id set
        job_kwargs["organization_id"] = org_id
        job_kwargs["created_by_employer_id"] = employer_profile.id

        job = Job(**job_kwargs)
        db.add(job)
        await db.flush()
        return job

    @staticmethod
    async def update_job(db: AsyncSession, job_id: str, payload: Dict[str, Any], employer_user_id: Optional[str] = None) -> Job:
        """
        Update job fields. If employer_user_id provided, ensure the caller is the creator (basic permission).
        """
        job = await JobService.get_job_employer(db, job_id, employer_user_id)

        # permission check: verify employer_user_id corresponds to created_by_employer_id
        if employer_user_id:
            q = select(EmployerProfile).where(EmployerProfile.user_id == employer_user_id)
            r = await db.execute(q)
            employer_profile = r.scalars().first()
            if not employer_profile:
                raise NotFoundError("Employer profile not found")
            if str(job.created_by_employer_id) != str(employer_profile.id):
                raise AppException("Forbidden: cannot edit job you didn't create", status_code=403)

        allowed = {
            "title", "description", "requirements", "responsibilities", "vacancies",
            "job_type", "work_mode", "experience_level", "required_skills", "preferred_skills",
            "minimum_years_experience", "location", "salary_min", "salary_max", "salary_currency",
            "salary_period", "category", "department", "benefits", "application_deadline",
            "application_url", "is_featured", "status", "collaborator_employer_ids"
        }

        updated = False
        for k, v in payload.items():
            if k in allowed:
                setattr(job, k, v)
                updated = True

        # remove status if it's draft
        if hasattr(job, "status") and getattr(job, "status") == JobStatus.DRAFT:
            delattr(job, "status")


        if updated:
            job.updated_at = datetime.now(timezone.utc)
            await db.flush()

        return job

    @staticmethod
    async def delete_job(db: AsyncSession, job_id: str, employer_user_id: Optional[str] = None) -> bool:
        job = await JobService.get_job_employer(db, job_id, employer_user_id)
        await db.delete(job)
        return True

    @staticmethod
    async def publish_job(db: AsyncSession, job_id: str, employer_user_id: Optional[str] = None) -> Job:
        """
        Mark job as ACTIVE and set published_at.
        """
        job = await JobService.get_job(db, job_id)
        if employer_user_id:
            q = select(EmployerProfile).where(EmployerProfile.user_id == employer_user_id)
            r = await db.execute(q)
            employer_profile = r.scalars().first()
            if not employer_profile or str(job.created_by_employer_id) != str(employer_profile.id):
                raise AppException("Forbidden: cannot publish job you didn't create", status_code=403)

        job.status = JobStatus.ACTIVE
        job.published_at = datetime.now(timezone.utc)
        await db.flush()
        return job

    @staticmethod
    async def increment_view_count(db: AsyncSession, job_id: str) -> None:
        job = await JobService.get_job(db, job_id)
        job.view_count = (job.view_count or 0) + 1
        await db.flush()

    # ---------------------------
    # Pipeline & Application helpers
    # ---------------------------
    @staticmethod
    async def get_pipeline(db: AsyncSession, job: Job) -> Optional[Pipeline]:
        if job.pipeline:
            return job.pipeline
        # fetch pipeline explicitly
        q = select(Pipeline).where(Pipeline.job_id == job.id)
        r = await db.execute(q)
        return r.scalars().first()

    @staticmethod
    async def create_default_pipeline(db: AsyncSession, job: Job) -> Pipeline:
        """
        Create a simple default pipeline for the job (single 'Applied' stage).
        """
        default_stages = [{"id": "applied", "name": "Applied", "order": 1, "isDefault": True}]
        pipeline = Pipeline(job_id=job.id, created_by_id=job.created_by_employer_id, stages=default_stages, is_active=True)
        db.add(pipeline)
        await db.flush()
        return pipeline

    @staticmethod
    async def create_application(
        db: AsyncSession,
        job_id: str,
        candidate_user_id: str,
        payload: Dict[str, Any],
    ) -> Application:
        """
        Candidate applies to a job.
        - Ensures candidate profile exists.
        - Prevent duplicate application per candidate+job (unique constraint in DB also).
        - Assigns to pipeline (creates default pipeline if needed).
        - Does NOT commit.
        """
        job = await JobService.get_job(db, job_id)

        # ensure candidate profile exists
        q = select(CandidateProfile).where(CandidateProfile.user_id == candidate_user_id)
        r = await db.execute(q)
        candidate_profile = r.scalars().first()
        if not candidate_profile:
            raise NotFoundError("Candidate profile not found")

        # check duplicate
        q = select(Application).where(Application.job_id == job.id, Application.candidate_id == candidate_profile.id)
        r = await db.execute(q)
        if r.scalars().first():
            raise ConflictError("You have already applied to this job")

        # determine pipeline
        pipeline = await JobService.get_pipeline(db, job)
        if not pipeline:
            pipeline = await JobService.create_default_pipeline(db, job)

        # allowed application fields
        allowed = {"cover_letter", "resume_url", "notes"}
        app_kwargs = {k: v for k, v in payload.items() if k in allowed}
        app_kwargs["job_id"] = job.id
        app_kwargs["candidate_id"] = candidate_profile.id
        app_kwargs["pipeline_id"] = pipeline.id
        app_kwargs["status"] = ApplicationStatus.APPLIED

        application = Application(**app_kwargs)
        db.add(application)

        # bump application count on job
        job.application_count = (job.application_count or 0) + 1
        await db.flush()
        return application
