'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiBookmark, FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiUsers, FiCalendar, FiCheckCircle, FiStar, FiGlobe, FiAward, FiZap } from 'react-icons/fi';
import { Job, ApplicationStatus } from '@/types/job';
import { WorkMode, ExperienceLevel, JobType } from '@/types/base';
import styles from './JobModal.module.css';

interface JobModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  isSaved?: boolean;
  isApplied?: boolean;
}

const workModeLabel: Record<WorkMode, string> = {
  [WorkMode.REMOTE]: 'Remote',
  [WorkMode.ON_SITE]: 'On-site',
  [WorkMode.HYBRID]: 'Hybrid',
};

const workModeIcon: Record<WorkMode, React.ReactNode> = {
  [WorkMode.REMOTE]: <FiGlobe />,
  [WorkMode.ON_SITE]: <FiMapPin />,
  [WorkMode.HYBRID]: <FiZap />,
};

const experienceLevelLabel: Record<ExperienceLevel, string> = {
  [ExperienceLevel.ENTRY]: 'Entry Level',
  [ExperienceLevel.JUNIOR]: 'Junior',
  [ExperienceLevel.MID]: 'Mid-Level',
  [ExperienceLevel.SENIOR]: 'Senior',
  [ExperienceLevel.LEAD]: 'Lead',
  [ExperienceLevel.EXECUTIVE]: 'Executive',
};

const jobTypeLabel: Record<JobType, string> = {
  [JobType.FULL_TIME]: 'Full-time',
  [JobType.PART_TIME]: 'Part-time',
  [JobType.CONTRACT]: 'Contract',
  [JobType.INTERNSHIP]: 'Internship',
  [JobType.FREELANCE]: 'Freelance',
};

function formatSalary(min?: number, max?: number, currency?: string, period?: string): string | null {
  if (!min && !max) return null;
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : (currency ?? '');
  const fmt = (n: number) => n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}k` : `${sym}${n}`;
  const range = min && max ? `${fmt(min)} – ${fmt(max)}` : min ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
  return `${range}${period ? ` / ${period}` : ''}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Open';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobModal({ job, isOpen, onClose, onSave, onApply, isSaved = false, isApplied = false }: JobModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(isSaved);
  const [applied, setApplied] = useState(isApplied);
  const [applyLoading, setApplyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'benefits'>('overview');

  useEffect(() => { setSaved(isSaved); }, [isSaved]);
  useEffect(() => { setApplied(isApplied); }, [isApplied]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab('overview');
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSave = () => {
    setSaved(s => !s);
    if (job) onSave?.(job.id);
  };

  const handleApply = async () => {
    if (applied || !job) return;
    setApplyLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setApplied(true);
    setApplyLoading(false);
    onApply?.(job.id);
  };

  if (!isOpen || !job) return null;

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period);

  // Generate a consistent gradient seed from job id
  const hue = (job.id?.charCodeAt(0) ?? 0) * 37 % 360;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Job details: ${job.title}`}
    >
      <div className={`${styles.modal} ${isOpen ? styles.modalOpen : ''}`}>

        {/* ── Header ── */}
        <div className={styles.header} style={{ '--job-hue': hue } as React.CSSProperties}>
          <div className={styles.headerBg} />

          <div className={styles.headerContent}>
            <div className={styles.companyLogo}>
              <span>{job.department?.[0] ?? job.title[0]}</span>
            </div>

            <div className={styles.headerMeta}>
              <div className={styles.headerTop}>
                <div>
                  <h2 className={styles.jobTitle}>{job.title}</h2>
                  <p className={styles.department}>{job.department} · {job.category}</p>
                </div>
                <div className={styles.headerActions}>
                  <button
                    className={`${styles.saveBtn} ${saved ? styles.saveBtnActive : ''}`}
                    onClick={handleSave}
                    aria-label={saved ? 'Unsave job' : 'Save job'}
                    title={saved ? 'Saved' : 'Save job'}
                  >
                    <FiBookmark />
                    <span>{saved ? 'Saved' : 'Save'}</span>
                  </button>
                  <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                    <FiX />
                  </button>
                </div>
              </div>

              <div className={styles.chips}>
                <span className={`${styles.chip} ${styles.chipLocation}`}>
                  <FiMapPin /> {job.location.city}, {job.location.country}
                </span>
                <span className={`${styles.chip} ${styles.chipMode}`}>
                  {workModeIcon[job.work_mode]} {workModeLabel[job.work_mode]}
                </span>
                <span className={`${styles.chip} ${styles.chipType}`}>
                  <FiBriefcase /> {jobTypeLabel[job.job_type]}
                </span>
                <span className={`${styles.chip} ${styles.chipLevel}`}>
                  <FiAward /> {experienceLevelLabel[job.experience_level]}
                </span>
                {job.is_featured && (
                  <span className={`${styles.chip} ${styles.chipFeatured}`}>
                    <FiStar /> Featured
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className={styles.statsBar}>
            {salary && (
              <div className={styles.stat}>
                <FiDollarSign className={styles.statIcon} />
                <div>
                  <span className={styles.statLabel}>Salary</span>
                  <span className={styles.statValue}>{salary}</span>
                </div>
              </div>
            )}
            <div className={styles.stat}>
              <FiUsers className={styles.statIcon} />
              <div>
                <span className={styles.statLabel}>Openings</span>
                <span className={styles.statValue}>{job.vacancies} {job.vacancies === 1 ? 'position' : 'positions'}</span>
              </div>
            </div>
            <div className={styles.stat}>
              <FiCalendar className={styles.statIcon} />
              <div>
                <span className={styles.statLabel}>Deadline</span>
                <span className={styles.statValue}>{formatDate(job.application_deadline)}</span>
              </div>
            </div>
            <div className={styles.stat}>
              <FiClock className={styles.statIcon} />
              <div>
                <span className={styles.statLabel}>Posted</span>
                <span className={styles.statValue}>{getDaysAgo(job.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {(['overview', 'requirements', 'benefits'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          {activeTab === 'overview' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionDot} />
                About this role
              </h3>
              <p className={styles.prose}>{job.description}</p>

              {job.responsibilities && (
                <>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionDot} />
                    Responsibilities
                  </h3>
                  <p className={styles.prose}>{job.responsibilities}</p>
                </>
              )}

              {/* Required Skills */}
              {job.required_skills?.length > 0 && (
                <>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionDot} />
                    Required Skills
                  </h3>
                  <div className={styles.skillsGrid}>
                    {job.required_skills.map(skill => (
                      <span key={skill} className={`${styles.skillTag} ${styles.skillRequired}`}>
                        <FiCheckCircle className={styles.skillIcon} /> {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {job.preferred_skills?.length > 0 && (
                <>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionDot} />
                    Nice to Have
                  </h3>
                  <div className={styles.skillsGrid}>
                    {job.preferred_skills.map(skill => (
                      <span key={skill} className={`${styles.skillTag} ${styles.skillPreferred}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionDot} />
                Requirements
              </h3>
              <p className={styles.prose}>{job.requirements}</p>

              {job.minimum_years_experience > 0 && (
                <div className={styles.expBadge}>
                  <FiAward />
                  <span>Minimum <strong>{job.minimum_years_experience} year{job.minimum_years_experience > 1 ? 's' : ''}</strong> of relevant experience required</span>
                </div>
              )}

              {job.required_skills?.length > 0 && (
                <>
                  <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>
                    <span className={styles.sectionDot} />
                    Technical Skills
                  </h3>
                  <div className={styles.requirementList}>
                    {job.required_skills.map(skill => (
                      <div key={skill} className={styles.requirementItem}>
                        <FiCheckCircle className={styles.reqCheck} />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionDot} />
                Perks & Benefits
              </h3>
              {job.benefits?.length > 0 ? (
                <div className={styles.benefitsGrid}>
                  {job.benefits.map((benefit, i) => (
                    <div key={i} className={styles.benefitCard}>
                      <div className={styles.benefitIcon}>✦</div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>No benefits listed for this position.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <div className={styles.footerMeta}>
            <span className={styles.applicantCount}>
              <FiUsers /> {job.application_count ?? 0} applicants
            </span>
            {job.application_url && (
              <a href={job.application_url} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                External listing ↗
              </a>
            )}
          </div>

          <button
            className={`${styles.applyBtn} ${applied ? styles.applyBtnDone : ''} ${applyLoading ? styles.applyBtnLoading : ''}`}
            onClick={handleApply}
            disabled={applied || applyLoading}
          >
            {applyLoading ? (
              <span className={styles.spinner} />
            ) : applied ? (
              <><FiCheckCircle /> Applied!</>
            ) : (
              <>Apply Now<span className={styles.applyArrow}>→</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}