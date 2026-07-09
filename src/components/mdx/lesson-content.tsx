import { notFound } from "next/navigation";

async function importLesson(contentRef: string) {
  try {
    // Per-lesson dynamic import => Turbopack code-splits each MDX body.
    return await import(`@/content/lessons/${contentRef}.mdx`);
  } catch {
    return null;
  }
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
