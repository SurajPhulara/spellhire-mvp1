// API Client - Production-ready HTTP client with proper error handling
// -------------------------------------------------------------------
// Purpose:
// - Centralize all HTTP calls in one place
// - Provide a consistent surface for GET/POST/PUT/PATCH/DELETE
// - Handle common concerns: timeouts, JSON bodies, form uploads, auth header
// - Provide retry behavior for transient failures (configurable)
// - Map low-level fetch/network errors into ApiException for callers
//
// Notes for future maintainers:
// - This client intentionally retries on certain transient errors.
//   Be careful when changing retry behavior — retries can duplicate non-idempotent operations.
// - Refresh token handling is expected to be via HttpOnly cookies on the server-side.
//   The `setRefreshToken`/`removeRefreshToken` methods are intentionally no-ops with warnings.
// - Keep changes minimal: unit-test any change to retry/backoff behavior carefully.

import { ApiResponse, ApiError, ApiException, RequestConfig, ApiClientConfig } from '@/types';

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private defaultHeaders: Record<string, string>;

  /**
   * Create a new ApiClient.
   *
   * @param config.baseURL - base URL for all requests (should include trailing slash ideally)
   * @param config.timeout - request timeout in ms (default 10000)
   * @param config.retries - how many attempts for retryable errors (default 3)
   * @param config.retryDelay - base delay (ms) used for exponential-ish backoff between retries (default 1000)
   */
  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // -------------------------------------------------------------------------
  // AUTH HELPERS
  // -------------------------------------------------------------------------
  // These mutate the default headers used for every request.
  // Calling setAuthToken updates the Authorization header (Bearer token).
  // removeAuthToken deletes it (e.g. on logout).

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  // -------------------------------------------------------------------------
  // URL & UTILITIES
  // -------------------------------------------------------------------------

  /**
   * Build a full URL from baseURL + endpoint and append query params if provided.
   * - endpoint may start with or without a leading slash.
   * - params with undefined/null are ignored.
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint.replace(/^\/+/, ""), this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  // Simple sleep used between retry attempts
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Decide whether an error is worth retrying.
   *
   * We consider:
   * - 5xx server errors (transient server problems)
   * - 408 Request Timeout
   * - 429 Too Many Requests (rate limits)
   * - Network/TypeError and Abort (network, CORS, offline)
   *
   * Note: This function expects an "error-like" object with status or name.
   */
  private isRetryableError(error: any): boolean {
    if (!error.status) return false;
    
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.status >= 500 ||
      error.status === 408 || // Request timeout
      error.status === 429 || // Too many requests
      error.name === 'TypeError' || // Network error
      error.name === 'AbortError' // Request aborted
    );
  }

  // -------------------------------------------------------------------------
  // CORE REQUEST + RETRY LOGIC
  // -------------------------------------------------------------------------
  //
  // makeRequest is the single place that:
  // - builds the request
  // - applies headers, timeout, credentials (cookies)
  // - serializes JSON / handles FormData
  // - parses JSON responses
  // - maps errors into ApiException
  // - performs retry loop for retryable errors
  //
  // Important: Because we retry at this level, callers must be careful not to rely on
  // side-effects being performed only once for non-idempotent endpoints.

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig,
    attempt: number = 1,
    credentials: 'include' | 'same-origin' = 'include'
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = this.buildURL(endpoint, config.params);
      
      const requestConfig: RequestInit = {
        method: config.method,
        headers: {
          ...this.defaultHeaders,
          ...config.headers,
        },
        signal: controller.signal,
        credentials: credentials, // Include cookies in requests
      };

      // Serialize body for non-GET requests.
      // For FormData, don't stringify and remove Content-Type so browser sets multipart boundary.
      if (config.body && config.method !== 'GET') {
        if (config.body instanceof FormData) {
          requestConfig.body = config.body;
          delete (requestConfig.headers as any)['Content-Type'];
        } else {
          requestConfig.body = JSON.stringify(config.body);
        }
      }

      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      // Parse response as JSON. If backend returns an empty body this will throw,
      // but most API endpoints return JSON. If needed, consider a safe parser.
      const data = await response.json();

      // If HTTP status indicates failure, construct ApiError and optionally retry.
      if (!response.ok) {
        const error: ApiError = {
          message: data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          errors: data.errors,
        };

        // If this error looks retryable and we have attempts left, wait and retry.
        if (this.isRetryableError(error) && attempt < this.retries) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest(endpoint, config, attempt + 1);
        }

        console.log('error', error);
        throw new ApiException(error.message, error.status, error.errors);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Network error detected by fetch (TypeError) - e.g., CORS, DNS, offline
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new ApiException(
          'Network error. Please check your connection.',
          0
        );
        
        if (attempt < this.retries) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest(endpoint, config, attempt + 1);
        }
        
        throw networkError;
      }

      // Timeout / Abort handling
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new ApiException(
          'Request timeout. Please try again.',
          408
        );
        
        if (attempt < this.retries) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest(endpoint, config, attempt + 1);
        }
        
        throw timeoutError;
      }

      // If we already threw an ApiException above, forward it
      if (error instanceof ApiException) {
        throw error;
      }

      // Fallback for unexpected errors
      throw new ApiException(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500
      );
    }
  }

  // -------------------------------------------------------------------------
  // HTTP VERB SHORTCUTS
  // -------------------------------------------------------------------------
  // Simple, typed wrappers that call makeRequest with proper method and params.
  // Keep these thin to avoid duplication.

  async get<T>(endpoint: string, params?: Record<string, any>, credentials: 'include' | 'same-origin' = 'include'): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'GET',
      params,
    }, 1, credentials);
  }

  async post<T>(endpoint: string, body?: any, params?: Record<string, any>, credentials: 'include' | 'same-origin' = 'include'): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body,
      params,
    }, 1, credentials);
  }

  async put<T>(endpoint: string, body?: any, params?: Record<string, any>, credentials: 'include' | 'same-origin' = 'include'): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body,
      params,
    }, 1, credentials);
  }

  async delete<T>(endpoint: string, params?: Record<string, any>, credentials: 'include' | 'same-origin' = 'include'): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      params,
    }, 1, credentials);
  }

  async patch<T>(endpoint: string, body?: any, params?: Record<string, any>, credentials: 'include' | 'same-origin' = 'include'): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body,
      params,
    }, 1, credentials);
  }
}

// -----------------------------------------------------------------------------
// Default client instance
// -----------------------------------------------------------------------------
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/',
  timeout: 10000,
  retries: 1,
  retryDelay: 3000,
});

export default apiClient;
