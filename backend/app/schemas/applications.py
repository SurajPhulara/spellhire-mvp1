from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.schemas.jobs import JobPreview
from app.models.enums import ApplicationStatus



# class ApplicationReadSchema(BaseModel):
#     id: UUID
#     job_id: UUID
#     candidate_id: UUID
#     pipeline_id: UUID
#     current_stage_id: Optional[str] = None
#     status: str
#     cover_letter: Optional[str] = None
#     resume_url: Optional[str] = None
#     notes: Optional[str] = None
#     applied_at: datetime
#     last_updated_at: datetime
#     stage_updated_at: datetime
#     rejection_reason: Optional[str] = None
#     rejection_feedback: Optional[str] = None
#     hired_at: Optional[datetime] = None

#     model_config = {
#         "from_attributes": True
#     }

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


class AppliedJobsResponse(BaseModel):
    applications: List[AppliedJobApplication]