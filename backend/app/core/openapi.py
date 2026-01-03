# backend/app/core/openapi.py
"""
Path: backend/app/core/openapi.py

Custom OpenAPI generator for the application.

Purpose:
- Provide a single place to customize the OpenAPI schema (title, description, logo, contact, servers, security schemes).
- Cache the generated schema on the FastAPI app instance to avoid recomputing.
- Keep schema modifications minimal and predictable so other tooling (Swagger UI / ReDoc / API clients) behave normally.

Usage:
- In main.py we assign:
      app.openapi = lambda: custom_openapi(app)
  so FastAPI will use this function when serving /openapi.json and when creating the docs UI.

Notes:
- This function intentionally avoids network calls and heavy logic so it's safe at import time.
- Customize `settings` values (APP_NAME, VERSION, FRONTEND_BASE_URL, etc.) to change schema info.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from app.core.config import settings


def _build_servers() -> Optional[List[Dict[str, str]]]:
    """
    Build the `servers` list for OpenAPI from configuration.

    - If FRONTEND_BASE_URL is set, include it as a server (useful for docs linking).
    - If ALLOWED_HOSTS is explicit (not "*"), attempt to add http(s) variants (best-effort).
    - Return None if no useful server info is available.
    """
    servers: List[Dict[str, str]] = []

    # Prefer an explicit frontend base url (recommended)
    # if getattr(settings, "FRONTEND_BASE_URL", None):
    #     servers.append({"url": settings.FRONTEND_BASE_URL, "description": "Frontend"})

    # If ALLOWED_HOSTS is set explicitly, add it as a server hint (best-effort)
    if getattr(settings, "ALLOWED_HOSTS", None) and settings.ALLOWED_HOSTS != "*":
        hosts = [h.strip() for h in settings.ALLOWED_HOSTS.split(",") if h.strip()]
        for host in hosts:
            # If host already includes scheme, use it; otherwise prefer https
            if host.startswith("http://") or host.startswith("https://"):
                servers.append({"url": host, "description": "Allowed host"})
            else:
                # prefer https by default
                servers.append({"url": f"https://{host}", "description": "Allowed host (https)"})
                servers.append({"url": f"http://{host}", "description": "Allowed host (http)"})

    return servers or None


def _default_security_schemes() -> Dict[str, Any]:
    """
    Default security schemes to include in the OpenAPI spec.
    We're adding a standard HTTP bearer scheme for token-authenticated endpoints.
    """
    return {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Provide the JWT access token as: `Authorization: Bearer <token>`"
        }
    }


def custom_openapi(app: FastAPI) -> Dict[str, Any]:
    """
    Generate (and cache) OpenAPI schema for the given FastAPI app.

    The returned dict follows the OpenAPI v3 schema and is used by FastAPI to
    serve /openapi.json and render SwaggerUI / ReDoc.

    Behavior:
    - If app.openapi_schema exists, return it (cached).
    - Otherwise generate schema via get_openapi(), then augment with:
        - servers
        - securitySchemes
        - custom info (contact, license, logo in x-logo if desired)
    - Cache it as app.openapi_schema and return.

    Keep the changes minimal to avoid breaking tools that consume the OpenAPI JSON.
    """
    if getattr(app, "openapi_schema", None) is not None:
        return app.openapi_schema

    title = f"{settings.APP_NAME} API"
    description = getattr(settings, "DESCRIPTION", None) or f"{settings.APP_NAME} - API (version {settings.VERSION})"
    version = settings.VERSION

    # Base schema from FastAPI / Pydantic reflection
    openapi_schema = get_openapi(
        title=title,
        version=version,
        description=description,
        routes=app.routes,
    )

    # Servers (optional, helpful in docs)
    servers = _build_servers()
    if servers:
        openapi_schema["servers"] = servers

    # Security schemes (add or merge)
    components = openapi_schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    # Merge our default schemes without overwriting user-provided ones
    for k, v in _default_security_schemes().items():
        if k not in security_schemes:
            security_schemes[k] = v

    # Optionally add a global security requirement so endpoints that don't declare security
    # are not assumed open if you want to enforce auth in docs. We will NOT set a global
    # requirement here by default because that frequently confuses public endpoints.
    # If you want to require bearer globally, uncomment:
    # openapi_schema.setdefault("security", []).append({"bearerAuth": []})

    # Add helpful contact/license metadata if available
    info = openapi_schema.setdefault("info", {})
    contact = info.setdefault("contact", {})
    if getattr(settings, "EMAIL_FROM", None):
        contact["email"] = settings.EMAIL_FROM
    if getattr(settings, "FRONTEND_BASE_URL", None):
        contact["url"] = settings.FRONTEND_BASE_URL

    # Optionally attach a logo via extension x-logo for some UIs (e.g., Redoc)
    # Provide a friendly default only if FRONTEND_BASE_URL is available to host assets.
    if getattr(settings, "FRONTEND_BASE_URL", None):
        info.setdefault("x-logo", {"url": f"{settings.FRONTEND_BASE_URL.rstrip('/')}/static/logo.png"})

    # Cache and return
    app.openapi_schema = openapi_schema
    return app.openapi_schema
