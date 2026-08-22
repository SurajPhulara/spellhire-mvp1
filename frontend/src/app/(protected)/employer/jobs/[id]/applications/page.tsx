'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FiActivity,
  FiArrowLeft,
  FiBookmark,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiExternalLink,
  FiLayers,
  FiMessageSquare,
  FiMove,
  FiPlus,
  FiSave,
  FiStar,
  FiTrash2,
  FiUsers,
  FiX,
  FiXCircle,
} from 'react-icons/fi';

import { ApplicationService } from '@/lib/api/services/applications';
import { EmployerJobApplicationsResponse, EmployerJobApplication } from '@/types/application';
import { Pipeline } from '@/types/job';
import styles from './page.module.css';

type BoardApplication = EmployerJobApplication;
type BoardData = {
  job: EmployerJobApplicationsResponse['job'];
  pipeline_stages: Pipeline[];
  stats: EmployerJobApplicationsResponse['stats'];
  applications: BoardApplication[];
};

type StageDraft = {
  id?: string;
  name: string;
  description: string;
  color: string;
};

type StageDropTarget = {
  stageId: string;
  position: 'before' | 'after';
} | null;

type CardDropTarget = {
  stageId: string;
  index: number;
} | null;

const PRESET_COLORS = [
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#4f46e5',
  '#6366f1',
  '#7c3aed',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#64748b',
];

function timeAgo(input?: string | null): string {
  if (!input) return 'N/A';
  const diff = Date.now() - new Date(input).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function getInitials(name?: string | null) {
  if (!name) return 'C';
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts[1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'C';
}

function isFixedStage(stageId: string) {
  return ['applied', 'screening', 'offer', 'rejected'].includes(stageId);
}

function normalizeStages(stages: Pipeline[]): Pipeline[] {
  return [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function getStageTone(stageId: string) {
  if (stageId === 'applied') return 'applied';
  if (stageId === 'screening') return 'screening';
  if (stageId === 'offer') return 'offer';
  if (stageId === 'rejected') return 'rejected';
  return 'custom';
}

function setDragPreview(event: React.DragEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const clone = element.cloneNode(true) as HTMLElement;

  clone.style.position = 'fixed';
  clone.style.top = '-1000px';
  clone.style.left = '-1000px';
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.pointerEvents = 'none';
  clone.style.opacity = '0.95';
  clone.style.transform = 'none';
  clone.style.boxShadow = '0 18px 40px rgba(15, 23, 42, 0.22)';

  document.body.appendChild(clone);
  event.dataTransfer.setDragImage(clone, Math.min(30, rect.width / 2), Math.min(30, rect.height / 2));
  window.setTimeout(() => {
    document.body.removeChild(clone);
  }, 0);
}

function getCardInsertionIndex(container: HTMLElement, clientY: number) {
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>('[data-candidate-card="true"]')
  );

  for (let i = 0; i < cards.length; i += 1) {
    const rect = cards[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return i;
    }
  }

  return cards.length;
}

function CandidateCard({
  application,
  stageColor,
  onDragStart,
  onDragEnd,
  note,
  onSaveNote,
}: {
  application: BoardApplication;
  stageColor: string;
  onDragStart: (applicationId: string) => void;
  onDragEnd: () => void;
  note: string;
  onSaveNote: (applicationId: string, nextNote: string) => void;
}) {
  const candidate = application.candidate;
  const fullName =
    candidate.full_name ||
    [candidate.first_name, candidate.last_name].filter(Boolean).join(' ') ||
    'Candidate';

  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [draftNote, setDraftNote] = useState(note);

  useEffect(() => {
    setDraftNote(note);
  }, [note]);

  const skills = (candidate.skills ?? []).slice(0, 4);

  const saveNote = () => {
    onSaveNote(application.application_id, draftNote.trim());
    setShowNoteEditor(false);
  };

  return (
    <div
      className={styles.candidateCard}
      data-candidate-card="true"
      draggable
      style={{ ['--accent' as any]: stageColor }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', application.application_id);
        setDragPreview(e, e.currentTarget as HTMLElement);
        onDragStart(application.application_id);
      }}
      onDragEnd={onDragEnd}
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
            {candidate.total_experience ? `${candidate.total_experience} yrs exp` : 'Experience not set'}
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

      {application.current_stage_id !== 'applied' && (
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
              {showNoteEditor ? 'Close' : note ? 'Edit' : 'Add note'}
            </button>
          </div>

          {note && !showNoteEditor && <div className={styles.notePreview}>{note}</div>}

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
                    setDraftNote(note);
                    setShowNoteEditor(false);
                  }}
                >
                  Cancel
                </button>
                <button type="button" className={styles.noteSave} onClick={saveNote}>
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

function CardDropPlaceholder() {
  return (
    <div className={styles.cardDropPlaceholder}>
      <FiMove size={14} />
      <span>Drop here</span>
    </div>
  );
}

function StageDropPlaceholder({
  accent,
  stageId,
  position,
  onDragOver,
  onDrop,
}: {
  accent: string;
  stageId: string;
  position: 'before' | 'after';
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={styles.stageDropPlaceholder}
      style={{ ['--accent' as any]: accent }}
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

type StageMovePlan = {
  source: Pipeline;
  target: Pipeline;
  current: Pipeline[];
  nextCustom: Pipeline[];
  insertIndex: number;
};

function buildStageMovePlan(
  stages: Pipeline[],
  draggedStageId: string,
  targetStageId: string,
  position: 'before' | 'after'
): StageMovePlan | null {
  const current = normalizeStages(stages);

  const source = current.find((s) => s.id === draggedStageId);
  const target = current.find((s) => s.id === targetStageId);

  if (
    !source ||
    !target ||
    source.locked ||
    target.locked ||
    isFixedStage(source.id) ||
    isFixedStage(target.id) ||
    source.id === target.id
  ) {
    return null;
  }

  const customStages = current.filter((s) => !isFixedStage(s.id));
  const sourceIndex = customStages.findIndex((s) => s.id === source.id);
  if (sourceIndex < 0) return null;

  const nextCustom = customStages.filter((s) => s.id !== source.id);
  const targetIndex = nextCustom.findIndex((s) => s.id === target.id);
  if (targetIndex < 0) return null;

  const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;

  if (insertIndex === sourceIndex) {
    return null;
  }

  return {
    source,
    target,
    current,
    nextCustom,
    insertIndex,
  };
}

type StageRenderItem =
  | { kind: 'stage'; stage: Pipeline }
  | { kind: 'placeholder'; key: string; stageId: string; position: 'before' | 'after'; accent: string };

export default function EmployerJobApplicationsPage() {
  const { id: job_id } = useParams<{ id: string }>();

  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);

  const draggedApplicationIdRef = useRef<string | null>(null);
  const draggedStageIdRef = useRef<string | null>(null);

  const [draggedApplicationId, setDraggedApplicationId] = useState<string | null>(null);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);

  const [cardDropTarget, setCardDropTarget] = useState<CardDropTarget>(null);
  const [stageDropTarget, setStageDropTarget] = useState<StageDropTarget>(null);

  const [stageDraft, setStageDraft] = useState<StageDraft>({
    name: '',
    description: '',
    color: '#4f46e5',
  });
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);

  const fetchBoard = async () => {
    if (!job_id) return;

    setLoading(true);
    try {
      const res = await ApplicationService.getEmployerJobApplications(job_id);
      if (res.success && res.data) {
        setData({
          ...(res.data as EmployerJobApplicationsResponse),
          applications: (res.data.applications as BoardApplication[]) ?? [],
        });
      }
    } catch (err) {
      console.error('Failed to load employer applications board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [job_id]);

  const stages = useMemo(() => {
    if (!data) return [];
    return normalizeStages(data.pipeline_stages);
  }, [data]);

  const grouped = useMemo(() => {
    const result: Record<string, BoardApplication[]> = {};
    stages.forEach((stage) => {
      result[stage.id] = [];
    });

    (data?.applications ?? []).forEach((app) => {
      if (!result[app.current_stage_id]) result[app.current_stage_id] = [];
      result[app.current_stage_id].push(app);
    });

    return result;
  }, [data, stages]);

  const stageRenderItems = useMemo<StageRenderItem[]>(() => {
    if (!data) return [];

    const current = normalizeStages(data.pipeline_stages);

    if (!draggedStageId || !stageDropTarget) {
      return current.map((stage) => ({ kind: 'stage', stage }));
    }

    const plan = buildStageMovePlan(current, draggedStageId, stageDropTarget.stageId, stageDropTarget.position);
    if (!plan) {
      return current.map((stage) => ({ kind: 'stage', stage }));
    }

    const items: StageRenderItem[] = [];

    current.forEach((stage) => {
      if (stage.id === plan.target.id && stageDropTarget.position === 'before') {
        items.push({
          kind: 'placeholder',
          key: `stage-placeholder-before-${plan.target.id}`,
          stageId: plan.target.id,
          position: 'before',
          accent: plan.source.color || '#4f46e5',
        });
      }

      items.push({ kind: 'stage', stage });

      if (stage.id === plan.target.id && stageDropTarget.position === 'after') {
        items.push({
          kind: 'placeholder',
          key: `stage-placeholder-after-${plan.target.id}`,
          stageId: plan.target.id,
          position: 'after',
          accent: plan.source.color || '#4f46e5',
        });
      }
    });

    return items;
  }, [data, draggedStageId, stageDropTarget]);

  const persistPipeline = async (nextStages: Pipeline[]) => {
    if (!job_id || !data) return false;

    const ordered = nextStages.map((stage, index) => ({
      ...stage,
      order: index + 1,
    }));

    const previous = data;

    setData((prev) =>
      prev
        ? {
            ...prev,
            pipeline_stages: ordered,
          }
        : prev
    );

    try {
      const res = await ApplicationService.updateJobPipeline(job_id, ordered);
      if (res.success && res.data) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                pipeline_stages: normalizeStages(res.data.pipeline_stages),
              }
            : prev
        );
        return true;
      }

      setData(previous);
      return false;
    } catch (err) {
      console.error('Failed to persist pipeline:', err);
      setData(previous);
      return false;
    }
  };

  const openAddStage = () => {
    setEditingStageId(null);
    setStageDraft({
      name: '',
      description: '',
      color: '#4f46e5',
    });
    setShowStageModal(true);
  };

  const openEditStage = (stage: Pipeline) => {
    if (stage.locked) return;
    setEditingStageId(stage.id);
    setStageDraft({
      id: stage.id,
      name: stage.name,
      description: stage.description ?? '',
      color: stage.color ?? '#4f46e5',
    });
    setShowStageModal(true);
  };

  const saveStage = async () => {
    if (!data || !stageDraft.name.trim()) return;

    const current = [...data.pipeline_stages];
    const nextId =
      editingStageId ??
      `${stageDraft.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')}-${Date.now().toString().slice(-4)}`;

    let nextStages: Pipeline[];

    if (editingStageId) {
      nextStages = current.map((stage) =>
        stage.id === editingStageId
          ? {
              ...stage,
              id: editingStageId,
              name: stageDraft.name.trim(),
              description: stageDraft.description.trim(),
              color: stageDraft.color,
            }
          : stage
      );
    } else {
      const newStage: Pipeline = {
        id: nextId,
        name: stageDraft.name.trim(),
        description: stageDraft.description.trim(),
        color: stageDraft.color,
        locked: false,
        order: current.length + 1,
        count: 0,
      };

      const fixedHead = current.filter((s) => s.id === 'applied' || s.id === 'screening');
      const custom = current.filter((s) => !isFixedStage(s.id));
      const fixedTail = current.filter((s) => s.id === 'offer' || s.id === 'rejected');

      nextStages = [...fixedHead, ...custom, newStage, ...fixedTail];
    }

    const ok = await persistPipeline(nextStages);
    if (ok) {
      setShowStageModal(false);
      setEditingStageId(null);
    }
  };

  const deleteStage = async (stageId: string) => {
    if (!data) return;
    const stage = data.pipeline_stages.find((s) => s.id === stageId);
    if (!stage || stage.locked) return;

    const cardsInStage = grouped[stageId] ?? [];
    if (cardsInStage.length > 0 || (stage.count ?? 0) > 0) {
      window.alert('Move all candidates out of this stage before deleting it.');
      return;
    }

    const current = normalizeStages(data.pipeline_stages);
    const nextStages = current.filter((s) => s.id !== stageId);
    await persistPipeline(nextStages);
  };

  const moveStage = async (stageId: string, direction: 'left' | 'right') => {
    if (!data) return;

    const current = normalizeStages(data.pipeline_stages);
    const customStages = current.filter((s) => !isFixedStage(s.id));
    const idx = customStages.findIndex((s) => s.id === stageId);
    if (idx < 0) return;

    const swapWith = direction === 'left' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= customStages.length) return;

    [customStages[idx], customStages[swapWith]] = [customStages[swapWith], customStages[idx]];

    const reindexedCustom = customStages.map((s, index) => ({
      ...s,
      order: index + 3,
    }));

    const fixedHead = current.filter((s) => s.id === 'applied' || s.id === 'screening');
    const fixedTail = current.filter((s) => s.id === 'offer' || s.id === 'rejected');

    await persistPipeline([...fixedHead, ...reindexedCustom, ...fixedTail]);
  };

  const clearStageDrag = () => {
    draggedStageIdRef.current = null;
    setDraggedStageId(null);
    setStageDropTarget(null);
  };

  const startStageDrag = (stageId: string) => {
    draggedStageIdRef.current = stageId;
    setDraggedStageId(stageId);
    setCardDropTarget(null);
  };

  const getMeaningfulStageDropTarget = (
    targetStageId: string,
    position: 'before' | 'after'
  ): StageDropTarget => {
    if (!data) return null;

    const draggedStageId = draggedStageIdRef.current;
    if (!draggedStageId || draggedStageId === targetStageId) return null;

    const plan = buildStageMovePlan(data.pipeline_stages, draggedStageId, targetStageId, position);
    if (!plan) return null;

    return {
      stageId: targetStageId,
      position,
    };
  };

  const updateStageDropTarget = (next: StageDropTarget) => {
    setStageDropTarget((prev) => {
      if (!next) {
        return prev === null ? prev : null;
      }

      if (prev?.stageId === next.stageId && prev.position === next.position) {
        return prev;
      }

      return next;
    });
  };

  const dropStage = async (targetStageId: string, position: 'before' | 'after') => {
    const sourceStageId = draggedStageIdRef.current;
    if (!sourceStageId || sourceStageId === targetStageId || !data) return;

    const plan = buildStageMovePlan(data.pipeline_stages, sourceStageId, targetStageId, position);
    if (!plan) return;

    const fixedHead = plan.current.filter((s) => s.id === 'applied' || s.id === 'screening');
    const fixedTail = plan.current.filter((s) => s.id === 'offer' || s.id === 'rejected');

    const reorderedCustom = [...plan.nextCustom];
    reorderedCustom.splice(plan.insertIndex, 0, plan.source);

    const reindexedCustom = reorderedCustom.map((s, index) => ({
      ...s,
      order: index + 3,
    }));

    try {
      await persistPipeline([...fixedHead, ...reindexedCustom, ...fixedTail]);
    } finally {
      clearStageDrag();
    }
  };

  const startApplicationDrag = (applicationId: string) => {
    draggedApplicationIdRef.current = applicationId;
    setDraggedApplicationId(applicationId);
    setStageDropTarget(null);
  };

  const clearApplicationDrag = () => {
    draggedApplicationIdRef.current = null;
    setDraggedApplicationId(null);
    setCardDropTarget(null);
  };

  const handleApplicationDrop = async (targetStageId: string) => {
    const applicationId = draggedApplicationIdRef.current;
    if (!applicationId || !job_id || !data) return;

    const dragged = data.applications.find((a) => a.application_id === applicationId);
    if (!dragged || dragged.current_stage_id === targetStageId) {
      clearApplicationDrag();
      return;
    }

    const previous = data;

    setData({
      ...data,
      applications: data.applications.map((app) =>
        app.application_id === applicationId
          ? { ...app, current_stage_id: targetStageId, stage_updated_at: new Date().toISOString() }
          : app
      ),
      pipeline_stages: data.pipeline_stages.map((stage) =>
        stage.id === targetStageId
          ? { ...stage, count: (stage.count ?? 0) + 1 }
          : stage.id === dragged.current_stage_id
            ? { ...stage, count: Math.max((stage.count ?? 1) - 1, 0) }
            : stage
      ),
    });

    try {
      await ApplicationService.moveApplicationStage(job_id, applicationId, targetStageId);
    } catch (err) {
      console.error('Failed to move application stage:', err);
      setData(previous);
    } finally {
      clearApplicationDrag();
    }
  };

  const saveNote = async (applicationId: string, nextNote: string) => {
    if (!data || !job_id) return;

    const persistedNote = nextNote.trim() ? nextNote.trim() : null;

    setData({
      ...data,
      applications: data.applications.map((app) =>
        app.application_id === applicationId ? { ...app, notes: nextNote } : app
      ),
    });

    try {
      await ApplicationService.updateApplicationNotes(job_id, applicationId, persistedNote);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  if (loading) {
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

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.pageContent}>
          <div className={styles.errorScreen}>
            <h2>Applications board not found</h2>
            <Link href="/employer/jobs" className={styles.backLink}>
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
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.pageIcon}>
              <FiLayers size={20} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{data.job.title}</h1>
              <p className={styles.pageSubtitle}>
                {data.job.organization_name ?? 'Organization'} · {data.stats.total_applications} applicants
              </p>
            </div>
          </div>

          <div className={styles.pageHeaderActions}>
            <a
              href={`/jobs/${data.job.id}`}
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
              <span className={styles.statLabel}>Total applicants</span>
            </div>
            <strong className={styles.statValue}>{data.stats.total_applications}</strong>
            <p className={styles.statSubtext}>All applications in this job</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statIcon}>
                <FiActivity size={14} />
              </span>
              <span className={styles.statLabel}>In review</span>
            </div>
            <strong className={styles.statValue}>{data.stats.in_review}</strong>
            <p className={styles.statSubtext}>Active candidates in pipeline</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statIcon}>
                <FiStar size={14} />
              </span>
              <span className={styles.statLabel}>Offers</span>
            </div>
            <strong className={styles.statValue}>{data.stats.offers}</strong>
            <p className={styles.statSubtext}>Candidates reached offer stage</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statIcon}>
                <FiXCircle size={14} />
              </span>
              <span className={styles.statLabel}>Rejected</span>
            </div>
            <strong className={styles.statValue}>{data.stats.rejected}</strong>
            <p className={styles.statSubtext}>Closed applications</p>
          </div>
        </div>

        <div className={styles.boardWrap}>
          <div className={styles.boardHeader}>
            <div>
              <p className={styles.sectionKicker}>Kanban board</p>
              <h2 className={styles.sectionTitle}>Move candidates between stages</h2>
            </div>

            <div className={styles.boardHeaderActions}>
              <button type="button" className={styles.addStageBtn} onClick={openAddStage}>
                <FiPlus size={14} />
                Add stage
              </button>
            </div>
          </div>

          <div className={styles.board}>
            {stageRenderItems.map((item) => {
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
                      const next = getMeaningfulStageDropTarget(item.stageId, item.position);
                      updateStageDropTarget(next);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dropStage(item.stageId, item.position);
                    }}
                  />
                );
              }

              const stage = item.stage;
              const cards = grouped[stage.id] ?? [];
              const tone = getStageTone(stage.id);
              const isCardHoverTarget = cardDropTarget?.stageId === stage.id && !!draggedApplicationId;

              const renderedCards: Array<BoardApplication | '__placeholder__'> = [...cards];
              if (isCardHoverTarget) {
                const insertIndex = Math.max(0, Math.min(cardDropTarget.index, renderedCards.length));
                renderedCards.splice(insertIndex, 0, '__placeholder__');
              }

              const accent = stage.color || '#3b82f6';

              return (
                <div
                  key={stage.id}
                  className={`${styles.column} ${styles[`column_${tone}`]} ${
                    draggedStageId === stage.id ? styles.columnDragging : ''
                  }`}
                  style={{ ['--accent' as any]: accent }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!draggedStageIdRef.current || stage.locked || isFixedStage(stage.id)) return;

                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const position: 'before' | 'after' =
                      e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';

                    const next = getMeaningfulStageDropTarget(stage.id, position);
                    updateStageDropTarget(next);
                  }}
                  onDrop={() => {
                    if (!stage.locked && stageDropTarget) {
                      dropStage(stageDropTarget.stageId, stageDropTarget.position);
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
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', stage.id);
                            const columnEl = (e.currentTarget as HTMLElement).closest(`.${styles.column}`);
                            if (columnEl instanceof HTMLElement) {
                              setDragPreview(e, columnEl);
                            }
                            startStageDrag(stage.id);
                          }}
                          onDragEnd={clearStageDrag}
                          title="Drag to reorder stage"
                        >
                          <FiMove size={13} />
                        </div>
                      )}

                      <div className={styles.stageInfoWrap} tabIndex={0}>
                        <div className={styles.stageInfoMain}>
                          <h3 className={styles.columnTitle}>{stage.name}</h3>

                          <p className={styles.columnSub}>{stage.description || 'Stage'}</p>
                        </div>

                        <div className={styles.stageTooltip} style={{ ['--accent' as any]: accent }}>
                          <div className={styles.stageTooltipTitle}>{stage.name}</div>
                          <div className={styles.stageTooltipDesc}>
                            {stage.description || 'No description available'}
                          </div>
                          <div className={styles.stageTooltipMeta}>
                            Count: {stage.count ?? cards.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.columnHeaderRight}>
                      <span className={styles.columnCount}>{stage.count ?? cards.length}</span>
                      {stage.locked ? (
                        <span className={styles.lockBadge}>Locked</span>
                      ) : (
                        <div className={styles.stageControls}>
                          <button
                            type="button"
                            className={styles.stageControlBtn}
                            onClick={() => moveStage(stage.id, 'left')}
                            title="Move left"
                          >
                            <FiChevronLeft size={13} />
                          </button>
                          <button
                            type="button"
                            className={styles.stageControlBtn}
                            onClick={() => moveStage(stage.id, 'right')}
                            title="Move right"
                          >
                            <FiChevronRight size={13} />
                          </button>
                          <button
                            type="button"
                            className={styles.stageControlBtn}
                            onClick={() => openEditStage(stage)}
                            title="Edit"
                          >
                            <FiEdit3 size={13} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.stageControlBtn} ${styles.stageDeleteBtn}`}
                            onClick={() => deleteStage(stage.id)}
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
                      if (!draggedApplicationIdRef.current) return;
                      const body = e.currentTarget as HTMLElement;
                      const index = getCardInsertionIndex(body, e.clientY);
                      setCardDropTarget({ stageId: stage.id, index });
                    }}
                    onDrop={() => handleApplicationDrop(stage.id)}
                  >
                    {renderedCards.length === 0 ? (
                      <div className={styles.emptyStage}>
                        <FiBookmark size={14} />
                        <p>Drop candidates here</p>
                      </div>
                    ) : (
                      renderedCards.map((item, index) =>
                        item === '__placeholder__' ? (
                          <CardDropPlaceholder key={`placeholder-${stage.id}-${index}`} />
                        ) : (
                          <CandidateCard
                            key={item.application_id}
                            application={item}
                            stageColor={accent}
                            onDragStart={startApplicationDrag}
                            onDragEnd={clearApplicationDrag}
                            note={item.notes ?? ''}
                            onSaveNote={saveNote}
                          />
                        )
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showStageModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowStageModal(false)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalKicker}>
                    {editingStageId ? 'Edit stage' : 'Add stage'}
                  </p>
                  <h3 className={styles.modalTitle}>
                    {editingStageId ? 'Update custom stage' : 'Create a custom stage'}
                  </h3>
                </div>

                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setShowStageModal(false)}
                >
                  <FiX size={14} />
                </button>
              </div>

              <div className={styles.modalFields}>
                <label className={styles.field}>
                  <span>Stage name</span>
                  <input
                    className={styles.input}
                    value={stageDraft.name}
                    onChange={(e) => setStageDraft((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Technical Round"
                  />
                </label>

                <label className={styles.field}>
                  <span>Description</span>
                  <input
                    className={styles.input}
                    value={stageDraft.description}
                    onChange={(e) => setStageDraft((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Candidate is being tested on role-specific skills"
                  />
                </label>

                <label className={styles.field}>
                  <span>Color</span>
                  <div className={styles.colorRow}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.colorSwatch} ${
                          stageDraft.color === c ? styles.colorSwatchActive : ''
                        }`}
                        style={{ background: c }}
                        onClick={() => setStageDraft((p) => ({ ...p, color: c }))}
                        title={c}
                      />
                    ))}
                  </div>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={() => setShowStageModal(false)}
                >
                  Cancel
                </button>
                <button type="button" className={styles.modalSave} onClick={saveStage}>
                  <FiCheck size={14} />
                  Save stage
                </button>
              </div>

              <p className={styles.modalNote}>
                Applied, Screening, Offer, and Rejected stay locked forever.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}