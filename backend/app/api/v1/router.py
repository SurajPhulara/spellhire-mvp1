"""
Top-level API router for version v1.

Included in main.py as:
    app.include_router(api_router, prefix="/api/v1")

Design principles:
- Explicit > implicit
- No auto-discovery or magic imports
- Each router is intentionally wired
- Easy to debug, easy to extend
"""

from fastapi import APIRouter, Request
import logging

from app.core.config import settings

# ---------------------------------------------------------------------------
# Import endpoint routers
# ---------------------------------------------------------------------------

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.candidate_profile import router as candidate_profile_router
from app.api.v1.endpoints.employer_profile import router as employer_profile_router
from app.api.v1.endpoints.organization_profile import router as organization_profile_router
from app.api.v1.endpoints.files_management import router as files_management_router

logger = logging.getLogger(__name__)

api_router = APIRouter()

# ---------------------------------------------------------------------------
# Root endpoint: /api/v1
# ---------------------------------------------------------------------------
@api_router.get("/", tags=["Meta"])
async def api_v1_root(request: Request):
    """
    Basic API v1 sanity check endpoint.
    Useful for debugging and frontend smoke tests.
    """
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "path": str(request.url),
    }

# ---------------------------------------------------------------------------
# Authentication routes
# ---------------------------------------------------------------------------
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"], )

# ---------------------------------------------------------------------------
# Candidate profile routes
# ---------------------------------------------------------------------------
api_router.include_router(candidate_profile_router, prefix="/candidate", tags=["Candidate Profile"], )

# ---------------------------------------------------------------------------
# Employer profile routes
# ---------------------------------------------------------------------------
api_router.include_router(employer_profile_router, prefix="/employer", tags=["Employer Profile"], )


# ---------------------------------------------------------------------------
# Erganization profile routes
# ---------------------------------------------------------------------------
api_router.include_router(organization_profile_router, prefix="/organization", tags=["Organization"], )


# ---------------------------------------------------------------------------
# Files management routes
# ---------------------------------------------------------------------------
api_router.include_router(files_management_router, prefix="/files", tags=["File Management"], )


logger.info("API v1 routes registered: auth, candidate, employer, organization")
