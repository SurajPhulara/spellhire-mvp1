'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './EmployerSidebar.module.css';
// Removed firebase; using your AuthContext
import { useAuth } from '@/contexts/AuthContext';
import { FiMenu, FiX } from 'react-icons/fi'; // Added for mobile menu icons

export default function EmployerSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);

  const [showDrawer, setShowDrawer] = useState(false);
  const [userInitials, setUserInitials] = useState('SP');
  const [userName, setUserName] = useState('User Name');
  const [userRole, setUserRole] = useState('Employer');
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    if (!mounted) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDrawer &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        fabRef.current &&
        !fabRef.current.contains(event.target as Node)
      ) {
        setShowDrawer(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDrawer, mounted]);

  // Load user data from AuthContext
  const auth = useAuth();
  const user = (auth as any)?.user ?? null;
  const employer = (auth as any)?.employer ?? null;
  const logout = (auth as any)?.logout ?? (async () => {});

  useEffect(() => {
    if (!mounted) return;

    const fetchUserData = async () => {
      if (user) {
        // name fallbacks
        const name =
          (user.displayName as string) ||
          (user.name as string) ||
          `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() ||
          user.email ||
          'User Name';

        const initials = name
          .split(' ')
          .filter(Boolean)
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'SP';

        setUserInitials(initials);
        setUserName(name);

        const role = (employer?.professionalInfo?.jobTitle as string) || (user.position as string) || (user.role as string) || 'Employer';
        setUserRole(role);

        const uid = user.uid ?? user.id ?? user._id ?? null;
        setUserId(uid);

        // profile picture URL
        console.log({user});
        const profileUrl = user.profile_picture_url ?? null;
        setProfilePictureUrl(profileUrl);
      } else {
        setUserInitials('SP');
        setUserName('User Name');
        setUserRole('Employer');
        setUserId(null);
        setProfilePictureUrl(null);
      }
    };

    fetchUserData();
  
}, [user, employer, mounted]);

  const handleNavClick = (href: string) => {
    router.push(href);
    setShowDrawer(false); // Close mobile drawer
  };

  const isActiveRoute = (href: string) => {
    return pathname === href;
  };

  // Navigation items for employer with colorful SVG icons
  const navItems = [
    { 
      id: 'dashboard', 
      text: 'Dashboard', 
      href: '/employer/dashboard', 
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none">
          <path d="M3 3H10V10H3V3Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 3H21V10H14V3Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 14H10V21H3V14Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 14H21V21H14V14Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'post', 
      text: 'Post Job', 
      href: '/employer/jobs/new', 
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none">
          <path d="M12 8V16M8 12H16M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'manage', 
      text: 'Manage Jobs', 
      href: '/employer/jobs', 
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'messages', 
      text: 'Messages', 
      href: '/employer/messages', 
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'profile', 
      text: 'My Profile', 
      href: userId ? `/employer/profile` : '#', 
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none">
          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      disabled: !userId
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      router.replace('/login');
    }
  };

  // Show skeleton loading until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <img src="/logo.png" alt="SpellHire" className={styles.logoImage} />
          <span className={styles.logoText}>SpellHire</span>
        </div>
        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className={styles.navItem}>
                <div className={`${styles.navLink} animate-pulse`}>
                  <span className={styles.navIcon}>
                    <div className="h-6 w-6 rounded bg-gray-200"></div>
                  </span>
                  <span className={styles.navText}>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.spacer}></div>
        <div className={styles.bottomSection}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>SP</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>User Name</p>
              <p className={styles.userRole}>Employer</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        ref={fabRef}
        className={styles.menuFab}
        onClick={() => setShowDrawer(prev => !prev)}
        aria-label="Toggle menu"
      >
        {showDrawer ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {showDrawer && (
        <div
          className={styles.overlay}
          onClick={() => setShowDrawer(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${showDrawer ? styles.show : ''}`}
      >
        <div className={styles.mobileHeader}>
          <span>Navigation</span>
          <button
            onClick={() => setShowDrawer(false)}
            className={styles.closeBtn}
            aria-label="Close menu"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className={styles.logoSection}>
          <Link href="/" className={styles.logoLink}>
            <img src="/logo.png" alt="SpellHire" className={styles.logoImage} />
            <span className={styles.logoText}>SpellHire</span>
          </Link>
        </div>

        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.id} className={styles.navItem}>
                <button
                  disabled={item.disabled}
                  className={`${styles.navLink} ${isActiveRoute(item.href) ? styles.active : ''}`}
                  onClick={() => handleNavClick(item.href)}
                  aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                >
                  {item.icon}
                  <span className={styles.navText}>{item.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.spacer}></div>

        <div className={styles.bottomSection}>
          <button
            className={styles.navLink}
            onClick={() => handleNavClick('/employer/settings')}
            aria-label="Settings"
          >
            <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5166 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01062 9.77251C4.27925 9.5799 4.48278 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={styles.navText}>Settings</span>
          </button>

          <button
            className={`${styles.navLink} ${styles.logoutBtn}`}
            onClick={handleLogout}
            aria-label="Logout"
          >
            <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={styles.navText}>Logout</span>
          </button>

          <div
            className={styles.userProfile}
            onClick={() => handleNavClick(userId ? `/employer/profile` : '#')}
            aria-label="User profile"
          >
            <div className={styles.userAvatar}>
              {profilePictureUrl ? (
                <img 
                  src={profilePictureUrl} 
                  alt={userName} 
                  className={styles.profileImage}
                />
              ) : (
                userInitials
              )}
            </div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{userName}</p>
              <p className={styles.userRole}>{userRole}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
