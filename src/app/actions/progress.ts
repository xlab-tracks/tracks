"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getContentLocation } from "@/lib/content";

// These actions take generic content ids: standalone lessons, papers, and
// papers' inserted lessons all persist through the same LessonProgress rows.

/** Stamp last-viewed time on content open (no-op when signed out). */
export async function recordLessonView(contentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  // Reachable by direct POST: only ids in the content graph get rows.
  if (!getContentLocation(contentId)) return;
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: contentId } },
    create: {
      userId: user.id,
      lessonId: contentId,
      status: "in_progress",
      lastViewedAt: new Date(),
    },
    update: { lastViewedAt: new Date() },
  });
}

export async function setLessonComplete(
  contentId: string,
  completed: boolean,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  // Reachable by direct POST: only ids in the content graph get rows.
  const location = getContentLocation(contentId);
  if (!location) throw new Error("Unknown content");
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: contentId } },
    create: {
      userId: user.id,
      lessonId: contentId,
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? new Date() : null,
    },
    update: {
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? new Date() : null,
    },
  });

  revalidatePath(`/tracks/${location.track.slug}`, "layout");
}
