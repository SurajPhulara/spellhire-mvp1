"use client";

import type { DragEvent } from "react";

import {
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiMove,
  FiTrash2,
} from "react-icons/fi";

import type { Pipeline } from "@/types/job";

import type {
  ApplicationsBoardController,
  BoardApplication,
  StageDropTarget,
} from "@/types/applicationBoard";

import CandidateCard from "./CandidateCard";

import {
  getCardInsertionIndex,
  getStageTone,
  isFixedStage,
  setDragPreview,
} from "./utils";

import styles from "./StageColumn.module.css";

type StageColumnProps = {
  board: ApplicationsBoardController;
  stage: Pipeline;
  cards: BoardApplication[];
};

type StageDropPlaceholderProps = {
  accent: string;
  stageId: string;
  position: "before" | "after";
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
};

export function StageDropPlaceholder({
  accent,
  stageId,
  position,
  onDragOver,
  onDrop,
}: StageDropPlaceholderProps) {
  return (
    <div
      className={styles.stageDropPlaceholder}
      style={{
        ["--accent" as any]: accent,
      }}
      data-stage-id={stageId}
      data-position={position}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <FiMove size={14} />
      <span>Drop it here</span>
    </div>
  );
}

function CardDropPlaceholder() {
  return (
    <div className={styles.cardDropPlaceholder}>
      <FiMove size={14} />
      <span>Drop here</span>
    </div>
  );
}

export default function StageColumn({ board, stage, cards }: StageColumnProps) {
  const tone = getStageTone(stage.id);

  const accent = stage.color || "#3b82f6";

  const isCardHoverTarget =
    board.cardDropTarget?.stageId === stage.id && !!board.draggedApplicationId;

  const renderedCards: Array<BoardApplication | "__placeholder__"> = [...cards];

  if (isCardHoverTarget && board.cardDropTarget) {
    const insertIndex = Math.max(
      0,
      Math.min(board.cardDropTarget.index, renderedCards.length),
    );

    renderedCards.splice(insertIndex, 0, "__placeholder__");
  }

  return (
    <div
      className={`${styles.column} ${styles[`column_${tone}`]} ${
        board.draggedStageId === stage.id ? styles.columnDragging : ""
      }`}
      style={{
        ["--accent" as any]: accent,
      }}
      onDragOver={(e) => {
        e.preventDefault();

        if (
          !board.draggedStageIdRef.current ||
          stage.locked ||
          isFixedStage(stage.id)
        ) {
          return;
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        const position: "before" | "after" =
          e.clientX < rect.left + rect.width / 2 ? "before" : "after";

        const next = board.getMeaningfulStageDropTarget(stage.id, position);

        board.updateStageDropTarget(next);
      }}
      onDrop={() => {
        if (!stage.locked && board.stageDropTarget) {
          void board.dropStage(
            board.stageDropTarget.stageId,
            board.stageDropTarget.position,
          );
        }
      }}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnHeaderLeft}>
          {!stage.locked && (
            <div
              className={styles.columnDragHandle}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";

                e.dataTransfer.setData("text/plain", stage.id);

                const columnEl = (e.currentTarget as HTMLElement).closest(
                  `.${styles.column}`,
                );

                if (columnEl instanceof HTMLElement) {
                  setDragPreview(e, columnEl);
                }

                board.startStageDrag(stage.id);
              }}
              onDragEnd={board.clearStageDrag}
              title="Drag to reorder stage"
            >
              <FiMove size={13} />
            </div>
          )}

          <div className={styles.stageInfoWrap} tabIndex={0}>
            <div className={styles.stageInfoMain}>
              <h3 className={styles.columnTitle}>{stage.name}</h3>

              <p className={styles.columnSub}>{stage.description || "Stage"}</p>
            </div>

            <div
              className={styles.stageTooltip}
              style={{
                ["--accent" as any]: accent,
              }}
            >
              <div className={styles.stageTooltipTitle}>{stage.name}</div>

              <div className={styles.stageTooltipDesc}>
                {stage.description || "No description available"}
              </div>

              <div className={styles.stageTooltipMeta}>
                Count: {stage.count ?? cards.length}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.columnHeaderRight}>
          <span className={styles.columnCount}>
            {stage.count ?? cards.length}
          </span>

          {stage.locked ? (
            <span className={styles.lockBadge}>Locked</span>
          ) : (
            <div className={styles.stageControls}>
              <button
                type="button"
                className={styles.stageControlBtn}
                onClick={() => void board.moveStage(stage.id, "left")}
                title="Move left"
              >
                <FiChevronLeft size={13} />
              </button>

              <button
                type="button"
                className={styles.stageControlBtn}
                onClick={() => void board.moveStage(stage.id, "right")}
                title="Move right"
              >
                <FiChevronRight size={13} />
              </button>

              <button
                type="button"
                className={styles.stageControlBtn}
                onClick={() => board.openEditStage(stage)}
                title="Edit"
              >
                <FiEdit3 size={13} />
              </button>

              <button
                type="button"
                className={`${styles.stageControlBtn} ${styles.stageDeleteBtn}`}
                onClick={() => void board.deleteStage(stage.id)}
                title="Delete"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={styles.columnBody}
        onDragOver={(e) => {
          e.preventDefault();

          if (!board.draggedApplicationIdRef.current) {
            return;
          }

          const body = e.currentTarget as HTMLElement;

          const index = getCardInsertionIndex(body, e.clientY);

          board.updateCardDropTarget({
            stageId: stage.id,
            index,
          });
        }}
        onDrop={() => void board.handleApplicationDrop(stage.id)}
      >
        {renderedCards.length === 0 ? (
          <div className={styles.emptyStage}>
            <FiBookmark size={14} />

            <p>Drop candidates here</p>
          </div>
        ) : (
          renderedCards.map((item, index) =>
            item === "__placeholder__" ? (
              <CardDropPlaceholder key={`placeholder-${stage.id}-${index}`} />
            ) : (
              <CandidateCard
                key={item.application_id}
                board={board}
                application={item}
                stageColor={accent}
              />
            ),
          )
        )}
      </div>
    </div>
  );
}
