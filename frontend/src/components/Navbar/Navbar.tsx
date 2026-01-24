'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import Lenis from 'lenis';
import styles from './page.module.css';
import { FiMenu, FiX, FiBriefcase } from 'react-icons/fi';
import { PrimaryButton } from '@/components/ui/buttons/PrimaryButton';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);

    // Smooth scrolling
    useEffect(() => {
        const lenis = new Lenis();
        const raf = (time: number) => {
            lenis.raf(time);
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }, []);

    // Drawer animation
    useEffect(() => {
        if (isOpen) {
            gsap.fromTo(
                `.${styles.drawer}`,
                { x: '100%' },
                { x: '0%', duration: 0.3, ease: 'power3.out' }
            );
        }
    }, [isOpen]);

    // Sticky navbar on scroll
    useEffect(() => {
        const handleScroll = () => setIsSticky(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigateOrScrollTop = (href: string) => {
        if (pathname === href) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsOpen(false);
        } else {
            router.push(href);
        }
    };

    const closeDrawer = () => {
        gsap.to(`.${styles.drawer}`, {
            x: '100%',
            duration: 0.3,
            ease: 'power3.in',
            onComplete: () => setIsOpen(false),
        });
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeDrawer();
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navLinks = [
        { label: 'Home', href: '/' },
        { label: 'Jobs', href: '/jobs' },
        { label: 'About Us', href: '/about-us' },
        { label: 'Contact Us', href: '/contact-us' }
    ];

    return (
        <>
            <nav className={`${styles.navbar} ${isSticky ? styles.sticky : ''}`}>
                <div className={styles.container}>
                    {/* Logo */}
                    <div className={styles.logoContainer} onClick={() => navigateOrScrollTop('/')}>
                        <Image src="/logo.png" alt="logo" width={24} height={24} />
                        <span className={styles.logoText}>spellhire</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className={styles.desktopMenu}>
                        {navLinks.map(({ label, href }) => (
                            <button
                                key={label}
                                className={`${styles.navLink} ${pathname === href ? styles.active : ''}`}
                                onClick={() => navigateOrScrollTop(href)}
                            >
                                {label}
                            </button>
                        ))}
                        
                        {/* Conditional Employer/Candidate Link in Navigation */}
                        {!isAuthenticated && (
                            pathname.includes('/employer') ? (
                                <button 
                                    className={`${styles.navLink} ${styles.employerNavLink}`}
                                    onClick={() => router.push('/login')}
                                >
                                    <FiBriefcase size={16} />
                                    <span>For Candidates</span>
                                </button>
                            ) : (
                                <button 
                                    className={`${styles.navLink} ${styles.employerNavLink}`}
                                    onClick={() => router.push('/employer/login')}
                                >
                                    <FiBriefcase size={16} />
                                    <span>For Employers</span>
                                </button>
                            )
                        )}
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className={styles.desktopAuth}>
                        {isAuthenticated ? (
                            <>
                                {user && (
                                    <span className={styles.userInfo}>
                                        Welcome, {user.first_name || user.email}
                                    </span>
                                )}
                                <PrimaryButton onClick={handleLogout}>Logout</PrimaryButton>
                            </>
                        ) : (
                            <>
                                <Link href={pathname.includes('/employer')? "/employer/login":"/login"} className={styles.loginBtn}>Login</Link> 
                                <PrimaryButton onClick={() => router.push(pathname.includes('/employer')? "/employer/register":"/register")}>Register</PrimaryButton>
                            </>
                        )}
                    </div>

                    {/* Hamburger */}
                    <button
                        className={styles.hamburger}
                        onClick={() => setIsOpen(true)}
                        aria-label="Open menu"
                    >
                        <FiMenu size={24} />
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer */}
            {isOpen && (
                <div className={styles.overlay} onClick={handleOverlayClick}>
                    <div className={styles.drawer}>
                        <button
                            className={styles.closeBtn}
                            onClick={closeDrawer}
                            aria-label="Close menu"
                        >
                            <FiX size={24} />
                        </button>

                        <div className={styles.drawerContent}>
                            {navLinks.map(({ label, href }) => (
                                <button
                                    key={label}
                                    className={`${styles.navLink} ${pathname === href ? styles.active : ''}`}
                                    onClick={() => {
                                        closeDrawer();
                                        navigateOrScrollTop(href);
                                    }}
                                >
                                    {label}
                                </button>
                            ))}

                            <div className={styles.drawerAuth}>
                                {isAuthenticated ? (
                                    <>
                                        {user && (
                                            <span className={styles.userInfo}>
                                                Welcome, {user.first_name || user.email}
                                            </span>
                                        )}
                                        <PrimaryButton onClick={() => { closeDrawer(); handleLogout(); }}>
                                            Logout
                                        </PrimaryButton>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.employerSection}>
                                            <button 
                                                className={styles.employerCard}
                                                onClick={() => { closeDrawer(); router.push(pathname.includes('/employer')?'/login':'/employer/login'); }}
                                            >
                                                <div className={styles.employerCardIcon}>
                                                    <FiBriefcase size={24} />
                                                </div>
                                                <div className={styles.employerCardContent}>
                                                    <h3>{pathname.includes('/employer')? "For Candidates" : "For Employers"}</h3>
                                                    <p>Post jobs and hire talent</p>
                                                </div>
                                            </button>
                                        </div>
                                        
                                        <div className={styles.candidateSection}>
                                            <div className={styles.sectionLabel}>For Job Seekers</div>
                                            <Link href="/login" className={styles.drawerLoginBtn} onClick={closeDrawer}>
                                                Login
                                            </Link>
                                            <PrimaryButton onClick={() => { closeDrawer(); router.push('/register'); }}>
                                                Register
                                            </PrimaryButton>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}