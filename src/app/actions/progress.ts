"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLessonById, getTrackForModule } from "@/lib/content";

/** Stamp last-viewed time on lesson open (no-op when signed out). */
export async function recordLessonView(lessonId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: {
      userId: user.id,
      lessonId,
      status: "in_progress",
      lastViewedAt: new Date(),
    },
    update: { lastViewedAt: new Date() },
  });
}

export async function setLessonComplete(
  lessonId: string,
  completed: boolean,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: {
      userId: user.id,
      lessonId,
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? new Date() : null,
    },
    update: {
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? new Date() : null,
    },
  });

  const lesson = getLessonById(lessonId);
  const track = lesson ? getTrackForModule(lesson.moduleId) : undefined;
  if (track) revalidatePath(`/tracks/${track.slug}`, "layout");
}
