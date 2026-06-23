"use server";

import { revalidatePath } from "next/cache";
import type { SubmissionKind } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Debounced autosave target for writing (no-op when signed out). */
export async function saveWritingDraft(
  contentId: string,
  kind: SubmissionKind,
  format: string | null,
  values: Record<string, string>,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const existing = await prisma.submission.findUnique({
    where: { userId_contentId_kind: { userId: user.id, contentId, kind } },
    select: { status: true },
  });
  // Don't clobber a final submission with a later draft autosave.
  if (existing?.status === "submitted") return;
  await prisma.submission.upsert({
    where: { userId_contentId_kind: { userId: user.id, contentId, kind } },
    create: {
      userId: user.id,
      contentId,
      kind,
      format,
      responseJson: values,
      status: "draft",
    },
    update: { responseJson: values, format },
  });
}

export async function submitWriting(
  contentId: string,
  kind: SubmissionKind,
  format: string | null,
  values: Record<string, string>,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  await prisma.submission.upsert({
    where: { userId_contentId_kind: { userId: user.id, contentId, kind } },
    create: {
      userId: user.id,
      contentId,
      kind,
      format,
      responseJson: values,
      status: "submitted",
    },
    update: { responseJson: values, format, status: "submitted" },
  });
  // Refresh instructor dashboards that read submissions.
  revalidatePath("/classrooms", "layout");
}
