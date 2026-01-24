// Base Types - Common types and enums used across the application

// ============================================================================
// ENUMS
// ============================================================================

export enum UserType {
  CANDIDATE = "CANDIDATE",
  EMPLOYER = "EMPLOYER",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export enum AuthMethod {
  EMAIL = "EMAIL",
  GOOGLE = "GOOGLE",
}

export enum UserStatus {
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  VERIFIED = "VERIFIED",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DEACTIVATED = "DEACTIVATED",
}

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP",
  FREELANCE = "FREELANCE",
}

export enum WorkMode {
  REMOTE = "REMOTE",
  ON_SITE = "ON_SITE",
  HYBRID = "HYBRID",
}

export enum ExperienceLevel {
  ENTRY = "ENTRY",
  JUNIOR = "JUNIOR",
  MID = "MID",
  SENIOR = "SENIOR",
  LEAD = "LEAD",
  EXECUTIVE = "EXECUTIVE",
}

export enum SkillLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum EmployerRole {
  ADMIN = "ADMIN",
  HR = "HR",
  EMPLOYER = "EMPLOYER",
}

export enum CompanySize {
  SIZE_1_10 = "SIZE_1_10",
  SIZE_11_50 = "SIZE_11_50",
  SIZE_51_200 = "SIZE_51_200",
  SIZE_201_500 = "SIZE_201_500",
  SIZE_501_1000 = "SIZE_501_1000",
  SIZE_1000_PLUS = "SIZE_1000_PLUS",
}


export enum LanguageProficiency {
  BASIC = "BASIC",
  CONVERSATIONAL = "CONVERSATIONAL",
  FLUENT = "FLUENT",
  NATIVE = "NATIVE"
}

// ============================================================================
// BASE TYPES
// ============================================================================

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  meta: PaginationMeta;
}

export interface UserSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  email_verified: boolean;
  user_type: UserType;
  status: UserStatus;
  profile_picture_url?: string;
  organization_name?: string;
  organization_logo?:string;
  is_profile_complete: boolean;
}

// ============================================================================
// NESTED SCHEMAS
// ============================================================================

export interface Skill {
  name: string;
  level: SkillLevel;
  years_experience?: number;
}

export interface Experience {
  company: string;
  position: string;
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  description: string;
  is_current_job: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year?: number;
  grade?: string;
}

export interface Language {
  name: string;
  proficiency: LanguageProficiency; // basic, conversational, fluent, native
}

export interface Certification {
  name: string;
  issuing_organization: string;
  issue_date: string; // ISO date string
  expiry_date?: string; // ISO date string
  credential_id?: string;
}


export interface SessionResponse {
  id: string;
  user_id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}