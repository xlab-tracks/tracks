import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getClassroom, getClassroomRoster, getMembership } from "@/lib/classrooms";
import { getTrackById } from "@/lib/content";
import { getTrackProgress } from "@/lib/progress";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  CopyJoinCode,
  RegenerateCodeButton,
  RemoveMemberButton,
} from "@/components/classrooms/classroom-manage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Classroom" };

function fmtDate(d: Date | null): string {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const membership = await getMembership(user.id, id);
  if (!membership) notFound();

  const classroom = await getClassroom(id);
  if (!classroom) notFound();
  const track = classroom.trackId ? getTrackById(classroom.trackId) : null;

  const crumbs = [
    { label: "Classrooms", href: "/classrooms" },
    { label: classroom.name },
  ];

  // ---- Student view ----
  if (membership.role !== "instructor") {
    const progress = track ? await getTrackProgress(user.id, track.id) : null;
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
        <Breadcrumbs items={crumbs} />
        <h1 className="text-3xl font-semibold tracking-tight">{classroom.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{classroom.memberships.length} members</Badge>
          {track && <Badge variant="outline">{track.title}</Badge>}
        </div>

        {track && progress ? (
          <div className="border-border shadow-soft mt-6 rounded-xl border p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Your progress in {track.shortTitle ?? track.title}</span>
              <span className="text-muted-foreground">
                {progress.completed} / {progress.total} items
              </span>
            </div>
            <Progress value={progress.percent} className="mt-2" />
            <Button asChild size="sm" className="mt-4">
              <Link href={`/tracks/${track.slug}`}>Go to track</Link>
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground mt-6 text-sm">
            This classroom spans all tracks. Head to{" "}
            <Link href="/tracks" className="underline">
              Tracks
            </Link>{" "}
            to keep learning.
          </p>
        )}
      </main>
    );
  }

  // ---- Instructor view ----
  const roster = await getClassroomRoster(classroom.memberships, classroom.trackId);
  const students = roster.filter((r) => r.role === "student");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 lg:px-6">
      <Breadcrumbs items={crumbs} />
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{classroom.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="default">Instructor</Badge>
            {track && <Badge variant="outline">{track.title}</Badge>}
            <span className="text-muted-foreground text-sm">
              {students.length} student{students.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Join code
          </p>
          <CopyJoinCode code={classroom.joinCode} />
          <RegenerateCodeButton classroomId={classroom.id} />
        </div>
      </div>

      {students.length === 0 ? (
        <p className="text-muted-foreground mt-8">
          No students yet. Share the join code above to get started.
        </p>
      ) : (
        <div className="border-border mt-8 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Student</th>
                <th className="px-4 py-3 text-left font-medium">Progress</th>
                <th className="px-4 py-3 text-left font-medium">Assessments</th>
                <th className="px-4 py-3 text-left font-medium">Last active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((row) => (
                <tr key={row.userId} className="border-border border-t">
                  <td className="px-4 py-3">
                    <Link
                      href={`/classrooms/${classroom.id}/students/${row.userId}`}
                      className="group flex items-center gap-2"
                    >
                      <Avatar className="size-7">
                        <AvatarImage src={row.imageUrl ?? undefined} alt="" />
                        <AvatarFallback className="text-xs">
                          {(row.name ?? row.email)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:underline">
                          {row.name ?? row.email}
                        </span>
                        {row.name && (
                          <span className="text-muted-foreground block truncate text-xs">
                            {row.email}
                          </span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={row.percent} className="w-24" />
                      <span className="text-muted-foreground text-xs">
                        {row.completed}/{row.total}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.assessmentsSubmitted}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {fmtDate(row.lastActive)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" aria-label="View student">
                        <Link
                          href={`/classrooms/${classroom.id}/students/${row.userId}`}
                        >
                          <ChevronRight className="size-4" aria-hidden />
                        </Link>
                      </Button>
                      <RemoveMemberButton
                        classroomId={classroom.id}
                        userId={row.userId}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
