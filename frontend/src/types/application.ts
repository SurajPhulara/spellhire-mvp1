// Application Tracking Types - Application and pipeline-related types and interfaces

import { ApplicationStatus } from '@/types';

// ============================================================================
// PIPELINE STAGE TYPES
// ============================================================================

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  is_default: boolean;
  description?: string;
}

export interface PipelineStageCreate {
  name: string;
  order?: number;
  color?: string;
  description?: string;
}

export interface PipelineStageUpdate {
  name?: string;
  order?: number;
  color?: string;
  description?: string;
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface Pipeline {
  id: string;
  job_id: string;
  created_by_id: string;
  stages: PipelineStage[];
  is_active: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface PipelineCreate {
  stages: PipelineStageCreate[];
}

export interface PipelineUpdate {
  stages: PipelineStage[];
  is_active?: boolean;
}

export interface PipelineResponse {
  pipeline: Pipeline;
}

// ============================================================================
// APPLICATION TYPES
// ============================================================================

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  pipeline_id: string;
  current_stage_id?: string;
  
  // Application Details
  status: ApplicationStatus;
  cover_letter?: string;
  resume_url?: string;
  notes?: string;
  
  // Tracking
  applied_at: string; // ISO date string
  last_updated_at: string; // ISO date string
  stage_updated_at: string; // ISO date string
  
  // Rejection/Hire Details
  rejection_reason?: string;
  rejection_feedback?: string;
  hired_at?: string; // ISO date string
}

export interface ApplicationCreate {
  job_id: string;
  cover_letter?: string;
  resume_url?: string;
}

export interface ApplicationUpdate {
  current_stage_id?: string;
  status?: ApplicationStatus;
  notes?: string;
  rejection_reason?: string;
  rejection_feedback?: string;
}

export interface ApplicationResponse {
  application: Application;
}

export interface ApplicationListResponse {
  applications: Application[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// APPLICATION WITH CANDIDATE INFO (for kanban board)
// ============================================================================

export interface CandidateSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_picture_url?: string;
  professional_summary?: string;
  total_experience?: number;
  current_salary?: number;
  expected_salary?: number;
  skills: Array<{
    name: string;
    level: string;
  }>;
  resume_url?: string;
}

export interface ApplicationWithCandidate {
  application: Application;
  candidate: CandidateSummary;
  current_stage?: PipelineStage;
}

export interface ApplicationWithCandidateResponse {
  application_with_candidate: ApplicationWithCandidate;
}

export interface ApplicationWithCandidateListResponse {
  applications_with_candidates: ApplicationWithCandidate[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// STAGE HISTORY TYPES
// ============================================================================

export interface ApplicationStageHistory {
  id: string;
  application_id: string;
  from_stage_id?: string;
  to_stage_id: string;
  changed_by_id?: string;
  changed_at: string; // ISO date string
}

export interface ApplicationStageHistoryResponse {
  stage_history: ApplicationStageHistory[];
}

// ============================================================================
// KANBAN BOARD TYPES
// ============================================================================

export interface KanbanColumn {
  stage: PipelineStage;
  applications: ApplicationWithCandidate[];
  count: number;
}

export interface KanbanBoard {
  job_id: string;
  job_title: string;
  columns: KanbanColumn[];
  total_applications: number;
}

export interface KanbanBoardResponse {
  kanban_board: KanbanBoard;
}

// ============================================================================
// BULK OPERATIONS TYPES
// ============================================================================

export interface BulkStageUpdate {
  application_ids: string[];
  new_stage_id: string;
  notes?: string;
}

export interface BulkStatusUpdate {
  application_ids: string[];
  new_status: ApplicationStatus;
  rejection_reason?: string;
  rejection_feedback?: string;
}

export interface BulkOperationResponse {
  updated_count: number;
  failed_applications: string[];
}

// ============================================================================
// APPLICATION FILTERS
// ============================================================================

export interface ApplicationFilters {
  status?: ApplicationStatus;
  stage_id?: string;
  applied_after?: string; // ISO date string
  applied_before?: string; // ISO date string
  has_notes?: boolean;
  search_query?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// APPLICATION STATISTICS
// ============================================================================

export interface ApplicationStats {
  total_applications: number;
  applications_by_status: Record<string, number>;
  applications_by_stage: Record<string, number>;
  average_time_in_stage: Record<string, number>;
  conversion_rate: number;
}

export interface ApplicationStatsResponse {
  stats: ApplicationStats;
}

// ============================================================================
// CANDIDATE APPLICATION TYPES
// ============================================================================

export interface CandidateApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  current_stage_id?: string;
  status: ApplicationStatus;
  cover_letter?: string;
  resume_url?: string;
  notes?: string;
  applied_at: string; // ISO date string
  last_updated_at: string; // ISO date string
  stage_updated_at: string; // ISO date string
  rejection_reason?: string;
  rejection_feedback?: string;
  hired_at?: string; // ISO date string
  job: {
    id: string;
    title: string;
    description: string;
    location: {
      city: string;
      state: string;
      country: string;
    };
    job_type: string;
    work_mode: string;
    salary_min?: number;
    salary_max?: number;
    organization: {
      id: string;
      name: string;
      logo_url?: string;
    };
  };
}

export interface CandidateApplicationListResponse {
  applications: CandidateApplication[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// CURRENT STAGE INFO TYPES
// ============================================================================

export interface CurrentStageInfo {
  current_stage?: PipelineStage;
  progress_percentage: number;
  stages_cleared: PipelineStage[];
  total_stages: number;
  application_status: ApplicationStatus;
  stage_updated_at: string; // ISO date string
}

export interface CurrentStageInfoResponse {
  current_stage?: PipelineStage;
  progress_percentage: number;
  stages_cleared: PipelineStage[];
  total_stages: number;
  application_status: ApplicationStatus;
  stage_updated_at: string;
}

// ============================================================================
// APPLICATION MANAGEMENT QUERY PARAMETERS
// ============================================================================

export interface ApplicationManagementFilters {
  page?: number;
  limit?: number;
  status_filter?: ApplicationStatus;
  stage_id?: string;
  search_query?: string;
}
