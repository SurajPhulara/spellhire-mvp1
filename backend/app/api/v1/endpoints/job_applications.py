


import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_candidate
from app.core.database import get_db
from app.services.application_service import ApplicationService
from app.core.responses import success_response


logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("", status_code=status.HTTP_200_OK)
async def get_applied_jobs(
    offset: int = 0,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    try:
        candidate_user_id = current_user.get("sub")
        limit = 10

        applications, total = await ApplicationService.get_applied_jobs(
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
            data={"applications": applications},
            meta=meta
        )

    except Exception as e:
        logger.exception("get applied jobs failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch applied jobs")



        