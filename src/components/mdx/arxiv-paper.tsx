import "katex/dist/katex.min.css";
import "./arxiv-paper.css";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  TriangleAlert,
} from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildAbsUrl,
  buildPdfUrl,
  parseArxivId,
  type ArxivId,
} from "@/lib/arxiv/id";
import { getPaperArtifact } from "@/lib/arxiv/artifacts";
import {
  CONVERTER_VERSION,
  type ConvertedPaper,
} from "@/lib/arxiv/types";

export interface ArxivPaperProps {
  /** Pinned arXiv id, e.g. "1706.03762v7". The version is required. */
  id: string;
  /** Render expanded instead of collapsed. */
  defaultOpen?: boolean;
}

/**
 * Embeds an arXiv paper, rendered from its LaTeX source to HTML with KaTeX
 * math. Server component with zero client JS — collapse/expand is a native
 * <details>. A paper can never break a lesson: every failure mode renders
 * an inline card instead.
 */
export function ArxivPaper({ id, defaultOpen = false }: ArxivPaperProps) {
  const parsed = parseArxivId(id);
  if (!parsed) {
    return (
      <div className="not-prose border-destructive/40 bg-destructive/5 text-destructive my-6 rounded-xl border p-4 text-sm">
        Invalid arXiv id <code>{id}</code> — a pinned version is required,
        e.g. <code>2301.12345v2</code>.
      </div>
    );
  }
  return (
    <Suspense fallback={<ArxivPaperSkeleton />}>
      <ArxivPaperLoader id={parsed} defaultOpen={defaultOpen} />
    </Suspense>
  );
}

function ArxivPaperSkeleton() {
  return (
    <div className="not-prose bg-card shadow-soft my-6 rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

async function ArxivPaperLoader({
  id,
  defaultOpen,
}: {
  id: ArxivId;
  defaultOpen: boolean;
}) {
  const result = await getPaperArtifact(id.id);

  switch (result.state) {
    case "ready":
      return <PaperCard id={id} paper={result.paper} defaultOpen={defaultOpen} />;
    case "pdf-only":
      return (
        <InfoCard id={id}>
          This paper doesn&apos;t provide LaTeX source, so it can&apos;t be
          rendered inline.
        </InfoCard>
      );
    case "not-found":
      return <ErrorCard id={id}>Paper not found on arXiv.</ErrorCard>;
    case "too-large":
      return (
        <ErrorCard id={id}>
          This paper&apos;s source is too large to render inline.
        </ErrorCard>
      );
    case "unsupported":
    case "failed":
      return (
        <ErrorCard id={id}>
          This paper couldn&apos;t be rendered inline yet.
        </ErrorCard>
      );
    case "not-built":
      return (
        <ErrorCard id={id}>
          This paper hasn&apos;t been rendered yet — run{" "}
          <code>npm run arxiv:build</code> and commit the result.
        </ErrorCard>
      );
  }
}

function PaperCard({
  id,
  paper,
  defaultOpen,
}: {
  id: ArxivId;
  paper: ConvertedPaper;
  defaultOpen: boolean;
}) {
  const approximated = paper.warnings.reduce((n, w) => n + w.count, 0);
  return (
    <details
      className="ax-paper not-prose bg-card shadow-soft group my-6 overflow-hidden rounded-2xl border"
      open={defaultOpen || undefined}
    >
      <summary className="hover:bg-muted/40 flex cursor-pointer items-center gap-3 p-4 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <FileText className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-foreground block truncate text-sm font-semibold">
            {paper.meta.title ?? `arXiv:${id.id}`}
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            {formatAuthors(paper.meta.authors)}
          </span>
        </span>
        <span className="text-muted-foreground border-border hidden shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[11px] sm:inline">
          arXiv:{id.id}
        </span>
        <ChevronDown
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="border-border max-h-[70vh] overflow-y-auto overscroll-contain border-t">
        <div
          className="arxiv-paper px-6 py-5"
          data-conv={CONVERTER_VERSION}
          dangerouslySetInnerHTML={{ __html: paper.html }}
        />
      </div>

      <div className="border-border bg-muted/30 flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-4 py-2.5 text-xs">
        <PaperLink href={buildAbsUrl(id)}>Abstract</PaperLink>
        <PaperLink href={buildPdfUrl(id)}>PDF</PaperLink>
        {approximated > 0 && (
          <details className="text-muted-foreground min-w-0">
            <summary className="flex cursor-pointer items-center gap-1.5 [&::-webkit-details-marker]:hidden">
              <TriangleAlert className="size-3.5 text-amber-600" aria-hidden />
              Some elements are approximated — see the PDF for exact rendering.
            </summary>
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {paper.warnings.slice(0, 12).map((w) => (
                <li key={`${w.code}-${w.detail}`}>
                  {w.code}: {w.detail}
                  {w.count > 1 ? ` (×${w.count})` : ""}
                </li>
              ))}
              {paper.warnings.length > 12 && (
                <li>…and {paper.warnings.length - 12} more</li>
              )}
            </ul>
          </details>
        )}
      </div>
    </details>
  );
}

function formatAuthors(authors: string[] | undefined): string {
  if (!authors || authors.length === 0) return "arXiv paper";
  if (authors.length > 6) return `${authors.slice(0, 6).join(", ")}, et al.`;
  return authors.join(", ");
}

function PaperLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground hover:text-destructive inline-flex items-center gap-1 font-medium transition-colors"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

function ErrorCard({ id, children }: { id: ArxivId; children: React.ReactNode }) {
  return (
    <div className="not-prose border-destructive/40 bg-destructive/5 my-6 rounded-xl border p-4 text-sm">
      <p className="text-destructive">{children}</p>
      <p className="mt-2">
        <a
          href={buildAbsUrl(id)}
          target="_blank"
          rel="noreferrer"
          className="text-destructive font-medium underline underline-offset-2"
        >
          Read arXiv:{id.id} on arxiv.org →
        </a>
      </p>
    </div>
  );
}

/** Muted, non-alarming card for expected degradations (e.g. PDF-only). */
function InfoCard({ id, children }: { id: ArxivId; children: React.ReactNode }) {
  return (
    <div className="not-prose border-border bg-muted/30 my-6 rounded-xl border p-4 text-sm">
      <p className="text-muted-foreground">{children}</p>
      <p className="mt-2">
        <a
          href={buildPdfUrl(id)}
          target="_blank"
          rel="noreferrer"
          className="text-foreground hover:text-destructive font-medium underline underline-offset-2 transition-colors"
        >
          Read the PDF on arXiv →
        </a>
      </p>
    </div>
  );
}
