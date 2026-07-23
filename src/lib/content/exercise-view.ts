import {
  ALLOCATION_DEFAULT_STEP,
  ARGUE_REVEAL_DEFAULTS,
  ARGUE_REVEAL_RATINGS,
  type AllocationExercise,
  type ArgueRevealExercise,
  type ArgueRevealRating,
  type ChoiceExercise,
  type CommitConstructExercise,
  type ControlScenariosExercise,
  type StagedQuestionsExercise,
  type ExerciseOption,
  type FlowchartBlock,
  type FlowchartExercise,
  type FlowchartNode,
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
  // Dedupe first: a direct POST of ["a","a"] must not pass as {"a","b"}.
  const chosen = new Set(selected);
  if (chosen.size !== correct.size) return false;
  for (const id of chosen) if (!correct.has(id)) return false;
  return true;
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

/**
 * Structurally re-validates a posted flowchart attempt (reachable by direct
 * POST): only known block ids, bounded breadth (≤20 nodes, ≤5 arms) and depth
 * (≤8). Returns the cleaned tree or null. Lives here beside its tested
 * siblings; the grade action calls it before grading/persisting.
 */
export function sanitizeFlowchartAttempt(
  value: unknown,
  validBlockIds: Set<string>,
  depth = 0,
): FlowchartNode[] | null {
  if (!Array.isArray(value) || value.length > 20 || depth > 8) return null;
  const nodes: FlowchartNode[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const { blockId, branches } = item as Record<string, unknown>;
    if (typeof blockId !== "string" || !validBlockIds.has(blockId)) return null;
    const node: FlowchartNode = { blockId };
    if (branches !== undefined) {
      if (!Array.isArray(branches) || branches.length > 5) return null;
      const arms: FlowchartNode[][] = [];
      for (const arm of branches) {
        const sanitized = sanitizeFlowchartAttempt(arm, validBlockIds, depth + 1);
        if (!sanitized) return null;
        arms.push(sanitized);
      }
      node.branches = arms;
    }
    nodes.push(node);
  }
  return nodes;
}

export interface FlowchartStageResult {
  correct: boolean;
  explanation?: string;
  /** Only present when the learner has earned/requested a reveal. */
  solution?: FlowchartNode[];
}

// ---------------------------------------------------------------------------
// Allocation exercises
// ---------------------------------------------------------------------------

/** Hard cap on persisted reasoning length (the UI caps input to match). */
export const ALLOCATION_MAX_REASONING_CHARS = 10_000;

/** One scenario's record inside `Submission.responseJson.scenarios`. */
export interface AllocationScenarioEntry {
  /** People per agenda id — every agenda present, nothing else. */
  allocation: Record<string, number>;
  reasoning: string;
}

/** Steps are halves by default, so float remainders need an epsilon. */
function isMultipleOf(value: number, step: number): boolean {
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < 1e-9;
}

// Postgres jsonb cannot store \u0000, and lone surrogates don't survive a
// JSON round-trip — both would make the persisted row diverge or error.
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

export function isStorableText(value: string): boolean {
  return !value.includes("\u0000") && !LONE_SURROGATE.test(value);
}

/**
 * Validates a posted scenario attempt against the exercise definition: known
 * scenario, exactly the exercise's agenda ids, each value a finite non-negative
 * multiple of the step, the pool exactly spent, and the reasoning within
 * length bounds. Returns null when anything is off (reachable by direct POST).
 */
export function sanitizeAllocationScenario(
  exercise: AllocationExercise,
  scenarioId: unknown,
  allocation: unknown,
  reasoning: unknown,
): AllocationScenarioEntry | null {
  if (typeof scenarioId !== "string") return null;
  if (!exercise.scenarios.some((s) => s.id === scenarioId)) return null;
  if (typeof reasoning !== "string" || !isStorableText(reasoning)) return null;
  const minChars = exercise.minReasoningChars ?? 0;
  if (reasoning.trim().length < minChars) return null;
  if (reasoning.length > ALLOCATION_MAX_REASONING_CHARS) return null;

  if (typeof allocation !== "object" || allocation === null) return null;
  const posted = allocation as Record<string, unknown>;
  if (Object.keys(posted).length !== exercise.agendas.length) return null;

  const step = exercise.step ?? ALLOCATION_DEFAULT_STEP;
  const clean: Record<string, number> = {};
  let sum = 0;
  for (const agenda of exercise.agendas) {
    const value = posted[agenda.id];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    if (value < 0 || value > exercise.totalPeople) return null;
    if (!isMultipleOf(value, step)) return null;
    // Persist the canonical grid point, not the raw float (a direct POST may
    // send e.g. 2.5000000001, which the epsilon above accepts).
    const snapped = Math.round(value / step) * step;
    clean[agenda.id] = snapped;
    sum += snapped;
  }
  if (Math.abs(sum - exercise.totalPeople) > 1e-9) return null;

  return { allocation: clean, reasoning };
}

// ---------------------------------------------------------------------------
// Control-scenario exercises
// ---------------------------------------------------------------------------

/** Hard cap on a persisted scenario answer (the UI caps input to match). */
export const CONTROL_SCENARIO_MAX_ANSWER_CHARS = 10_000;

/** One scenario's record inside `Submission.responseJson.scenarios`. */
export interface ControlScenarioEntry {
  answer: string;
}

/**
 * Validates a posted scenario answer against the exercise definition: known
 * scenario, non-empty storable text within length bounds. Returns null when
 * anything is off (reachable by direct POST).
 */
export function sanitizeControlScenarioAnswer(
  exercise: ControlScenariosExercise,
  scenarioId: unknown,
  answer: unknown,
): ControlScenarioEntry | null {
  if (typeof scenarioId !== "string") return null;
  if (!exercise.scenarios.some((s) => s.id === scenarioId)) return null;
  if (typeof answer !== "string" || !isStorableText(answer)) return null;
  if (answer.trim().length < 1) return null;
  if (answer.length > CONTROL_SCENARIO_MAX_ANSWER_CHARS) return null;
  return { answer };
}

// ---------------------------------------------------------------------------
// Staged-question exercises
// ---------------------------------------------------------------------------

/** One question's record inside `Submission.responseJson.questions`. */
export interface StagedQuestionEntry {
  answer: string;
}

/**
 * Validates a posted question answer against the exercise definition: known
 * question, non-empty storable text within length bounds. Returns null when
 * anything is off (reachable by direct POST).
 */
export function sanitizeStagedQuestionEntry(
  exercise: StagedQuestionsExercise,
  questionId: unknown,
  answer: unknown,
): StagedQuestionEntry | null {
  if (typeof questionId !== "string") return null;
  const question = exercise.parts
    .flatMap((p) => p.questions)
    .find((q) => q.id === questionId);
  if (!question) return null;
  if (typeof answer !== "string" || !isStorableText(answer)) return null;
  if (answer.trim().length < 1) return null;
  if (answer.length > CONTROL_SCENARIO_MAX_ANSWER_CHARS) return null;
  return { answer };
}

// ---------------------------------------------------------------------------
// Commit & construct exercises
// ---------------------------------------------------------------------------

/** The commit step's record inside `Submission.responseJson`. */
export interface CommitConstructCommitEntry {
  choice: string;
  confidence: string;
  reasoning: string;
}

/** The construct step's record inside `Submission.responseJson`. */
export interface CommitConstructConstructEntry {
  threatModel: string;
}

function sanitizeAnswerText(value: unknown): string | null {
  if (typeof value !== "string" || !isStorableText(value)) return null;
  if (value.trim().length < 1) return null;
  if (value.length > CONTROL_SCENARIO_MAX_ANSWER_CHARS) return null;
  return value;
}

/**
 * Validates the posted commit step against the definition: known choice and
 * confidence options, non-empty storable reasoning within length bounds.
 * Returns null when anything is off (reachable by direct POST).
 */
export function sanitizeCommitConstructCommit(
  exercise: CommitConstructExercise,
  choice: unknown,
  confidence: unknown,
  reasoning: unknown,
): CommitConstructCommitEntry | null {
  if (
    typeof choice !== "string" ||
    !exercise.commit.options.some((o) => o.id === choice)
  ) {
    return null;
  }
  if (
    typeof confidence !== "string" ||
    !exercise.commit.confidenceOptions.some((o) => o.id === confidence)
  ) {
    return null;
  }
  const cleanReasoning = sanitizeAnswerText(reasoning);
  if (cleanReasoning === null) return null;
  return { choice, confidence, reasoning: cleanReasoning };
}

/** Validates the posted construct step (a single threat-model answer). */
export function sanitizeCommitConstructConstruct(
  threatModel: unknown,
): CommitConstructConstructEntry | null {
  const cleanThreatModel = sanitizeAnswerText(threatModel);
  if (cleanThreatModel === null) return null;
  return { threatModel: cleanThreatModel };
}

// ---------------------------------------------------------------------------
// Argue & reveal exercises
// ---------------------------------------------------------------------------

/** One round of the learner's work inside an item entry. */
export interface ArgueRevealRoundEntry {
  /** Concept-chip ids toggled on while responding. */
  chips: string[];
  response: string;
  /** Whether the reference toolbox was opened during this round. */
  toolboxOpened: boolean;
}

/** One item's record inside `Submission.responseJson.items`. `rating` is
 * null for exercises without a `postRevealPrompt` (no self-rating step). */
export interface ArgueRevealItemEntry {
  rounds: ArgueRevealRoundEntry[];
  rating: ArgueRevealRating | null;
  note: string;
}

/** The construction step's record inside `Submission.responseJson`. */
export interface ArgueRevealConstructionEntry {
  attackSurface: string;
  argument: string;
  bestResponse: string;
  residual: string;
}

export function argueRevealBounds(exercise: ArgueRevealExercise) {
  return {
    responseMinChars:
      exercise.responseMinChars ?? ARGUE_REVEAL_DEFAULTS.responseMinChars,
    responseMaxChars:
      exercise.responseMaxChars ?? ARGUE_REVEAL_DEFAULTS.responseMaxChars,
    residualMinChars:
      exercise.residualMinChars ?? ARGUE_REVEAL_DEFAULTS.residualMinChars,
    residualMaxChars:
      exercise.residualMaxChars ?? ARGUE_REVEAL_DEFAULTS.residualMaxChars,
    noteMaxChars: exercise.noteMaxChars ?? ARGUE_REVEAL_DEFAULTS.noteMaxChars,
  };
}

function sanitizeBoundedText(
  value: unknown,
  minTrimmedChars: number,
  maxChars: number,
): string | null {
  if (typeof value !== "string" || !isStorableText(value)) return null;
  if (value.trim().length < minTrimmedChars) return null;
  if (value.length > maxChars) return null;
  return value;
}

/**
 * Validates one completed item posted for an argue-reveal exercise: known
 * item, one entry per authored round (chips ⊆ concept ids, response within
 * bounds), a rating (required iff the exercise has a `postRevealPrompt`),
 * and an optional one-line note. Null when anything is off (reachable by
 * direct POST).
 */
export function sanitizeArgueRevealItem(
  exercise: ArgueRevealExercise,
  itemId: unknown,
  rounds: unknown,
  rating: unknown,
  note: unknown,
): ArgueRevealItemEntry | null {
  if (typeof itemId !== "string") return null;
  const item = exercise.items.find((i) => i.id === itemId);
  if (!item) return null;
  if (exercise.postRevealPrompt) {
    if (!ARGUE_REVEAL_RATINGS.includes(rating as ArgueRevealRating)) return null;
  } else if (rating !== null) {
    return null;
  }
  const bounds = argueRevealBounds(exercise);
  const cleanNote = sanitizeBoundedText(note, 0, bounds.noteMaxChars);
  if (cleanNote === null) return null;

  if (!Array.isArray(rounds) || rounds.length !== item.rounds.length) return null;
  const conceptIds = new Set(exercise.concepts.map((c) => c.id));
  const cleanRounds: ArgueRevealRoundEntry[] = [];
  for (const round of rounds) {
    if (typeof round !== "object" || round === null) return null;
    const { chips, response, toolboxOpened } = round as Record<string, unknown>;
    if (
      !Array.isArray(chips) ||
      chips.length > exercise.concepts.length ||
      !chips.every((id) => typeof id === "string" && conceptIds.has(id))
    ) {
      return null;
    }
    const cleanResponse = sanitizeBoundedText(
      response,
      bounds.responseMinChars,
      bounds.responseMaxChars,
    );
    if (cleanResponse === null) return null;
    if (typeof toolboxOpened !== "boolean") return null;
    cleanRounds.push({
      chips: [...new Set(chips as string[])],
      response: cleanResponse,
      toolboxOpened,
    });
  }

  return {
    rounds: cleanRounds,
    rating: rating as ArgueRevealRating | null,
    note: cleanNote,
  };
}

/** Validates the construction step (surface + argument/response/residual). */
export function sanitizeArgueRevealConstruction(
  exercise: ArgueRevealExercise,
  value: unknown,
): ArgueRevealConstructionEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const { attackSurface, argument, bestResponse, residual } = value as Record<
    string,
    unknown
  >;
  if (
    typeof attackSurface !== "string" ||
    !exercise.construction.surfaces.some((s) => s.id === attackSurface)
  ) {
    return null;
  }
  const bounds = argueRevealBounds(exercise);
  const cleanArgument = sanitizeBoundedText(
    argument,
    bounds.responseMinChars,
    bounds.responseMaxChars,
  );
  const cleanBestResponse = sanitizeBoundedText(
    bestResponse,
    bounds.responseMinChars,
    bounds.responseMaxChars,
  );
  const cleanResidual = sanitizeBoundedText(
    residual,
    bounds.residualMinChars,
    bounds.residualMaxChars,
  );
  if (cleanArgument === null || cleanBestResponse === null || cleanResidual === null) {
    return null;
  }
  return {
    attackSurface,
    argument: cleanArgument,
    bestResponse: cleanBestResponse,
    residual: cleanResidual,
  };
}

// ---------------------------------------------------------------------------
// Writing (assessments and open-ended exercises)
// ---------------------------------------------------------------------------

/** Hard cap on a single writing section's persisted length. */
export const WRITING_MAX_SECTION_CHARS = 20_000;

/** Learner responses per section id, as persisted in `responseJson`. */
export type WritingValues = Record<string, string>;

/**
 * Validates a posted set of writing responses against the deliverable's known
 * section ids (reachable by direct POST): a flat object whose keys are all
 * real section ids and whose values are storable strings within the length
 * cap. Missing sections are allowed (partial drafts); unknown keys, non-string
 * values, oversized or non-storable text reject the whole payload. Returns the
 * cleaned record or null.
 */
export function sanitizeWritingValues(
  value: unknown,
  allowedSectionIds: Set<string>,
): WritingValues | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const clean: WritingValues = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!allowedSectionIds.has(key)) return null;
    if (typeof raw !== "string" || !isStorableText(raw)) return null;
    if (raw.length > WRITING_MAX_SECTION_CHARS) return null;
    clean[key] = raw;
  }
  return clean;
}
