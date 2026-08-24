import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Index,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.enums import TeamMemberRole, TeamMemberStatus


class OrganizationMember(Base):
    """
    Organization team member.

    Used for both:
    - RECRUITER invitations
    - INTERVIEWER invitations

    Interviewers do not need a SpellHire login.
    Recruiters can later be linked to a real User/EmployerProfile
    after accepting their invitation.
    """

    __tablename__ = "organization_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Optional link once a recruiter accepts and gets a real account.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    invited_by_employer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("employer_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )

    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False)

    role = Column(
        SQLEnum(TeamMemberRole),
        nullable=False,
    )

    status = Column(
        SQLEnum(TeamMemberStatus),
        default=TeamMemberStatus.INVITED,
        nullable=False,
    )

    job_title = Column(String(255), nullable=True)

    experience_years = Column(Integer, nullable=True)

    # Example:
    # [
    #   {"name": "Python", "level": "EXPERT"},
    #   {"name": "System Design", "level": "ADVANCED"}
    # ]
    skills = Column(JSON, default=list, nullable=True)

    invitation_token = Column(String(255), unique=True, nullable=True)
    invitation_expires_at = Column(DateTime(timezone=True), nullable=True)

    invited_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    accepted_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    organization = relationship(
        "Organization",
        back_populates="members",
    )

    user = relationship("User")

    invited_by = relationship(
        "EmployerProfile",
        foreign_keys=[invited_by_employer_id],
    )

    __table_args__ = (
        Index(
            "ix_organization_members_organization_id",
            "organization_id",
        ),
        Index(
            "ix_organization_members_email",
            "email",
        ),
        Index(
            "ix_organization_members_role",
            "role",
        ),
        Index(
            "ix_organization_members_status",
            "status",
        ),
    )