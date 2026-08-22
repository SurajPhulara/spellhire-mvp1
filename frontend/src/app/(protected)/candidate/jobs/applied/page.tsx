// frontend/src/app/(shared)/candidate/jobs/applied/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiPieChart,
  FiTrendingUp,
  FiXCircle,
  FiTarget,
  FiShield,
  FiEye,
  FiAward,
  FiUsers,
  FiFileText,
  FiBookmark,
  FiUser,
} from 'react-icons/fi';

import { ApplicationService } from '@/lib/api/services/applications';
import Pagination from '@/components/ui/Pagination';
import {
  AppliedJobApplication,
  AppliedJobsResponse,
  AppliedJobsStats,
  PipelineStage,
} from '@/types';
import { PaginationMeta } from '@/types';
import styles from './page.module.css';

const DEFAULT_STATS: AppliedJobsStats = {
  total_applied: 0,
  in_progress: 0,
  offers: 0,
  rejected: 0,
};

function formatSalary(job: AppliedJobApplication['job']): string {
  const min = job.salary_min;
  const max = job.salary_max;
  const currency = job.salary_currency || 'INR';

  const pretty = (n: number) => {
    if (currency === 'INR') return `₹${(n / 100000).toFixed(1)}L`;
    return `${currency} ${n.toLocaleString()}`;
  };

  if (min && max) return `${pretty(min)} – ${pretty(max)}`;
  if (min) return `${pretty(min)}+`;
  if (max) return `Up to ${pretty(max)}`;
  return 'Not disclosed';
}

function formatDate(input?: string | null): string {
  if (!input) return 'N/A';
  return new Date(input).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(input?: string | null): string {
  if (!input) return 'N/A';

  const diff = Date.now() - new Date(input).getTime();
  const days = Math.floor(diff / 86400000);

  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function getPipelineStages(application: AppliedJobApplication): PipelineStage[] {
  return application.pipeline_stages?.length
    ? [...application.pipeline_stages].sort((a, b) => a.order - b.order)
    : [];
}

function isOffer(application: AppliedJobApplication): boolean {
  return application.current_stage_id === 'offer' || application.status?.toUpperCase() === 'OFFERED';
}

function isRejected(application: AppliedJobApplication): boolean {
  return application.current_stage_id === 'rejected' || application.status?.toUpperCase() === 'REJECTED';
}

function getTone(application: AppliedJobApplication): 'applied' | 'progress' | 'offer' | 'rejected' {
  if (isRejected(application)) return 'rejected';
  if (isOffer(application)) return 'offer';
  if (application.current_stage_id === 'applied') return 'applied';
  return 'progress';
}

function getVisibleStages(application: AppliedJobApplication): PipelineStage[] {
  const stages = getPipelineStages(application);
  if (!stages.length) return [];

  const idx = stages.findIndex((s) => s.id === application.current_stage_id);
  const currentIndex = idx >= 0 ? idx : 0;

  if (application.current_stage_id === 'applied') {
    return stages.slice(0, 1);
  }

  if (application.current_stage_id === 'screening') {
    return stages.slice(Math.max(0, currentIndex - 1), Math.min(stages.length, currentIndex + 2));
  }

  return stages;
}

function getProgressPercent(application: AppliedJobApplication): number {
  if (isRejected(application) || isOffer(application)) return 100;
  if (application.current_stage_id === 'applied') return 18;
  if (application.current_stage_id === 'screening') return 38;
  if (application.current_stage_id === 'interview') return 68;
  return 44;
}

function ApplicationCard({ application }: { application: AppliedJobApplication }) {
  const job = application.job;
  const tone = getTone(application);
  const stages = getVisibleStages(application);

  const currentStage = getPipelineStages(application).find(
    (s) => s.id === application.current_stage_id
  );

  return (
    <Link href={`/candidate/jobs/applied/${application.application_id}`} className={styles.applicationCard}>
      <div className={styles.applicationTop}>
        <div className={styles.companyBlock}>
          <div className={styles.companyLogo}>
            {job.logo_url ? (
              <img src={job.logo_url} alt={job.organization_name ?? job.title} />
            ) : (
              <FiBriefcase size={18} />
            )}
          </div>

          <div className={styles.companyText}>
            <h3 className={styles.jobTitle}>{job.title}</h3>
            <p className={styles.companyName}>
              {job.organization_name ?? 'Organization'}
            </p>
          </div>
        </div>

        <span className={`${styles.statusBadge} ${styles[`status_${tone}`]}`}>
          {tone === 'rejected' ? 'Rejected' : tone === 'offer' ? 'Offer' : currentStage?.name ?? 'Applied'}
        </span>
      </div>

      <div className={styles.applicationMeta}>
        <span className={styles.metaItem}>
          <FiMapPin size={12} />
          {job.location?.city ? `${job.location.city}, ${job.location.country ?? ''}` : 'Location not specified'}
        </span>
        <span className={styles.metaItem}>
          <FiBriefcase size={12} />
          {job.job_type}
        </span>
        <span className={styles.metaItem}>
          <FiDollarSign size={12} />
          {formatSalary(job)}
        </span>
      </div>

      <div className={styles.progressBlock}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Hiring progress</span>
          <span className={styles.progressValue}>{getProgressPercent(application)}%</span>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${styles[`progress_${tone}`]}`}
            style={{ width: `${getProgressPercent(application)}%` }}
          />
        </div>
      </div>

      <div className={styles.stageRow}>
        {stages.map((stage) => {
          const active = stage.id === application.current_stage_id;
          return (
            <span
              key={stage.id}
              className={`${styles.stagePill} ${active ? styles.stageActive : ''}`}
            >
              {stage.name}
            </span>
          );
        })}
      </div>

      <div className={styles.applicationFooter}>
        <span className={styles.footerItem}>
          <FiClock size={12} />
          Applied {timeAgo(application.applied_at)}
        </span>
        <span className={styles.footerItem}>
          <FiArrowRight size={12} />
          View timeline
        </span>
      </div>
    </Link>
  );
}

function InsightCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={styles.insightCard}>
      <div className={styles.insightIcon}>{icon}</div>
      <div>
        <p className={styles.insightTitle}>{label}</p>
        <strong className={styles.insightValue}>{value}</strong>
        <p className={styles.insightDesc}>{note}</p>
      </div>
    </div>
  );
}

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<AppliedJobApplication[]>([]);
  const [stats, setStats] = useState<AppliedJobsStats>(DEFAULT_STATS);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    limit: 10,
    offset: 0,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchAppliedJobs = async (offset: number = 0) => {
    setLoading(true);
    try {
      const res = await ApplicationService.getAppliedJobs(offset);

      if (res.success && res.data) {
        const payload = res.data as AppliedJobsResponse;
        setApplications(payload.applications ?? []);
        setStats(payload.stats ?? DEFAULT_STATS);
        setMeta(res.meta as PaginationMeta);
      }
    } catch (err) {
      console.error('Failed to fetch applied jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliedJobs(0);
  }, []);

  const quickInsight = useMemo(() => {
    if (stats.offers > 0) return 'You have active offers waiting.';
    if (stats.in_progress > 0) return 'Several applications are still moving through hiring.';
    if (stats.total_applied === 0) return 'Apply to jobs to see your timeline here.';
    return 'Your pipeline is quiet right now — keep applying.';
  }, [stats]);

  const handlePageChange = (newOffset: number) => {
    fetchAppliedJobs(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <div className={styles.headerBar}>
          <div>
            <p className={styles.kicker}>Applied jobs</p>
            <h1 className={styles.pageTitle}>Track your hiring journey</h1>
            <p className={styles.pageSubtitle}>
              Click any card to open the full application timeline.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link href="/jobs" className={styles.primaryAction}>
              Browse jobs
              <FiArrowRight size={14} />
            </Link>
          </div>
        </div>

        <section className={styles.heroGrid}>
          <div className={styles.heroCard}>
            <div className={styles.heroGlow} />

            <div className={styles.heroTop}>
              <div className={styles.heroCopy}>
                <div className={styles.heroMetaRow}>
                  <span className={styles.heroChip}>
                    <FiPieChart size={12} />
                    Application dashboard
                  </span>
                  <span className={styles.heroChip}>
                    <FiShield size={12} />
                    Timeline history enabled
                  </span>
                </div>

                <h2 className={styles.heroHeadline}>{quickInsight}</h2>

                <p className={styles.heroText}>
                  See where each application stands, what stage it reached, and open the timeline for full stage history.
                </p>

                <div className={styles.heroLinks}>
                  <Link href="/jobs" className={styles.heroLink}>
                    Find more jobs
                  </Link>
                  <Link href="/jobs/saved" className={styles.heroLinkSecondary}>
                    Saved jobs
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* <aside className={styles.heroSidebar}>
            <InsightCard
              icon={<FiBriefcase size={14} />}
              label="Total applied"
              value={String(stats.total_applied)}
              note="All applications across your profile."
            />
            <InsightCard
              icon={<FiTrendingUp size={14} />}
              label="In progress"
              value={String(stats.in_progress)}
              note="Active in screening, interview, or review."
            />
          </aside> */}
        </section>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statIcon}><FiBriefcase size={14} /></span>
              <span className={styles.statLabel}>Total applied</span>
            </div>
            <strong className={styles.statValue}>{stats.total_applied}</strong>
            <p className={styles.statSubtext}>All applications in one place</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statIcon}><FiTrendingUp size={14} /></span>
              <span className={styles.statLabel}>In progress</span>
            </div>
            <strong className={styles.statValue}>{stats.in_progress}</strong>
            <p className={styles.statSubtext}>Applications still moving</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statIcon}><FiAward size={14} /></span>
              <span className={styles.statLabel}>Offers</span>
            </div>
            <strong className={styles.statValue}>{stats.offers}</strong>
            <p className={styles.statSubtext}>Offers waiting for review</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statIcon}><FiFileText size={14} /></span>
              <span className={styles.statLabel}>Rejected</span>
            </div>
            <strong className={styles.statValue}>{stats.rejected}</strong>
            <p className={styles.statSubtext}>Closed applications</p>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.mainCol}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionKicker}>Recent applications</p>
                  <h3 className={styles.sectionTitle}>Open the application timeline</h3>
                </div>
              </div>

              {loading && (
                <div className={styles.listSkeleton}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className={styles.skeletonCard} />
                  ))}
                </div>
              )}

              {!loading && applications.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FiBriefcase size={18} />
                  </div>
                  <h4>No applications yet</h4>
                  <p>Your application timeline will appear here once you apply to a job.</p>
                  <Link href="/jobs" className={styles.emptyAction}>
                    Browse jobs
                  </Link>
                </div>
              )}

              {!loading && applications.length > 0 && (
                <div className={styles.applicationList}>
                  {applications.map((application) => (
                    <ApplicationCard
                      key={application.application_id}
                      application={application}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className={styles.sideCol}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionKicker}>What to do next</p>
                  <h3 className={styles.sectionTitle}>Keep momentum</h3>
                </div>
              </div>

              <div className={styles.quickLinks}>
                <Link href="/jobs" className={styles.quickLink}>
                  <div>
                    <strong>Browse more jobs</strong>
                    <span>Find fresh opportunities</span>
                  </div>
                  <FiArrowRight size={14} />
                </Link>

                <Link href="/jobs/saved" className={styles.quickLink}>
                  <div>
                    <strong>Saved jobs</strong>
                    <span>Review your shortlist</span>
                  </div>
                  <FiBookmark size={14} />
                </Link>

                <Link href="/candidate/profile" className={styles.quickLink}>
                  <div>
                    <strong>Profile</strong>
                    <span>Improve recruiter visibility</span>
                  </div>
                  <FiUser size={14} />
                </Link>
              </div>
            </div>
          </aside>
        </section>

        {!loading && applications.length > 0 && (
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
        )}
      </div>
    </div>
  );
}