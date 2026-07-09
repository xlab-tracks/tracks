import type * as Ast from "@unified-latex/unified-latex-types";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { match } from "@unified-latex/unified-latex-util-match";
import { replaceNode } from "@unified-latex/unified-latex-util-replace";
import { visit } from "@unified-latex/unified-latex-util-visit";
import type { WarningCollector } from "../warnings";
import {
  IdMinter,
  envName,
  lastArgContent,
  rawText,
  slugify,
  texString,
} from "./tex-utils";

const NUMERIC_CITE_MACROS = new Set([
  "cite",
  "citep",
  "Citep",
  "citealp",
  "Citealp",
  "citenum",
  // biblatex forms — approximated numerically like the natbib ones
  "parencite",
  "Parencite",
  "autocite",
  "Autocite",
  "footcite",
  "smartcite",
]);
const AUTHOR_YEAR_CITE_MACROS = new Set([
  "citet",
  "Citet",
  "citealt",
  "Citealt",
  "citeauthor",
  "Citeauthor",
  "citeyear",
  "citeyearpar",
  "textcite",
  "Textcite",
]);
const ALL_CITE_MACROS = new Set([
  ...NUMERIC_CITE_MACROS,
  ...AUTHOR_YEAR_CITE_MACROS,
]);

interface BibEntry {
  key: string;
  index: number;
  id: string;
  content: Ast.Node[];
}

/**
 * Numeric citations against the paper's `thebibliography` (usually spliced
 * from the .bbl by main-tex.ts): every \cite variant becomes [n] links to a
 * generated References section, with back-links to the first citation site.
 * natbib author-year forms degrade to the same numeric style with a warning.
 */
export function processCitations(
  tree: Ast.Root,
  warnings: WarningCollector,
): void {
  attachMacroArgs(tree, {
    bibitem: { signature: "o m" },
    ...Object.fromEntries(
      [...ALL_CITE_MACROS].map((name) => [name, { signature: "s o o m" }]),
    ),
  });

  const ids = new IdMinter();
  const { merged: entries, perEnv } = collectBibEntries(tree, ids);
  if (entries.size === 0) {
    // No parseable bibliography (e.g. biblatex, whose .bbl format we don't
    // read). Render each citation as its bracketed key so the reader at
    // least sees WHAT is cited, instead of leaking unknown-macro spans.
    let warned = false;
    replaceNode(tree, (node) => {
      if (!match.anyMacro(node) || !ALL_CITE_MACROS.has(node.content)) return;
      if (!warned) {
        warnings.add("citations", "bibliography unavailable; showing raw keys");
        warned = true;
      }
      const keys = rawText(lastArgContent(node))
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      return htmlLike({
        tag: "span",
        attributes: { className: "ax-cite" },
        content: [texString(`[${keys.join(", ")}]`)],
      });
    });
    return;
  }

  const citedFirstSiteId = new Map<string, string>();
  let warnedAuthorYear = false;

  replaceNode(tree, (node) => {
    if (!match.anyMacro(node) || !ALL_CITE_MACROS.has(node.content)) return;
    const macroName = node.content;
    if (AUTHOR_YEAR_CITE_MACROS.has(macroName) && !warnedAuthorYear) {
      warnings.add(
        "citations",
        "author-year citations approximated as numeric",
      );
      warnedAuthorYear = true;
    }

    const keys = rawText(lastArgContent(node))
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (keys.length === 0) return null;

    // natbib: \cite[post]{k} is a post-note; \cite[pre][post]{k} is both.
    // Distinguish "second bracket absent" (openMark "") from "present but
    // empty" so \citep[see][]{k} reads as a *pre*-note, not a post-note.
    const optionalArgs = (node.args ?? []).filter((arg) => arg.openMark === "[");
    const nonEmpty = (content: Ast.Node[]) => (content.length > 0 ? content : null);
    const pre = optionalArgs.length === 2 ? nonEmpty(optionalArgs[0].content) : null;
    const post =
      optionalArgs.length === 2
        ? nonEmpty(optionalArgs[1].content)
        : optionalArgs.length === 1
          ? nonEmpty(optionalArgs[0].content)
          : null;

    const content: Ast.Node[] = [texString("[")];
    if (pre) content.push(...pre, texString(" "));
    keys.forEach((key, i) => {
      if (i > 0) content.push(texString(", "));
      const entry = entries.get(key);
      if (!entry) {
        warnings.add("unknown-citation", key);
        content.push(texString("?"));
        return;
      }
      content.push(
        htmlLike({
          tag: "a",
          attributes: { href: `#${entry.id}`, className: "ax-ref" },
          content: [texString(String(entry.index))],
        }),
      );
    });
    if (post) content.push(texString(", "), ...post);
    content.push(texString("]"));

    const attributes: Record<string, string> = { className: "ax-cite" };
    const firstKey = keys.find((k) => entries.has(k));
    if (firstKey && !citedFirstSiteId.has(firstKey)) {
      const siteId = `ax-cite-${slugify(firstKey)}`;
      citedFirstSiteId.set(firstKey, siteId);
      attributes.id = siteId;
    }
    return htmlLike({ tag: "span", attributes, content });
  });

  replaceBibliographyEnv(tree, perEnv, citedFirstSiteId);
}

/**
 * Parse EVERY thebibliography environment (appendices sometimes carry a
 * second one). Entries merge into one key→entry map for citation lookup
 * (indices continue across environments); each environment keeps its own
 * entry list so it renders its own items rather than a duplicate of the
 * first.
 */
function collectBibEntries(
  tree: Ast.Root,
  ids: IdMinter,
): { merged: Map<string, BibEntry>; perEnv: Map<Ast.Environment, BibEntry[]> } {
  const merged = new Map<string, BibEntry>();
  const perEnv = new Map<Ast.Environment, BibEntry[]>();
  visit(tree, (node) => {
    if (!(node.type === "environment" && envName(node) === "thebibliography")) {
      return;
    }
    const list: BibEntry[] = [];
    perEnv.set(node, list);
    let current: BibEntry | null = null;
    for (const child of node.content) {
      if (match.macro(child, "bibitem")) {
        // The parser attaches bibitem args: the key is the {}-delimited arg;
        // the entry text itself is gobbled into a trailing unmarked arg.
        const args = child.args ?? [];
        const key = rawText(
          args.find((arg) => arg.openMark === "{")?.content ?? [],
        ).trim();
        const trailing = args[args.length - 1];
        const inline =
          trailing && trailing.openMark === "" && trailing.content.length > 0
            ? trailing.content
            : [];
        current = {
          key,
          index: merged.size + 1,
          id: ids.mint(`ax-ref-${slugify(key)}`),
          content: [...inline],
        };
        list.push(current);
        if (key && !merged.has(key)) merged.set(key, current);
        continue;
      }
      // Content between bibitems (parsers that don't gobble the entry).
      current?.content.push(child);
    }
  });
  return { merged, perEnv };
}

function replaceBibliographyEnv(
  tree: Ast.Root,
  perEnv: Map<Ast.Environment, BibEntry[]>,
  citedFirstSiteId: Map<string, string>,
): void {
  replaceNode(tree, (node) => {
    if (!(node.type === "environment" && envName(node) === "thebibliography")) {
      return;
    }
    const entries = perEnv.get(node as Ast.Environment) ?? [];
    const items = entries.map((entry) => {
      const content: Ast.Node[] = [...entry.content];
      const backTarget = citedFirstSiteId.get(entry.key);
      if (backTarget) {
        content.push(
          texString(" "),
          htmlLike({
            tag: "a",
            attributes: { href: `#${backTarget}`, className: "ax-backlink" },
            content: [texString("↩")],
          }),
        );
      }
      return htmlLike({
        tag: "li",
        attributes: { id: entry.id },
        content,
      });
    });
    return htmlLike({
      tag: "section",
      attributes: { className: "ax-references" },
      content: [
        htmlLike({ tag: "h2", content: [texString("References")] }),
        htmlLike({ tag: "ol", content: items }),
      ],
    });
  });
}
