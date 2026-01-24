from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """
    Central application configuration loaded from environment variables.

    Rules:
    - This file contains ONLY configuration (no app logic, no imports from services).
    - Anything that affects runtime behavior should be declared here.
    """

    # ------------------------------------------------------------------
    # Application
    # ------------------------------------------------------------------
    APP_NAME: str = "AI-Powered Job Portal"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Base URL of frontend (used for email links, redirects, etc.)
    FRONTEND_BASE_URL: Optional[str] = None

    # ------------------------------------------------------------------
    # Security / Auth
    # ------------------------------------------------------------------
    SECRET_KEY: str = Field(..., min_length=32, description="JWT secret key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    DATABASE_URL: str = Field(..., description="PostgreSQL database URL")
    DATABASE_URL_ASYNC: Optional[str] = None

    # ------------------------------------------------------------------
    # Redis
    # ------------------------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: Optional[str] = None

    # ------------------------------------------------------------------
    # CORS & Hosts
    # ------------------------------------------------------------------
    # Full origins for browser access (https://app.example.com)
    CORS_ORIGINS: Optional[str] = None

    # Backend hostnames for TrustedHostMiddleware
    ALLOWED_HOSTS: str = "*"

    # ------------------------------------------------------------------
    # Email
    # ------------------------------------------------------------------
    EMAIL_PROVIDER: str = "smtp"
    EMAIL_HOST: str = "smtp.sendgrid.net"
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: str = "apikey"
    EMAIL_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@jobportal.com"
    EMAIL_FROM_NAME: str = "Job Portal"

    # Alternative Email Provider
    RESEND_API_KEY: Optional[str] = None

    # ------------------------------------------------------------------
    # AI / ML
    # ------------------------------------------------------------------
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    AI_MODEL_PROVIDER: str = "openai"
    AI_CACHE_TTL: int = 3600
    AI_MAX_TOKENS: int = 4000
    AI_TEMPERATURE: float = 0.1

    # ------------------------------------------------------------------
    # File Uploads
    # ------------------------------------------------------------------
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: str = (
        "image/jpeg,image/png,image/gif,"
        "application/pdf,application/msword,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    # File Storage (AWS S3)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    # Alternative File Storage (Cloudinary)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # ------------------------------------------------------------------
    # Rate Limiting
    # ------------------------------------------------------------------
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 100

    # ------------------------------------------------------------------
    # Pagination
    # ------------------------------------------------------------------
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # ------------------------------------------------------------------
    # Monitoring / Logging
    # ------------------------------------------------------------------
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    # ------------------------------------------------------------------
    # Computed helpers
    # ------------------------------------------------------------------
    @property
    def allowed_file_types_list(self) -> list[str]:
        return self.ALLOWED_FILE_TYPES.split(",")

    @property
    def database_url_async_computed(self) -> str:
        if self.DATABASE_URL_ASYNC:
            return self.DATABASE_URL_ASYNC
        return self.DATABASE_URL.replace(
            "postgresql://",
            "postgresql+asyncpg://"
        )


settings = Settings()
