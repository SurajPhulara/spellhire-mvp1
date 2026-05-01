from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class ApplicationCreateSchema(BaseModel):
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    notes: Optional[str] = None

class ApplicationReadSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    candidate_id: UUID
    pipeline_id: UUID
    current_stage_id: Optional[str] = None
    status: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    notes: Optional[str] = None
    applied_at: datetime
    last_updated_at: datetime
    stage_updated_at: datetime
    rejection_reason: Optional[str] = None
    rejection_feedback: Optional[str] = None
    hired_at: Optional[datetime] = None