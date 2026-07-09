import "katex/dist/katex.min.css";
import "@/components/mdx/arxiv-paper.css";
import "./paper-reader.css";
import { Fragment } from "react";
import { ExternalLink, TriangleAlert } from "lucide-react";
import { getPaperArtifact } from "@/lib/arxiv/artifacts";
import { buildAbsUrl, buildPdfUrl, parseArxivId } from "@/lib/arxiv/id";
import { CONVERTER_VERSION, type ConversionWarning } from "@/lib/arxiv/types";
import type { Paper, PaperInsertionItem } from "@/lib/content/types";
import { insertionAnchorId, splitPaperHtml } from "@/lib/papers/split-paper";
import { Exercise } from "@/components/mdx/exercise";
import { EmbeddedLesson } from "./embedded-lesson";
import { PaperUnavailable } from "./paper-unavailable";

/**
 * Full-page paper renderer: the converted paper HTML split at end-of-section
 * boundaries with activity blocks (exercise cards, inline lessons)
 * interleaved. All dangerouslySetInnerHTML stays in this server component —
 * segments never cross into client components, so there is no hydration
 * surface. Activity blocks sit BETWEEN .arxiv-paper wrappers, never inside
 * them, so the paper's scoped CSS can't bleed into the cards; the
 * descendant-only styling makes sibling wrappers render identically to one.
 */
export async function PaperReader({
  paper,
  signedIn,
  completedContentIds,
}: {
  paper: Paper;
  signedIn: boolean;
  completedContentIds: Set<string>;
}) {
  switch (paper.source.kind) {
    case "arxiv":
      return (
        <ArxivPaperReader
          paper={paper}
          arxivId={paper.source.arxivId}
          signedIn={signedIn}
          completedContentIds={completedContentIds}
        />
      );
  }
}

async function ArxivPaperReader({
  paper,
  arxivId,
  signedIn,
  completedContentIds,
}: {
  paper: Paper;
  arxivId: string;
  signedIn: boolean;
  completedContentIds: Set<string>;
}) {
  const parsed = parseArxivId(arxivId);
  if (!parsed) {
    return (
      <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-xl border p-6 text-sm">
        Invalid arXiv id <code>{arxivId}</code> — a pinned version is required,
        e.g. <code>2301.12345v2</code>.
      </div>
    );
  }

  const artifact = await getPaperArtifact(parsed.id);
  const allItems = (paper.insertions ?? []).flatMap((insertion) => insertion.items);

  if (artifact.state !== "ready") {
    // The paper can't render, but its activities (and completion) must stay
    // reachable — stack them below the fallback card.
    return (
      <div className="paper-reader">
        <PaperUnavailable id={parsed} state={artifact.state} />
        {allItems.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">Activities</h2>
            {allItems.map((item) => (
              <InsertionBlock
                key={insertionAnchorId(item)}
                item={item}
                signedIn={signedIn}
                completedContentIds={completedContentIds}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const { segments, points, unmatched } = splitPaperHtml(
    artifact.paper.html,
    artifact.paper.toc,
    paper.insertions,
  );
  if (unmatched.length > 0) {
    // Committed content can't reach this (content.test.ts validates every
    // sectionId against the artifact toc); this is a local-iteration net.
    console.warn(
      `[papers] ${paper.id}: insertion sectionId(s) not in arXiv:${parsed.id} toc: ` +
        unmatched.map((u) => u.sectionId).join(", "),
    );
  }
  const unmatchedItems = unmatched.flatMap((insertion) => insertion.items);

  return (
    <div className="paper-reader">
      {segments.map((segment, i) => (
        <Fragment key={i}>
          {segment && (
            <div
              className="arxiv-paper"
              data-conv={CONVERTER_VERSION}
              dangerouslySetInnerHTML={{ __html: segment }}
            />
          )}
          {points[i]?.items.map((item) => (
            <InsertionBlock
              key={insertionAnchorId(item)}
              item={item}
              signedIn={signedIn}
              completedContentIds={completedContentIds}
            />
          ))}
        </Fragment>
      ))}

      {unmatchedItems.length > 0 && (
        <div className="mt-10">
          {process.env.NODE_ENV !== "production" && (
            <p className="text-muted-foreground border-border bg-muted/30 rounded-lg border border-dashed p-3 text-xs">
              Dev note: the activities below target section ids that don&apos;t
              exist in this paper&apos;s toc (see the server console) — they
              were appended here instead. Run{" "}
              <code>npm run arxiv:build -- --toc {parsed.id}</code> to list
              valid ids.
            </p>
          )}
          {unmatchedItems.map((item) => (
            <InsertionBlock
              key={insertionAnchorId(item)}
              item={item}
              signedIn={signedIn}
              completedContentIds={completedContentIds}
            />
          ))}
        </div>
      )}

      <PaperFooter
        absUrl={buildAbsUrl(parsed)}
        pdfUrl={buildPdfUrl(parsed)}
        warnings={artifact.paper.warnings}
      />
    </div>
  );
}

function InsertionBlock({
  item,
  signedIn,
  completedContentIds,
}: {
  item: PaperInsertionItem;
  signedIn: boolean;
  completedContentIds: Set<string>;
}) {
  return (
    <section id={insertionAnchorId(item)}>
      {item.kind === "lesson" ? (
        <EmbeddedLesson
          lessonId={item.id}
          signedIn={signedIn}
          completed={completedContentIds.has(item.id)}
        />
      ) : (
        <div className="my-8">
          <Exercise id={item.id} />
        </div>
      )}
    </section>
  );
}

function PaperFooter({
  absUrl,
  pdfUrl,
  warnings,
}: {
  absUrl: string;
  pdfUrl: string;
  warnings: ConversionWarning[];
}) {
  const approximated = warnings.reduce((n, w) => n + w.count, 0);
  return (
    <div className="border-border mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-xs">
      <FooterLink href={absUrl}>Abstract</FooterLink>
      <FooterLink href={pdfUrl}>PDF</FooterLink>
      {approximated > 0 && (
        <details className="text-muted-foreground min-w-0">
          <summary className="flex cursor-pointer items-center gap-1.5 [&::-webkit-details-marker]:hidden">
            <TriangleAlert className="size-3.5 text-amber-600" aria-hidden />
            Some elements are approximated — see the PDF for exact rendering.
          </summary>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {warnings.slice(0, 12).map((w) => (
              <li key={`${w.code}-${w.detail}`}>
                {w.code}: {w.detail}
                {w.count > 1 ? ` (×${w.count})` : ""}
              </li>
            ))}
            {warnings.length > 12 && <li>…and {warnings.length - 12} more</li>}
          </ul>
        </details>
      )}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
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
