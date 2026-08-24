"use client";

import { useEffect, useState } from "react";
import { EmployerRole, Skill, SkillLevel, TeamMemberCreate } from "@/types";
import styles from "./AddTeamMemberModal.module.css";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: TeamMemberCreate) => Promise<void>;
}

export default function AddTeamMemberModal({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: AddTeamMemberModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EmployerRole.RECRUITER | EmployerRole.INTERVIEWER>(
    EmployerRole.RECRUITER
  );
  const [jobTitle, setJobTitle] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole(EmployerRole.RECRUITER);
      setJobTitle("");
      setExperienceYears("");
      setSkillName("");
      setSkills([]);
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole(EmployerRole.RECRUITER);
    setJobTitle("");
    setExperienceYears("");
    setSkillName("");
    setSkills([]);
    setLocalError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const addSkill = () => {
    const name = skillName.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setSkillName("");
      return;
    }
    setSkills((prev) => [...prev, { name, level: SkillLevel.INTERMEDIATE }]);
    setSkillName("");
  };

  const removeSkill = (name: string) => {
    setSkills((prev) => prev.filter((s) => s.name !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedFirst = firstName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedFirst || !trimmedEmail) {
      setLocalError("First name and email are required.");
      return;
    }

    const payload: TeamMemberCreate = {
      first_name: trimmedFirst,
      last_name: lastName.trim() || undefined,
      email: trimmedEmail,
      role,
    };

    if (role === EmployerRole.INTERVIEWER) {
      payload.job_title = jobTitle.trim() || undefined;
      if (experienceYears !== "") {
        payload.experience_years = Number(experienceYears);
      }
      payload.skills = skills;
    }

    await onSubmit(payload);
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Add Team Member</h2>
            <p className={styles.modalSubtitle}>Invite a recruiter or interviewer to your organization.</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.label}>First name</label>
              <input
                className={styles.input}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Last name</label>
              <input
                className={styles.input}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Role</label>
            <div className={styles.roleRow}>
              <button
                type="button"
                className={`${styles.roleBtn} ${role === EmployerRole.RECRUITER ? styles.roleBtnActive : ""}`}
                onClick={() => setRole(EmployerRole.RECRUITER)}
              >
                Recruiter
              </button>
              <button
                type="button"
                className={`${styles.roleBtn} ${role === EmployerRole.INTERVIEWER ? styles.roleBtnActive : ""}`}
                onClick={() => setRole(EmployerRole.INTERVIEWER)}
              >
                Interviewer
              </button>
            </div>
            <p className={styles.hint}>
              {role === EmployerRole.RECRUITER
                ? "Recruiters can log in and manage jobs and applications."
                : "Interviewers do not log in. They use invitation and interview links."}
            </p>
          </div>

          {role === EmployerRole.INTERVIEWER && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Job title</label>
                <input
                  className={styles.input}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Engineer"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Years of experience</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className={styles.input}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Skills</label>
                <div className={styles.skillRow}>
                  <input
                    className={styles.input}
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="Add a skill"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <button type="button" className={styles.secondaryBtn} onClick={addSkill}>
                    Add
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className={styles.chipRow}>
                    {skills.map((skill) => (
                      <button
                        key={skill.name}
                        type="button"
                        className={styles.chip}
                        onClick={() => removeSkill(skill.name)}
                      >
                        {skill.name} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {(localError || error) && <p className={styles.error}>{localError || error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.ghostBtn} onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
              {isSubmitting ? "Sending invite…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
