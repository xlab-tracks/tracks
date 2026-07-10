import { notFound } from "next/navigation";

async function importReader(readerId: string) {
  try {
    // Precomputed combined document (scripts/build-readers.ts). Per-reader
    // dynamic import => Turbopack code-splits each reader body.
    return await import(`@/content/readers/${readerId}.mdx`);
  } catch {
    return null;
  }
}

/**
 * Renders a reader's precomputed combined MDX. `reader-body` scopes the CSS
 * counters that render the 1.1.1 heading numbers (see globals.css); the prose
 * classes match a standalone lesson so embedded Demos/Exercises look identical.
 */
export async function ReaderContent({ readerId }: { readerId: string }) {
  const mdxModule = await importReader(readerId);
  if (!mdxModule) notFound();
  const Body = mdxModule.default;

  return (
    <article className="reader-body lesson-body prose prose-neutral prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-destructive prose-a:font-medium prose-a:underline-offset-4 max-w-none">
      <Body />
    </article>
  );
}
