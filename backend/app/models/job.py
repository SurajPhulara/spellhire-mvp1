# app/models/job.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Index, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import JobType, WorkMode, ExperienceLevel, JobStatus, ApplicationStatus


class Job(Base):
    """
    Job posting model. Jobs are created by employers and belong to organizations.
    """
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_by_employer_id = Column(UUID(as_uuid=True), ForeignKey("employer_profiles.id"), nullable=False)
    collaborator_employer_ids = Column(ARRAY(String), default=[], nullable=True)
    # metadata = Column(JSON, default={}, nullable=True)  # Future-proofing

    # Basic job information
    title = Column(String(255), default="", nullable=False)
    description = Column(String, default="", nullable=True)
    requirements = Column(String, default="", nullable=True)
    responsibilities = Column(String, default="", nullable=True)
    vacancies = Column(Integer, default=1, nullable=True)

    # Job details
    job_type = Column(SQLEnum(JobType), nullable=False)
    work_mode = Column(SQLEnum(WorkMode), nullable=False)
    experience_level = Column(SQLEnum(ExperienceLevel), nullable=False)
    required_skills = Column(ARRAY(String), default=[], nullable=True)
    preferred_skills = Column(ARRAY(String), default=[], nullable=True)
    minimum_years_experience = Column(Integer, default=0, nullable=True)

    # Location - stored as JSON: {city, state, country}
    location = Column(JSON, default={}, nullable=True)

    # Compensation
    salary_min = Column(Float, default=0, nullable=True)
    salary_max = Column(Float, default=0, nullable=True)
    salary_currency = Column(String(10), default="INR", nullable=False)
    salary_period = Column(String(50), default="yearly", nullable=False)

    # Categories & details
    category = Column(String(255), default="", nullable=True)
    department = Column(String(255), default="", nullable=True)
    benefits = Column(ARRAY(String), default=[], nullable=True)

    # Application details
    application_deadline = Column(DateTime(timezone=True), nullable=True)
    application_url = Column(String(500), default="", nullable=True)

    # Status & metadata
    status = Column(SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    application_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="jobs")
    created_by = relationship("EmployerProfile", back_populates="created_jobs", foreign_keys=[created_by_employer_id])
    pipeline = relationship("Pipeline", back_populates="job", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_jobs_organization_id", "organization_id"),
        Index("ix_jobs_created_by_employer_id", "created_by_employer_id"),
        Index("ix_jobs_status_published_at", "status", "published_at"),
        Index("ix_jobs_category_status", "category", "status"),
        Index("ix_jobs_job_type_work_mode", "job_type", "work_mode"),
    )


class Pipeline(Base):
    """
    Recruitment pipeline for a job. Defines stages for application tracking.
    Stages stored as JSON: [{id, name, order, color, isDefault}]
    """
    __tablename__ = "pipelines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("employer_profiles.id"), nullable=False)
    stages = Column(JSON, default=[], nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="pipeline")
    created_by = relationship("EmployerProfile", back_populates="created_pipelines")
    applications = relationship("Application", back_populates="pipeline", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_pipelines_job_id", "job_id"),
    )


class Application(Base):
    """
    Candidate application for a job. Tracks application status and pipeline stage.
    """
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False)
    current_stage_id = Column(String(255), nullable=True)  # Stage ID from pipeline JSON

    # Application details
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    cover_letter = Column(String, default="", nullable=True)
    resume_url = Column(String(500), default="", nullable=True)
    notes = Column(String, nullable=True)

    # Tracking
    applied_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    last_updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    stage_updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Rejection/hire details
    rejection_reason = Column(String, nullable=True)
    rejection_feedback = Column(String, nullable=True)
    hired_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("CandidateProfile", back_populates="applications")
    pipeline = relationship("Pipeline", back_populates="applications")
    stage_history = relationship("ApplicationStageHistory", back_populates="application", cascade="all, delete-orphan")
    interview_assignments = relationship("InterviewAssignment", back_populates="application", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_applications_job_id", "job_id"),
        Index("ix_applications_candidate_id", "candidate_id"),
        Index("ix_applications_status", "status"),
        Index("ix_applications_current_stage_id", "current_stage_id"),
        Index("ix_applications_job_candidate_unique", "job_id", "candidate_id", unique=True),
    )


class ApplicationStageHistory(Base):
    """
    Tracks stage transitions for applications in the pipeline.
    """
    __tablename__ = "application_stage_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    from_stage_id = Column(String(255), nullable=True)
    to_stage_id = Column(String(255), nullable=False)
    changed_by_id = Column(String(255), nullable=True)  # Employer ID who moved the application
    changed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="stage_history")

    __table_args__ = (
        Index("ix_application_stage_history_application_id", "application_id"),
    )


class InterviewAssignment(Base):
    """
    Interview scheduling and management for applications.
    """
    __tablename__ = "interview_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), nullable=False)  # Reference for reporting
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    interviewer_id = Column(UUID(as_uuid=True), ForeignKey("employer_profiles.id"), nullable=False)
    interview_type = Column(String(100), nullable=False)  # 'technical', 'hr', 'manager', 'cultural'
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, default=60, nullable=True)
    location = Column(String(500), nullable=True)  # 'virtual', office address, etc.
    meeting_link = Column(String(500), nullable=True)
    notes = Column(String, nullable=True)
    feedback = Column(String, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-10 scale
    status = Column(String(50), default="scheduled", nullable=False)  # 'scheduled', 'completed', 'cancelled', 'no_show'
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="interview_assignments")
    interviewer = relationship("EmployerProfile", back_populates="interview_assignments")

    __table_args__ = (
        Index("ix_interview_assignments_application_id", "application_id"),
        Index("ix_interview_assignments_interviewer_id", "interviewer_id"),
        Index("ix_interview_assignments_scheduled_at", "scheduled_at"),
    )