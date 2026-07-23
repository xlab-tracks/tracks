"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { SubmissionKind } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWritingTarget } from "@/lib/content";
import { sanitizeWritingValues } from "@/lib/content/exercise-view";

// Only these kinds are writing submissions; the choice/flowchart/etc. paths
// have their own dedicated actions in exercises.ts.
type WritingKind = Extract<SubmissionKind, "assessment" | "exercise">;

/**
 * Resolves and validates a writing submission (reachable by direct POST):
 * contentId must be a real assessment/writing-exercise of this kind, and
 * `values` a flat map of known section ids to storable, length-capped strings.
 * The stored `format` is derived from the content graph, never trusted from
 * the caller. Returns null when anything is off.
 */
function resolveWriting(
  contentId: string,
  kind: SubmissionKind,
  values: unknown,
): { responseJson: Prisma.InputJsonValue; format: string } | null {
  if (kind !== "assessment" && kind !== "exercise") return null;
  const target = getWritingTarget(contentId, kind as WritingKind);
  if (!target) return null;
  const clean = sanitizeWritingValues(values, new Set(target.sectionIds));
  if (!clean) return null;
  return { responseJson: clean as Prisma.InputJsonValue, format: target.format };
}

/** Debounced autosave target for writing (no-op when signed out or invalid). */
export async function saveWritingDraft(
  contentId: string,
  kind: SubmissionKind,
  _format: string | null,
  values: Record<string, string>,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const resolved = resolveWriting(contentId, kind, values);
  if (!resolved) return;

  // Atomic don't-clobber-a-submission guard: update only when the row is not
  // already submitted; if nothing matched, create it (a concurrent submit
  // makes the create hit the unique constraint, which we swallow).
  const where = { userId: user.id, contentId, kind };
  const updated = await prisma.submission.updateMany({
    where: { ...where, status: { not: "submitted" } },
    data: { responseJson: resolved.responseJson, format: resolved.format },
  });
  if (updated.count === 0) {
    try {
      await prisma.submission.create({
        data: {
          ...where,
          format: resolved.format,
          responseJson: resolved.responseJson,
          status: "draft",
        },
      });
    } catch (error) {
      // Only swallow the unique-constraint collision (a row was created
      // concurrently — leave it). Never swallow connection/validation errors:
      // the client treats a resolved autosave as "saved", so a swallowed
      // failure would show green while nothing persisted.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
    }
  }
}

export async function submitWriting(
  contentId: string,
  kind: SubmissionKind,
  _format: string | null,
  values: Record<string, string>,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const resolved = resolveWriting(contentId, kind, values);
  if (!resolved) throw new Error("Invalid submission");

  await prisma.submission.upsert({
    where: {
      userId_contentId_kind: { userId: user.id, contentId, kind },
    },
    create: {
      userId: user.id,
      contentId,
      kind,
      format: resolved.format,
      responseJson: resolved.responseJson,
      status: "submitted",
    },
    update: {
      responseJson: resolved.responseJson,
      format: resolved.format,
      status: "submitted",
    },
  });
  // Refresh instructor dashboards that read submissions.
  revalidatePath("/classrooms", "layout");
}

/**
 * Reopens the caller's own submitted writing for editing: submitted → draft,
 * content untouched. Any stored transparency grade stays on the row (grade
 * presence = score + feedback set) and resurfaces on resubmit until re-graded.
 * Scoped to status "submitted" so it can't touch drafts or race a concurrent
 * reopen; no-op when there's nothing submitted. Validates contentId like the
 * sibling actions — a direct POST must not be able to flip the closed-
 * exercise subsystems' rows (choice/flowchart/tap-reveal/…, which share kind
 * "exercise") out of their submitted-with-score invariant.
 */
export async function reopenWriting(
  contentId: string,
  kind: SubmissionKind,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (kind !== "assessment" && kind !== "exercise") {
    throw new Error("Invalid submission");
  }
  if (!getWritingTarget(contentId, kind as WritingKind)) {
    throw new Error("Invalid submission");
  }
  await prisma.submission.updateMany({
    where: { userId: user.id, contentId, kind, status: "submitted" },
    data: { status: "draft" },
  });
  // Instructor dashboards show the row as draft until resubmitted.
  revalidatePath("/classrooms", "layout");
}
