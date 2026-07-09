// Content model for Tracks.
//
// The *content graph* (tracks, modules, lessons, exercises, assessments,
// resources) is static and code-defined — authored as typed data + MDX files in
// the repo. User/stateful data (progress, submissions) lives in Postgres and
// references these string IDs. Keep this file free of any DB or user-specific
// concepts.

export type PrerequisiteEnforcement = "soft" | "hard";
export type TrackKind = "foundations" | "technical" | "governance" | "example";

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
  /** Ordered content item IDs — lessons and papers, interleaved. */
  itemIds: string[];
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
  /**
   * Path (without extension) under `src/content/lessons` to the MDX body,
   * e.g. "foundations-fundamentals-intro".
   */
  contentRef: string;
  estimatedMinutes?: number;
}

// ---------------------------------------------------------------------------
// Papers (full-page inline readings with embedded activities)
// ---------------------------------------------------------------------------

/** Where a paper's rendered artifact comes from. Extend by adding kinds. */
export type PaperSource = { kind: "arxiv"; arxivId: string };

/** An activity spliced into the paper flow: an exercise card or an inline lesson. */
export interface PaperInsertionItem {
  kind: "lesson" | "exercise";
  id: string;
}

export interface PaperInsertion {
  /**
   * Heading id in the converted paper HTML ("ax-sec-…", or a landmark id like
   * "ax-abstract"). The insertion renders at the END of that (sub)section's
   * subtree — before the next heading of the same or shallower level.
   * Discover ids with `npm run arxiv:build -- --toc <arxivId>`; validated
   * against the committed artifact's toc by content.test.ts.
   */
  sectionId: string;
  /** Rendered top-to-bottom in array order. */
  items: PaperInsertionItem[];
}

export interface Paper {
  /** Globally unique across ALL content ids (lessons included). */
  id: string;
  /** Unique among the module's items; shares the /tracks/t/m/<slug> namespace. */
  slug: string;
  moduleId: string;
  title: string;
  source: PaperSource;
  /**
   * Inline activities at section boundaries. Inserted lessons are regular
   * Lesson entries that are NOT listed in any module's itemIds — they render
   * inside the paper and have no standalone page.
   */
  insertions?: PaperInsertion[];
  estimatedMinutes?: number;
}

/** A module's ordered content items (Module.itemIds resolved). */
export type ModuleItem =
  | { kind: "lesson"; lesson: Lesson }
  | { kind: "paper"; paper: Paper };

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export type ClosedExerciseType =
  | "multiple-choice"
  | "multi-select"
  | "true-false"
  | "understanding-check"
  | "flowchart"
  | "tap-reveal";

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
  /** Render option labels in a monospace/code style (e.g. "pick the line"). */
  monospaceOptions?: boolean;
}

export interface UnderstandingCheckExercise extends ExerciseBase {
  type: "understanding-check";
  /** Revealed after the learner self-attempts; not auto-graded. */
  sampleAnswer: string;
}

/** Self-assessment after a tap-reveal; recorded for future spaced repetition. */
export type TapRevealRating = "yes" | "partial" | "no";

export const TAP_REVEAL_RATINGS: TapRevealRating[] = ["yes", "partial", "no"];

/**
 * A quick recall card: a short question, an answer hidden until the learner
 * taps, then a yes / partial / no self-assessment.
 */
export interface TapRevealExercise extends ExerciseBase {
  type: "tap-reveal";
  answer: string;
}

// --- Flowchart construction ---

export type FlowchartBlockKind = "step" | "branch" | "terminal";

/** A palette block the learner can place while constructing a flowchart. */
export interface FlowchartBlock {
  id: string;
  label: string;
  kind: FlowchartBlockKind;
  /** Arm labels for branch blocks, in display order. */
  branchLabels?: string[];
}

/**
 * A placed block in a constructed chart. A chart is a sequence of nodes;
 * a branch node carries one child sequence per arm (in `branchLabels` order).
 */
export interface FlowchartNode {
  blockId: string;
  branches?: FlowchartNode[][];
}

/** One chart to construct (e.g. one protocol) within a flowchart exercise. */
export interface FlowchartStage {
  id: string;
  title: string;
  /** The prose being translated into a chart; shown behind a reveal toggle. */
  description: string;
  /** Answer key — server-only, stripped by `toPublicFlowchart`. */
  solution: FlowchartNode[];
  explanation?: string;
}

export interface FlowchartExercise extends ExerciseBase {
  type: "flowchart";
  /** Blocks shared by all stages, so wrong-but-plausible picks exist. */
  palette: FlowchartBlock[];
  stages: FlowchartStage[];
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
  | FlowchartExercise
  | TapRevealExercise
  | WritingExercise;

export const CLOSED_EXERCISE_TYPES: ClosedExerciseType[] = [
  "multiple-choice",
  "multi-select",
  "true-false",
  "understanding-check",
  "flowchart",
  "tap-reveal",
];

export function isClosedExercise(
  exercise: Exercise,
): exercise is
  | ChoiceExercise
  | UnderstandingCheckExercise
  | FlowchartExercise
  | TapRevealExercise {
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
  flowchart: "Build the flow chart",
  "tap-reveal": "Quick recall",
  "short-answer": "Short answer",
  "writing-prompt": "Writing prompt",
  memo: "Memo",
  essay: "Essay",
};
