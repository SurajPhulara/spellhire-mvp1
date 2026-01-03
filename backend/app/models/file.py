# backend/app/models/file.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import FileType, UserType


class File(Base):
    """
    File storage metadata. Stores information about uploaded files.
    Files can be uploaded by candidates or employers.
    """
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(SQLEnum(FileType), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    file_url = Column(String(500), nullable=False)
    uploaded_by = Column(SQLEnum(UserType), nullable=False)  # "CANDIDATE" or "EMPLOYER"
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relations (one will be null based on uploaded_by)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=True)
    employer_id = Column(UUID(as_uuid=True), ForeignKey("employer_profiles.id", ondelete="CASCADE"), nullable=True)
    candidate = relationship("CandidateProfile", back_populates="files")
    employer = relationship("EmployerProfile", back_populates="files")