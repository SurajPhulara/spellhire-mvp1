import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import ConversationType, UserType, MessageType


class Conversation(Base):
    """
    Conversation thread for messaging between users.
    Supports employer-internal, candidate-internal, and recruiter-to-candidate chats.
    Recruiter-to-candidate conversations expire after 5 days (stored in expires_at).
    """
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(SQLEnum(ConversationType), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)  # Only for EMPLOYER_INTERNAL
    is_group_chat = Column(Boolean, default=False, nullable=False)
    group_name = Column(String(255), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("employer_profiles.id"), nullable=False)
    created_by_type = Column(SQLEnum(UserType), nullable=False)
    last_message_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # For RECRUITER_TO_CANDIDATE (5 days from last recruiter message)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="conversations")
    created_by = relationship("EmployerProfile", back_populates="created_conversations")
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_conversations_organization_id_type", "organization_id", "type"),
        Index("ix_conversations_expires_at", "expires_at"),
        Index("ix_conversations_last_message_at", "last_message_at"),
    )


class ConversationParticipant(Base):
    """
    Participants in a conversation.

    We use two explicit nullable foreign keys: candidate_id and employer_id.
    Only one should be set for a given row (based on user_type).
    This is explicit and allows SQLAlchemy to determine join conditions.
    """
    __tablename__ = "conversation_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)

    # Explicit per-type references (nullable). This fixes SQLAlchemy's join detection.
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    employer_id = Column(UUID(as_uuid=True), ForeignKey("employer_profiles.id", ondelete="CASCADE"), nullable=True, index=True)

    user_type = Column(String(50), nullable=False)  # consider using SQLEnum(UserType) if you imported it
    joined_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    last_read_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    left_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="participants")
    candidate = relationship("CandidateProfile", back_populates="conversation_participants", foreign_keys=[candidate_id])
    employer = relationship("EmployerProfile", back_populates="conversation_participants", foreign_keys=[employer_id])

    __table_args__ = (
        Index("ix_conversation_participants_user_candidate", "conversation_id", "candidate_id"),
        Index("ix_conversation_participants_user_employer", "conversation_id", "employer_id"),
        Index("ix_conversation_participants_unique", "conversation_id", "candidate_id", "employer_id", unique=False),
    )


class Message(Base):
    """
    Messages in a conversation.

    We use two nullable FK columns for sender so we can lookup
    easily without ambiguous joins (mirrors ConversationParticipant approach).
    """
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)

    # Sender: either candidate or employer (mutually exclusive)
    candidate_sender_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    employer_sender_id = Column(UUID(as_uuid=True), ForeignKey("employer_profiles.id", ondelete="CASCADE"), nullable=True, index=True)

    sender_type = Column(String(50), nullable=False)  # keep for quick checks; can be enum
    content = Column(String, nullable=False)
    message_type = Column(String(50), default=MessageType.TEXT.value, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    candidate = relationship("CandidateProfile", back_populates="sent_messages", foreign_keys=[candidate_sender_id])
    employer = relationship("EmployerProfile", back_populates="sent_messages", foreign_keys=[employer_sender_id])

    __table_args__ = (
        Index("ix_messages_conversation_id_created_at", "conversation_id", "created_at"),
        Index("ix_messages_candidate_sender", "candidate_sender_id"),
        Index("ix_messages_employer_sender", "employer_sender_id"),
    )
