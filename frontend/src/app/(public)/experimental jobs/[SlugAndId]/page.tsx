// frontend/src/app/(public)/jobs/[SlugAndId]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JobDescription from '@/components/jobs/JobDescription/JobDescription';
import { JobPublicResponse } from '@/types/job';
import { JobService } from '@/lib/api/services/jobs';
import { useJobInteraction } from '@/hooks/useJobInteraction';
import { useAuth } from '@/contexts/AuthContext';

export default function JobDetailPage() {
    const { SlugAndId } = useParams();


    const { user, userType, isLoading: authLoading, isAuthenticated } = useAuth();

    const [job, setJob] = useState<JobPublicResponse['job'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const jobId =
        typeof SlugAndId === 'string'
            ? SlugAndId?.split('-').slice(-1)[0]
            : '';



    // Use the job interaction hook
    const { saved, applied, toggleSave, applyForJob } = useJobInteraction(
        jobId,
        user,
        userType,
        authLoading
    );

    const handleApply = async () => {
        try {
            if (authLoading) return;
            if (!user) {
                window.location.href = '/register';
                return;
            }
            if (userType !== 'CANDIDATE') {
                alert('To use this feature, please sign in as a candidate.');
                return;
            }

            await applyForJob();

            // Note: Application count is not available in public job data
        } catch (err) {
            console.error('Error applying to job:', err);
        }
    };

    const handleSave = async () => {
        await toggleSave();
    };

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                const response = await JobService.getJobPublic(jobId);

                if (response.success) {
                    // console.log(response.data.job)
                    setJob(response.data.job);
                } else {
                    throw new Error(response.message || 'Failed to fetch job');
                }
            } catch (err: unknown) {
                const error = err as Error;
                setError(error.message || 'Failed to fetch job');
            } finally {
                setLoading(false);
            }
        };

        if (jobId) fetchJob();
    }, [jobId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-lg text-gray-700 font-medium">Loading job details...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Error Loading Job</h3>
            <p className="text-gray-600 max-w-md">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
            >
                Try Again
            </button>
        </div>
    );

    if (!job) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Job Not Found</h3>
            <p className="text-gray-600 max-w-md">The job you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
            <button
                onClick={() => router.push('/jobs')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
            >
                Back to Jobs
            </button>
        </div>
    );

    return (
        <JobDescription
            job={job}
            onSubmit={handleApply}
            onsave={handleSave}
            saved={saved}
            applied={applied}
        />
    );
}
