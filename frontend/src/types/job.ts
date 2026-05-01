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

export interface JobPublic {
  id: string;
  organization_id: string;

  // 👇 added fields from backend join
  organization_name: string;
  logo_url?: string;

  title: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  vacancies?: number;

  job_type: JobType;
  work_mode: WorkMode;
  experience_level: ExperienceLevel;

  required_skills?: string[];
  preferred_skills?: string[];
  minimum_years_experience?: number;

  location?: {
    city?: string;
    state?: string;
    country?: string;
  };

  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;

  category?: string;
  department?: string;
  benefits?: string[];

  application_deadline?: string;
  application_url?: string;

  status?: JobStatus;
  is_featured?: boolean;
  view_count?: number;
  application_count?: number;

  created_at?: string;
  updated_at?: string;
  published_at?: string;
}



// ============================================================================
// JOB REQUEST/RESPONSE TYPES
// ============================================================================

export type JobRequest = Omit<
  Job,
  | 'id'
  | 'organization_id'
  | 'created_by_employer_id'
  | 'collaborator_employer_ids'
  | 'view_count'
  | 'application_count'
  | 'created_at'
  | 'updated_at'
  | 'published_at'
>;

// export interface JobRequest {
//   job: Omit<Job, 'id' | 'organization_id' | 'created_by_employer_id' | 'collaborator_employer_ids' | 'view_count' | 'application_count' | 'created_at' | 'updated_at' | 'published_at'>;
// }

export interface JobResponse {
  job: Job | JobPublic;
}

// export interface JobPublicResponse {
//   job: Omit<Job, 'created_by_employer_id' | 'collaborator_employer_ids' | 'metadata' | 'view_count' | 'application_count'>;
// }

// ============================================================================
// JOB SEARCH AND FILTERING
// ============================================================================

export interface JobSearchFilters {
  q?: string;                        // search across title + description
  job_type?: JobType;
  work_mode?: WorkMode;
  experience_level?: ExperienceLevel;
  category?: string;
  location_city?: string;
  location_country?: string;
  salary_min?: number;
  required_skills?: string;          // comma-separated: "python,react"
  is_featured?: boolean;
  sort_by?: 'published_at' | 'salary_min' | 'title' | 'created_at';
  sort_order?: 'asc' | 'desc';
  offset?: number;
  // NOTE: limit is hardcoded on the backend — do NOT send it
}

export interface JobListResponse {
  jobs: Job[] | JobPublic[];
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
  offset?: number;
  status_filter?: JobStatus;
  q?: string;
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
// JOB APPLICATION TYPES 
// ============================================================================
export interface PipelineStage {
  id: string;
  name: string;
  order: number;
}

export interface AppliedJobItem {
  id: string; // application id
  status: string;
  current_stage_id: string | null;
  applied_at: string;
  last_updated_at: string;
  stage_updated_at?: string;
  job: Partial<JobPublic>;
  pipeline: {
    stages: PipelineStage[];
  };
}

export interface AppliedJobsResponse {
  applications: AppliedJobItem[];
}