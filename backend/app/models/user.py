import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Index, Enum as SQLEnum, JSON, Date
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import AuthMethod, Gender, UserStatus, Role, JobType, WorkMode, EmployerRole


class User(Base):
    """
    Unified user table combining CandidateAuth and EmployerAuth.
    Emails are unique across the platform. Roles are stored in user_roles table.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Null for OAuth-only users
    provider = Column(SQLEnum(AuthMethod), default=AuthMethod.EMAIL, nullable=False)
    provider_id = Column(String(255), nullable=True)  # Google ID, etc.
    status = Column(SQLEnum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    is_profile_complete = Column(Boolean, default=False, nullable=False)
    profile_picture_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    employer_profile = relationship("EmployerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    tokens = relationship("Token", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_email_status", "email", "status"),
    )


class UserRole(Base):
    """
    Stores roles for users. A user can have multiple roles (e.g., CANDIDATE and EMPLOYER).
    """
    __tablename__ = "user_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(SQLEnum(Role), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="roles")

    __table_args__ = (
        Index("ix_user_roles_user_id", "user_id"),
        Index("ix_user_roles_role", "role"),
    )


class UserSession(Base):
    """
    Stores refresh token sessions for users (replaces Redis for token storage).
    JTI is stored here to validate refresh tokens without Redis dependency.
    """
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    jti = Column(String(255), unique=True, nullable=False, index=True)  # JWT ID - refresh token JTI
    device = Column(String(255), nullable=True)  # Device name/type
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")

    __table_args__ = (
        Index("ix_user_sessions_user_id", "user_id"),
        Index("ix_user_sessions_jti", "jti"),
        Index("ix_user_sessions_expires_at", "expires_at"),
    )


class CandidateProfile(Base):
    """
    Minimal placeholder for candidate profile.
    References unified users table. Can be expanded with specific fields later.
    """
    __tablename__ = "candidate_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Basic fields (minimal placeholder)
    first_name = Column(String(255), default="", nullable=True)
    last_name = Column(String(255), default="", nullable=True)
    phone = Column(String(50), default="", nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(SQLEnum(Gender), nullable=True)
    address = Column(String(500), default="", nullable=True)

    # Professional summary
    professional_summary = Column(String, default="", nullable=True)
    total_experience = Column(Float, default=0, nullable=True)
    current_salary = Column(Float, default=0, nullable=True)
    expected_salary = Column(Float, default=0, nullable=True)
    preferred_job_type = Column(SQLEnum(JobType), default=JobType.FULL_TIME, nullable=True)
    preferred_work_mode = Column(SQLEnum(WorkMode), default=WorkMode.REMOTE, nullable=True)
    preferred_locations = Column(ARRAY(String), default=[], nullable=True)
    notice_period = Column(Integer, default=0, nullable=True)

    # JSON fields for structured data
    skills = Column(JSON, default=[], nullable=True)
    experience = Column(JSON, default=[], nullable=True)
    education = Column(JSON, default=[], nullable=True)
    languages = Column(JSON, default=[], nullable=True)
    certifications = Column(JSON, default=[], nullable=True)

    # Online presence
    portfolio_url = Column(String(500), default="", nullable=True)
    linkedin_url = Column(String(500), default="", nullable=True)
    github_url = Column(String(500), default="", nullable=True)
    resume_url = Column(String(500), default="", nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_available_for_work = Column(Boolean, default=True, nullable=False)
    is_profile_complete = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="candidate_profile")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    files = relationship("File", back_populates="candidate", cascade="all, delete-orphan")
    conversation_participants = relationship("ConversationParticipant", back_populates="candidate", cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="candidate", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_candidate_profiles_user_id", "user_id"),
        Index("ix_candidate_profiles_name", "first_name", "last_name"),
        Index("ix_candidate_profiles_job_type", "preferred_job_type"),
    )


class EmployerProfile(Base):
    """
    Minimal placeholder for employer profile.
    References unified users table and organization. Can be expanded later.
    """
    __tablename__ = "employer_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    reporting_manager_id = Column(UUID(as_uuid=True), ForeignKey("employer_profiles.id"), nullable=True)

    # Basic fields (minimal placeholder)
    first_name = Column(String(255), default="", nullable=True)
    last_name = Column(String(255), default="", nullable=True)
    phone = Column(String(50), default="", nullable=True)
    gender = Column(SQLEnum(Gender), default=Gender.FEMALE, nullable=True)
    department = Column(String(255), nullable=True)

    # Job information
    job_title = Column(String(255), default="", nullable=True)
    employment_type = Column(SQLEnum(JobType), default=JobType.FULL_TIME, nullable=False)
    role = Column(SQLEnum(EmployerRole), default=EmployerRole.EMPLOYER, nullable=False)
    hire_date = Column(Date, nullable=True)
    work_phone = Column(String(50), default="", nullable=True)
    work_location = Column(String(500), default="", nullable=True)
    bio = Column(String, default="", nullable=True)

    # Permissions
    has_recruiter_permission = Column(Boolean, default=True, nullable=True)
    can_interview = Column(Boolean, default=True, nullable=True)

    # Skills
    skills = Column(JSON, default=[], nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_profile_complete = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="employer_profile")
    organization = relationship("Organization", back_populates="employers")
    reporting_manager = relationship("EmployerProfile", remote_side=[id], backref="direct_reports")
    created_jobs = relationship("Job", back_populates="created_by", foreign_keys="Job.created_by_employer_id")
    created_pipelines = relationship("Pipeline", back_populates="created_by")
    interview_assignments = relationship("InterviewAssignment", back_populates="interviewer")
    files = relationship("File", back_populates="employer", cascade="all, delete-orphan")
    conversation_participants = relationship("ConversationParticipant", back_populates="employer", cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="employer", cascade="all, delete-orphan")
    created_conversations = relationship("Conversation", back_populates="created_by")

    __table_args__ = (
        Index("ix_employer_profiles_user_id", "user_id"),
        Index("ix_employer_profiles_organization_id", "organization_id"),
        Index("ix_employer_profiles_role", "role"),
    )


class Token(Base):
    """
    Stores verification and password reset tokens.
    Separate from session management (user_sessions handles refresh tokens).
    """
    __tablename__ = "tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    type = Column(String(50), nullable=False)  # "email_verification", "password_reset"
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="tokens")

    __table_args__ = (
        Index("ix_tokens_user_id_type", "user_id", "type"),
        Index("ix_tokens_token_type", "token", "type"),
    )