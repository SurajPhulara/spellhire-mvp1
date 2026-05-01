// Job Service - Handles all job-related API calls
import { apiClient } from '../client';
import {
  Job,
  JobRequest,
  JobResponse,
  JobSearchFilters,
  JobListResponse,  
  JobManagementFilters,
  JobStatus,
  ApiResponse,
} from '@/types';

export class JobService {
  // ============================================================================
  // JOB MANAGEMENT ENDPOINTS (Employer Only)
  // ============================================================================

  // Create Job Posting
  static async createJob(data: JobRequest): Promise<ApiResponse<JobResponse>> {
    return await apiClient.post<JobResponse>('/jobs/', data);
  }

  // Get Organization Jobs
  static async getOrganizationJobs(filters?: JobManagementFilters): Promise<ApiResponse<JobListResponse>> {
    const params = new URLSearchParams();
  
    if (filters?.offset !== undefined) params.append('offset', filters.offset.toString());
    if (filters?.status_filter) params.append('status', filters.status_filter);
    if (filters?.q) params.append('q', filters.q);
    // if (filters?.job_type) params.append('job_type', filters.job_type);
    // if (filters?.work_mode) params.append('work_mode', filters.work_mode);
  
    const queryString = params.toString();
    const url = `/jobs/organization/?${queryString}`;
  
    return await apiClient.get<JobListResponse>(url);
  }

  // Get Job Details (Employer)
  static async getJob(jobId: string): Promise<ApiResponse<JobResponse>> {
    return await apiClient.get<JobResponse>(`/jobs/employer/${jobId}`);
  }

  // Update Job Posting
  static async updateJob(jobId: string, data: JobRequest): Promise<ApiResponse<JobResponse>> {
    return await apiClient.put<JobResponse>(`/jobs/${jobId}`, data);
  }

  // Delete Job Posting
  static async deleteJob(jobId: string): Promise<ApiResponse<{ job_id: string }>> {
    return await apiClient.delete<{ job_id: string }>(`/jobs/${jobId}`);
  }

  // Update Job Status
  static async updateJobStatus(jobId: string, status: JobStatus): Promise<ApiResponse<JobResponse>> {
    return await apiClient.patch<JobResponse>(`/jobs/${jobId}`, null, {status});
  }



  // ============================================================================
  // SAVED JOBS ENDPOINTS (Candidate Only)
  // ============================================================================


  // apply to a job
  static async applyToJob(jobId: string): Promise<ApiResponse<any>> {
    return await apiClient.post<any>(`/jobs/${jobId}/apply`, {});
  }

  
  // Save (bookmark) a job
  static async saveJob(jobId: string): Promise<ApiResponse<{ job_id: string }>> {
    return await apiClient.post<{ job_id: string }>(`/jobs/${jobId}/save`);
  }

  // Unsave a job
  static async unsaveJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<{ message: string }>(`/jobs/${jobId}/save`);
  }

  // Get saved jobs (paginated)
  static async getSavedJobs(offset: number = 0): Promise<ApiResponse<JobListResponse>> {
    const params = new URLSearchParams();
    params.append('offset', offset.toString());

    const url = `/jobs/saved?${params.toString()}`;
    return await apiClient.get<JobListResponse>(url);
  }


  // ============================================================================
  // JOB SEARCH ENDPOINTS (Public)
  // ============================================================================

  static async searchJobs(
    filters?: JobSearchFilters
  ): Promise<ApiResponse<JobListResponse>> {
    const params = new URLSearchParams();
 
    if (filters?.q)                   params.append('q',                filters.q);
    if (filters?.job_type)            params.append('job_type',         filters.job_type);
    if (filters?.work_mode)           params.append('work_mode',        filters.work_mode);
    if (filters?.experience_level)    params.append('experience_level', filters.experience_level);
    if (filters?.category)            params.append('category',         filters.category);
    if (filters?.location_city)       params.append('location_city',    filters.location_city);
    if (filters?.location_country)    params.append('location_country', filters.location_country);
    if (filters?.salary_min)          params.append('salary_min',       filters.salary_min.toString());
    if (filters?.required_skills)     params.append('required_skills',  filters.required_skills);
    if (filters?.is_featured != null) params.append('is_featured',      filters.is_featured.toString());
    if (filters?.sort_by)             params.append('sort_by',          filters.sort_by);
    if (filters?.sort_order)          params.append('sort_order',       filters.sort_order);
    if (filters?.offset != null)      params.append('offset',           filters.offset.toString());
 
    const url = `/jobs/?${params.toString()}`;
    return await apiClient.get<JobListResponse>(url);
  }

  // Get Featured Jobs
  static async getFeaturedJobs(limit?: number): Promise<ApiResponse<JobListResponse>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/jobs/featured?${queryString}` : '/jobs/featured';
    
    return await apiClient.get<JobListResponse>(url);
  }

  // Get Job Details (Public)
  static async getJobPublic(jobId: string): Promise<ApiResponse<JobResponse>> {
    return await apiClient.get<JobResponse>(`/jobs/id/${jobId}`, undefined, 'same-origin');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // Get job status display text
  static getJobStatusText(status: JobStatus): string {
    const statusMap: Record<JobStatus, string> = {
      [JobStatus.DRAFT]: 'Draft',
      [JobStatus.ACTIVE]: 'Active',
      [JobStatus.PAUSED]: 'Paused',
      [JobStatus.CLOSED]: 'Closed',
    };
    return statusMap[status] || status;
  }

  // Get job status color for UI
  static getJobStatusColor(status: JobStatus): string {
    const colorMap: Record<JobStatus, string> = {
      [JobStatus.DRAFT]: 'gray',
      [JobStatus.ACTIVE]: 'green',
      [JobStatus.PAUSED]: 'yellow',
      [JobStatus.CLOSED]: 'red',
    };
    return colorMap[status] || 'gray';
  }

  // Check if job is active
  static isJobActive(job: Job): boolean {
    return job.status === JobStatus.ACTIVE;
  }

  // Check if job is published
  static isJobPublished(job: Job): boolean {
    return job.published_at !== null && job.published_at !== undefined;
  }

  // Format salary range for display
  static formatSalaryRange(job: Job): string {
    if (!job.salary_min && !job.salary_max) {
      return 'Salary not specified';
    }

    const currency = job.salary_currency || 'USD';
    const period = job.salary_period || 'yearly';
    
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} per ${period}`;
    } else if (job.salary_min) {
      return `${currency} ${job.salary_min.toLocaleString()}+ per ${period}`;
    } else if (job.salary_max) {
      return `Up to ${currency} ${job.salary_max.toLocaleString()} per ${period}`;
    }
    
    return 'Salary not specified';
  }

  // Format location for display
  static formatLocation(location: { city: string; state: string; country: string }): string {
    return `${location.city}, ${location.state}, ${location.country}`;
  }

  // Check if job has expired
  static isJobExpired(job: Job): boolean {
    if (!job.application_deadline) return false;
    return new Date(job.application_deadline) < new Date();
  }

  // Get days until deadline
  static getDaysUntilDeadline(job: Job): number | null {
    if (!job.application_deadline) return null;
    
    const deadline = new Date(job.application_deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Validate job data before submission
  static validateJobData(job: Partial<Job>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!job.title || job.title.trim().length < 3) {
      errors.push('Job title must be at least 3 characters long');
    }

    if (!job.description || job.description.trim().length < 50) {
      errors.push('Job description must be at least 50 characters long');
    }

    if (!job.requirements || job.requirements.trim().length < 20) {
      errors.push('Job requirements must be at least 20 characters long');
    }

    if (!job.responsibilities || job.responsibilities.trim().length < 20) {
      errors.push('Job responsibilities must be at least 20 characters long');
    }

    if (!job.vacancies || job.vacancies < 1) {
      errors.push('Number of vacancies must be at least 1');
    }

    if (!job.location?.city || !job.location?.state || !job.location?.country) {
      errors.push('Job location (city, state, country) is required');
    }

    if (!job.category || job.category.trim().length < 2) {
      errors.push('Job category is required');
    }

    if (!job.department || job.department.trim().length < 2) {
      errors.push('Job department is required');
    }

    // Salary validation
    if (job.salary_min && job.salary_max && job.salary_min > job.salary_max) {
      errors.push('Minimum salary cannot be greater than maximum salary');
    }

    // Application deadline validation
    if (job.application_deadline) {
      const deadline = new Date(job.application_deadline);
      const now = new Date();
      if (deadline <= now) {
        errors.push('Application deadline must be in the future');
      }
    }

    // Application URL validation
    if (job.application_url) {
      try {
        new URL(job.application_url);
      } catch {
        errors.push('Please enter a valid application URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get job completion percentage
  static getJobCompletionPercentage(job: Partial<Job>): number {
    const requiredFields = [
      'title',
      'description',
      'requirements',
      'responsibilities',
      'vacancies',
      'job_type',
      'work_mode',
      'experience_level',
      'location',
      'category',
      'department',
    ];

    let completedFields = 0;
    let totalFields = requiredFields.length;

    requiredFields.forEach(field => {
      if (field === 'location') {
        if (job.location?.city && job.location?.state && job.location?.country) {
          completedFields++;
        }
      } else {
        const value = (job as any)[field];
        if (value !== undefined && value !== null && value !== '') {
          completedFields++;
        }
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  }

  // Build search query from filters
  static buildSearchQuery(filters: JobSearchFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }
}

export default JobService;
