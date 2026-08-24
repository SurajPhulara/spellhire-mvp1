import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_candidate, require_recruiter
from app.core.database import get_db
from app.services.application_service import ApplicationService
from app.core.responses import success_response
from app.core.exceptions import NotFoundError, AppException
from app.schemas.applications import (
    ApplicationTimelineResponseSchema,
    AppliedJobsResponse,
    EmployerJobApplicationsBoardResponseSchema,
    MoveApplicationStageRequestSchema,
    UpdatePipelineRequestSchema,
    UpdatePipelineResponseSchema,
    UpdateApplicationNotesRequestSchema,
    UpdateApplicationNotesResponseSchema,
)
from app.services.job_service import JobService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/job/{job_id}/board", status_code=status.HTTP_200_OK)
async def get_job_applications_board(
    job_id: str,
    current_user: dict = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    try:
        await JobService.get_job_employer(db=db, job_id=job_id, user_id=current_user.get("sub"))
        data = await ApplicationService.get_job_applications_board(db=db, job_id=job_id)

        return success_response(
            message="OK",
            data=EmployerJobApplicationsBoardResponseSchema.model_validate(data).model_dump(),
        )

    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        logger.exception("get job applications board failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch applications board")


@router.patch("/job/{job_id}/pipeline", status_code=status.HTTP_200_OK)
async def update_job_pipeline(
    job_id: str,
    payload: UpdatePipelineRequestSchema,
    current_user: dict = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    try:
        await JobService.get_job_employer(db=db, job_id=job_id, user_id=current_user.get("sub"))
        pipeline_stages = await JobService.update_job_pipeline(
            db=db,
            job_id=job_id,
            stages=payload.stages,
        )
        await db.commit()

        return success_response(
            message="Pipeline updated",
            data=UpdatePipelineResponseSchema(
                pipeline_stages=pipeline_stages
            ).model_dump(),
        )
    except NotFoundError as e:
        await db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except AppException as e:
        await db.rollback()
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("update job pipeline failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update pipeline")


@router.patch("/job/{job_id}/application/{application_id}/stage", status_code=status.HTTP_200_OK)
async def move_application_stage(
    job_id: str,
    application_id: str,
    payload: MoveApplicationStageRequestSchema,
    current_user: dict = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    try:
        await JobService.get_job_employer(db=db, job_id=job_id, user_id=current_user.get("sub"))
        changed_by_id = current_user.get("sub")

        app = await ApplicationService.move_application_stage(
            db=db,
            job_id=job_id,
            application_id=application_id,
            new_stage_id=payload.stage_id,
            changed_by_id=changed_by_id,
        )

        await db.commit()

        return success_response(
            message="Stage updated",
            data={
                "application_id": str(app.id),
                "current_stage_id": app.current_stage_id,
                "stage_updated_at": app.stage_updated_at,
            },
        )

    except NotFoundError as e:
        await db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except AppException as e:
        await db.rollback()
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("move application stage failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to move application")


@router.patch("/job/{job_id}/application/{application_id}/notes", status_code=status.HTTP_200_OK)
async def update_application_notes(
    job_id: str,
    application_id: str,
    payload: UpdateApplicationNotesRequestSchema,
    current_user: dict = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    try:
        await JobService.get_job_employer(db=db, job_id=job_id, user_id=current_user.get("sub"))
        app = await ApplicationService.update_application_notes(
            db=db,
            job_id=job_id,
            application_id=application_id,
            notes=payload.notes,
        )
        await db.commit()

        return success_response(
            message="Notes updated",
            data=UpdateApplicationNotesResponseSchema(
                application_id=app.id,
                notes=app.notes,
                last_updated_at=app.last_updated_at,
            ).model_dump(),
        )

    except NotFoundError as e:
        await db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.exception("update application notes failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update notes")


@router.get("", status_code=status.HTTP_200_OK)
async def get_applied_jobs(
    offset: int = 0,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    try:
        candidate_user_id = current_user.get("sub")
        limit = 10

        applications, total, stats = await ApplicationService.get_applied_jobs(
            db=db,
            candidate_user_id=candidate_user_id,
            limit=limit,
            offset=offset
        )

        meta = {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_next": offset + limit < total,
            "has_prev": offset > 0,
        }

        return success_response(
            message="OK",
            data=AppliedJobsResponse(
                applications=applications,
                stats=stats,
            ).model_dump(),
            meta=meta
        )

    except Exception as e:
        logger.exception("get applied jobs failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch applied jobs")


@router.get("/{application_id}", status_code=status.HTTP_200_OK)
async def get_application_timeline(
    application_id: str,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    try:
        candidate_user_id = current_user.get("sub")

        timeline = await ApplicationService.get_application_timeline(
            db=db,
            candidate_user_id=candidate_user_id,
            application_id=application_id,
        )

        return success_response(
            message="OK",
            data=ApplicationTimelineResponseSchema.model_validate(timeline).model_dump(),
        )

    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("get application timeline failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch application timeline")