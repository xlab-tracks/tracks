import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, Lock } from "lucide-react";
import {
  getAssessmentForModule,
  getLessonById,
  getModuleById,
  getTrackLessonIds,
  getTrackOutline,
} from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import {
  getCompletedLessonIds,
  getLastViewedLessonId,
  getTrackProgress,
} from "@/lib/progress";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  params: Promise<{ trackSlug: string }>;
}): Promise<Metadata> {
  const { trackSlug } = await params;
  const outline = getTrackOutline(trackSlug);
  return { title: outline?.track.title ?? "Track" };
}

function lessonHref(trackSlug: string, lessonId: string): string | null {
  const lesson = getLessonById(lessonId);
  if (!lesson) return null;
  const module = getModuleById(lesson.moduleId);
  if (!module) return null;
  return `/tracks/${trackSlug}/${module.slug}/${lesson.slug}`;
}

export default async function TrackOverviewPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  const outline = getTrackOutline(trackSlug);
  if (!outline) notFound();
  const { track, modules } = outline;

  const user = await getCurrentUser();
  const progress = user ? await getTrackProgress(user.id, track.id) : null;
  const completedSet = new Set(
    user ? await getCompletedLessonIds(user.id, getTrackLessonIds(track.id)) : [],
  );
  const lastViewedId = user ? await getLastViewedLessonId(user.id, track.id) : null;
  const continueLessonId = lastViewedId ?? modules[0]?.lessons[0]?.id;
  const continueHref = continueLessonId ? lessonHref(track.slug, continueLessonId) : null;

  return (
    <div className="px-4 py-8 lg:px-8">
      <Breadcrumbs
        items={[{ label: "Tracks", href: "/tracks" }, { label: track.title }]}
      />

      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">{track.title}</h1>
        <p className="text-muted-foreground mt-2">{track.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{modules.length} modules</Badge>
          {track.estimatedHours && (
            <Badge variant="secondary">~{track.estimatedHours}h</Badge>
          )}
        </div>
      </header>

      {user && progress ? (
        <Card className="shadow-soft mt-6 max-w-3xl">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Your progress</span>
                <span className="text-muted-foreground">
                  {progress.completed} / {progress.total} lessons
                </span>
              </div>
              <Progress value={progress.percent} className="mt-2" />
            </div>
            {continueHref && (
              <Button asChild>
                <Link href={continueHref}>
                  {progress.completed > 0 ? "Continue" : "Start"}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          <Link href="/login" className="underline">
            Sign in
          </Link>{" "}
          to track your progress and save your writing.
        </p>
      )}

      <ol className="mt-8 space-y-4">
        {modules.map(({ module, lessons }) => {
          const assessment = getAssessmentForModule(module.id);
          const moduleHref = `/tracks/${track.slug}/${module.slug}`;
          const firstLesson = lessons[0];
          return (
            <li key={module.id}>
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Module {module.order}: {module.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {module.summary}
                      </CardDescription>
                    </div>
                    {module.prerequisiteModuleIds.length > 0 && (
                      <Badge variant="outline" className="shrink-0 gap-1">
                        <Lock className="size-3" aria-hidden />
                        {module.prerequisiteModuleIds.length} prereq
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    {lessons.map((lesson) => {
                      const done = completedSet.has(lesson.id);
                      return (
                        <li key={lesson.id} className="flex items-center gap-2">
                          {done ? (
                            <CheckCircle2
                              className="text-foreground size-3.5 shrink-0"
                              aria-hidden
                            />
                          ) : (
                            <span className="border-muted-foreground/40 size-3.5 shrink-0 rounded-full border" />
                          )}
                          <Link
                            href={`${moduleHref}/${lesson.slug}`}
                            className="hover:text-foreground transition-colors"
                          >
                            {lesson.title}
                          </Link>
                        </li>
                      );
                    })}
                    {assessment && (
                      <li className="flex items-center gap-2">
                        <FileText className="size-3.5 shrink-0" aria-hidden />
                        <Link
                          href={`${moduleHref}/assessment`}
                          className="hover:text-foreground transition-colors"
                        >
                          {assessment.title}
                        </Link>
                      </li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button asChild>
                    <Link href={firstLesson ? `${moduleHref}/${firstLesson.slug}` : moduleHref}>
                      Start module
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={moduleHref}>Overview</Link>
                  </Button>
                </CardFooter>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
