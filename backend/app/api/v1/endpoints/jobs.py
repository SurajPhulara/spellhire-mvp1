# backend/app/api/v1/endpoints/jobs.py
import logging
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_optional, require_candidate, require_employer
from app.core.responses import success_response
from app.core.exceptions import AppException, NotFoundError, ConflictError

from app.services.job_service import JobService
from app.schemas.jobs import ApplicationReadSchema, Job, JobPublic, ApplicationCreateSchema 
from app.models.enums import JobStatus, ApplicationStatus
from app.schemas.base import PaginationMeta   

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: Job,
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a job (Employer only).
    """
    try:
        if current_user.get("user_type") != "EMPLOYER":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only employers can create jobs")

        employer_user_id = current_user.get("sub")
        job = await JobService.create_job(db=db, employer_user_id=employer_user_id, payload=payload.model_dump(exclude_none=True))
        await db.commit()
        await db.refresh(job)
        return success_response(message="Job created", data=Job.model_validate(job).model_dump())
    except (AppException, ConflictError, NotFoundError) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("create job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create job")

@router.put("/{job_id}", status_code=status.HTTP_200_OK)
async def update_job(
    job_id: str,
    payload: Job,
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    try:
        employer_user_id = current_user.get("sub") if current_user.get("user_type") == "EMPLOYER" else None
        job = await JobService.update_job(db=db, job_id=job_id, payload=payload.model_dump(exclude_none=True), employer_user_id=employer_user_id)
        await db.commit()
        await db.refresh(job)
        return success_response(message="Job updated", data=Job.model_validate(job).model_dump())
    except (AppException, NotFoundError, ConflictError) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("update job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update job")


@router.patch("/{job_id}", status_code=status.HTTP_200_OK)
async def update_job(
    job_id: str,
    status: JobStatus,
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    try:
        employer_user_id = current_user.get("sub") if current_user.get("user_type") == "EMPLOYER" else None
        job = await JobService.update_job(db=db, job_id=job_id, payload={"status":status}, employer_user_id=employer_user_id)
        await db.commit()
        await db.refresh(job)
        return success_response(message="Job updated", data=Job.model_validate(job).model_dump())
    except (AppException, NotFoundError, ConflictError) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("update job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update job")


@router.get("/organization", status_code=status.HTTP_200_OK)
async def list_jobs_organization(
    q: Optional[str] = None,
    job_type: Optional[str] = None,
    work_mode: Optional[str] = None,
    status: Optional[str] = None,
    offset: int = 0,
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    try:
        employer_user_id = current_user.get("sub")
        limit: int = 9
        jobs, total = await JobService.list_jobs_organization( db=db, q=q, employer_user_id=employer_user_id, job_type=job_type, work_mode=work_mode, status=status, limit=limit, offset=offset )
        job_list = [Job.model_validate(j) for j in jobs]
        meta = PaginationMeta(total=total, limit=limit, offset=offset, has_next=offset + limit < total, has_prev=offset > 0)
        return success_response( message="OK", data={"jobs": job_list}, meta=meta )
    except Exception as e:
        logger.exception("get jobs failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/employer", status_code=status.HTTP_200_OK)
async def list_jobs_employer(
    q: Optional[str] = None,
    job_type: Optional[str] = None,
    work_mode: Optional[str] = None,
    status: Optional[str] = None,
    offset: int = 0,
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    try:
        employer_user_id = current_user.get("sub")
        limit: int = 3
        jobs, total = await JobService.list_jobs_employer( db=db, q=q, employer_user_id=employer_user_id, job_type=job_type, work_mode=work_mode, status=status, limit=limit, offset=offset )
        job_list = [Job.model_validate(j) for j in jobs]
        meta = PaginationMeta(total=total, limit=limit, offset=offset, has_next=offset + limit < total, has_prev=offset > 0)
        return success_response( message="OK", data={"jobs": job_list}, meta=meta )
    except Exception as e:
        logger.exception("get jobs failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")

@router.get("/employer/{job_id}", status_code=status.HTTP_200_OK)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_employer)):
    try:
        user_id = current_user.get("sub")
        job = await JobService.get_job_employer(db=db, job_id=job_id, user_id=user_id)
        # await JobService.increment_view_count(db=db, job_id=job_id)
        await db.commit()
        await db.refresh(job)
        return success_response(message="OK", data={"job": job})
    except NotFoundError as e:
        await db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("get job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch job")

@router.get("", status_code=status.HTTP_200_OK)
async def list_jobs(
    q: Optional[str] = None,
    job_type: Optional[str] = None,
    work_mode: Optional[str] = None,
    experience_level: Optional[str] = None,
    category: Optional[str] = None,
    location_city: Optional[str] = None,
    location_country: Optional[str] = None,
    salary_min: Optional[float] = None,
    required_skills: Optional[str] = None,   # comma-separated, e.g. "python,react"
    is_featured: Optional[bool] = None,
    sort_by: Optional[str] = "published_at",  # published_at | salary_min | title
    sort_order: Optional[str] = "desc",       # asc | desc
    offset: int = 0,
    current_user: Optional[dict] = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    try:
        limit: int = 10
        candidate_user_id = current_user.get("sub") if current_user else None
        jobs, total = await JobService.browse_jobs(
            db=db,
            q=q,
            job_type=job_type,
            work_mode=work_mode,
            experience_level=experience_level,
            category=category,
            location_city=location_city,
            location_country=location_country,
            salary_min=salary_min,
            required_skills=required_skills,
            is_featured=is_featured,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
            candidate_user_id=candidate_user_id,
        )
        job_list = [JobPublic.model_validate(j) for j in jobs]
        meta = PaginationMeta(total=total, limit=limit, offset=offset, has_next=offset + limit < total, has_prev=offset > 0)
        return success_response(message="OK", data={"jobs": job_list}, meta=meta)
    except Exception as e:
        logger.exception("get jobs failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")



@router.get("/id/{job_id}", status_code=status.HTTP_200_OK)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    try:
        candidate_user_id = current_user.get("sub") if current_user else None

        job = await JobService.get_job(
            db=db,
            job_id=job_id,
            candidate_user_id=candidate_user_id
        )


        print("JobPublic.model_validate(job).model_dump() 1", JobPublic.model_validate(job).model_dump()["is_saved"])
        await JobService.increment_view_count(db=db, job=job)
        await db.commit()

        print("JobPublic.model_validate(job).model_dump() 2", JobPublic.model_validate(job).model_dump()["is_saved"])
        await db.refresh(job)


        print("JobPublic.model_validate(job).model_dump() 3", JobPublic.model_validate(job).model_dump()["is_saved"])

        return success_response(
            message="OK",
            data=JobPublic.model_validate(job).model_dump()
        )

    except NotFoundError as e:
        await db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("get job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch job")

@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job(job_id: str, current_user: dict = Depends(require_employer), db: AsyncSession = Depends(get_db)):
    try:
        employer_user_id = current_user.get("sub") if current_user.get("user_type") == "EMPLOYER" else None
        await JobService.delete_job(db=db, job_id=job_id, employer_user_id=employer_user_id)
        await db.commit()
        return success_response(message="Job deleted", data={})
    except (AppException, NotFoundError) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("delete job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to delete job")


@router.post("/{job_id}/publish", status_code=status.HTTP_200_OK)
async def publish_job(job_id: str, current_user: dict = Depends(require_employer), db: AsyncSession = Depends(get_db)):
    try:
        if current_user.get("user_type") != "EMPLOYER":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only employers can publish jobs")

        employer_user_id = current_user.get("sub")
        job = await JobService.publish_job(db=db, job_id=job_id, employer_user_id=employer_user_id)
        await db.commit()
        await db.refresh(job)
        return success_response(message="Job published", data=Job.model_validate(job).model_dump())
    except (AppException, NotFoundError) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("publish job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to publish job")


# --- SAVED JOBS ENDPOINTS ---
# Candidate-only actions for saving jobs


@router.post("/{job_id}/save", status_code=status.HTTP_201_CREATED)
async def save_job(
    job_id: str,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    """
    Save (bookmark) a job
    """

    try:
        candidate_user_id = current_user.get("sub")

        saved = await JobService.save_job(
            db=db,
            job_id=job_id,
            candidate_user_id=candidate_user_id
        )

        await db.commit()

        return success_response(
            message="Job saved",
            data={"job_id": saved.job_id}
        )

    except ConflictError as e:
        await db.rollback()
        raise HTTPException(status_code=409, detail=str(e))

    except (AppException, NotFoundError) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))

    except Exception as e:
        await db.rollback()
        logger.exception("save job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save job")


@router.delete("/{job_id}/save", status_code=status.HTTP_200_OK)
async def unsave_job(
    job_id: str,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    """
    Unsave job
    """

    try:
        candidate_user_id = current_user.get("sub")

        await JobService.unsave_job(
            db=db,
            job_id=job_id,
            candidate_user_id=candidate_user_id
        )

        await db.commit()

        return success_response(message="Job unsaved")

    except NotFoundError as e:
        await db.rollback()
        raise HTTPException(status_code=404, detail=str(e))

    except (AppException,) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))

    except Exception as e:
        await db.rollback()
        logger.exception("unsave job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to unsave job")


@router.get("/saved", status_code=status.HTTP_200_OK)
async def get_saved_jobs(
    offset: int = 0,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch saved jobs (paginated)

    Returns:
    - jobs (full job objects)
    - meta (pagination)
    """

    try:
        candidate_user_id = current_user.get("sub")
        limit: int = 10

        jobs, total = await JobService.get_saved_jobs(
            db=db,
            candidate_user_id=candidate_user_id,
            limit=limit,
            offset=offset
        )

        job_list = [JobPublic.model_validate(j) for j in jobs]

        meta = PaginationMeta(total=total, limit=limit, offset=offset, has_next=offset + limit < total, has_prev=offset > 0)

        return success_response(
            message="Saved jobs fetched",
            data={"jobs": job_list},
            meta=meta
        )

    except Exception as e:
        logger.exception("get saved jobs failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch saved jobs")



@router.post("/{job_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    payload: ApplicationCreateSchema,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    try:
        candidate_user_id = current_user.get("sub")

        application = await JobService.create_application(
            db=db,
            job_id=job_id,
            candidate_user_id=candidate_user_id,
            payload=payload.model_dump(exclude_none=True)
        )

        await db.commit()
        await db.refresh(application)

        return success_response(
            message="Applied successfully",
            data=ApplicationReadSchema.model_validate(application).model_dump()
        )

    except ConflictError as e:
        await db.rollback()
        raise HTTPException(status_code=409, detail=str(e))
    except (AppException, NotFoundError) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("apply failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to apply to job") 