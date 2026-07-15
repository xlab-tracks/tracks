import { notFound } from "next/navigation";

export async function importLesson(contentRef: string) {
  try {
    // Per-lesson dynamic import => Turbopack code-splits each MDX body.
    return await import(`@/content/lessons/${contentRef}.mdx`);
  } catch {
    return null;
  }
}

/**
 * One top-level entry of a lesson body, as rendered: a ##/### heading, or an
 * `<Exercise/>` block (which rehype-lesson-sections wraps in an anchor div).
 */
export interface LessonSection {
  /** The anchor id (rehype-slug for headings, `ins-exercise-…` for blocks). */
  id: string;
  /** Heading text; absent on exercise entries (resolve from the registry). */
  title?: string;
  /** Heading depth (2 = ##, 3 = ###); exercises sit one under their section. */
  level: number;
  /** Present on exercise entries: the exercise id. */
  exercise?: string;
}

/**
 * A lesson body's section headings, read from the `sections` export that
 * rehype-lesson-sections adds to every compiled lesson module — the same
 * pipeline run that assigns the heading ids, so these can't drift from the
 * rendered anchors. Missing lesson or export (e.g. a bad contentRef) => [].
 */
export async function getLessonSections(
  contentRef: string,
): Promise<LessonSection[]> {
  const mdxModule = (await importLesson(contentRef)) as {
    sections?: LessonSection[];
  } | null;
  return Array.isArray(mdxModule?.sections) ? mdxModule.sections : [];
}

/**
 * Renders a lesson's MDX body (text + embedded Video/Demo/Exercise/Callout)
 * inside a soft, gray-toned prose container.
 */
export async function LessonContent({ contentRef }: { contentRef: string }) {
  const mdxModule = await importLesson(contentRef);
  if (!mdxModule) notFound();
  const Body = mdxModule.default;

  return (
    <article className="lesson-body prose prose-neutral prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-destructive prose-a:font-medium prose-a:underline-offset-4 max-w-none">
      <Body />
    </article>
  );
}
