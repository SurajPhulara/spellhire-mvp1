import type {
    Dispatch,
    SetStateAction,
    RefObject,
  } from 'react';
  
  import type {
    EmployerJobApplicationsResponse,
    EmployerJobApplication,
  } from '@/types/application';
  
  import type { Pipeline } from '@/types/job';
  
  export type BoardApplication =
    EmployerJobApplication;
  
  export type BoardData = {
    job: EmployerJobApplicationsResponse['job'];
    pipeline_stages: Pipeline[];
    stats: EmployerJobApplicationsResponse['stats'];
    applications: BoardApplication[];
  };
  
  export type StageDraft = {
    id?: string;
    name: string;
    description: string;
    color: string;
  };
  
  export type StageDropTarget = {
    stageId: string;
    position: 'before' | 'after';
  } | null;
  
  export type CardDropTarget = {
    stageId: string;
    index: number;
  } | null;
  
  export type StageMovePlan = {
    source: Pipeline;
    target: Pipeline;
    current: Pipeline[];
    nextCustom: Pipeline[];
    insertIndex: number;
  };
  
  export type StageRenderItem =
    | {
        kind: 'stage';
        stage: Pipeline;
      }
    | {
        kind: 'placeholder';
        key: string;
        stageId: string;
        position: 'before' | 'after';
        accent: string;
      };
  
  export type ApplicationsBoardController = {
    data: BoardData | null;
    loading: boolean;
  
    draggedApplicationIdRef: RefObject<string | null>;
    draggedStageIdRef: RefObject<string | null>;
  
    draggedApplicationId: string | null;
    draggedStageId: string | null;
  
    cardDropTarget: CardDropTarget;
    stageDropTarget: StageDropTarget;
  
    stageDraft: StageDraft;
    setStageDraft: Dispatch<SetStateAction<StageDraft>>;
  
    showStageModal: boolean;
    editingStageId: string | null;
  
    grouped: Record<string, BoardApplication[]>;
    stageRenderItems: StageRenderItem[];
  
    openAddStage: () => void;
    closeStageModal: () => void;
    openEditStage: (stage: Pipeline) => void;
    saveStage: () => Promise<void>;
    deleteStage: (stageId: string) => Promise<void>;
    moveStage: (
      stageId: string,
      direction: 'left' | 'right'
    ) => Promise<void>;
  
    clearStageDrag: () => void;
    startStageDrag: (stageId: string) => void;
  
    getMeaningfulStageDropTarget: (
      targetStageId: string,
      position: 'before' | 'after'
    ) => StageDropTarget;
  
    updateStageDropTarget: (
      next: StageDropTarget
    ) => void;
  
    dropStage: (
      targetStageId: string,
      position: 'before' | 'after'
    ) => Promise<void>;
  
    startApplicationDrag: (
      applicationId: string
    ) => void;
  
    clearApplicationDrag: () => void;
  
    updateCardDropTarget: (
      next: CardDropTarget
    ) => void;
  
    handleApplicationDrop: (
      targetStageId: string
    ) => Promise<void>;
  
    saveNote: (
      applicationId: string,
      nextNote: string
    ) => Promise<void>;
  };