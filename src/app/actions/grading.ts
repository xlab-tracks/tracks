"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { classifyLength, modelFor } from "@/lib/grader/classify";
import { feedbackToHtml } from "@/lib/grader/feedback-html";
import { callGrader } from "@/lib/grader/openrouter";
import {
  parseGraderReport,
  parseVerdict,
  type CriterionResult,
} from "@/lib/grader/parse";
import { systemPrompt, userPrompt } from "@/lib/grader/prompts";
import {
  getOpenRouterKeyStatus,
  getUserOpenRouterKey,
} from "@/lib/grader/user-key";
import {
  assembleArgueReveal,
  assembleWriting,
  type AssembledSample,
} from "@/lib/grader/sample";
import type {
  ArgueRevealConstructionEntry,
  ArgueRevealItemEntry,
} from "@/lib/content/exercise-view";
import { getExerciseById } from "@/lib/content";

export type GradeResult =
  | {
      ok: true;
      score: number;
      band: string;
      /** Rendered from the report minus its <analysis> block. */
      feedbackHtml: string;
      /** Parsed per-criterion results for the rubric table. */
      criteria: CriterionResult[];
    }
  | { ok: false; error: string };

// .env.example ships this literal; treat it as unset (same convention as the
// encryption-secret placeholder) so a copied env file hides the feature
// instead of sending garbage auth to OpenRouter.
const SERVER_KEY_PLACEHOLDER = "sk-or-...";

function serverOpenRouterKey(): string | undefined {
  const key = process.env.OPENROUTER_API_KEY;
  return key && key !== SERVER_KEY_PLACEHOLDER ? key : undefined;
}

// Each grade is a billed LLM call, so repeat runs are throttled. Without a
// dedicated event table this keys off the submission row itself: the grade
// write bumps updatedAt, so "has feedback + touched in the last minute"
// means a grade just landed (or an autosave just happened on a reopened,
// already-graded row — refusing there is the conservative direction).
const REGRADE_COOLDOWN_MS = 60_000;
// Coarse per-user ceiling: distinct graded submissions touched in the last
// hour. Approximate by design — it exists to stop a hot loop on the
// server-wide key, not to meter honest use.
const HOURLY_GRADED_CAP = 12;

/**
 * On-demand reasoning-transparency grade for the caller's own submission
 * (reachable by direct POST — re-checks auth and re-derives everything from
 * the stored row; nothing grade-relevant is trusted from the client). The
 * submission must exist and have been submitted; the parsed total (/45) and
 * the grader's full markdown report persist on the reserved Submission
 * columns with status "graded".
 */
export async function requestTransparencyGrade(
  contentId: string,
  kind: "exercise" | "assessment",
): Promise<GradeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to get feedback." };
  if (kind !== "exercise" && kind !== "assessment") {
    return { ok: false, error: "Invalid submission." };
  }

  const submission = await prisma.submission.findUnique({
    where: { userId_contentId_kind: { userId: user.id, contentId, kind } },
  });
  if (!submission || submission.status === "draft") {
    return { ok: false, error: "Submit your response first, then grade it." };
  }

  // Throttle billed LLM calls (see the constants above for the exact
  // semantics of both windows).
  if (
    submission.feedback != null &&
    Date.now() - submission.updatedAt.getTime() < REGRADE_COOLDOWN_MS
  ) {
    return {
      ok: false,
      error: "This submission was just graded — wait a minute before regrading.",
    };
  }
  const recentlyGraded = await prisma.submission.count({
    where: {
      userId: user.id,
      feedback: { not: null },
      updatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentlyGraded >= HOURLY_GRADED_CAP) {
    return {
      ok: false,
      error: "Grading limit reached for now — try again in an hour.",
    };
  }

  const assembled = assembleFromSubmission(
    contentId,
    kind,
    submission.responseJson,
  );
  if (!assembled) {
    return { ok: false, error: "Nothing gradeable in this submission yet." };
  }

  // Prefer the user's own stored key; fall back to the server-wide one only
  // when the user has none. A stored-but-undecryptable key (rotated
  // API_KEY_ENCRYPTION_SECRET) is an error, not a silent fallback — the user
  // believes their key pays for this call. The decrypted key exists only
  // inside this request — never in the response.
  const keyStatus = await getOpenRouterKeyStatus(user.id);
  if (keyStatus?.state === "needs-reentry") {
    return {
      ok: false,
      error:
        "Your stored OpenRouter key can no longer be read — replace or remove it below, then try again.",
    };
  }
  const userKey = await getUserOpenRouterKey(user.id);
  const apiKey = userKey ?? serverOpenRouterKey();
  if (!apiKey) {
    return {
      ok: false,
      error: keyStatus
        ? "Grading needs an OpenRouter API key — add your own key below to enable it."
        : "Grading is not configured on this server.",
    };
  }

  const lengthClass = classifyLength(assembled.sample);
  const result = await callGrader(
    modelFor(lengthClass, userKey != null ? "user" : "server"),
    systemPrompt(lengthClass),
    userPrompt(assembled.sample, assembled.context),
    apiKey,
  );
  if (!result.ok) return result;

  const verdict = parseVerdict(result.content);
  if (!verdict) {
    return {
      ok: false,
      error: "The grader's response was malformed. Try again.",
    };
  }

  // Deliberately NOT flipping status to "graded": editors and instructor
  // views key off status === "submitted", and this automated grade shouldn't
  // change submission semantics. Grade presence = score + feedback set.
  await prisma.submission.update({
    where: { userId_contentId_kind: { userId: user.id, contentId, kind } },
    data: {
      score: verdict.score,
      feedback: result.content,
    },
  });

  // The raw report (including its <analysis> block) persists above; the
  // client gets only the parsed criteria and the analysis-stripped body.
  const report = parseGraderReport(result.content);
  return {
    ok: true,
    score: verdict.score,
    band: verdict.band,
    feedbackHtml: feedbackToHtml(report.visibleMarkdown),
    criteria: report.criteria,
  };
}

function assembleFromSubmission(
  contentId: string,
  kind: "exercise" | "assessment",
  responseJson: unknown,
): AssembledSample | null {
  if (!responseJson || typeof responseJson !== "object") return null;
  if (kind === "exercise") {
    const exercise = getExerciseById(contentId);
    if (exercise?.type === "argue-reveal") {
      return assembleArgueReveal(
        contentId,
        responseJson as {
          items?: Record<string, ArgueRevealItemEntry>;
          construction?: ArgueRevealConstructionEntry;
        },
      );
    }
  }
  return assembleWriting(
    contentId,
    kind,
    responseJson as Record<string, unknown>,
  );
}
