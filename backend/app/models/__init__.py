"""
SQLAlchemy models for the application.
This file imports all models to ensure they are registered with SQLAlchemy.
"""

from app.models.base import Base
from app.models.enums import (
    AuthMethod,
    Gender,
    UserStatus,
    Role,
    EmployerRole,
    JobType,
    ExperienceLevel,
    WorkMode,
    CompanySize,
    JobStatus,
    ApplicationStatus,
    FileType,
    UserType,
    ConversationType,
    MessageType,
)
from app.models.user import (
    User,
    UserRole,
    UserSession,
    CandidateProfile,
    EmployerProfile,
    Token,
)
from app.models.platform_admin import (
    PlatformAdmin,
    PlatformAdminSession,
)
from app.models.organization import Organization
from app.models.job import (
    Job,
    Pipeline,
    Application,
    ApplicationStageHistory,
    InterviewAssignment,
)
from app.models.messaging import (
    Conversation,
    ConversationParticipant,
    Message,
)
from app.models.file import File

__all__ = [
    # Base
    "Base",
    # Enums
    "AuthMethod",
    "Gender",
    "UserStatus",
    "Role",
    "EmployerRole",
    "JobType",
    "ExperienceLevel",
    "WorkMode",
    "CompanySize",
    "JobStatus",
    "ApplicationStatus",
    "FileType",
    "UserType",
    "ConversationType",
    "MessageType",
    # User models
    "User",
    "UserRole",
    "UserSession",
    "CandidateProfile",
    "EmployerProfile",
    "Token",
    # Platform admin
    "PlatformAdmin",
    "PlatformAdminSession",
    # Organization
    "Organization",
    # Job models
    "Job",
    "Pipeline",
    "Application",
    "ApplicationStageHistory",
    "InterviewAssignment",
    # Messaging
    "Conversation",
    "ConversationParticipant",
    "Message",
    # File
    "File",
]