// Application Service - Handles all application tracking and pipeline management API calls
import { apiClient } from '../client';
import {
  PipelineCreate,
  PipelineUpdate,
  PipelineResponse,
  ApplicationCreate,
  ApplicationUpdate,
  ApplicationResponse,
  ApplicationListResponse,
  ApplicationWithCandidateListResponse,
  ApplicationWithCandidateResponse,
  KanbanBoardResponse,
  BulkStageUpdate,
  BulkStatusUpdate,
  BulkOperationResponse,
  ApplicationFilters,
  ApplicationStatsResponse,
  ApplicationStageHistoryResponse,
  CandidateApplicationListResponse,
  CurrentStageInfoResponse,
  ApplicationManagementFilters,
  ApplicationStatus,
  PipelineStage,
  ApplicationWithCandidate,
  KanbanBoard,
  ApplicationStats,
  ApiResponse,
} from '@/types';

export class ApplicationService {
  // ============================================================================
  // PIPELINE MANAGEMENT ENDPOINTS (Employer Only)
  // ============================================================================

  // Create Pipeline
  static async createPipeline(jobId: string, data: PipelineCreate): Promise<ApiResponse<PipelineResponse>> {
    return await apiClient.post<PipelineResponse>(`/applications/pipelines/?job_id=${jobId}`, data);
  }

  // Get Pipeline
  static async getPipeline(jobId: string): Promise<ApiResponse<PipelineResponse>> {
    return await apiClient.get<PipelineResponse>(`/applications/pipelines/${jobId}`);
  }

  // Update Pipeline
  static async updatePipeline(jobId: string, data: PipelineUpdate): Promise<ApiResponse<PipelineResponse>> {
    return await apiClient.put<PipelineResponse>(`/applications/pipelines/${jobId}`, data);
  }

  // ============================================================================
  // APPLICATION MANAGEMENT ENDPOINTS (Employer Only)
  // ============================================================================

  // Get Job Applications
  static async getJobApplications(
    jobId: string,
    filters?: ApplicationManagementFilters
  ): Promise<ApiResponse<ApplicationWithCandidateListResponse>> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status_filter) params.append('status_filter', filters.status_filter);
    if (filters?.stage_id) params.append('stage_id', filters.stage_id);
    if (filters?.search_query) params.append('search_query', filters.search_query);

    const queryString = params.toString();
    const url = queryString ? `/applications/job/${jobId}?${queryString}` : `/applications/job/${jobId}`;
    
    return await apiClient.get<ApplicationWithCandidateListResponse>(url);
  }

  // Get Kanban Board
  static async getKanbanBoard(jobId: string): Promise<ApiResponse<KanbanBoardResponse>> {
    return await apiClient.get<KanbanBoardResponse>(`/applications/kanban/${jobId}`);
  }

  // Update Application
  static async updateApplication(
    applicationId: string,
    data: ApplicationUpdate
  ): Promise<ApiResponse<ApplicationResponse>> {
    return await apiClient.put<ApplicationResponse>(`/applications/${applicationId}`, data);
  }

  // ============================================================================
  // BULK OPERATIONS (Employer Only)
  // ============================================================================

  // Bulk Update Stage
  static async bulkUpdateStage(data: BulkStageUpdate): Promise<ApiResponse<BulkOperationResponse>> {
    return await apiClient.post<BulkOperationResponse>('/applications/bulk/stage', data);
  }

  // Bulk Update Status
  static async bulkUpdateStatus(data: BulkStatusUpdate): Promise<ApiResponse<BulkOperationResponse>> {
    return await apiClient.post<BulkOperationResponse>('/applications/bulk/status', data);
  }

  // ============================================================================
  // APPLICATION STATISTICS (Employer Only)
  // ============================================================================

  // Get Application Statistics
  static async getApplicationStats(jobId: string): Promise<ApiResponse<ApplicationStatsResponse>> {
    return await apiClient.get<ApplicationStatsResponse>(`/applications/stats/${jobId}`);
  }

  // ============================================================================
  // CANDIDATE APPLICATION ENDPOINTS
  // ============================================================================

  // Apply for Job
  static async applyForJob(data: ApplicationCreate): Promise<ApiResponse<ApplicationResponse>> {
    return await apiClient.post<ApplicationResponse>('/applications/', data);
  }

  // Get My Applications
  static async getMyApplications(
    filters?: ApplicationFilters
  ): Promise<ApiResponse<CandidateApplicationListResponse>> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status_filter', filters.status);
    if (filters?.applied_after) params.append('applied_after', filters.applied_after);
    if (filters?.applied_before) params.append('applied_before', filters.applied_before);
    if (filters?.has_notes !== undefined) params.append('has_notes', filters.has_notes.toString());
    if (filters?.search_query) params.append('search_query', filters.search_query);

    const queryString = params.toString();
    const url = queryString ? `/applications/my-applications?${queryString}` : '/applications/my-applications';
    
    return await apiClient.get<CandidateApplicationListResponse>(url);
  }

  // Get Application Details
  static async getApplicationDetails(applicationId: string): Promise<ApiResponse<ApplicationResponse>> {
    return await apiClient.get<ApplicationResponse>(`/applications/${applicationId}`);
  }

  // Get Application Stage History
  static async getApplicationStageHistory(
    applicationId: string
  ): Promise<ApiResponse<ApplicationStageHistoryResponse>> {
    return await apiClient.get<ApplicationStageHistoryResponse>(`/applications/${applicationId}/stage-history`);
  }

  // Get Current Stage Info
  static async getCurrentStageInfo(
    applicationId: string
  ): Promise<ApiResponse<CurrentStageInfoResponse>> {
    return await apiClient.get<CurrentStageInfoResponse>(`/applications/${applicationId}/current-stage`);
  }

  // Withdraw Application
  static async withdrawApplication(applicationId: string): Promise<ApiResponse<{ application_id: string }>> {
    return await apiClient.delete<{ application_id: string }>(`/applications/${applicationId}`);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // Get application status display text
  static getApplicationStatusText(status: ApplicationStatus): string {
    const statusMap: Record<ApplicationStatus, string> = {
      [ApplicationStatus.APPLIED]: 'Applied',
      [ApplicationStatus.IN_REVIEW]: 'In Review',
      [ApplicationStatus.INTERVIEW_SCHEDULED]: 'Interview Scheduled',
      [ApplicationStatus.INTERVIEWED]: 'Interviewed',
      [ApplicationStatus.SHORTLISTED]: 'Shortlisted',
      [ApplicationStatus.REJECTED]: 'Rejected',
      [ApplicationStatus.HIRED]: 'Hired',
      [ApplicationStatus.WITHDRAWN]: 'Withdrawn',
    };
    return statusMap[status] || status;
  }

  // Get application status color for UI
  static getApplicationStatusColor(status: ApplicationStatus): string {
    const colorMap: Record<ApplicationStatus, string> = {
      [ApplicationStatus.APPLIED]: 'blue',
      [ApplicationStatus.IN_REVIEW]: 'yellow',
      [ApplicationStatus.INTERVIEW_SCHEDULED]: 'purple',
      [ApplicationStatus.INTERVIEWED]: 'indigo',
      [ApplicationStatus.SHORTLISTED]: 'green',
      [ApplicationStatus.REJECTED]: 'red',
      [ApplicationStatus.HIRED]: 'emerald',
      [ApplicationStatus.WITHDRAWN]: 'gray',
    };
    return colorMap[status] || 'gray';
  }

  // Check if application is active
  static isApplicationActive(application: { status: ApplicationStatus }): boolean {
    return ![ApplicationStatus.REJECTED, ApplicationStatus.HIRED, ApplicationStatus.WITHDRAWN].includes(
      application.status
    );
  }

  // Check if application can be withdrawn
  static canWithdrawApplication(application: { status: ApplicationStatus }): boolean {
    return ![ApplicationStatus.HIRED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN].includes(
      application.status
    );
  }

  // Format application date for display
  static formatApplicationDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Calculate days since application
  static getDaysSinceApplication(appliedAt: string): number {
    const appliedDate = new Date(appliedAt);
    const now = new Date();
    const diffTime = now.getTime() - appliedDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get stage progress percentage
  static getStageProgressPercentage(
    currentStage: PipelineStage | undefined,
    totalStages: number
  ): number {
    if (!currentStage || totalStages === 0) return 0;
    return Math.round((currentStage.order / (totalStages - 1)) * 100);
  }

  // Get stages cleared
  static getStagesCleared(
    currentStage: PipelineStage | undefined,
    allStages: PipelineStage[]
  ): PipelineStage[] {
    if (!currentStage) return [];
    return allStages.filter(stage => stage.order < currentStage.order);
  }

  // Validate application data before submission
  static validateApplicationData(application: Partial<ApplicationCreate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!application.job_id || application.job_id.trim().length === 0) {
      errors.push('Job ID is required');
    }

    // Cover letter validation
    if (application.cover_letter && application.cover_letter.trim().length < 50) {
      errors.push('Cover letter must be at least 50 characters long');
    }

    // Resume URL validation
    if (application.resume_url) {
      try {
        new URL(application.resume_url);
      } catch {
        errors.push('Please enter a valid resume URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Build search query from filters
  static buildSearchQuery(filters: ApplicationFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }

  // Parse kanban board data for display
  static parseKanbanBoard(response: ApiResponse<KanbanBoardResponse>): KanbanBoard {
    return response.data.kanban_board;
  }

  // Parse application statistics for display
  static parseApplicationStats(response: ApiResponse<ApplicationStatsResponse>): ApplicationStats {
    return response.data.stats;
  }

  // Get default pipeline stages
  static getDefaultPipelineStages(): PipelineStage[] {
    return [
      {
        id: 'ai_recommended',
        name: 'AI Recommended',
        order: 0,
        color: '#3B82F6',
        is_default: true,
        description: 'Top candidates recommended by AI',
      },
      {
        id: 'screened',
        name: 'Screened',
        order: 1,
        color: '#10B981',
        is_default: true,
        description: 'Candidates who passed initial screening',
      },
      {
        id: 'shortlisted',
        name: 'Shortlisted',
        order: 2,
        color: '#F59E0B',
        is_default: true,
        description: 'Candidates shortlisted for interviews',
      },
      {
        id: 'interview1',
        name: 'Interview 1',
        order: 3,
        color: '#EF4444',
        is_default: true,
        description: 'First round of interviews',
      },
    ];
  }

  // Create new pipeline stage
  static createPipelineStage(
    name: string,
    order: number,
    color: string = '#3B82F6',
    description?: string
  ): PipelineStage {
    return {
      id: `stage_${Date.now()}`,
      name,
      order,
      color,
      is_default: false,
      description,
    };
  }

  // Sort stages by order
  static sortStagesByOrder(stages: PipelineStage[]): PipelineStage[] {
    return [...stages].sort((a, b) => a.order - b.order);
  }

  // Get stage by ID
  static getStageById(stages: PipelineStage[], stageId: string): PipelineStage | undefined {
    return stages.find(stage => stage.id === stageId);
  }

  // Get next stage
  static getNextStage(currentStage: PipelineStage, allStages: PipelineStage[]): PipelineStage | undefined {
    const sortedStages = this.sortStagesByOrder(allStages);
    const currentIndex = sortedStages.findIndex(stage => stage.id === currentStage.id);
    return currentIndex >= 0 && currentIndex < sortedStages.length - 1 
      ? sortedStages[currentIndex + 1] 
      : undefined;
  }

  // Get previous stage
  static getPreviousStage(currentStage: PipelineStage, allStages: PipelineStage[]): PipelineStage | undefined {
    const sortedStages = this.sortStagesByOrder(allStages);
    const currentIndex = sortedStages.findIndex(stage => stage.id === currentStage.id);
    return currentIndex > 0 ? sortedStages[currentIndex - 1] : undefined;
  }

  // Check if stage is first
  static isFirstStage(stage: PipelineStage, allStages: PipelineStage[]): boolean {
    const sortedStages = this.sortStagesByOrder(allStages);
    return sortedStages.length > 0 && stage.id === sortedStages[0].id;
  }

  // Check if stage is last
  static isLastStage(stage: PipelineStage, allStages: PipelineStage[]): boolean {
    const sortedStages = this.sortStagesByOrder(allStages);
    return sortedStages.length > 0 && stage.id === sortedStages[sortedStages.length - 1].id;
  }

  // Format candidate name for display
  static formatCandidateName(candidate: { first_name: string; last_name: string }): string {
    return `${candidate.first_name} ${candidate.last_name}`.trim();
  }

  // Get candidate initials for avatar
  static getCandidateInitials(candidate: { first_name: string; last_name: string }): string {
    const firstInitial = candidate.first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = candidate.last_name?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  // Calculate application completion percentage
  static getApplicationCompletionPercentage(application: Partial<ApplicationCreate>): number {
    let completedFields = 0;
    let totalFields = 3; // job_id, cover_letter, resume_url

    if (application.job_id) completedFields++;
    if (application.cover_letter && application.cover_letter.trim().length > 0) completedFields++;
    if (application.resume_url) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  // Get application priority based on status and stage
  static getApplicationPriority(application: { status: ApplicationStatus; current_stage_id?: string }): 'high' | 'medium' | 'low' {
    if (application.status === ApplicationStatus.HIRED) return 'high';
    if (application.status === ApplicationStatus.SHORTLISTED) return 'high';
    if (application.status === ApplicationStatus.INTERVIEW_SCHEDULED) return 'high';
    if (application.status === ApplicationStatus.IN_REVIEW) return 'medium';
    if (application.status === ApplicationStatus.APPLIED) return 'medium';
    return 'low';
  }

  // Format stage name for display
  static formatStageName(stage: PipelineStage): string {
    return stage.name;
  }

  // Get stage color
  static getStageColor(stage: PipelineStage): string {
    return stage.color;
  }

  // Check if stage is default
  static isDefaultStage(stage: PipelineStage): boolean {
    return stage.is_default;
  }
}

export default ApplicationService;
