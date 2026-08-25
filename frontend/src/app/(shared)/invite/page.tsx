'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FiCheckCircle,
  FiClock,
  FiMail,
  FiShield,
  FiUser,
  FiBriefcase,
  FiXCircle,
} from 'react-icons/fi';

import TeamService from '@/lib/api/services/team';
import {
  TeamInviteAccept,
  TeamMember,
  TeamMemberRole,
} from '@/types/team';

import styles from './page.module.css';

type PageState =
  | 'loading'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'rejected'
  | 'error';

export default function TeamInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');

  const [member, setMember] = useState<TeamMember | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState('');

  const [form, setForm] = useState<TeamInviteAccept>({
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
    department: '',
    bio: '',
    skills: [],
    experience_years: undefined,
    password: '',
  });

  const isRecruiter =
    member?.role === TeamMemberRole.RECRUITER;

  const isInterviewer =
    member?.role === TeamMemberRole.INTERVIEWER;

  useEffect(() => {
    if (!token) {
      setError('This invitation link is missing a token.');
      setPageState('error');
      return;
    }

    const loadInvitation = async () => {
      try {
        const res = await TeamService.getInvitation(token);

        if (!res.success || !res.data?.member) {
          throw new Error(
            res.message || 'Invitation could not be loaded.'
          );
        }

        const invitedMember = res.data.member;

        setMember(invitedMember);

        setForm(prev => ({
          ...prev,
          first_name: invitedMember.first_name ?? '',
          last_name: invitedMember.last_name ?? '',
          phone: invitedMember.phone ?? '',
          job_title: invitedMember.job_title ?? '',
          department: invitedMember.department ?? '',
          bio: invitedMember.bio ?? '',
          experience_years:
            invitedMember.experience_years ?? undefined,
        }));

        setPageState('ready');
      } catch (err) {
        console.error('Failed to load invitation:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'This invitation is invalid or has expired.'
        );
        setPageState('error');
      }
    };

    loadInvitation();
  }, [token]);

  const updateField = <K extends keyof TeamInviteAccept>(
    field: K,
    value: TeamInviteAccept[K]
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAccept = async (event: FormEvent) => {
    event.preventDefault();

    if (!token || !member) return;

    if (
      !form.first_name?.trim() ||
      !form.last_name?.trim()
    ) {
      setError('Please enter your full name.');
      return;
    }

    if (isRecruiter && !form.password) {
      setError('Please create a password.');
      return;
    }

    setError('');
    setPageState('submitting');

    try {
      const res = await TeamService.acceptInvitation(
        token,
        {
          ...form,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone?.trim() || undefined,
          job_title: form.job_title?.trim() || undefined,
          department: form.department?.trim() || undefined,
          bio: form.bio?.trim() || undefined,
        }
      );

      if (!res.success) {
        throw new Error(
          res.message || 'Failed to accept invitation.'
        );
      }

      setPageState('success');
    } catch (err) {
      console.error('Accept invitation failed:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to accept invitation.'
      );

      setPageState('ready');
    }
  };

  const handleReject = async () => {
    if (!token) return;

    try {
      setError('');

      const res =
        await TeamService.rejectInvitation(token);

      if (!res.success) {
        throw new Error(
          res.message || 'Failed to decline invitation.'
        );
      }

      setPageState('rejected');
    } catch (err) {
      console.error('Reject invitation failed:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to decline invitation.'
      );
    }
  };

  if (pageState === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <h2>Loading invitation…</h2>
          <p>We're verifying your invitation.</p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={`${styles.stateIcon} ${styles.errorIcon}`}>
            <FiXCircle size={26} />
          </div>

          <h1>Invitation unavailable</h1>

          <p>{error}</p>

          <button
            className={styles.primaryButton}
            onClick={() => router.push('/')}
          >
            Go to SpellHire
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'rejected') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={`${styles.stateIcon} ${styles.warningIcon}`}>
            <FiXCircle size={26} />
          </div>

          <h1>Invitation declined</h1>

          <p>
            The invitation has been declined successfully.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={`${styles.stateIcon} ${styles.successIcon}`}>
            <FiCheckCircle size={28} />
          </div>

          <h1>
            {isRecruiter
              ? 'Your account is ready'
              : 'Invitation accepted'}
          </h1>

          <p>
            {isRecruiter
              ? 'Your recruiter account has been created successfully.'
              : 'Your interviewer profile is now active.'}
          </p>

          {isRecruiter ? (
            <button
              className={styles.primaryButton}
              onClick={() => router.push('/login')}
            >
              Continue to login
            </button>
          ) : (
            <div className={styles.successNote}>
              <FiMail size={16} />
              <span>
                You can now receive interview invitations
                and availability requests from SpellHire.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.brandRow}>
          <div className={styles.logo}>
            S
          </div>

          <div>
            <p className={styles.brandName}>
              SpellHire
            </p>

            <p className={styles.brandSub}>
              Organization invitation
            </p>
          </div>
        </div>

        {/* Invitation info */}
        <div className={styles.inviteHeader}>
          <div>
            <span className={styles.eyebrow}>
              You’ve been invited
            </span>

            <h1>
              Join{' '}
              {member?.role ===
              TeamMemberRole.INTERVIEWER
                ? 'as an interviewer'
                : 'the recruiting team'}
            </h1>

            <p>
              Complete your profile to accept your
              invitation and join the organization.
            </p>
          </div>
        </div>

        <div className={styles.organizationCard}>
          <div className={styles.orgIcon}>
            <FiBriefcase size={19} />
          </div>

          <div>
            <span className={styles.orgLabel}>
              Organization
            </span>

            <strong>
              Organization invitation
            </strong>

            <span className={styles.inviteEmail}>
              <FiMail size={12} />
              {member?.email}
            </span>
          </div>

          <span className={styles.roleBadge}>
            {member?.role}
          </span>
        </div>

        <form
          className={styles.form}
          onSubmit={handleAccept}
        >
          <div className={styles.sectionTitle}>
            <FiUser size={16} />
            Personal information
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>First name *</span>
              <input
                value={form.first_name ?? ''}
                onChange={e =>
                  updateField(
                    'first_name',
                    e.target.value
                  )
                }
                required
              />
            </label>

            <label className={styles.field}>
              <span>Last name *</span>
              <input
                value={form.last_name ?? ''}
                onChange={e =>
                  updateField(
                    'last_name',
                    e.target.value
                  )
                }
                required
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Email</span>
            <input
              value={member?.email ?? ''}
              disabled
            />
          </label>

          <label className={styles.field}>
            <span>Phone</span>
            <input
              value={form.phone ?? ''}
              onChange={e =>
                updateField(
                  'phone',
                  e.target.value
                )
              }
            />
          </label>

          <div className={styles.sectionTitle}>
            <FiBriefcase size={16} />
            Professional information
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Job title</span>
              <input
                value={form.job_title ?? ''}
                onChange={e =>
                  updateField(
                    'job_title',
                    e.target.value
                  )
                }
                placeholder="e.g. Senior Software Engineer"
              />
            </label>

            <label className={styles.field}>
              <span>Department</span>
              <input
                value={form.department ?? ''}
                onChange={e =>
                  updateField(
                    'department',
                    e.target.value
                  )
                }
                placeholder="Engineering"
              />
            </label>
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Years of experience</span>
              <input
                type="number"
                min={0}
                value={
                  form.experience_years ?? ''
                }
                onChange={e =>
                  updateField(
                    'experience_years',
                    e.target.value
                      ? Number(e.target.value)
                      : undefined
                  )
                }
              />
            </label>

            <label className={styles.field}>
              <span>Skills</span>
              <input
                placeholder="Python, React, System Design"
                onChange={e => {
                  const skills =
                    e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map(name => ({
                        name,
                      }));

                  updateField(
                    'skills',
                    skills
                  );
                }}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Short bio</span>
            <textarea
              value={form.bio ?? ''}
              onChange={e =>
                updateField(
                  'bio',
                  e.target.value
                )
              }
              rows={4}
              placeholder={
                isInterviewer
                  ? 'Tell the organization about your professional background and areas of expertise.'
                  : 'Tell the organization a little about yourself.'
              }
            />
          </label>

          {isRecruiter && (
            <>
              <div className={styles.sectionTitle}>
                <FiShield size={16} />
                Create your account
              </div>

              <label className={styles.field}>
                <span>Password *</span>
                <input
                  type="password"
                  value={form.password ?? ''}
                  onChange={e =>
                    updateField(
                      'password',
                      e.target.value
                    )
                  }
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </label>
            </>
          )}

          {error && (
            <div className={styles.formError}>
              {error}
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.expiry}>
              <FiClock size={13} />
              Invitation expires soon
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleReject}
                disabled={
                  pageState === 'submitting'
                }
              >
                Decline
              </button>

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={
                  pageState === 'submitting'
                }
              >
                {pageState === 'submitting'
                  ? 'Accepting…'
                  : 'Accept invitation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}