"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import JobCard from "@/components/employer/jobs/JobCard";
import Pagination from "@/components/ui/Pagination";
import { JobService } from "@/lib/api/services/jobs";
import { Job, JobStatus, JobManagementFilters } from "@/types";
import styles from "./page.module.css";

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
      console.error(err);
      setError(err.message || "Error fetching jobs");
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
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={`${styles.card} ${styles.header} ${styles.fadeIn}`}>
          <div className={styles.headerFlex}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Manage Your Jobs</h1>
              <p className={styles.subtitle}>
                View, edit, and manage all your job postings in one place
              </p>
            </div>

            <button
              onClick={() => router.push("/employer/jobs/new")}
              className={styles.primaryBtn}
            >
              <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Job
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`${styles.cardSmall}`}>
          <div className={styles.filterRow}>
            <div className={styles.filterLeft}>
              
              <svg className={styles.filterIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth={2} d="M3 4h18v2l-7 7v4l-4 4v-8L3 6z" />
              </svg>

              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as JobStatus | "")}
                className={styles.select}
              >
                <option value="">All Statuses</option>
                <option value={JobStatus.DRAFT}>Draft</option>
                <option value={JobStatus.ACTIVE}>Active</option>
                <option value={JobStatus.PAUSED}>Paused</option>
                <option value={JobStatus.CLOSED}>Closed</option>
              </select>
            </div>

            {meta.total > 0 && (
              <div className={styles.stats}>
                Showing <b>{offset + 1}–{Math.min(offset + meta.limit, meta.total)}</b> of{" "}
                <b>{meta.total}</b> jobs
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <div className={styles.errorInner}>
              <div className={styles.errorIconWrap}>
                ⚠
              </div>

              <div className={styles.errorText}>
                <h3>Error Loading Jobs</h3>
                <p>{error}</p>
              </div>

              <button onClick={fetchJobs} className={styles.retryBtn}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles.loaderWrap}>
            <div className={styles.loader}></div>
            <p>Loading your jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className={`${styles.card} ${styles.empty}`}>
            <h3>No Jobs Found</h3>
            <p>
              {statusFilter
                ? "No jobs for this filter."
                : "You haven't created any jobs yet."}
            </p>

            <button
              onClick={() => router.push("/employer/jobs/new")}
              className={styles.primaryBtn}
            >
              Create Your First Job
            </button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>

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
    </div>
  );
}