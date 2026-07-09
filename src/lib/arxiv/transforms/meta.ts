import type * as Ast from "@unified-latex/unified-latex-types";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { match } from "@unified-latex/unified-latex-util-match";
import { visit } from "@unified-latex/unified-latex-util-visit";
import type { TexMeta } from "../types";
import type { WarningCollector } from "../warnings";
import { lastArgContent, plainText, walkNodeArrays } from "./tex-utils";

/**
 * Extract \title/\author into card metadata and remove the title-page
 * machinery from the body (\maketitle renders nothing — the component's
 * header shows title/authors instead, so the paper body starts at the
 * abstract). Author blocks are notoriously messy (affiliations, \thanks,
 * \and); this is a best-effort split that degrades to fewer/no names.
 */
export function extractMeta(
  tree: Ast.Root,
  warnings: WarningCollector,
): TexMeta {
  const meta: TexMeta = {};

  visit(tree, (node) => {
    if (!match.anyMacro(node)) return;
    if (node.content === "title" && !meta.title) {
      const text = plainText(stripThanks(lastArgContent(node)));
      if (text) meta.title = text;
    }
    if (node.content === "author" && !meta.authors) {
      const authors = splitAuthors(lastArgContent(node));
      if (authors.length > 0) meta.authors = authors;
      else warnings.add("meta", "could not parse \\author block");
    }
  });

  removeTitlePageMacros(tree);
  return meta;
}

const TITLE_PAGE_MACROS = new Set([
  "title",
  "author",
  "date",
  "maketitle",
  "thanks",
  "samethanks",
  "footnotemark",
  "affiliation",
  "affil",
  "institute",
  "email",
  "orcid",
  "icmlauthor",
  "icmlaffiliation",
]);

function removeTitlePageMacros(tree: Ast.Root): void {
  // Attach args so removal takes "[1]{CMU}"-style arguments along instead of
  // leaking them as literal text at the top of the paper.
  attachMacroArgs(tree, {
    thanks: { signature: "m" },
    samethanks: { signature: "o" },
    affil: { signature: "o m" },
    affiliation: { signature: "o m" },
    institute: { signature: "m" },
    email: { signature: "m" },
    orcid: { signature: "m" },
    date: { signature: "m" },
    footnotemark: { signature: "o" },
    icmlauthor: { signature: "m m" },
    icmlaffiliation: { signature: "m m" },
  });
  walkNodeArrays(tree, (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (match.anyMacro(node) && TITLE_PAGE_MACROS.has(node.content)) {
        nodes.splice(i, 1);
      }
    }
  });
}

/**
 * Split an author block on \and / \And / \AND. Within each segment,
 * everything after the first \\ is affiliation lines — dropped.
 */
function splitAuthors(nodes: Ast.Node[]): string[] {
  const segments: Ast.Node[][] = [[]];
  for (const node of nodes) {
    if (node.type === "comment") continue; // % line comments are not names
    if (match.anyMacro(node) && /^(and|And|AND)$/.test(node.content)) {
      segments.push([]);
      continue;
    }
    // "\author{A, B and C}" — top-level commas separate names too.
    if (node.type === "string" && node.content === ",") {
      segments.push([]);
      continue;
    }
    if (node.type === "string" && node.content.endsWith(",")) {
      segments[segments.length - 1].push({
        type: "string",
        content: node.content.slice(0, -1),
      });
      segments.push([]);
      continue;
    }
    segments[segments.length - 1].push(node);
  }
  const authors: string[] = [];
  for (const segment of segments) {
    const firstLine: Ast.Node[] = [];
    for (const node of segment) {
      if (match.anyMacro(node) && node.content === "\\") break;
      firstLine.push(node);
    }
    const name = plainText(stripThanks(firstLine))
      // Leftovers from unattached optional args and spacing glue:
      // "[1]", "1.7mm".
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\b\d+(?:\.\d+)?(?:mm|cm|pt|em|ex|in)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (name) authors.push(name);
  }
  return authors;
}

/**
 * Drop \thanks-family macros plus the bracketed leftovers their unattached
 * optional args leave behind ("[1]", "[1.7mm]") — names never contain
 * bracketed runs.
 */
function stripThanks(nodes: Ast.Node[]): Ast.Node[] {
  return nodes.filter((node) => {
    if (
      match.anyMacro(node) &&
      (node.content === "thanks" || node.content === "samethanks")
    ) {
      return false;
    }
    if (node.type === "string" && /^\[[^\]]*\]$/.test(node.content)) {
      return false;
    }
    return true;
  });
}
