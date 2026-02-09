// app/candidate/register/page.tsx
'use client';

import AuthForm from '@/components/auth/AuthForm';
import { UserType } from '@/types';

export default function CandidateRegisterPage() {
  return <AuthForm mode="register" userType={UserType.CANDIDATE} />;
}