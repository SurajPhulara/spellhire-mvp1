# app/models/organization.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Date, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import CompanySize


class Organization(Base):
    """
    Organization/Company model for employers.
    Employers belong to organizations and post jobs on behalf of organizations.
    """
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), default="", nullable=False)
    description = Column(String, default="", nullable=True)
    industry = Column(String(255), default="", nullable=True)
    company_size = Column(SQLEnum(CompanySize), default=CompanySize.SIZE_1_10, nullable=True)
    headquarters_location = Column(String(255), default="", nullable=True)
    website = Column(String(500), default="", nullable=True)
    contact_email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(50), default="", nullable=True)
    additional_locations = Column(ARRAY(String), default=[], nullable=True)
    founded_on = Column(Date, nullable=True)
    mission = Column(String, default="", nullable=True)
    benefits_overview = Column(String, default="", nullable=True)
    company_culture = Column(String, default="", nullable=True)
    logo_url = Column(String(500), default="", nullable=True)
    is_profile_complete = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employers = relationship("EmployerProfile", back_populates="organization")
    jobs = relationship("Job", back_populates="organization", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="organization", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_organizations_name", "name"),
        Index("ix_organizations_is_active", "is_active"),
    )