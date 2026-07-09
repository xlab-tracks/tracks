import type { SubmissionKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getModuleProgressContentIds,
  getPrerequisiteModules,
  getTrackForModule,
  getTrackProgressContentIds,
  type Module,
} from "@/lib/content";

// Progress rows key on generic *content ids*: the LessonProgress.lessonId
// column (a plain string, no FK) holds standalone lesson ids, paper ids, and
// papers' inserted-lesson ids alike — each is one completion unit.

export async function getCompletedLessonIds(
  userId: string,
  contentIds: string[],
): Promise<string[]> {
  if (contentIds.length === 0) return [];
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: contentIds }, status: "completed" },
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

/** A module counts as complete when all of its content units are completed. */
export async function isModuleComplete(
  userId: string,
  moduleId: string,
): Promise<boolean> {
  const contentIds = getModuleProgressContentIds(moduleId);
  if (contentIds.length === 0) return true;
  const completed = await getCompletedLessonIds(userId, contentIds);
  return completed.length === contentIds.length;
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
  const contentIds = getTrackProgressContentIds(trackId);
  const total = contentIds.length;
  const completed = (await getCompletedLessonIds(userId, contentIds)).length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

export async function getLastViewedContentId(
  userId: string,
  trackId: string,
): Promise<string | null> {
  const contentIds = getTrackProgressContentIds(trackId);
  if (contentIds.length === 0) return null;
  const row = await prisma.lessonProgress.findFirst({
    where: { userId, lessonId: { in: contentIds } },
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
