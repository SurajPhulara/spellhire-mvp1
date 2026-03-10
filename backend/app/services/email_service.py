# Path: backend/app/services/email.py
"""
Email service utility for the application.

Design notes:
- Uses simple text templates stored in backend/app/templates/*.txt.
- Template format: first line starts with "SUBJECT: <subject text>"
  then a blank line followed by the body. Templates can use ${var}
  placeholders (string.Template style) which are safely substituted.
- Default provider: SMTP (settings.EMAIL_PROVIDER == "smtp").
  A resend provider placeholder exists (RESEND_API_KEY), but current
  implementation prioritizes SMTP for simplicity.
- This service is synchronous intentionally so it can be run using
  FastAPI BackgroundTasks (background_tasks.add_task(...)).
- It does NOT raise on email-send failures by default; instead it logs
  errors and raises if explicitly asked (useful for debugging).
"""

from __future__ import annotations
import smtplib
import ssl
from email.message import EmailMessage
from string import Template
from pathlib import Path
from typing import Dict, Any, Optional
import logging
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class TemplateNotFound(Exception):
    pass


class EmailService:
    """
    Simple EmailService that reads text templates from the `app/templates`
    directory and sends emails via SMTP (default). Intended to be used with
    FastAPI BackgroundTasks.
    """

    # where templates live: backend/app/templates/
    TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "templates"

    @classmethod
    def _load_template_raw(cls, template_name: str) -> str:
        """
        Load a raw template file from templates directory.

        Template file format:
          SUBJECT: <subject line>
          
          <body text with placeholders like ${name} and ${action_url}>

        Raises TemplateNotFound if missing.
        """
        path = cls.TEMPLATES_DIR / f"{template_name}.txt"
        if not path.exists():
            raise TemplateNotFound(f"Template not found: {path}")
        return path.read_text(encoding="utf-8")

    @classmethod
    def _parse_template(cls, raw: str) -> (str, str):
        """
        Parse raw template into (subject, body).
        The first non-empty line that starts with "SUBJECT:" is used as subject.
        Everything after the first blank line after the SUBJECT is the body.
        """
        lines = raw.splitlines()
        subject = None
        body_lines = []
        # find SUBJECT line
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if line.startswith("SUBJECT:"):
                subject = line[len("SUBJECT:"):].strip()
                i += 1
                break
            i += 1
        # skip until blank line (if any)
        while i < len(lines) and lines[i].strip() == "":
            i += 1
        # remaining is body
        body_lines = lines[i:]
        body = "\n".join(body_lines).rstrip()
        if subject is None:
            # fallback subject
            subject = settings.APP_NAME
        return subject, body

    @classmethod
    def _render(cls, template_str: str, context: Dict[str, Any]) -> str:
        """
        Render placeholders using string.Template.safe_substitute to avoid KeyErrors.
        Use simple ${var} placeholders.
        """
        try:
            return Template(template_str).safe_substitute(context or {})
        except Exception as e:
            logger.exception("Failed rendering template: %s", e)
            # fallback: return original template (not rendered)
            return template_str

    @classmethod
    def send_raw_email(
        cls,
        to_email: str,
        subject: str,
        body: str,
        from_name: Optional[str] = None,
        from_email: Optional[str] = None,
        html: bool = False,
        raise_on_error: bool = False,
    ) -> None:
        """
        Send a raw email via configured provider (SMTP by default).

        - from_name/from_email default to settings.EMAIL_FROM_NAME / settings.EMAIL_FROM
        - raise_on_error controls whether to raise exceptions to caller or just log them.
        """
        from_email = from_email or settings.EMAIL_FROM
        from_name = from_name or settings.EMAIL_FROM_NAME
        sender = f"{from_name} <{from_email}>" if from_name else from_email

        msg = EmailMessage()
        msg["From"] = sender
        msg["To"] = to_email
        msg["Subject"] = subject
        # prefer plain text content; if html True, set html variant too
        if html:
            msg.set_content("This message contains HTML. Please use an HTML-capable client.")
            msg.add_alternative(body, subtype="html")
        else:
            msg.set_content(body)

        # Currently only SMTP provider is implemented for sending.
        provider = (settings.EMAIL_PROVIDER or "smtp").lower()
        if provider == "smtp":
            try:
                host = settings.EMAIL_HOST
                port = settings.EMAIL_PORT
                username = settings.EMAIL_USERNAME
                password = settings.EMAIL_PASSWORD

                # choose SSL vs STARTTLS based on common ports
                if port == 465:
                    context = ssl.create_default_context()
                    with smtplib.SMTP_SSL(host=host, port=port, context=context) as server:
                        if username and password:
                            server.login(username, password)
                        server.send_message(msg)
                else:
                    # STARTTLS flow
                    with smtplib.SMTP(host=host, port=port, timeout=60) as server:
                        # Always attempt to starttls (most providers require it)
                        try:
                            server.starttls(context=ssl.create_default_context())
                        except Exception:
                            # Some local SMTP servers may not support STARTTLS
                            logger.debug("STARTTLS not available or failed")
                        if username and password:
                            server.login(username, password)
                        server.send_message(msg)

                logger.info("Email sent to %s (subject=%s)", to_email, subject)
            except Exception as exc:
                logger.exception("Failed to send email to %s: %s", to_email, exc)
                if raise_on_error:
                    raise
        elif provider == "resend":
            # Placeholder for Resend or other API-based provider. If you want to enable this,
            # implement a POST call to the provider's API here (using `httpx` or `requests`).
            # For now we log and optionally raise.
            logger.warning("EMAIL_PROVIDER='resend' selected but no implementation available. Email not sent.")
            if raise_on_error:
                raise RuntimeError("Resend provider not implemented on server")
        else:
            logger.warning("Unsupported email provider '%s'", provider)
            if raise_on_error:
                raise RuntimeError(f"Unsupported email provider: {provider}")

    # ---------- convenience methods that use templates ----------

    @classmethod
    def send_template_email(
        cls,
        to_email: str,
        template_name: str,
        context: Optional[Dict[str, Any]] = None,
        from_name: Optional[str] = None,
        from_email: Optional[str] = None,
        html: bool = False,
        raise_on_error: bool = False,
    ) -> None:
        """
        Render a named template and send it.

        Example:
            EmailService.send_template_email(
                "john@example.com",
                "verification_email",
                {"name": "John", "action_url": url, "expires_at": "2025-12-21T12:00:00Z"}
            )
        """
        raw = cls._load_template_raw(template_name)
        subject_tpl, body_tpl = cls._parse_template(raw)
        subject = cls._render(subject_tpl, context or {})
        body = cls._render(body_tpl, context or {})
        cls.send_raw_email(
            to_email=to_email,
            subject=subject,
            body=body,
            from_name=from_name,
            from_email=from_email,
            html=html,
            raise_on_error=raise_on_error,
        )

    @classmethod
    def send_verification_otp(
        cls,
        to_email: str,
        otp: str,
        expires_at: Optional[datetime],
        user_id: Optional[str] = None,
        name: Optional[str] = None,
        raise_on_error: bool = False,
    ) -> None:
        """
        Convenience to send the verification email. Builds a frontend action URL.
        """
        # action_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/verify-email?token={token}"
        # if user_id:
        #     action_url += f"&user_id={user_id}"
        ctx = {
            "name": name or "",
            "otp": otp,
            "expires_at": (expires_at.isoformat() if expires_at else ""),
            "app_name": settings.APP_NAME,
        }
        cls.send_template_email(
            to_email=to_email,
            template_name="verification_email",
            context=ctx,
            raise_on_error=raise_on_error,
        )

    @classmethod
    def send_password_reset_email(
        cls,
        to_email: str,
        reset_token: str,
        expires_at: Optional[datetime],
        user_id: Optional[str] = None,
        name: Optional[str] = None,
        raise_on_error: bool = False,
    ) -> None:
        action_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={reset_token}"
        if user_id:
            action_url += f"&user_id={user_id}"
        ctx = {
            "name": name or "",
            "action_url": action_url,
            "expires_at": (expires_at.isoformat() if expires_at else ""),
            "app_name": settings.APP_NAME,
        }
        cls.send_template_email(
            to_email=to_email,
            template_name="password_reset",
            context=ctx,
            raise_on_error=raise_on_error,
        )

    @classmethod
    def send_welcome_email(
        cls,
        to_email: str,
        name: Optional[str] = None,
        raise_on_error: bool = False,
    ) -> None:
        ctx = {"name": name or "", "app_name": settings.APP_NAME}
        cls.send_template_email(
            to_email=to_email,
            template_name="welcome_email",
            context=ctx,
            raise_on_error=raise_on_error,
        )

    @classmethod
    def send_notification(
        cls,
        to_email: str,
        subject: str,
        message: str,
        raise_on_error: bool = False,
    ) -> None:
        ctx = {"message": message, "app_name": settings.APP_NAME}
        # For notifications we can use the `notification` template but override subject/body:
        cls.send_raw_email(
            to_email=to_email,
            subject=subject,
            body=message,
            raise_on_error=raise_on_error,
        )
