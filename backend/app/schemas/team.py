import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from app.models.enums import TeamMemberRole, TeamMemberStatus


class TeamMemberCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr

    role: TeamMemberRole

    job_title: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[dict]] = None


class TeamMemberResponse(BaseModel):
    id: uuid.UUID

    first_name: str
    last_name: Optional[str] = None
    email: EmailStr

    role: TeamMemberRole
    status: TeamMemberStatus

    job_title: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[dict]] = None

    invited_at: datetime
    accepted_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }


class TeamMembersResponse(BaseModel):
    members: List[TeamMemberResponse]