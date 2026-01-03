// API Configuration - Centralized configuration for API settings
export const API_CONFIG = {
  // Base URL configuration
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  
  // Timeout settings
  TIMEOUT: 10000, // 10 seconds
  
  // Retry settings
  RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Cache settings
  DEFAULT_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  DEFAULT_CACHE_TIME: 30 * 60 * 1000, // 30 minutes
  
  // Auth settings
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  
  // Rate limiting
  RATE_LIMIT: {
    AUTH_ENDPOINTS: 5, // requests per minute
    PROFILE_ENDPOINTS: 100, // requests per minute
    PUBLIC_ENDPOINTS: 200, // requests per minute
  },
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      CANDIDATE: {
        REGISTER: '/auth/candidate/register',
        LOGIN: '/auth/candidate/login',
        GOOGLE: '/auth/candidate/google',
      },
      EMPLOYER: {
        REGISTER: '/auth/employer/register',
        LOGIN: '/auth/employer/login',
        GOOGLE: '/auth/employer/google',
      },
      SHARED: {
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
        LOGOUT_ALL: '/auth/logout-all',
        ME: '/auth/me',
        SESSIONS: '/auth/sessions',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        CHANGE_PASSWORD: '/auth/change-password',
        VERIFY_EMAIL: '/auth/verify-email',
        RESEND_VERIFICATION: '/auth/resend-verification',
      },
    },
    PROFILE: {
      CANDIDATE: {
        ME: '/profile/candidate/me',
        PUBLIC: '/profile/candidate/public',
      },
      EMPLOYER: {
        ME: '/profile/employer/me',
      },
      ORGANIZATION: {
        ME: '/profile/organization/me',
        PUBLIC: '/profile/organization/public',
      },
    },
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    TIMEOUT_ERROR: 'Request timeout. Please try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access denied.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
    WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
    INVALID_OTP: 'Invalid verification code.',
    OTP_EXPIRED: 'Verification code has expired.',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: 'Welcome back!',
    REGISTRATION_SUCCESS: 'Account created successfully!',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    EMAIL_VERIFIED: 'Email verified successfully.',
    PROFILE_UPDATED: 'Profile updated successfully.',
    PASSWORD_RESET_SENT: 'Password reset instructions sent to your email.',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully.',
  },
  
  // Validation rules
  VALIDATION: {
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 128,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBER: true,
      REQUIRE_SPECIAL_CHAR: true,
    },
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PHONE: {
      PATTERN: /^\+?[1-9]\d{1,14}$/,
    },
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
    },
  },
  
  // Feature flags
  FEATURES: {
    GOOGLE_AUTH: true,
    PASSWORD_RESET: true,
    EMAIL_VERIFICATION: true,
    SESSION_MANAGEMENT: true,
    PROFILE_ANALYTICS: false,
    PROFILE_DISCOVERY: false,
  },
  
  // Development settings
  DEV: {
    ENABLE_LOGGING: process.env.NODE_ENV === 'development',
    MOCK_API: process.env.NEXT_PUBLIC_MOCK_API === 'true',
    DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG === 'true',
  },
} as const;

// Type for API configuration
export type ApiConfig = typeof API_CONFIG;

// Helper functions
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const isFeatureEnabled = (feature: keyof typeof API_CONFIG.FEATURES): boolean => {
  return API_CONFIG.FEATURES[feature];
};

export const getErrorMessage = (key: keyof typeof API_CONFIG.ERROR_MESSAGES): string => {
  return API_CONFIG.ERROR_MESSAGES[key];
};

export const getSuccessMessage = (key: keyof typeof API_CONFIG.SUCCESS_MESSAGES): string => {
  return API_CONFIG.SUCCESS_MESSAGES[key];
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return {
        ...API_CONFIG,
        BASE_URL: 'http://localhost:8000/api/v1',
        DEV: {
          ...API_CONFIG.DEV,
          ENABLE_LOGGING: true,
        },
      };
    
    case 'production':
      return {
        ...API_CONFIG,
        BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.spellhire.com/api/v1',
        DEV: {
          ...API_CONFIG.DEV,
          ENABLE_LOGGING: false,
        },
      };
    
    case 'test':
      return {
        ...API_CONFIG,
        BASE_URL: 'http://localhost:8000/api/v1',
        TIMEOUT: 5000,
        RETRIES: 1,
        DEV: {
          ...API_CONFIG.DEV,
          ENABLE_LOGGING: false,
          MOCK_API: true,
        },
      };
    
    default:
      return API_CONFIG;
  }
};

export default API_CONFIG;
