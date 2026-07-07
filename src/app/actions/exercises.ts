"use server";

import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getExerciseById } from "@/lib/content";
import { isChoiceExercise, type FlowchartNode } from "@/lib/content/types";
import {
  gradeChoice,
  gradeFlowchartStage as gradeFlowchartStagePure,
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

// Reachable by direct POST, so re-validate the wire payload structurally
// (known block ids, sane size) before grading or persisting it.
function sanitizeFlowchartAttempt(
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
