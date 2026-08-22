'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ApplicationService } from '@/lib/api/services/applications';
import { ApplicationTimelineResponse } from '@/types';

import styles from './page.module.css';

export default function ApplicationTimelinePage() {
  const { application_id } = useParams<{ application_id: string }>();

  const [data, setData] = useState<ApplicationTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!application_id) return;

    (async () => {
      try {
        const res = await ApplicationService.getApplicationTimeline(application_id);
        if (res.success) setData(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [application_id]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.center}>Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.center}>Application not found</div>
      </div>
    );
  }

  const currentStage = data.pipeline_stages.find(
    (s) => s.id === data.current_stage_id
  );

  return (
      <div className={styles.container}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{data.job.title}</h1>
            <p className={styles.company}>
              {data.job.organization_name}
            </p>
          </div>

          <a
            href={`/jobs/${data.job.id}`}
            target="_blank"
            className={styles.link}
          >
            View Job →
          </a>
        </div>

        {/* CURRENT STATUS */}
        <div className={styles.current}>
          <span className={styles.label}>Current Stage</span>
          <span className={styles.badge}>
            {currentStage?.name || data.current_stage_id}
          </span>
        </div>

        {/* TIMELINE */}
        <div className={styles.timeline}>
          {data.stage_history.length === 0 && (
            <p className={styles.empty}>No updates yet</p>
          )}

          {data.stage_history.map((item, index) => {
            const stageName =
              data.pipeline_stages.find((s) => s.id === item.to_stage_id)?.name ||
              item.to_stage_id;

            return (
              <div key={index} className={styles.item}>
                <div className={styles.dot} />
                <div className={styles.card}>
                  <div className={styles.row}>
                    <strong>{stageName}</strong>
                    <span className={styles.time}>
                      {new Date(item.changed_at).toLocaleString()}
                    </span>
                  </div>

                  {item.from_stage_id && (
                    <p className={styles.sub}>
                      from{' '}
                      {
                        data.pipeline_stages.find(
                          (s) => s.id === item.from_stage_id
                        )?.name
                      }
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <Link href="/candidate/jobs/applied">
            ← Back to applications
          </Link>
        </div>

      </div>
  );
}