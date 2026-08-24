// src/types/profile.ts
// Profile Types - Candidate, Employer, and Organization profile types

import { 
  Gender, 
  JobType, 
  WorkMode, 
  EmployerRole,
  EmployerProfileStatus,
  CompanySize, 
  Skill, 
  Experience, 
  Education, 
  Language, 
  Certification 
} from './base';

// ============================================================================
// CANDIDATE PROFILE TYPES
// ============================================================================

export interface CandidateProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string; // ISO date string
  gender?: Gender;
  address?: string;
  is_active: boolean;
  is_profile_complete: boolean;
  professional_summary?: string;
  total_experience?: number;
  current_salary?: number;
  expected_salary?: number;
  preferred_job_type?: JobType;
  preferred_work_mode?: WorkMode;
  preferred_locations?: string[];
  notice_period?: number;
  skills?: Skill[];
  experience?: Experience[];
  education?: Education[];
  languages?: Language[];
  certifications?: Certification[];
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  resume_url?: string;
  profile_picture_url?: string;
  is_available_for_work?: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface CandidateProfileRequest {
  candidate: Omit<CandidateProfile, 'id' | 'is_profile_complete' | 'created_at' | 'updated_at' | 'is_active'>;
}

export interface CandidateProfileResponse {
  candidate: CandidateProfile;
}


// ============================================================================
// EMPLOYER PROFILE TYPES
// ============================================================================

export interface EmployerProfile {
  id?: string;
  user_id?: string | null;
  organization_id?: string;
  first_name?: string;
  last_name?: string | null;
  email?: string;
  gender?: Gender;
  bio?: string;
  profile_picture_url?: string;
  phone?: string;
  work_phone?: string;
  work_location?: string;
  department?: string | null;
  reporting_manager_id?: string;
  job_title?: string | null;
  employment_type?: JobType;
  hire_date?: string; // ISO date string
  role?: EmployerRole;
  status?: EmployerProfileStatus;
  skills?: Skill[];
  experience_years?: number | null;
  invited_at?: string | null;
  accepted_at?: string | null;
  is_active?: boolean;
  is_profile_complete?: boolean;
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
}

export interface EmployerRequest {
  employer: Omit<
    EmployerProfile,
    | 'id'
    | 'is_profile_complete'
    | 'created_at'
    | 'updated_at'
    | 'organization_id'
    | 'user_id'
    | 'status'
    | 'invited_at'
    | 'accepted_at'
  >;
}

export interface EmployerResponse {
  employer: EmployerProfile;
}

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export interface Organization {
  name: string;
  description: string;
  industry: string;
  company_size: CompanySize;
  headquarters_location: string;
  website?: string;
  contact_email: string;
  phone: string;
  additional_locations?: string[];
  founded_on?: string; // ISO date string
  mission?: string;
  benefits_overview?: string;
  company_culture?: string;
  logo_url?: string;
  id: string;
  is_profile_complete?: boolean;
  is_active: boolean;
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
}

export interface OrganizationRequest {
  organization: Omit<Organization, 'id' | 'is_profile_complete' | 'created_at' | 'updated_at'>;
}

export interface OrganizationResponse {
  organization: Organization;
}

// export interface OrganizationPublicResponse {
//   organization: Omit<Organization, 'id' | 'is_profile_complete' | 'created_at' | 'updated_at'>;
// }
