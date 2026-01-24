# backend/app/services/files_management_service.py
"""
FileUploadService - storage backend wrapper.

Supports:
 - Local disk
 - AWS S3
 - Cloudinary

Public API:
 - upload_file(UploadFile, file_type, user_id, resize_image=None) -> dict
 - delete_file(file_url) -> bool
"""
import uuid
from typing import Optional, Tuple
from pathlib import Path
from io import BytesIO
import logging

from fastapi import UploadFile
from PIL import Image

from app.core.config import settings
from app.core.exceptions import FileUploadError

logger = logging.getLogger(__name__)


class FileUploadService:
    def __init__(self):
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_types = settings.allowed_file_types_list

    def validate_file(self, file: UploadFile) -> Tuple[bool, Optional[str]]:
        """Check size and MIME type quickly (best-effort)."""
        try:
            if hasattr(file.file, "seek") and hasattr(file.file, "tell"):
                file.file.seek(0, 2)
                size = file.file.tell()
                file.file.seek(0)
                if size > self.max_file_size:
                    return False, f"File too large. Max {(self.max_file_size / (1024*1024)):.1f}MB"
        except Exception:
            # If file-like doesn't support tell, skip size check
            pass

        if file.content_type not in self.allowed_types:
            return False, f"File type not allowed. Allowed: {', '.join(self.allowed_types)}"
        return True, None

    def generate_filename(self, original_filename: str, file_type: str) -> str:
        ext = Path(original_filename).suffix.lower() or ""
        return f"{file_type}_{uuid.uuid4().hex}{ext}"

    async def upload_file(
        self,
        file: UploadFile,
        file_type: str,
        user_id: str,
        resize_image: Optional[Tuple[int, int]] = None
    ) -> dict:
        """Validate, optionally resize, and upload to configured backend."""
        is_valid, err = self.validate_file(file)
        if not is_valid:
            raise FileUploadError(err)

        filename = self.generate_filename(file.filename, file_type)
        content = await file.read()

        # optional resize (images only)
        if resize_image and file.content_type and file.content_type.startswith("image/"):
            content = self._resize_image(content, resize_image, file.content_type)

        try:
            if settings.CLOUDINARY_CLOUD_NAME:
                file_url = await self._upload_to_cloudinary(content, filename, file.content_type)
            elif settings.AWS_BUCKET_NAME:
                file_url = await self._upload_to_s3(content, filename, file.content_type)
            else:
                file_url = await self._upload_to_local(content, filename)
        except Exception as e:
            logger.exception("upload failed: %s", e)
            raise FileUploadError("Failed to upload file")

        return {
            "filename": filename,
            "original_name": file.filename,
            "file_type": file_type,
            "file_size": len(content),
            "mime_type": file.content_type,
            "file_url": file_url,
            "user_id": user_id,
        }

    def _resize_image(self, content: bytes, size: Tuple[int, int], mime_type: str) -> bytes:
        try:
            img = Image.open(BytesIO(content))
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGB")
            img.thumbnail(size, Image.Resampling.LANCZOS)
            out = BytesIO()
            fmt = {"image/jpeg": "JPEG", "image/png": "PNG", "image/gif": "GIF"}.get(mime_type, "JPEG")
            img.save(out, format=fmt, quality=85, optimize=True)
            return out.getvalue()
        except Exception as e:
            logger.warning("image resize failed, returning original: %s", e)
            return content

    async def _upload_to_cloudinary(self, content: bytes, filename: str, mime_type: str) -> str:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
            resource_type = "image" if mime_type and mime_type.startswith("image/") else "raw"
            res = cloudinary.uploader.upload(BytesIO(content), public_id=filename, resource_type=resource_type, use_filename=True, unique_filename=False)
            return res.get("secure_url") or res.get("url")
        except Exception as e:
            logger.exception("cloudinary upload error: %s", e)
            raise FileUploadError("Cloudinary upload failed")

    async def _upload_to_s3(self, content: bytes, filename: str, mime_type: str) -> str:
        try:
            import boto3
            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            s3.upload_fileobj(BytesIO(content), settings.AWS_BUCKET_NAME, filename, ExtraArgs={"ContentType": mime_type, "ACL": "public-read"})
            return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
        except Exception as e:
            logger.exception("s3 upload error: %s", e)
            raise FileUploadError("S3 upload failed")

    async def _upload_to_local(self, content: bytes, filename: str) -> str:
        try:
            upload_dir = Path("uploads")
            upload_dir.mkdir(parents=True, exist_ok=True)
            path = upload_dir / filename
            path.write_bytes(content)
            return f"/uploads/{filename}"
        except Exception as e:
            logger.exception("local upload error: %s", e)
            raise FileUploadError("Local upload failed")

    async def delete_file(self, file_url: str) -> bool:
        """Try to detect backend from URL and delete appropriately."""
        try:
            if not file_url:
                return True
            if settings.CLOUDINARY_CLOUD_NAME and "cloudinary" in file_url:
                return await self._delete_from_cloudinary(file_url)
            if settings.AWS_BUCKET_NAME and "amazonaws.com" in file_url:
                return await self._delete_from_s3(file_url)
            return await self._delete_from_local(file_url)
        except Exception as e:
            logger.exception("delete_file error: %s", e)
            return False

    async def _delete_from_cloudinary(self, file_url: str) -> bool:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
            # public_id typically last segment without extension
            public_id = Path(file_url).stem
            result = cloudinary.uploader.destroy(public_id, resource_type="image")
            return result.get("result") in ("ok", "deleted")
        except Exception as e:
            logger.exception("cloudinary delete error: %s", e)
            return False

    async def _delete_from_s3(self, file_url: str) -> bool:
        try:
            import boto3
            from urllib.parse import urlparse
            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            key = Path(urlparse(file_url).path).name
            s3.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=key)
            return True
        except Exception as e:
            logger.exception("s3 delete error: %s", e)
            return False

    async def _delete_from_local(self, file_url: str) -> bool:
        try:
            filename = Path(file_url).name
            path = Path("uploads") / filename
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception as e:
            logger.exception("local delete error: %s", e)
            return False


# global instance
file_upload_service = FileUploadService()
