"use client";

import { FiCheck, FiX } from "react-icons/fi";

import type { ApplicationsBoardController } from "@/types/applicationBoard";

import { PRESET_COLORS } from "./utils";

import styles from "./StageModal.module.css";

type StageModalProps = {
  board: ApplicationsBoardController;
};

export default function StageModal({ board }: StageModalProps) {
  return (
    <div className={styles.modalBackdrop} onClick={board.closeStageModal}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalKicker}>
              {board.editingStageId ? "Edit stage" : "Add stage"}
            </p>

            <h3 className={styles.modalTitle}>
              {board.editingStageId
                ? "Update custom stage"
                : "Create a custom stage"}
            </h3>
          </div>

          <button
            type="button"
            className={styles.modalClose}
            onClick={board.closeStageModal}
          >
            <FiX size={14} />
          </button>
        </div>

        <div className={styles.modalFields}>
          <label className={styles.field}>
            <span>Stage name</span>

            <input
              className={styles.input}
              value={board.stageDraft.name}
              onChange={(e) =>
                board.setStageDraft((p) => ({
                  ...p,
                  name: e.target.value,
                }))
              }
              placeholder="Technical Round"
            />
          </label>

          <label className={styles.field}>
            <span>Description</span>

            <input
              className={styles.input}
              value={board.stageDraft.description}
              onChange={(e) =>
                board.setStageDraft((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              placeholder="Candidate is being tested on role-specific skills"
            />
          </label>

          <label className={styles.field}>
            <span>Color</span>

            <div className={styles.colorRow}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorSwatch} ${
                    board.stageDraft.color === color
                      ? styles.colorSwatchActive
                      : ""
                  }`}
                  style={{
                    background: color,
                  }}
                  onClick={() =>
                    board.setStageDraft((p) => ({
                      ...p,
                      color,
                    }))
                  }
                  title={color}
                />
              ))}
            </div>
          </label>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.modalCancel}
            onClick={board.closeStageModal}
          >
            Cancel
          </button>

          <button
            type="button"
            className={styles.modalSave}
            onClick={() => void board.saveStage()}
          >
            <FiCheck size={14} />
            Save stage
          </button>
        </div>
      </div>
    </div>
  );
}
