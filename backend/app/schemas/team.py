from __future__ import annotations
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr
import uuid

from app.models.enums import EmployerRole, EmployerProfileStatus


class TeamMemberSchema(BaseModel):
    id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: EmployerRole
    status: EmployerProfileStatus
    job_title: Optional[str] = None
    department: Optional[str] = None
    experience_years: Optional[float] = None
    skills: Optional[List[Any]] = None
    invited_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    user_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class TeamMembersResponseSchema(BaseModel):
    members: List[TeamMemberSchema]


class TeamMemberCreateSchema(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: Optional[str] = None
    email: EmailStr
    role: EmployerRole
    job_title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    experience_years: Optional[float] = Field(None, ge=0)
    skills: Optional[List[Any]] = None
    bio: Optional[str] = None


class TeamInviteAcceptSchema(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[list] = None
    experience_years: Optional[int] = None
    password: Optional[str] = None