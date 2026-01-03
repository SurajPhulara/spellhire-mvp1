// src/lib/api/services/files.ts
// File Service - Handles all file-related API calls
import { apiClient } from '../client';
import { ApiResponse } from '@/types';

export interface FileUploadResponse {
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  user_id: string;
}

export interface UserFiles {
  resume: {
    url: string | null;
    has_file: boolean;
  };
  profile_picture: {
    url: string | null;
    has_file: boolean;
  };
  organization_logo: {
    url: string | null;
    has_file: boolean;
  };
}

export class FileService {
  // ============================================================================
  // FILE UPLOAD ENDPOINTS
  // ============================================================================

  // Upload Resume
  static async uploadResume(file: File): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return await apiClient.post<FileUploadResponse>('/files/resume', formData);
  }

  // Upload Profile Picture
  static async uploadProfilePicture(file: File): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return await apiClient.post<FileUploadResponse>('/files/profile-picture', formData);
  }

  // Upload Organization Logo
  static async uploadOrganizationLogo(file: File): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return await apiClient.post<FileUploadResponse>('/files/organization-logo', formData);
  }
  // ============================================================================
  // FILE MANAGEMENT ENDPOINTS
  // ============================================================================

  // Get User Files
  static async getUserFiles(): Promise<ApiResponse<UserFiles>> {
    return await apiClient.get<UserFiles>('/files/my-files');
  }

  // Delete Resume
  static async deleteResume(): Promise<ApiResponse<{}>> {
    return await apiClient.delete<{}>('/files/resume');
  }

  // Delete Profile Picture
  static async deleteProfilePicture(): Promise<ApiResponse<{}>> {
    return await apiClient.delete<{}>('/files/profile-picture');
  }

  // Delete Organization Logo
  static async deleteOrganizationLogo(): Promise<ApiResponse<{}>> {
    return await apiClient.delete<{}>('/files/organization-logo');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // Validate file size
  static validateFileSize(file: File, maxSizeMB: number = 10): { isValid: boolean; error?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size must be less than ${maxSizeMB}MB`
      };
    }
    return { isValid: true };
  }

  // Validate file type
  static validateFileType(file: File, allowedTypes: string[]): { isValid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }
    return { isValid: true };
  }

  // Validate image file
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return this.validateFileType(file, allowedImageTypes);
  }

  // Validate document file
  static validateDocumentFile(file: File): { isValid: boolean; error?: string } {
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    return this.validateFileType(file, allowedDocTypes);
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file extension
  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  // Check if file is image
  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Check if file is document
  static isDocumentFile(file: File): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    return documentTypes.includes(file.type);
  }
}

export default FileService;
