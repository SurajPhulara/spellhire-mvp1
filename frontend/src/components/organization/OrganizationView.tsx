'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@/lib/api/services/profile';
import { Organization, OrganizationRequest } from '@/types';
import OrganizationProfileForm from '@/components/organization/OrganizationProfileForm';
import styles from './OrganizationView.module.css';

// ─── helpers ─────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
  if (!name) return 'O';
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts[1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'O';
}

// ─── types ────────────────────────────────────────────────────────────────────

export type OrganizationViewMode = 'edit' | 'view';

interface OrganizationViewProps {
  /**
   * 'edit'  – employer-owned page; shows "Edit Organization" button + form modal.
   * 'view'  – public page; read-only, no edit controls.
   */
  mode: OrganizationViewMode;
  /**
   * Only required in 'view' mode. The org id comes from the URL param.
   * In 'edit' mode the component fetches the authenticated employer's own org.
   */
  orgId?: string;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function OrganizationView({ mode, orgId }: OrganizationViewProps) {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  const isEditMode = mode === 'edit';

  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [organization, setOrganization] = useState<Organization | null>(null);

  // ── data fetching ─────────────────────────────────────────────────────────

  const fetchOrganization = async () => {
    try {
      setPageLoading(true);

      let org: Organization;

      if (isEditMode) {
        const response = await ProfileService.getOrganizationProfile();
        org = response.data?.organization;
      } else {
        const response = await ProfileService.getOrganizationProfilePublic(orgId!);
        org = response.data?.organization;
      }

      if (org) {
        setOrganization(org);
      }
    } catch (err: any) {
      console.error('Failed to load organization:', err);
      setError(err?.message || 'Failed to load organization');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode && !isLoading && user && user.user_type !== 'EMPLOYER') {
      router.replace('/');
      return;
    }
    if (isEditMode && isLoading) return;
    fetchOrganization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, router, isEditMode]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isEditOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isEditOpen]);

  // ── submit (passed to OrganizationProfileForm) ────────────────────────────

  const handleSubmit = async (data: OrganizationRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await ProfileService.updateOrganizationProfile(data);

      if (response.success) {
        await fetchOrganization();
        setIsEditOpen(false);
      } else {
        setError(response?.errors?.[0]?.message || 'Failed to update organization');
      }
    } catch (err: any) {
      console.error('Organization update failed:', err);
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const logoInitials = useMemo(() => getInitials(organization?.name), [organization?.name]);

  if ((isEditMode && isLoading) || pageLoading) {
    return <Loading />;
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.pageIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16v10H4V7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h1 className={styles.pageTitle}>
                {isEditMode ? 'My Organization' : (organization?.name || 'Organization')}
              </h1>
              <p className={styles.pageSubtitle}>
                {isEditMode
                  ? 'Manage your company identity, brand, and contact details.'
                  : organization?.industry || 'Company profile'}
              </p>
            </div>
          </div>

          {isEditMode ? (
            <div className={styles.pageHeaderActions}>
              <button className={styles.primaryBtn} onClick={() => setIsEditOpen(true)}>
                Edit Organization
              </button>
            </div>
          ) : (
            <div className={styles.pageHeaderActions}>
              <Link href={`/jobs?organization=${orgId || organization?.id || ''}`} className={styles.primaryBtn}>
                View Jobs
              </Link>
              <Link
                href={`/login?as=employer`}
                className={styles.primaryBtn}
              >
                Organization Login
              </Link>
            </div>
          )}
        </div>

        {/* ── Hero card ───────────────────────────────────────────────── */}
        <div className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div className={styles.logoWrap}>
              {organization?.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className={styles.orgLogoHero}
                />
              ) : (
                <div className={styles.orgLogoFallback}>{logoInitials}</div>
              )}
            </div>

            <div className={styles.heroTextBlock}>
              <p className={styles.heroKicker}>Organization profile</p>
              <h2 className={styles.heroTitle}>{organization?.name || 'Organization'}</h2>
              <p className={styles.heroMetaLine}>
                {organization?.industry || 'Industry not set'}
              </p>
              <p className={styles.heroText}>
                {organization?.description
                  || (isEditMode ? 'Keep your company profile polished so candidates immediately understand who they are applying to.' : 'No description provided.')}
              </p>

              <div className={styles.heroPills}>
                {organization?.company_size && (
                  <span className={styles.heroPill}>{organization.company_size}</span>
                )}
                {organization?.founded_on && (
                  <span className={styles.heroPill}>Est. {organization.founded_on.slice(0, 4)}</span>
                )}
                {organization?.headquarters_location && (
                  <span className={styles.heroPill}>{organization.headquarters_location}</span>
                )}
                {organization?.is_active && (
                  <span className={`${styles.heroPill} ${styles.heroPillActive}`}>Active</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isEditMode && (
          <div className={styles.heroCard} style={{ padding: '1rem 1.3rem' }}>
            <p className={styles.heroText}>
              Joining this organization is invitation-only. If you already have a member account, use Organization Login.
            </p>
          </div>
        )}

        {/* ── Error box ───────────────────────────────────────────────── */}
        {error && (
          <div className={styles.errorBox}>
            <div className={styles.errorIcon}>!</div>
            <div className={styles.errorText}>
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
            <button className={styles.errorClose} onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* ── Fact cards row ──────────────────────────────────────────── */}
        <div className={styles.profileGrid}>
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h3>Company Details</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span>Industry</span>
                <strong>{organization?.industry || 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Company size</span>
                <strong>{organization?.company_size || 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Founded on</span>
                <strong>{organization?.founded_on || 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Status</span>
                <strong>{organization?.is_active ? 'Active' : 'Inactive'}</strong>
              </div>
            </div>
          </div>

          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h3>Contact &amp; Location</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span>Email</span>
                <strong>{organization?.contact_email || 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Phone</span>
                <strong>{organization?.phone || 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Website</span>
                <strong>{organization?.website || 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Headquarters</span>
                <strong>{organization?.headquarters_location || 'N/A'}</strong>
              </div>
              {organization?.additional_locations?.length ? (
                <div className={styles.detailRow}>
                  <span>Other offices</span>
                  <strong>{organization.additional_locations.join(', ')}</strong>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Long-form prose sections ─────────────────────────────────── */}
        {(organization?.mission || organization?.company_culture || organization?.benefits_overview || isEditMode) && (
          <div className={styles.proseStack}>
            {(organization?.mission || isEditMode) && (
              <div className={styles.proseRow}>
                <div className={styles.proseRowLabel}>
                  <div className={styles.proseIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
                        stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span>Mission</span>
                </div>
                <p className={styles.proseText}>
                  {organization?.mission || 'No mission statement added yet.'}
                </p>
              </div>
            )}

            {(organization?.company_culture || isEditMode) && (
              <div className={styles.proseRow}>
                <div className={styles.proseRowLabel}>
                  <div className={styles.proseIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span>Culture</span>
                </div>
                <p className={styles.proseText}>
                  {organization?.company_culture || 'No culture description added yet.'}
                </p>
              </div>
            )}

            {(organization?.benefits_overview || isEditMode) && (
              <div className={styles.proseRow}>
                <div className={styles.proseRowLabel}>
                  <div className={styles.proseIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                        stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span>Benefits</span>
                </div>
                <p className={styles.proseText}>
                  {organization?.benefits_overview || 'No benefits overview added yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit modal (edit mode only) ────────────────────────────────── */}
      {isEditMode && isEditOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalKicker}>Edit organization</p>
                <h2 className={styles.modalTitle}>Update company details</h2>
              </div>
              <button className={styles.modalClose} onClick={() => setIsEditOpen(false)}>
                ×
              </button>
            </div>

            {/* OrganizationProfileForm handles all form state & logo upload */}
            <div className={styles.modalBody}>
              <OrganizationProfileForm
                initialData={organization}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitButtonText="Save Organization"
                mode="edit"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}