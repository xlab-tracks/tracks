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

/**
 * An activity spliced into the paper flow: an exercise card, an inline
 * lesson, an interactive demo (by registry id), or an exercise sequence
 * (a gated multi-part card over existing exercise ids — tap-reveal, choice,
 * and understanding-check types only).
 */
export type PaperInsertionItem =
  | { kind: "lesson"; id: string }
  | { kind: "exercise"; id: string }
  | { kind: "demo"; id: string }
  | { kind: "sequence"; exerciseIds: string[]; label?: string };

/**
 * A block or sentence in the converted paper, by stable anchor. Anchors and
 * sentence indices are deterministic per (arXiv version, converter version) —
 * discover them with `npm run arxiv:build -- --blocks <arxivId>`.
 */
export interface PaperBlockRef {
  /** data-anchor of the block, e.g. "b-0042". */
  anchor: string;
  /** 1-based sentence index (data-s) within the block. Omit = the whole block. */
  s?: number;
  /**
   * REQUIRED prefix (~first 5 words) of the target's normalized text — copy
   * it from the `--blocks` output (math renders as "⟨math⟩"). Self-documents
   * the edit and trips content.test.ts if the target drifts (e.g. after
   * re-pinning the arXiv version or a converter bump).
   */
  snippet: string;
}

/** End of a toc entry's subtree ("ax-sec-…" or a landmark id) — see `--toc`. */
export interface PaperSectionEndRef {
  sectionEnd: string;
}

export type PaperEditAnchor = PaperBlockRef | PaperSectionEndRef;

export function isSectionEndRef(ref: PaperEditAnchor): ref is PaperSectionEndRef {
  return "sectionEnd" in ref;
}

export type PaperEdit =
  /**
   * Hide a whole block, one sentence, or an inclusive sentence range
   * (`sEnd` requires `at.s`; same block only). Learners see an expandable
   * marker revealing the original. Consecutive hidden sibling blocks
   * (authored as consecutive hide ops) merge into a single marker.
   * `note` labels the marker, e.g. "Details of the optimizer schedule".
   */
  | { op: "hide"; at: PaperBlockRef; sEnd?: number; note?: string }
  /**
   * Authored editorial text, rendered with distinct styling. A sentence
   * target means inline-level markdown (a single paragraph); a block or
   * section target renders block-level markdown after it. `label` overrides
   * the card's "Note" eyebrow (block-level adds only).
   */
  | { op: "add"; after: PaperEditAnchor; markdown: string; label?: string }
  /** Activities (exercise cards / inline lessons) spliced into the flow. */
  | { op: "activity"; after: PaperEditAnchor; items: PaperInsertionItem[] };

export interface Paper {
  /** Globally unique across ALL content ids (lessons included). */
  id: string;
  /** Unique among the module's items; shares the /tracks/t/m/<slug> namespace. */
  slug: string;
  moduleId: string;
  title: string;
  source: PaperSource;
  /**
   * Editorial edits applied at render time: hide/add text, insert activities —
   * at section ends, between blocks, or between sentences. Inserted lessons
   * are regular Lesson entries NOT listed in any module's itemIds — they
   * render inside the paper and have no standalone page. Validated by
   * content.test.ts against the committed artifact.
   */
  edits?: PaperEdit[];
  estimatedMinutes?: number;
}

// ---------------------------------------------------------------------------
// Readers (several lessons concatenated into one long, numbered page)
// ---------------------------------------------------------------------------

/**
 * A reader stitches an ordered set of lessons into a single scrollable page —
 * each lesson's title becomes a top-level `#` section and its own headings
 * nest below, with generated 1.1.1 numbering. The combined body and its section
 * tree are precomputed at authoring time by `scripts/build-readers.ts` into
 * `src/content/readers/<id>.mdx` and `readers/tocs.generated.ts` (compiling as
 * one document keeps heading anchor ids unique). The section tree feeds the
 * same sidebar panel papers use. Referenced lessons are regular Lesson entries
 * NOT listed in any module's itemIds — they render only inside the reader.
 */
export interface Reader {
  /** Globally unique across ALL content ids. */
  id: string;
  /** Unique among the module's items; shares the /tracks/t/m/<slug> namespace. */
  slug: string;
  moduleId: string;
  title: string;
  /** Lessons concatenated into the page, in reading order. */
  lessonIds: string[];
  estimatedMinutes?: number;
}

/** One heading in a reader's precomputed section tree (sidebar + numbering). */
export interface ReaderTocEntry {
  /** Heading anchor id — matches rehype-slug on the combined document. */
  id: string;
  /** Heading text with any manual leading number stripped. */
  title: string;
  /** Generated hierarchical number, e.g. "2.1.3". */
  number: string;
  /** Markdown heading level: 1 (a lesson title) through 3 (depth-capped). */
  level: number;
}

/** A module's ordered content items (Module.itemIds resolved). */
export type ModuleItem =
  | { kind: "lesson"; lesson: Lesson }
  | { kind: "paper"; paper: Paper }
  | { kind: "reader"; reader: Reader };

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export type ClosedExerciseType =
  | "multiple-choice"
  | "multi-select"
  | "true-false"
  | "understanding-check"
  | "flowchart"
  | "tap-reveal"
  | "allocation"
  | "argue-reveal";

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

// --- Allocation (scenario-based resource allocation) ---

/** One agenda/workstream competing for people in an allocation exercise. */
export interface AllocationAgenda {
  id: string;
  label: string;
}

export const ALLOCATION_DEFAULT_STEP = 0.5;

/** One scenario the learner allocates under; presented in authored order. */
export interface AllocationScenario {
  id: string;
  title: string;
  description: string;
}

/**
 * A judgment exercise: divide a fixed pool of people across agendas once per
 * scenario, explaining each allocation. There is no answer key — the whole
 * definition is client-safe, and the recorded allocations/reasoning are
 * self-explanations, persisted (not graded) for signed-in learners.
 */
export interface AllocationExercise extends ExerciseBase {
  type: "allocation";
  /** Display title — shown on the intro step and in the exercises gallery. */
  title: string;
  agendas: AllocationAgenda[];
  scenarios: AllocationScenario[];
  /** Size of the pool to allocate in each scenario (e.g. 10 researchers). */
  totalPeople: number;
  /** Stepper increment; `totalPeople` must be a multiple. Default 0.5. */
  step?: number;
  /** Minimum reasoning length (chars) before a scenario can be advanced. */
  minReasoningChars?: number;
}

// --- Argue & reveal (respond to criticisms, then see a defender's response) ---

/** A toggleable concept chip offered while responding (tooltip on hover). */
export interface ArgueRevealConcept {
  id: string;
  label: string;
  tip: string;
}

/** One collapsible-toolbox reference section (e.g. a module recap). */
export interface ArgueRevealReading {
  heading: string;
  text: string;
}

/** One exchange: the critic's argument, then the defenders' response. */
export interface ArgueRevealRound {
  critique: string;
  /** Shown only after the learner submits their own response. */
  reveal: string;
}

/** One criticism to respond to; later rounds are the critic pushing back. */
export interface ArgueRevealItem {
  id: string;
  /** Short machine-ish label (used in exported results). */
  label: string;
  title: string;
  rounds: ArgueRevealRound[];
}

/** An assumption of the position that a constructed argument can attack. */
export interface ArgueRevealSurface {
  id: string;
  text: string;
}

/** Post-reveal self-assessment of the revealed response. */
export type ArgueRevealRating = "fully" | "partially" | "not-really";

export const ARGUE_REVEAL_RATINGS: ArgueRevealRating[] = [
  "fully",
  "partially",
  "not-really",
];

export const ARGUE_REVEAL_RATING_LABELS: Record<ArgueRevealRating, string> = {
  fully: "Fully",
  partially: "Partially",
  "not-really": "Not really",
};

/**
 * A judgment exercise: respond to a series of criticisms one at a time, then
 * see one response defenders give and self-rate it; ends by constructing a
 * novel argument against one of the position's assumptions. No answer key —
 * the reveals ship to the client by design (self-assessment); responses
 * persist (not graded) for signed-in learners.
 */
export interface ArgueRevealExercise extends ExerciseBase {
  type: "argue-reveal";
  /** Display title — shown on the intro step and in the exercises gallery. */
  title: string;
  /** Extra intro framing shown under the prompt. */
  guidance?: string;
  /** Line above the concept chips, e.g. "Which ideas are you drawing on?" */
  conceptsPrompt: string;
  concepts: ArgueRevealConcept[];
  /** Collapsible reference panel offered while responding. */
  toolboxLabel: string;
  toolbox: ArgueRevealReading[];
  items: ArgueRevealItem[];
  /** Line introducing each revealed defender response. */
  revealFraming: string;
  /** Self-assessment question once an item's rounds are all revealed. */
  postRevealPrompt: string;
  construction: {
    intro: string;
    surfaces: ArgueRevealSurface[];
  };
  /** Char bounds; defaults: response 80–450, residual 30–200, note ≤ 200. */
  responseMinChars?: number;
  responseMaxChars?: number;
  residualMinChars?: number;
  residualMaxChars?: number;
  noteMaxChars?: number;
}

export const ARGUE_REVEAL_DEFAULTS = {
  responseMinChars: 80,
  responseMaxChars: 450,
  residualMinChars: 30,
  residualMaxChars: 200,
  noteMaxChars: 200,
} as const;

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
  | AllocationExercise
  | ArgueRevealExercise
  | WritingExercise;

export const CLOSED_EXERCISE_TYPES: ClosedExerciseType[] = [
  "multiple-choice",
  "multi-select",
  "true-false",
  "understanding-check",
  "flowchart",
  "tap-reveal",
  "allocation",
  "argue-reveal",
];

export function isClosedExercise(
  exercise: Exercise,
): exercise is
  | ChoiceExercise
  | UnderstandingCheckExercise
  | FlowchartExercise
  | TapRevealExercise
  | AllocationExercise
  | ArgueRevealExercise {
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

/** Allocation/argue-reveal carry real titles; other types only have a kind. */
export function getExerciseDisplayTitle(exercise: Exercise): string {
  return exercise.type === "allocation" || exercise.type === "argue-reveal"
    ? exercise.title
    : EXERCISE_TYPE_LABELS[exercise.type];
}

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  "multiple-choice": "Multiple choice",
  "multi-select": "Select all that apply",
  "true-false": "True / false",
  "understanding-check": "Understanding check",
  flowchart: "Build the flow chart",
  "tap-reveal": "Quick recall",
  allocation: "Allocation exercise",
  "argue-reveal": "Argument exercise",
  "short-answer": "Short answer",
  "writing-prompt": "Writing prompt",
  memo: "Memo",
  essay: "Essay",
};
