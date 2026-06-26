// Content model for Tracks.
//
// The *content graph* (tracks, modules, lessons, exercises, assessments,
// resources) is static and code-defined — authored as typed data + MDX files in
// the repo. User/stateful data (progress, submissions) lives in Postgres and
// references these string IDs. Keep this file free of any DB or user-specific
// concepts.

export type PrerequisiteEnforcement = "soft" | "hard";
export type TrackKind = "foundations" | "technical" | "governance";

export interface Track {
  id: string;
  slug: string;
  title: string;
  /** Short label for compact UI (sidebar headers, chips). */
  shortTitle?: string;
  description: string;
  kind: TrackKind;
  /** Ordered module IDs. */
  moduleIds: string[];
  /** How prerequisites gate access for this track's modules. */
  prerequisiteEnforcement: PrerequisiteEnforcement;
  estimatedHours?: number;
}

export interface Module {
  id: string;
  slug: string;
  trackId: string;
  title: string;
  summary: string;
  /** 1-based order within the track. */
  order: number;
  /** Module IDs that should be completed first; may live in another track. */
  prerequisiteModuleIds: string[];
  /** Ordered lesson IDs. */
  lessonIds: string[];
  /** End-of-module written assessment, if any. */
  assessmentId?: string;
  /** Resource-hub topic tags surfaced as "Further reading". */
  furtherReadingTopics?: string[];
  estimatedMinutes?: number;
}

export interface Lesson {
  id: string;
  slug: string;
  moduleId: string;
  title: string;
  /** 1-based order within the module. */
  order: number;
  /**
   * Path (without extension) under `src/content/lessons` to the MDX body,
   * e.g. "foundations-fundamentals-intro".
   */
  contentRef: string;
  estimatedMinutes?: number;
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export type ClosedExerciseType =
  | "multiple-choice"
  | "multi-select"
  | "true-false"
  | "understanding-check";

export type OpenExerciseType = "short-answer" | "writing-prompt" | "memo" | "essay";

export type ExerciseType = ClosedExerciseType | OpenExerciseType;

/** Deliverable formats that mirror the real policy/research pipeline. */
export type DeliverableFormat =
  | "free-form"
  | "memo"
  | "essay"
  | "research-summary"
  | "policy-memo"
  | "bill-draft"
  | "briefing";

export interface ExerciseOption {
  id: string;
  label: string;
}

export interface RubricCriterion {
  id: string;
  label: string;
  description?: string;
}

/** A labelled section in a structured writing deliverable. */
export interface WritingSection {
  id: string;
  label: string;
  placeholder?: string;
  guidance?: string;
}

interface ExerciseBase {
  id: string;
  type: ExerciseType;
  prompt: string;
}

export interface ChoiceExercise extends ExerciseBase {
  type: "multiple-choice" | "multi-select" | "true-false";
  options: ExerciseOption[];
  /** Option IDs that count as correct. Single entry for MC/true-false. */
  correctOptionIds: string[];
  explanation?: string;
}

export interface UnderstandingCheckExercise extends ExerciseBase {
  type: "understanding-check";
  /** Revealed after the learner self-attempts; not auto-graded. */
  sampleAnswer: string;
}

export interface WritingExercise extends ExerciseBase {
  type: OpenExerciseType;
  format: DeliverableFormat;
  /** Optional structured sections; when omitted, a single free-form editor. */
  sections?: WritingSection[];
  rubric?: RubricCriterion[];
  minWords?: number;
  maxWords?: number;
}

export type Exercise =
  | ChoiceExercise
  | UnderstandingCheckExercise
  | WritingExercise;

export const CLOSED_EXERCISE_TYPES: ClosedExerciseType[] = [
  "multiple-choice",
  "multi-select",
  "true-false",
  "understanding-check",
];

export function isClosedExercise(
  exercise: Exercise,
): exercise is ChoiceExercise | UnderstandingCheckExercise {
  return (CLOSED_EXERCISE_TYPES as string[]).includes(exercise.type);
}

export function isChoiceExercise(exercise: Exercise): exercise is ChoiceExercise {
  return (
    exercise.type === "multiple-choice" ||
    exercise.type === "multi-select" ||
    exercise.type === "true-false"
  );
}

export function isWritingExercise(exercise: Exercise): exercise is WritingExercise {
  return (
    exercise.type === "short-answer" ||
    exercise.type === "writing-prompt" ||
    exercise.type === "memo" ||
    exercise.type === "essay"
  );
}

// ---------------------------------------------------------------------------
// End-of-module assessment (a specialized written deliverable)
// ---------------------------------------------------------------------------

export interface Assessment {
  id: string;
  moduleId: string;
  title: string;
  format: DeliverableFormat;
  prompt: string;
  /** Section scaffold shown in the editor; format-appropriate. */
  sections: WritingSection[];
  rubric: RubricCriterion[];
  minWords?: number;
  maxWords?: number;
}

// ---------------------------------------------------------------------------
// External resources (centralized hub)
// ---------------------------------------------------------------------------

export type ResourceType =
  | "paper"
  | "video"
  | "course"
  | "book"
  | "blog"
  | "tool"
  | "interactive";

export type ResourceLevel = "intro" | "intermediate" | "advanced";

export interface ExternalResource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  /** Topic tags; modules pull "further reading" by matching these. */
  topics: string[];
  level: ResourceLevel;
  author?: string;
  note?: string;
  /**
   * `false` => background we deliberately do NOT teach (e.g. ML fundamentals);
   * surfaced as an explicit "learn this elsewhere" link.
   */
  coveredHere: boolean;
}

// Human-readable labels shared across UI.
export const DELIVERABLE_FORMAT_LABELS: Record<DeliverableFormat, string> = {
  "free-form": "Free response",
  memo: "Memo",
  essay: "Essay",
  "research-summary": "Research summary",
  "policy-memo": "Policy memo",
  "bill-draft": "Bill draft",
  briefing: "Briefing",
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  "multiple-choice": "Multiple choice",
  "multi-select": "Select all that apply",
  "true-false": "True / false",
  "understanding-check": "Understanding check",
  "short-answer": "Short answer",
  "writing-prompt": "Writing prompt",
  memo: "Memo",
  essay: "Essay",
};
