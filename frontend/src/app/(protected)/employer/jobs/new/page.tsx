// app/(protected)/employer/jobs/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JobPostingForm from "@/components/employer/jobs/JobPostingForm";
import { JobService } from "@/lib/api/services/jobs";
import { JobRequest } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function NewJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth()

  const handleSubmit = async (data: JobRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await JobService.createJob(data);

      if (response.success && response.data) {
        alert("Job posted successfully!");
        router.push("/employer/jobs");
      } else {
        setError(response.errors?.[0]?.message || "Failed to create job posting");
      }
    } catch (err: any) {
      console.error("Error creating job:", err);
      setError(err.message || "An error occurred while creating the job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="mb-8 p-8 bg-white rounded-3xl shadow-2xl text-center animate-fadeIn">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Jobs
          </button>

          <div className="mb-4">
            {
              (user?.organization_logo) ? (
                <img className="w-24 h-24 m-auto" src={user?.organization_logo} alt="organization logo" />
              ) : (
                <div className="inline-block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
                  <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )
            }
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Create New Job Posting
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fill in the details to attract the best candidates for your role
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 animate-fadeIn">
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
                  <h3 className="text-red-800 font-semibold mb-1">Error Creating Job</h3>
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

        {/* Form */}
        <JobPostingForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Post Job"
        />

        {/* Tips Section */}
        <div className="max-w-4xl mx-auto mt-8 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Tips for a Great Job Posting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Be Specific</h4>
                  <p className="text-sm text-gray-600">Clear job titles and detailed descriptions attract better candidates</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Highlight Benefits</h4>
                  <p className="text-sm text-gray-600">Showcase what makes your company a great place to work</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Use Bullet Points</h4>
                  <p className="text-sm text-gray-600">Make responsibilities and requirements easy to scan</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Include Salary Range</h4>
                  <p className="text-sm text-gray-600">Transparency increases application rates by up to 30%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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