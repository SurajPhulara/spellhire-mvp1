# backend/app/api/v1/router.py
"""
Top-level API router for version v1.

This router is included in main.py as:
    app.include_router(api_router, prefix="/api/v1")

Design principles:
- Explicit is better than implicit
- No auto-discovery or magic imports
- Each router is intentionally wired
- Easy to debug, easy to extend
"""

from fastapi import APIRouter, Depends, Request
import logging

from app.core.config import settings

# Import authentication routers
from app.api.v1.endpoints.auth import router as auth_router
from app.core.rate_limit import limiter

logger = logging.getLogger(__name__)

api_router = APIRouter()

# ---------------------------------------------------------------------------
# Root endpoint: /api/v1
# ---------------------------------------------------------------------------
@api_router.get("/", tags=["Meta"])
async def api_v1_root(request: Request):
    """
    Basic API v1 sanity check endpoint.
    Useful for health checks and debugging.
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
AUTH_TAGS = ["Authentication"]

api_router.include_router( auth_router, prefix="/auth", tags=AUTH_TAGS, )
# api_router.include_router( auth_employer.router, prefix="/auth/employer", tags=AUTH_TAGS, )
# api_router.include_router( auth_social.router, prefix="/auth", tags=AUTH_TAGS, )
# api_router.include_router( auth_shared.router, prefix="/auth", tags=AUTH_TAGS, )

logger.info("API v1 authentication routes registered")
