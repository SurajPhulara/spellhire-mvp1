// frontend/src/app/(protected)/employer/layout.tsx
"use client";
import EmployerSidebar from "@/components/employer/sidebar/EmployerSidebar";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserType } from "@/types";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter()

    const {user} = useAuth()

    useEffect(()=>{
        if(user?.user_type != UserType.EMPLOYER)
            router.replace("/")
    },[user])

    const showSidebar = !pathname.includes("onboarding");

    return (
        <div className="flex space-between">
            {showSidebar && <EmployerSidebar />}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}