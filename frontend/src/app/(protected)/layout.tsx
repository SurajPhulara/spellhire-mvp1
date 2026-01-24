// src/app/(protected)/layout.tsx

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '../loading';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated → home
    if (!isAuthenticated || !user) {
      router.replace('/');
      return;
    }

    // Authenticated but email not verified → verify email
    if (!user.email_verified && pathname !== '/verify-email') {
      router.replace('/verify-email');
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return <Loading message="" />;
  }

  return children;
}
