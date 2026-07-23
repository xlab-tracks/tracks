/**
 * Rewrites post-to-post links in converted paper HTML to internal reader
 * routes. Pure string transform over `<a href="…">` attributes: it never
 * touches text content, `data-anchor`/`data-s` values, or tag structure, so
 * edit anchors, sentence indices, and snippet tripwires cannot drift.
 *
 * Applied only to post-sourced (substack / LessWrong) course papers — the
 * standalone `/readings` viewer renders untouched HTML, which is what keeps
 * internal-viewer support one layer deep.
 */

const ANCHOR_HREF_RE = /(<a\b[^>]*?\bhref=")([^"]*)(")/g;

/**
 * Replace each `<a href>` for which `resolve` returns an internal path.
 * Fragment/relative hrefs (footnotes, section links) are skipped before the
 * resolver sees them. Rewritten anchors keep the original URL on
 * `data-reading-link` so the presentation layer can offer "view original".
 */
export function rewriteReadingLinks(
  html: string,
  resolve: (href: string) => string | null,
): string {
  return html.replace(
    ANCHOR_HREF_RE,
    (match, pre: string, href: string, close: string) => {
      if (!href.startsWith("https://")) return match;
      const internal = resolve(href);
      if (!internal) return match;
      // `href` is reinserted verbatim (it is the already-escaped attribute
      // text); `internal` is a route we construct from validated artifact ids.
      return `${pre}${internal}${close} data-reading-link="${href}"`;
    },
  );
}
