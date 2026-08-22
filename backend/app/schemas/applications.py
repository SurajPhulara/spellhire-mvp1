from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from uuid import UUID

from app.schemas.jobs import JobPreview
from app.schemas.jobs import PipelineStageSchema
from app.models.enums import ApplicationStatus


# ============================================================
# for candidates
# ============================================================
class PipelineStagePublic(BaseModel):
    id: str
    name: str
    order: int


class AppliedJobApplication(BaseModel):
    application_id: UUID

    applied_at: datetime
    last_updated_at: datetime
    stage_updated_at: datetime

    status: ApplicationStatus
    current_stage_id: str

    job: JobPreview
    pipeline_stages: List[PipelineStagePublic]

    model_config = {
        "from_attributes": True
    }


class AppliedJobsStats(BaseModel):
    total_applied: int = 0
    in_progress: int = 0
    offers: int = 0
    rejected: int = 0


class AppliedJobsResponse(BaseModel):
    applications: List[AppliedJobApplication]
    stats: AppliedJobsStats


class ApplicationStageHistorySchema(BaseModel):
    from_stage_id: Optional[str] = None
    to_stage_id: str
    changed_at: datetime

    model_config = {
        "from_attributes": True
    }


class ApplicationTimelineResponseSchema(BaseModel):
    application_id: UUID
    applied_at: datetime
    last_updated_at: datetime
    stage_updated_at: datetime
    status: str
    current_stage_id: str

    job: JobPreview
    pipeline_stages: List[PipelineStagePublic] = Field(default_factory=list)
    stage_history: List[ApplicationStageHistorySchema] = Field(default_factory=list)

    model_config = {
        "from_attributes": True
    }


# ============================================================
# for employers
# ============================================================
class EmployerApplicationCandidateSchema(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    total_experience: Optional[float] = None
    current_salary: Optional[float] = None
    expected_salary: Optional[float] = None
    preferred_locations: Optional[List[str]] = Field(default_factory=list)
    skills: Optional[List[str]] = Field(default_factory=list)
    resume_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    is_profile_complete: Optional[bool] = False


class EmployerJobApplicationSchema(BaseModel):
    application_id: UUID
    applied_at: datetime
    last_updated_at: datetime
    stage_updated_at: datetime
    status: str
    current_stage_id: str
    notes: Optional[str] = None
    candidate: EmployerApplicationCandidateSchema


class EmployerJobApplicationsStatsSchema(BaseModel):
    total_applications: int = 0
    in_review: int = 0
    offers: int = 0
    rejected: int = 0


class EmployerJobApplicationsBoardResponseSchema(BaseModel):
    job: JobPreview
    pipeline_stages: List[PipelineStageSchema]
    stats: EmployerJobApplicationsStatsSchema
    applications: List[EmployerJobApplicationSchema]

    model_config = {
        "from_attributes": True
    }


class MoveApplicationStageRequestSchema(BaseModel):
    stage_id: str


class UpdatePipelineRequestSchema(BaseModel):
    stages: List[PipelineStageSchema]


class UpdatePipelineResponseSchema(BaseModel):
    pipeline_stages: List[PipelineStageSchema]


class UpdateApplicationNotesRequestSchema(BaseModel):
    notes: Optional[str] = None


class UpdateApplicationNotesResponseSchema(BaseModel):
    application_id: UUID
    notes: Optional[str] = None
    last_updated_at: datetime