'use client';

import {
  FiActivity,
  FiExternalLink,
  FiLayers,
  FiPlus,
  FiStar,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';

import type {
  ApplicationsBoardController,
} from '@/types/applicationBoard';

import StageColumn, {
  StageDropPlaceholder,
} from './StageColumn';

import StageModal from './StageModal';

import styles from './ApplicationsBoard.module.css';

type ApplicationsBoardProps = {
  board: ApplicationsBoardController;
};

export default function ApplicationsBoard({
  board,
}: ApplicationsBoardProps) {
  if (!board.data) {
    return null;
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageIcon}>
            <FiLayers size={20} />
          </div>

          <div>
            <h1 className={styles.pageTitle}>
              {board.data.job.title}
            </h1>

            <p className={styles.pageSubtitle}>
              {board.data.job.organization_name ??
                'Organization'}{' '}
              ·{' '}
              {board.data.stats.total_applications}{' '}
              applicants
            </p>
          </div>
        </div>

        <div className={styles.pageHeaderActions}>
          <a
            href={`/jobs/${board.data.job.id}`}
            target="_blank"
            rel="noreferrer"
            className={styles.viewJobBtn}
          >
            View Job
            <FiExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <FiUsers size={14} />
            </span>

            <span className={styles.statLabel}>
              Total applicants
            </span>
          </div>

          <strong className={styles.statValue}>
            {board.data.stats.total_applications}
          </strong>

          <p className={styles.statSubtext}>
            All applications in this job
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <FiActivity size={14} />
            </span>

            <span className={styles.statLabel}>
              In review
            </span>
          </div>

          <strong className={styles.statValue}>
            {board.data.stats.in_review}
          </strong>

          <p className={styles.statSubtext}>
            Active candidates in pipeline
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <FiStar size={14} />
            </span>

            <span className={styles.statLabel}>
              Offers
            </span>
          </div>

          <strong className={styles.statValue}>
            {board.data.stats.offers}
          </strong>

          <p className={styles.statSubtext}>
            Candidates reached offer stage
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <FiXCircle size={14} />
            </span>

            <span className={styles.statLabel}>
              Rejected
            </span>
          </div>

          <strong className={styles.statValue}>
            {board.data.stats.rejected}
          </strong>

          <p className={styles.statSubtext}>
            Closed applications
          </p>
        </div>
      </div>

      <div className={styles.boardWrap}>
        <div className={styles.boardHeader}>
          <div>
            <p className={styles.sectionKicker}>
              Kanban board
            </p>

            <h2 className={styles.sectionTitle}>
              Move candidates between stages
            </h2>
          </div>

          <div className={styles.boardHeaderActions}>
            <button
              type="button"
              className={styles.addStageBtn}
              onClick={board.openAddStage}
            >
              <FiPlus size={14} />
              Add stage
            </button>
          </div>
        </div>

        <div className={styles.board}>
          {board.stageRenderItems.map((item) => {
            if (item.kind === 'placeholder') {
              return (
                <StageDropPlaceholder
                  key={item.key}
                  accent={item.accent}
                  stageId={item.stageId}
                  position={item.position}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const next =
                      board.getMeaningfulStageDropTarget(
                        item.stageId,
                        item.position
                      );

                    board.updateStageDropTarget(next);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    void board.dropStage(
                      item.stageId,
                      item.position
                    );
                  }}
                />
              );
            }

            const stage = item.stage;

            const cards =
              board.grouped[stage.id] ?? [];

            return (
              <StageColumn
                key={stage.id}
                board={board}
                stage={stage}
                cards={cards}
              />
            );
          })}
        </div>
      </div>

      {board.showStageModal && (
        <StageModal board={board} />
      )}
    </>
  );
}