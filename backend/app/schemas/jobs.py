# backend/app/schemas/jobs.py
from __future__ import annotations
from typing import Dict
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl
import uuid

from app.models.enums import JobType, WorkMode, ExperienceLevel, JobStatus


class PipelineStageSchema(BaseModel):
    id: str = Field(..., example="applied")
    name: str = Field(..., example="Applied")
    order: int = Field(..., example=1)
    isDefault: Optional[bool] = Field(False, example=True)

    model_config = {
        "from_attributes": True
    }


class PipelineSchema(BaseModel):
    id: Optional[str] = Field(None, example=str(uuid.uuid4()))
    job_id: Optional[str] = Field(None, example=str(uuid.uuid4()))
    created_by_id: Optional[str] = Field(None, example=str(uuid.uuid4()))
    stages: Optional[List[PipelineStageSchema]] = Field(None)
    is_active: Optional[bool] = Field(True)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }


class Job(BaseModel):
    # ------------------------------------------------------------------
    # IDs
    # ------------------------------------------------------------------
    id: Optional[uuid.UUID] = None
    organization_id: Optional[uuid.UUID] = None
    created_by_employer_id: Optional[uuid.UUID] = None

    # ------------------------------------------------------------------
    # Basic job information
    # ------------------------------------------------------------------
    title: str = Field(..., example="Senior Backend Engineer")
    description: Optional[str] = Field(None, example="We are building scalable hiring systems")
    requirements: Optional[str] = Field(None, example="3+ years Python, SQL, FastAPI")
    responsibilities: Optional[str] = Field(None, example="Design APIs, review code, scale systems")
    vacancies: Optional[int] = Field(1, example=1)

    # ------------------------------------------------------------------
    # Job details
    # ------------------------------------------------------------------
    job_type: JobType = Field(..., example=JobType.FULL_TIME)
    work_mode: WorkMode = Field(..., example=WorkMode.REMOTE)
    experience_level: ExperienceLevel = Field(..., example=ExperienceLevel.MID)

    required_skills: Optional[List[str]] = Field(
        None, example=["python", "postgresql", "fastapi"]
    )
    preferred_skills: Optional[List[str]] = Field(
        None, example=["aws", "docker", "kubernetes"]
    )
    minimum_years_experience: Optional[int] = Field(0, example=2)

    # ------------------------------------------------------------------
    # Location
    # ------------------------------------------------------------------
    location: Optional[Dict] = Field(
        None,
        example={"city": "Bengaluru", "state": "Karnataka", "country": "India"},
    )

    # ------------------------------------------------------------------
    # Compensation
    # ------------------------------------------------------------------
    salary_min: Optional[float] = Field(None, example=500000)
    salary_max: Optional[float] = Field(None, example=1200000)
    salary_currency: Optional[str] = Field("INR", example="INR")
    salary_period: Optional[str] = Field("yearly", example="yearly")

    # ------------------------------------------------------------------
    # Categories & details
    # ------------------------------------------------------------------
    category: Optional[str] = Field(None, example="Engineering")
    department: Optional[str] = Field(None, example="Backend")
    benefits: Optional[List[str]] = Field(
        None, example=["Health insurance", "Remote work", "Stock options"]
    )

    # ------------------------------------------------------------------
    # Application details
    # ------------------------------------------------------------------
    application_deadline: Optional[datetime] = Field(None, example="2026-03-31T00:00:00Z")
    application_url: Optional[str] = Field(None, example="https://company.com/jobs/123")

    # ------------------------------------------------------------------
    # Status & metadata
    # ------------------------------------------------------------------
    status: Optional[JobStatus] = Field(JobStatus.DRAFT)
    is_featured: Optional[bool] = Field(False)
    view_count: Optional[int] = Field(0)
    application_count: Optional[int] = Field(0)

    # ------------------------------------------------------------------
    # Collaborators
    # ------------------------------------------------------------------
    collaborator_employer_ids: Optional[List[str]] = Field(None)

    # ------------------------------------------------------------------
    # Timestamps
    # ------------------------------------------------------------------
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }
        

class JobUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    vacancies: Optional[int] = None

    job_type: Optional[JobType] = None
    work_mode: Optional[WorkMode] = None
    experience_level: Optional[ExperienceLevel] = None

    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    minimum_years_experience: Optional[int] = None

    location: Optional[dict] = None

    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    salary_period: Optional[str] = None

    category: Optional[str] = None
    department: Optional[str] = None
    benefits: Optional[List[str]] = None

    application_deadline: Optional[datetime] = None
    application_url: Optional[HttpUrl] = None
    is_featured: Optional[bool] = None
    collaborator_employer_ids: Optional[List[str]] = None

    model_config = {
        "from_attributes": True
    }


class JobReadSchema(Job):
    id: str
    organization_id: str
    created_by_employer_id: str
    collaborator_employer_ids: Optional[List[str]] = None
    location: Optional[dict]
    salary_currency: Optional[str]
    salary_period: Optional[str]
    status: JobStatus
    is_featured: bool
    view_count: int
    application_count: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    pipeline: Optional[PipelineSchema] = None

    model_config = {
        "from_attributes": True
    }


class JobListResponseSchema(BaseModel):
    jobs: List[JobReadSchema]
    meta: dict

    model_config = {
        "from_attributes": True
    }


# Application schemas
class ApplicationCreateSchema(BaseModel):
    cover_letter: Optional[str] = Field(None)
    resume_url: Optional[HttpUrl] = Field(None)
    notes: Optional[str] = None

    model_config = {
        "from_attributes": True
    }


class ApplicationReadSchema(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    pipeline_id: str
    current_stage_id: Optional[str]
    status: ApplicationStatus
    cover_letter: Optional[str]
    resume_url: Optional[str]
    applied_at: Optional[datetime]

    model_config = {
        "from_attributes": True
    }
