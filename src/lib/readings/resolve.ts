import { getContentLocation, papers } from "@/lib/content";
import { parseLessWrongId, parseLessWrongPostUrl } from "@/lib/lesswrong/id";
import { parseSubstackPostUrl } from "@/lib/substack/id";
import { linkedReadingHref, linkedReadings } from "./registry";

/**
 * Site-agnostic lookup key for a substack / LessWrong post URL. LessWrong and
 * the Alignment Forum serve the same posts under different hosts, so LW keys
 * on the ForumMagnum post id alone; substack keys on the artifact id
 * (host__slug). Links carrying a query or fragment (comment permalinks,
 * section anchors) are never internalized — the internal reader can't show
 * comments or the original's anchor targets.
 */
function postKey(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.search !== "" || url.hash !== "") return null;
  const lw = parseLessWrongPostUrl(href);
  if (lw) return `lw:${lw.postId}`;
  const sb = parseSubstackPostUrl(href);
  if (sb) return `sb:${sb.id}`;
  return null;
}

/** A linked reading's key, derived from its artifact id (never its URL). */
function readingKey(reading: (typeof linkedReadings)[number]): string | null {
  if (reading.kind === "lesswrong") {
    const ref = parseLessWrongId(reading.id);
    return ref ? `lw:${ref.postId}` : null;
  }
  return `sb:${reading.id}`;
}

// Course papers win over linked readings: a post the curriculum assigns as a
// reading opens at its course page (with its edits and activities), not the
// bare /readings view. Real-track locations shadow Example-track ones.
const internalHrefByKey: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const reading of linkedReadings) {
    const key = readingKey(reading);
    if (key && !map.has(key)) map.set(key, linkedReadingHref(reading));
  }
  const courseKeys = new Set<string>();
  for (const paper of papers) {
    if (paper.source.kind === "arxiv") continue;
    const key = postKey(paper.source.postUrl);
    const location = getContentLocation(paper.id);
    if (!key || !location) continue;
    const isExample = location.track.kind === "example";
    if (courseKeys.has(key) && isExample) continue;
    courseKeys.add(key);
    map.set(key, location.href);
  }
  return map;
})();

/**
 * The internal destination for a post link inside a course paper or lesson,
 * or null to leave the link external. `rewriteReadingLinks` runs this over
 * post-sourced papers' HTML; `MdxLink` runs it over lessons' markdown links.
 */
export function resolveInternalReadingHref(href: string): string | null {
  const key = postKey(href);
  if (!key) return null;
  return internalHrefByKey.get(key) ?? null;
}
