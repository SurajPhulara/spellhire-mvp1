'use client';

import React, { useEffect, useState } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { Job, JobPublic } from '@/types/job';
import { JobService } from '@/lib/api/services/jobs';
import CandidateJobCard from '@/components/candidate/job/CandidateJobCard';
import Pagination from '@/components/ui/Pagination';
import styles from '../page.module.css'; // reuse same styles
import { PaginationMeta } from '@/types';

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<JobPublic[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    limit: 10,
    offset: 0,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);

  // ── Fetch saved jobs ─────────────────────────────────────
  const fetchSavedJobs = async (offset: number = 0) => {
    setLoading(true);
    try {
      const res = await JobService.getSavedJobs(offset);

      if (res.success && res.data) {
        setJobs(res.data.jobs as JobPublic[]);
        setMeta(res.meta as unknown as PaginationMeta);
      }
    } catch (err) {
      console.error('Failed to fetch saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs(0);
  }, []);

  // ── Pagination ───────────────────────────────────────────
  const handlePageChange = (newOffset: number) => {
    fetchSavedJobs(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageIcon}>
            <FiBookmark size={20} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Saved Jobs</h1>
            <p className={styles.pageSubtitle}>
              {loading
                ? 'Loading your saved jobs…'
                : `${meta.total} saved job${meta.total !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className={styles.main}>
        {/* Loading */}
        {loading && (
          <div className={styles.list}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📌</div>
            <h3>No saved jobs yet</h3>
            <p>Start saving jobs to view them here</p>
          </div>
        )}

        {/* Jobs */}
        {!loading && jobs.length > 0 && (
          <>
            <div className={styles.list}>
              {jobs.map((job, i) => (
                <CandidateJobCard
                  key={job.id}
                  job={job}
                  index={i}
                  isSaved={true} // always true here
                  onSave={(jobId, nextSaved) => {
                    // if unsaved → remove from list
                    if (!nextSaved) {
                      setJobs(prev => prev.filter(j => j.id !== jobId));
                    }
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className={styles.paginationWrapper}>
              <Pagination
                offset={meta.offset}
                limit={meta.limit}
                total={meta.total}
                has_next={meta.has_next}
                has_prev={meta.has_prev}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}