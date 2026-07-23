"use server";

import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getExerciseById } from "@/lib/content";
import {
  isChoiceExercise,
  TAP_REVEAL_RATINGS,
  type ArgueRevealRating,
  type FlowchartNode,
  type TapRevealRating,
} from "@/lib/content/types";
import {
  gradeChoice,
  gradeFlowchartStage as gradeFlowchartStagePure,
  sanitizeAllocationScenario,
  sanitizeArgueRevealConstruction,
  sanitizeArgueRevealItem,
  sanitizeCommitConstructCommit,
  sanitizeCommitConstructConstruct,
  sanitizeControlScenarioAnswer,
  sanitizeFlowchartAttempt,
  sanitizeStagedQuestionEntry,
  type AllocationScenarioEntry,
  type ArgueRevealConstructionEntry,
  type ArgueRevealItemEntry,
  type ArgueRevealRoundEntry,
  type CommitConstructCommitEntry,
  type CommitConstructConstructEntry,
  type ControlScenarioEntry,
  type StagedQuestionEntry,
  type FlowchartStageResult,
  type GradeResult,
} from "@/lib/content/exercise-view";

/**
 * Grades a closed exercise on the server against the (server-only) answer key,
 * and persists the attempt for a signed-in user.
 */
export async function gradeExercise(
  exerciseId: string,
  selectedOptionIds: string[],
): Promise<GradeResult> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || !isChoiceExercise(exercise)) {
    return { correct: false, correctOptionIds: [] };
  }

  // Reachable by direct POST: only real option ids get graded/persisted
  // (same hardening as sanitizeFlowchartAttempt / recordTapReveal).
  const validIds = new Set(exercise.options.map((option) => option.id));
  if (
    !Array.isArray(selectedOptionIds) ||
    selectedOptionIds.length > exercise.options.length ||
    !selectedOptionIds.every((id) => typeof id === "string" && validIds.has(id))
  ) {
    return { correct: false, correctOptionIds: [] };
  }

  const correct = gradeChoice(exercise, selectedOptionIds);

  const user = await getCurrentUser();
  if (user) {
    await prisma.submission.upsert({
      where: {
        userId_contentId_kind: {
          userId: user.id,
          contentId: exerciseId,
          kind: "exercise",
        },
      },
      create: {
        userId: user.id,
        contentId: exerciseId,
        kind: "exercise",
        format: exercise.type,
        responseJson: { selectedOptionIds },
        status: "submitted",
        score: correct ? 1 : 0,
      },
      update: {
        responseJson: { selectedOptionIds },
        status: "submitted",
        score: correct ? 1 : 0,
      },
    });
  }

  return {
    correct,
    correctOptionIds: exercise.correctOptionIds,
    explanation: exercise.explanation,
  };
}

/** Shape persisted in `Submission.responseJson` for flowchart exercises. */
interface FlowchartResponseJson {
  stages: Record<string, { attempt: FlowchartNode[]; correct: boolean }>;
}

/**
 * Grades one stage of a flowchart exercise on the server and persists all
 * stage attempts for a signed-in user in a single submission row. When
 * `revealSolution` is set (offered by the UI after repeated misses), the
 * stage's answer key and explanation are included in the result.
 */
export async function gradeFlowchartStage(
  exerciseId: string,
  stageId: string,
  attempt: FlowchartNode[],
  revealSolution = false,
): Promise<FlowchartStageResult> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "flowchart") return { correct: false };

  const stage = exercise.stages.find((s) => s.id === stageId);
  if (!stage) return { correct: false };

  const sanitized = sanitizeFlowchartAttempt(
    attempt,
    new Set(exercise.palette.map((block) => block.id)),
  );
  if (!sanitized) return { correct: false };

  const correct = gradeFlowchartStagePure(exercise, stageId, sanitized);

  const user = await getCurrentUser();
  if (user) {
    const where = {
      userId_contentId_kind: {
        userId: user.id,
        contentId: exerciseId,
        kind: "exercise",
      },
    } as const;
    // Read-modify-write on the single submission row: two concurrent grades
    // for DIFFERENT stages (e.g. two tabs) can lose one stage's record —
    // accepted for a learner's own self-paced progress; the client re-grades
    // on the next check and the score recomputes from the merged stages.
    const existing = await prisma.submission.findUnique({ where });
    const prior = (existing?.responseJson as FlowchartResponseJson | null) ?? {
      stages: {},
    };
    const stages = {
      ...prior.stages,
      [stageId]: { attempt: sanitized, correct },
    };
    const score =
      Object.values(stages).filter((s) => s.correct).length /
      exercise.stages.length;
    const responseJson = { stages } as unknown as Prisma.InputJsonValue;
    await prisma.submission.upsert({
      where,
      create: {
        userId: user.id,
        contentId: exerciseId,
        kind: "exercise",
        format: exercise.type,
        responseJson,
        status: "submitted",
        score,
      },
      update: { responseJson, status: "submitted", score },
    });
  }

  if (correct) {
    return { correct, explanation: stage.explanation };
  }
  return revealSolution
    ? { correct, explanation: stage.explanation, solution: stage.solution }
    : { correct };
}

/** Shape persisted in `Submission.responseJson` for allocation exercises. */
interface AllocationResponseJson {
  scenarios: Record<string, AllocationScenarioEntry>;
}

/**
 * Persists one scenario of an allocation exercise for a signed-in user. Not
 * graded — there is no answer key; the row records the learner's allocations
 * and reasoning, and flips to `submitted` once every scenario is present.
 */
export async function saveAllocationScenario(
  exerciseId: string,
  scenarioId: string,
  allocation: Record<string, number>,
  reasoning: string,
): Promise<void> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "allocation") return;

  // Reachable by direct POST: validate the payload against the definition
  // (known scenario, exact agenda set, step-multiples, pool exactly spent).
  const entry = sanitizeAllocationScenario(exercise, scenarioId, allocation, reasoning);
  if (!entry) return;

  const user = await getCurrentUser();
  if (!user) return;

  const where = {
    userId_contentId_kind: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
    },
  } as const;
  // Read-modify-write on the single submission row — same accepted race as
  // gradeFlowchartStage: concurrent saves of DIFFERENT scenarios can lose one.
  const existing = await prisma.submission.findUnique({ where });
  const prior = (existing?.responseJson as AllocationResponseJson | null) ?? {
    scenarios: {},
  };
  const scenarios = { ...prior.scenarios, [scenarioId]: entry };
  const complete = exercise.scenarios.every((s) => scenarios[s.id]);
  const responseJson = { scenarios } as unknown as Prisma.InputJsonValue;
  await prisma.submission.upsert({
    where,
    create: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
      format: exercise.type,
      responseJson,
      status: complete ? "submitted" : "draft",
    },
    update: { responseJson, status: complete ? "submitted" : "draft" },
  });
}

/** Shape persisted in `Submission.responseJson` for control-scenario exercises. */
interface ControlScenariosResponseJson {
  scenarios: Record<string, ControlScenarioEntry>;
}

/**
 * Persists one submitted scenario answer of a control-scenarios exercise for
 * a signed-in user. Not graded — there is no answer key; the row records the
 * learner's pre-commit reasoning per scenario, and flips to `submitted` once
 * every scenario is present.
 */
export async function saveControlScenario(
  exerciseId: string,
  scenarioId: string,
  answer: string,
): Promise<void> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "control-scenarios") return;

  // Reachable by direct POST: validate the payload against the definition.
  const entry = sanitizeControlScenarioAnswer(exercise, scenarioId, answer);
  if (!entry) return;

  const user = await getCurrentUser();
  if (!user) return;

  const where = {
    userId_contentId_kind: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
    },
  } as const;
  // Read-modify-write on the single submission row — same accepted race as
  // gradeFlowchartStage: concurrent saves of DIFFERENT scenarios can lose one.
  const existing = await prisma.submission.findUnique({ where });
  const prior = (existing?.responseJson as ControlScenariosResponseJson | null) ?? {
    scenarios: {},
  };
  const scenarios = { ...prior.scenarios, [scenarioId]: entry };
  const complete = exercise.scenarios.every((s) => scenarios[s.id]);
  const responseJson = { scenarios } as unknown as Prisma.InputJsonValue;
  await prisma.submission.upsert({
    where,
    create: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
      format: exercise.type,
      responseJson,
      status: complete ? "submitted" : "draft",
    },
    update: { responseJson, status: complete ? "submitted" : "draft" },
  });
}

/** Shape persisted in `Submission.responseJson` for staged-question exercises. */
interface StagedQuestionsResponseJson {
  questions: Record<string, StagedQuestionEntry>;
}

/**
 * Persists one submitted question of a staged-questions exercise for a
 * signed-in user. Not graded; the row flips to `submitted` once every
 * question is present.
 */
export async function saveStagedQuestion(
  exerciseId: string,
  questionId: string,
  answer: string,
): Promise<void> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "staged-questions") return;

  // Reachable by direct POST: validate the payload against the definition.
  const entry = sanitizeStagedQuestionEntry(exercise, questionId, answer);
  if (!entry) return;

  const user = await getCurrentUser();
  if (!user) return;

  const where = {
    userId_contentId_kind: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
    },
  } as const;
  // Read-modify-write on the single submission row — same accepted race as
  // gradeFlowchartStage: concurrent saves of DIFFERENT questions can lose one.
  const existing = await prisma.submission.findUnique({ where });
  const prior = (existing?.responseJson as StagedQuestionsResponseJson | null) ?? {
    questions: {},
  };
  const questions = { ...prior.questions, [questionId]: entry };
  const complete = exercise.parts
    .flatMap((p) => p.questions)
    .every((q) => questions[q.id]);
  const responseJson = { questions } as unknown as Prisma.InputJsonValue;
  await prisma.submission.upsert({
    where,
    create: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
      format: exercise.type,
      responseJson,
      status: complete ? "submitted" : "draft",
    },
    update: { responseJson, status: complete ? "submitted" : "draft" },
  });
}

/** Shape persisted in `Submission.responseJson` for commit-construct exercises. */
interface CommitConstructResponseJson {
  commit?: CommitConstructCommitEntry;
  construct?: CommitConstructConstructEntry;
}

async function saveCommitConstructStep(
  exerciseId: string,
  merge: (prior: CommitConstructResponseJson) => CommitConstructResponseJson,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const where = {
    userId_contentId_kind: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
    },
  } as const;
  // Read-modify-write on the single submission row — same accepted race as
  // gradeFlowchartStage: concurrent saves of DIFFERENT steps can lose one.
  const existing = await prisma.submission.findUnique({ where });
  const prior = (existing?.responseJson as CommitConstructResponseJson | null) ?? {};
  const next = merge(prior);
  const complete = next.commit != null && next.construct != null;
  const responseJson = next as unknown as Prisma.InputJsonValue;
  await prisma.submission.upsert({
    where,
    create: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
      format: "commit-construct",
      responseJson,
      status: complete ? "submitted" : "draft",
    },
    update: { responseJson, status: complete ? "submitted" : "draft" },
  });
}

/**
 * Persists the commit step (choice + confidence + reasoning) of a
 * commit-construct exercise for a signed-in user. Not graded.
 */
export async function saveCommitConstructCommit(
  exerciseId: string,
  choice: string,
  confidence: string,
  reasoning: string,
): Promise<void> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "commit-construct") return;

  // Reachable by direct POST: validate the payload against the definition.
  const entry = sanitizeCommitConstructCommit(exercise, choice, confidence, reasoning);
  if (!entry) return;

  await saveCommitConstructStep(exerciseId, (prior) => ({ ...prior, commit: entry }));
}

/**
 * Persists the construct step (the threat model) of a commit-construct
 * exercise for a signed-in user. Not graded; the row flips to `submitted`
 * once both steps are present.
 */
export async function saveCommitConstructConstruct(
  exerciseId: string,
  threatModel: string,
): Promise<void> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "commit-construct") return;

  const entry = sanitizeCommitConstructConstruct(threatModel);
  if (!entry) return;

  await saveCommitConstructStep(exerciseId, (prior) => ({ ...prior, construct: entry }));
}

/** Shape persisted in `Submission.responseJson` for argue-reveal exercises. */
interface ArgueRevealResponseJson {
  items: Record<string, ArgueRevealItemEntry>;
  construction?: ArgueRevealConstructionEntry;
}

async function saveArgueReveal(
  exerciseId: string,
  merge: (prior: ArgueRevealResponseJson) => ArgueRevealResponseJson,
  isComplete: (
    next: ArgueRevealResponseJson,
    itemIds: string[],
  ) => boolean,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "argue-reveal") return;

  const where = {
    userId_contentId_kind: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
    },
  } as const;
  // Read-modify-write on the single submission row — same accepted race as
  // gradeFlowchartStage: concurrent saves of DIFFERENT parts can lose one.
  const existing = await prisma.submission.findUnique({ where });
  const prior = (existing?.responseJson as ArgueRevealResponseJson | null) ?? {
    items: {},
  };
  // Old/malformed rows may lack `items`; normalize before merging.
  const next = merge({ ...prior, items: prior.items ?? {} });
  const complete = isComplete(
    next,
    exercise.items.map((i) => i.id),
  );
  const responseJson = next as unknown as Prisma.InputJsonValue;
  await prisma.submission.upsert({
    where,
    create: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
      format: exercise.type,
      responseJson,
      status: complete ? "submitted" : "draft",
    },
    update: { responseJson, status: complete ? "submitted" : "draft" },
  });
}

const argueRevealComplete = (
  json: ArgueRevealResponseJson,
  itemIds: string[],
) => itemIds.every((id) => json.items[id]) && json.construction != null;

/**
 * Persists one completed item (all rounds responded + reveal self-rated) of
 * an argue-reveal exercise for a signed-in user. Not graded — there is no
 * answer key; the row flips to `submitted` once every item and the
 * construction step are present.
 */
export async function saveArgueRevealItem(
  exerciseId: string,
  itemId: string,
  rounds: ArgueRevealRoundEntry[],
  rating: ArgueRevealRating | null,
  note: string,
): Promise<void> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "argue-reveal") return;

  // Reachable by direct POST: validate against the definition (known item,
  // one entry per round, chips ⊆ concepts, responses within bounds).
  const entry = sanitizeArgueRevealItem(exercise, itemId, rounds, rating, note);
  if (!entry) return;

  await saveArgueReveal(
    exerciseId,
    (prior) => ({ ...prior, items: { ...prior.items, [itemId]: entry } }),
    argueRevealComplete,
  );
}

/** Persists the construction step of an argue-reveal exercise. */
export async function saveArgueRevealConstruction(
  exerciseId: string,
  construction: ArgueRevealConstructionEntry,
): Promise<void> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "argue-reveal") return;

  const entry = sanitizeArgueRevealConstruction(exercise, construction);
  if (!entry) return;

  await saveArgueReveal(
    exerciseId,
    (prior) => ({ ...prior, construction: entry }),
    argueRevealComplete,
  );
}

const TAP_REVEAL_SCORES: Record<TapRevealRating, number> = {
  yes: 1,
  partial: 0.5,
  no: 0,
};

/**
 * Records the learner's self-assessment after a tap-reveal. The submission's
 * `updatedAt` doubles as the review timestamp for future spaced repetition.
 */
export async function recordTapReveal(
  exerciseId: string,
  rating: TapRevealRating,
): Promise<void> {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || exercise.type !== "tap-reveal") return;
  if (!TAP_REVEAL_RATINGS.includes(rating)) return;

  const user = await getCurrentUser();
  if (!user) return;

  const responseJson = { rating };
  const score = TAP_REVEAL_SCORES[rating];
  await prisma.submission.upsert({
    where: {
      userId_contentId_kind: {
        userId: user.id,
        contentId: exerciseId,
        kind: "exercise",
      },
    },
    create: {
      userId: user.id,
      contentId: exerciseId,
      kind: "exercise",
      format: exercise.type,
      responseJson,
      status: "submitted",
      score,
    },
    update: { responseJson, status: "submitted", score },
  });
}
