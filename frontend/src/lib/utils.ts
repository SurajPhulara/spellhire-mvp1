// lib/utils.ts - Utility functions

import { UserType, UserSummary } from "@/types/base";

/**
 * Check if user is an employer
 */
export function isEmployer(user: UserSummary | null | undefined): user is UserSummary {
  return user?.user_type === "EMPLOYER";
}

/**
 * Check if user is a candidate
 */
export function isCandidate(user: UserSummary | null | undefined): user is UserSummary {
  return user?.user_type === "CANDIDATE";
}

/**
 * Check if email is verified
 */
export function isEmailVerified(user: UserSummary | null | undefined): user is UserSummary {
  return !!user?.email_verified;
}

/**
 * Check if profile is complete
 */
export function isProfileComplete(user: UserSummary | null | undefined): user is UserSummary {
  if (!user) return false;
  
  if (isEmployer(user)) {
    return user.is_profile_complete === true;
  }
  
  // For candidates, we'll check this via profile endpoint
  return false;
}

/**
 * Get the appropriate dashboard route for user
 */
export function getDashboardRoute(user: UserSummary | null | undefined): string {
  if (!user) return "/";
  
  if (isCandidate(user)) {
    return "/candidate/jobs";
  }
  else {
    return "/employer/dashboard";
  }
  
}

/**
 * Get the appropriate onboarding route for user
 */
export function getOnboardingRoute(user: UserSummary | null | undefined): string {
  if (!user) return "/";
  
  if (isCandidate(user)) {
    return "/onboarding";
  }
  else {
    return "/employer/onboarding";
  }
  
}

/**
 * Determine where to redirect user after login/registration
 */
export function getRedirectPath(user: UserSummary | null | undefined): string {
  
  if (!user) return "/";
  
  // Check email verification first
  if (!isEmailVerified(user)) {
    return "/verify-email";
  }
  
  // Check profile completion
  if (!isProfileComplete(user)) {
    return getOnboardingRoute(user);
  }
  
  // Everything is complete, go to dashboard
  return getDashboardRoute(user);
}

/**
 * Check if route is a public route (accessible without auth)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    "/",
    "/about",
    "/contact",
    "/jobs",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email", // Email verification is accessible when authenticated
  ];
  
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
}

/**
 * Check if route is an auth route (login/register)
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = ["/login", "/register", "/verify-email"];
  return authRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if user can access route based on user type
 */
export function canAccessRoute(
  pathname: string,
  user: UserSummary | null | undefined
): boolean {
  if (!user) return isPublicRoute(pathname);
  
  // Employer trying to access candidate routes
  if (isEmployer(user) && pathname.startsWith("/candidate")) {
    return false;
  }
  
  // Candidate trying to access employer routes
  if (isCandidate(user) && pathname.startsWith("/employer")) {
    return false;
  }
  
  return true;
}

/**
 * Format date string
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get initials from name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return `${first}${last}` || "U";
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get error message from API error
 */
export function getErrorMessage(error: any): string {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.errors) {
    const firstError = Object.values(error.errors)[0];
    if (typeof firstError === "string") return firstError;
  }
  return "An unexpected error occurred";
}



    