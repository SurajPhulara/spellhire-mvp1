'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiBriefcase, FiMapPin, FiDollarSign, FiClock, FiUsers,
  FiCalendar, FiEye, FiArrowLeft, FiCheck, FiStar,
  FiBookmark, FiShare2, FiAlertCircle, FiZap,
  FiCheckCircle,
} from 'react-icons/fi';
import { JobService } from '@/lib/api/services/jobs';
import styles from './page.module.css';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobDetail {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  vacancies: number;
  job_type: string;
  work_mode: string;
  experience_level: string;
  required_skills: string[];
  preferred_skills: string[];
  minimum_years_experience: number;
  location: { city?: string; state?: string; country?: string };
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  salary_period: string;
  category: string;
  department: string;
  benefits: string[];
  application_deadline: string | null;
  application_url: string;
  status: string;
  is_featured: boolean;
  view_count: number;
  application_count: number;
  created_at: string;
  published_at: string | null;
  organization?: {
    id: string;
    name: string;
    logo_url?: string;
    industry?: string;
    website?: string;
  };
  // injected by our updated backend
  has_applied: boolean;
  is_saved: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(job: JobDetail): string {
  const { salary_min, salary_max, salary_currency, salary_period } = job;
  const cur = salary_currency || 'INR';
  const per = salary_period || 'yearly';

  const fmt = (n: number) =>
    cur === 'INR'
      ? `₹${(n / 100000).toFixed(1)}L`
      : `${cur} ${n.toLocaleString()}`;

  if (salary_min && salary_max) return `${fmt(salary_min)} – ${fmt(salary_max)} / ${per}`;
  if (salary_min) return `${fmt(salary_min)}+ / ${per}`;
  if (salary_max) return `Up to ${fmt(salary_max)} / ${per}`;
  return 'Not disclosed';
}

function formatLocation(loc: JobDetail['location']): string {
  if (!loc) return 'Location not specified';
  return [loc.city, loc.state, loc.country].filter(Boolean).join(', ') || 'Location not specified';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

const BADGE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract',
  INTERNSHIP: 'Internship', TEMPORARY: 'Temporary',
  REMOTE: 'Remote', ONSITE: 'On-site', HYBRID: 'Hybrid',
  ENTRY: 'Entry level', MID: 'Mid level', SENIOR: 'Senior',
  LEAD: 'Lead', EXECUTIVE: 'Executive',
};
const label = (v: string) => BADGE_LABELS[v] ?? v.replace(/_/g, ' ').toLowerCase();

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const { job_id } = useParams<{ job_id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyFlash, setApplyFlash] = useState(false);


  const { user } = useAuth();

  useEffect(() => {
    if (!job_id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await JobService.getJobPublic(job_id);
        if (res.success && res.data) {
          const jobData = res.data as unknown as JobDetail;
          setJob(jobData);
          setSaved(jobData.is_saved);   // ✅ IMPORTANT
        } else {
          setError('Job not found.');
        }
      } catch {
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [job_id]);

  const handleApply = async () => {
    if (!job || applying || job.has_applied) return;

    if (!user) {
      router.push(`/login?redirect=/jobs/${job.id}`);
      return;
    }


    setApplying(true);
    setApplyFlash(false);

    try {
      const res = await JobService.applyToJob(job.id);

      if (res.success) {
        setJob(prev =>
          prev
            ? {
              ...prev,
              has_applied: true,
              application_count: (prev.application_count || 0) + 1,
            }
            : prev
        );

        setApplyFlash(true);
        window.setTimeout(() => setApplyFlash(false), 700);
      }
    } catch (err: any) {
      console.error('Apply failed:', err);

      const status = err?.response?.status;
      if (status === 401) {
        router.push(`/login?redirect=/jobs/${job.id}`);
        return;
      }
      if (status === 409) {
        setJob(prev => (prev ? { ...prev, has_applied: true } : prev));
        setApplyFlash(true);
        window.setTimeout(() => setApplyFlash(false), 700);
        return;
      }

      alert('Failed to apply. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.spinner} />
      <p>Loading job details…</p>
    </div>
  );

  const handleSave = async () => {
    if (!job) return;

    if (!user) {
      router.push(`/login?redirect=/jobs/${job.id}`);
      return;
    }

    try {
      if (saved) {
        await JobService.unsaveJob(job.id);
        setSaved(false);
      } else {
        await JobService.saveJob(job.id);
        setSaved(true);
      }
    } catch (err: any) {
      console.error("Save failed", err);
    }
  };

  // ── Error / Not found ──────────────────────────────────────────────────────
  if (error || !job) return (
    <div className={styles.errorScreen}>
      <FiAlertCircle size={40} />
      <h2>{error ?? 'Job not found'}</h2>
      <Link href="/jobs" className={styles.backLink}>← Back to jobs</Link>
    </div>
  );

  const deadline = job.application_deadline;
  const deadlineDays = deadline ? daysUntil(deadline) : null;
  const isExpired = deadlineDays !== null && deadlineDays < 0;
  const hasSalary = job.salary_min || job.salary_max;

  return (
    <div className={styles.page}>

      {/* ── Back nav ───────────────────────────────── */}
      <div className={styles.topNav}>
        <Link href="/jobs" className={styles.backBtn}>
          <FiArrowLeft size={15} /> Back to Jobs
        </Link>
        <div className={styles.topActions}>
          <button
            className={`${styles.iconBtn} ${saved ? styles.iconBtnActive : ''}`}
            onClick={handleSave}
            aria-label="Save job"
          >
            <FiBookmark size={16} />
            {saved ? 'Saved' : 'Save'}
          </button>
          <button className={styles.iconBtn} onClick={handleShare} aria-label="Share">
            <FiShare2 size={16} />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {/* ── Hero card ──────────────────────────────── */}
      <div className={`${styles.heroCard} ${job.is_featured ? styles.featured : ''}`}>
        {job.is_featured && (
          <div className={styles.featuredBadge}>
            <FiStar size={11} /> Featured
          </div>
        )}

        <div className={styles.heroTop}>
          {/* Org logo / placeholder */}
          <div className={styles.orgLogo}>
            {job.organization?.logo_url
              ? <img src={job.organization.logo_url} alt={job.organization.name} />
              : <FiBriefcase size={26} />
            }
          </div>

          <div className={styles.heroMeta}>
            <h1 className={styles.jobTitle}>{job.title}</h1>
            <div className={styles.orgRow}>
              {job.organization?.name && (
                <span className={styles.orgName}>{job.organization.name}</span>
              )}
              {job.organization?.industry && (
                <span className={styles.orgIndustry}>{job.organization.industry}</span>
              )}
            </div>

            {/* Pill badges */}
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles.badgeType}`}>
                <FiBriefcase size={11} /> {label(job.job_type)}
              </span>
              <span className={`${styles.badge} ${styles.badgeMode}`}>
                <FiZap size={11} /> {label(job.work_mode)}
              </span>
              <span className={`${styles.badge} ${styles.badgeExp}`}>
                {label(job.experience_level)}
              </span>
              {job.category && (
                <span className={`${styles.badge} ${styles.badgeCat}`}>{job.category}</span>
              )}
            </div>
          </div>

          {/* Apply CTA — desktop position */}
          <div className={styles.heroCta}>
            <ApplyButton
              job={job}
              onApply={handleApply}
              applying={applying}
              flash={applyFlash}
            />
            {isExpired && (
              <p className={styles.expiredNote}>Applications closed</p>
            )}
          </div>
        </div>

        {/* Quick-info strip */}
        <div className={styles.infoStrip}>
          <div className={styles.infoItem}>
            <FiMapPin size={14} />
            <span>{formatLocation(job.location)}</span>
          </div>
          {hasSalary && (
            <div className={styles.infoItem}>
              <FiDollarSign size={14} />
              <span>{formatSalary(job)}</span>
            </div>
          )}
          <div className={styles.infoItem}>
            <FiUsers size={14} />
            <span>{job.vacancies} vacanc{job.vacancies === 1 ? 'y' : 'ies'}</span>
          </div>
          <div className={styles.infoItem}>
            <FiClock size={14} />
            <span>Posted {timeAgo(job.published_at ?? job.created_at)}</span>
          </div>
          <div className={styles.infoItem}>
            <FiEye size={14} />
            <span>{job.view_count.toLocaleString()} views</span>
          </div>
          {deadline && !isExpired && deadlineDays !== null && (
            <div className={`${styles.infoItem} ${deadlineDays <= 7 ? styles.urgent : ''}`}>
              <FiCalendar size={14} />
              <span>
                {deadlineDays === 0 ? 'Closes today' : `${deadlineDays}d left`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────── */}
      <div className={styles.body}>

        {/* Left — content */}
        <div className={styles.content}>

          {/* Description */}
          <Section title="About this role" icon="📋">
            <div className={styles.prose}
              dangerouslySetInnerHTML={{ __html: job.description?.replace(/\n/g, '<br/>') ?? '' }}
            />
          </Section>

          {/* Responsibilities */}
          {job.responsibilities && (
            <Section title="Responsibilities" icon="🎯">
              <div className={styles.prose}
                dangerouslySetInnerHTML={{ __html: job.responsibilities.replace(/\n/g, '<br/>') }}
              />
            </Section>
          )}

          {/* Requirements */}
          {job.requirements && (
            <Section title="Requirements" icon="✅">
              <div className={styles.prose}
                dangerouslySetInnerHTML={{ __html: job.requirements.replace(/\n/g, '<br/>') }}
              />
            </Section>
          )}

          {/* Skills */}
          {(job.required_skills?.length > 0 || job.preferred_skills?.length > 0) && (
            <Section title="Skills" icon="⚡">
              {job.required_skills?.length > 0 && (
                <div className={styles.skillGroup}>
                  <p className={styles.skillLabel}>Required</p>
                  <div className={styles.skillChips}>
                    {job.required_skills.map(s => (
                      <span key={s} className={`${styles.chip} ${styles.chipRequired}`}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {job.preferred_skills?.length > 0 && (
                <div className={styles.skillGroup}>
                  <p className={styles.skillLabel}>Preferred</p>
                  <div className={styles.skillChips}>
                    {job.preferred_skills.map(s => (
                      <span key={s} className={`${styles.chip} ${styles.chipPreferred}`}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Benefits */}
          {job.benefits?.length > 0 && (
            <Section title="Benefits & Perks" icon="🎁">
              <div className={styles.benefitGrid}>
                {job.benefits.map(b => (
                  <div key={b} className={styles.benefitItem}>
                    <FiCheckCircle size={13} className={styles.benefitCheck} />
                    {b}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right — sidebar */}
        <aside className={styles.sidebar}>

          {/* Sticky apply card */}
          <div className={styles.sideApplyCard}>
            <ApplyButton job={job} onApply={handleApply} full />
            {isExpired && <p className={styles.expiredNote}>Applications closed</p>}
            {deadline && !isExpired && deadlineDays !== null && (
              <p className={`${styles.deadlineNote} ${deadlineDays <= 7 ? styles.urgent : ''}`}>
                <FiCalendar size={12} />
                Deadline: {new Date(deadline).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
                {deadlineDays <= 7 && ` · ${deadlineDays}d left`}
              </p>
            )}
          </div>

          {/* Job details card */}
          <div className={styles.detailCard}>
            <h3 className={styles.detailCardTitle}>Job Details</h3>
            <dl className={styles.detailList}>
              <DetailRow label="Department" value={job.department} />
              <DetailRow label="Category" value={job.category} />
              <DetailRow label="Job Type" value={label(job.job_type)} />
              <DetailRow label="Work Mode" value={label(job.work_mode)} />
              <DetailRow label="Experience" value={label(job.experience_level)} />
              {job.minimum_years_experience > 0 && (
                <DetailRow label="Min. Experience"
                  value={`${job.minimum_years_experience} year${job.minimum_years_experience > 1 ? 's' : ''}`}
                />
              )}
              <DetailRow label="Vacancies" value={String(job.vacancies)} />
              {hasSalary && (
                <DetailRow label="Salary" value={formatSalary(job)} />
              )}
              {job.application_count > 0 && (
                <DetailRow label="Applicants" value={String(job.application_count)} />
              )}
            </dl>
          </div>

          {/* Company card */}
          {job.organization && (
            <div className={styles.detailCard}>
              <h3 className={styles.detailCardTitle}>About the Company</h3>
              <div className={styles.companyInfo}>
                <div className={styles.companyLogo}>
                  {job.organization.logo_url
                    ? <img src={job.organization.logo_url} alt={job.organization.name} />
                    : <FiBriefcase size={20} />
                  }
                </div>
                <div>
                  <p className={styles.companyName}>{job.organization.name}</p>
                  {job.organization.industry && (
                    <p className={styles.companyIndustry}>{job.organization.industry}</p>
                  )}
                </div>
              </div>
              {job.organization.website && (
                <a
                  href={job.organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.websiteLink}
                >
                  Visit Website →
                </a>
              )}
            </div>
          )}

        </aside>
      </div>

      {/* ── Mobile sticky apply bar ─────────────────── */}
      <div className={styles.mobileBar}>
        <div className={styles.mobileBarLeft}>
          <p className={styles.mobileJobTitle}>{job.title}</p>
          {hasSalary && <p className={styles.mobileSalary}>{formatSalary(job)}</p>}
        </div>
        <ApplyButton
          job={job}
          onApply={handleApply}
          applying={applying}
          flash={applyFlash}
        />
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title, icon, children,
}: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={styles.detailValue}>{value}</dd>
    </div>
  );
}

function ApplyButton({
  job,
  onApply,
  full = false,
  applying = false,
  flash = false,
}: {
  job: JobDetail;
  onApply: () => void;
  full?: boolean;
  applying?: boolean;
  flash?: boolean;
}) {
  const deadline = job.application_deadline;
  const isExpired = deadline ? daysUntil(deadline) < 0 : false;

  if (job.has_applied) {
    return (
      <button
        className={`${styles.applyBtn} ${styles.applyBtnApplied} ${flash ? styles.applyBtnAppliedFlash : ''} ${full ? styles.applyBtnFull : ''}`}
        disabled
      >
        <FiCheck size={15} /> Applied
      </button>
    );
  }

  if (isExpired) {
    return (
      <button
        className={`${styles.applyBtn} ${styles.applyBtnDisabled} ${full ? styles.applyBtnFull : ''}`}
        disabled
      >
        Closed
      </button>
    );
  }

  return (
    <button
      className={`${styles.applyBtn} ${styles.applyBtnPrimary} ${applying ? styles.applyBtnApplying : ''} ${full ? styles.applyBtnFull : ''}`}
      onClick={onApply}
      disabled={applying}
    >
      {applying ? (
        <>
          <span className={styles.applySpinner} />
          Applying...
        </>
      ) : (
        'Apply Now'
      )}
    </button>
  );
}