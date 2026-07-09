import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, ExternalLink } from "lucide-react";
import {
  getInsertedLessonsForPaper,
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
import { getPaperArtifact } from "@/lib/arxiv/artifacts";
import { buildAbsUrl, parseArxivId } from "@/lib/arxiv/id";
import {
  getCompletedLessonIds,
  getPrerequisiteStatus,
  isLessonCompleted,
} from "@/lib/progress";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LessonContent } from "@/components/mdx/lesson-content";
import { LessonNav } from "@/components/layout/lesson-nav";
import { LessonCompleteButton } from "@/components/learn/lesson-complete-button";
import { LessonTracker } from "@/components/learn/lesson-tracker";
import { PaperReader } from "@/components/papers/paper-reader";
import { Button } from "@/components/ui/button";

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

      <div className="mt-6">
        <LessonContent contentRef={lesson.contentRef} />
      </div>

      {userId ? <LessonTracker lessonId={lesson.id} completed={completed} /> : null}

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
  // The paper and its inserted lessons are independent completion units.
  const contentIds = [
    paper.id,
    ...getInsertedLessonsForPaper(paper.id).map((l) => l.id),
  ];
  const completedContentIds = new Set(
    userId ? await getCompletedLessonIds(userId, contentIds) : [],
  );
  const completed = completedContentIds.has(paper.id);

  // Cached per request — PaperReader reuses the same artifact lookup.
  const arxivId = parseArxivId(paper.source.arxivId);
  const artifact = arxivId ? await getPaperArtifact(arxivId.id) : null;
  const authors =
    artifact?.state === "ready" ? formatAuthors(artifact.paper.meta.authors) : null;

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
        {authors && <p className="text-muted-foreground mt-2 text-sm">{authors}</p>}
        <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {paper.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> ~{paper.estimatedMinutes} min
            </span>
          )}
          {arxivId && (
            <a
              href={buildAbsUrl(arxivId)}
              target="_blank"
              rel="noreferrer"
              className="hover:text-destructive flex items-center gap-1 font-mono text-xs transition-colors"
            >
              arXiv:{arxivId.id}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
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

function formatAuthors(authors: string[] | undefined): string | null {
  if (!authors || authors.length === 0) return null;
  if (authors.length > 6) return `${authors.slice(0, 6).join(", ")}, et al.`;
  return authors.join(", ");
}
