# backend/app/api/v1/endpoints/files_management.py
"""
SQLAlchemy-based file upload endpoints.

 - POST /resume
 - POST /profile-picture
 - POST /organization-logo
 - DELETE /resume
 - DELETE /profile-picture
 - DELETE /organization-logo
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user, require_candidate
from app.core.responses import success_response
from app.core.exceptions import FileUploadError

from app.services.files_management_service import file_upload_service
from app.services.files_db_service import FilesDBService

from app.models.user import User
from app.models.user import CandidateProfile, EmployerProfile
from app.models.organization import Organization
from app.services.auth_service import AuthService
from app.services.candidate_service import CandidateService
from app.services.employer_service import EmployerService
from app.services.organization_service import OrganizationService
from app.models.enums import FileType

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/resume", status_code=status.HTTP_200_OK)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id = current_user.get("sub")
        if current_user.get("user_type") != "CANDIDATE":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates may upload resumes")

        profile = await CandidateService.get_profile(db, user_id)

        # If existing resume_url -> delete storage + DB records (if any)
        if profile and profile.resume_url:
            try:
                await file_upload_service.delete_file(profile.resume_url)
            except Exception as e:
                logger.warning("failed to delete old resume from storage: %s", e)
            # Also clean any File DB rows pointing to that URL
            await FilesDBService.delete_file_records_by_url(db, profile.resume_url)

        # Upload new resume
        upload_result = await file_upload_service.upload_file(file=file, file_type="resume", user_id=user_id)

        # Persist: candidate_profile.resume_url + file record
        if profile:
            profile.resume_url = upload_result["file_url"]
            await db.flush()
        else:
            # create minimal profile and set resume_url
            new_profile = CandidateProfile(user_id=user_id, resume_url=upload_result["file_url"])
            db.add(new_profile)
            await db.flush()

        await FilesDBService.create_file_record(db, upload_result, candidate_id=str((profile or new_profile).id))
        await db.commit()
        return success_response(message="Resume uploaded", data=upload_result)

    except FileUploadError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("resume upload failed: %s", e)
        # best-effort cleanup
        try:
            if "upload_result" in locals() and upload_result.get("file_url"):
                await file_upload_service.delete_file(upload_result["file_url"])
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload resume")


@router.post("/profile-picture", status_code=status.HTTP_200_OK)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload profile picture. Single canonical URL stored on User.profile_picture_url.
    Also creates a `File` record and deletes previous picture from storage & DB.
    """
    try:
        user_id = current_user.get("sub")
        user_type = current_user.get("user_type")
        user = await AuthService._get_user(db, user_id=user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Delete previous profile picture (both storage and DB rows)
        if getattr(user, "profile_picture_url", None):
            try:
                await file_upload_service.delete_file(user.profile_picture_url)
            except Exception as e:
                logger.warning("failed to delete old user picture from storage: %s", e)
            await FilesDBService.delete_file_records_by_url(db, user.profile_picture_url)
            user.profile_picture_url = None
            await db.flush()

        # Upload new image (resize)
        upload_result = await file_upload_service.upload_file(file=file, file_type="profile_picture", user_id=user_id, resize_image=(400, 400))

        # Create DB file row (link to candidate/employer if possible)
        candidate_profile = None
        employer_profile = None
        if user_type == "CANDIDATE":
            candidate_profile = await CandidateService.get_profile(db, user_id)
        elif user_type == "EMPLOYER":
            employer_profile = await EmployerService.get_employer_profile(db, user_id)

        await FilesDBService.create_file_record(
            db,
            upload_result,
            candidate_id=str(candidate_profile.id) if candidate_profile else None,
            employer_id=str(employer_profile.id) if employer_profile else None,
        )

        # Persist canonical URL on User
        user.profile_picture_url = upload_result["file_url"]
        await db.flush()
        await db.commit()

        return success_response(message="Profile picture uploaded", data=upload_result)

    except FileUploadError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("profile picture upload failed: %s", e)
        try:
            if "upload_result" in locals() and upload_result.get("file_url"):
                await file_upload_service.delete_file(upload_result["file_url"])
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload profile picture")


@router.post("/organization-logo", status_code=status.HTTP_200_OK)
async def upload_organization_logo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id = current_user.get("sub")
        if current_user.get("user_type") != "EMPLOYER":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only employers may upload organization logo")

        employer_profile = await EmployerService.get_employer_profile(db, user_id)
        if not employer_profile or not employer_profile.organization_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer profile or organization missing")

        org = await OrganizationService.get_organization(db, employer_profile.organization_id)
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

        # Delete existing logo from storage & DB
        if getattr(org, "logo_url", None):
            try:
                await file_upload_service.delete_file(org.logo_url)
            except Exception as e:
                logger.warning("failed to delete old org logo from storage: %s", e)
            await FilesDBService.delete_file_records_by_url(db, org.logo_url)
            org.logo_url = None
            await db.flush()

        upload_result = await file_upload_service.upload_file(file=file, file_type=FileType.COMPANY_LOGO, user_id=user_id, resize_image=(300, 300))

        # Create file DB row and set org.logo_url
        await FilesDBService.create_file_record(db, upload_result, employer_id=str(employer_profile.id))
        org.logo_url = upload_result["file_url"]
        await db.flush()
        await db.commit()

        return success_response(message="Organization logo uploaded", data=upload_result)

    except FileUploadError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("org logo upload failed: %s", e)
        try:
            if "upload_result" in locals() and upload_result.get("file_url"):
                await file_upload_service.delete_file(upload_result["file_url"])
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload organization logo")


# -------------------------
# Delete endpoints
# -------------------------
@router.delete("/resume", status_code=status.HTTP_200_OK)
async def delete_resume(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        user_id = current_user.get("sub")
        if current_user.get("user_type") != "CANDIDATE":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only candidates may delete resume")

        profile = await CandidateService.get_profile(db, user_id)
        if not profile or not profile.resume_url:
            return success_response(message="No resume found", data={})

        try:
            await file_upload_service.delete_file(profile.resume_url)
        except Exception as e:
            logger.warning("failed to delete resume from storage: %s", e)
        await FilesDBService.delete_file_records_by_url(db, profile.resume_url)

        profile.resume_url = None
        await db.flush()
        await db.commit()
        return success_response(message="Resume deleted", data={})

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("resume deletion failed: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete resume")


@router.delete("/profile-picture", status_code=status.HTTP_200_OK)
async def delete_profile_picture(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        user_id = current_user.get("sub")
        user = await AuthService._get_user(db, user_id)
        if not user or not getattr(user, "profile_picture_url", None):
            return success_response(message="No profile picture found", data={})

        try:
            await file_upload_service.delete_file(user.profile_picture_url)
        except Exception as e:
            logger.warning("failed to delete user picture from storage: %s", e)

        await FilesDBService.delete_file_records_by_url(db, user.profile_picture_url)
        user.profile_picture_url = None
        await db.flush()
        await db.commit()
        return success_response(message="Profile picture deleted", data={})

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("profile picture deletion failed: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete profile picture")


@router.delete("/organization-logo", status_code=status.HTTP_200_OK)
async def delete_organization_logo(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        user_id = current_user.get("sub")
        if current_user.get("user_type") != "EMPLOYER":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only employers may delete org logo")

        employer_profile = await EmployerService.get_employer_profile(db, user_id)
        if not employer_profile or not employer_profile.organization_id:
            return success_response(message="No organization logo found", data={})

        org = await OrganizationService.get_organization(db, employer_profile.organization_id)
        if not org or not getattr(org, "logo_url", None):
            return success_response(message="No organization logo found", data={})

        try:
            await file_upload_service.delete_file(org.logo_url)
        except Exception as e:
            logger.warning("failed to delete org logo from storage: %s", e)
        await FilesDBService.delete_file_records_by_url(db, org.logo_url)
        org.logo_url = None
        await db.flush()
        await db.commit()
        return success_response(message="Organization logo deleted", data={})

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("organization logo deletion failed: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete organization logo")
