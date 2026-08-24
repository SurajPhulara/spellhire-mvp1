"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  FiCalendar,
  FiExternalLink,
  FiMessageSquare,
  FiMove,
  FiSave,
} from "react-icons/fi";

import type {
  ApplicationsBoardController,
  BoardApplication,
} from "@/types/applicationBoard";

import { getInitials, setDragPreview, timeAgo } from "./utils";

import styles from "./CandidateCard.module.css";

type CandidateCardProps = {
  board: ApplicationsBoardController;
  application: BoardApplication;
  stageColor: string;
};

export default function CandidateCard({
  board,
  application,
  stageColor,
}: CandidateCardProps) {
  const candidate = application.candidate;

  const fullName =
    candidate.full_name ||
    [candidate.first_name, candidate.last_name].filter(Boolean).join(" ") ||
    "Candidate";

  const [showNoteEditor, setShowNoteEditor] = useState(false);

  const [draftNote, setDraftNote] = useState(application.notes ?? "");

  useEffect(() => {
    setDraftNote(application.notes ?? "");
  }, [application.notes]);

  const skills = (candidate.skills ?? []).slice(0, 4);

  const saveNote = () => {
    void board.saveNote(application.application_id, draftNote.trim());

    setShowNoteEditor(false);
  };

  return (
    <div
      className={styles.candidateCard}
      data-candidate-card="true"
      draggable
      style={{
        ["--accent" as any]: stageColor,
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";

        e.dataTransfer.setData("text/plain", application.application_id);

        setDragPreview(e, e.currentTarget as HTMLElement);

        board.startApplicationDrag(application.application_id);
      }}
      onDragEnd={board.clearApplicationDrag}
    >
      <div className={styles.candidateTop}>
        <div className={styles.avatar}>
          {candidate.profile_picture_url ? (
            <img src={candidate.profile_picture_url} alt={fullName} />
          ) : (
            <span>{getInitials(fullName)}</span>
          )}
        </div>

        <div className={styles.candidateInfo}>
          <div className={styles.candidateNameRow}>
            <h4 className={styles.candidateName}>{fullName}</h4>

            <span className={styles.dragIcon}>
              <FiMove size={12} />
            </span>
          </div>

          <p className={styles.candidateSub}>
            {candidate.total_experience
              ? `${candidate.total_experience} yrs exp`
              : "Experience not set"}
          </p>
        </div>
      </div>

      <div className={styles.candidateMeta}>
        <span className={styles.metaItem}>
          <FiCalendar size={12} />
          Applied {timeAgo(application.applied_at)}
        </span>

        {candidate.resume_url && (
          <a
            href={candidate.resume_url}
            target="_blank"
            rel="noreferrer"
            className={styles.resumeLink}
            onClick={(e) => e.stopPropagation()}
          >
            <FiExternalLink size={12} />
            Resume
          </a>
        )}
      </div>

      {skills.length > 0 && (
        <div className={styles.skillRow}>
          {skills.map((skill) => (
            <span key={skill} className={styles.skillChip}>
              {skill}
            </span>
          ))}

          {(candidate.skills?.length ?? 0) > 4 && (
            <span className={`${styles.skillChip} ${styles.skillMore}`}>
              +{(candidate.skills?.length ?? 0) - 4}
            </span>
          )}
        </div>
      )}

      {application.current_stage_id !== "applied" && (
        <div className={styles.noteBlock}>
          <div className={styles.noteHeader}>
            <span className={styles.noteLabel}>
              <FiMessageSquare size={12} />
              Recruiter notes
            </span>

            <button
              type="button"
              className={styles.noteToggle}
              onClick={() => setShowNoteEditor((p) => !p)}
            >
              {showNoteEditor
                ? "Close"
                : application.notes
                  ? "Edit"
                  : "Add note"}
            </button>
          </div>

          {application.notes && !showNoteEditor && (
            <div className={styles.notePreview}>{application.notes}</div>
          )}

          {showNoteEditor && (
            <div className={styles.noteEditor}>
              <textarea
                className={styles.noteTextarea}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Write a short note about this candidate..."
                rows={4}
              />

              <div className={styles.noteActions}>
                <button
                  type="button"
                  className={styles.noteCancel}
                  onClick={() => {
                    setDraftNote(application.notes ?? "");

                    setShowNoteEditor(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={styles.noteSave}
                  onClick={saveNote}
                >
                  <FiSave size={13} />
                  Save note
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.cardFooter}>
        <Link
          href={`/candidate_profile/${candidate.user_id}`}
          target="_blank"
          className={styles.profileLink}
          onClick={(e) => e.stopPropagation()}
        >
          View profile
        </Link>

        <span className={styles.stageTag}>Match : 100%</span>
      </div>
    </div>
  );
}
