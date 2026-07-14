import { unifiedLatexToHast } from "@unified-latex/unified-latex-to-hast";
import type * as Ast from "@unified-latex/unified-latex-types";
import { parse } from "@unified-latex/unified-latex-util-parse";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import type { Root as HastRoot } from "hast";
import { sanitize } from "hast-util-sanitize";
import { toHtml } from "hast-util-to-html";
import { VFile } from "vfile";
import { addAnchors, applyResolvedColors, styleToClass } from "./hast-passes";
import { wrapSentences } from "./sentences";
import { extractToc, stampLandmarkIds } from "./toc";
import type { ArxivId } from "./id";
import { renderMathInHast } from "./katex";
import { paperSanitizeSchema } from "./sanitize-schema";
import { processCitations } from "./transforms/citations";
import { collectColors } from "./transforms/colors";
import {
  addDefaultTheoremDefs,
  applyItemLabels,
  buildMiscEnvReplacements,
} from "./transforms/envs";
import { buildFloatReplacements } from "./transforms/floats";
import { processFootnotes } from "./transforms/footnotes";
import {
  applyTexorpdfstring,
  collectEnvDefinitions,
  collectKatexMacros,
  expandUserEnvironments,
  expandUserMacros,
} from "./transforms/macros";
import { extractMeta } from "./transforms/meta";
import { stripNoise } from "./transforms/noise";
import { numberDocument, type DocNumbering } from "./transforms/numbering";
import { buildTableReplacements } from "./transforms/tables";
import { buildTextMacroReplacements } from "./transforms/text-macros";
import {
  buildTheoremReplacements,
  scanTheoremDefs,
} from "./transforms/theorems";
import { lastArgContent, texString } from "./transforms/tex-utils";
import type { ConversionResult } from "./types";
import { WarningCollector } from "./warnings";

export { CONVERTER_VERSION } from "./types";

export interface ConvertOptions {
  id: ArxivId;
  /** All files from the e-print, for figure resolution. */
  files: Map<string, Uint8Array>;
}

/**
 * Convert flattened TeX source into sanitized HTML with KaTeX math.
 *
 * Order is load-bearing:
 * - user definitions (envs first, then macros) expand before anything reads
 *   the tree, so custom commands carry their content;
 * - AST passes run before HTML conversion (meta → theorems → noise →
 *   numbering/labels/refs → citations → footnotes);
 * - sanitization runs on the author-controlled tree BEFORE the KaTeX pass,
 *   so KaTeX's style-heavy (but locally generated) output never needs
 *   whitelisting;
 * - anchors are stamped after sanitization so nothing renumbers them.
 */
export function convertLatexToHtml(
  texSource: string,
  opts: ConvertOptions,
): ConversionResult {
  const warnings = new WarningCollector();
  const usedAssets = new Set<string>();

  const tree = parse(texSource);

  const katexTable = collectKatexMacros(texSource, warnings);
  const colorTable = collectColors(texSource);
  const envDefs = collectEnvDefinitions(tree, warnings);
  expandUserEnvironments(tree, envDefs, warnings, colorTable);
  expandUserMacros(tree, warnings);
  applyTexorpdfstring(tree);
  const meta = extractMeta(tree, warnings);
  const theoremDefs = addDefaultTheoremDefs(
    tree,
    scanTheoremDefs(tree, warnings),
  );
  stripNoise(tree, warnings);
  applyItemLabels(tree);
  const numbering = numberDocument(tree, theoremDefs, warnings);
  processCitations(tree, warnings);
  processFootnotes(tree, warnings);

  const floats = buildFloatReplacements({
    tree,
    id: opts.id,
    files: opts.files,
    numbering,
    usedAssets,
    warnings,
    graphicsPaths: scanGraphicsPaths(texSource),
  });
  const tableReplacements = buildTableReplacements(tree, warnings, colorTable);
  const textMacroReplacements = buildTextMacroReplacements(
    tree,
    warnings,
    colorTable,
  );
  const miscEnvReplacements = buildMiscEnvReplacements(tree);

  const file = new VFile();
  // unified-latex bundles unified v10-era types that clash with unified v11's
  // .use(); the plugin itself is `this`-free (verified in its source), so
  // invoke its transformer directly.
  const toHastTransform = unifiedLatexToHast as unknown as (
    options: unknown,
  ) => (tree: Ast.Root, file: VFile) => HastRoot;
  const hastTree = toHastTransform({
    macroReplacements: safeReplacements(
      {
        ...textMacroReplacements,
        ...sectionReplacements(numbering),
        ...floats.macroReplacements,
        caption: orphanCaptionReplacement,
      },
      warnings,
    ),
    environmentReplacements: safeReplacements(
      {
        abstract: abstractReplacement,
        ...buildTheoremReplacements(theoremDefs, numbering),
        ...miscEnvReplacements,
        ...floats.environmentReplacements,
        ...tableReplacements,
      },
      warnings,
    ),
  })(tree, file);

  for (const message of file.messages) {
    const unknown = /Unknown (macro|environment) when converting to HTML `(.*)`/.exec(
      message.reason,
    );
    if (unknown) warnings.add(`unknown-${unknown[1]}`, unknown[2]);
    else warnings.add("latex", message.reason);
  }

  styleToClass(hastTree);
  const clean = sanitize(hastTree, paperSanitizeSchema) as HastRoot;
  addAnchors(clean);
  // Pre-KaTeX (tree is ~10× smaller; .inline-math spans are opaque units
  // holding raw TeX) and post-anchors so sentences bind to their blocks.
  wrapSentences(clean);
  stampLandmarkIds(clean);
  // Before the KaTeX pass, so titles with inline math extract as readable
  // TeX text rather than KaTeX markup.
  const toc = extractToc(clean);
  applyResolvedColors(clean);
  renderMathInHast(clean, katexTable, warnings);

  return {
    html: toHtml(clean),
    toc,
    warnings: warnings.list(),
    usedAssets: [...usedAssets].sort(),
    meta,
  };
}

/**
 * A replacement that throws must never abort the conversion pass (the
 * library runs transforms un-awaited — a throw becomes an unhandled
 * rejection that silently kills everything after it). Degrade to nothing +
 * a warning instead.
 */
function safeReplacements<N>(
  map: Record<string, (node: N) => unknown>,
  warnings: WarningCollector,
): Record<string, (node: N) => unknown> {
  return Object.fromEntries(
    Object.entries(map).map(([name, fn]) => [
      name,
      (node: N) => {
        try {
          return fn(node);
        } catch (err) {
          warnings.add(
            "replacement-error",
            `${name}: ${err instanceof Error ? err.message : String(err)}`,
          );
          return texString("");
        }
      },
    ]),
  );
}

/** Directories declared via \graphicspath{{dir1/}{dir2/}} in the raw source. */
function scanGraphicsPaths(texSource: string): string[] {
  const dirs: string[] = [];
  const outer = /\\graphicspath\s*\{((?:\s*\{[^{}]*\}\s*)+)\}/g;
  for (let m = outer.exec(texSource); m !== null; m = outer.exec(texSource)) {
    for (const inner of m[1].matchAll(/\{([^{}]*)\}/g)) {
      const dir = inner[1].trim().replace(/^\.\//, "");
      if (dir) dirs.push(dir.endsWith("/") ? dir : `${dir}/`);
    }
  }
  return dirs;
}

const SECTION_TAGS: Record<string, string> = {
  section: "h2",
  subsection: "h3",
  subsubsection: "h4",
  paragraph: "h5",
  subparagraph: "h6",
};

/**
 * Report/book-class sources: \chapter takes h2 and everything shifts down
 * one, so the heading hierarchy matches the numbering hierarchy ("2.1" is a
 * child of chapter 2) — the toc's subtree math depends on that.
 */
const CHAPTER_SECTION_TAGS: Record<string, string> = {
  chapter: "h2",
  section: "h3",
  subsection: "h4",
  subsubsection: "h5",
  paragraph: "h6",
  subparagraph: "h6",
};

function sectionReplacements(numbering: DocNumbering) {
  const tags = numbering.hasChapters ? CHAPTER_SECTION_TAGS : SECTION_TAGS;
  const replacements: Record<string, (node: Ast.Macro) => Ast.Node> = {};
  for (const [name, tag] of Object.entries(tags)) {
    replacements[name] = (node) => {
      const info = numbering.sections.get(node);
      const title = lastArgContent(node);
      const content: Ast.Node[] = [];
      if (info?.numberText) {
        content.push(
          htmlLike({
            tag: "span",
            attributes: { className: "ax-secnum" },
            content: [texString(info.numberText)],
          }),
          texString(" "),
        );
      }
      content.push(...title);
      return htmlLike({
        tag,
        attributes: info ? { id: info.id } : undefined,
        content,
      });
    };
  }
  return replacements;
}

/**
 * \caption outside a recognized float (custom box environments, longtable
 * fragments): render as a caption block. Without this, the unknown-macro
 * fallback printRaw's the argument — exposing half-converted `\html-tag:`
 * internals as visible text.
 */
function orphanCaptionReplacement(node: Ast.Macro): Ast.Node {
  return htmlLike({
    tag: "div",
    attributes: { className: "ax-caption" },
    content: lastArgContent(node),
  });
}

function abstractReplacement(env: Ast.Environment): Ast.Macro {
  // Paragraph-wrap the body (split at parbreaks): bare prose in the section
  // would get no data-anchor and no sentence spans, making the abstract —
  // a prime editorial target — unaddressable by paper edits.
  const paragraphs: Ast.Node[][] = [[]];
  for (const node of env.content) {
    if (node.type === "parbreak") paragraphs.push([]);
    else paragraphs[paragraphs.length - 1].push(node);
  }
  return htmlLike({
    tag: "section",
    attributes: { className: "ax-abstract" },
    content: [
      htmlLike({ tag: "h2", content: [texString("Abstract")] }),
      ...paragraphs
        .filter((nodes) =>
          nodes.some((n) => n.type !== "whitespace" && n.type !== "comment"),
        )
        .map((nodes) => htmlLike({ tag: "p", content: nodes })),
    ],
  });
}
