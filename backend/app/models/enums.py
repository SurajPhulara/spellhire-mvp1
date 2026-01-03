# backend/app/models/enums.py
import enum


class AuthMethod(str, enum.Enum):
    EMAIL = "EMAIL"
    GOOGLE = "GOOGLE"


class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"


class UserStatus(str, enum.Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"


class Role(str, enum.Enum):
    """User roles - stored in user_roles table"""
    CANDIDATE = "CANDIDATE"
    EMPLOYER = "EMPLOYER"


class EmployerRole(str, enum.Enum):
    ADMIN = "ADMIN"
    HR = "HR"
    EMPLOYER = "EMPLOYER"


class JobType(str, enum.Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    INTERNSHIP = "INTERNSHIP"
    FREELANCE = "FREELANCE"


class ExperienceLevel(str, enum.Enum):
    ENTRY = "ENTRY"
    JUNIOR = "JUNIOR"
    MID = "MID"
    SENIOR = "SENIOR"
    LEAD = "LEAD"
    EXECUTIVE = "EXECUTIVE"


class WorkMode(str, enum.Enum):
    REMOTE = "REMOTE"
    ON_SITE = "ON_SITE"
    HYBRID = "HYBRID"


class CompanySize(str, enum.Enum):
    SIZE_1_10 = "SIZE_1_10"
    SIZE_11_50 = "SIZE_11_50"
    SIZE_51_200 = "SIZE_51_200"
    SIZE_201_500 = "SIZE_201_500"
    SIZE_501_1000 = "SIZE_501_1000"
    SIZE_1000_PLUS = "SIZE_1000_PLUS"


class JobStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CLOSED = "CLOSED"


class ApplicationStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    IN_REVIEW = "IN_REVIEW"
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    INTERVIEWED = "INTERVIEWED"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"
    HIRED = "HIRED"
    WITHDRAWN = "WITHDRAWN"


class FileType(str, enum.Enum):
    RESUME = "RESUME"
    PROFILE_PICTURE = "PROFILE_PICTURE"
    COMPANY_LOGO = "COMPANY_LOGO"
    PORTFOLIO = "PORTFOLIO"
    COVER_LETTER = "COVER_LETTER"


class UserType(str, enum.Enum):
    CANDIDATE = "CANDIDATE"
    EMPLOYER = "EMPLOYER"


class ConversationType(str, enum.Enum):
    EMPLOYER_INTERNAL = "EMPLOYER_INTERNAL"
    CANDIDATE_INTERNAL = "CANDIDATE_INTERNAL"
    RECRUITER_TO_CANDIDATE = "RECRUITER_TO_CANDIDATE"


class MessageType(str, enum.Enum):
    TEXT = "TEXT"
    SYSTEM = "SYSTEM"