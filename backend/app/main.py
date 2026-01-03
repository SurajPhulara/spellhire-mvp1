# backend/app/main.py
# -------------------
# FastAPI application bootstrap for SpellHire (MVP).
#
# Key responsibilities:
# - Wire up startup/shutdown lifecycle (DB, Redis)
# - Configure middleware: CORS, optional TrustedHost (production hardening)
# - Attach global exception handlers and rate limiter
# - Expose health check and API router
#
# Notes for maintainers:
# - CORS origins should be full origins (including scheme) in production (eg. https://app.example.com).
# - TrustedHostMiddleware is enabled only when ALLOWED_HOSTS is explicit (not "*").
# - Refresh/scale of workers and logging config may affect startup logs — see uvicorn docs for advanced config.

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import logging
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_db, disconnect_db
from app.core.redis import connect_redis, disconnect_redis
from app.api.v1.router import api_router
from app.core.exceptions import AppException
from app.core.openapi import custom_openapi
from app.core.responses import error_response, validation_error_response
from app.core.rate_limit import limiter

# ---------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------
# Use standard logging so production infra (eg. uvicorn, Docker, log collectors)
# can pick up structured records. Keep format simple and readable.
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Lifespan: startup and shutdown (async)
# ---------------------------------------------------------------------
# Using asynccontextmanager is the recommended modern pattern for FastAPI
# to run startup/shutdown code. Keep DB and Redis lifecycle here so tests
# and other components can rely on them being available.
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI-Powered Job Portal API (MVP)")
    # Connect services used by the app. If these raise, app startup will fail (desired).
    await connect_db()
    await connect_redis()
    try:
        yield
    finally:
        # Shutdown: disconnect in reverse order of startup where reasonable.
        # Note: ensure background tasks using Redis are drained before disconnect if applicable.
        logger.info("Shutting down AI-Powered Job Portal API")
        await disconnect_redis()
        await disconnect_db()

# ---------------------------------------------------------------------
# Create FastAPI app
# ---------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-Powered Job Portal - Authentication and Profile Management API (MVP)",
    lifespan=lifespan,
    docs_url="/docs" ,
    redoc_url="/redoc", 
    # docs_url="/docs" if settings.DEBUG else None,
    # redoc_url="/redoc" if settings.DEBUG else None,
)

# ---------------------------------------------------------------------
# Rate limiter (global)
# ---------------------------------------------------------------------
# We attach the limiter instance to app.state so it is available to
# route-level decorators and handlers. This helps protect auth endpoints
# from brute-force attempts even in MVP.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------
# CORS configuration
# ---------------------------------------------------------------------
# Prefer explicit CORS_ORIGINS in env that include schemes (eg. https://app.example.com).
# Fallback to ALLOWED_HOSTS only for convenience in local/dev.
if getattr(settings, "CORS_ORIGINS", None):
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
else:
    # If ALLOWED_HOSTS is "*", allow all origins for dev convenience.
    if settings.ALLOWED_HOSTS == "*":
        origins = ["*"]
    else:
        # WARNING: ALLOWED_HOSTS typically contains hostnames (example.com).
        # CORS needs full origins with scheme to match browser requests. We accept the fallback
        # here but log a warning so operators can set CORS_ORIGINS explicitly in production.
        origins = [h.strip() for h in settings.ALLOWED_HOSTS.split(",") if h.strip()]

# Attach CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS origins set to: {origins}")

# Warn if origins look like hostnames (lack scheme). Encourage explicit CORS_ORIGINS.
invalid = [o for o in origins if o != "*" and not (o.startswith("http://") or o.startswith("https://"))]
if invalid:
    logger.warning(
        "CORS origins include values without scheme (http/https). "
        "Prefer setting CORS_ORIGINS with full origins (eg https://app.example.com). "
        f"Detected: {invalid}"
    )

# ---------------------------------------------------------------------
# Trusted hosts (production hardening)
# ---------------------------------------------------------------------
# Enable TrustedHostMiddleware when allowed hosts are explicit (not "*").
# TrustedHostMiddleware protects against Host header attacks and should be used
# in production when you know your hostnames.
if settings.ALLOWED_HOSTS and settings.ALLOWED_HOSTS != "*":
    host_list = [h.strip() for h in settings.ALLOWED_HOSTS.split(",") if h.strip()]
    # FastAPI expects host patterns like "example.com" or "localhost".
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=host_list)
    logger.info("TrustedHostMiddleware enabled for hosts: %s", host_list)

# ---------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------
# Use application-specific exceptions to provide predictable error responses.
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return error_response(
        message=exc.message,
        errors={"details": exc.details} if exc.details else None,
        status_code=exc.status_code
    )

# Validation errors (client-side issues). We group field errors for frontend convenience.
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    field_errors = {}
    general_errors = []
    # Validation errors are client errors; warn rather than error to avoid noise.
    logger.warning(f"Validation error for {request.url}: {exc.errors()}")
    for error in exc.errors():
        if len(error["loc"]) > 1:
            field_name = str(error["loc"][-1])
            field_errors.setdefault(field_name, []).append(error["msg"])
        else:
            general_errors.append(error["msg"])

    return validation_error_response(
        message="Validation failed",
        details="Request payload does not match required schema",
        field_errors=field_errors or None,
        general_errors=general_errors or None
    )

# Fallback generic exception handler - preserves stack trace in DEBUG
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return error_response(
        message="Internal server error" if not settings.DEBUG else str(exc),
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

# ---------------------------------------------------------------------
# Health check (useful for k8s liveness/readiness)
# ---------------------------------------------------------------------
@app.get("/health")
async def health_check():
    from app.core.responses import success_response
    return success_response(
        message="System is healthy",
        data={
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }
    )

# -----------------------------------------------------------------------------
# Mount static files if needed (uncomment and ensure the directory exists)
# -----------------------------------------------------------------------------
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
# If you mount, be sure the 'uploads' directory exists or startup will fail.


# ---------------------------------------------------------------------
# Include application routers
# ---------------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")

# Use curated OpenAPI schema function (adds tags/metadata/security)
# Keep schema generation disabled in production by setting docs_url=None above.
app.openapi = lambda: custom_openapi(app)

# ---------------------------------------------------------------------
# Run with Uvicorn when invoked directly
# ---------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
