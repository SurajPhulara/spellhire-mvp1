// app/register/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { FiMail, FiLock, FiAlertCircle, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types';

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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  const { register, googleAuth, isLoading, isAuthenticated, user } = useAuth();
  
  useEffect(()=>{
    if (isLoading) return;
    if (isAuthenticated)
      if(! user?.email_verified)
        router.push("/verify-email")
      else router.push("/dashboard")
  },[isAuthenticated, user, router])
  
  // Fixed user type for employer registration page
  const userType = UserType.EMPLOYER;

  // Password validation
  const passwordValidation = validatePassword(password);

  // Email registration
  const handleEmailRegister = useCallback(async () => {
    setErrorMsg('');
    
    // Validate inputs
    if (!email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please try again.');
      return;
    }
    
    // Validate password requirements
    if (!passwordValidation.isValid) {
      setErrorMsg('Please ensure your password meets all security requirements.');
      setShowPasswordRequirements(true);
      return;
    }

    try {
      await register(email, password, userType);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrorMsg(
          'An account with this email already exists. Please login instead. If you forgot your password, use the "Forgot Password" option on the login page.'
        );
      } else {
        setErrorMsg('An error occurred during registration. Please try again.');
      }
    }
  }, [email, password, confirmPassword, userType, register, router, passwordValidation.isValid]);

  // Google sign-in
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
  }, [userType, googleAuth, router]);

  // Placeholder for Google token retrieval
  const getGoogleToken = async (): Promise<string> => {
    // TODO: Implement actual Google OAuth flow
    throw new Error('Google sign-in not implemented yet');
  };

  // Show loading state while auth is initializing or during registration
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Creating account...</p>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1>Create Your Account</h1>
        <p className={styles.authSubtitle}>Sign up to get started</p>

        <div className={styles.inputGroup}>
          <FiMail className={styles.inputIcon} />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailRegister()}
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
              setShowPasswordRequirements(true);
              setIsPasswordFocused(true);
            }}
            onBlur={() => {
              setShowPasswordRequirements(false);
              setIsPasswordFocused(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailRegister()}
            autoComplete="new-password"
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

        <div className={styles.inputGroup}>
          <FiLock className={styles.inputIcon} />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setIsConfirmPasswordFocused(true)}
            onBlur={() => setIsConfirmPasswordFocused(false)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailRegister()}
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

        {showPasswordRequirements && (
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

        <button
          className={`${styles.authButton} ${styles.primary}`}
          onClick={handleEmailRegister}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
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
          Already have an account?{' '}
          <button
            className={styles.textButton}
            onClick={() => router.push('/login')}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}