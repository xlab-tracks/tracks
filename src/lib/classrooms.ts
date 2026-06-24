import type { ClassroomRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getAssessmentForModule,
  getModulesForTrack,
  getTrackLessonIds,
  tracks,
} from "@/lib/content";

/** The caller's role in a classroom, or null if they are not a member. */
export async function getMembership(userId: string, classroomId: string) {
  return prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId } },
    select: { role: true },
  });
}

export async function getMyClassrooms(userId: string) {
  return prisma.classroomMembership.findMany({
    where: { userId },
    include: {
      classroom: {
        include: { _count: { select: { memberships: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

export async function getClassroom(classroomId: string) {
  return prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      memberships: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

export interface RosterRow {
  userId: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  role: ClassroomRole;
  completed: number;
  total: number;
  percent: number;
  lastActive: Date | null;
  assessmentsSubmitted: number;
  capstoneStatus: string | null;
}

export interface RosterMember {
  userId: string;
  role: ClassroomRole;
  user: { name: string | null; email: string; imageUrl: string | null };
}

/**
 * Aggregated per-member progress for the instructor roster. Scoped to the
 * classroom's track when set, otherwise across all tracks. Takes the already
 * loaded members to avoid re-querying the classroom.
 */
export async function getClassroomRoster(
  members: RosterMember[],
  trackId: string | null,
): Promise<RosterRow[]> {
  const userIds = members.map((m) => m.userId);

  const scopeTrackIds = trackId ? [trackId] : tracks.map((t) => t.id);
  const scopeLessonIds = scopeTrackIds.flatMap((id) => getTrackLessonIds(id));
  const scopeAssessmentIds = scopeTrackIds.flatMap((id) =>
    getModulesForTrack(id)
      .map((m) => getAssessmentForModule(m.id)?.id)
      .filter((x): x is string => Boolean(x)),
  );
  const total = scopeLessonIds.length;

  const [progress, submissions, capstones] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: { in: userIds }, lessonId: { in: scopeLessonIds } },
      select: { userId: true, status: true, lastViewedAt: true },
    }),
    prisma.submission.findMany({
      where: {
        userId: { in: userIds },
        kind: "assessment",
        status: "submitted",
        contentId: { in: scopeAssessmentIds },
      },
      select: { userId: true },
    }),
    trackId
      ? prisma.capstoneProject.findMany({
          where: { userId: { in: userIds }, trackId },
          select: { userId: true, status: true },
        })
      : Promise.resolve([] as { userId: string; status: string }[]),
  ]);

  const completedByUser = new Map<string, number>();
  const lastActiveByUser = new Map<string, Date>();
  for (const row of progress) {
    if (row.status === "completed") {
      completedByUser.set(row.userId, (completedByUser.get(row.userId) ?? 0) + 1);
    }
    const prev = lastActiveByUser.get(row.userId);
    if (!prev || row.lastViewedAt > prev) {
      lastActiveByUser.set(row.userId, row.lastViewedAt);
    }
  }
  const submittedByUser = new Map<string, number>();
  for (const row of submissions) {
    submittedByUser.set(row.userId, (submittedByUser.get(row.userId) ?? 0) + 1);
  }
  const capstoneByUser = new Map<string, string>();
  for (const row of capstones) capstoneByUser.set(row.userId, row.status);

  return members.map((m) => {
    const completed = completedByUser.get(m.userId) ?? 0;
    return {
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      imageUrl: m.user.imageUrl,
      role: m.role,
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0,
      lastActive: lastActiveByUser.get(m.userId) ?? null,
      assessmentsSubmitted: submittedByUser.get(m.userId) ?? 0,
      capstoneStatus: capstoneByUser.get(m.userId) ?? null,
    };
  });
}
