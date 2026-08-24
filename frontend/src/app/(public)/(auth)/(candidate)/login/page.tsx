'use client';

import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import Loading from '@/app/loading';

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
