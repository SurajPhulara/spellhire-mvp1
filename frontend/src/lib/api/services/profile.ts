// src/lib/api/services/profile.ts
// Profile Service - Handles all profile-related API calls
import { apiClient } from '../client';
import {
  CandidateProfile,
  CandidateProfileRequest,
  CandidateProfileResponse,
  CandidateProfilePublicResponse,
  EmployerProfile,
  EmployerRequest,
  EmployerResponse,
  Organization,
  OrganizationRequest,
  OrganizationResponse,
  OrganizationPublicResponse,
  ApiResponse,
} from '@/types';

export class ProfileService {
  // ============================================================================
  // CANDIDATE PROFILE ENDPOINTS
  // ============================================================================

  // Get Current Candidate Profile
  static async getCandidateProfile(): Promise<ApiResponse<CandidateProfileResponse>> {
    return await apiClient.get<CandidateProfileResponse>('/candidate');
  }

  // Update Candidate Profile
  static async updateCandidateProfile(data: CandidateProfileRequest): Promise<ApiResponse<CandidateProfileResponse>> {
    console.log("data.candidate", data.candidate)
    return await apiClient.patch<CandidateProfileResponse>('/candidate', data.candidate);
  }

  // Get Candidate Profile (Public)
  static async getCandidateProfilePublic(candidateId: string): Promise<ApiResponse<CandidateProfilePublicResponse>> {
    return await apiClient.get<CandidateProfilePublicResponse>(`/candidate/public/${candidateId}`);
  }

  // ============================================================================
  // EMPLOYER PROFILE ENDPOINTS
  // ============================================================================

  // Get Current Employer Profile
  static async getEmployerProfile(): Promise<ApiResponse<EmployerResponse>> {
    return await apiClient.get<EmployerResponse>('/employer');
  }

  // Update Employer Profile
  static async updateEmployerProfile(data: EmployerRequest): Promise<ApiResponse<EmployerResponse>> {
    return await apiClient.patch<EmployerResponse>('/employer', data.employer);
  }

  // ============================================================================
  // ORGANIZATION PROFILE ENDPOINTS
  // ============================================================================

  // Get Current Organization Profile
  static async getOrganizationProfile(): Promise<ApiResponse<OrganizationResponse>> {
    return await apiClient.get<OrganizationResponse>('/organization');
  }

  // Update Organization Profile
  static async updateOrganizationProfile(data: OrganizationRequest): Promise<ApiResponse<OrganizationResponse>> {
    return await apiClient.put<OrganizationResponse>('/organization', data.organization);
  }

  // Get Organization Profile (Public)
  static async getOrganizationProfilePublic(organizationId: string): Promise<ApiResponse<OrganizationPublicResponse>> {
    return await apiClient.get<OrganizationPublicResponse>(`/organization/public/${organizationId}`);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // Check if profile is complete
  static isProfileComplete(profile: CandidateProfile | EmployerProfile): boolean {
    if ('is_profile_complete' in profile) {
      return Boolean(profile.is_profile_complete);
    }
    return false;
  }

  // Get profile completion percentage
  static getProfileCompletionPercentage(profile: CandidateProfile | EmployerProfile): number {
    if ('is_profile_complete' in profile && profile.is_profile_complete) {
      return 100;
    }

    // Basic completion check - can be enhanced based on business logic
    let completedFields = 0;
    let totalFields = 0;

    const checkField = (value: any) => {
      totalFields++;
      if (value !== undefined && value !== null && value !== '') {
        completedFields++;
      }
    };

    if ('professional_summary' in profile) {
      // Candidate profile
      checkField(profile.first_name);
      checkField(profile.last_name);
      checkField(profile.phone);
      checkField(profile.professional_summary);
      checkField(profile.skills?.length);
      checkField(profile.experience?.length);
    } else {
      // Employer profile
      const employerProfile = profile as EmployerProfile;
      checkField(employerProfile.first_name);
      checkField(employerProfile.last_name);
      checkField(employerProfile.job_title);
      checkField(employerProfile.department);
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }

  // Validate profile data before submission
  static validateProfileData(profile: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!profile.first_name || profile.first_name.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!profile.last_name || profile.last_name.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    // Email validation (if present)
    if (profile.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        errors.push('Please enter a valid email address');
      }
    }

    // Phone validation (if present)
    if (profile.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(profile.phone.replace(/\s/g, ''))) {
        errors.push('Please enter a valid phone number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default ProfileService;
