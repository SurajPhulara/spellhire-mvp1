// frontend/src/app/(shared)/candidate_profile/[id]/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiEdit3,
  FiExternalLink,
  FiGithub,
  FiGlobe,
  FiMapPin,
  FiLinkedin,
  FiShare2,
  FiX,
  FiUser,
  FiCheckCircle,
  FiFileText,
  FiStar,
  FiClock,
  FiAward,
  FiBookOpen,
  FiCheck,
  FiCopy,
  FiShield,
  FiLayers,
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@/lib/api/services/profile';
import { CandidateProfile, CandidateProfileRequest } from '@/types';
import CandidateProfileForm from '@/components/candidate/profile/CandidateProfileForm';
import styles from './page.module.css';

function formatSalary(value?: number | null): string {
  if (value === undefined || value === null || value === 0) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeText(value?: string | null): string {
  return value?.trim() || 'N/A';
}

function safeArray<T>(value?: T[] | null): T[] {
  return Array.isArray(value) ? value : [];
}

function formatLocation(locations?: string[] | null): string {
  const list = safeArray(locations).filter(Boolean);
  return list.length ? list.join(' • ') : 'N/A';
}

function getFullName(profile: CandidateProfile): string {
  const first = profile.first_name?.trim() || '';
  const last = profile.last_name?.trim() || '';
  const full = `${first} ${last}`.trim();
  return full || 'Candidate';
}

function initials(profile: CandidateProfile): string {
  const first = profile.first_name?.[0] || '';
  const last = profile.last_name?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'C';
}

function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <span className={styles.sectionIcon}>{icon}</span>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
        {action && <div className={styles.sectionAction}>{action}</div>}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
    </div>
  );
}

function SkillChips({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className={styles.emptyLine}>No skills added yet.</p>;
  }

  return (
    <div className={styles.chipRow}>
      {items.map((item) => (
        <span key={item} className={styles.chip}>
          {item}
        </span>
      ))}
    </div>
  );
}

function useCopyFeedback(duration = 1800) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), duration);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }, [duration]);

  return { copied, copy };
}

export default function CandidateProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();

  const candidateId = params?.id;
  const isOwner = Boolean(user && candidateId && user.id === candidateId);

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState('');

  const { copied: headerCopied, copy: headerCopy } = useCopyFeedback();
  const { copied: inlineCopied, copy: inlineCopy } = useCopyFeedback();

  const fetchProfile = useCallback(async () => {
    if (!candidateId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await ProfileService.getCandidateProfilePublic(candidateId);

      if (res.success && res.data?.candidate) {
        setProfile(res.data.candidate as CandidateProfile);
      } else {
        setProfile(null);
        setError('Profile not found.');
      }
    } catch (e) {
      console.error('Failed to fetch public candidate profile:', e);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(window.location.href);
    }
  }, [candidateId]);

  useEffect(() => {
    if (!editing) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditing(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [editing]);

  const handleSubmit = async (data: CandidateProfileRequest) => {
    setSaving(true);
    try {
      await ProfileService.updateCandidateProfile(data);
      await fetchProfile();
      setEditing(false);
    } catch (e) {
      console.error('Failed to save profile:', e);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => setEditing(false);

  const skills = useMemo(
    () =>
      safeArray(profile?.skills)
        .map((s: any) => s?.name ?? String(s))
        .filter(Boolean),
    [profile],
  );

  const languages = useMemo(
    () =>
      safeArray(profile?.languages).map((l: any) => {
        if (typeof l === 'string') return l;
        return `${l?.name ?? 'Language'}${l?.proficiency ? ` · ${l.proficiency}` : ''}`;
      }),
    [profile],
  );

  const certifications = useMemo(
    () =>
      safeArray(profile?.certifications).map((c: any) => {
        if (typeof c === 'string') return c;
        return `${c?.name ?? 'Certification'}${c?.issuing_organization ? ` · ${c.issuing_organization}` : ''}`;
      }),
    [profile],
  );

  const experienceList = useMemo(() => safeArray(profile?.experience), [profile]);
  const educationList = useMemo(() => safeArray(profile?.education), [profile]);

  function shortSummary(text?: string, max = 120) {
    if (!text) return 'Candidate profile';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageContent}>
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.pageContent}>
          <div className={styles.errorBox}>
            <FiUser size={28} />
            <h2>{error ?? 'Profile not found'}</h2>
            <p>This profile may have been removed or is unavailable.</p>
            <Link href="/jobs" className={styles.backLink}>
              <FiArrowLeft size={14} />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <div className={styles.headerBar}>
          <div className={styles.headerLeft}>
            <Link href="/jobs" className={styles.backLink}>
              <FiArrowLeft size={14} />
              Back
            </Link>
            <div className={styles.headerKicker}>
              <FiLayers size={14} />
              <span>Candidate profile</span>
            </div>
          </div>

          <div className={styles.headerActions}>
            {headerCopied ? (
              <span className={styles.copiedToast}>
                <FiCheck size={13} />
                Link copied!
              </span>
            ) : (
              <button
                className={styles.iconButton}
                onClick={() => headerCopy(profileUrl)}
                type="button"
                aria-label="Share profile link"
              >
                <FiShare2 size={14} />
                Share link
              </button>
            )}

            {isOwner && (
              <button
                className={`${styles.iconButton} ${styles.editButton}`}
                type="button"
                onClick={() => setEditing(true)}
              >
                <FiEdit3 size={14} />
                Edit profile
              </button>
            )}
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.heroGlow} />

          <div className={styles.heroTop}>
            <div className={styles.avatar}>
              {profile.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt={getFullName(profile)} />
              ) : (
                <span>{initials(profile)}</span>
              )}
            </div>

            <div className={styles.heroContent}>
              <div className={styles.nameRow}>
                <div className={styles.nameBlock}>
                  <div className={styles.nameLine}>
                    <h1 className={styles.name}>{getFullName(profile)}</h1>
                    {profile.is_profile_complete && (
                      <span className={styles.completeBadge}>
                        <FiCheckCircle size={13} />
                        Complete
                      </span>
                    )}
                  </div>

                  <p className={styles.headline}>
                    {shortSummary(profile.professional_summary)}
                  </p>
                </div>

                <div className={styles.ownerBadges}>
                  {isOwner ? (
                    <span className={`${styles.pill} ${styles.ownerPill}`}>
                      <FiShield size={12} />
                      Your profile
                    </span>
                  ) : (
                    <span className={`${styles.pill} ${styles.publicPill}`}>
                      Public profile
                    </span>
                  )}

                  {profile.is_available_for_work && (
                    <span className={`${styles.pill} ${styles.availablePill}`}>
                      ✦ Open to work
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <FiMapPin size={12} />
                  {formatLocation(profile.preferred_locations)}
                </span>
                <span className={styles.metaItem}>
                  <FiBriefcase size={12} />
                  {normalizeText(profile.preferred_job_type as any)}
                </span>
                <span className={styles.metaItem}>
                  <FiClock size={12} />
                  Notice: {profile.notice_period ?? 'N/A'} days
                </span>
                <span className={styles.metaItem}>
                  <FiCalendar size={12} />
                  Updated {formatDate(profile.updated_at)}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <StatCard label="Experience" value={`${profile.total_experience ?? 0} yrs`} />
            <StatCard
              label="Current salary"
              value={isOwner ? formatSalary(profile.current_salary) : '—'}
            />
            <StatCard
              label="Expected salary"
              value={isOwner ? formatSalary(profile.expected_salary) : '—'}
            />
            <StatCard label="Active" value={profile.is_active ? 'Yes' : 'No'} />
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.mainCol}>
          {profile.professional_summary && profile.professional_summary?.length > 150 && (<Section title="About" icon={<FiUser size={15} />}>
              <p className={styles.paragraph}>
                {profile.professional_summary
                  ? profile.professional_summary
                  : 'No summary added yet.'}
              </p>
            </Section>
          )}

            <Section title="Skills" icon={<FiStar size={15} />}>
              <SkillChips items={skills} />
            </Section>

            <Section title="Experience" icon={<FiBriefcase size={15} />}>
              {experienceList.length ? (
                <div className={styles.timeline}>
                  {experienceList.map((exp: any, idx) => (
                    <div
                      key={`${exp?.company ?? 'exp'}-${idx}`}
                      className={styles.timelineItem}
                    >
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineCard}>
                        <div className={styles.timelineHead}>
                          <h3 className={styles.timelineTitle}>
                            {exp?.position ?? 'Position'} · {exp?.company ?? 'Company'}
                          </h3>
                          <span className={styles.timelineSub}>
                            {formatDate(exp?.start_date)} —{' '}
                            {exp?.is_current_job ? 'Present' : formatDate(exp?.end_date)}
                          </span>
                        </div>
                        <p className={styles.timelineText}>
                          {exp?.description ?? 'No description provided.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyLine}>No experience added yet.</p>
              )}
            </Section>

            <Section title="Education" icon={<FiBookOpen size={15} />}>
              {educationList.length ? (
                <div className={styles.stackList}>
                  {educationList.map((edu: any, idx) => (
                    <div key={`${edu?.institution ?? 'edu'}-${idx}`} className={styles.infoCard}>
                      <div className={styles.infoCardHead}>
                        <h3 className={styles.infoCardTitle}>{edu?.degree ?? 'Degree'}</h3>
                        <span className={styles.infoCardSub}>
                          {edu?.field_of_study ?? 'Field not set'}
                        </span>
                      </div>
                      <p className={styles.infoCardBody}>
                        {edu?.institution ?? 'Institution'} · {edu?.start_year ?? '—'} —{' '}
                        {edu?.end_year ?? '—'}
                      </p>
                      {edu?.grade && <p className={styles.mutedLine}>Grade: {edu.grade}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyLine}>No education details added yet.</p>
              )}
            </Section>

            <Section title="Languages & Certifications" icon={<FiAward size={15} />}>
              <div className={styles.dualGrid}>
                <div className={styles.subSection}>
                  <h3 className={styles.subTitle}>🌍 Languages</h3>
                  {languages.length ? (
                    <div className={styles.chipRow}>
                      {languages.map((lang) => (
                        <span key={lang} className={styles.chip}>
                          {lang}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyLine}>No languages added yet.</p>
                  )}
                </div>

                <div className={styles.subSection}>
                  <h3 className={styles.subTitle}>🏆 Certifications</h3>
                  {certifications.length ? (
                    <div className={styles.chipRow}>
                      {certifications.map((cert) => (
                        <span key={cert} className={styles.chip}>
                          {cert}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyLine}>No certifications added yet.</p>
                  )}
                </div>
              </div>
            </Section>
          </div>

          <aside className={styles.sideCol}>
            <Section title="Quick Info" icon={<FiFileText size={15} />}>
              <div className={styles.sideList}>
                {[
                  { label: 'Profile status', value: profile.is_profile_complete ? '✓ Complete' : 'Incomplete' },
                  { label: 'Current salary', value: isOwner ? formatSalary(profile.current_salary) : '—' },
                  { label: 'Expected salary', value: isOwner ? formatSalary(profile.expected_salary) : '—' },
                  { label: 'Work mode', value: normalizeText(profile.preferred_work_mode as any) },
                  { label: 'Job type', value: normalizeText(profile.preferred_job_type as any) },
                  { label: 'Availability', value: profile.is_available_for_work ? '🟢 Available' : '🔴 Unavailable' },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.sideItem}>
                    <span className={styles.sideLabel}>{label}</span>
                    <span className={styles.sideValue}>{value}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Links" icon={<FiExternalLink size={15} />}>
              <div className={styles.linkList}>
                {profile.resume_url && (
                  <a href={profile.resume_url} target="_blank" rel="noreferrer" className={styles.linkItem}>
                    <FiFileText size={14} />
                    Resume
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className={styles.linkItem}>
                    <FiGlobe size={14} />
                    Portfolio
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className={styles.linkItem}>
                    <FiLinkedin size={14} />
                    LinkedIn
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noreferrer" className={styles.linkItem}>
                    <FiGithub size={14} />
                    GitHub
                  </a>
                )}
                {!profile.resume_url &&
                  !profile.portfolio_url &&
                  !profile.linkedin_url &&
                  !profile.github_url && (
                    <p className={styles.emptyLine}>No public links added yet.</p>
                  )}
              </div>
            </Section>

            <Section title="Share Profile" icon={<FiShare2 size={15} />}>
              <div className={styles.profileLinkBox}>
                <p className={styles.profileLinkText}>{profileUrl}</p>
                <button
                  className={`${styles.copyButton} ${inlineCopied ? styles.copyButtonSuccess : ''}`}
                  type="button"
                  onClick={() => inlineCopy(profileUrl)}
                >
                  {inlineCopied ? (
                    <>
                      <FiCheck size={13} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <FiCopy size={13} />
                      Copy link
                    </>
                  )}
                </button>
              </div>
            </Section>
          </aside>
        </div>
      </div>

      {editing && profile && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={styles.modalCard}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Edit profile</h2>
                <p className={styles.modalSubtitle}>Update your public SpellHire profile.</p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeModal}
                aria-label="Close edit mode"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <CandidateProfileForm
                initialData={profile as CandidateProfile}
                ProfilePictureURL={profile.profile_picture_url}
                onSubmit={handleSubmit}
                isSubmitting={saving}
                submitButtonText="Save Changes"
                mode="edit"
              />
            </div>

            {saving && (
              <div className={styles.savingOverlay}>
                <div className={styles.spinnerSmall} />
                <span>Saving changes…</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}