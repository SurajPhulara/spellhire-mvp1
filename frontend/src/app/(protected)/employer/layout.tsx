// frontend/src/app/(protected)/employer/layout.tsx
"use client";
import EmployerSidebar from "@/components/employer/sidebar/EmployerSidebar";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserType } from "@/types";
import { canRecruit } from "@/lib/utils";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter()

    const {user, employerRole} = useAuth()

    useEffect(()=>{
        if(user?.user_type != UserType.EMPLOYER)
            router.replace("/")
        // ADMIN and RECRUITER both use this employer app. No interviewer login UI.
        if (user?.user_type === UserType.EMPLOYER && employerRole && !canRecruit(employerRole))
            router.replace("/")
    },[user, employerRole, router])

    const showSidebar = !pathname.includes("onboarding");

    return (
        <div className="flex gap-6" style={{ '--sidebar-top': '50px' }}>
            {showSidebar && <EmployerSidebar />}
            {children}
        </div>
    );
}