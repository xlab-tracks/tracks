import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { toHast } from "mdast-util-to-hast";
import { defaultSchema, sanitize } from "hast-util-sanitize";
import { toHtml } from "hast-util-to-html";
import { gfm } from "micromark-extension-gfm";

// The grader's report is MODEL-GENERATED markdown — unlike authored repo
// content it is untrusted, so it gets a sanitize pass (default schema: no
// scripts, no raw HTML, safe protocols) before being rendered via
// dangerouslySetInnerHTML. GFM stays on for pre-analysis-format stored
// reports (which carry a Scores table) and general GFM constructs in
// model-generated prose.

export function feedbackToHtml(markdown: string): string {
  const mdast = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  const hast = toHast(mdast);
  return toHtml(sanitize(hast, defaultSchema));
}
