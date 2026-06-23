import type { SubmissionKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getLessonsForModule,
  getPrerequisiteModules,
  getTrackForModule,
  getTrackLessonIds,
  type Module,
} from "@/lib/content";

export async function getCompletedLessonIds(
  userId: string,
  lessonIds: string[],
): Promise<string[]> {
  if (lessonIds.length === 0) return [];
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds }, status: "completed" },
    select: { lessonId: true },
  });
  return rows.map((r) => r.lessonId);
}

export async function isLessonCompleted(
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const row = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { status: true },
  });
  return row?.status === "completed";
}

/** A module counts as complete when all of its lessons are completed. */
export async function isModuleComplete(
  userId: string,
  moduleId: string,
): Promise<boolean> {
  const lessons = getLessonsForModule(moduleId);
  if (lessons.length === 0) return true;
  const completed = await getCompletedLessonIds(
    userId,
    lessons.map((l) => l.id),
  );
  return completed.length === lessons.length;
}

export interface PrerequisiteStatus {
  module: Module;
  trackSlug: string | null;
  trackLabel: string | null;
  completed: boolean;
}

/** Resolved prerequisites for a module with per-item completion status. */
export async function getPrerequisiteStatus(
  userId: string | null,
  moduleId: string,
): Promise<PrerequisiteStatus[]> {
  const prereqs = getPrerequisiteModules(moduleId);
  return Promise.all(
    prereqs.map(async (module) => {
      const track = getTrackForModule(module.id);
      return {
        module,
        trackSlug: track?.slug ?? null,
        trackLabel: track ? (track.shortTitle ?? track.title) : null,
        completed: userId ? await isModuleComplete(userId, module.id) : false,
      };
    }),
  );
}

export interface TrackProgress {
  completed: number;
  total: number;
  percent: number;
}

export async function getTrackProgress(
  userId: string,
  trackId: string,
): Promise<TrackProgress> {
  const lessonIds = getTrackLessonIds(trackId);
  const total = lessonIds.length;
  const completed = (await getCompletedLessonIds(userId, lessonIds)).length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

export async function getLastViewedLessonId(
  userId: string,
  trackId: string,
): Promise<string | null> {
  const lessonIds = getTrackLessonIds(trackId);
  if (lessonIds.length === 0) return null;
  const row = await prisma.lessonProgress.findFirst({
    where: { userId, lessonId: { in: lessonIds } },
    orderBy: { lastViewedAt: "desc" },
    select: { lessonId: true },
  });
  return row?.lessonId ?? null;
}

export async function getSubmission(
  userId: string,
  contentId: string,
  kind: SubmissionKind,
) {
  return prisma.submission.findUnique({
    where: { userId_contentId_kind: { userId, contentId, kind } },
  });
}
