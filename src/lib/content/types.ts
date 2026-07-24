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
   * e.g. "foundations-fundamentals-intro". A body with two or more ##/###
   * headings automatically gets a paper-style section nav in the sidebar
   * (see rehype-lesson-sections) — sections live in the MDX, not here.
   */
  contentRef: string;
  estimatedMinutes?: number;
}

// ---------------------------------------------------------------------------
// Papers (full-page inline readings with embedded activities)
// ---------------------------------------------------------------------------

/**
 * Where a paper's rendered artifact comes from. Extend by adding kinds.
 * arXiv sources pin a version ("2301.12345v2"). Substack and LessWrong /
 * Alignment Forum sources give the public post URL — posts aren't
 * versioned, so the committed artifact (built by `npm run substack:build` /
 * `npm run lesswrong:build`) is the pin.
 */
export type PaperSource =
  | { kind: "arxiv"; arxivId: string }
  | { kind: "substack"; postUrl: string }
  | { kind: "lesswrong"; postUrl: string };

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
 * sentence indices are deterministic per (source version, converter version) —
 * discover them with the source's build CLI: `npm run arxiv:build --
 * --blocks <arxivId>`, or `npm run substack:build` / `npm run
 * lesswrong:build` `-- --blocks <postUrl>`.
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

/** End of a toc entry's subtree ("ax-sec-…"/"sb-sec-…"/"lw-sec-…" or a landmark id) — see `--toc`. */
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
   * `silent: true` instead removes the content outright — no marker,
   * nothing to expand (`note` is illegal there); pair it with an `add`
   * targeting the range's last unit (or the block itself) to splice in
   * editorial replacement text.
   */
  | { op: "hide"; at: PaperBlockRef; sEnd?: number; note?: string; silent?: true }
  /**
   * Authored editorial text, rendered with distinct styling. A sentence
   * target means inline-level markdown (a single paragraph); a block or
   * section target renders block-level markdown after it. `label` overrides
   * the card's "Note" eyebrow (block-level adds only).
   */
  | { op: "add"; after: PaperEditAnchor; markdown: string; label?: string }
  /** Activities (exercise cards / inline lessons) spliced into the flow. */
  | { op: "activity"; after: PaperEditAnchor; items: PaperInsertionItem[] }
  /**
   * Wrap a phrase of the target block/sentence in a glossary hover-card
   * trigger. `termId` references an entry in `src/content/glossary.json`;
   * `phrase` is the exact text to wrap — first occurrence inside the target,
   * whitespace-flexible, and it must be plain running text (a phrase broken
   * by a link, citation, math, or other inline markup does not match —
   * content.test.ts runs the exact matcher). Never targets a sectionEnd.
   */
  | { op: "gloss"; at: PaperBlockRef; termId: string; phrase: string }
  /**
   * A reading gate: everything after the anchor (to the end of the paper) is
   * withheld until the learner taps through. `prompt` is authored markdown
   * for the think-first card shown on the gate ("Before reading on: come up
   * with three ways…"); without it the gate is a bare "Tap to continue".
   * Friction, not security — the content ships in the payload, and the
   * opened state persists client-side only. Gates target section ends or
   * whole blocks; sentence-level targets are not supported (enforced by
   * content.test.ts). `id` must be unique within the paper and stable — it
   * keys the learner's opened state.
   */
  | { op: "gate"; after: PaperEditAnchor; id: string; prompt?: string; cta?: string };

/** The block/section target of any edit op, regardless of its field name. */
export function editTargetRef(edit: PaperEdit): PaperEditAnchor {
  return edit.op === "hide" || edit.op === "gloss" ? edit.at : edit.after;
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
   * Editorial edits applied at render time: hide/add text, insert activities —
   * at section ends, between blocks, or between sentences. Inserted lessons
   * are regular Lesson entries NOT listed in any module's itemIds — they
   * render inside the paper and have no standalone page. Validated by
   * content.test.ts against the committed artifact.
   */
  edits?: PaperEdit[];
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
  | "tap-reveal"
  | "allocation"
  | "argue-reveal"
  | "control-scenarios"
  | "staged-questions"
  | "commit-construct";

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
  /**
   * Course-numbering chip shown instead of the generic type label,
   * e.g. "Exercise 2.1".
   */
  numberLabel?: string;
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
  /** Self-assessment question once an item's rounds are all revealed.
   * Optional: when absent, the post-reveal rating + note step is skipped. */
  postRevealPrompt?: string;
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

// --- Control scenarios (pre-commit reasoning on control-protocol setups) ---

/** Actor identities that color/letter flow-graph nodes and the cast card. */
export type ControlActorId = "u" | "uprime" | "t" | "h";

/**
 * One actor in the cast: shown on the definitions card and the slim
 * per-scenario legend (unless `hidden`), and restated as node tooltips.
 */
export interface ControlActor {
  id: ControlActorId;
  letter: string;
  /** Short handle, e.g. "the untrusted model". */
  name: string;
  /** Full one-line definition (cast card + node tooltip). */
  definition: string;
  /** Compressed form for the slim legend row. */
  legend: string;
  /** Tooltip-only actors (U′) stay off the cast card and legend. */
  hidden?: boolean;
}

/** A node in a scenario's flow graph, positioned in viewBox coordinates. */
export interface ControlFlowNode {
  id: string;
  /** Center of the node in the graph's viewBox. */
  x: number;
  y: number;
  kind: "actor" | "terminal" | "junction" | "compare";
  /** Actor identity — drives color and tooltip; actor nodes only. */
  actor?: ControlActorId;
  /** Node text: the actor letter, or a terminal/compare label. */
  label?: string;
  /** Role chip inside actor nodes: agent / monitor / auditor / editor. */
  role?: string;
  /** Short annotation under the node ("scores every edit"). */
  note?: string;
  /** Horizontal nudge for the note, when an edge would cross it. */
  noteDx?: number;
}

export type ControlFlowSide = "left" | "right" | "top" | "bottom";

/**
 * A dashed, animated edge. Dashes travel in draw (from → to) direction, so a
 * loop edge drawn monitor → agent animates in the return direction for free.
 */
export interface ControlFlowEdge {
  from: string;
  to: string;
  /** Which node side the edge leaves / enters (defaults: right → left). */
  fromSide?: ControlFlowSide;
  toSide?: ControlFlowSide;
  /**
   * Anchor displacement along the side's axis (y for left/right sides, x for
   * top/bottom), so parallel edges sharing a side don't overlap.
   */
  fromOffset?: number;
  toOffset?: number;
  /** Pill label riding the edge ("top 2%"); `chipLine2` wraps long chips. */
  chip?: string;
  chipLine2?: string;
  /** Bare condition label near the edge ("malicious", "else"). */
  cond?: string;
  /** 0–1 position of the chip/cond along the path (default 0.5). */
  labelT?: number;
  /** Fine-tune label placement in viewBox px. */
  labelDx?: number;
  labelDy?: number;
  /** Loop-back edge: bows outward instead of the default S-curve. */
  loop?: boolean;
}

export interface ControlFlowGraph {
  /** viewBox size; the rendered SVG scales to the width available to it. */
  width: number;
  height: number;
  nodes: ControlFlowNode[];
  edges: ControlFlowEdge[];
}

export interface ControlScenario {
  id: string;
  /** What the learner sees as the scenario heading (protocol names don't). */
  displayTitle: string;
  /** Setup description, shown verbatim. */
  card: string;
  /** The unacceptable-outcome chip text. */
  outcome: string;
  /** Bold setup-name line opening the reveal ("This is trusted monitoring."). */
  revealName: string;
  /** Ideal explanation, shown verbatim after the learner submits. */
  reveal: string;
  graph: ControlFlowGraph;
}

/**
 * A pre-commit reasoning exercise over control-protocol setups: one scenario
 * at a time, the learner writes freeform reasoning about whether the control
 * property holds, then a reveal names the setup and gives the ideal
 * explanation for self-comparison. Deliberately no verdict control and no
 * grading — reveals ship to the client by design; answers persist (not
 * graded) for signed-in learners.
 */
export interface ControlScenariosExercise extends ExerciseBase {
  type: "control-scenarios";
  /** Block title ("Run the evaluation — 5 scenarios"). */
  title: string;
  /** The recurring question, asked identically for every scenario. */
  question: string;
  /** Answer textarea placeholder. */
  placeholder: string;
  actors: ControlActor[];
  scenarios: ControlScenario[];
}

// --- Staged questions (free-text reasoning prompts with staged reveals) ---

/** One free-text question: framing → bold question → submit → reveal. */
export interface StagedQuestion {
  id: string;
  /** Question heading ("Why is a catch a win?"). */
  title: string;
  /** 1–3 framing sentences shown before the question. */
  framing?: string;
  /** The question itself, rendered bold. */
  question: string;
  /** Extra instruction line under the question (e.g. "describe a case…"). */
  instruction?: string;
  /** Optional reveal opener: one-line acknowledgement of a good answer. */
  acknowledgement?: string;
  /** Reveal substance; `\n\n` separates paragraphs. */
  reveal: string;
  /** Intro line for labelled examples, when the reveal enumerates cases. */
  examplesIntro?: string;
  /** Labelled example cases rendered after the substance. */
  examples?: { label: string; text: string }[];
  /** Optional forward pointer closing the reveal. */
  forward?: string;
  /** Substring of `forward` to render as a link, with its destination. */
  forwardLinkText?: string;
  forwardHref?: string;
  /** Interactive widget rendered at the end of the reveal (by registry key). */
  revealWidget?: "control-timeline";
  /** Hint text, hidden behind a "Show hint" toggle until requested. */
  hint?: string;
}

/** A titled group of questions ("Part A — Catching a model red-handed"). */
export interface StagedQuestionPart {
  id: string;
  title: string;
  questions: StagedQuestion[];
}

/**
 * A multi-part block of free-text reasoning prompts with staged reveals,
 * presented one part at a time in the paper's understanding-check format:
 * each Submit commits that question's answer and opens its reveal —
 * acknowledgement, substance, optional forward pointer. No grading — reveals
 * ship to the client by design; answers persist (not graded) for signed-in
 * learners.
 */
export interface StagedQuestionsExercise extends ExerciseBase {
  type: "staged-questions";
  /** Block title ("Why catching counts, and where evaluation runs out"). */
  title: string;
  parts: StagedQuestionPart[];
  /** Answer textarea placeholder. */
  placeholder?: string;
  /**
   * Persistent figure rendered above every part (by registry key), for
   * exercises whose questions all reason about one shared picture.
   */
  figureWidget?: "two-worlds";
}

// --- Commit & construct (commit to a view, then build the counterexample) ---

export interface CommitConstructOption {
  id: string;
  label: string;
}

/**
 * A two-part exercise in the paper's understanding-check format. Part 1: the
 * learner commits to one of two views, rates their confidence, and explains
 * their reasoning — submit opens a course-correction reveal. Part 2: they
 * construct a concrete threat model (a short outcome plus a longer
 * construction, with guidance conditioned on their Part 1 choice and an
 * initially hidden hint) — submit opens the worked-example reveal and
 * comparison questions. No grading; responses persist for signed-in learners.
 */
export interface CommitConstructExercise extends ExerciseBase {
  type: "commit-construct";
  title: string;
  commit: {
    /** Step heading ("Commit to a view"). */
    partTitle: string;
    framing?: string;
    /** The question itself, rendered bold. */
    question: string;
    /** Follow-on framing after the question (the thought experiment). */
    supposition?: string;
    instruction?: string;
    options: CommitConstructOption[];
    confidencePrompt: string;
    confidenceOptions: CommitConstructOption[];
    /** Course-correction reveal; `\n\n` separates paragraphs. */
    reveal: string;
  };
  construct: {
    /** Step heading ("Construct the threat model"). */
    partTitle: string;
    /** The single construction prompt (names the outcome and asks how). */
    threatPrompt: string;
    /** Constraint line shown under the construction prompt. */
    constraint?: string;
    /** Extra guidance keyed by the Part 1 choice id. */
    guidanceByChoice?: Record<string, string>;
    /** Hidden until the learner asks for it. */
    hint?: string;
    /** Bold opening line of the reveal. */
    revealLead: string;
    reveal: string;
    /** Line introducing the comparison against the learner's construction. */
    compareIntro: string;
    compareQuestions: string[];
    closing?: string;
  };
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
  | AllocationExercise
  | ArgueRevealExercise
  | ControlScenariosExercise
  | StagedQuestionsExercise
  | CommitConstructExercise
  | WritingExercise;

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
  /**
   * In-app viewer for this resource (e.g. a course paper's
   * /tracks/t/m/slug page). When set, the hub links here instead of `url`;
   * `url` stays the canonical external source (dedupe, linked-readings checks).
   */
  internalHref?: string;
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

/** Some judgment-exercise types carry real titles; others only have a kind. */
export function getExerciseDisplayTitle(exercise: Exercise): string {
  return exercise.type === "allocation" ||
    exercise.type === "argue-reveal" ||
    exercise.type === "control-scenarios" ||
    exercise.type === "staged-questions" ||
    exercise.type === "commit-construct"
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
  "control-scenarios": "Scenario exercise",
  "staged-questions": "Reasoning prompts",
  "commit-construct": "Commit & construct",
  "short-answer": "Short answer",
  "writing-prompt": "Writing prompt",
  memo: "Memo",
  essay: "Essay",
};
