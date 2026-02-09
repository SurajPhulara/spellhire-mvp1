// app/candidate/login/page.tsx
'use client';

import AuthForm from '@/components/auth/AuthForm';
import { UserType } from '@/types';

export default function CandidateLoginPage() {
  return <AuthForm mode="login" userType={UserType.CANDIDATE} />;
}