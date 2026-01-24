# app/schemas/base.py

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class SkillLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class Skills(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    level: SkillLevel
    years_experience: Optional[int] = Field(None, ge=0, le=50)
    
    @field_validator('name')
    def normalize_skill_name(cls, v):
        # Normalize skill names for consistency
        return v.strip()

class PaginationMeta(BaseModel):
    page: int = Field(description="Current page number")
    per_page: int = Field(description="Items per page")
    total_pages: int = Field(description="Total number of pages")
    total_items: int = Field(description="Total number of items")
    has_next: bool = Field(description="Whether there's a next page")
    has_prev: bool = Field(description="Whether there's a previous page")


class LanguageProficiency(str, Enum):
    """
    Language proficiency levels.
    
    Definitions:
    - BASIC: Can understand simple phrases, limited vocabulary
    - CONVERSATIONAL: Can hold everyday conversations, some mistakes
    - FLUENT: Can speak/write professionally, rare mistakes
    - NATIVE: Native speaker or equivalent mastery
    """
    BASIC = "BASIC"
    CONVERSATIONAL = "CONVERSATIONAL"
    FLUENT = "FLUENT"
    NATIVE = "NATIVE"


class Language(BaseModel):
    """
    Language with proficiency level.
    """
    name: str = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="Language name (e.g., English, Spanish, Mandarin)",
        example="English"
    )
    proficiency: LanguageProficiency = Field(
        ...,
        description="Proficiency level",
        example="NATIVE"
    )
    
    @field_validator('name')
    def normalize_language_name(cls, v):
        """Normalize language names for consistency (trim and title case)"""
        return v.strip().title()
    
    class Config:
        schema_extra = {
            "example": {
                "name": "English",
                "proficiency": "native"
            }
        }