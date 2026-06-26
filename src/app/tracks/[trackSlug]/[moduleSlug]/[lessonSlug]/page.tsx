import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getLessonBySlugs, getLessonNavigation } from "@/lib/content";
import { isAccessLocked } from "@/lib/content/prerequisites";
import { getCurrentUser } from "@/lib/auth";
import { getPrerequisiteStatus, isLessonCompleted } from "@/lib/progress";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LessonContent } from "@/components/mdx/lesson-content";
import { LessonNav } from "@/components/layout/lesson-nav";
import { LessonCompleteButton } from "@/components/learn/lesson-complete-button";
import { LessonTracker } from "@/components/learn/lesson-tracker";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackSlug: string; moduleSlug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { trackSlug, moduleSlug, lessonSlug } = await params;
  const resolved = getLessonBySlugs(trackSlug, moduleSlug, lessonSlug);
  return { title: resolved?.lesson.title ?? "Lesson" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ trackSlug: string; moduleSlug: string; lessonSlug: string }>;
}) {
  const { trackSlug, moduleSlug, lessonSlug } = await params;
  const resolved = getLessonBySlugs(trackSlug, moduleSlug, lessonSlug);
  if (!resolved) notFound();
  const { track, module, lesson } = resolved;
  const nav = getLessonNavigation(lesson.id);

  const user = await getCurrentUser();

  // Hard prerequisite enforcement: signed-in learners with unmet prerequisites
  // are sent back to the module page. (Signed-out visitors may preview.)
  if (user && track.prerequisiteEnforcement === "hard") {
    const prereqStatuses = await getPrerequisiteStatus(user.id, module.id);
    if (
      isAccessLocked(
        track.prerequisiteEnforcement,
        prereqStatuses.map((s) => s.completed),
      )
    ) {
      redirect(`/tracks/${track.slug}/${module.slug}`);
    }
  }

  const completed = user ? await isLessonCompleted(user.id, lesson.id) : false;

  return (
    <div className="max-w-4xl px-4 py-8 lg:px-8">
      <Breadcrumbs
        items={[
          { label: track.title, href: `/tracks/${track.slug}` },
          { label: module.title, href: `/tracks/${track.slug}/${module.slug}` },
          { label: lesson.title },
        ]}
      />

      <header>
        <p className="text-muted-foreground text-sm">
          Module {module.order}: {module.title}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        {lesson.estimatedMinutes && (
          <p className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
            <Clock className="size-3.5" aria-hidden /> ~{lesson.estimatedMinutes} min
          </p>
        )}
      </header>

      <div className="mt-6">
        <LessonContent contentRef={lesson.contentRef} />
      </div>

      {user ? <LessonTracker lessonId={lesson.id} completed={completed} /> : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {user ? (
          <LessonCompleteButton lessonId={lesson.id} initialCompleted={completed} />
        ) : (
          <Button asChild variant="outline">
            <Link href="/login">Sign in to track progress</Link>
          </Button>
        )}
      </div>

      <LessonNav prev={nav.prev} next={nav.next} />
    </div>
  );
}
