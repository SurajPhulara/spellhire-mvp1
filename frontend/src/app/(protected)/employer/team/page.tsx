"use client";

import { useEffect, useMemo, useState } from "react";
import { EmployerProfile, EmployerProfileStatus, EmployerRole, TeamMemberCreate } from "@/types";
import { TeamService } from "@/lib/api/services/team";
import { employerProfileStatusLabel, employerRoleLabel } from "@/lib/utils";
import AddTeamMemberModal from "@/components/employer/team/AddTeamMemberModal";
import styles from "./page.module.css";

function memberName(member: EmployerProfile): string {
  return `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || "—";
}

function skillSummary(member: EmployerProfile): string {
  if (!member.skills?.length) return "";
  return member.skills
    .map((skill) => (typeof skill === "string" ? skill : skill.name))
    .filter(Boolean)
    .join(", ");
}

export default function EmployerTeamPage() {
  const [members, setMembers] = useState<EmployerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<EmployerRole | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchTeam = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await TeamService.listTeam();
      if (response.success && response.data?.members) {
        setMembers(response.data.members);
      } else {
        setError(response.message || "Failed to load team");
      }
    } catch (err: any) {
      setError(err?.message || "Error loading team");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((member) => {
      const role = member.role ?? "";
      if (roleFilter && role !== roleFilter) return false;
      if (!q) return true;
      const name = memberName(member).toLowerCase();
      const email = (member.email ?? "").toLowerCase();
      const roleLabel = employerRoleLabel(role).toLowerCase();
      return name.includes(q) || email.includes(q) || roleLabel.includes(q) || role.toLowerCase().includes(q);
    });
  }, [members, query, roleFilter]);

  const handleInvite = async (data: TeamMemberCreate) => {
    setIsSubmitting(true);
    setInviteError(null);
    try {
      const response = await TeamService.inviteMember(data);
      if (response.success && response.data?.member) {
        setMembers((prev) => [...prev, response.data.member]);
        setIsModalOpen(false);
      } else {
        setInviteError(response.message || "Failed to invite team member");
      }
    } catch (err: any) {
      setInviteError(err?.message || "Failed to invite team member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusClass = (status?: EmployerProfileStatus) => {
    if (status === EmployerProfileStatus.ACTIVE) return styles.statusActive;
    if (status === EmployerProfileStatus.INVITED) return styles.statusInvited;
    if (status === EmployerProfileStatus.REJECTED) return styles.statusRejected;
    return styles.statusDisabled;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.fadeIn}`}>
          <div className={styles.headerFlex}>
            <div>
              <h1 className={styles.title}>Team</h1>
              <p className={styles.subtitle}>
                Manage recruiters and interviewers in your organization.
              </p>
            </div>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setInviteError(null);
                setIsModalOpen(true);
              }}
            >
              <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Team Member
            </button>
          </div>
        </div>

        <div className={styles.cardSmall}>
          <div className={styles.filterRow}>
            <input
              className={styles.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or role"
            />
            <select
              className={styles.select}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as EmployerRole | "")}
            >
              <option value="">All roles</option>
              <option value={EmployerRole.ADMIN}>Admin</option>
              <option value={EmployerRole.RECRUITER}>Recruiter</option>
              <option value={EmployerRole.INTERVIEWER}>Interviewer</option>
            </select>
          </div>
        </div>

        {error && (
          <div className={styles.errorInner}>
            <div>
              <h3>Error loading team</h3>
              <p>{error}</p>
            </div>
            <button type="button" className={styles.retryBtn} onClick={fetchTeam}>
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loaderWrap}>
            <div className={styles.loader}></div>
            <p>Loading your team...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className={`${styles.card} ${styles.empty}`}>
            <h3>No team members found</h3>
            <p>
              {query || roleFilter
                ? "No members match this search."
                : "Invite a recruiter or interviewer to get started."}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableCard}>
              <div className={styles.tableHead}>
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Job title</span>
              </div>
              {filteredMembers.map((member) => (
                <div key={member.id} className={styles.tableRow}>
                  <span className={styles.nameCell}>{memberName(member)}</span>
                  <span>{member.email || "—"}</span>
                  <span>
                    <span className={styles.roleBadge}>{employerRoleLabel(member.role) || "—"}</span>
                  </span>
                  <span>
                    <span className={`${styles.statusBadge} ${statusClass(member.status)}`}>
                      {employerProfileStatusLabel(member.status) || "—"}
                    </span>
                  </span>
                  <span>{member.job_title || "—"}</span>
                </div>
              ))}
            </div>

            <div className={styles.cardGrid}>
              {filteredMembers.map((member) => (
                <div key={`${member.id}-card`} className={styles.memberCard}>
                  <div className={styles.cardTop}>
                    <h3>{memberName(member)}</h3>
                    <span className={`${styles.statusBadge} ${statusClass(member.status)}`}>
                      {employerProfileStatusLabel(member.status) || "—"}
                    </span>
                  </div>
                  <p className={styles.meta}>{member.email || "—"}</p>
                  <p className={styles.meta}>
                    {employerRoleLabel(member.role) || "—"}
                    {member.job_title ? ` · ${member.job_title}` : ""}
                  </p>
                  {skillSummary(member) && <p className={styles.skills}>{skillSummary(member)}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AddTeamMemberModal
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        error={inviteError}
        onClose={() => {
          setIsModalOpen(false);
          setInviteError(null);
        }}
        onSubmit={handleInvite}
      />
    </div>
  );
}
