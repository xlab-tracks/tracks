"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getExerciseById } from "@/lib/content";
import { isChoiceExercise } from "@/lib/content/types";
import { gradeChoice, type GradeResult } from "@/lib/content/exercise-view";

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
