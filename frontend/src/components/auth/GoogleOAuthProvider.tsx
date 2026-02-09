// components/auth/GoogleOAuthProvider.tsx
'use client';

import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import React from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "502608334693-jjaf9nd6409j045bh6omkg9vlolpp4rs.apps.googleusercontent.com";

export default function GoogleOAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoogleProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleProvider>
  );
}