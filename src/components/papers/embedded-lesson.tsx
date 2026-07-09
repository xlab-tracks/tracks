import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { getLessonById } from "@/lib/content";
import { importLesson } from "@/components/mdx/lesson-content";
import { LessonTracker } from "@/components/learn/lesson-tracker";

/**
 * A lesson rendered inline inside a paper's flow (via Paper.insertions).
 * Framed as an embedded card so it reads as commentary distinct from the
 * paper text. Completes on scroll-past via its own tracker sentinel —
 * recordView is off so opening the paper doesn't stamp lastViewedAt for
 * every embedded lesson at once. Never notFound()s: a missing lesson or MDX
 * body degrades to an inline error card, matching the ArxivPaper philosophy
 * that embedded content can't break its page.
 */
export async function EmbeddedLesson({
  lessonId,
  signedIn,
  completed,
}: {
  lessonId: string;
  signedIn: boolean;
  completed: boolean;
}) {
  const lesson = getLessonById(lessonId);
  const mdxModule = lesson ? await importLesson(lesson.contentRef) : null;
  if (!lesson || !mdxModule) {
    return (
      <div className="border-destructive/40 bg-destructive/5 text-destructive my-6 rounded-xl border p-4 text-sm">
        Embedded lesson <code>{lessonId}</code> couldn&apos;t be loaded.
      </div>
    );
  }
  const Body = mdxModule.default;

  return (
    <div className="bg-card shadow-soft my-8 overflow-hidden rounded-2xl border">
      <div className="border-border bg-muted/30 flex items-center gap-3 border-b px-5 py-3">
        <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <BookOpen className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Lesson
          </p>
          <p className="text-foreground truncate text-sm font-semibold">
            {lesson.title}
          </p>
        </div>
        {lesson.estimatedMinutes ? (
          <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
            <Clock className="size-3.5" aria-hidden /> ~{lesson.estimatedMinutes} min
          </span>
        ) : null}
        {completed && (
          <CheckCircle2 className="text-foreground size-4 shrink-0" aria-hidden />
        )}
      </div>
      <div className="px-5 py-4">
        <article className="lesson-body prose prose-neutral prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-destructive prose-a:font-medium prose-a:underline-offset-4 max-w-none">
          <Body />
        </article>
        {signedIn && (
          <LessonTracker
            lessonId={lesson.id}
            completed={completed}
            recordView={false}
          />
        )}
      </div>
    </div>
  );
}
