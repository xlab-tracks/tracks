import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getClassroom, getMembership } from "@/lib/classrooms";
import {
  getAssessmentForModule,
  getItemProgressContentIds,
  getTrackById,
  getTrackOutline,
  getTrackProgressContentIds,
  itemIdOf,
  itemTitleOf,
  tracks,
  type Track,
} from "@/lib/content";
import { getCompletedLessonIds, getSubmission, getTrackProgress } from "@/lib/progress";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Student progress" };

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>;
}) {
  const { id, sid } = await params;
  const user = await requireUser();

  const myMembership = await getMembership(user.id, id);
  if (myMembership?.role !== "instructor") notFound();

  const classroom = await getClassroom(id);
  if (!classroom) notFound();
  const member = classroom.memberships.find((m) => m.userId === sid);
  if (!member) notFound();
  const student = member.user;

  const trackList: Track[] = classroom.trackId
    ? [getTrackById(classroom.trackId)].filter((t): t is Track => Boolean(t))
    : tracks;

  const trackData = await Promise.all(
    trackList.map(async (track) => {
      const outline = getTrackOutline(track.slug)!;
      const completed = new Set(
        await getCompletedLessonIds(sid, getTrackProgressContentIds(track.id)),
      );
      const progress = await getTrackProgress(sid, track.id);
      const modules = await Promise.all(
        outline.modules.map(async ({ module, items }) => {
          const assessment = getAssessmentForModule(module.id);
          const submission = assessment
            ? await getSubmission(sid, assessment.id, "assessment")
            : null;
          return { module, items, assessment, submission };
        }),
      );
      return { track, progress, completed, modules };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <Breadcrumbs
        items={[
          { label: "Classrooms", href: "/classrooms" },
          { label: classroom.name, href: `/classrooms/${classroom.id}` },
          { label: student.name ?? student.email },
        ]}
      />

      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarImage src={student.imageUrl ?? undefined} alt="" />
          <AvatarFallback>
            {(student.name ?? student.email)[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {student.name ?? student.email}
          </h1>
          {student.name && (
            <p className="text-muted-foreground text-sm">{student.email}</p>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {trackData.map(({ track, progress, completed, modules }) => (
          <section key={track.id}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{track.title}</h2>
              <span className="text-muted-foreground text-sm">
                {progress.completed}/{progress.total} items
              </span>
            </div>
            <Progress value={progress.percent} className="mt-2" />

            <Accordion type="multiple" className="mt-3">
              {modules.map(({ module, items, assessment, submission }) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger className="text-sm">
                    Module {module.order}: {module.title}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <ul className="space-y-1 text-sm">
                      {items.map((item) => {
                        const done = getItemProgressContentIds(item).every((id) =>
                          completed.has(id),
                        );
                        return (
                          <li
                            key={itemIdOf(item)}
                            className="flex items-center gap-2"
                          >
                            {done ? (
                              <CheckCircle2 className="text-foreground size-3.5" aria-hidden />
                            ) : (
                              <Circle className="size-3.5 opacity-30" aria-hidden />
                            )}
                            {itemTitleOf(item)}
                            {item.kind === "paper" && (
                              <FileText
                                className="size-3 shrink-0 opacity-60"
                                aria-hidden
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {assessment && (
                      <div className="border-border rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="size-3.5" aria-hidden />
                          {assessment.title}
                          <Badge variant="secondary">
                            {submission?.status ?? "not started"}
                          </Badge>
                        </div>
                        {submission?.responseJson ? (
                          <dl className="mt-2 space-y-2 text-sm">
                            {assessment.sections.map((section) => {
                              const values = submission.responseJson as Record<
                                string,
                                string
                              >;
                              const value = values[section.id];
                              if (!value) return null;
                              return (
                                <div key={section.id}>
                                  <dt className="text-muted-foreground text-xs font-medium uppercase">
                                    {section.label}
                                  </dt>
                                  <dd className="whitespace-pre-wrap">{value}</dd>
                                </div>
                              );
                            })}
                          </dl>
                        ) : (
                          <p className="text-muted-foreground mt-1 text-xs">
                            No submission yet.
                          </p>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
    </main>
  );
}
