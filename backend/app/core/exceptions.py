# backend/app/core/exceptions.py
"""
Path: backend/app/core/exceptions.py

Centralized application exceptions.

HOW TO USE (IMPORTANT):
----------------------
You NEVER return these directly from endpoints.
You RAISE them, and FastAPI catches them via the global exception handler
defined in `main.py`.

Example usage inside services / endpoints:

    from app.core.exceptions import AuthenticationError

    if not user:
        raise AuthenticationError("Invalid email or password")

The global handler converts these into clean, consistent HTTP responses.

WHY THIS EXISTS:
---------------
- Avoid raising FastAPI HTTPException everywhere
- Keep business logic framework-agnostic
- Ensure consistent error payloads across the API
- Make errors easy to test and reason about

Design goals:
- Centralize API-friendly errors with HTTP status semantics.
- Lightweight and explicit so handlers (main.py) can build consistent HTTP responses.
- Provide a small helper to convert to FastAPI's HTTPException if you ever need to raise directly.

"""

from __future__ import annotations
from typing import Any, Optional, Dict

from fastapi import status


class AppException(Exception):
    """
    Base exception for all application-level errors.

    WHEN TO USE:
    - Never raise this directly unless you really mean a generic 4xx error.
    - Prefer raising one of the specific subclasses below.

    EXAMPLE:
        raise AppException("Something went wrong", status_code=400)

    Attributes:
        message     -> human-readable error message
        status_code -> HTTP status code to return
        details     -> optional structured error details
    """

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        details: Optional[Any] = None
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details

    # def to_dict(self) -> Dict[str, Any]:
    #     """
    #     Convert exception into a JSON-serializable dict.

    #     Used internally by the global exception handler.
    #     """
    #     payload: Dict[str, Any] = {"message": self.message}
    #     if self.details is not None:
    #         payload["details"] = self.details
    #     return payload


# -------------------------------------------------------------------------
# AUTHENTICATION & AUTHORIZATION ERRORS
# -------------------------------------------------------------------------

class AuthenticationError(AppException):
    """
    WHEN TO CALL:
    - Invalid credentials (wrong email/password)
    - Expired or invalid JWT
    - Missing authentication token
    - Revoked session

    HTTP STATUS:
    - 401 Unauthorized

    EXAMPLES:
        raise AuthenticationError("Invalid email or password")

        raise AuthenticationError("Token expired")

        raise AuthenticationError("Login required")
    """

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Any] = None
    ):
        super().__init__(message=message, status_code=401, details=details)


class ForbiddenError(AppException):
    """
    WHEN TO CALL:
    - User is authenticated but not allowed to access a resource
    - Missing role / permission
    - Employer trying to access candidate-only endpoint

    HTTP STATUS:
    - 403 Forbidden

    EXAMPLES:
        raise ForbiddenError("You do not have permission to perform this action")

        raise ForbiddenError("Admin access required")
    """

    def __init__(
        self,
        message: str = "Forbidden",
        details: Optional[Any] = None
    ):
        super().__init__(message=message, status_code=403, details=details)


# -------------------------------------------------------------------------
# VALIDATION & BUSINESS LOGIC ERRORS
# -------------------------------------------------------------------------

class ValidationError(AppException):
    """
    WHEN TO CALL:
    - Business rule validation fails (NOT pydantic)
    - Invalid state transition
    - Domain-level validation error

    NOT FOR:
    - Request body validation (FastAPI handles that automatically)

    HTTP STATUS:
    - 422 Unprocessable Entity

    EXAMPLES:
        raise ValidationError("Password must be at least 8 characters")

        raise ValidationError(
            "Profile incomplete",
            details={"missing_fields": ["experience", "skills"]}
        )
    """

    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[Any] = None
    ):
        super().__init__(message=message, status_code=422, details=details)


class ConflictError(AppException):
    """
    WHEN TO CALL:
    - Duplicate resource creation
    - Unique constraint violation
    - State conflict (already applied, already verified, etc.)

    HTTP STATUS:
    - 409 Conflict

    EXAMPLES:
        raise ConflictError("Email already registered")

        raise ConflictError("Job already closed")

        raise ConflictError(
            "User already applied for this job",
            details={"job_id": job_id}
        )
    """

    def __init__(
        self,
        message: str = "Conflict",
        details: Optional[Any] = None
    ):
        super().__init__(message=message, status_code=409, details=details)


class NotFoundError(AppException):
    """
    WHEN TO CALL:
    - Requested resource does not exist
    - Object lookup by ID fails

    HTTP STATUS:
    - 404 Not Found

    EXAMPLES:
        raise NotFoundError("User not found")

        raise NotFoundError("Job not found")

        raise NotFoundError(
            "Application not found",
            details={"application_id": application_id}
        )
    """

    def __init__(
        self,
        message: str = "Not found",
        details: Optional[Any] = None
    ):
        super().__init__(message=message, status_code=404, details=details)



class FileUploadError(AppException):
    """File upload related errors"""
    
    def __init__(self, message: str = "File upload failed", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            details=details
        )
