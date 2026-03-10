"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Job, JobStatus } from "@/types";
import { JobService } from "@/lib/api/services/jobs";
import styles from "./JobCard.module.css";
import JobModal from "./JobModal";

interface JobCardProps {
  job: Job;
  onStatusUpdate: (jobId: string, newStatus: JobStatus) => void;
  onDelete: (jobId: string) => void;
}

export default function JobCard({ job, onStatusUpdate, onDelete }: JobCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  const handleSave = (jobId: string) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  };

  const handleApply = (jobId: string) => {
    setAppliedJobs(prev => new Set(prev).add(jobId));
    // TODO: call your API here
  };

  const handleStatusUpdate = async (newStatus: JobStatus) => {
    setIsUpdating(true);
    try {
      const response = await JobService.updateJobStatus(job.id, newStatus);
      if (response.success) {
        onStatusUpdate(job.id, newStatus);
      } else {
        alert(response.errors || "Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      alert("An error occurred while updating the job status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;

    setIsUpdating(true);
    try {
      const response = await JobService.deleteJob(job.id);
      if (response.success) {
        onDelete(job.id);
      } else {
        alert(response.errors || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("An error occurred while deleting the job");
    } finally {
      setIsUpdating(false);
    }
  };

  const generateShareLink = () => {
    const jobTitle = job.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    return `/jobs/${jobTitle}-${job.id}`;
  };

  const copyToClipboard = async () => {
    const shareLink = generateShareLink();
    const fullUrl = `${window.location.origin}${shareLink}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      const textArea = document.createElement("textarea");
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const shareToSocial = (platform: string) => {
    const shareLink = generateShareLink();
    const fullUrl = `${window.location.origin}${shareLink}`;
    const text = `Check out this job opportunity: ${job.title}`;

    let url = "";
    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(text + " " + fullUrl)}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(job.title)}&body=${encodeURIComponent(text + "\n\n" + fullUrl)}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "width=600,height=400");
  };

  const getStatusBadgeClass = (status: JobStatus) => {
    switch (status) {
      case JobStatus.ACTIVE:
        return styles.statusActive;
      case JobStatus.PAUSED:
        return styles.statusPaused;
      case JobStatus.CLOSED:
        return styles.statusClosed;
      case JobStatus.DRAFT:
        return styles.statusDraft;
      default:
        return styles.statusDraft;
    }
  };

  const getSkillIcon = (skillName: string) => {
    const skill = skillName.toLowerCase();
    if (skill.includes("javascript") || skill.includes("js")) return "🟨";
    if (skill.includes("react")) return "⚛️";
    if (skill.includes("node")) return "🟩";
    if (skill.includes("python")) return "🐍";
    if (skill.includes("java")) return "☕";
    if (skill.includes("typescript") || skill.includes("ts")) return "🔷";
    return "🎯";
  };

  return (
    <>
      <div className={styles.jobCard} key={job.id} onClick={() => setSelectedJob(job)} style={{ cursor: 'pointer' }}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.headerRow}>
            <div className={styles.companyInfo}>
              <div className={styles.companyInitial}>{job.title.charAt(0).toUpperCase()}</div>

              <div className={styles.companyText}>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <p className={styles.companyName}>{job.category || "General"}</p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                className={styles.shareButton}
                title="Share job"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>

              <span className={`${styles.statusBadge} ${getStatusBadgeClass(job.status)}`}>
                {job.status}
              </span>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className={styles.jobDetails}>
          <div className={styles.detailItem}>
            <svg className={styles.detailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>
              {JobService.formatLocation(job.location)} {job.work_mode === "REMOTE" && "(Remote)"}
            </span>
          </div>

          <div className={styles.detailItem}>
            <svg className={styles.detailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>
              {job.job_type?.replace("_", " ")} • {job.experience_level}
            </span>
          </div>

          <div className={styles.detailItem}>
            <svg className={styles.detailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{JobService.formatSalaryRange(job)}</span>
          </div>

          <div className={styles.detailItem}>
            <svg className={styles.detailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className={styles.skillsContainer}>
            <h4>Key Skills:</h4>
            <div className={styles.skillsList}>
              {job.required_skills.slice(0, 5).map((skill, index) => (
                <span key={index} className={styles.skillTag}>
                  {getSkillIcon(skill)} {skill}
                </span>
              ))}

              {job.required_skills.length > 5 && (
                <span className={styles.moreSkills}>
                  +{job.required_skills.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statNumber}>{job.view_count}</div>
              <div className={styles.statLabel}>Views</div>
            </div>

            <div className={styles.statBox}>
              <div className={styles.statNumber}>{job.application_count}</div>
              <div className={styles.statLabel}>Applications</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.cardFooter}>
          <div className={styles.jobActions}>
            {job.status === JobStatus.DRAFT && (
              <button
                onClick={(e) => { e.preventDefault(); router.push(`/employer/jobs/${job.id}/edit`) }}
                disabled={isUpdating}
                className={styles.editButton}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
            )}



            {job.status !== JobStatus.DRAFT ? (
              <button
                onClick={(e) => { e.preventDefault(); router.push(`/employer/jobs/${job.id}/applications`) }}
                disabled={isUpdating}
                className={styles.trackButton}
              >
                📊 Track
              </button>
            )
              :
              (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(JobStatus.ACTIVE);
                    }}
                    disabled={isUpdating}
                    className={styles.publishButton}
                  >
                    Publish
                  </button>
                </>
              )}

            {(job.status === JobStatus.ACTIVE || job.status === JobStatus.PAUSED) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(job.status === JobStatus.ACTIVE ? JobStatus.PAUSED : JobStatus.ACTIVE);
                }}
                disabled={isUpdating}
                className={`${styles.statusButton} ${job.status === JobStatus.PAUSED ? styles.activate : ""}`}
              >
                {isUpdating ? (
                  "Updating..."
                ) : job.status === JobStatus.ACTIVE ? (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Activate
                  </>
                )}
              </button>
            )}

            {(job.status === JobStatus.ACTIVE || job.status === JobStatus.PAUSED) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(JobStatus.CLOSED);
                }}
                disabled={isUpdating}
                className={styles.closeJobButton}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {isUpdating ? "Closing..." : "Close"}
              </button>
            )}

            {job.status === JobStatus.CLOSED && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(JobStatus.ACTIVE);
                }}
                disabled={isUpdating}
                className={styles.reopenButton}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isUpdating ? "Reopening..." : "Reopen"}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isUpdating}
              className={styles.deleteButton}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {isUpdating ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsShareModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Share Job</h2>
              <p>Spread the word about this opportunity</p>

              <button onClick={() => setIsShareModalOpen(false)} className={styles.modalCloseButton}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.shareJobInfo}>
                <h3>{job.title}</h3>
                <p>{job.category}</p>
              </div>

              <div className={styles.shareOptions}>
                <h4>Share via:</h4>

                <div className={styles.socialButtons}>
                  <button onClick={() => shareToSocial("linkedin")} className={`${styles.socialButton} ${styles.linkedin}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </button>

                  <button onClick={() => shareToSocial("twitter")} className={`${styles.socialButton} ${styles.twitter}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    Twitter
                  </button>

                  <button onClick={() => shareToSocial("facebook")} className={`${styles.socialButton} ${styles.facebook}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>

                  <button onClick={() => shareToSocial("whatsapp")} className={`${styles.socialButton} ${styles.whatsapp}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    WhatsApp
                  </button>

                  <button onClick={() => shareToSocial("email")} className={`${styles.socialButton} ${styles.email}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M0 3v18h24V3H0zm21.518 2L12 12.713 2.482 5h19.036zM2 19V7.183l10 8.104 10-8.104V19H2z" />
                    </svg>
                    Email
                  </button>
                </div>

                <div className={styles.copyLinkSection}>
                  <h4>Or copy link:</h4>

                  <div className={styles.copyLinkContainer}>
                    <input
                      type="text"
                      value={`${window.location.origin}${generateShareLink()}`}
                      readOnly
                      className={styles.copyLinkInput}
                    />

                    <button
                      onClick={copyToClipboard}
                      className={`${styles.copyLinkButton} ${copySuccess ? styles.copySuccess : ""}`}
                    >
                      {copySuccess ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}



      {/* Modal — lives outside the card loop */}
      <JobModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onSave={handleSave}
        onApply={handleApply}
        isSaved={!!selectedJob && savedJobs.has(selectedJob.id)}
        isApplied={!!selectedJob && appliedJobs.has(selectedJob.id)}
      />
    </>
  );
}
