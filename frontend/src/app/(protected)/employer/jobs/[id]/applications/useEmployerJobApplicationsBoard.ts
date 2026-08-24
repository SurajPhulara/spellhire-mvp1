'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ApplicationService } from '@/lib/api/services/applications';

import type {
  EmployerJobApplicationsResponse,
} from '@/types/application';

import type { Pipeline } from '@/types/job';

import type {
  BoardApplication,
  BoardData,
  CardDropTarget,
  ApplicationsBoardController,
  StageDraft,
  StageDropTarget,
  StageRenderItem,
} from '@/types/applicationBoard';

import {
  buildStageMovePlan,
  isFixedStage,
  normalizeStages,
} from '@/components/employer/applicationsBoard/utils';

export default function useEmployerJobApplicationsBoard(
  job_id?: string
): ApplicationsBoardController {
  const [data, setData] =
    useState<BoardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const draggedApplicationIdRef =
    useRef<string | null>(null);

  const draggedStageIdRef =
    useRef<string | null>(null);

  const [
    draggedApplicationId,
    setDraggedApplicationId,
  ] = useState<string | null>(null);

  const [
    draggedStageId,
    setDraggedStageId,
  ] = useState<string | null>(null);

  const [
    cardDropTarget,
    setCardDropTarget,
  ] = useState<CardDropTarget>(null);

  const [
    stageDropTarget,
    setStageDropTarget,
  ] = useState<StageDropTarget>(null);

  const [
    stageDraft,
    setStageDraft,
  ] = useState<StageDraft>({
    name: '',
    description: '',
    color: '#4f46e5',
  });

  const [
    showStageModal,
    setShowStageModal,
  ] = useState(false);

  const [
    editingStageId,
    setEditingStageId,
  ] = useState<string | null>(null);

  const fetchBoard = async () => {
    if (!job_id) return;

    setLoading(true);

    try {
      const res =
        await ApplicationService.getEmployerJobApplications(
          job_id
        );

      if (res.success && res.data) {
        setData({
          ...(res.data as EmployerJobApplicationsResponse),
          applications:
            (res.data.applications as BoardApplication[]) ??
            [],
        });
      }
    } catch (err) {
      console.error(
        'Failed to load employer applications board:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [job_id]);

  const stages = useMemo(() => {
    if (!data) return [];

    return normalizeStages(
      data.pipeline_stages
    );
  }, [data]);

  const grouped = useMemo(() => {
    const result: Record<
      string,
      BoardApplication[]
    > = {};

    stages.forEach((stage) => {
      result[stage.id] = [];
    });

    (
      data?.applications ?? []
    ).forEach((app) => {
      if (
        !result[
          app.current_stage_id
        ]
      ) {
        result[
          app.current_stage_id
        ] = [];
      }

      result[
        app.current_stage_id
      ].push(app);
    });

    return result;
  }, [data, stages]);

  const stageRenderItems =
    useMemo<StageRenderItem[]>(() => {
      if (!data) return [];

      const current =
        normalizeStages(
          data.pipeline_stages
        );

      if (
        !draggedStageId ||
        !stageDropTarget
      ) {
        return current.map((stage) => ({
          kind: 'stage',
          stage,
        }));
      }

      const plan =
        buildStageMovePlan(
          current,
          draggedStageId,
          stageDropTarget.stageId,
          stageDropTarget.position
        );

      if (!plan) {
        return current.map((stage) => ({
          kind: 'stage',
          stage,
        }));
      }

      const items: StageRenderItem[] =
        [];

      current.forEach((stage) => {
        if (
          stage.id ===
            plan.target.id &&
          stageDropTarget.position ===
            'before'
        ) {
          items.push({
            kind: 'placeholder',
            key: `stage-placeholder-before-${plan.target.id}`,
            stageId:
              plan.target.id,
            position: 'before',
            accent:
              plan.source.color ??
              '#4f46e5',
          });
        }

        items.push({
          kind: 'stage',
          stage,
        });

        if (
          stage.id ===
            plan.target.id &&
          stageDropTarget.position ===
            'after'
        ) {
          items.push({
            kind: 'placeholder',
            key: `stage-placeholder-after-${plan.target.id}`,
            stageId:
              plan.target.id,
            position: 'after',
            accent:
              plan.source.color ??
              '#4f46e5',
          });
        }
      });

      return items;
    }, [
      data,
      draggedStageId,
      stageDropTarget,
    ]);

  const persistPipeline = async (
    nextStages: Pipeline[]
  ) => {
    if (!job_id || !data) {
      return false;
    }

    const ordered =
      nextStages.map(
        (stage, index) => ({
          ...stage,
          order: index + 1,
        })
      );

    const previous = data;

    setData((prev) =>
      prev
        ? {
            ...prev,
            pipeline_stages:
              ordered,
          }
        : prev
    );

    try {
      const res =
        await ApplicationService.updateJobPipeline(
          job_id,
          ordered
        );

      if (
        res.success &&
        res.data
      ) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                pipeline_stages:
                  normalizeStages(
                    res.data
                      .pipeline_stages
                  ),
              }
            : prev
        );

        return true;
      }

      setData(previous);
      return false;
    } catch (err) {
      console.error(
        'Failed to persist pipeline:',
        err
      );

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

  const closeStageModal = () => {
    setShowStageModal(false);
  };

  const openEditStage = (
    stage: Pipeline
  ) => {
    if (stage.locked) return;

    setEditingStageId(
      stage.id
    );

    setStageDraft({
      id: stage.id,
      name: stage.name,
      description:
        stage.description ?? '',
      color:
        stage.color ??
        '#4f46e5',
    });

    setShowStageModal(true);
  };

  const saveStage = async () => {
    if (
      !data ||
      !stageDraft.name.trim()
    ) {
      return;
    }

    const current = [
      ...data.pipeline_stages,
    ];

    const nextId =
      editingStageId ??
      `${stageDraft.name
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9]+/g,
          '-'
        )
        .replace(
          /^-+|-+$/g,
          ''
        )}-${Date.now()
        .toString()
        .slice(-4)}`;

    let nextStages: Pipeline[];

    if (editingStageId) {
      nextStages =
        current.map(
          (stage) =>
            stage.id ===
            editingStageId
              ? {
                  ...stage,
                  id: editingStageId,
                  name:
                    stageDraft.name.trim(),
                  description:
                    stageDraft.description.trim(),
                  color:
                    stageDraft.color,
                }
              : stage
        );
    } else {
      const newStage: Pipeline =
        {
          id: nextId,
          name:
            stageDraft.name.trim(),
          description:
            stageDraft.description.trim(),
          color:
            stageDraft.color,
          locked: false,
          order:
            current.length + 1,
          count: 0,
        };

      const fixedHead =
        current.filter(
          (s) =>
            s.id === 'applied' ||
            s.id ===
              'screening'
        );

      const custom =
        current.filter(
          (s) =>
            !isFixedStage(s.id)
        );

      const fixedTail =
        current.filter(
          (s) =>
            s.id === 'offer' ||
            s.id === 'rejected'
        );

      nextStages = [
        ...fixedHead,
        ...custom,
        newStage,
        ...fixedTail,
      ];
    }

    const ok =
      await persistPipeline(
        nextStages
      );

    if (ok) {
      setShowStageModal(false);
      setEditingStageId(null);
    }
  };

  const deleteStage = async (
    stageId: string
  ) => {
    if (!data) return;

    const stage =
      data.pipeline_stages.find(
        (s) => s.id === stageId
      );

    if (
      !stage ||
      stage.locked
    ) {
      return;
    }

    const cardsInStage =
      grouped[stageId] ?? [];

    if (
      cardsInStage.length >
        0 ||
      (stage.count ?? 0) >
        0
    ) {
      window.alert(
        'Move all candidates out of this stage before deleting it.'
      );

      return;
    }

    const current =
      normalizeStages(
        data.pipeline_stages
      );

    const nextStages =
      current.filter(
        (s) =>
          s.id !== stageId
      );

    await persistPipeline(
      nextStages
    );
  };

  const moveStage = async (
    stageId: string,
    direction:
      | 'left'
      | 'right'
  ) => {
    if (!data) return;

    const current =
      normalizeStages(
        data.pipeline_stages
      );

    const customStages =
      current.filter(
        (s) =>
          !isFixedStage(s.id)
      );

    const idx =
      customStages.findIndex(
        (s) =>
          s.id === stageId
      );

    if (idx < 0) return;

    const swapWith =
      direction === 'left'
        ? idx - 1
        : idx + 1;

    if (
      swapWith < 0 ||
      swapWith >=
        customStages.length
    ) {
      return;
    }

    [
      customStages[idx],
      customStages[
        swapWith
      ],
    ] = [
      customStages[
        swapWith
      ],
      customStages[idx],
    ];

    const reindexedCustom =
      customStages.map(
        (s, index) => ({
          ...s,
          order: index + 3,
        })
      );

    const fixedHead =
      current.filter(
        (s) =>
          s.id === 'applied' ||
          s.id === 'screening'
      );

    const fixedTail =
      current.filter(
        (s) =>
          s.id === 'offer' ||
          s.id === 'rejected'
      );

    await persistPipeline([
      ...fixedHead,
      ...reindexedCustom,
      ...fixedTail,
    ]);
  };

  const clearStageDrag =
    () => {
      draggedStageIdRef.current =
        null;

      setDraggedStageId(
        null
      );

      setStageDropTarget(
        null
      );
    };

  const startStageDrag = (
    stageId: string
  ) => {
    draggedStageIdRef.current =
      stageId;

    setDraggedStageId(
      stageId
    );

    setCardDropTarget(
      null
    );
  };

  const getMeaningfulStageDropTarget =
    (
      targetStageId: string,
      position:
        | 'before'
        | 'after'
    ): StageDropTarget => {
      if (!data) {
        return null;
      }

      const sourceStageId =
        draggedStageIdRef.current;

      if (
        !sourceStageId ||
        sourceStageId ===
          targetStageId
      ) {
        return null;
      }

      const plan =
        buildStageMovePlan(
          data.pipeline_stages,
          sourceStageId,
          targetStageId,
          position
        );

      if (!plan) {
        return null;
      }

      return {
        stageId:
          targetStageId,
        position,
      };
    };

  const updateStageDropTarget =
    (
      next: StageDropTarget
    ) => {
      setStageDropTarget(
        (prev) => {
          if (!next) {
            return prev ===
              null
              ? prev
              : null;
          }

          if (
            prev?.stageId ===
              next.stageId &&
            prev?.position ===
              next.position
          ) {
            return prev;
          }

          return next;
        }
      );
    };

  const dropStage = async (
    targetStageId: string,
    position:
      | 'before'
      | 'after'
  ) => {
    const sourceStageId =
      draggedStageIdRef.current;

    if (
      !sourceStageId ||
      sourceStageId ===
        targetStageId ||
      !data
    ) {
      return;
    }

    const plan =
      buildStageMovePlan(
        data.pipeline_stages,
        sourceStageId,
        targetStageId,
        position
      );

    if (!plan) return;

    const fixedHead =
      plan.current.filter(
        (s) =>
          s.id === 'applied' ||
          s.id === 'screening'
      );

    const fixedTail =
      plan.current.filter(
        (s) =>
          s.id === 'offer' ||
          s.id === 'rejected'
      );

    const reorderedCustom = [
      ...plan.nextCustom,
    ];

    reorderedCustom.splice(
      plan.insertIndex,
      0,
      plan.source
    );

    const reindexedCustom =
      reorderedCustom.map(
        (s, index) => ({
          ...s,
          order: index + 3,
        })
      );

    try {
      await persistPipeline([
        ...fixedHead,
        ...reindexedCustom,
        ...fixedTail,
      ]);
    } finally {
      clearStageDrag();
    }
  };

  const startApplicationDrag = (
    applicationId: string
  ) => {
    draggedApplicationIdRef.current =
      applicationId;

    setDraggedApplicationId(
      applicationId
    );

    setStageDropTarget(
      null
    );
  };

  const clearApplicationDrag =
    () => {
      draggedApplicationIdRef.current =
        null;

      setDraggedApplicationId(
        null
      );

      setCardDropTarget(
        null
      );
    };

  const updateCardDropTarget =
    (
      next: CardDropTarget
    ) => {
      setCardDropTarget(
        next
      );
    };

  const handleApplicationDrop =
    async (
      targetStageId: string
    ) => {
      const applicationId =
        draggedApplicationIdRef.current;

      if (
        !applicationId ||
        !job_id ||
        !data
      ) {
        return;
      }

      const dragged =
        data.applications.find(
          (a) =>
            a.application_id ===
            applicationId
        );

      if (
        !dragged ||
        dragged.current_stage_id ===
          targetStageId
      ) {
        clearApplicationDrag();
        return;
      }

      const previous = data;

      setData({
        ...data,

        applications:
          data.applications.map(
            (app) =>
              app.application_id ===
              applicationId
                ? {
                    ...app,
                    current_stage_id:
                      targetStageId,
                    stage_updated_at:
                      new Date().toISOString(),
                  }
                : app
          ),

        pipeline_stages:
          data.pipeline_stages.map(
            (stage) =>
              stage.id ===
              targetStageId
                ? {
                    ...stage,
                    count:
                      (stage.count ??
                        0) + 1,
                  }
                : stage.id ===
                    dragged.current_stage_id
                  ? {
                      ...stage,
                      count:
                        Math.max(
                          (stage.count ??
                            1) - 1,
                          0
                        ),
                    }
                  : stage
          ),
      });

      try {
        await ApplicationService.moveApplicationStage(
          job_id,
          applicationId,
          targetStageId
        );
      } catch (err) {
        console.error(
          'Failed to move application stage:',
          err
        );

        setData(previous);
      } finally {
        clearApplicationDrag();
      }
    };

  const saveNote = async (
    applicationId: string,
    nextNote: string
  ) => {
    if (
      !data ||
      !job_id
    ) {
      return;
    }

    const persistedNote =
      nextNote.trim()
        ? nextNote.trim()
        : null;

    setData({
      ...data,

      applications:
        data.applications.map(
          (app) =>
            app.application_id ===
            applicationId
              ? {
                  ...app,
                  notes: nextNote,
                }
              : app
        ),
    });

    try {
      await ApplicationService.updateApplicationNotes(
        job_id,
        applicationId,
        persistedNote
      );
    } catch (err) {
      console.error(
        'Failed to save note:',
        err
      );
    }
  };

  return {
    data,
    loading,

    draggedApplicationIdRef,
    draggedStageIdRef,

    draggedApplicationId,
    draggedStageId,

    cardDropTarget,
    stageDropTarget,

    stageDraft,
    setStageDraft,

    showStageModal,
    editingStageId,

    grouped,
    stageRenderItems,

    openAddStage,
    closeStageModal,
    openEditStage,
    saveStage,
    deleteStage,
    moveStage,

    clearStageDrag,
    startStageDrag,

    getMeaningfulStageDropTarget,
    updateStageDropTarget,
    dropStage,

    startApplicationDrag,
    clearApplicationDrag,
    updateCardDropTarget,
    handleApplicationDrop,

    saveNote,
  };
}