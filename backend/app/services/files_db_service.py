# backend/app/services/files_db_service.py
"""
DB helpers for `File` records.

 - create_file_record(db, upload_result, candidate_id=None, employer_id=None)
 - delete_file_records_by_url(db, file_url)
 - delete_existing_profile_picture_records(db, candidate_id=None, employer_id=None)
"""
from typing import Optional, List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.file import File
from app.models.enums import FileType
import logging

logger = logging.getLogger(__name__)


class FilesDBService:
    @staticmethod
    async def create_file_record(
        db: AsyncSession,
        upload_result: dict,
        *,
        candidate_id: Optional[str] = None,
        employer_id: Optional[str] = None,
    ) -> File:
        file_row = File(
            filename=upload_result["filename"],
            original_name=upload_result["original_name"],
            file_type=upload_result["file_type"].upper(),  # e.g. "resume" or "profile_picture"
            file_size=upload_result["file_size"],
            mime_type=upload_result["mime_type"],
            file_url=upload_result["file_url"],
            uploaded_by="CANDIDATE" if candidate_id else "EMPLOYER" if employer_id else "SYSTEM",
            candidate_id=candidate_id,
            employer_id=employer_id,
        )
        db.add(file_row)
        await db.flush()
        return file_row

    @staticmethod
    async def delete_file_records_by_url(db: AsyncSession, file_url: str) -> int:
        """Delete DB file rows (returns number deleted)"""
        stmt = delete(File).where(File.file_url == file_url)
        res = await db.execute(stmt)
        # SQLAlchemy delete returns rowcount on result; use res.rowcount if available
        try:
            return res.rowcount or 0
        except Exception:
            return 0

    @staticmethod
    async def get_profile_picture_records(db: AsyncSession, candidate_id: Optional[str] = None, employer_id: Optional[str] = None) -> List[File]:
        stmt = select(File).where(File.file_type == "PROFILE_PICTURE")
        if candidate_id:
            stmt = stmt.where(File.candidate_id == candidate_id)
        if employer_id:
            stmt = stmt.where(File.employer_id == employer_id)
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def delete_existing_profile_picture_records(db: AsyncSession, candidate_id: Optional[str] = None, employer_id: Optional[str] = None) -> int:
        recs = await FilesDBService.get_profile_picture_records(db, candidate_id=candidate_id, employer_id=employer_id)
        count = 0
        for r in recs:
            await db.delete(r)
            count += 1
        await db.flush()
        return count
