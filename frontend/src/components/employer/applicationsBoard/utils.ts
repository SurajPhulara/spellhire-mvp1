import type { DragEvent } from "react";

import type { Pipeline } from "@/types/job";

import type { StageMovePlan } from "@/types/applicationBoard";

export const PRESET_COLORS = [
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#4f46e5",
  "#6366f1",
  "#7c3aed",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#64748b",
];

export function timeAgo(input?: string | null): string {
  if (!input) return "N/A";

  const diff = Date.now() - new Date(input).getTime();

  const days = Math.floor(diff / 86400000);

  if (days <= 0) {
    return "Today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  if (days < 30) {
    return `${days} days ago`;
  }

  return `${Math.floor(days / 30)} months ago`;
}

export function getInitials(name?: string | null) {
  if (!name) return "C";

  const parts = name.split(" ").filter(Boolean);

  const first = parts[0]?.[0] ?? "";

  const last = parts[1]?.[0] ?? "";

  return `${first}${last}`.toUpperCase() || "C";
}

export function isFixedStage(stageId: string) {
  return ["applied", "screening", "offer", "rejected"].includes(stageId);
}

export function normalizeStages(stages: Pipeline[]): Pipeline[] {
  return [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getStageTone(stageId: string) {
  if (stageId === "applied") {
    return "applied";
  }

  if (stageId === "screening") {
    return "screening";
  }

  if (stageId === "offer") {
    return "offer";
  }

  if (stageId === "rejected") {
    return "rejected";
  }

  return "custom";
}

export function setDragPreview(event: DragEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  const clone = element.cloneNode(true) as HTMLElement;

  clone.style.position = "fixed";

  clone.style.top = "-1000px";

  clone.style.left = "-1000px";

  clone.style.width = `${rect.width}px`;

  clone.style.height = `${rect.height}px`;

  clone.style.pointerEvents = "none";

  clone.style.opacity = "0.95";

  clone.style.transform = "none";

  clone.style.boxShadow = "0 18px 40px rgba(15, 23, 42, 0.22)";

  document.body.appendChild(clone);

  event.dataTransfer.setDragImage(
    clone,
    Math.min(30, rect.width / 2),
    Math.min(30, rect.height / 2),
  );

  window.setTimeout(() => {
    document.body.removeChild(clone);
  }, 0);
}

export function getCardInsertionIndex(container: HTMLElement, clientY: number) {
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>('[data-candidate-card="true"]'),
  );

  for (let i = 0; i < cards.length; i += 1) {
    const rect = cards[i].getBoundingClientRect();

    if (clientY < rect.top + rect.height / 2) {
      return i;
    }
  }

  return cards.length;
}

export function buildStageMovePlan(
  stages: Pipeline[],
  draggedStageId: string,
  targetStageId: string,
  position: "before" | "after",
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

  if (sourceIndex < 0) {
    return null;
  }

  const nextCustom = customStages.filter((s) => s.id !== source.id);

  const targetIndex = nextCustom.findIndex((s) => s.id === target.id);

  if (targetIndex < 0) {
    return null;
  }

  const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;

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
