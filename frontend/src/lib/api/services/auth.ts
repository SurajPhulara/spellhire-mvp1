// AuthService - Handles all auth-related API calls
// ------------------------------------------------
// Responsibility:
// - Thin, testable wrappers around apiClient for all auth endpoints.
// - No React state here. AuthService is a pure API layer.
// - AuthContext (or other UI layer) is the single source of truth about the session.
// 
// Notes for maintainers:
// - Refresh token is expected to be handled by HttpOnly cookies on the server.
// - refreshToken() exists for interceptor-based refresh flows (internal use) — UI should NOT call it directly.
// - Do NOT rely on presence of Authorization header to determine authentication in the app; use AuthContext instead.

import { apiClient } from '../client';
import {
  AuthRequest,
  GoogleAuthRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthResponse,
  TokenResponse,
  MeResponse,
  SessionResponse,
  AccessTokenResponse,
  ApiResponse
} from '@/types';

export class AuthService {
  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================
  //
  // Each method is a small wrapper around apiClient; it returns whatever the
  // backend returns (wrapped in ApiResponse<T>). Keep these methods thin so
  // they are easy to mock in tests.

  // Candidate Registration
  static async register(data: AuthRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/register', data);
  }

  static async login(data: AuthRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/login', data);
  }

  // Google OAuth - Candidate
  static async googleAuthCandidate(data: GoogleAuthRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/candidate/google', data);
  }

  // Google OAuth - Employer
  // NOTE: fixed missing leading slash if it was present previously.
  static async googleAuthEmployer(data: GoogleAuthRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/employer/google', data);
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================
  //
  // refreshToken:
  // - The refresh token is stored in an HttpOnly cookie by the server.
  // - This method is provided for interceptor or internal refresh flows only.
  // - UI components should NOT call this directly (use AuthContext or an auth middleware).
  //
  // logout/logoutAll:
  // - These call backend endpoints and then remove the client-side Authorization header.
  // - Removing the header is necessary so subsequent requests from the client do not include a stale token.

  // Refresh Access Token (refresh token is expected in HttpOnly cookie)
  static async refreshToken(): Promise<ApiResponse<TokenResponse>> {
    // Intended for internal interceptor use. If you wire up automatic token refresh,
    // call this from your network layer when you receive 401s.
    return apiClient.post<TokenResponse>('/auth/refresh');
  }

  // Logout (current device)
  static async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>('/auth/logout');
    // Clear Authorization header regardless of server response to guarantee client-side logout.
    apiClient.removeAuthToken();
    return response;
  }

  // Logout from all devices (invalidate all refresh tokens / sessions)
  static async logoutAll(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>('/auth/logout-all');
    apiClient.removeAuthToken();
    return response;
  }

  // ============================================================================
  // USER INFORMATION
  // ============================================================================
  //
  // These methods are account-level and can be used by account security pages
  // (sessions, devices, profile pages, etc).

  // Get Current User ("/me") - this is what the app should use to hydrate AuthContext
  static async getCurrentUser(): Promise<ApiResponse<MeResponse>> {
    return apiClient.get<MeResponse>('/auth/me');
  }

  // Get active sessions (devices/browsers)
  static async getUserSessions(): Promise<ApiResponse<SessionResponse>> {
    return apiClient.get<SessionResponse>('/auth/sessions');
  }

  // Revoke a single session by id
  static async revokeSession(sessionId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/auth/sessions/${sessionId}`);
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================
  //
  // Straightforward wrappers for password flows. These endpoints are usually
  // accessible without being authenticated (forgot/reset) or require current auth (change).

  // Forgot Password (sends OTP / link)
  static async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/forgot-password', data);
  }

  // Reset Password (using OTP / token)
  static async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password', data);
  }

  // Change Password (authenticated)
  static async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/change-password', data);
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  // Verify Email (submit OTP)
  static async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/verify-email', data);
  }

  // Resend Verification email
  static async resendVerification(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/resend-verification');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  //
  // Small helpers to map tokens from server into apiClient headers.
  // We accept an AccessTokenResponse (structure depends on backend) and set the
  // auth header accordingly. We do NOT persist refresh tokens here because they
  // are stored as HttpOnly cookies by the server.
  //
  // Important: This method should be called by your AuthContext when a user signs in.

  static setAuthTokens(tokens: AccessTokenResponse): void {
    // Set the Authorization header for future requests.
    // This keeps the API client in sync with authenticated state.
    apiClient.setAuthToken(tokens.access_token);
    // NOTE: refresh token should be sent by server as HttpOnly cookie (not accessible here).
  }

  static clearAuthTokens(): void {
    // Remove Authorization header from client so requests no longer carry the token.
    apiClient.removeAuthToken();
    // NOTE: server should clear HttpOnly refresh cookie via its logout path if needed.
  }
}

export default AuthService;
