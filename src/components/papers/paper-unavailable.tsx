import { buildAbsUrl, buildPdfUrl, type ArxivId } from "@/lib/arxiv/id";
import type { PaperLookup } from "@/lib/arxiv/artifacts";

/**
 * Full-page fallback when a paper's artifact can't render inline. Same copy
 * and philosophy as the ArxivPaper card fallbacks: expected degradations
 * (pdf-only) get a muted card, everything else a destructive one, always
 * with a link out to arxiv.org. The paper page still renders its insertions
 * below this, so the activities (and paper completion) stay reachable.
 */
export function PaperUnavailable({
  id,
  state,
}: {
  id: ArxivId;
  state: Exclude<PaperLookup["state"], "ready">;
}) {
  if (state === "pdf-only") {
    return (
      <div className="border-border bg-muted/30 rounded-xl border p-6 text-sm">
        <p className="text-muted-foreground">
          This paper doesn&apos;t provide LaTeX source, so it can&apos;t be
          rendered inline.
        </p>
        <p className="mt-3">
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

  const message =
    state === "not-found"
      ? "Paper not found on arXiv."
      : state === "too-large"
        ? "This paper's source is too large to render inline."
        : state === "not-built"
          ? "This paper hasn't been rendered yet — run npm run arxiv:build and commit the result."
          : "This paper couldn't be rendered inline yet.";

  return (
    <div className="border-destructive/40 bg-destructive/5 rounded-xl border p-6 text-sm">
      <p className="text-destructive">
        {state === "not-built" ? (
          <>
            This paper hasn&apos;t been rendered yet — run{" "}
            <code>npm run arxiv:build</code> and commit the result.
          </>
        ) : (
          message
        )}
      </p>
      <p className="mt-3">
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
