'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiBriefcase,
  FiClock,
  FiAlertCircle,
  FiMapPin,
  FiGlobe,
  FiZap,
} from 'react-icons/fi';
import { ApplicationService } from '@/lib/api/services/applications';
import Pagination from '@/components/ui/Pagination';
import { AppliedJobApplication, PipelineStage } from '@/types/job';
import { PaginationMeta } from '@/types';
import styles from './page.module.css';
import JobService from '@/lib/api/services/jobs';
import { useRouter } from 'next/navigation';

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'applied', name: 'Applied', order: 1 },
  { id: 'screening', name: 'Screening', order: 2 },
  { id: 'interview', name: 'Interview', order: 3 },
  { id: 'offer', name: 'Offer', order: 4 },
];

function formatDate(input: string): string {
  return new Date(input).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(input: string): string {
  const diff = Date.now() - new Date(input).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function getStages(application: AppliedJobApplication): PipelineStage[] {
  return application.pipeline_stages?.length > 0
    ? application.pipeline_stages
    : DEFAULT_STAGES;
}

function isRejected(application: AppliedJobApplication): boolean {
  return (
    application.status?.toUpperCase() === 'REJECTED' ||
    application.current_stage_id === 'rejected'
  );
}

function getStageIndex(stages: PipelineStage[], currentStageId: string): number {
  const idx = stages.findIndex(s => s.id === currentStageId);
  return idx >= 0 ? idx : 0;
}

function getStatusLabel(application: AppliedJobApplication, stages: PipelineStage[]): string {
  if (isRejected(application)) return 'Not selected';
  const idx = getStageIndex(stages, application.current_stage_id);
  const stage = stages[idx];
  if (application.current_stage_id === 'offer') return 'Offer received';
  if (application.current_stage_id === 'applied') return 'Under review';
  return stage?.name ?? 'In progress';
}

function getStatusClass(application: AppliedJobApplication): string {
  if (isRejected(application)) return styles.badgeRejected;
  if (application.current_stage_id === 'offer') return styles.badgeOffer;
  if (application.current_stage_id === 'applied') return styles.badgeWaiting;
  return styles.badgeActive;
}

function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

const workModeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  REMOTE: { label: 'Remote', icon: <FiGlobe size={11} /> },
  ON_SITE: { label: 'On-site', icon: <FiMapPin size={11} /> },
  HYBRID: { label: 'Hybrid', icon: <FiZap size={11} /> },
};

// ── Applied Job Card ─────────────────────────────────────────────────────────

function AppliedJobCard({ application }: { application: AppliedJobApplication }) {
  const { job } = application;
  const stages = getStages(application);
  const rejected = isRejected(application);
  const currentIndex = getStageIndex(stages, application.current_stage_id);
  const hue = hueFromId(job.id ?? job.title);
  const wm = workModeConfig[job.work_mode] ?? workModeConfig.REMOTE;
  const skills = job.required_skills?.slice(0, 4) ?? [];
  const statusLabel = getStatusLabel(application, stages);
  const statusClass = getStatusClass(application);

  // filter out 'rejected' from the pipeline display — it's shown via badge
  const displayStages = stages.filter(s => s.id !== 'rejected');

  const router = useRouter();

  return (
    <article
      className={styles.card}
      style={{ '--hue': hue } as React.CSSProperties}
      onClick={() => {
        router.push(`/jobs/${job.id}`);
      }}
    >
      <div className={styles.accentBar} />
      
      {/* ── Top half: job info ── */}
      <div className={styles.cardTop}>
        <div className={styles.logoWrap}>
          {job.logo_url ? (
            <img src={job.logo_url} alt="" className={styles.logoImg} />
          ) : (
            <span className={styles.logoLetter}>
              {(job.organization_name?.[0] ?? job.title[0]).toUpperCase()}
            </span>
          )}
        </div>

        <div className={styles.jobInfo}>
          <div className={styles.jobTitleRow}>
            <h3 className={styles.jobTitle}>{job.title}</h3>
            <span className={`${styles.badge} ${statusClass}`}>{statusLabel}</span>
          </div>

          <p className={styles.jobSub}>
            {job.organization_name && (
              <span className={styles.orgName}>{job.organization_name}</span>
            )}
            {job.organization_name && <span className={styles.dot} />}
            <span className={styles.wmChip}>
              {wm.icon}
              {wm.label}
            </span>
            {job.location?.city && (
              <>
                <span className={styles.dot} />
                <span>{job.location.city}</span>
              </>
            )}
          </p>

          {skills.length > 0 && (
            <div className={styles.skills}>
              {skills.map(s => (
                <span key={s} className={styles.skill}>{s}</span>
              ))}
              {(job.required_skills?.length ?? 0) > 4 && (
                <span className={`${styles.skill} ${styles.skillExtra}`}>
                  +{(job.required_skills?.length ?? 0) - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom half: stage tracker ── */}
      <div className={styles.cardBottom}>
        <div className={styles.stageTrack}>
          {displayStages.map((stage, idx) => {
            const done = !rejected && idx < currentIndex;
            const active = !rejected && stage.id === application.current_stage_id;
            const bad = rejected && idx <= currentIndex;

            return (
              <React.Fragment key={stage.id}>
                {idx > 0 && (
                  <div
                    className={`${styles.connector} ${(done || active) && !rejected ? styles.connectorFilled : ''} ${bad ? styles.connectorRejected : ''}`}
                  />
                )}
                <div className={styles.stageItem}>
                  <div
                    className={`${styles.stageDot} ${done ? styles.dotDone : ''} ${active ? styles.dotActive : ''} ${bad ? styles.dotRejected : ''}`}
                  >
                    {done && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {active && !rejected && <span className={styles.activePip} />}
                  </div>
                  <span
                    className={`${styles.stageLabel} ${done || active ? styles.stageLabelActive : ''} ${bad ? styles.stageLabelRejected : ''}`}
                  >
                    {stage.name}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.footerMeta}>
            <FiClock size={11} />
            Applied {formatDate(application.applied_at)}
            {' · '}
            Updated {timeAgo(application.stage_updated_at)}
          </span>
          <Link href={`/jobs/${job.id}`} className={styles.viewLink}>
            View job →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<AppliedJobApplication[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0, limit: 10, offset: 0, has_next: false, has_prev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppliedJobs = async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await JobService.getAppliedJobs(offset);
      if (res.success && res.data) {
        const payload = res.data as unknown as { applications: AppliedJobApplication[] };
        setApplications(payload.applications ?? []);
        setMeta(res.meta as unknown as PaginationMeta);
      } else {
        setApplications([]);
      }
    } catch {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppliedJobs(0); }, []);

  const stats = useMemo(() => {
    const total = meta.total;
    const inProgress = applications.filter(
      a => a.current_stage_id !== 'applied' && a.current_stage_id !== 'offer' && !isRejected(a)
    ).length;
    const offered = applications.filter(a => a.current_stage_id === 'offer').length;
    const rejected = applications.filter(a => isRejected(a)).length;
    return { total, inProgress, offered, rejected };
  }, [applications, meta.total]);

  const handlePageChange = (newOffset: number) => {
    fetchAppliedJobs(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FiBriefcase size={18} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>Applied Jobs</h1>
            <p className={styles.headerSub}>Track every application and your current stage.</p>
          </div>
        </div>
        <Link href="/jobs" className={styles.backBtn}>
          <FiArrowLeft size={13} />
          Back to Jobs
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total applied', value: stats.total },
          { label: 'In progress', value: stats.inProgress },
          { label: 'Offers', value: stats.offered },
          { label: 'Rejected', value: stats.rejected },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statLabel}>{s.label}</span>
            <strong className={styles.statValue}>{s.value}</strong>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className={styles.stateBox}>
          <FiAlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && applications.length === 0 && (
        <div className={styles.stateBox}>
          <div className={styles.emptyIcon}><FiBriefcase size={22} /></div>
          <h3>No applications yet</h3>
          <p>Jobs you apply to will appear here with live status tracking.</p>
          <Link href="/jobs" className={styles.primaryBtn}>Browse jobs</Link>
        </div>
      )}

      {/* List */}
      {!loading && !error && applications.length > 0 && (
        <>
          <div className={styles.list}>
            {applications.map(app => (
              <AppliedJobCard key={app.application_id} application={app} />
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

    </div>
  );
}