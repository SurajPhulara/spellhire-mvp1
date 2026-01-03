# Path: backend/app/schemas/organization.py
from __future__ import annotations
from typing import Optional, List, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, HttpUrl
import uuid

try:
    from app.models.enums import CompanySize  # type: ignore
except Exception:
    CompanySize = str  # fallback to string if enums cannot be imported


class OrganizationSchema(BaseModel):
    """
    Organization schema for read/update operations.
    - All fields optional for flexible PATCH/update endpoints.
    - orm_mode enabled so SQLAlchemy objects can be returned directly.
    - Includes a comprehensive example for OpenAPI / frontend clarity.
    """
    id: Optional[str] = Field(None, description="Organization UUID", example=str(uuid.uuid4()))
    name: Optional[str] = Field(None, description="Organization name", example="Acme Technologies")
    description: Optional[str] = Field(None, description="Long description", example="We build scalable SaaS products.")
    industry: Optional[str] = Field(None, description="Industry", example="Software")
    company_size: Optional[CompanySize] = Field(None, description="Company size enum", example="SIZE_11_50")
    headquarters_location: Optional[str] = Field(None, description="HQ location", example="Bengaluru, India")
    website: Optional[HttpUrl] = Field(None, description="Company website", example="https://acme.example.com")
    contact_email: Optional[str] = Field(None, description="Contact / HR email", example="hr@acme.example.com")
    phone: Optional[str] = Field(None, description="Phone number", example="+91-9876543210")
    additional_locations: Optional[List[str]] = Field(None, description="Other office cities", example=["Mumbai", "Pune"])
    founded_on: Optional[date] = Field(None, description="Founded date (YYYY-MM-DD)", example="2015-04-01")
    mission: Optional[str] = Field(None, description="Mission statement", example="Empower engineers to ship faster.")
    benefits_overview: Optional[str] = Field(None, description="Benefits summary", example="Health insurance, paid parental leave.")
    company_culture: Optional[str] = Field(None, description="Culture blurb", example="Remote-first, outcome-driven.")
    logo_url: Optional[HttpUrl] = Field(None, description="Logo or brand asset URL", example="https://cdn.example.com/logos/acme.png")
    is_profile_complete: Optional[bool] = Field(None, description="Is organization profile complete", example=True)
    is_active: Optional[bool] = Field(None, description="Is organization active on platform", example=True)
    created_at: Optional[datetime] = Field(None, description="Created at (UTC)", example="2025-12-20T12:34:56Z")
    updated_at: Optional[datetime] = Field(None, description="Updated at (UTC)", example="2025-12-21T08:22:30Z")

    class Config:
        orm_mode = True
        title = "Organization"
        schema_extra = {
            "example": {
                "id": str(uuid.uuid4()),
                "name": "Acme Technologies",
                "description": "We build scalable SaaS products for SMBs.",
                "industry": "Software",
                "company_size": "SIZE_11_50",
                "headquarters_location": "Bengaluru, India",
                "website": "https://acme.example.com",
                "contact_email": "hr@acme.example.com",
                "phone": "+91-9876543210",
                "additional_locations": ["Mumbai", "Pune"],
                "founded_on": "2015-04-01",
                "mission": "Empower engineers to ship faster.",
                "benefits_overview": "Health insurance, paid parental leave, stock options.",
                "company_culture": "Remote-first, outcome-driven.",
                "logo_url": "https://cdn.example.com/logos/acme.png",
                "is_profile_complete": True,
                "is_active": True,
                "created_at": "2025-12-20T12:34:56Z",
                "updated_at": "2025-12-21T08:22:30Z"
            }
        }
