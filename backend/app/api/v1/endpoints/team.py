# hiring team
import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_recruiter
from app.core.responses import success_response
from app.core.exceptions import ConflictError, NotFoundError

from app.schemas.team import (
    TeamMemberCreate,
    TeamMemberResponse,
)

from app.services.team_service import TeamService


logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
)
async def list_team_members(
    current_user: dict = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    try:
        employer_user_id = current_user.get("sub")

        employer = await TeamService.get_employer_profile(
            db,
            employer_user_id,
        )

        members = await TeamService.list_members(
            db,
            employer.organization_id,
        )

        return success_response(
            message="OK",
            data={
                "members": [
                    TeamMemberResponse.model_validate(member).model_dump()
                    for member in members
                ]
            },
        )

    except NotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except Exception:
        logger.exception("list team members failed")

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch team members",
        )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_team_member(
    payload: TeamMemberCreate,
    current_user: dict = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    try:
        employer_user_id = current_user.get("sub")

        member = await TeamService.create_member(
            db,
            employer_user_id=employer_user_id,
            payload=payload,
        )

        await db.commit()
        await db.refresh(member)

        return success_response(
            message="Team member invited",
            data=TeamMemberResponse.model_validate(
                member
            ).model_dump(),
            status_code=status.HTTP_201_CREATED,
        )

    except (ConflictError, NotFoundError) as e:
        await db.rollback()

        raise HTTPException(
            status_code=getattr(e, "status_code", 400),
            detail=str(e),
        )

    except Exception:
        await db.rollback()

        logger.exception("create team member failed")

        raise HTTPException(
            status_code=500,
            detail="Failed to add team member",
        )