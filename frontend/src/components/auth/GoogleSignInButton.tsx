'use client';

import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import styles from './AuthForm.module.css';

interface GoogleSignInButtonProps {
  onSuccess: (token: string) => Promise<void>;
  disabled?: boolean;
  mode: 'login' | 'register';
}

export default function GoogleSignInButton({ 
  onSuccess, 
  disabled = false,
  mode
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        // The tokenResponse contains an access_token
        // We send this to our backend which will verify it with Google
        await onSuccess(tokenResponse.access_token);
      } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setIsLoading(false);
    },
    flow: 'implicit', // Use implicit flow to get access_token directly
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={disabled || isLoading}
      className={`${styles.authButton} ${styles.google}`}
    >
      <FcGoogle className={styles.googleIcon} />
      {isLoading ? 'Signing in...' : mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
    </button>
  );
}