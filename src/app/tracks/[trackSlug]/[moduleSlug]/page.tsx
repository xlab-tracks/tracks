import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink, FileText, Lock } from "lucide-react";
import {
  getAssessmentForModule,
  getItemProgressContentIds,
  getItemsForModule,
  getModuleBySlugs,
  getModuleProgressContentIds,
  getResourcesByTopics,
  itemIdOf,
  itemSlugOf,
  itemTitleOf,
} from "@/lib/content";
import { DELIVERABLE_FORMAT_LABELS } from "@/lib/content/types";
import { isAccessLocked } from "@/lib/content/prerequisites";
import { getCurrentUser } from "@/lib/auth";
import { getCompletedLessonIds, getPrerequisiteStatus } from "@/lib/progress";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PrerequisitePanel } from "@/components/learn/prerequisite-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackSlug: string; moduleSlug: string }>;
}): Promise<Metadata> {
  const { trackSlug, moduleSlug } = await params;
  const resolved = getModuleBySlugs(trackSlug, moduleSlug);
  return { title: resolved?.module.title ?? "Module" };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ trackSlug: string; moduleSlug: string }>;
}) {
  const { trackSlug, moduleSlug } = await params;
  const resolved = getModuleBySlugs(trackSlug, moduleSlug);
  if (!resolved) notFound();
  const { track, module } = resolved;

  const items = getItemsForModule(module.id);
  const assessment = getAssessmentForModule(module.id);
  const furtherReading = getResourcesByTopics(module.furtherReadingTopics ?? []);
  const moduleHref = `/tracks/${track.slug}/${module.slug}`;

  const user = await getCurrentUser();
  const prereqStatuses = await getPrerequisiteStatus(user?.id ?? null, module.id);
  const hardLocked =
    !!user &&
    isAccessLocked(
      track.prerequisiteEnforcement,
      prereqStatuses.map((s) => s.completed),
    );
  const completedSet = new Set(
    user
      ? await getCompletedLessonIds(user.id, getModuleProgressContentIds(module.id))
      : [],
  );

  return (
    <div className="max-w-4xl px-4 py-8 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Tracks", href: "/tracks" },
          { label: track.title, href: `/tracks/${track.slug}` },
          { label: module.title },
        ]}
      />

      <p className="text-muted-foreground text-sm">Module {module.order}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{module.title}</h1>
      <p className="text-muted-foreground mt-2">{module.summary}</p>

      <PrerequisitePanel
        statuses={prereqStatuses}
        enforcement={track.prerequisiteEnforcement}
        currentTrackId={track.id}
      />

      {hardLocked ? (
        <Alert className="mt-6">
          <Lock className="size-4" aria-hidden />
          <AlertTitle>Module locked</AlertTitle>
          <AlertDescription>
            Complete the prerequisites above to unlock this content.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Contents</h2>
            <ol className="mt-3 space-y-2">
              {items.map((item, index) => {
                const done = getItemProgressContentIds(item).every((id) =>
                  completedSet.has(id),
                );
                const estimatedMinutes =
                  item.kind === "lesson"
                    ? item.lesson.estimatedMinutes
                    : item.paper.estimatedMinutes;
                return (
                  <li key={itemIdOf(item)}>
                    <Link
                      href={`${moduleHref}/${itemSlugOf(item)}`}
                      className="border-border hover:bg-muted shadow-soft flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        {done ? (
                          <CheckCircle2
                            className="text-foreground size-4 shrink-0"
                            aria-hidden
                          />
                        ) : (
                          <span className="border-muted-foreground/40 size-4 shrink-0 rounded-full border" />
                        )}
                        <span className="font-medium">
                          {index + 1}. {itemTitleOf(item)}
                        </span>
                        {item.kind === "paper" && (
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="size-3" aria-hidden /> Paper
                          </Badge>
                        )}
                      </span>
                      {estimatedMinutes && (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Clock className="size-3.5" aria-hidden /> {estimatedMinutes}m
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>

          {assessment && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Assessment</h2>
              <Card className="shadow-soft mt-3">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="size-4" aria-hidden />
                    <Badge variant="secondary">
                      {DELIVERABLE_FORMAT_LABELS[assessment.format]}
                    </Badge>
                  </div>
                  <CardTitle className="mt-1 text-base">{assessment.title}</CardTitle>
                  <CardDescription>{assessment.prompt}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="outline">
                    <Link href={`${moduleHref}/assessment`}>Open assessment</Link>
                  </Button>
                </CardFooter>
              </Card>
            </section>
          )}

          {furtherReading.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Further reading</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {furtherReading.map((resource) => (
                  <li key={resource.id}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                      {resource.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
