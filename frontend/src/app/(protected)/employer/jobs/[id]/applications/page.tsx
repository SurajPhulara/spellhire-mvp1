'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

import ApplicationsBoard from '@/components/employer/applicationsBoard/ApplicationsBoard';

import useEmployerJobApplicationsBoard from './useEmployerJobApplicationsBoard';
import styles from './page.module.css';

export default function EmployerJobApplicationsPage() {
  const { id: job_id } = useParams<{ id: string }>();

  const board = useEmployerJobApplicationsBoard(job_id);

  if (board.loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageContent}>
          <div className={styles.loadingScreen}>
            <div className={styles.spinner} />
            <p>Loading applications board…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!board.data) {
    return (
      <div className={styles.page}>
        <div className={styles.pageContent}>
          <div className={styles.errorScreen}>
            <h2>Applications board not found</h2>

            <Link
              href="/employer/jobs"
              className={styles.backLink}
            >
              <FiArrowLeft size={14} />
              Back to jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <ApplicationsBoard board={board} />
      </div>
    </div>
  );
}