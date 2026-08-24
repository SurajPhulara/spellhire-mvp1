'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import EmployerProfileForm from '@/components/employer/profile/EmployerProfileForm';
import { EmployerProfile, EmployerRequest, Organization } from '@/types';
import { ProfileService } from '@/lib/api/services/profile';
import Loading from '@/app/loading';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';
import { employerRoleLabel } from "@/lib/utils";

function getInitials(name?: string | null) {
  if (!name) return 'E';
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts[1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'E';
}

export default function EmployerProfilePage() {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);

  const fetchProfiles = async () => {
    try {
      setPageLoading(true);

      const [employerResponse, orgResponse] = await Promise.all([
        ProfileService.getEmployerProfile(),
        ProfileService.getOrganizationProfile(),
      ]);

      if (employerResponse.data?.employer) {
        setEmployerProfile(employerResponse.data.employer);
      }

      if (orgResponse.data?.organization) {
        setOrganization(orgResponse.data.organization);
      }
    } catch (err: any) {
      console.error('Failed to load employer profile:', err);
      setError(err?.message || 'Failed to load profile');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user && user.user_type !== 'EMPLOYER') {
      router.replace('/');
      return;
    }

    if (!isLoading) {
      fetchProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, router]);

  useEffect(() => {
    if (isEditOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditOpen]);

  const handleSubmit = async (data: EmployerRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await ProfileService.updateEmployerProfile(data);

      if (response.success) {
        await fetchProfiles();
        setIsEditOpen(false);
      } else {
        setError(response?.errors?.[0]?.message || 'Failed to update employer profile');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
      console.error('Employer profile update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || pageLoading) {
    return <Loading />;
  }

  const fullName =
    [employerProfile?.first_name, employerProfile?.last_name].filter(Boolean).join(' ') ||
    'Employer Profile';

  const roleLabel = employerRoleLabel(employerProfile?.role);
  const profileStatus = user?.is_profile_complete ? 'Complete' : 'Incomplete';

  const orgName = organization?.name || 'Organization';
  const orgInitials = getInitials(orgName);

  const heroName = fullName;
  const heroSubtitle =
    employerProfile?.job_title ||
    employerProfile?.department ||
    roleLabel;

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.pageIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 21a8 8 0 1 0-16 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h1 className={styles.pageTitle}>Employer Profile</h1>
              <p className={styles.pageSubtitle}>
                Keep your personal and organization details up to date.
              </p>
            </div>
          </div>

          <div className={styles.pageHeaderActions}>
            <button className={styles.primaryBtn} onClick={() => setIsEditOpen(true)}>
              Edit Profile
            </button>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div className={styles.employerAvatarWrap}>
              {user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={heroName}
                  className={styles.employerAvatar}
                />
              ) : (
                <div className={styles.employerAvatarFallback}>
                  {getInitials(heroName)}
                </div>
              )}
            </div>

            <div className={styles.heroTextBlock}>
              <p className={styles.heroKicker}>Employer profile</p>
              <h2 className={styles.heroTitle}>{heroName}</h2>
              <p className={styles.heroMetaLine}>
                {heroSubtitle}
                {organization?.name ? ` · ${organization.name}` : ''}
              </p>
              <p className={styles.heroText}>
                Keep your personal and organization details updated so your hiring activity looks clear and professional.
              </p>

              <div className={styles.heroPills}>
                <span className={styles.heroPill}>Personal details</span>
                <span className={styles.heroPill}>Organization info</span>
                <span className={styles.heroPill}>Hiring access</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <div className={styles.errorIcon}>!</div>
            <div className={styles.errorText}>
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
            <button className={styles.errorClose} onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        <div className={styles.profileGrid}>
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h3>Personal Details</h3>
            </div>

            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span>Full name</span>
                <strong>{fullName}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Email</span>
                <strong>{user?.email ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Phone</span>
                <strong>{employerProfile?.phone ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Work phone</span>
                <strong>{employerProfile?.work_phone ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Job title</span>
                <strong>{employerProfile?.job_title ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Department</span>
                <strong>{employerProfile?.department ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Role</span>
                <strong>{roleLabel}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Profile status</span>
                <strong>{profileStatus}</strong>
              </div>
            </div>
          </div>

          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h3>Organization</h3>
            </div>

            <div className={styles.orgHeader}>
              <div className={styles.orgLogoWrap}>
                {organization?.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.name}
                    className={styles.orgLogo}
                  />
                ) : (
                  <div className={styles.orgLogoFallback}>{orgInitials}</div>
                )}
              </div>

              <div className={styles.orgHeading}>
                <h4>{organization?.name ?? 'N/A'}</h4>
                <p>{organization?.industry ?? 'Organization details'}</p>
              </div>
            </div>

            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span>Website</span>
                <strong>{organization?.website ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Headquarters</span>
                <strong>{organization?.headquarters_location ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Company size</span>
                <strong>{organization?.company_size ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Contact email</span>
                <strong>{organization?.contact_email ?? 'N/A'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Phone</span>
                <strong>{organization?.phone ?? 'N/A'}</strong>
              </div>
            </div>
          </div>

          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h3>Hiring Access</h3>
            </div>

            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span>Role</span>
                <strong>{employerRoleLabel(employerProfile?.role)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Active</span>
                <strong>{employerProfile?.is_active ? 'Yes' : 'No'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Profile status</span>
                <strong>{profileStatus}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalKicker}>Edit profile</p>
                <h2 className={styles.modalTitle}>Update employer details</h2>
              </div>

              <button className={styles.modalClose} onClick={() => setIsEditOpen(false)}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <EmployerProfileForm
                initialData={employerProfile}
                organizationName={organization?.name || ''}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitButtonText="Save Profile"
                mode="edit"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}