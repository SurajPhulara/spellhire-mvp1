"""
Path: backend/app/api/v1/endpoints/employer_profile.py

Employer profile endpoints:
- GET  /employer/profile                -> fetch current employer's profile
- POST /employer/profile                -> create employer profile (if missing)
- PATCH /employer/profile               -> update employer profile
- POST /employer/attach-organization    -> attach employer to an organization (creates profile if missing)
- POST /employer/permission             -> toggle a simple permission flag on the profile

Design notes:
- Business logic lives in app.services.employer_service. Endpoints only manage
  request/response shapes and transaction boundaries (commit/rollback).
- Exceptions from the service layer (NotFoundError, ConflictError, AppException)
  are converted to consistent API responses using app.core.responses helpers.
- Authentication/authorization is enforced via require_employer dependency (token must belong to an employer).
- All endpoints return the platform-wide success_response / error_response shape.
- Caller (endpoint) is responsible for committing DB transactions on success so
  rollback can be done on error for a clean state.
"""

from typing import Dict, Any
import logging

from fastapi import APIRouter, Depends, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, error_response
from app.core.exceptions import AppException, NotFoundError, ConflictError
from app.core.security import require_employer
from app.services.employer_service import EmployerService
from app.schemas.user import EmployerProfileSchema

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def get_my_profile(
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the authenticated employer's profile.
    The require_employer dependency guarantees the token belongs to an employer.
    """
    user_id = current_user.get("sub")
    try:
        profile = await EmployerService.get_employer_profile(db, user_id)
        return success_response(message="OK", data={"employer": EmployerProfileSchema.model_validate(profile)})
    except NotFoundError as e:
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND)
    except AppException as e:
        logger.exception("Error fetching employer profile for user=%s: %s", user_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        logger.exception("Unexpected error fetching employer profile for user=%s: %s", user_id, e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @router.post("", status_code=status.HTTP_201_CREATED)
# async def create_profile(
#     payload: EmployerProfileSchema,
#     current_user: dict = Depends(require_employer),
#     db: AsyncSession = Depends(get_db),
# ):
#     """
#     Create employer profile for authenticated user.
#     Body fields are optional (flexible). Endpoint commits on success.
#     """
#     user_id = current_user.get("sub")
#     try:
#         profile = await EmployerService.create_employer_profile(db, user_id, payload.dict(exclude_unset=True))
#         await db.commit()
#         await db.refresh(profile)
#         return success_response(
#             message="Employer profile created",
#             data={"employer": EmployerProfileSchema.model_validate(profile)},
#             status_code=status.HTTP_201_CREATED,
#         )
#     except ConflictError as e:
#         await db.rollback()
#         return error_response(message=str(e), status_code=status.HTTP_409_CONFLICT, errors=e.details)
#     except NotFoundError as e:
#         await db.rollback()
#         return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
#     except AppException as e:
#         await db.rollback()
#         logger.exception("Error creating employer profile for user=%s: %s", user_id, e)
#         return error_response(message=str(e), status_code=e.status_code, errors=e.details)
#     except Exception as e:
#         await db.rollback()
#         logger.exception("Unexpected error creating employer profile for user=%s: %s", user_id, e)
#         return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.patch("", status_code=status.HTTP_200_OK)
async def update_profile(
    payload: EmployerProfileSchema,
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Update existing employer profile. Only provided fields will be applied.
    Endpoint commits on success and returns updated profile.
    """
    user_id = current_user.get("sub")
    try:
        profile = await EmployerService.update_employer_profile(db, user_id, payload.dict(exclude_unset=True))
        await db.commit()
        await db.refresh(profile)
        return success_response(message="Employer profile updated", data={"employer": EmployerProfileSchema.model_validate(profile)})
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        await db.rollback()
        logger.exception("Error updating employer profile for user=%s: %s", user_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error updating employer profile for user=%s: %s", user_id, e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/attach-organization", status_code=status.HTTP_200_OK)
async def attach_organization(
    body: Dict[str, Any] = Body(..., example={"organization_id": "uuid-of-org"}),
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Attach an existing organization to the employer profile.
    If employer profile is missing, it will be created minimally and associated.
    Body: { "organization_id": "<uuid>" }
    """
    user_id = current_user.get("sub")
    org_id = body.get("organization_id")
    if not org_id:
        return error_response(message="organization_id required", status_code=status.HTTP_400_BAD_REQUEST)

    try:
        profile = await EmployerService.attach_organization_to_user(db, user_id, org_id)
        await db.commit()
        await db.refresh(profile)
        return success_response(message="Organization attached", data={"employer": EmployerProfileSchema.model_validate(profile)})
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        await db.rollback()
        logger.exception("Error attaching organization for user=%s: %s", user_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error attaching organization for user=%s: %s", user_id, e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/permission", status_code=status.HTTP_200_OK)
async def set_permission(
    body: Dict[str, Any] = Body(..., example={"permission_flag": "has_recruiter_permission", "value": True}),
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Toggle a boolean permission flag on the employer profile.
    Body: { "permission_flag": "<field_name>", "value": true/false }
    Note: permission_flag must be a valid boolean attribute on EmployerProfile (service validates).
    """
    user_id = current_user.get("sub")
    permission_flag = body.get("permission_flag")
    value = body.get("value")

    if not permission_flag or value is None:
        return error_response(message="permission_flag and value are required", status_code=status.HTTP_400_BAD_REQUEST)

    try:
        profile = await EmployerService.set_employer_permission(db, user_id, permission_flag, bool(value))
        await db.commit()
        await db.refresh(profile)
        return success_response(message="Permission updated", data={"employer": EmployerProfileSchema.model_validate(profile)})
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        await db.rollback()
        logger.exception("Error updating permission for user=%s: %s", user_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error updating permission for user=%s: %s", user_id, e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
