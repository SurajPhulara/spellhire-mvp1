'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AuthForm.module.css';
import { FiMail, FiLock, FiAlertCircle, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types';
import Loading from '@/app/loading';
import GoogleSignInButton from './GoogleSignInButton';

interface AuthFormProps {
  mode: 'login' | 'register';
  userType: UserType;
}

// Password validation function
const validatePassword = (password: string) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  return {
    isValid: Object.values(requirements).every(Boolean),
    requirements
  };
};

export default function AuthForm({ mode, userType }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  const { login, register, googleAuth, isLoading, isAuthenticated, user } = useAuth();
  
  const isRegister = mode === 'register';
  const isCandidate = userType === UserType.CANDIDATE;

  // Redirect logic based on authentication state
  useEffect(() => {
    if (isLoading) return;
    
    if (isAuthenticated && user) {
      if (!user?.email_verified) {
        router.push("/verify-email");
      } else if (!user.is_profile_complete) {
        router.push(isCandidate ? "/candidate/onboarding" : "/employer/onboarding");
      } else {
        router.push(isCandidate ? "/candidate/dashboard" : "/employer/dashboard");
      }
    }
  }, [isAuthenticated, user, router, isLoading, isCandidate]);

  // Password validation
  const passwordValidation = validatePassword(password);

  // Handle email/password authentication
  const handleEmailAuth = useCallback(async () => {
    setErrorMsg('');
    setShowForgotPassword(false);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (isRegister) {
      // Registration-specific validation
      if (!confirmPassword) {
        setErrorMsg('Please confirm your password.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please try again.');
        return;
      }
      
      if (!passwordValidation.isValid) {
        setErrorMsg('Please ensure your password meets all security requirements.');
        setShowPasswordRequirements(true);
        return;
      }
    }

    try {
      if (isRegister) {
        await register(email, password, userType);
      } else {
        await login(email, password, userType);
      }
    } catch (error: any) {
      if (isRegister) {
        if (error.response?.status === 409) {
          setErrorMsg(
            'An account with this email already exists. Please login instead. If you forgot your password, use the "Forgot Password" option on the login page.'
          );
        } else {
          setErrorMsg('An error occurred during registration. Please try again.');
        }
      } else {
        if (error.response?.status === 401) {
          setErrorMsg('Invalid email or password. Please try again or reset your password.');
          setShowForgotPassword(true);
        } else {
          setErrorMsg('An error occurred during sign in. Please try again.');
        }
      }
    }
  }, [email, password, confirmPassword, userType, isRegister, login, register, passwordValidation.isValid]);

  // Handle Google sign-in
  const handleGoogleSignIn = useCallback(async (googleToken: string) => {
    setErrorMsg('');

    try {
      await googleAuth(googleToken, userType);
    } catch (error: any) {
      setErrorMsg(error.message || 'Google authentication failed');
    }
  }, [userType, googleAuth]);

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

  // Get route paths
  const getAlternateModePath = () => {
    if (isRegister) {
      return isCandidate ? '/login' : '/employer/login';
    } else {
      return isCandidate ? '/register' : '/employer/register';
    }
  };

  const getAlternateUserTypePath = () => {
    if (isCandidate) {
      return isRegister ? '/employer/register' : '/employer/login';
    } else {
      return isRegister ? '/register' : '/login';
    }
  };

  // Show loading state while auth is initializing or during login/registration
  if (isLoading || isAuthenticated) {
    return <Loading />;
  }
  
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1>{isRegister ? 'Create Your Account' : 'Welcome Back'}</h1>
        <p className={styles.authSubtitle}>
          {isRegister ? 'Sign up' : 'Sign in'} as a{' '}
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
            {isCandidate ? 'Candidate' : 'Employer'}
          </span>
        </p>

        <div className={styles.inputGroup}>
          <FiMail className={styles.inputIcon} />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
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
            onFocus={() => {
              setIsPasswordFocused(true);
              if (isRegister) setShowPasswordRequirements(true);
            }}
            onBlur={() => {
              setIsPasswordFocused(false);
              if (isRegister) setShowPasswordRequirements(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          {isPasswordFocused && (
            <button
              type="button"
              className={styles.passwordToggle}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          )}
        </div>

        {isRegister && (
          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setIsConfirmPasswordFocused(true)}
              onBlur={() => setIsConfirmPasswordFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
              autoComplete="new-password"
            />
            {isConfirmPasswordFocused && (
              <button
                type="button"
                className={styles.passwordToggle}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            )}
          </div>
        )}

        {isRegister && showPasswordRequirements && (
          <div className={styles.passwordRequirements}>
            <h4>Password Requirements:</h4>
            <ul>
              <li className={passwordValidation.requirements.length ? styles.requirementMet : styles.requirementFailed}>
                {passwordValidation.requirements.length ? <FiCheck /> : <FiX />}
                At least 8 characters
              </li>
              <li className={passwordValidation.requirements.uppercase ? styles.requirementMet : styles.requirementFailed}>
                {passwordValidation.requirements.uppercase ? <FiCheck /> : <FiX />}
                One uppercase letter
              </li>
              <li className={passwordValidation.requirements.lowercase ? styles.requirementMet : styles.requirementFailed}>
                {passwordValidation.requirements.lowercase ? <FiCheck /> : <FiX />}
                One lowercase letter
              </li>
              <li className={passwordValidation.requirements.number ? styles.requirementMet : styles.requirementFailed}>
                {passwordValidation.requirements.number ? <FiCheck /> : <FiX />}
                One number
              </li>
              <li className={passwordValidation.requirements.special ? styles.requirementMet : styles.requirementFailed}>
                {passwordValidation.requirements.special ? <FiCheck /> : <FiX />}
                One special character (!@#$%^&*)
              </li>
            </ul>
          </div>
        )}

        {errorMsg && (
          <div className={styles.authError}>
            <FiAlertCircle className={styles.errorIcon} />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isRegister && showForgotPassword ? (
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
        ) : !isRegister ? (
          <button
            className={`${styles.textButton} ${styles.forgotPassword}`}
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot password?
          </button>
        ) : null}

        <button
          className={`${styles.authButton} ${styles.primary}`}
          onClick={handleEmailAuth}
          disabled={isLoading}
        >
          {isLoading ? (isRegister ? 'Creating Account...' : 'Signing In...') : (isRegister ? 'Sign Up' : 'Sign In')}
        </button>

        <div className={styles.authDivider}>
          <span>or continue with</span>
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSignIn}
          disabled={isLoading}
          mode={mode}
        />

        <p className={styles.authFooter}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{' '}
          <button
            className={styles.textButton}
            onClick={() => router.push(getAlternateModePath())}
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </button>
        </p>

        <p className={styles.authFooter}>
          {isCandidate ? 'Are you an employer?' : 'Are you a candidate?'}{' '}
          <button
            className={styles.textButton}
            onClick={() => router.push(getAlternateUserTypePath())}
          >
            {isCandidate ? 'Employer' : 'Candidate'} {isRegister ? 'sign up' : 'sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}