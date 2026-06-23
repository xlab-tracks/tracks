import type { ChoiceExercise, ExerciseOption } from "./types";

// Client-safe projection of a choice exercise — note it deliberately omits
// `correctOptionIds` and `explanation` so answer keys never ship to the client.
export interface PublicChoiceExercise {
  id: string;
  type: "multiple-choice" | "multi-select" | "true-false";
  prompt: string;
  options: ExerciseOption[];
  multiple: boolean;
}

export function toPublicChoice(exercise: ChoiceExercise): PublicChoiceExercise {
  return {
    id: exercise.id,
    type: exercise.type,
    prompt: exercise.prompt,
    options: exercise.options,
    multiple: exercise.type === "multi-select",
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
