# backend/app/core/rate_limit.py
"""
Path: backend/app/core/rate_limit.py

Central rate-limiting configuration using slowapi.

Why this exists:
- Keeps rate-limiting logic in one place
- Avoids repeating configuration across routers
- Allows future tuning (per-route, per-user, per-IP) without touching main.py

Usage:
- Imported in main.py and attached to app.state.limiter
- Used via @limiter.limit(...) decorators on routes
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings


# ---------------------------------------------------------------------------
# Global limiter instance
# ---------------------------------------------------------------------------
# Default key function: client IP address
# This is safe for MVPs. Later you can switch to:
# - user_id (after auth)
# - API key
# - forwarded IP (behind reverse proxy)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[
        f"{settings.RATE_LIMIT_PER_MINUTE}/minute"
    ],
)
