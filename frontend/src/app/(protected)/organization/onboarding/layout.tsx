"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserType } from "@/types";

export default function OrganizationOnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.user_type !== UserType.EMPLOYER) {
      router.replace("/");
    }
  }, [user, router]);

  return <>{children}</>;
}
