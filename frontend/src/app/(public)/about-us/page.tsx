'use client';

import styles from './page.module.css';
import { FaRocket, FaLightbulb, FaUsers, FaChartLine } from 'react-icons/fa';

export default function About() {
  return (
    <div className={styles.aboutContainer}>
      {/* Hero Section */}
      <div className={styles.aboutHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Built for Founders, by Founders</h1>
          <p className={styles.heroSubtitle}>
            We're revolutionizing hiring to make it faster and easier for startups and small teams.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.aboutContent}>
        <div className={styles.contentGrid}>
          <div className={styles.textContent}>
            <h2 className={styles.sectionTitle}>Our Story</h2>
            <p className={styles.sectionText}>
              We started this platform because we've been in your shoes. As founders who've scaled startups, 
              we know how painful and time-consuming hiring can be. Traditional hiring processes are 
              broken for fast-moving teams.
            </p>
            <p className={styles.sectionText}>
              Our mission is to leverage AI to handle the noise of hiring - screening, scheduling, 
              and administrative tasks - so you can focus on the decisions that truly matter: finding 
              the right talent for your team.
            </p>
            
            {/* <div className={styles.statsContainer}>
              <div className={styles.statItem}>
                <FaRocket className={styles.statIcon} />
                <div>
                  <span className={styles.statNumber}>1000+</span>
                  <span className={styles.statLabel}>Startups Helped</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <FaUsers className={styles.statIcon} />
                <div>
                  <span className={styles.statNumber}>10,000+</span>
                  <span className={styles.statLabel}>Hires Made</span>
                </div>
              </div>
            </div> */}
          </div>

          <div className={styles.imageWrapper}>
            <img 
              src="/home_section2_image.png" 
              alt="Team collaboration" 
              className={styles.aboutImage}
            />
          </div>
          
        </div>

        {/* Values Section */}
        <div className={styles.valuesSection}>
          <h2 className={styles.sectionTitle}>Our Values</h2>
          
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <FaLightbulb />
              </div>
              <h3 className={styles.valueTitle}>Innovation</h3>
              <p className={styles.valueText}>
                We constantly push boundaries to create hiring solutions that actually work for startups.
              </p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <FaChartLine />
              </div>
              <h3 className={styles.valueTitle}>Efficiency</h3>
              <p className={styles.valueText}>
                We eliminate hiring friction so you can build your team without slowing down.
              </p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <FaUsers />
              </div>
              <h3 className={styles.valueTitle}>Founder-First</h3>
              <p className={styles.valueText}>
                Everything we build comes from our own experiences scaling startups.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}