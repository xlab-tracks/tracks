import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, ExternalLink } from "lucide-react";
import {
  getItemBySlugs,
  getItemNavigation,
  itemIdOf,
  itemTitleOf,
  type ItemRef,
  type Lesson,
  type Module,
  type Paper,
  type Track,
} from "@/lib/content";
import { isAccessLocked } from "@/lib/content/prerequisites";
import { getCurrentUser } from "@/lib/auth";
import {
  getPrerequisiteStatus,
  getTrackCompletionSet,
  isLessonCompleted,
} from "@/lib/progress";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LessonContent } from "@/components/mdx/lesson-content";
import { LessonNav } from "@/components/layout/lesson-nav";
import { LessonCompleteButton } from "@/components/learn/lesson-complete-button";
import { LessonTracker } from "@/components/learn/lesson-tracker";
import { PaperReader } from "@/components/papers/paper-reader";
import { paperSourceHeader } from "@/components/papers/paper-source-header";
import { SidenotesToggle } from "@/components/papers/sidenotes-toggle";
import { Button } from "@/components/ui/button";
import { getVerificationExerciseForLesson } from "@/lib/verification/exercises";

// Dispatching route: a module item slug resolves to either a lesson or a
// paper (they share the /tracks/t/m/<slug> namespace; the static `assessment`
// sibling segment takes precedence).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackSlug: string; moduleSlug: string; itemSlug: string }>;
}): Promise<Metadata> {
  const { trackSlug, moduleSlug, itemSlug } = await params;
  const resolved = getItemBySlugs(trackSlug, moduleSlug, itemSlug);
  return { title: resolved ? itemTitleOf(resolved.item) : "Lesson" };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ trackSlug: string; moduleSlug: string; itemSlug: string }>;
}) {
  const { trackSlug, moduleSlug, itemSlug } = await params;
  const resolved = getItemBySlugs(trackSlug, moduleSlug, itemSlug);
  if (!resolved) notFound();
  const { track, module, item } = resolved;
  const nav = getItemNavigation(itemIdOf(item));

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

  if (item.kind === "lesson") {
    return (
      <LessonItemPage
        track={track}
        module={module}
        lesson={item.lesson}
        nav={nav}
        userId={user?.id ?? null}
      />
    );
  }
  return (
    <PaperItemPage
      track={track}
      module={module}
      paper={item.paper}
      nav={nav}
      userId={user?.id ?? null}
    />
  );
}

async function LessonItemPage({
  track,
  module,
  lesson,
  nav,
  userId,
}: {
  track: Track;
  module: Module;
  lesson: Lesson;
  nav: { prev: ItemRef | null; next: ItemRef | null };
  userId: string | null;
}) {
  const completed = userId ? await isLessonCompleted(userId, lesson.id) : false;

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

      {/* .lesson-reader scopes the sidebar's scroll-spy (see use-scroll-spy)
          and gives heading anchors sticky-header clearance. */}
      <div className="lesson-reader mt-6">
        <LessonContent contentRef={lesson.contentRef} />
      </div>

      {userId ? (
        <LessonTracker
          lessonId={lesson.id}
          completed={completed}
          // Bridged interactives complete when the widget itself reports a
          // finish (via onComplete) — not by scrolling past a one-line body.
          // Unbridged explorables keep normal scroll-to-complete.
          autoComplete={!getVerificationExerciseForLesson(lesson.id)?.bridged}
        />
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {userId ? (
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

async function PaperItemPage({
  track,
  module,
  paper,
  nav,
  userId,
}: {
  track: Track;
  module: Module;
  paper: Paper;
  nav: { prev: ItemRef | null; next: ItemRef | null };
  userId: string | null;
}) {
  // The paper and its inserted lessons are independent completion units; the
  // track completion set (a request-cache hit from the layout) covers them
  // and PaperReader only membership-tests its own ids against it.
  const completedContentIds = userId
    ? await getTrackCompletionSet(userId, track.id)
    : new Set<string>();
  const completed = completedContentIds.has(paper.id);

  // Cached per request — PaperReader reuses the same artifact lookup.
  const source = await paperSourceHeader(paper.source);

  return (
    <div className="max-w-5xl px-4 py-8 lg:px-8">
      <Breadcrumbs
        items={[
          { label: track.title, href: `/tracks/${track.slug}` },
          { label: module.title, href: `/tracks/${track.slug}/${module.slug}` },
          { label: paper.title },
        ]}
      />

      <header>
        <p className="text-muted-foreground text-sm">
          Module {module.order}: {module.title} · Paper
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{paper.title}</h1>
        {source.authors && (
          <p className="text-muted-foreground mt-2 text-sm">{source.authors}</p>
        )}
        <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {paper.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> ~{paper.estimatedMinutes} min
            </span>
          )}
          {source.link && (
            <a
              href={source.link.href}
              target="_blank"
              rel="noreferrer"
              className="hover:text-destructive flex items-center gap-1 font-mono text-xs transition-colors"
            >
              {source.link.label}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
          {source.hasFootnotes && <SidenotesToggle />}
        </p>
      </header>

      <div className="mt-8">
        <PaperReader
          paper={paper}
          signedIn={Boolean(userId)}
          completedContentIds={completedContentIds}
        />
      </div>

      {userId ? (
        <LessonTracker
          lessonId={paper.id}
          completed={completed}
          toastLabel="Paper complete"
        />
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {userId ? (
          <LessonCompleteButton
            lessonId={paper.id}
            initialCompleted={completed}
            toastLabel="Paper marked complete"
          />
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

