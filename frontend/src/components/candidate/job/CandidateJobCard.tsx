'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiBookmark, FiMapPin, FiClock, FiZap,
  FiGlobe, FiBriefcase, FiStar, FiUsers, FiDollarSign
} from 'react-icons/fi';
import { Job, JobPublic } from '@/types/job';
import JobService from '@/lib/api/services/jobs';
import styles from './CandidateJobCard.module.css';

interface CandidateJobCardProps {
  job: JobPublic;
  onSave?: (jobId: string, nextSaved: boolean) => void;
  isSaved?: boolean;
  index?: number;
}

const jobTypeLabel: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

const workModeConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  REMOTE: { label: 'Remote', icon: <FiGlobe />, cls: 'remote' },
  ON_SITE: { label: 'On-site', icon: <FiMapPin />, cls: 'onsite' },
  HYBRID: { label: 'Hybrid', icon: <FiZap />, cls: 'hybrid' },
};

const expLabel: Record<string, string> = {
  ENTRY: 'Entry',
  JUNIOR: 'Junior',
  MID: 'Mid-level',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
};

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const sym =
    job.salary_currency === 'USD' ? '$'
      : job.salary_currency === 'EUR' ? '€'
        : job.salary_currency === 'GBP' ? '£'
          : (job.salary_currency ?? '');
  const fmt = (n: number) =>
    n >= 100000 ? `${sym}${(n / 100000).toFixed(1)}L`
      : n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}k`
        : `${sym}${n}`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  if (job.salary_min) return `From ${fmt(job.salary_min)}`;
  return `Up to ${fmt(job.salary_max!)}`;
}

function getDaysAgo(d: string | Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

export default function CandidateJobCard({
  job,
  onSave,
  isSaved = false,
  index = 0
}: CandidateJobCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const hue = hueFromId(job.id ?? job.title);
  const salary = formatSalary(job);
  const wm = workModeConfig[job.work_mode] ?? workModeConfig.REMOTE;
  const skills = job.required_skills?.slice(0, 5) ?? [];
  const extra = (job.required_skills?.length ?? 0) - 5;

  const handleClick = () => {
    router.push(`/jobs/${job.id}`);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);

    try {
      const nextSaved = !isSaved;

      if (isSaved) {
        await JobService.unsaveJob(job.id);
      } else {
        await JobService.saveJob(job.id);
      }

      onSave?.(job.id, nextSaved);
    } catch (err) {
      console.error('Save job failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      className={styles.card}
      onClick={handleClick}
      style={{ '--hue': hue, animationDelay: `${index * 55}ms` } as React.CSSProperties}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label={`${job.title} – view details`}
    >
      <div className={styles.accentBar} />

      <div className={styles.logoCol}>
        <div className={styles.logo}>
          {job.logo_url ? (
            <img
              src={job.logo_url}
              alt={`${job.organization_name ?? job.department ?? job.title} logo`}
              className={styles.logoImg}
            />
          ) : (job.department?.[0] ?? job.title[0]).toUpperCase()}
          <span className={styles.logoLetter}>
            {(job.organization_name?.[0] ?? job.department?.[0] ?? job.title?.[0] ?? 'J').toUpperCase()}
          </span>
        </div>
        {job.is_featured && (
          <span className={styles.featuredPip} title="Featured">
            <FiStar />
          </span>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <div>
            <h3 className={styles.title}>{job.title}</h3>
            <p className={styles.dept}>{job.department ?? job.category ?? 'General'}</p>
          </div>

          <div className={styles.titleRowRight}>
            {salary && (
              <span className={styles.salaryBadge}>
                <FiDollarSign /> {salary}
              </span>
            )}
            <button
              className={`${styles.saveBtn} ${isSaved ? styles.saveBtnOn : ''} ${loading ? styles.savePop : ''}`}
              onClick={handleSave}
              disabled={loading}
              aria-label={isSaved ? 'Unsave' : 'Save job'}
              aria-busy={loading}
            >
              <FiBookmark />
            </button>
          </div>
        </div>

        <div className={styles.chipsRow}>
          <span className={`${styles.chip} ${styles[`chip_${wm.cls}`]}`}>
            {wm.icon} {wm.label}
          </span>
          <span className={`${styles.chip} ${styles.chip_type}`}>
            <FiBriefcase /> {jobTypeLabel[job.job_type] ?? job.job_type}
          </span>
          <span className={`${styles.chip} ${styles.chip_exp}`}>
            {expLabel[job.experience_level] ?? job.experience_level}
          </span>
          {job.location?.city && (
            <span className={`${styles.chip} ${styles.chip_loc}`}>
              <FiMapPin /> {job.location.city}{job.location.country ? `, ${job.location.country}` : ''}
            </span>
          )}
        </div>

        {skills.length > 0 && (
          <div className={styles.skillsRow}>
            {skills.map(s => (
              <span key={s} className={styles.skill}>{s}</span>
            ))}
            {extra > 0 && (
              <span className={`${styles.skill} ${styles.skillExtra}`}>+{extra}</span>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.footerItem}>
            <FiUsers /> {job.application_count ?? 0} applicants
          </span>
          <span className={styles.footerSep} />
          <span className={styles.footerItem}>
            <FiClock /> {getDaysAgo(job.created_at)}
          </span>
          <span className={styles.cta}>View details →</span>
        </div>
      </div>
    </article>
  );
}