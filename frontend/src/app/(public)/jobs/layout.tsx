// frontend/src/app/(protected)/(candidate)/layout.tsx
"use client";
import CandidateSidebar from "@/components/candidate/sidebar/CandidateSidebar";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserType } from "@/types";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter()

    const {user} = useAuth()

    // useEffect(()=>{
    //     if(user?.user_type != UserType.CANDIDATE)
    //         router.replace("/")
    // },[user])
    

    const showSidebar = user?.user_type == UserType.CANDIDATE;

    return (
        <div className="flex gap-6">
            {showSidebar && <CandidateSidebar />}

        <div className="flex-1">
            {children}
            </div>
        </div>
    );
}