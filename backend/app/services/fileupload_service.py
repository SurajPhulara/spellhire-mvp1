# backend/app/services/file_upload.py
# File Upload Service - Handles file uploads and deletions
import os
import uuid
from typing import Optional, Tuple
from pathlib import Path
import mimetypes
from PIL import Image
import logging

from fastapi import UploadFile
from app.core.config import settings
from app.core.exceptions import FileUploadError

logger = logging.getLogger(__name__)


class FileUploadService:
    """Service for handling file uploads with multiple storage backends"""
    
    def __init__(self):
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_types = settings.allowed_file_types_list
    
    def validate_file(self, file: UploadFile) -> Tuple[bool, Optional[str]]:
        """Validate uploaded file"""
        # Check file size
        if hasattr(file.file, 'seek') and hasattr(file.file, 'tell'):
            file.file.seek(0, 2)  # Seek to end
            size = file.file.tell()
            file.file.seek(0)  # Reset to beginning
            
            if size > self.max_file_size:
                return False, f"File too large. Maximum size: {self.max_file_size / (1024*1024):.1f}MB"
        
        # Check MIME type
        if file.content_type not in self.allowed_types:
            return False, f"File type not allowed. Allowed types: {', '.join(self.allowed_types)}"
        
        return True, None
    
    def generate_filename(self, original_filename: str, file_type: str) -> str:
        """Generate unique filename"""
        file_extension = Path(original_filename).suffix.lower()
        unique_id = str(uuid.uuid4())
        return f"{file_type}_{unique_id}{file_extension}"
    
    async def upload_file(
        self,
        file: UploadFile,
        file_type: str,
        user_id: str,
        resize_image: Optional[Tuple[int, int]] = None
    ) -> dict:
        """Upload file to configured storage backend"""
        # Validate file
        is_valid, error_msg = self.validate_file(file)
        if not is_valid:
            raise FileUploadError(error_msg)
        
        try:
            # Generate unique filename
            filename = self.generate_filename(file.filename, file_type)
            
            # Read file content
            content = await file.read()
            
            # Resize image if needed
            if resize_image and file.content_type.startswith('image/'):
                content = self._resize_image(content, resize_image, file.content_type)
            
            # Upload based on configured backend
            if settings.CLOUDINARY_CLOUD_NAME:
                file_url = await self._upload_to_cloudinary(content, filename, file.content_type)
            elif settings.AWS_BUCKET_NAME:
                file_url = await self._upload_to_s3(content, filename, file.content_type)
            else:
                file_url = await self._upload_to_local(content, filename)
            
            return {
                "filename": filename,
                "original_name": file.filename,
                "file_type": file_type,
                "file_size": len(content),
                "mime_type": file.content_type,
                "file_url": file_url,
                "user_id": user_id
            }
            
        except Exception as e:
            logger.error(f"File upload error: {e}")
            raise FileUploadError(f"Failed to upload file: {str(e)}")
    
    def _resize_image(self, content: bytes, size: Tuple[int, int], mime_type: str) -> bytes:
        """Resize image to specified dimensions"""
        try:
            from io import BytesIO
            
            # Open image
            image = Image.open(BytesIO(content))
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            
            # Resize with aspect ratio preservation
            image.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = BytesIO()
            format_map = {
                'image/jpeg': 'JPEG',
                'image/png': 'PNG',
                'image/gif': 'GIF'
            }
            image_format = format_map.get(mime_type, 'JPEG')
            image.save(output, format=image_format, quality=85, optimize=True)
            
            return output.getvalue()
            
        except Exception as e:
            logger.warning(f"Image resize failed: {e}")
            return content  # Return original if resize fails
    
    async def _upload_to_cloudinary(self, content: bytes, filename: str, mime_type: str) -> str:
        """Upload file to Cloudinary"""
        try:
            import cloudinary
            import cloudinary.uploader
            from io import BytesIO
            
            # Configure Cloudinary
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
            
            # Determine resource type
            resource_type = "image" if mime_type.startswith('image/') else "raw"
            
            # Upload file
            result = cloudinary.uploader.upload(
                BytesIO(content),
                public_id=filename,
                resource_type=resource_type,
                use_filename=True,
                unique_filename=False,
                type="upload"
            )
            
            return result['secure_url']
            
        except Exception as e:
            logger.error(f"Cloudinary upload error: {e}")
            raise FileUploadError("Failed to upload to Cloudinary")
    
    async def _upload_to_s3(self, content: bytes, filename: str, mime_type: str) -> str:
        """Upload file to AWS S3"""
        try:
            import boto3
            from io import BytesIO
            
            # Create S3 client
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            
            # Upload file
            s3_client.upload_fileobj(
                BytesIO(content),
                settings.AWS_BUCKET_NAME,
                filename,
                ExtraArgs={
                    'ContentType': mime_type,
                    'ACL': 'public-read'
                }
            )
            
            # Return public URL
            return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
            
        except Exception as e:
            logger.error(f"S3 upload error: {e}")
            raise FileUploadError("Failed to upload to S3")
    
    async def _upload_to_local(self, content: bytes, filename: str) -> str:
        """Upload file to local storage"""
        try:
            # Create uploads directory if it doesn't exist
            upload_dir = Path("uploads")
            upload_dir.mkdir(exist_ok=True)
            
            # Write file
            file_path = upload_dir / filename
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Return relative URL (assumes static file serving is configured)
            return f"/uploads/{filename}"
            
        except Exception as e:
            logger.error(f"Local upload error: {e}")
            raise FileUploadError("Failed to upload file locally")
    
    async def delete_file(self, file_url: str) -> bool:
        """Delete file from storage"""
        try:
            if settings.CLOUDINARY_CLOUD_NAME and "cloudinary.com" in file_url:
                return await self._delete_from_cloudinary(file_url)
            elif settings.AWS_BUCKET_NAME and "amazonaws.com" in file_url:
                return await self._delete_from_s3(file_url)
            else:
                return await self._delete_from_local(file_url)
        except Exception as e:
            logger.error(f"File deletion error: {e}")
            return False
    
    async def _delete_from_cloudinary(self, file_url: str) -> bool:
        """Delete file from Cloudinary"""
        try:
            import cloudinary
            import cloudinary.uploader
            
            # Configure Cloudinary
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
            
            # Extract public ID from URL
            public_id = file_url.split('/')[-1].split('.')[0]
            
            # Delete file
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
            
        except Exception as e:
            logger.error(f"Cloudinary deletion error: {e}")
            return False
    
    async def _delete_from_s3(self, file_url: str) -> bool:
        """Delete file from AWS S3"""
        try:
            import boto3
            
            # Create S3 client
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            
            # Extract key from URL
            key = file_url.split('/')[-1]
            
            # Delete file
            s3_client.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=key)
            return True
            
        except Exception as e:
            logger.error(f"S3 deletion error: {e}")
            return False
    
    async def _delete_from_local(self, file_url: str) -> bool:
        """Delete file from local storage"""
        try:
            # Extract filename from URL
            filename = file_url.split('/')[-1]
            file_path = Path("uploads") / filename
            
            if file_path.exists():
                file_path.unlink()
                return True
            return False
            
        except Exception as e:
            logger.error(f"Local deletion error: {e}")
            return False


# Global file upload service instance
file_upload_service = FileUploadService()
