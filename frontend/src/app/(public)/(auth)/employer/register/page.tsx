// app/employer/register/page.tsx
'use client';

import AuthForm from '@/components/auth/AuthForm';
import { UserType } from '@/types';

export default function EmployerRegisterPage() {
  return <AuthForm mode="register" userType={UserType.EMPLOYER} />;
}