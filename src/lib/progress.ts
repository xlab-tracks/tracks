import { cache } from "react";
import type { SubmissionKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getModuleProgressContentIds,
  getModulesForTrack,
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

// cache()-wrapped: string args, so the item page and an embedded widget
// (e.g. VerificationExercise) that both check the same lesson dedupe to one
// findUnique within a render.
export const isLessonCompleted = cache(
  async (userId: string, lessonId: string): Promise<boolean> => {
    const row = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { status: true },
    });
    return row?.status === "completed";
  },
);

/**
 * The set of completed content ids covering a whole track AND every module's
 * prerequisites (so prerequisite locks resolve in memory, cross-track prereqs
 * included). One query, cache()-keyed on scalars — the track layout, the track
 * overview page, and the item/module/assessment pages rendering under that
 * layout in the same request all share it.
 */
export const getTrackCompletionSet = cache(
  async (userId: string, trackId: string): Promise<Set<string>> => {
    const ids = new Set(getTrackProgressContentIds(trackId));
    for (const mod of getModulesForTrack(trackId)) {
      for (const prereq of getPrerequisiteModules(mod.id)) {
        for (const id of getModuleProgressContentIds(prereq.id)) ids.add(id);
      }
    }
    if (ids.size === 0) return new Set();
    return new Set(await getCompletedLessonIds(userId, [...ids]));
  },
);

export interface PrerequisiteStatus {
  module: Module;
  trackSlug: string | null;
  trackLabel: string | null;
  completed: boolean;
}

/**
 * Resolved prerequisites for a module with per-item completion status. One
 * query for the whole prerequisite set (bucketed in memory), reusing the
 * request-cached track completion set when the module's track is known — so
 * a page rendering under its track layout pays zero extra round trips.
 */
export const getPrerequisiteStatus = cache(
  async (
    userId: string | null,
    moduleId: string,
  ): Promise<PrerequisiteStatus[]> => {
    const prereqs = getPrerequisiteModules(moduleId);
    const label = (module: Module): PrerequisiteStatus => {
      const track = getTrackForModule(module.id);
      return {
        module,
        trackSlug: track?.slug ?? null,
        trackLabel: track ? (track.shortTitle ?? track.title) : null,
        completed: false,
      };
    };
    if (prereqs.length === 0 || !userId) return prereqs.map(label);

    const track = getTrackForModule(moduleId);
    // The track completion set already unions every module's prerequisites, so
    // it answers this module's prereqs too (and is a cache hit under the track
    // layout). Fall back to a scoped query only for an orphan module.
    const completedSet = track
      ? await getTrackCompletionSet(userId, track.id)
      : new Set(
          await getCompletedLessonIds(userId, [
            ...new Set(prereqs.flatMap((m) => getModuleProgressContentIds(m.id))),
          ]),
        );
    return prereqs.map((module) => ({
      ...label(module),
      completed: getModuleProgressContentIds(module.id).every((id) =>
        completedSet.has(id),
      ),
    }));
  },
);

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

/**
 * All of a user's exercise submissions as a contentId→row map, one query per
 * request. cache()-keyed on userId so every stateful `<Exercise/>` and
 * `<ExerciseSequence/>` on a page shares a single findMany instead of a point
 * lookup each (rows are bounded by authored content — one per exercise id).
 */
export const getExerciseSubmissionMap = cache(async (userId: string) => {
  const rows = await prisma.submission.findMany({
    where: { userId, kind: "exercise" },
    select: {
      contentId: true,
      responseJson: true,
      status: true,
      updatedAt: true,
      // The reasoning-transparency grade, preloaded by exercise hosts.
      score: true,
      feedback: true,
    },
  });
  return new Map(rows.map((r) => [r.contentId, r]));
});
