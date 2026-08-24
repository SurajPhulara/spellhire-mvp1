'use client';

import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { UserType } from '@/types';
import Loading from '@/app/loading';

export default function CandidateRegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm
        mode="register"
        userType={UserType.CANDIDATE}
        heading="Create your account"
        subtitle="Search jobs, apply, and track applications."
      />
    </Suspense>
  );
}
