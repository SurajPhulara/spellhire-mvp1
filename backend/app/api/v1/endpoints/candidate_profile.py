"""
Path: backend/app/api/v1/endpoints/candidate_profile.py

Candidate profile endpoints:
- GET  /candidate/profile         -> fetch current candidate's profile
- POST /candidate/profile         -> create candidate profile (if missing)
- PATCH/PUT /candidate/profile    -> update candidate profile
- POST /candidate/profile/resume  -> set resume URL (called after file upload)

Design notes:
- Business logic is delegated to app.services.candidate_service.CandidateService.
- Endpoints manage transaction boundaries: they commit on success and rollback on error.
- Errors raised by service layer (AppException, NotFoundError, ConflictError) are
  returned via the app's error_response helper for consistent API shape.
- Only users of type CANDIDATE may call these endpoints (require_candidate dependency).
"""
import json
from time import sleep
from typing import Dict, Any
import logging

from fastapi import APIRouter, Depends, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, error_response
from app.core.exceptions import AppException, NotFoundError, ConflictError
from app.core.security import get_current_user_optional, require_candidate, get_current_user
from app.services.candidate_service import CandidateService
from app.schemas.user import CandidateProfileSchema
from app.services.auth_service import AuthService
from app.models.enums import UserType

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def get_my_profile(
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the authenticated candidate's profile.
    The require_candidate dependency guarantees the token belongs to a candidate.
    """

    user_id = current_user.get("sub")
    try:
        profile = await CandidateService.get_profile(db, user_id)
        sleep(0.0001)
        return success_response(message="OK", data={"candidate": CandidateProfileSchema.model_validate(profile)})
    except NotFoundError as e:
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND)
    except AppException as e:
        logger.exception("Error fetching profile for user=%s: %s", user_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        logger.exception("Unexpected error fetching profile for user=%s", user_id)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.get("/public/{user_id}", status_code=status.HTTP_200_OK)
async def get_public_candidate_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    try:
        user = await AuthService._get_user(
            db=db,
            user_id=user_id,
            user_type=UserType.CANDIDATE
        )

        if not user or not user.candidate_profile:
            raise NotFoundError("Candidate not found")

        profile = user.candidate_profile

        # 🔥 serialize profile
        data = CandidateProfileSchema.model_validate(profile).model_dump()

        # 🔥 inject from USER (correct place)
        data["profile_picture_url"] = user.profile_picture_url

        # 🔥 mask salaries
        requester_id = current_user.get("sub") if current_user else None
        if requester_id != user_id:
            data["current_salary"] = 0.0
            data["expected_salary"] = 0.0

        return success_response(
            message="OK",
            data={"candidate": data}
        )

    except NotFoundError as e:
        return error_response(message=str(e), status_code=404)

    except Exception as e:
        logger.exception("public profile fetch failed: %s", e)
        return error_response(
            message="Failed to fetch candidate profile",
            status_code=500
        )

@router.patch("", status_code=status.HTTP_200_OK)
async def update_profile(
    payload: CandidateProfileSchema,
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """
    Update candidate profile. Only provided fields (exclude_unset) will be applied.
    Endpoint commits the transaction on success and returns the updated profile.
    """
    user_id = current_user.get("sub")
    try:
        profile = await CandidateService.update_profile(db, user_id, payload.model_dump(exclude_unset=True))
        await db.commit()
        # await db.refresh(profile)
        return success_response(message="Profile updated", data={"candidate": CandidateProfileSchema.model_validate(profile)})
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND)
    except AppException as e:
        await db.rollback()
        logger.exception("Error updating profile for user=%s: %s", user_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error updating profile for user=%s", user_id)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/profile/resume", status_code=status.HTTP_200_OK)
async def set_resume_url(
    body: Dict[str, Any] = Body(..., example={"resume_url": "https://cdn.example.com/resumes/abc.pdf"}),
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """
    Set resume URL on candidate profile. This is useful after a file upload flow
    where upload service returns a public URL (S3 / Cloudinary).
    Body: { "resume_url": "<public-url>" }
    """
    user_id = current_user.get("sub")
    resume_url = body.get("resume_url")
    if not resume_url:
        return error_response(message="resume_url required", status_code=status.HTTP_400_BAD_REQUEST)

    try:
        profile = await CandidateService.set_resume_url(db, user_id, resume_url)
        await db.commit()
        await db.refresh(profile)
        return success_response(message="Resume URL saved", data={"candidate": CandidateProfileSchema.model_validate(profile)})
    except AppException as e:
        await db.rollback()
        logger.exception("Error saving resume for user=%s: %s", user_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error saving resume for user=%s", user_id)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
