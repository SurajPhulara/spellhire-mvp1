// API Types - API response wrappers, error types, and client configuration

// ============================================================================
// API RESPONSE WRAPPER
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  // errors?: Record<string, any>;
  /** Field or grouped errors */
  errors?: any;
  details?: string;
  meta?: Record<string, any>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, any>;
}

export class ApiException extends Error {
  constructor(
    public message: string,
    public status: number,
    public errors?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig {
  method: RequestMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}
