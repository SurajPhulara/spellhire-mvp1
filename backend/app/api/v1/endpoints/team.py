"""Team endpoints: list and invite organization EmployerProfiles."""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AppException, ConflictError, NotFoundError
from app.core.responses import error_response, success_response
from app.core.security import require_recruiter
from app.schemas.team import (
    TeamInviteAcceptSchema,
    TeamMemberCreateSchema,
    TeamMemberSchema,
    TeamMembersResponseSchema,
)
from app.services.team_service import TeamService

logger = logging.getLogger(__name__)
router = APIRouter()


def _member_payload(profile) -> dict:
    return TeamMemberSchema.model_validate(profile).model_dump()


@router.get("", status_code=status.HTTP_200_OK)
async def list_team(
    current_user: dict = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.get("sub")
    try:
        members = await TeamService.list_members(db, user_id)
        data = TeamMembersResponseSchema(members=members)
        return success_response(message="OK", data=data.model_dump())
    except NotFoundError as e:
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND)
    except AppException as e:
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        logger.exception("list team failed: %s", e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("", status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    payload: TeamMemberCreateSchema,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.get("sub")
    try:
        member = await TeamService.invite_member(db, user_id, payload, background_tasks=background_tasks)
        await db.commit()
        await db.refresh(member)
        return success_response(
            message="Team member invited",
            data={"member": _member_payload(member)},
            status_code=status.HTTP_201_CREATED,
        )
    except ConflictError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_409_CONFLICT, errors=e.details)
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        await db.rollback()
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("invite team member failed: %s", e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.get("/invite/{token}", status_code=status.HTTP_200_OK)
async def get_team_invitation(token: str, db: AsyncSession = Depends(get_db)):
    try:
        member = await TeamService.get_invitation(db, token)
        return success_response(message="OK", data={"member": _member_payload(member)})
    except NotFoundError as e:
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND)
    except AppException as e:
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        logger.exception("get invitation failed: %s", e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/invite/{token}/accept", status_code=status.HTTP_200_OK)
async def accept_team_invitation(
    token: str,
    payload: TeamInviteAcceptSchema = TeamInviteAcceptSchema(),
    db: AsyncSession = Depends(get_db),
):
    try:
        member = await TeamService.accept_invitation(db, token, payload)
        await db.commit()
        await db.refresh(member)
        return success_response(message="Invitation accepted", data={"member": _member_payload(member)})
    except ConflictError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_409_CONFLICT, errors=e.details)
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        await db.rollback()
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("accept invitation failed: %s", e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/invite/{token}/reject", status_code=status.HTTP_200_OK)
async def reject_team_invitation(token: str, db: AsyncSession = Depends(get_db)):
    try:
        member = await TeamService.reject_invitation(db, token)
        await db.commit()
        await db.refresh(member)
        return success_response(message="Invitation rejected", data={"member": _member_payload(member)})
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        await db.rollback()
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("reject invitation failed: %s", e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
