// app/(protected)/employer/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import JobCard from "@/components/employer/jobs/JobCard";
import Pagination from "@/components/ui/Pagination";
import { JobService } from "@/lib/api/services/jobs";
import { Job, JobStatus, JobManagementFilters } from "@/types";

export default function ManageJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [offset, setOffset] = useState(0);
  const [meta, setMeta] = useState({
    total: 0,
    limit: 9,
    offset: 0,
    has_next: false,
    has_prev: false,
  });

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, offset]);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: JobManagementFilters = {
        offset,
        status_filter: statusFilter || undefined,
      };

      const response = await JobService.getOrganizationJobs(filters);

      if (response.success && response.data) {
        setJobs(response.data.jobs);
        setMeta(response.meta);
      } else {
        setError(response.errors || "Failed to fetch jobs");
      }
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      setError(err.message || "An error occurred while fetching jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = (jobId: string, newStatus: JobStatus) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job))
    );
  };

  const handleDelete = (jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const handleStatusFilterChange = (status: JobStatus | "") => {
    setStatusFilter(status);
    setOffset(0);
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-fit pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header Card */}
        <div className="mb-8 p-8 bg-white rounded-3xl shadow-2xl animate-fadeIn">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h1
                className="text-4xl font-bold mb-3"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Manage Your Jobs
              </h1>
              <p className="text-lg text-gray-600">
                View, edit, and manage all your job postings in one place
              </p>
            </div>
            <button
              onClick={() => router.push("/employer/jobs/new")}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Job
            </button>
          </div>
        </div>

        {/* Filters and Stats */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as JobStatus | "")}
                className="flex-1 md:flex-none px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
              >
                <option value="">All Statuses</option>
                <option value={JobStatus.DRAFT}>Draft</option>
                <option value={JobStatus.ACTIVE}>Active</option>
                <option value={JobStatus.PAUSED}>Paused</option>
                <option value={JobStatus.CLOSED}>Closed</option>
              </select>
            </div>

            {meta.total > 0 && (
              <div className="text-sm text-gray-500 font-medium">
                Showing{" "}
                <span className="text-gray-800 font-semibold">
                  {offset + 1}–{Math.min(offset + meta.limit, meta.total)}
                </span>
                {" "}of{" "}
                <span className="text-gray-800 font-semibold">{meta.total}</span> jobs
                {statusFilter && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                    {JobService.getJobStatusText(statusFilter as JobStatus)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-red-500">
              <div className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-semibold mb-1">Error Loading Jobs</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => fetchJobs()}
                  className="flex-shrink-0 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 rounded-full" />
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading your jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center animate-fadeIn">
            <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Jobs Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {statusFilter
                ? `You don't have any ${JobService.getJobStatusText(statusFilter as JobStatus).toLowerCase()} jobs yet.`
                : "You haven't created any jobs yet. Start by posting your first job!"}
            </p>
            <button
              onClick={() => router.push("/employer/jobs/new")}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Job
            </button>
          </div>
        ) : (
          <>
            {/* Jobs Grid */}
            <div className="flex flex-wrap gap-6 mb-8">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              offset={meta.offset}
              limit={meta.limit}
              total={meta.total}
              has_next={meta.has_next}
              has_prev={meta.has_prev}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}