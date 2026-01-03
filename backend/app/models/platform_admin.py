import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class PlatformAdmin(Base):
    """
    Platform administrators - completely separate from regular users.
    Used for system administration, not mixed with candidate/employer users.
    """
    __tablename__ = "platform_admins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_super_admin = Column(Boolean, default=False, nullable=False)  # Super admin flag
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    sessions = relationship("PlatformAdminSession", back_populates="admin", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_platform_admins_email", "email"),
        Index("ix_platform_admins_is_active", "is_active"),
    )


class PlatformAdminSession(Base):
    """
    Session management for platform admins - stores refresh token JTI.
    Separated from user sessions for security isolation.
    """
    __tablename__ = "platform_admin_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("platform_admins.id", ondelete="CASCADE"), nullable=False)
    jti = Column(String(255), unique=True, nullable=False, index=True)  # JWT ID - refresh token JTI
    device = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    admin = relationship("PlatformAdmin", back_populates="sessions")

    __table_args__ = (
        Index("ix_platform_admin_sessions_admin_id", "admin_id"),
        Index("ix_platform_admin_sessions_jti", "jti"),
        Index("ix_platform_admin_sessions_expires_at", "expires_at"),
    )