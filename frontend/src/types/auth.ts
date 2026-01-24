// authentication types
import { UserType, AccessTokenResponse, UserSummary } from './base';

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface AuthRequest {
  email: string;
  password: string;
  user_type: UserType;
}

export interface GoogleAuthRequest {
  google_token: string;
  user_type: UserType;
}

export interface VerifyEmailRequest {
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
  user_type: UserType;
}

export interface ResetPasswordRequest {
  email: string;
  user_type: UserType;
  otp: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface AuthResponse {
  tokens: AccessTokenResponse;
  user: UserSummary;
  user_type: UserType;
}

export interface MeResponse {
  user: UserSummary;
}

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

export interface AuthState {
  user: UserSummary | null;
  tokens: AccessTokenResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: UserType | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string, userType: UserType) => Promise<void>;
  register: (email: string, password: string, userType: UserType) => Promise<void>;
  googleAuth: (googleToken: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;

  // forgotPassword: (email: string, userType: UserType) => Promise<void>;
  // resetPassword: (
  //   email: string,
  //   userType: UserType,
  //   otp: string,
  //   newPassword: string
  // ) => Promise<void>;
  // changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  // verifyEmail: (otp: string) => Promise<void>;
  // resendVerification: () => Promise<void>;

  // updateUser: (user: UserSummary) => void;
}
