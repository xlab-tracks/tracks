import { getPaperArtifact } from "@/lib/arxiv/artifacts";
import { buildAbsUrl, parseArxivId } from "@/lib/arxiv/id";
import { getSubstackArtifact } from "@/lib/substack/artifacts";
import { buildPostUrl, parseSubstackPostUrl } from "@/lib/substack/id";
import { getLessWrongArtifact } from "@/lib/lesswrong/artifacts";
import {
  buildPostUrl as buildLwPostUrl,
  displayHost,
  parseLessWrongPostUrl,
} from "@/lib/lesswrong/id";
import type { Paper } from "@/lib/content/types";

/**
 * Per-source header bits shared by the course paper page and the standalone
 * /readings viewer: authors from the artifact meta, the external link, and
 * whether the artifact has footnotes (drives the sidenote toggle). Artifact
 * lookups are request-cached, so the page and PaperReader share them.
 */
export async function paperSourceHeader(source: Paper["source"]): Promise<{
  authors: string | null;
  link: { label: string; href: string } | null;
  hasFootnotes: boolean;
}> {
  const hasFootnotesIn = (toc: { kind: string }[] | undefined) =>
    toc?.some((entry) => entry.kind === "footnotes") ?? false;
  switch (source.kind) {
    case "arxiv": {
      const arxivId = parseArxivId(source.arxivId);
      const artifact = arxivId ? await getPaperArtifact(arxivId.id) : null;
      const ready = artifact?.state === "ready" ? artifact.paper : null;
      return {
        authors: ready ? formatAuthors(ready.meta.authors) : null,
        link: arxivId
          ? { label: `arXiv:${arxivId.id}`, href: buildAbsUrl(arxivId) }
          : null,
        hasFootnotes: hasFootnotesIn(ready?.toc),
      };
    }
    case "substack": {
      const postRef = parseSubstackPostUrl(source.postUrl);
      const artifact = postRef ? await getSubstackArtifact(postRef.id) : null;
      const ready = artifact?.state === "ready" ? artifact.post : null;
      return {
        authors: ready ? formatAuthors(ready.meta.authors) : null,
        link: postRef
          ? {
              label: postRef.host,
              href: ready?.meta.canonicalUrl ?? buildPostUrl(postRef),
            }
          : null,
        hasFootnotes: hasFootnotesIn(ready?.toc),
      };
    }
    case "lesswrong": {
      const postRef = parseLessWrongPostUrl(source.postUrl);
      const artifact = postRef ? await getLessWrongArtifact(postRef.id) : null;
      const ready = artifact?.state === "ready" ? artifact.post : null;
      return {
        authors: ready ? formatAuthors(ready.meta.authors) : null,
        link: postRef
          ? {
              label: displayHost(postRef),
              href: ready?.meta.canonicalUrl ?? buildLwPostUrl(postRef),
            }
          : null,
        hasFootnotes: hasFootnotesIn(ready?.toc),
      };
    }
  }
}

function formatAuthors(authors: string[] | undefined): string | null {
  if (!authors || authors.length === 0) return null;
  if (authors.length > 6) return `${authors.slice(0, 6).join(", ")}, et al.`;
  return authors.join(", ");
}
