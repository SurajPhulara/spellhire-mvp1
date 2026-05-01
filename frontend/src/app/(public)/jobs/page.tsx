'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FiSearch, FiX, FiBriefcase } from 'react-icons/fi';
import { Job } from '@/types/job';
import { WorkMode, ExperienceLevel, JobType } from '@/types/base';
import { JobService } from '@/lib/api/services/jobs';
import CandidateJobCard from '@/components/candidate/job/CandidateJobCard';
import JobFilterSidebar from '@/components/job_filter_sidebar/JobFilterSidebar';
import Pagination from '@/components/ui/Pagination';
import styles from './page.module.css';

function JobsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlQ = searchParams.get('q') ?? '';
  const urlJobType = searchParams.get('job_type') ?? '';
  const urlWorkMode = searchParams.get('work_mode') ?? '';
  const urlExperience = searchParams.get('experience_level') ?? '';
  const urlCategory = searchParams.get('category') ?? '';
  const urlLocationCity = searchParams.get('location_city') ?? '';
  const urlLocationCountry = searchParams.get('location_country') ?? '';
  const urlSalaryMin = Number(searchParams.get('salary_min') ?? 0);
  const urlSkills = searchParams.get('required_skills') ?? '';
  const urlFeatured = searchParams.get('is_featured') === 'true';
  const urlSortBy = searchParams.get('sort_by') ?? 'published_at';
  const urlSortOrder = (searchParams.get('sort_order') ?? 'desc') as 'asc' | 'desc';
  const urlOffset = Number(searchParams.get('offset') ?? 0);

  const [localQ, setLocalQ] = useState(urlQ);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await JobService.searchJobs({
        ...(urlQ ? { q: urlQ } : {}),
        ...(urlJobType ? { job_type: urlJobType as JobType } : {}),
        ...(urlWorkMode ? { work_mode: urlWorkMode as WorkMode } : {}),
        ...(urlExperience ? { experience_level: urlExperience as ExperienceLevel } : {}),
        ...(urlCategory ? { category: urlCategory } : {}),
        ...(urlLocationCity ? { location_city: urlLocationCity } : {}),
        ...(urlLocationCountry ? { location_country: urlLocationCountry } : {}),
        ...(urlSalaryMin > 0 ? { salary_min: urlSalaryMin } : {}),
        ...(urlSkills ? { required_skills: urlSkills } : {}),
        ...(urlFeatured ? { is_featured: true } : {}),
        sort_by: urlSortBy as 'published_at' | 'salary_min' | 'title' | 'created_at',
        sort_order: urlSortOrder,
        offset: urlOffset,
      });

      if (res.success && res.data) {
        setJobs(res.data.jobs as unknown as Job[]);
        setMeta({
          total: res.meta?.total ?? 0,
          limit: res.meta?.limit ?? 10,
          offset: res.meta?.offset ?? 0,
          has_next: res.meta?.has_next ?? false,
          has_prev: res.meta?.has_prev ?? false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [
    urlQ, urlJobType, urlWorkMode, urlExperience, urlCategory,
    urlLocationCity, urlLocationCountry, urlSalaryMin, urlSkills,
    urlFeatured, urlSortBy, urlSortOrder, urlOffset,
  ]);

  useEffect(() => { setLocalQ(urlQ); }, [urlQ]);
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const pushQ = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('q', q);
    else params.delete('q');
    params.delete('offset');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = () => pushQ(localQ);
  const handleSearchKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };
  const clearSearch = () => { setLocalQ(''); pushQ(''); };

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newOffset > 0) params.set('offset', newOffset.toString());
    else params.delete('offset');
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = urlJobType || urlWorkMode || urlExperience || urlCategory ||
    urlLocationCity || urlLocationCountry || urlSalaryMin > 0 ||
    urlSkills || urlFeatured;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageIcon}>
            <FiBriefcase size={20} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Browse Jobs</h1>
            <p className={styles.pageSubtitle}>
              {loading
                ? 'Finding opportunities…'
                : `${meta.total.toLocaleString()} job${meta.total !== 1 ? 's' : ''} available`}
            </p>
          </div>
        </div>

        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} size={15} />
          <input
            type="text"
            placeholder="Search title, skill, keyword…"
            value={localQ}
            onChange={e => setLocalQ(e.target.value)}
            onKeyDown={handleSearchKey}
            className={styles.searchInput}
          />
          {localQ && (
            <button className={styles.searchClear} onClick={clearSearch} aria-label="Clear search">
              <FiX size={13} />
            </button>
          )}
          <button className={styles.searchBtn} onClick={handleSearch}>Search</button>
        </div>
      </div>

      {(hasFilters || urlQ) && (
        <div className={styles.activeFiltersRow}>
          <span className={styles.activeLabel}>Active filters:</span>

          {urlQ && (
            <span className={styles.filterChip}>
              "{urlQ}"
              <button onClick={clearSearch} className={styles.chipRemove}>
                <FiX size={10} />
              </button>
            </span>
          )}
          {urlJobType && (
            <span className={styles.filterChip}>
              {urlJobType.replace('_', ' ').toLowerCase()}
            </span>
          )}
          {urlWorkMode && (
            <span className={styles.filterChip}>
              {urlWorkMode.replace('_', '-').toLowerCase()}
            </span>
          )}
          {urlExperience && (
            <span className={styles.filterChip}>
              {urlExperience.toLowerCase()}
            </span>
          )}
          {urlCategory && (
            <span className={styles.filterChip}>{urlCategory}</span>
          )}
          {urlLocationCity && (
            <span className={styles.filterChip}>{urlLocationCity}</span>
          )}
          {urlLocationCountry && (
            <span className={styles.filterChip}>{urlLocationCountry}</span>
          )}
          {urlSalaryMin > 0 && (
            <span className={styles.filterChip}>
              Min ₹{(urlSalaryMin / 100000).toFixed(1)}L
            </span>
          )}
          {urlSkills && (
            <span className={styles.filterChip}>Skills: {urlSkills}</span>
          )}
          {urlFeatured && (
            <span className={styles.filterChip}>Featured</span>
          )}
        </div>
      )}

      <div className={styles.layout}>
        <main className={styles.main}>
          {loading && (
            <div className={styles.list}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or clearing some filters</p>
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <>
              <div className={styles.list}>
                {jobs.map((job, i) => (
                  <CandidateJobCard
                    key={job.id}
                    job={job}
                    index={i}
                    isSaved={Boolean((job as Job & { is_saved?: boolean }).is_saved)}
                    onSave={(jobId, nextSaved) => {
                      setJobs(prev =>
                        prev.map(j =>
                          j.id === jobId
                            ? { ...j, is_saved: nextSaved } as Job
                            : j
                        )
                      );
                    }}
                  />
                ))}
              </div>

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

        <JobFilterSidebar />
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
          Loading…
        </div>
      }
    >
      <JobsPageContent />
    </Suspense>
  );
}