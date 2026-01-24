// app/dashboard/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';
import { 
  FiUser, 
  FiBriefcase, 
  FiFileText, 
  FiSettings, 
  FiLogOut,
  FiMail,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, userType } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        {/* Welcome Header */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1>Welcome back{user.name ? `, ${user.name}` : ''}!</h1>
            <p className={styles.welcomeSubtitle}>
              Here's what's happening with your account today.
            </p>
          </div>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <FiLogOut /> Logout
          </button>
        </div>

        {/* Email Verification Alert */}
        {!user.is_verified && (
          <div className={styles.verificationAlert}>
            <FiAlertCircle className={styles.alertIcon} />
            <div className={styles.alertContent}>
              <h3>Email Verification Required</h3>
              <p>Please verify your email address to access all features.</p>
              <button 
                className={styles.verifyButton}
                onClick={() => router.push('/verify-email')}
              >
                Verify Now
              </button>
            </div>
          </div>
        )}

        {/* User Info Cards */}
        <div className={styles.cardGrid}>
          {/* Profile Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiUser className={styles.cardIcon} />
              <h2>Profile Information</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Account Type:</span>
                <span className={styles.infoBadge}>
                  {userType === 'CANDIDATE' ? (
                    <>
                      <FiUser /> Candidate
                    </>
                  ) : (
                    <>
                      <FiBriefcase /> Employer
                    </>
                  )}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status:</span>
                <span className={`${styles.statusBadge} ${user.is_verified ? styles.verified : styles.unverified}`}>
                  {user.is_verified ? (
                    <>
                      <FiCheckCircle /> Verified
                    </>
                  ) : (
                    <>
                      <FiAlertCircle /> Unverified
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => router.push('/profile/edit')}
              >
                <FiSettings /> Edit Profile
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiBriefcase className={styles.cardIcon} />
              <h2>Quick Actions</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.actionList}>
                {userType === 'CANDIDATE' ? (
                  <>
                    <button className={styles.actionButton}>
                      <FiFileText />
                      <div className={styles.actionContent}>
                        <span className={styles.actionTitle}>View Applications</span>
                        <span className={styles.actionDesc}>Track your job applications</span>
                      </div>
                    </button>
                    <button className={styles.actionButton}>
                      <FiBriefcase />
                      <div className={styles.actionContent}>
                        <span className={styles.actionTitle}>Browse Jobs</span>
                        <span className={styles.actionDesc}>Find your next opportunity</span>
                      </div>
                    </button>
                    <button className={styles.actionButton}>
                      <FiUser />
                      <div className={styles.actionContent}>
                        <span className={styles.actionTitle}>Update Resume</span>
                        <span className={styles.actionDesc}>Keep your profile current</span>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button className={styles.actionButton}>
                      <FiBriefcase />
                      <div className={styles.actionContent}>
                        <span className={styles.actionTitle}>Post a Job</span>
                        <span className={styles.actionDesc}>Find the right candidates</span>
                      </div>
                    </button>
                    <button className={styles.actionButton}>
                      <FiFileText />
                      <div className={styles.actionContent}>
                        <span className={styles.actionTitle}>View Applicants</span>
                        <span className={styles.actionDesc}>Review job applications</span>
                      </div>
                    </button>
                    <button className={styles.actionButton}>
                      <FiUser />
                      <div className={styles.actionContent}>
                        <span className={styles.actionTitle}>Company Profile</span>
                        <span className={styles.actionDesc}>Manage your company info</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Account Settings Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiSettings className={styles.cardIcon} />
              <h2>Account Settings</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.settingsList}>
                <button className={styles.settingButton}>
                  <FiMail />
                  <span>Email Preferences</span>
                </button>
                <button className={styles.settingButton}>
                  <FiSettings />
                  <span>Privacy Settings</span>
                </button>
                <button className={styles.settingButton}>
                  <FiUser />
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}