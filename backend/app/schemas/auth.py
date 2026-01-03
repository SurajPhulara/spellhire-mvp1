# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re
from app.models.enums import UserType


# ------------------------
# Shared Validators
# ------------------------
def validate_password_strength(password: str) -> str:
    """Shared password validation logic"""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character")
    return password


# ------------------------
# Base Auth Requests
# ------------------------
class AuthRequest(BaseModel):
    """For register and login"""
    email: EmailStr = Field(description="User email address", example="john.doe@example.com")
    password: str = Field(min_length=8, max_length=128, description="Password", example="SecurePass123!")
    user_type: UserType = Field(description="User type (candidate or employer)", example="CANDIDATE")

    @field_validator("password")
    def validate_password(cls, v):
        return validate_password_strength(v)


class GoogleAuthRequest(BaseModel):
    """For Google OAuth login/signup"""
    token: str = Field(description="Google ID token", example="ya29.a0ARrdaM...")
    user_type: UserType = Field(description="User type (candidate or employer)", example="CANDIDATE")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(description="Registered user email", example="john.doe@example.com")
    user_type: UserType = Field(description="User type (candidate or employer)", example="CANDIDATE")


class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(description="Registered user email", example="john.doe@example.com")
    user_type: UserType = Field(description="User type (candidate or employer)", example="CANDIDATE")
    otp: str = Field(description="OTP received via email", example="123456")
    new_password: str = Field(min_length=8, max_length=128, description="New password", example="NewSecurePass123!")

    @field_validator("new_password")
    def validate_new_password(cls, v):
        return validate_password_strength(v)


class VerifyEmailRequest(BaseModel):
    otp: str = Field(description="OTP received via email", example="123456")


class ResendVerificationRequest(BaseModel):
    email: EmailStr = Field(description="Registered user email", example="john.doe@example.com")
    user_type: UserType = Field(description="User type (candidate or employer)", example="CANDIDATE")
