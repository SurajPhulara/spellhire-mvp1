'use client';

import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { UserType } from '@/types';
import Loading from '@/app/loading';

export default function EmployerLoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm
        mode="login"
        userType={UserType.EMPLOYER}
        heading="Organization sign in"
        subtitle="Sign in with your email. We’ll open the organization you belong to."
      />
    </Suspense>
  );
}
