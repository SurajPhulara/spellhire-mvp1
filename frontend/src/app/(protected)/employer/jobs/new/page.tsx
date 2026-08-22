"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JobPostingForm from "@/components/employer/jobs/JobPostingForm";
import { JobService } from "@/lib/api/services/jobs";
import { JobRequest } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

export default function NewJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (data: JobRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await JobService.createJob(data);

      if (response.success && response.data) {
        alert("Job posted successfully!");
        router.push("/employer/jobs");
      } else {
        setError(response.errors?.[0]?.message || "Failed to create job posting");
      }
    } catch (err: any) {
      console.error("Error creating job:", err);
      setError(err.message || "An error occurred while creating the job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.headerCard} ${styles.animateFadeIn}`}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Jobs
          </button>

          <div className={styles.logoWrap}>
            {user?.organization_logo ? (
              <img className={styles.logoImage} src={user.organization_logo} alt="organization logo" />
            ) : (
              <div className={styles.logoPlaceholder}>
                <svg className={styles.logoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          <h1 className={styles.title}>Create New Job Posting</h1>
          <p className={styles.subtitle}>Fill in the details to attract the best candidates for your role</p>
        </div>

        {error && (
          <div className={`${styles.errorWrap} ${styles.animateFadeIn}`}>
            <div className={styles.errorCard}>
              <div className={styles.errorContent}>
                <div className={styles.errorIconWrap}>
                  <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <div className={styles.errorBody}>
                  <h3 className={styles.errorTitle}>Error Creating Job</h3>
                  <p className={styles.errorText}>{error}</p>
                </div>

                <button onClick={() => setError(null)} className={styles.closeButton}>
                  <svg className={styles.closeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <JobPostingForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Publish"
        />

        <div className={`${styles.card} ${styles.tipsCard} ${styles.animateFadeIn}`}>
          <h3 className={styles.tipsTitle}>
            <span className={styles.emoji}>💡</span>
            Tips for a Great Job Posting
          </h3>

          <div className={styles.tipsGrid}>
            <div className={styles.tipItem}>
              <div className={styles.tipBullet}>
                <svg className={styles.tipCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className={styles.tipHeading}>Be Specific</h4>
                <p className={styles.tipText}>
                  Clear job titles and detailed descriptions attract better candidates
                </p>
              </div>
            </div>

            <div className={styles.tipItem}>
              <div className={styles.tipBullet}>
                <svg className={styles.tipCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className={styles.tipHeading}>Highlight Benefits</h4>
                <p className={styles.tipText}>
                  Showcase what makes your company a great place to work
                </p>
              </div>
            </div>

            <div className={styles.tipItem}>
              <div className={styles.tipBullet}>
                <svg className={styles.tipCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className={styles.tipHeading}>Use Bullet Points</h4>
                <p className={styles.tipText}>
                  Make responsibilities and requirements easy to scan
                </p>
              </div>
            </div>

            <div className={styles.tipItem}>
              <div className={styles.tipBullet}>
                <svg className={styles.tipCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className={styles.tipHeading}>Include Salary Range</h4>
                <p className={styles.tipText}>
                  Transparency increases application rates by up to 30%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}