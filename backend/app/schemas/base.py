# app/schemas/base.py

from typing import Optional
from pydantic import BaseModel, Field

class PaginationMeta(BaseModel):
    page: int = Field(description="Current page number")
    per_page: int = Field(description="Items per page")
    total_pages: int = Field(description="Total number of pages")
    total_items: int = Field(description="Total number of items")
    has_next: bool = Field(description="Whether there's a next page")
    has_prev: bool = Field(description="Whether there's a previous page")

