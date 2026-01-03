# backend/app/core/responses.py
"""
Path: backend/app/core/responses.py

Helpers to produce consistent JSON responses across the API.

Purpose:
- Provide small, reusable helpers for success/errors/validation responses.
- Keep response shape consistent so frontend and clients can rely on it.
- Used by exception handlers (main.py) and controllers to return structured responses.
"""

from typing import Any, Optional, Dict, List
from fastapi import Response, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder


def success_response(
    message: str = "OK",
    data: Optional[Any] = None,
    status_code: int = status.HTTP_200_OK,
    response: Optional[Response] = None,
) -> JSONResponse:
    """
    Standard success response.

    Shape:
    {
      "success": True,
      "message": "...",
      "data": { ... } | null
    }

    If `response` is provided, it will be used (cookies/headers preserved).
    Otherwise, a new JSONResponse is created and returned.
    
    """
    payload: Dict[str, Any] = {"success": True, "message": message, "data": jsonable_encoder(data)}

    if response is not None:
        # FastAPI will serialize this dict using the provided response object
        response.status_code = status_code
        # Store payload for FastAPI to send
        response.media_type = "application/json"
        response.body = JSONResponse(content=payload).body
        return response


    return JSONResponse(status_code=status_code, content=payload)


def error_response(
    message: str = "An error occurred",
    errors: Optional[Any] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> JSONResponse:
    """
    Standard error response for general errors and AppException usage.

    Shape:
    {
      "success": False,
      "message": "...",
      "errors": { ... } | [ ... ] | string | null
    }
    """
    payload: Dict[str, Any] = {"success": False, "message": message}
    if errors is not None:
        payload["errors"] = errors
    return JSONResponse(status_code=status_code, content=payload)


def validation_error_response(
    message: str = "Validation failed",
    details: str = "Request payload does not match required schema",
    field_errors: Optional[Dict[str, List[str]]] = None,
    general_errors: Optional[List[str]] = None,
    status_code: int = status.HTTP_422_UNPROCESSABLE_ENTITY,
) -> JSONResponse:
    """
    Structured response specifically for validation errors (RequestValidationError).

    Shape:
    {
      "success": False,
      "message": "Validation failed",
      "field_errors": { "field_name": ["msg1", "msg2"] } | null,
      "general_errors": ["...", ...] | null
    }
    """
    payload: Dict[str, Any] = {
        "success": False,
        "message": message,
        "details": details 
    }
    if field_errors:
        payload["field_errors"] = field_errors
    if general_errors:
        payload["general_errors"] = general_errors
    return JSONResponse(status_code=status_code, content=payload)
