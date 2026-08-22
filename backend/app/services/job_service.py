# backend/app/services/job_service.py
from __future__ import annotations
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
import uuid
import logging

from sqlalchemy import func, literal, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import NotFoundError, ConflictError, AppException
from app.models.job import Job, Pipeline, Application, SavedJob
from app.models.organization import Organization
from app.models.user import EmployerProfile, CandidateProfile

from app.models.enums import JobStatus, ApplicationStatus
from app.services.candidate_service import CandidateService
from app.services.employer_service import EmployerService
from app.schemas.jobs import PipelineStageSchema

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
    async def get_job(
        db: AsyncSession,
        job_id: str,
        candidate_user_id: Optional[str] = None
    ) -> Job:

        q = select(Job).where(
            (Job.id == job_id) &
            (Job.status != JobStatus.DRAFT)
        )

        res = await db.execute(q)
        job = res.scalars().first()

        if not job:
            raise NotFoundError("Job not found")

        # 🔥 default values (important)
        job.is_saved = False
        job.has_applied = False

        if not candidate_user_id:
            return job

        # get candidate profile
        candidate = await CandidateService.get_profile(db, candidate_user_id)

        # 🔥 check saved
        saved_stmt = select(SavedJob.id).where(
            SavedJob.job_id == job.id,
            SavedJob.candidate_id == candidate.id
        )
        saved_res = await db.execute(saved_stmt)
        job.is_saved = saved_res.scalar() is not None

        # 🔥 check applied
        applied_stmt = select(Application.id).where(
            Application.job_id == job.id,
            Application.candidate_id == candidate.id
        )
        applied_res = await db.execute(applied_stmt)
        job.has_applied = applied_res.scalar() is not None

        return job


    @staticmethod
    async def list_jobs_organization(
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


    # @staticmethod
    # async def browse_jobs(
    #     db: AsyncSession,
    #     q: Optional[str] = None,
    #     job_type: Optional[str] = None,
    #     work_mode: Optional[str] = None,
    #     location: Optional[str] = None,
    #     limit: int = 20,
    #     offset: int = 0,
    # ):
    #     filters = [
    #         Job.status == JobStatus.ACTIVE
    #     ]

    #     if q:
    #         ilike_q = f"%{q}%"
    #         filters.append(
    #             Job.title.ilike(ilike_q) |
    #             Job.description.ilike(ilike_q)
    #         )

    #     if job_type:
    #         filters.append(Job.job_type == job_type)

    #     if work_mode:
    #         filters.append(Job.work_mode == work_mode)

    #     # COUNT
    #     total = await db.scalar(
    #         select(func.count(Job.id)).where(*filters)
    #     )

    #     # DATA
    #     stmt = (
    #         select(Job)
    #         .where(*filters)
    #         .order_by(Job.published_at.desc())
    #         .limit(limit)
    #         .offset(offset)
    #     )

    #     res = await db.execute(stmt)
    #     jobs = res.scalars().all()

    #     return jobs, total

    @staticmethod
    async def browse_jobs(
        db: AsyncSession,
        q: Optional[str] = None,
        job_type: Optional[str] = None,
        work_mode: Optional[str] = None,
        experience_level: Optional[str] = None,
        category: Optional[str] = None,
        location_city: Optional[str] = None,
        location_country: Optional[str] = None,
        salary_min: Optional[float] = None,
        required_skills: Optional[str] = None,
        is_featured: Optional[bool] = None,
        sort_by: str = "published_at",
        sort_order: str = "desc",
        limit: int = 10,
        offset: int = 0,
        candidate_user_id: Optional[str] = None
    ):

        candidate = None
        if candidate_user_id:
            try:
                candidate = await CandidateService.get_profile(db, candidate_user_id)
            except:
                candidate = None

        filters = [Job.status == JobStatus.ACTIVE]

        # ── Search ─────────────────────────────────────
        if q:
            ilike_q = f"%{q}%"
            filters.append(
                Job.title.ilike(ilike_q) |
                Job.description.ilike(ilike_q)
            )

        # ── Filters ────────────────────────────────────
        if job_type:
            filters.append(Job.job_type == job_type)

        if work_mode:
            filters.append(Job.work_mode == work_mode)

        if experience_level:
            filters.append(Job.experience_level == experience_level)

        if category:
            filters.append(Job.category.ilike(f"%{category}%"))

        if location_city:
            filters.append(Job.location["city"].astext.ilike(f"%{location_city}%"))

        if location_country:
            filters.append(Job.location["country"].astext.ilike(f"%{location_country}%"))

        if salary_min is not None:
            filters.append(Job.salary_max >= salary_min)

        if required_skills:
            skill_list = [s.strip().lower() for s in required_skills.split(",") if s.strip()]
            if skill_list:
                filters.append(Job.required_skills.overlap(skill_list))

        if is_featured is not None:
            filters.append(Job.is_featured == is_featured)

        # ── COUNT ──────────────────────────────────────
        total = await db.scalar(
            select(func.count(Job.id)).where(*filters)
        )

        # ── SORT ───────────────────────────────────────
        SORT_COLUMN_MAP = {
            "published_at": Job.published_at,
            "salary_min": Job.salary_min,
            "title": Job.title,
            "created_at": Job.created_at,
        }
        sort_col = SORT_COLUMN_MAP.get(sort_by, Job.published_at)
        order_expr = sort_col.desc() if sort_order == "desc" else sort_col.asc()

        # ── SELECT (OPTIMIZED) ─────────────────────────
        if candidate:
            stmt = (
                select(
                    Job.id,
                    Job.title,
                    Job.job_type,
                    Job.work_mode,
                    Job.experience_level,
                    Job.department,
                    Job.category,
                    Job.is_featured,
                    Job.location,
                    Job.salary_min,
                    Job.salary_max,
                    Job.salary_currency,
                    Job.required_skills,
                    Job.application_count,
                    Job.published_at,

                    Organization.name.label("organization_name"),
                    Organization.logo_url.label("logo_url"),

                    (SavedJob.job_id.isnot(None)).label("is_saved")
                )
                .join(Organization, Job.organization_id == Organization.id)
                .outerjoin(
                    SavedJob,
                    (SavedJob.job_id == Job.id) &
                    (SavedJob.candidate_id == candidate.id)
                )
                .where(*filters)
                .order_by(order_expr)
                .limit(limit)
                .offset(offset)
            )
        else:
            stmt = (
                select(
                    Job.id,
                    Job.title,
                    Job.job_type,
                    Job.work_mode,
                    Job.experience_level,
                    Job.department,
                    Job.category,
                    Job.is_featured,
                    Job.location,
                    Job.salary_min,
                    Job.salary_max,
                    Job.salary_currency,
                    Job.required_skills,
                    Job.application_count,
                    Job.published_at,

                    Organization.name.label("organization_name"),
                    Organization.logo_url.label("logo_url"),

                    literal(False).label("is_saved")
                )
                .join(Organization, Job.organization_id == Organization.id)
                .where(*filters)
                .order_by(order_expr)
                .limit(limit)
                .offset(offset)
            )

        # ── EXECUTE ────────────────────────────────────
        res = await db.execute(stmt)
        rows = res.mappings().all()

        jobs = [dict(row) for row in rows]

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
        if payload.get("status") == JobStatus.ACTIVE:
            job_kwargs["published_at"] = datetime.now(timezone.utc)

        job = Job(**job_kwargs)
        db.add(job)
        await db.flush()
        await JobService.create_default_pipeline(db, job)
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
    async def increment_view_count(db: AsyncSession, job: Job) -> None:
        job.view_count = (job.view_count or 0) + 1
        await db.flush()
















    # --- SAVED JOBS METHODS ---
    # Handles candidate bookmarking (save/unsave jobs)
    # Follows same design:
    # - No commit here
    # - Uses CandidateProfile.id (NOT user_id)
    # - Returns Job objects for fetch




    @staticmethod
    async def save_job(db: AsyncSession, job_id: str, candidate_user_id: str) -> SavedJob:
        """
        Save (bookmark) a job for a candidate.

        Flow:
        - Fetch candidate profile
        - Insert into saved_jobs
        - Unique constraint prevents duplicates
        """

        candidate: CandidateProfile = await CandidateService.get_profile(db, candidate_user_id)

        saved = SavedJob(
            job_id=job_id,
            candidate_id=candidate.id
        )

        db.add(saved)

        try:
            await db.flush()
            return saved
        except IntegrityError:
            raise ConflictError("Job already saved")


    @staticmethod
    async def unsave_job(db: AsyncSession, job_id: str, candidate_user_id: str) -> bool:
        """
        Remove saved job.

        Flow:
        - Fetch candidate profile
        - Find saved record
        - Delete it
        """

        candidate: CandidateProfile = await CandidateService.get_profile(db, candidate_user_id)

        stmt = select(SavedJob).where(
            (SavedJob.job_id == job_id) &
            (SavedJob.candidate_id == candidate.id)
        )

        res = await db.execute(stmt)
        saved = res.scalars().first()

        if not saved:
            raise NotFoundError("Saved job not found")

        await db.delete(saved)
        await db.flush()

        return True

    @staticmethod
    async def get_saved_jobs(
        db: AsyncSession,
        candidate_user_id: str,
        limit: int = 10,
        offset: int = 0
    ):
        candidate: CandidateProfile = await CandidateService.get_profile(db, candidate_user_id)

        # ── COUNT ──────────────────────────────────────
        total = await db.scalar(
            select(func.count(SavedJob.job_id))
            .where(SavedJob.candidate_id == candidate.id)
        )

        # ── SELECT (OPTIMIZED) ─────────────────────────
        stmt = (
            select(
                Job.id,
                Job.title,
                Job.job_type,
                Job.work_mode,
                Job.experience_level,
                Job.department,
                Job.category,
                Job.is_featured,
                Job.location,
                Job.salary_min,
                Job.salary_max,
                Job.salary_currency,
                Job.required_skills,
                Job.application_count,
                Job.published_at,

                Organization.name.label("organization_name"),
                Organization.logo_url.label("logo_url"),

                literal(True).label("is_saved")
            )
            .join(SavedJob, SavedJob.job_id == Job.id)
            .join(Organization, Job.organization_id == Organization.id)
            .where(SavedJob.candidate_id == candidate.id)
            .order_by(SavedJob.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        # ── EXECUTE ────────────────────────────────────
        res = await db.execute(stmt)
        rows = res.mappings().all()

        jobs = [dict(row) for row in rows]

        return jobs, total







    # ---------------------------
    # Pipeline & Application helpers
    # ---------------------------
    @staticmethod
    async def get_pipeline(db: AsyncSession, job_id: uuid.UUID) -> Pipeline:
        stmt = select(Pipeline).where(Pipeline.job_id == job_id)
        res = await db.execute(stmt)
        pipeline = res.scalars().first()

        if not pipeline:
            raise NotFoundError("Pipeline not found")

        return pipeline

    @staticmethod
    async def create_default_pipeline(db: AsyncSession, job: Job) -> Pipeline:
        """
        Create a simple default pipeline for the job (single 'Applied' stage).
        """
        default_stages = [
            {"id": "applied", "name": "Applied", "order": 1, "color": "#3b82f6", "description": "Application submitted"},
            {"id": "screening", "name": "Screening", "order": 2, "color": "#f59e0b", "description": "Resume under review"},
            {"id": "interview", "name": "Interview", "order": 3, "color": "#8b5cf6", "description": "Interview process ongoing"},
            {"id": "offer", "name": "Offer", "order": 4, "color": "#10b981", "description": "Offer extended"},
            {"id": "rejected", "name": "Rejected", "order": 5, "color": "#ef4444", "description": "Application rejected"}
        ]
        pipeline = Pipeline(job_id=job.id, created_by_id=job.created_by_employer_id, stages=default_stages, is_active=True)
        db.add(pipeline)
        await db.flush()
        return pipeline


    @staticmethod
    async def update_job_pipeline(
        db: AsyncSession,
        job_id: str,
        stages: List[PipelineStageSchema],
    ) -> List[PipelineStageSchema]:
        pipeline = await JobService.get_pipeline(db, job_id)

        if not stages:
            raise AppException("Pipeline cannot be empty", status_code=400)

        locked_ids = {"applied", "screening", "offer", "rejected"}
        existing_stage_map = {
            s.get("id"): s
            for s in (pipeline.stages or [])
            if s.get("id")
        }

        incoming_ids = [s.id for s in stages if s.id]
        missing_locked = [sid for sid in locked_ids if sid not in incoming_ids]
        if missing_locked:
            raise AppException(
                f"Locked stages missing: {', '.join(missing_locked)}",
                status_code=400,
            )

        # Locked stages must stay at the edges
        if stages[0].id != "applied" or stages[1].id != "screening":
            raise AppException("Applied and Screening must remain first", status_code=400)

        if stages[-2].id != "offer" or stages[-1].id != "rejected":
            raise AppException("Offer and Rejected must remain last", status_code=400)

        # Validate custom stages are only in the middle
        for stage in stages:
            if stage.id in locked_ids and stage.id not in {"applied", "screening", "offer", "rejected"}:
                raise AppException("Invalid locked stage", status_code=400)



        # Prevent deleting a custom stage if applicants are already in it
        removed_stage_ids = [
            sid for sid in existing_stage_map.keys()
            if sid not in incoming_ids and sid not in locked_ids
        ]

        if removed_stage_ids:
            stmt = (
                select(
                    Application.current_stage_id,
                    func.count(Application.id).label("cnt")
                )
                .where(
                    Application.job_id == pipeline.job_id,
                    Application.current_stage_id.in_(removed_stage_ids),
                )
                .group_by(Application.current_stage_id)
            )
            res = await db.execute(stmt)
            rows = res.all()

            blocked = [
                f"{row[0]} ({row[1]})"
                for row in rows
                if row[1] and row[1] > 0
            ]

            if blocked:
                raise AppException(
                    "Cannot delete stage(s) with active applicants: " + ", ".join(blocked),
                    status_code=400,
                )

        normalized: List[PipelineStageSchema] = []
        used_ids: set[str] = set()

        for index, stage in enumerate(stages, start=1):
            stage_id = (stage.id or "").strip() or f"stg_{uuid.uuid4().hex}"

            if stage_id in used_ids:
                raise AppException("Duplicate stage ids in request", status_code=400)

            used_ids.add(stage_id)

            name = (stage.name or "").strip()
            if not name:
                raise AppException("Stage name cannot be empty", status_code=400)

            color = (stage.color or "#9ca3af").strip()
            description = (stage.description or "No description").strip()
            locked = False
            count = stage.count or 0

            # preserve locked stage data from DB, never from client
            if stage_id in locked_ids:
                db_stage = existing_stage_map.get(stage_id)
                if not db_stage:
                    raise AppException(
                        f"Locked stage missing in existing pipeline: {stage_id}",
                        status_code=500,
                    )

                name = db_stage.get("name", name)
                color = db_stage.get("color") or color
                description = db_stage.get("description") or description
                locked = True
                count = 0

            normalized.append(
                PipelineStageSchema(
                    id=stage_id,
                    name=name,
                    order=index,
                    color=color,
                    description=description,
                    locked=locked,
                    count=count,
                )
            )

        pipeline.stages = [s.model_dump(exclude={"count"}) for s in normalized]
        pipeline.updated_at = datetime.now(timezone.utc)

        await db.flush()

        count_stmt = (
            select(
                Application.current_stage_id,
                func.count(Application.id).label("cnt")
            )
            .where(Application.job_id == pipeline.job_id)
            .group_by(Application.current_stage_id)
        )

        count_res = await db.execute(count_stmt)
        count_rows = count_res.all()
        stage_counts = {row[0]: row[1] for row in count_rows}

        for stage in normalized:
            stage.count = int(stage_counts.get(stage.id, 0))

        return normalized

