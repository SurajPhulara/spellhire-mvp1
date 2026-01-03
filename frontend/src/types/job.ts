// Job Types - Job-related types and interfaces

import { JobType, WorkMode, ExperienceLevel } from './base';

// ============================================================================
// JOB ENUMS
// ============================================================================

export enum JobStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
}

export enum ApplicationStatus {
  APPLIED = "APPLIED",
  IN_REVIEW = "IN_REVIEW",
  INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
  INTERVIEWED = "INTERVIEWED",
  SHORTLISTED = "SHORTLISTED",
  REJECTED = "REJECTED",
  HIRED = "HIRED",
  WITHDRAWN = "WITHDRAWN",
}

// ============================================================================
// JOB SCHEMAS
// ============================================================================

export interface JobLocation {
  city: string;
  state: string;
  country: string;
}

export interface Job {
  id: string;
  organization_id: string;
  created_by_employer_id: string;
  collaborator_employer_ids: string[];
  metadata: Record<string, any>;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  vacancies: number;
  job_type: JobType;
  work_mode: WorkMode;
  experience_level: ExperienceLevel;
  required_skills: string[];
  preferred_skills: string[];
  minimum_years_experience: number;
  location: JobLocation;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  category: string;
  department: string;
  benefits: string[];
  application_deadline?: string; // ISO date string
  application_url?: string;
  status: JobStatus;
  is_featured: boolean;
  view_count: number;
  application_count: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  published_at?: string; // ISO date string
}

// ============================================================================
// JOB REQUEST/RESPONSE TYPES
// ============================================================================

export interface JobRequest {
  job: Omit<Job, 'id' | 'organization_id' | 'created_by_employer_id' | 'collaborator_employer_ids' | 'view_count' | 'application_count' | 'created_at' | 'updated_at' | 'published_at'>;
}

export interface JobResponse {
  job: Job;
}

export interface JobPublicResponse {
  job: Omit<Job, 'created_by_employer_id' | 'collaborator_employer_ids' | 'metadata' | 'view_count' | 'application_count'>;
}

// ============================================================================
// JOB SEARCH AND FILTERING
// ============================================================================

export interface JobSearchFilters {
  title?: string;
  category?: string;
  job_type?: JobType;
  work_mode?: WorkMode;
  experience_level?: ExperienceLevel;
  location_city?: string;
  location_country?: string;
  salary_min?: number;
  salary_max?: number;
  required_skills?: string;
  is_featured?: boolean;
  organization_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface JobListPublicResponse {
  jobs: Omit<Job, 'created_by_employer_id' | 'collaborator_employer_ids' | 'metadata' | 'view_count' | 'application_count'>[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// JOB STATUS UPDATE
// ============================================================================

export interface JobStatusUpdateRequest {
  new_status: JobStatus;
}

// ============================================================================
// JOB MANAGEMENT QUERY PARAMETERS
// ============================================================================

export interface JobManagementFilters {
  page?: number;
  limit?: number;
  status_filter?: JobStatus;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// JOB STATISTICS
// ============================================================================

export interface JobStats {
  total_jobs: number;
  active_jobs: number;
  draft_jobs: number;
  paused_jobs: number;
  closed_jobs: number;
  featured_jobs: number;
  total_views: number;
  total_applications: number;
}

// ============================================================================
// JOB APPLICATION TYPES (for future use)
// ============================================================================

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  cover_letter?: string;
  resume_url?: string;
  applied_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface JobApplicationRequest {
  job_id: string;
  cover_letter?: string;
  resume_url?: string;
}

export interface JobApplicationResponse {
  application: JobApplication;
}
