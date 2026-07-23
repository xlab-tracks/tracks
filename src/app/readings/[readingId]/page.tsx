import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import type { Paper } from "@/lib/content/types";
import {
  getLinkedReading,
  linkedReadingSource,
  type LinkedReading,
} from "@/lib/readings/registry";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PaperReader } from "@/components/papers/paper-reader";
import { paperSourceHeader } from "@/components/papers/paper-source-header";
import { SidenotesToggle } from "@/components/papers/sidenotes-toggle";

/**
 * Standalone internal viewer for a linked reading — a post that a course
 * paper links to, pre-converted at authoring time (`npm run readings:build`).
 * Deliberately outside the track structure: no module, no progress, no
 * activities, and `internalSublinks={false}` so links inside it stay
 * external — internal-viewer support goes exactly one layer deep.
 */

/** A Paper-shaped shell for PaperReader; not a content-graph item. */
function paperShell(reading: LinkedReading): Paper {
  return {
    id: `reading-${reading.id}`,
    slug: reading.id,
    moduleId: "",
    title: reading.title,
    source: linkedReadingSource(reading),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readingId: string }>;
}): Promise<Metadata> {
  const { readingId } = await params;
  const reading = getLinkedReading(decodeURIComponent(readingId));
  return { title: reading?.title ?? "Reading" };
}

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const { readingId } = await params;
  const reading = getLinkedReading(decodeURIComponent(readingId));
  if (!reading) notFound();

  const source = await paperSourceHeader(linkedReadingSource(reading));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: reading.title }]}
      />

      <header>
        <p className="text-muted-foreground text-sm">Linked reading</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {reading.title}
        </h1>
        {source.authors && (
          <p className="text-muted-foreground mt-2 text-sm">{source.authors}</p>
        )}
        <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
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
          paper={paperShell(reading)}
          signedIn={false}
          completedContentIds={new Set()}
          internalSublinks={false}
        />
      </div>
    </main>
  );
}
