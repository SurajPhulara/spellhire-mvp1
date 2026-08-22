// frontend/src/types/application.ts
import { JobPreview, Pipeline } from '@/types/job';

export interface AppliedJobApplication {
  application_id: string;
  applied_at: string;
  last_updated_at: string;
  stage_updated_at: string;
  status: string;
  current_stage_id: string;
  job: JobPreview;
  pipeline_stages: {
    id: string;
    name: string;
    order: number;
  }[];
}

export interface AppliedJobsStats {
  total_applied: number;
  in_progress: number;
  offers: number;
  rejected: number;
}

export interface AppliedJobsResponse {
  applications: AppliedJobApplication[];
  stats: AppliedJobsStats;
}

export interface ApplicationStageHistory {
  from_stage_id?: string | null;
  to_stage_id: string;
  changed_at: string;
}

export interface ApplicationTimelineResponse {
  application_id: string;
  applied_at: string;
  last_updated_at: string;
  stage_updated_at: string;
  status: string;
  current_stage_id: string;
  job: JobPreview;
  pipeline_stages: {
    id: string;
    name: string;
    order: number;
  }[];
  stage_history: ApplicationStageHistory[];
}

export interface EmployerApplicationCandidate {
  id: string;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  profile_picture_url?: string | null;
  total_experience?: number | null;
  current_salary?: number | null;
  expected_salary?: number | null;
  preferred_locations?: string[];
  skills?: string[];
  resume_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  is_profile_complete?: boolean;
}

export interface EmployerJobApplication {
  application_id: string;
  applied_at: string;
  last_updated_at: string;
  stage_updated_at: string;
  status: string;
  current_stage_id: string;
  notes?: string | null;
  candidate: EmployerApplicationCandidate;
}

export interface EmployerJobApplicationsStats {
  total_applications: number;
  in_review: number;
  offers: number;
  rejected: number;
}

export interface EmployerJobApplicationsResponse {
  job: JobPreview;
  pipeline_stages: Pipeline[];
  stats: EmployerJobApplicationsStats;
  applications: EmployerJobApplication[];
}

export interface MoveApplicationStageRequest {
  stage_id: string;
}

export interface UpdatePipelineRequest {
  stages: Pipeline[];
}

export interface UpdateApplicationNotesRequest {
  notes: string | null;
}

export interface UpdatePipelineResponse {
  pipeline_stages: Pipeline[];
}

export interface UpdateApplicationNotesResponse {
  application_id: string;
  notes: string | null;
  last_updated_at: string;
}