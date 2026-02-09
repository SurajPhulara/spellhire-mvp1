// app/(public)/(auth)/layout.tsx

'use client';

import React, { useEffect } from 'react';
import GoogleOAuthProvider from '@/components/auth/GoogleOAuthProvider';
import { useAuth } from '@/contexts/AuthContext';
import { redirect, usePathname } from 'next/navigation';
import { getRedirectPath } from '@/lib/utils';
import Loading from '@/app/loading';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      const redirectPath = getRedirectPath(user);
      if (redirectPath !== pathname) {
        console.log('redirecting to', redirectPath);
        redirect(redirectPath);
      }
    }
  }, [isAuthenticated, user, isLoading, pathname, user?.email_verified]);



  return (
    <GoogleOAuthProvider>
      {children}
    </GoogleOAuthProvider>
  );
}