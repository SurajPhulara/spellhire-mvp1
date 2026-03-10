# backend/app/api/v1/endpoints/jobs.py
import logging
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user, require_candidate, require_employer
from app.core.responses import success_response
from app.core.exceptions import AppException, NotFoundError, ConflictError

from app.services.job_service import JobService
from app.schemas.jobs import Job, JobUpdateSchema, JobReadSchema, JobListResponseSchema, ApplicationCreateSchema, ApplicationReadSchema
from app.models.enums import JobStatus

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
async def list_jobs(
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
        limit: int = 20
        jobs, total = await JobService.list_jobs_employer( db=db, q=q, employer_user_id=employer_user_id, job_type=job_type, work_mode=work_mode, status=status, limit=limit, offset=offset )
        job_list = [Job.model_validate(j) for j in jobs]
        meta = { "total": total, "limit": limit, "offset": offset, "has_next": offset + limit < total, "has_prev": offset > 0 }
        return success_response( message="OK", data={"jobs": job_list}, meta=meta )
    except Exception as e:
        logger.exception("get jobs failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/employer", status_code=status.HTTP_200_OK)
async def list_jobs(
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
        limit: int = 20
        jobs, total = await JobService.list_jobs_employer( db=db, q=q, employer_user_id=employer_user_id, job_type=job_type, work_mode=work_mode, status=status, limit=limit, offset=offset )
        job_list = [Job.model_validate(j) for j in jobs]
        meta = { "total": total, "limit": limit, "offset": offset, "has_next": offset + limit < total, "has_prev": offset > 0 }
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
    status: Optional[str] = None,
    offset: int = 0,
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    try:
        employer_user_id = current_user.get("sub")
        limit: int = 20
        jobs, total = await JobService.list_jobs_employer( db=db, q=q, employer_user_id=employer_user_id, job_type=job_type, work_mode=work_mode, status=status, limit=limit, offset=offset )
        job_list = [Job.model_validate(j) for j in jobs]
        meta = { "total": total, "limit": limit, "offset": offset, "has_next": offset + limit < total, "has_prev": offset > 0 }
        return success_response( message="OK", data={"jobs": job_list}, meta=meta )
    except Exception as e:
        logger.exception("get jobs failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")



@router.get("/{job_id}", status_code=status.HTTP_200_OK)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    try:
        job = await JobService.get_job(db=db, job_id=job_id)
        await JobService.increment_view_count(db=db, job_id=job_id)
        await db.commit()
        await db.refresh(job)
        return success_response(message="OK", data=JobReadSchema.model_validate(job).model_dump())
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
        return success_response(message="Job published", data=JobReadSchema.model_validate(job).model_dump())
    except (AppException, NotFoundError) as e:
        await db.rollback()
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("publish job failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to publish job")


@router.post("/{job_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: str,
    payload: ApplicationCreateSchema,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    try:
        if current_user.get("user_type") != "CANDIDATE":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates can apply to jobs")

        candidate_user_id = current_user.get("sub")
        application = await JobService.create_application(db=db, job_id=job_id, candidate_user_id=candidate_user_id, payload=payload.model_dump(exclude_none=True))
        await db.commit()
        await db.refresh(application)
        return success_response(message="Applied successfully", data=ApplicationReadSchema.model_validate(application).model_dump())
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
