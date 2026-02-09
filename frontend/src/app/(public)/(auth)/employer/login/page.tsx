// app/employer/login/page.tsx
'use client';

import AuthForm from '@/components/auth/AuthForm';
import { UserType } from '@/types';

export default function EmployerLoginPage() {
  return <AuthForm mode="login" userType={UserType.EMPLOYER} />;
}