// app/(public)/(auth)/verify-email/page.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { FiAlertCircle, FiArrowLeft, FiMail } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/lib/api/services/auth';
import { UserType } from '@/types';
import Loading from '@/app/loading';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { logout, isLoading, isAuthenticated, user, refreshAuth} = useAuth();

  useEffect(() => {
    if (user?.email_verified)
      router.push(user?.user_type == UserType.CANDIDATE ? "/candidate/onboarding" : "/organization/onboarding")
  }, [isLoading, isAuthenticated, user])

  // Initialize countdown from localStorage or set new timestamp
  useEffect(() => {
    const storedTimestamp = localStorage.getItem('otp_sent_at');
    const now = Date.now();

    if (storedTimestamp) {
      const elapsedSeconds = Math.floor((now - parseInt(storedTimestamp)) / 1000);
      const remainingSeconds = Math.max(0, 120 - elapsedSeconds);

      setCountdown(remainingSeconds);
      setCanResend(remainingSeconds === 0);
    } else {
      // First time on page, set timestamp
      localStorage.setItem('otp_sent_at', now.toString());
    }
  }, []);

  // Start countdown timer
  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [countdown]);

  // Format countdown time
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle OTP input change
  const handleOtpChange = useCallback((index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMsg('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  // Handle backspace
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerifyOtp();
    }
  }, [otp]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or last input
    const nextEmptyIndex = newOtp.findIndex(val => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  }, [otp]);

  // Verify OTP
  const handleVerifyOtp = useCallback(async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await AuthService.verifyEmail({ otp: otpString });
      await refreshAuth()
    } catch (error: any) {
      if (error.response?.status === 400) {
        setErrorMsg('Invalid or expired code. Please try again.');
      } else if (error.response?.status === 404) {
        setErrorMsg('Verification session not found. Please register again.');
      } else {
        setErrorMsg('An error occurred. Please try again.');
      }
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otp, router]);

  // Resend OTP
  const handleResendOtp = useCallback(async () => {
    if (!canResend) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // TODO: Implement resend OTP API call
      await AuthService.resendVerification();

      // Reset countdown and store new timestamp
      const now = Date.now();
      localStorage.setItem('otp_sent_at', now.toString());

      setCountdown(120);
      setCanResend(false);

      // Restart countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      setErrorMsg('A new code has been sent to your email.');
    } catch (error: any) {
      setErrorMsg('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [canResend]);

  // Handle back to registration
  const handleBackToRegistration = useCallback(() => {
    // Clear the OTP timestamp when going back
    localStorage.removeItem('otp_sent_at');
    logout();
    router.push('/register');
  }, [logout, router]);


  // Show loading while checking auth OR while authenticated
  if (isLoading || user?.email_verified) {
    return (
      <Loading></Loading>
    );
  }


  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.verificationHeader}>
          <div className={styles.iconWrapper}>
            <FiMail className={styles.mailIcon} />
          </div>
          <h1>Verify Your Email</h1>
          <p className={styles.authSubtitle}>
            We've sent a 6-digit verification code to your email address. Please enter it below.
          </p>
        </div>

        <div className={styles.otpContainer}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={styles.otpInput}
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {errorMsg && (
          <div className={styles.authError}>
            <FiAlertCircle className={styles.errorIcon} />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          className={`${styles.authButton} ${styles.primary}`}
          onClick={handleVerifyOtp}
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        {countdown > 0 ? (
          <p className={styles.resendText}>
            Didn't receive the code?{' '}
            <span className={styles.countdownText}>
              Resend available in {formatTime(countdown)}
            </span>
          </p>
        ) : (
          <p className={styles.resendText}>
            Didn't receive the code?{' '}
            <button
              className={styles.textButton}
              onClick={handleResendOtp}
              disabled={loading}
            >
              Resend Code
            </button>
          </p>
        )}

        <button
          className={`${styles.textButton} ${styles.secondary} ${styles.backButton}`}
          onClick={handleBackToRegistration}
          disabled={loading}
        >
          <FiArrowLeft className={styles.backIcon} /> Back to Registration
        </button>
      </div>
    </div>
  );
}