import { toHtml } from "hast-util-to-html";
import { markdownBlocksToHast } from "@/lib/papers/markdown";

/**
 * Writing-exercise prompts are authored markdown (paragraphs, lists, `$…$`
 * math), rendered server-side so structured multi-part prompts don't have to
 * be flattened into one paragraph. Same trust tier as lesson MDX (authored
 * repo content), same renderer as paper editorial adds — raw HTML in the
 * markdown renders as escaped text. Server-only: keep it out of client
 * components (it pulls in mdast + KaTeX).
 */
export function writingPromptHtml(markdown: string): string {
  return toHtml({ type: "root", children: markdownBlocksToHast(markdown) });
}
