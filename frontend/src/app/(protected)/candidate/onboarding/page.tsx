// app/(protected)/(candidate)/onboarding/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CandidateProfileForm from "@/components/candidate/profile/CandidateProfileForm";
import { CandidateProfile, CandidateProfileRequest } from "@/types";
import { ProfileService } from "@/lib/api/services/profile";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/app/loading";

export default function OnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);  // Candidate profile data to be displayed in the form if it exists
  const { isLoading, refreshAuth, user} = useAuth()

  useEffect(() => {

    // if(user?.is_profile_complete)
    //   router.push("/candidate/dashboard")

    const fetchCandidateProfile = async () => {
      const response = await ProfileService.getCandidateProfile();
      if (response.data?.candidate) {
        setCandidateProfile(response.data.candidate);
      }
    };
    fetchCandidateProfile();
  }, [user]);

  const handleSubmit = async (data: CandidateProfileRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await ProfileService.updateCandidateProfile(data);
      await refreshAuth()
      if (response.success && response.data) {
        // Profile created successfully - redirect to dashboard
        // router.push("/dashboard");
      } else {
        setError(response?.errors?.[0]?.message || "Failed to create profile");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      console.error("Profile creation error:", err);
    } finally {
      setIsSubmitting(false);
    } 
  };

  if(isLoading)
    return <Loading></Loading>

  return (
    <div className="min-h-screen py-24 px-4 min-w-full" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '1.5rem' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="mb-8 p-8 bg-white rounded-3xl shadow-2xl text-center animate-fadeIn">
          <div className="mb-4">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
            Welcome! Let's Set Up Your Profile
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete your profile to start applying for jobs and connecting with employers. This will only take a few minutes.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Quick Setup
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Get Noticed
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Find Opportunities
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-red-500">
              <div className="p-6 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-semibold mb-1">Oops! Something went wrong</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <CandidateProfileForm
          initialData={candidateProfile}
          ProfilePictureURL={user?.profile_picture_url}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Complete Profile"
          mode="create"
        />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}