// Authentication Context – final, boring, obvious version
// -------------------------------------------------------
// Key principles:
// - Tokens are the ONLY thing persisted
// - User type (role) always comes from backend (/me)
// - No duplicated state, no desync risk
// - Simple code that a new dev can understand in one read

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AuthService } from '@/lib/api/services/auth';
import {
  AuthContextType,
  UserSummary,
  UserType,
  AccessTokenResponse,
} from '@/types';

// ============================================================================
// CONTEXT
// ============================================================================

// Using `undefined` allows us to throw a clear error
// if `useAuth` is called outside `AuthProvider`
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // --------------------------------------------------------------------------
  // GLOBAL AUTH STATE
  // --------------------------------------------------------------------------
  //
  // user            → authenticated user object (null if logged out)
  // tokens          → access/refresh tokens (null if logged out)
  // isAuthenticated → convenience boolean for guards/UI
  // isLoading       → true while auth state is being resolved

  const [user, setUser] = useState<UserSummary | null>(null);
  const [tokens, setTokens] = useState<AccessTokenResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // BOOTSTRAP AUTH (runs once on app load)
  // ============================================================================
  //
  // Goal:
  // - Restore session if tokens exist
  // - Fetch `/me` to get the real user + user_type
  //
  // Important:
  // - We DO NOT store userType in localStorage
  // - Backend is the source of truth for roles

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check if tokens exist
        const rawTokens = localStorage.getItem('auth_tokens');
        if (!rawTokens) return;

        // 2. Parse and register tokens with API client
        const parsedTokens: AccessTokenResponse = JSON.parse(rawTokens);
        AuthService.setAuthTokens(parsedTokens);
        setTokens(parsedTokens);

        // 3. Fetch current user (includes user_type)
        const me = await AuthService.getCurrentUser();

        setUser(me.data.user);
        setIsAuthenticated(true);
      } catch {
        // If anything fails (expired token, bad data, network error):
        // - Clear tokens
        // - Reset auth state
        localStorage.removeItem('auth_tokens');
        AuthService.clearAuthTokens();

        setUser(null);
        setTokens(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================
  //
  // These helpers are intentionally NOT exposed.
  // They exist only to keep auth actions readable.

  // Persist tokens and sync them with the API client
  const saveTokens = (t: AccessTokenResponse) => {
    localStorage.setItem('auth_tokens', JSON.stringify(t));
    AuthService.setAuthTokens(t);
  };

  // Clear all auth-related client state
  const clearAuthData = () => {
    localStorage.removeItem('auth_tokens');
    AuthService.clearAuthTokens();

    setUser(null);
    setTokens(null);
    setIsAuthenticated(false);
  };

  // ============================================================================
  // AUTH ACTIONS
  // ============================================================================
  //
  // These functions are used by the UI.
  // Each one:
  // - Updates loading state
  // - Calls backend
  // - Mutates global auth state

  const login = async (
    email: string,
    password: string,
    userType: UserType
  ) => {
    setIsLoading(true);
    try {
      const res =
        userType === UserType.CANDIDATE
          ? await AuthService.loginCandidate({ email, password })
          : await AuthService.loginEmployer({ email, password });

      const { user, tokens } = res.data;

      saveTokens(tokens);
      setUser(user);
      setTokens(tokens);
      setIsAuthenticated(true);

      toast.success('Logged in successfully');
    } catch (err) {
      toast.error('Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    userType: UserType
  ) => {
    setIsLoading(true);
    try {
      const res =
        userType === UserType.CANDIDATE
          ? await AuthService.registerCandidate({ email, password })
          : await AuthService.registerEmployer({ email, password });

      const { user, tokens } = res.data;

      saveTokens(tokens);
      setUser(user);
      setTokens(tokens);
      setIsAuthenticated(true);

      toast.success('Account created');
    } catch (err) {
      toast.error('Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const googleAuth = async (googleToken: string, userType: UserType) => {
    setIsLoading(true);
    try {
      const res =
        userType === UserType.CANDIDATE
          ? await AuthService.googleAuthCandidate({
              google_token: googleToken,
              user_type: userType,
            })
          : await AuthService.googleAuthEmployer({
              google_token: googleToken,
              user_type: userType,
            });

      const { user, tokens } = res.data;

      saveTokens(tokens);
      setUser(user);
      setTokens(tokens);
      setIsAuthenticated(true);

      toast.success('Logged in successfully');
    } catch (err) {
      toast.error('Google authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Best-effort backend logout
      await AuthService.logout();
    } catch {
      // Even if backend fails, client must log out
    } finally {
      clearAuthData();
      toast.success('Logged out');
    }
  };

  // ============================================================================
  // USER MUTATION
  // ============================================================================
  //
  // Allows the rest of the app to update the authenticated user
  // without refetching `/me`.
  //
  // Example:
  // - Profile update
  // - Onboarding completion

  // const updateUser = (u: UserSummary) => {
  //   setUser(u);
  // };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  //
  // Note:
  // - userType is DERIVED from user
  // - Never persisted separately

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    userType: user?.user_type ?? null,

    login,
    register,
    googleAuth,
    logout,

    // updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
