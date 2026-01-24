// app/(public)/(auth)/login/page.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { login, googleAuth, isLoading, isAuthenticated, user } = useAuth();
  
  useEffect(()=>{
    if (isLoading) return;
    console.log("userrr :", user)
    if (isAuthenticated && user)
      if(!user?.email_verified)
        router.push("/verify-email")
      else if (!user.is_profile_complete) 
        router.push("/employer/onboarding")
      else router.push("/employer/dashboard")
  },[isAuthenticated, user, router, isLoading])

  // Fixed user type for employer login page
  const userType = UserType.EMPLOYER;

  // Handle email/password login
  const handleEmailLogin = useCallback(async () => {
    setErrorMsg('');
    setShowForgotPassword(false);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      await login(email, password, userType);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setErrorMsg('Invalid email or password. Please try again or reset your password.');
        setShowForgotPassword(true);
      } else {
        setErrorMsg('An error occurred during sign in. Please try again.');
      }
    }
  }, [email, password, userType, login]);

  // Handle Google sign-in
  const handleGoogleSignIn = useCallback(async () => {
    setErrorMsg('');

    try {
      // Note: You'll need to implement Google OAuth flow to get the token
      // This is a placeholder - implement actual Google sign-in flow
      const googleToken = await getGoogleToken(); // Implement this function
      await googleAuth(googleToken, userType);
    } catch (error: any) {
      setErrorMsg(error.message || 'Google authentication failed');
    }
  }, [userType, googleAuth]);

  // Placeholder for Google token retrieval
  const getGoogleToken = async (): Promise<string> => {
    // TODO: Implement actual Google OAuth flow
    throw new Error('Google sign-in not implemented yet');
  };

  // Handle forgot password
  const handleForgotPassword = useCallback(async () => {
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your email address first.');
      return;
    }

    try {
      // TODO: Implement password reset API call
      setErrorMsg('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    } catch (error: any) {
      setErrorMsg('Error sending password reset email. Please try again.');
    }
  }, [email]);

  // Show loading state while auth is initializing or during login
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Signing in...</p>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1>Welcome Back</h1>
        <p className={styles.authSubtitle}>Sign in to your account to continue</p>

        <div className={styles.inputGroup}>
          <FiMail className={styles.inputIcon} />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
            autoComplete="email"
          />
        </div>

        <div className={styles.inputGroup}>
          <FiLock className={styles.inputIcon} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
            autoComplete="current-password"
          />
          {isPasswordFocused && (
            <button
              type="button"
              className={styles.passwordToggle}
              onMouseDown={(e) => e.preventDefault()} // Prevents blur when clicking
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          )}
        </div>

        {errorMsg && (
          <div className={styles.authError}>
            <FiAlertCircle className={styles.errorIcon} />
            <span>{errorMsg}</span>
          </div>
        )}

        {showForgotPassword ? (
          <div className={styles.forgotPasswordContainer}>
            <p className={styles.forgotPasswordMessage}>
              Forgot your password? We can send you a reset link.
            </p>
            <div className={styles.forgotPasswordActions}>
              <button
                className={`${styles.authButton} ${styles.secondary}`}
                onClick={handleForgotPassword}
              >
                Send Reset Email
              </button>
              <button
                className={styles.textButton}
                onClick={() => setShowForgotPassword(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className={`${styles.textButton} ${styles.forgotPassword}`}
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot password?
          </button>
        )}

        <button
          className={`${styles.authButton} ${styles.primary}`}
          onClick={handleEmailLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className={styles.authDivider}>
          <span>or continue with</span>
        </div>

        <button
          className={`${styles.authButton} ${styles.google}`}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <FcGoogle className={styles.googleIcon} />
          Google
        </button>

        <p className={styles.authFooter}>
          Don't have an account?{' '}
          <button
            className={styles.textButton}
            onClick={() => router.push('/employer/register')}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}