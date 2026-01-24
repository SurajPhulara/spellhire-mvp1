"""
Path: backend/app/api/v1/endpoints/organization_profile.py

Organization endpoints:
- GET  /organization/{organization_id}   -> fetch organization by id
- GET  /organization/                    -> list/search organizations
- POST /organization/                    -> create organization
- PATCH/PUT /organization/{organization_id} -> update organization
- DELETE /organization/{organization_id} -> delete organization

Design notes:
- Business logic lives in app.services.organization_service. Endpoints only:
  - validate request shape (Pydantic schemas),
  - open DB transaction (via get_db dependency),
  - call service functions,
  - commit/rollback transactions,
  - convert SQLAlchemy models -> Pydantic schemas for HTTP response.
- Errors from service layer (NotFoundError, ConflictError, AppException) are
  converted to consistent API responses using app.core.responses helpers.
- Authentication/authorization is intentionally minimal here. If you want to
  restrict endpoints (e.g. only employers or admins), add a dependency like
  `current_user: dict = Depends(require_employer)` to the function signature.
- Keep endpoints small: service layer contains the real business logic.
"""

from typing import Optional, List, Dict, Any
import logging

from fastapi import APIRouter, Depends, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, error_response
from app.core.exceptions import AppException, NotFoundError, ConflictError
from app.services.organization_service import OrganizationService
from app.schemas.organization import OrganizationSchema
from app.core.security import require_employer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/list", status_code=status.HTTP_200_OK)
async def list_organizations(
    q: Optional[str] = Query(None, description="Search query (name or industry)"),
    limit: int = Query(20, ge=1, le=100, description="Limit"),
    offset: int = Query(0, ge=0, description="Offset"),
    db: AsyncSession = Depends(get_db),
):
    """
    List organizations. Optional `q` will search name and industry fields (ILIKE).
    Returns list of organizations (paged).
    """
    try:
        orgs = await OrganizationService.list_organizations(db, query=q, limit=limit, offset=offset)
        data = {"organizations": [OrganizationSchema.from_orm(o) for o in orgs]}
        return success_response(message="OK", data=data)
    except AppException as e:
        logger.exception("Error listing organizations: %s", e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        logger.exception("Unexpected error listing organizations: %s", e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.get("", status_code=status.HTTP_200_OK, summary="Get organization for current employer", )
async def get_my_organization(
    current_user: dict = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the organization associated with the currently authenticated employer.
    """
    try:
        user_id = current_user.get("sub")

        org = await OrganizationService.get_organization_for_user(db, user_id)

        return success_response(message="OK", data={"organization": OrganizationSchema.model_validate(org)}, )

    except NotFoundError as e:
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details, )

    except AppException as e:
        logger.exception("Error fetching organization for user %s: %s", user_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details, )

    except Exception as e:
        logger.exception("Unexpected error fetching organization for user %s: %s", user_id, e, )
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, )


@router.get("/{organization_id}", status_code=status.HTTP_200_OK)
async def get_organization(
    organization_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get organization by id.
    """
    try:
        org = await OrganizationService.get_organization(db, organization_id)
        return success_response(message="OK", data={"organization": OrganizationSchema.from_orm(org)})
    except NotFoundError as e:
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        logger.exception("Error fetching organization %s: %s", organization_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        logger.exception("Unexpected error fetching organization %s: %s", organization_id, e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @router.post("", status_code=status.HTTP_201_CREATED)
# async def create_organization(
#     payload: OrganizationSchema,
#     db: AsyncSession = Depends(get_db),
# ):
#     """
#     Create a new organization.
#     - If contact_email provided and already exists -> ConflictError (handled by service).
#     - Endpoint commits the transaction on success.
#     """
#     try:
#         org = await OrganizationService.create_organization(db, payload.dict(exclude_unset=True))
#         await db.commit()
#         await db.refresh(org)
#         return success_response(
#             message="Organization created",
#             data={"organization": OrganizationSchema.from_orm(org)},
#             # some response helpers accept a status_code param; if yours does not, remove it.
#         )
#     except ConflictError as e:
#         await db.rollback()
#         return error_response(message=str(e), status_code=status.HTTP_409_CONFLICT, errors=e.details)
#     except AppException as e:
#         await db.rollback()
#         logger.exception("Error creating organization: %s", e)
#         return error_response(message=str(e), status_code=e.status_code, errors=e.details)
#     except Exception as e:
#         await db.rollback()
#         logger.exception("Unexpected error creating organization: %s", e)
#         return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.put("", status_code=status.HTTP_200_OK)
async def update_organization(
    payload: OrganizationSchema,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_employer),
):
    """
    Patch/update organization fields. Only provided fields are applied.
    Endpoint commits on success.
    """
    try:
        organization_id = current_user.get("organization_id")
        org = await OrganizationService.update_organization(db, organization_id, payload.model_dump(exclude_unset=True))
        await db.commit()
        await db.refresh(org)
        return success_response(message="Organization updated", data={"organization": OrganizationSchema.model_validate(org)})
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        await db.rollback()
        logger.exception("Error updating organization %s: %s", organization_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error updating organization %s: %s", organization_id, e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.delete("/{organization_id}", status_code=status.HTTP_200_OK)
async def delete_organization(
    organization_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an organization (hard delete). Caller should consider soft-delete instead.
    Endpoint commits on success.
    """
    try:
        await OrganizationService.delete_organization(db, organization_id)
        await db.commit()
        return success_response(message="Organization deleted", data={"organization_id": organization_id})
    except NotFoundError as e:
        await db.rollback()
        return error_response(message=str(e), status_code=status.HTTP_404_NOT_FOUND, errors=e.details)
    except AppException as e:
        await db.rollback()
        logger.exception("Error deleting organization %s: %s", organization_id, e)
        return error_response(message=str(e), status_code=e.status_code, errors=e.details)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error deleting organization %s: %s", organization_id, e)
        return error_response(message="Internal server error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
