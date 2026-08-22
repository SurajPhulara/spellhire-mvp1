// frontend/src/app/(shared)/candidate/dashboard/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiAward,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiMapPin,
  FiPieChart,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUser,
  FiZap,
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { ApplicationService } from '@/lib/api/services/applications';
import { JobService } from '@/lib/api/services/jobs';
import { AppliedJobApplication, PipelineStage, JobPreview } from '@/types/job';
import { PaginationMeta } from '@/types';
import styles from './page.module.css';

type AppliedJobsStats = {
  total_applied: number;
  in_progress: number;
  offers: number;
  rejected: number;
};

type AppliedJobsResponse = {
  applications: AppliedJobApplication[];
  stats: AppliedJobsStats;
};

const DEFAULT_STATS: AppliedJobsStats = {
  total_applied: 0,
  in_progress: 0,
  offers: 0,
  rejected: 0,
};

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'applied', name: 'Applied', order: 1 },
  { id: 'screening', name: 'Screening', order: 2 },
  { id: 'interview', name: 'Interview', order: 3 },
  { id: 'offer', name: 'Offer', order: 4 },
  { id: 'rejected', name: 'Rejected', order: 5 },
];

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

function formatSalary(job?: JobPreview | null): string {
  if (!job) return 'Not disclosed';

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

function isRejected(application: AppliedJobApplication): boolean {
  return (
    application.status?.toUpperCase() === 'REJECTED' ||
    application.current_stage_id === 'rejected'
  );
}

function isOffer(application: AppliedJobApplication): boolean {
  return (
    application.status?.toUpperCase() === 'OFFERED' ||
    application.current_stage_id === 'offer'
  );
}

function getPipelineStages(application: AppliedJobApplication): PipelineStage[] {
  return application.pipeline_stages?.length > 0
    ? [...application.pipeline_stages].sort((a, b) => a.order - b.order)
    : DEFAULT_STAGES;
}

function getStageIndex(stages: PipelineStage[], currentStageId: string): number {
  const idx = stages.findIndex((s) => s.id === currentStageId);
  return idx >= 0 ? idx : 0;
}

function getApplicationTone(application: AppliedJobApplication): 'applied' | 'progress' | 'offer' | 'rejected' {
  if (isRejected(application)) return 'rejected';
  if (isOffer(application)) return 'offer';
  if (application.current_stage_id === 'applied') return 'applied';
  return 'progress';
}

function getCurrentStageLabel(application: AppliedJobApplication): string {
  const stages = getPipelineStages(application);
  const current = stages.find((s) => s.id === application.current_stage_id);

  if (isRejected(application)) return 'Rejected';
  if (current) return current.name;
  return 'Applied';
}

function getProgressPercent(application: AppliedJobApplication): number {
  if (isRejected(application)) return 100;
  if (isOffer(application)) return 100;

  const current = application.current_stage_id;

  if (current === 'applied') return 18;
  if (current === 'screening') return 38;
  if (current === 'interview') return 68;

  return 44;
}

function buildStagePreview(application: AppliedJobApplication): PipelineStage[] {
  const stages = getPipelineStages(application);
  const currentIndex = getStageIndex(stages, application.current_stage_id);

  if (application.current_stage_id === 'applied') {
    return stages.slice(0, 1);
  }

  if (application.current_stage_id === 'screening') {
    return stages.slice(Math.max(0, currentIndex - 1), Math.min(stages.length, currentIndex + 2));
  }

  return stages;
}

function getFullName(user: any): string {
  const first = user?.first_name?.trim() || '';
  const last = user?.last_name?.trim() || '';
  return `${first} ${last}`.trim() || user?.email || 'Candidate';
}

function getInitials(user: any): string {
  const first = user?.first_name?.[0] || '';
  const last = user?.last_name?.[0] || '';
  const raw = `${first}${last}`.trim();
  return raw ? raw.toUpperCase() : 'C';
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  tone = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtext?: string;
  tone?: 'blue' | 'violet' | 'emerald' | 'amber' | 'slate';
}) {
  return (
    <div className={`${styles.statCard} ${styles[`tone_${tone}`]}`}>
      <div className={styles.statTop}>
        <span className={styles.statIcon}>{icon}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      <strong className={styles.statValue}>{value}</strong>
      {subtext && <p className={styles.statSubtext}>{subtext}</p>}
    </div>
  );
}

function ApplicationCard({ application }: { application: AppliedJobApplication }) {
  const job = application.job;
  const tone = getApplicationTone(application);
  const currentLabel = getCurrentStageLabel(application);
  const stages = buildStagePreview(application);

  return (
    <Link href={`/jobs/${job.id}`} className={styles.applicationCard}>
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
          {tone === 'rejected' ? 'Rejected' : tone === 'offer' ? 'Offer' : currentLabel}
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
          <span className={styles.progressValue}>{Math.min(100, getProgressPercent(application))}%</span>
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
          const done =
            !isRejected(application) &&
            getStageIndex(getPipelineStages(application), application.current_stage_id) > stage.order - 1;

          return (
            <span
              key={stage.id}
              className={`${styles.stagePill} ${done ? styles.stageDone : ''} ${active ? styles.stageActive : ''}`}
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
          View job
        </span>
      </div>
    </Link>
  );
}

function InsightCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={styles.insightCard}>
      <div className={styles.insightIcon}>{icon}</div>
      <div>
        <p className={styles.insightTitle}>{title}</p>
        <strong className={styles.insightValue}>{value}</strong>
        <p className={styles.insightDesc}>{description}</p>
      </div>
    </div>
  );
}

export default function CandidateDashboardPage() {
  const { user } = useAuth();

  const [applications, setApplications] = useState<AppliedJobApplication[]>([]);
  const [applicationStats, setApplicationStats] = useState<AppliedJobsStats>(DEFAULT_STATS);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const profileReady = Boolean(user?.is_profile_complete);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [appliedRes, savedRes] = await Promise.all([
        JobService.getAppliedJobs(0),
        JobService.getSavedJobs(0),
      ]);

      if (appliedRes.success && appliedRes.data) {
        const payload = appliedRes.data as AppliedJobsResponse;
        setApplications(payload.applications ?? []);
        setApplicationStats(payload.stats ?? DEFAULT_STATS);
      } else {
        setApplications([]);
        setApplicationStats(DEFAULT_STATS);
      }

      if (savedRes.success) {
        setSavedJobsCount(savedRes.meta?.total ?? 0);
      } else {
        setSavedJobsCount(0);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const recentApplications = useMemo(() => applications.slice(0, 4), [applications]);

  const nextAction = useMemo(() => {
    if (applicationStats.offers > 0) {
      return {
        title: 'Review your offer',
        description: 'You have at least one active offer waiting.',
        href: '/candidate/jobs/applied',
      };
    }

    if (applicationStats.in_progress > 0) {
      return {
        title: 'Track your interviews',
        description: 'You still have applications in progress.',
        href: '/candidate/jobs/applied',
      };
    }

    if (applicationStats.total_applied === 0) {
      return {
        title: 'Start applying',
        description: 'Browse active jobs and save the ones you like.',
        href: '/jobs',
      };
    }

    return {
      title: 'Apply to more roles',
      description: 'You have finished the current queue. Keep momentum.',
      href: '/jobs',
    };
  }, [applicationStats]);

  const profileCompletionValue = profileReady ? 100 : 68;

  return (
    // <div className={styles.page}>
      <div className={styles.pageContent}>
        <div className={styles.headerBar}>
          <div>
            <p className={styles.kicker}>Candidate dashboard</p>
            <h1 className={styles.pageTitle}>
              Welcome back, {getFullName(user)}
            </h1>
            <p className={styles.pageSubtitle}>
              Your applications, saved roles, and profile status in one place.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.refreshBtn}
              onClick={refresh}
              type="button"
              aria-label="Refresh dashboard"
            >
              <FiRefreshCw size={14} className={refreshing ? styles.spin : ''} />
              Refresh
            </button>

            <Link href="/candidate/jobs/applied" className={styles.primaryAction}>
              Applied jobs
              <FiArrowRight size={14} />
            </Link>
          </div>
        </div>

        <section className={styles.heroGrid}>
          <div className={styles.heroCard}>
            <div className={styles.heroGlow} />

            <div className={styles.heroTop}>
              <div className={styles.avatar}>
                {user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt={getFullName(user)} />
                ) : (
                  <span>{getInitials(user)}</span>
                )}
              </div>

              <div className={styles.heroCopy}>
                <div className={styles.heroMetaRow}>
                  <span className={styles.heroChip}>
                    <FiEye size={12} />
                    {profileReady ? 'Profile ready' : 'Profile incomplete'}
                  </span>
                  <span className={styles.heroChip}>
                    <FiShield size={12} />
                    Private stats protected
                  </span>
                </div>

                <h2 className={styles.heroHeadline}>
                  Keep every application, saved job, and profile signal in one clean view.
                </h2>

                <p className={styles.heroText}>
                  Track how many roles are moving, where you stand in each pipeline, and what to do next.
                </p>

                <div className={styles.heroLinks}>
                  <Link href="/candidate/jobs/applied" className={styles.heroLink}>
                    Applied jobs
                  </Link>
                  <Link href="/jobs/saved" className={styles.heroLinkSecondary}>
                    Saved jobs
                  </Link>
                  <Link href="/candidate/profile" className={styles.heroLinkSecondary}>
                    Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <aside className={styles.heroSidebar}>
            <div className={styles.profileSummaryCard}>
              <div className={styles.profileSummaryTop}>
                <div>
                  <p className={styles.summaryLabel}>Profile readiness</p>
                  <h3 className={styles.summaryTitle}>
                    {profileReady ? 'Complete' : 'Needs attention'}
                  </h3>
                </div>

                <div className={styles.summaryPill}>
                  {profileCompletionValue}%
                </div>
              </div>

              <div className={styles.summaryTrack}>
                <div
                  className={styles.summaryFill}
                  style={{ width: `${profileCompletionValue}%` }}
                />
              </div>

              <p className={styles.summaryText}>
                {profileReady
                  ? 'Your profile is ready for recruiters to review.'
                  : 'Finish your profile to improve visibility and trust.'}
              </p>
            </div>

            <InsightCard
              title="Next step"
              value={nextAction.title}
              description={nextAction.description}
              icon={<FiZap size={14} />}
            />
          </aside>
        </section>

        <section className={styles.statsGrid}>
          <StatCard
            icon={<FiBriefcase size={14} />}
            label="Total applied"
            value={String(applicationStats.total_applied)}
            subtext="All applications across your account"
            tone="blue"
          />
          <StatCard
            icon={<FiTrendingUp size={14} />}
            label="In progress"
            value={String(applicationStats.in_progress)}
            subtext="Screening, interview, and active pipelines"
            tone="violet"
          />
          <StatCard
            icon={<FiAward size={14} />}
            label="Offers"
            value={String(applicationStats.offers)}
            subtext="Roles that moved to offer stage"
            tone="emerald"
          />
          <StatCard
            icon={<FiFileText size={14} />}
            label="Rejected"
            value={String(applicationStats.rejected)}
            subtext="Applications that are closed"
            tone="slate"
          />
          <StatCard
            icon={<FiBookmark size={14} />}
            label="Saved jobs"
            value={String(savedJobsCount)}
            subtext="Roles you bookmarked for later"
            tone="amber"
          />
          <StatCard
            icon={<FiUser size={14} />}
            label="Profile status"
            value={profileReady ? 'Complete' : 'Incomplete'}
            subtext={profileReady ? 'Ready for recruiter review' : 'Needs more details'}
            tone={profileReady ? 'emerald' : 'blue'}
          />
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.mainCol}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionKicker}>Recent applications</p>
                  <h3 className={styles.sectionTitle}>What is happening right now</h3>
                </div>
                <Link href="/candidate/jobs/applied" className={styles.sectionLink}>
                  View all
                  <FiArrowRight size={13} />
                </Link>
              </div>

              {loading && (
                <div className={styles.listSkeleton}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className={styles.skeletonCard} />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FiBriefcase size={18} />
                  </div>
                  <h4>{error}</h4>
                  <p>Try refreshing the dashboard again.</p>
                </div>
              )}

              {!loading && !error && recentApplications.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FiBriefcase size={18} />
                  </div>
                  <h4>No applications yet</h4>
                  <p>Start browsing jobs and your dashboard will show the pipeline here.</p>
                  <Link href="/jobs" className={styles.emptyAction}>
                    Browse jobs
                  </Link>
                </div>
              )}

              {!loading && !error && recentApplications.length > 0 && (
                <div className={styles.applicationList}>
                  {recentApplications.map((application) => (
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
                  <p className={styles.sectionKicker}>Quick links</p>
                  <h3 className={styles.sectionTitle}>Move faster</h3>
                </div>
              </div>

              <div className={styles.quickLinks}>
                <Link href="/jobs" className={styles.quickLink}>
                  <div>
                    <strong>Browse jobs</strong>
                    <span>Find active roles</span>
                  </div>
                  <FiArrowRight size={14} />
                </Link>

                <Link href="/jobs/saved" className={styles.quickLink}>
                  <div>
                    <strong>Saved jobs</strong>
                    <span>Open your shortlist</span>
                  </div>
                  <FiBookmark size={14} />
                </Link>

                <Link href="/candidate/jobs/applied" className={styles.quickLink}>
                  <div>
                    <strong>Applications</strong>
                    <span>See pipeline details</span>
                  </div>
                  <FiPieChart size={14} />
                </Link>

                <Link href="/candidate/profile" className={styles.quickLink}>
                  <div>
                    <strong>Edit profile</strong>
                    <span>Improve your visibility</span>
                  </div>
                  <FiUser size={14} />
                </Link>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionKicker}>Status snapshot</p>
                  <h3 className={styles.sectionTitle}>What recruiters can see</h3>
                </div>
              </div>

              <div className={styles.snapshotList}>
                <div className={styles.snapshotRow}>
                  <span>Profile picture</span>
                  <strong>{user?.profile_picture_url ? 'Added' : 'Missing'}</strong>
                </div>
                <div className={styles.snapshotRow}>
                  <span>Name</span>
                  <strong>{user?.first_name || user?.last_name ? 'Added' : 'Missing'}</strong>
                </div>
                <div className={styles.snapshotRow}>
                  <span>Email</span>
                  <strong>{user?.email ? 'Verified on account' : 'Missing'}</strong>
                </div>
                <div className={styles.snapshotRow}>
                  <span>Profile state</span>
                  <strong>{profileReady ? 'Complete' : 'Incomplete'}</strong>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    // </div> 
  );
}