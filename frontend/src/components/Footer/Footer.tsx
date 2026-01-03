'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { FaLinkedin, FaGithub, FaTwitter, FaEnvelope } from 'react-icons/fa';
import Image from 'next/image';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div className={styles.footerTop}>
                    <div className={styles.footerBrand}>
                        <div className={styles.logoContainer}>
                            {/* <div className={styles.logo}>
                            </div> */}
                            <Image src="/logo.png" alt="logo" width={24} height={24} className={styles.logo} />
                            <span className={styles.logoText}>spellhire</span>
                        </div>
                        <p className={styles.tagline}>
                            Connecting talented professionals with their dream opportunities.
                        </p>
                        <div className={styles.socialLinks}>
                            <a href="#" aria-label="LinkedIn" className={styles.socialLink}>
                                <FaLinkedin />
                            </a>
                            <a href="#" aria-label="GitHub" className={styles.socialLink}>
                                <FaGithub />
                            </a>
                            <a href="#" aria-label="Twitter" className={styles.socialLink}>
                                <FaTwitter />
                            </a>
                            <a href="#" aria-label="Email" className={styles.socialLink}>
                                <FaEnvelope />
                            </a>
                        </div>
                    </div>

                    <div className={styles.footerLinks}>
                        <div className={styles.linkColumn}>
                            <h3 className={styles.linkHeading}>For Candidates</h3>
                            <ul className={styles.linkList}>
                                <li><Link href="x/candidate/jobs" className={styles.link}>Browse Jobs</Link></li>
                                <li><Link href="x/candidate/profile" className={styles.link}>Profile Setup</Link></li>
                                <li><Link href="/candidate/applications" className={styles.link}>My Applications</Link></li>
                                <li><Link href="/resources" className={styles.link}>Career Resources</Link></li>
                            </ul>
                        </div>

                        <div className={styles.linkColumn}>
                            <h3 className={styles.linkHeading}>For Employers</h3>
                            <ul className={styles.linkList}>
                                <li><Link href="x/employer/post-job" className={styles.link}>Post a Job</Link></li>
                                <li><Link href="x/employer/dashboard" className={styles.link}>Employer Dashboard</Link></li>
                                <li><Link href="/pricing" className={styles.link}>Pricing</Link></li>
                                <li><Link href="/solutions" className={styles.link}>Recruiting Solutions</Link></li>
                            </ul>
                        </div>

                        <div className={styles.linkColumn}>
                            <h3 className={styles.linkHeading}>Company</h3>
                            <ul className={styles.linkList}>
                                <li><Link href="/about" className={styles.link}>About Us</Link></li>
                                <li><Link href="/contact" className={styles.link}>Contact Us</Link></li>
                                <li><Link href="/blog" className={styles.link}>Blog</Link></li>
                                <li><Link href="/careers" className={styles.link}>Careers</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <div className={styles.legalLinks}>
                        <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>
                        <Link href="/terms" className={styles.legalLink}>Terms of Service</Link>
                        <Link href="/cookies" className={styles.legalLink}>Cookie Policy</Link>
                    </div>
                    <p className={styles.copyright}>
                        © {currentYear} LOGO. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}