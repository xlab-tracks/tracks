import type {
  ChoiceExercise,
  ExerciseOption,
  FlowchartBlock,
  FlowchartExercise,
  FlowchartNode,
} from "./types";

// Client-safe projection of a choice exercise — note it deliberately omits
// `correctOptionIds` and `explanation` so answer keys never ship to the client.
export interface PublicChoiceExercise {
  id: string;
  type: "multiple-choice" | "multi-select" | "true-false";
  prompt: string;
  options: ExerciseOption[];
  multiple: boolean;
  monospaceOptions: boolean;
}

export function toPublicChoice(exercise: ChoiceExercise): PublicChoiceExercise {
  return {
    id: exercise.id,
    type: exercise.type,
    prompt: exercise.prompt,
    options: exercise.options,
    multiple: exercise.type === "multi-select",
    monospaceOptions: exercise.monospaceOptions ?? false,
  };
}

/** Exact-match grading: every selected option must be correct, and vice versa. */
export function gradeChoice(exercise: ChoiceExercise, selected: string[]): boolean {
  const correct = new Set(exercise.correctOptionIds);
  if (selected.length !== correct.size) return false;
  return selected.every((id) => correct.has(id));
}

export interface GradeResult {
  correct: boolean;
  correctOptionIds: string[];
  explanation?: string;
}

// ---------------------------------------------------------------------------
// Flowchart exercises
// ---------------------------------------------------------------------------

// Client-safe projection: stage solutions and explanations stay on the server.
export interface PublicFlowchartStage {
  id: string;
  title: string;
  description: string;
}

export interface PublicFlowchartExercise {
  id: string;
  type: "flowchart";
  prompt: string;
  palette: FlowchartBlock[];
  stages: PublicFlowchartStage[];
}

export function toPublicFlowchart(
  exercise: FlowchartExercise,
): PublicFlowchartExercise {
  return {
    id: exercise.id,
    type: exercise.type,
    prompt: exercise.prompt,
    palette: exercise.palette,
    stages: exercise.stages.map(({ id, title, description }) => ({
      id,
      title,
      description,
    })),
  };
}

/**
 * Structural equality of two constructed charts: same blocks in the same
 * order, and branch arms match pairwise. Empty/omitted `branches` are
 * equivalent, so client-built trees compare cleanly against authored keys.
 */
export function flowchartEquals(a: FlowchartNode[], b: FlowchartNode[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((node, i) => {
    const other = b[i];
    if (node.blockId !== other.blockId) return false;
    const aArms = node.branches ?? [];
    const bArms = other.branches ?? [];
    if (aArms.length !== bArms.length) return false;
    return aArms.every((arm, j) => flowchartEquals(arm, bArms[j]));
  });
}

/** Grades one stage of a flowchart exercise against its server-only key. */
export function gradeFlowchartStage(
  exercise: FlowchartExercise,
  stageId: string,
  attempt: FlowchartNode[],
): boolean {
  const stage = exercise.stages.find((s) => s.id === stageId);
  if (!stage) return false;
  return flowchartEquals(stage.solution, attempt);
}

export interface FlowchartStageResult {
  correct: boolean;
  explanation?: string;
  /** Only present when the learner has earned/requested a reveal. */
  solution?: FlowchartNode[];
}
