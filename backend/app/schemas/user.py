# Path: backend/app/schemas/user.py
"""
Pydantic schemas for CandidateProfile and EmployerProfile.

- All fields are optional (useful for PATCH/update endpoints and for partial reads).
- Models are configured with `orm_mode = True` so they can be returned directly from SQLAlchemy models.
- Each model includes an inline `schema_extra` example and a friendly `title` ("Candidate" / "Employer")
  to make the OpenAPI docs clear for frontend devs.

Use these as request/response models in your FastAPI endpoints.
"""

from __future__ import annotations
from typing import Optional, List, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, HttpUrl
import uuid
from app.models.enums import Gender, JobType, UserStatus, UserType, WorkMode, EmployerRole



# UserSummary 
class UserSummary(BaseModel):
    id: Optional[uuid.UUID] = Field(default=None, description="User ID", example="clu123abc456")
    first_name: Optional[str] = Field(default=None, description="User's first name", example="John")
    last_name: Optional[str] = Field(default=None, description="User's last name", example="Doe")
    email: Optional[str] = Field(default=None, description="User email", example="sjohn.doe@example.com")
    email_verified: Optional[bool] = Field(default=None, description="Email verification status", example=True)
    user_type: Optional[UserType] = Field(default=None, description="User type (candidate or employer)", example="CANDIDATE")
    status: Optional[UserStatus] = Field(default=None, description="User status (active, inactive, etc.)", example="ACTIVE")
    profile_picture_url: Optional[str] = Field(default=None, description="URL to the user's avatar image", example="https://example.com/avatars/johndoe.jpg")
    organization_name: Optional[str] = Field(default=None, description="Organization name for employers", example="Example Corp")
    is_profile_complete: Optional[bool] = Field(default=None, description="Indicates if the user has completed their profile", example=True)

    # Pydantic v2: allow reading attributes from ORM objects
    model_config = {
        "from_attributes": True
    }



# ---------------------------
# Candidate profile schema
# ---------------------------
class CandidateProfileSchema(BaseModel):
    """Candidate profile — all fields optional for flexible partial updates."""
    id: Optional[str] = Field(None, description="Candidate profile UUID", example=str(uuid.UUID(int=1)))
    user_id: Optional[str] = Field(None, description="Associated user UUID", example=str(uuid.UUID(int=2)))

    first_name: Optional[str] = Field(None, description="First name", example="John")
    last_name: Optional[str] = Field(None, description="Last name", example="Doe")
    phone: Optional[str] = Field(None, description="Phone number", example="+91-9876543210")
    date_of_birth: Optional[date] = Field(None, description="Date of birth (YYYY-MM-DD)", example="1996-07-15")
    gender: Optional[Gender] = Field(None, description="Gender", example="MALE")
    address: Optional[str] = Field(None, description="Address", example="123 MG Road, Mumbai, India")
    profile_picture_url: Optional[HttpUrl] = Field(None, description="Public URL to profile picture", example="https://cdn.example.com/profile/abcd.jpg")

    # Professional summary
    professional_summary: Optional[str] = Field(None, description="Short professional summary", example="Full-stack developer with 3 years experience building SaaS products.")
    total_experience: Optional[float] = Field(None, description="Total years of experience", example=3.5)
    current_salary: Optional[float] = Field(None, description="Current salary numeric", example=600000.0)
    expected_salary: Optional[float] = Field(None, description="Expected salary numeric", example=900000.0)
    preferred_job_type: Optional[JobType] = Field(None, description="Preferred job type", example="FULL_TIME")
    preferred_work_mode: Optional[WorkMode] = Field(None, description="Preferred work mode", example="REMOTE")
    preferred_locations: Optional[List[str]] = Field(None, description="Preferred locations (cities)", example=["Bengaluru", "Pune"])
    notice_period: Optional[int] = Field(None, description="Notice period (days)", example=30)

    # Structured fields (JSON-like)
    skills: Optional[List[str]] = Field(None, description="Skill list", example=["python", "react", "sql"])
    experience: Optional[List[Any]] = Field(None, description="Experience entries (structured JSON)", example=[{"company":"Acme","role":"Dev","from":"2021-01","to":"2023-06"}])
    education: Optional[List[Any]] = Field(None, description="Education entries", example=[{"degree":"B.Tech","institution":"IIT","year":2019}])
    languages: Optional[List[str]] = Field(None, description="Languages known", example=["English","Hindi"])
    certifications: Optional[List[Any]] = Field(None, description="Certifications list", example=[{"name":"AWS Certified Developer","year":2022}])

    # Online presence
    portfolio_url: Optional[HttpUrl] = Field(None, description="Portfolio URL", example="https://portfolio.example.com/john")
    linkedin_url: Optional[HttpUrl] = Field(None, description="LinkedIn profile URL", example="https://www.linkedin.com/in/johndoe")
    github_url: Optional[HttpUrl] = Field(None, description="Github profile URL", example="https://github.com/johndoe")
    resume_url: Optional[HttpUrl] = Field(None, description="Resume download URL", example="https://cdn.example.com/resumes/john.pdf")

    # Status flags
    is_active: Optional[bool] = Field(None, description="Is candidate active", example=True)
    is_available_for_work: Optional[bool] = Field(None, description="Is candidate available for immediate work", example=True)
    is_profile_complete: Optional[bool] = Field(None, description="Has candidate completed profile", example=False)

    created_at: Optional[datetime] = Field(None, description="Record created at (UTC)", example="2025-12-20T12:34:56Z")
    updated_at: Optional[datetime] = Field(None, description="Record last updated at (UTC)", example="2025-12-21T08:22:30Z")

    class Config:
        orm_mode = True
        title = "Candidate"
        schema_extra = {
            "example": {
                "id": str(uuid.uuid4()),
                "user_id": str(uuid.uuid4()),
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+91-9876543210",
                "date_of_birth": "1996-07-15",
                "gender": "MALE",
                "address": "123 MG Road, Mumbai",
                "profile_picture_url": "https://cdn.example.com/profile/abcd.jpg",
                "professional_summary": "Full-stack developer with 3 years of experience.",
                "total_experience": 3.5,
                "current_salary": 600000.0,
                "expected_salary": 900000.0,
                "preferred_job_type": "FULL_TIME",
                "preferred_work_mode": "REMOTE",
                "preferred_locations": ["Bengaluru", "Pune"],
                "notice_period": 30,
                "skills": ["python", "react", "sql"],
                "experience": [{"company": "Acme", "role": "Developer", "from": "2021-01", "to": "2023-06"}],
                "education": [{"degree": "B.Tech", "institution": "IIT Bombay", "year": 2019}],
                "languages": ["English", "Hindi"],
                "certifications": [{"name": "AWS Certified Developer", "year": 2022}],
                "portfolio_url": "https://portfolio.example.com/john",
                "linkedin_url": "https://www.linkedin.com/in/johndoe",
                "github_url": "https://github.com/johndoe",
                "resume_url": "https://cdn.example.com/resumes/john.pdf",
                "is_active": True,
                "is_available_for_work": True,
                "is_profile_complete": False,
                "created_at": "2025-12-20T12:34:56Z",
                "updated_at": "2025-12-21T08:22:30Z"
            }
        }


# ---------------------------
# Employer profile schema
# ---------------------------
class EmployerProfileSchema(BaseModel):
    """Employer profile — all fields optional for flexible partial updates."""
    id: Optional[str] = Field(None, description="Employer profile UUID", example=str(uuid.uuid4()))
    user_id: Optional[str] = Field(None, description="Associated user UUID", example=str(uuid.uuid4()))
    organization_id: Optional[str] = Field(None, description="Organization UUID", example=str(uuid.uuid4()))
    reporting_manager_id: Optional[str] = Field(None, description="Reporting manager profile UUID", example=str(uuid.uuid4()))

    first_name: Optional[str] = Field(None, description="First name", example="Priya")
    last_name: Optional[str] = Field(None, description="Last name", example="Shah")
    phone: Optional[str] = Field(None, description="Phone number", example="+91-9123456780")
    gender: Optional[Gender] = Field(None, description="Gender", example="FEMALE")
    department: Optional[str] = Field(None, description="Department", example="Engineering")
    profile_picture_url: Optional[HttpUrl] = Field(None, description="Public URL to profile picture", example="https://cdn.example.com/profile/priya.jpg")

    # Job / role information
    job_title: Optional[str] = Field(None, description="Job title", example="Head of Talent")
    employment_type: Optional[JobType] = Field(None, description="Employment type", example="FULL_TIME")
    role: Optional[EmployerRole] = Field(None, description="Employer role", example="ADMIN")
    hire_date: Optional[date] = Field(None, description="Hire date (YYYY-MM-DD)", example="2020-08-01")
    work_phone: Optional[str] = Field(None, description="Work phone", example="+91-1122334455")
    work_location: Optional[str] = Field(None, description="Work location address", example="Bengaluru, India")
    bio: Optional[str] = Field(None, description="Short bio", example="HR leader with 8 years experience.")

    # Permissions
    has_recruiter_permission: Optional[bool] = Field(None, description="Can act as recruiter", example=True)
    can_interview: Optional[bool] = Field(None, description="Can conduct interviews", example=True)

    # Skills and status
    skills: Optional[List[str]] = Field(None, description="Skills / expertise list", example=["hiring", "interviewing"])
    is_active: Optional[bool] = Field(None, description="Is employer profile active", example=True)
    is_profile_complete: Optional[bool] = Field(None, description="Has employer completed profile", example=False)

    created_at: Optional[datetime] = Field(None, description="Created at (UTC)", example="2025-12-20T12:34:56Z")
    updated_at: Optional[datetime] = Field(None, description="Updated at (UTC)", example="2025-12-21T08:22:30Z")

    class Config:
        orm_mode = True
        title = "Employer"
        schema_extra = {
            "example": {
                "id": str(uuid.uuid4()),
                "user_id": str(uuid.uuid4()),
                "organization_id": str(uuid.uuid4()),
                "reporting_manager_id": None,
                "first_name": "Priya",
                "last_name": "Shah",
                "phone": "+91-9123456780",
                "gender": "FEMALE",
                "department": "Engineering",
                "profile_picture_url": "https://cdn.example.com/profile/priya.jpg",
                "job_title": "Head of Talent",
                "employment_type": "FULL_TIME",
                "role": "ADMIN",
                "hire_date": "2020-08-01",
                "work_phone": "+91-1122334455",
                "work_location": "Bengaluru, India",
                "bio": "HR leader with 8 years experience.",
                "has_recruiter_permission": True,
                "can_interview": True,
                "skills": ["hiring", "interviewing"],
                "is_active": True,
                "is_profile_complete": False,
                "created_at": "2025-12-20T12:34:56Z",
                "updated_at": "2025-12-21T08:22:30Z"
            }
        }
