import type * as Ast from "@unified-latex/unified-latex-types";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { match } from "@unified-latex/unified-latex-util-match";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";
import { buildAssetUrl, buildPdfUrl, type ArxivId } from "../id";
import { rasterPngPath } from "../rasterize";
import {
  TIKZ_MANIFEST_PATH,
  tikzAssetPath,
  type TikzManifest,
} from "../tikz";
import type { WarningCollector } from "../warnings";
import type { DocNumbering } from "./numbering";
import { envName, lastArgContent, texString } from "./tex-utils";

type MacroReplacement = (node: Ast.Macro) => Ast.Node;
type EnvReplacement = (
  node: Ast.Environment,
) => Ast.Macro | Ast.String | Ast.Environment;

export interface FloatReplacements {
  macroReplacements: Record<string, MacroReplacement>;
  environmentReplacements: Record<string, EnvReplacement>;
}

const RASTER_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const VECTOR_EXTENSIONS = [".pdf", ".eps", ".ps"];
const ALL_EXTENSIONS = [...RASTER_EXTENSIONS, ...VECTOR_EXTENSIONS];

/**
 * Figure/table environments, \includegraphics resolution against the
 * e-print's file tree, and placeholders for what a browser can't show
 * (TikZ, PDF/EPS vector figures). Every asset the HTML references is
 * recorded in `usedAssets` so the pipeline stores exactly those blobs.
 */
export function buildFloatReplacements(opts: {
  tree: Ast.Root;
  id: ArxivId;
  files: Map<string, Uint8Array>;
  numbering: DocNumbering;
  usedAssets: Set<string>;
  warnings: WarningCollector;
  /** Directories from \graphicspath, tried as prefixes when resolving. */
  graphicsPaths?: string[];
}): FloatReplacements {
  const { tree, id, files, numbering, usedAssets, warnings } = opts;
  const graphicsPaths = opts.graphicsPaths ?? [];
  attachMacroArgs(tree, {
    includegraphics: { signature: "s o m" },
    caption: { signature: "o m" },
  });
  // unified-latex converts a float's inner wrapper (center/minipage/…) — and
  // its \caption — before our float replacement runs, so hoist nested captions
  // to the float's direct children first, where extractCaption reliably sees
  // them. Ubiquitous pattern: \begin{figure}\begin{center}…\caption{…}\end…
  hoistNestedCaptions(tree);

  // Case-insensitive lookup of tarball members.
  const byLowerCase = new Map<string, string>();
  for (const path of files.keys()) byLowerCase.set(path.toLowerCase(), path);

  function resolveGraphic(
    requested: string,
  ):
    | { kind: "img" | "pdf"; assetPath: string }
    | { kind: "eps"; assetPath: string }
    | { kind: "missing" } {
    const base = requested.trim().replace(/^\.\//, "");
    const hasExtension = /\.[a-zA-Z]{2,4}$/.test(base);
    const stems = [base, ...graphicsPaths.map((dir) => `${dir}${base}`)];
    const candidates = stems.flatMap((stem) =>
      hasExtension ? [stem] : ALL_EXTENSIONS.map((ext) => `${stem}${ext}`),
    );
    for (const candidate of candidates) {
      const actual = byLowerCase.get(candidate.toLowerCase());
      if (!actual) continue;
      const ext = actual.slice(actual.lastIndexOf(".")).toLowerCase();
      if (RASTER_EXTENSIONS.includes(ext)) return { kind: "img", assetPath: actual };
      if (ext === ".pdf") {
        // The pipeline may have rasterized this PDF to a `${path}.png` sibling.
        const raster = byLowerCase.get(rasterPngPath(actual).toLowerCase());
        if (raster) return { kind: "img", assetPath: raster };
        return { kind: "pdf", assetPath: actual };
      }
      return { kind: "eps", assetPath: actual };
    }
    return { kind: "missing" };
  }

  function graphicNode(node: Ast.Macro): Ast.Node {
    const requested = printRaw(lastArgContent(node)).trim();
    const resolved = resolveGraphic(requested);
    switch (resolved.kind) {
      case "img": {
        usedAssets.add(resolved.assetPath);
        const classes = ["ax-graphic"];
        const bucket = widthBucket(node);
        if (bucket) classes.push(`ax-w-${bucket}`);
        return htmlLike({
          tag: "img",
          attributes: {
            src: buildAssetUrl(id, resolved.assetPath),
            alt: requested,
            className: classes,
          },
        });
      }
      case "pdf":
        usedAssets.add(resolved.assetPath);
        warnings.add("vector-figure", `${resolved.assetPath} shown as a link`);
        return placeholder(
          "This figure is a vector PDF and can't be shown inline.",
          [
            link(buildAssetUrl(id, resolved.assetPath), "Open figure"),
            texString(" · "),
            link(buildPdfUrl(id), "arXiv PDF"),
          ],
        );
      case "eps":
        warnings.add("vector-figure", `${resolved.assetPath} not renderable`);
        return placeholder(
          "This figure is in a format browsers can't display.",
          [link(buildPdfUrl(id), "See the arXiv PDF")],
        );
      default:
        warnings.add("missing-graphic", requested);
        return placeholder(`Missing figure: ${requested}`, [
          link(buildPdfUrl(id), "See the arXiv PDF"),
        ]);
    }
  }

  function floatReplacement(kind: "figure" | "table"): EnvReplacement {
    return (env) => {
      const info =
        kind === "figure"
          ? numbering.figures.get(env)
          : numbering.tables.get(env);
      const { caption, rest } = extractCaption(env.content);
      const word = kind === "figure" ? "Figure" : "Table";
      const children: Ast.Node[] = [...rest];
      if (caption || info) {
        const captionContent: Ast.Node[] = [
          htmlLike({
            tag: "strong",
            content: [
              texString(info ? `${word} ${info.numberText}: ` : `${word}: `),
            ],
          }),
          ...(caption ?? []),
        ];
        children.push(
          htmlLike({ tag: "figcaption", content: captionContent }),
        );
      }
      if (containsEnv(env.content, "subfigure")) {
        warnings.add("subfigures", "subfigure layout approximated");
      }
      return htmlLike({
        tag: "figure",
        attributes: {
          className: kind === "figure" ? "ax-figure" : "ax-table",
          id: info?.id,
        },
        content: children,
      });
    };
  }

  // TikZ: the pipeline pre-compiled diagrams to SVG assets in document
  // order. Correlate by index — trusted only when BOTH sides saw the same
  // total number of diagrams (macro-expansion duplication would shift
  // indices and attach the wrong image; count mismatch → placeholders).
  const compiledIndices = new Set<number>();
  {
    const raw = files.get(TIKZ_MANIFEST_PATH);
    if (raw) {
      try {
        const manifest = JSON.parse(
          new TextDecoder().decode(raw),
        ) as TikzManifest;
        if (manifest.total === countTikzEnvs(tree)) {
          for (const index of manifest.indices) compiledIndices.add(index);
        } else {
          warnings.add(
            "tikz",
            "diagram count changed during conversion; using placeholders",
          );
        }
      } catch {
        // no manifest — placeholders throughout
      }
    }
  }
  let tikzIndex = 0;
  const tikzPlaceholder: EnvReplacement = () => {
    const index = tikzIndex++;
    const assetPath = tikzAssetPath(index);
    if (compiledIndices.has(index) && files.has(assetPath)) {
      usedAssets.add(assetPath);
      return htmlLike({
        tag: "img",
        attributes: {
          src: buildAssetUrl(id, assetPath),
          alt: "diagram",
          className: "ax-graphic ax-tikz",
        },
      });
    }
    warnings.add("tikz", "TikZ diagram not renderable");
    return placeholder("This diagram (TikZ) can't be rendered inline.", [
      link(buildPdfUrl(id), "See the arXiv PDF"),
    ]);
  };

  const codeBlock: EnvReplacement = (env) =>
    htmlLike({
      tag: "pre",
      attributes: { className: "ax-code" },
      content: [
        htmlLike({ tag: "code", content: [texString(printRaw(env.content))] }),
      ],
    });

  const algorithmReplacement: EnvReplacement = (env) => {
    warnings.add("algorithm", "algorithm shown as source");
    const { caption, rest } = extractCaption(env.content);
    const children: Ast.Node[] = [];
    if (caption) {
      children.push(
        htmlLike({
          tag: "figcaption",
          content: [
            htmlLike({ tag: "strong", content: [texString("Algorithm: ")] }),
            ...caption,
          ],
        }),
      );
    }
    children.push(
      htmlLike({
        tag: "pre",
        attributes: { className: "ax-code" },
        content: [
          htmlLike({ tag: "code", content: [texString(printRaw(rest))] }),
        ],
      }),
    );
    return htmlLike({
      tag: "figure",
      attributes: { className: "ax-algorithm" },
      content: children,
    });
  };

  return {
    macroReplacements: { includegraphics: graphicNode },
    environmentReplacements: {
      figure: floatReplacement("figure"),
      "figure*": floatReplacement("figure"),
      table: floatReplacement("table"),
      "table*": floatReplacement("table"),
      tikzpicture: tikzPlaceholder,
      lstlisting: codeBlock,
      minted: codeBlock,
      algorithm: algorithmReplacement,
      "algorithm*": algorithmReplacement,
      algorithmic: codeBlock,
    },
  };
}

const FLOAT_ENVS = new Set(["figure", "table"]);

/**
 * Move \caption macros nested inside a float's wrapper environments/groups up
 * to be direct children of the float, preserving document order. Runs on the
 * raw AST before conversion, so the caption is still a `\caption` macro.
 */
function hoistNestedCaptions(tree: Ast.Root): void {
  const walk = (nodes: Ast.Node[]) => {
    for (const node of nodes) {
      if (
        node.type === "environment" &&
        FLOAT_ENVS.has(envName(node).replace(/\*$/, ""))
      ) {
        const nested: Ast.Node[] = [];
        collectNestedCaptions(node.content, nested, true);
        node.content.push(...nested);
      }
      for (const arr of childArrays(node)) walk(arr);
    }
  };
  walk(tree.content);
}

/** Pull \caption from strictly-nested containers (not the top level) into `out`. */
function collectNestedCaptions(
  nodes: Ast.Node[],
  out: Ast.Node[],
  topLevel: boolean,
): void {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (!topLevel && match.macro(node, "caption")) {
      out.unshift(node);
      nodes.splice(i, 1);
      continue;
    }
    // Don't descend into a nested float — its captions are its own.
    if (
      node.type === "environment" &&
      FLOAT_ENVS.has(envName(node).replace(/\*$/, ""))
    ) {
      continue;
    }
    if (node.type === "group" || node.type === "environment") {
      collectNestedCaptions(node.content, out, false);
    }
  }
}

function childArrays(node: Ast.Node): Ast.Node[][] {
  const arrays: Ast.Node[][] = [];
  if ("content" in node && Array.isArray(node.content)) {
    arrays.push(node.content as Ast.Node[]);
  }
  if ("args" in node && Array.isArray(node.args)) {
    for (const arg of node.args) arrays.push(arg.content);
  }
  return arrays;
}

const WIDTH_BUCKETS = [15, 25, 33, 40, 50, 60, 66, 75, 90, 100];

/**
 * Map \includegraphics[width=0.5\textwidth] / [scale=0.6] to a coarse
 * percentage class so author sizing intent survives (side-by-side panels,
 * small inline logos). Absolute lengths (cm/pt) are left at natural size.
 */
function widthBucket(node: Ast.Macro): number | null {
  const optional = node.args?.find((a) => a.openMark === "[");
  if (!optional) return null;
  const spec = printRaw(optional.content);
  let fraction: number | null = null;
  let m = /width\s*=\s*([\d.]+)\s*\\(?:text|line|column)width/.exec(spec);
  if (m) fraction = parseFloat(m[1]);
  if (fraction === null) {
    m = /scale\s*=\s*([\d.]+)/.exec(spec);
    if (m) fraction = parseFloat(m[1]);
  }
  if (fraction === null || !Number.isFinite(fraction) || fraction <= 0) {
    return null;
  }
  const pct = Math.min(100, fraction * 100);
  let best = WIDTH_BUCKETS[0];
  for (const b of WIDTH_BUCKETS) {
    if (Math.abs(b - pct) < Math.abs(best - pct)) best = b;
  }
  return best;
}

/**
 * Remove \caption macros from float content. The FIRST becomes the float's
 * figcaption; any further ones (subfigure/minipage sub-captions) are kept in
 * place as inline caption blocks instead of being silently deleted.
 */
function extractCaption(content: Ast.Node[]): {
  caption: Ast.Node[] | null;
  rest: Ast.Node[];
} {
  let caption: Ast.Node[] | null = null;
  const rest: Ast.Node[] = [];
  const consume = (node: Ast.Macro): Ast.Node | null => {
    if (caption === null) {
      caption = lastArgContent(node);
      return null;
    }
    return htmlLike({
      tag: "div",
      attributes: { className: "ax-subcaption" },
      content: lastArgContent(node),
    });
  };
  for (const node of content) {
    if (match.macro(node, "caption")) {
      const kept = consume(node);
      if (kept) rest.push(kept);
      continue;
    }
    // Recurse into wrappers authors commonly nest the \caption inside:
    // groups ({...}) and layout environments (center, minipage, subfigure…).
    if (node.type === "group" || node.type === "environment") {
      const innerRest: Ast.Node[] = [];
      for (const child of node.content) {
        if (match.macro(child, "caption")) {
          const kept = consume(child);
          if (kept) innerRest.push(kept);
          continue;
        }
        innerRest.push(child);
      }
      // one more shallow level (center inside minipage etc.)
      for (let i = 0; i < innerRest.length; i++) {
        const child = innerRest[i];
        if (child.type === "group" || child.type === "environment") {
          const deeper = extractCaption(child.content);
          if (deeper.caption && caption === null) caption = deeper.caption;
          else if (deeper.caption) {
            deeper.rest.push(
              htmlLike({
                tag: "div",
                attributes: { className: "ax-subcaption" },
                content: deeper.caption,
              }),
            );
          }
          innerRest[i] = { ...child, content: deeper.rest } as Ast.Node;
        }
      }
      rest.push({ ...node, content: innerRest } as Ast.Node);
      continue;
    }
    rest.push(node);
  }
  return { caption, rest };
}

/** Count tikzpicture envs in the (transformed) tree, document order-agnostic. */
function countTikzEnvs(tree: Ast.Root): number {
  let count = 0;
  const walk = (nodes: Ast.Node[]) => {
    for (const node of nodes) {
      if (
        (node.type === "environment" || node.type === "mathenv") &&
        envName(node).replace(/\*$/, "") === "tikzpicture"
      ) {
        count++;
        continue;
      }
      if ("content" in node && Array.isArray(node.content)) {
        walk(node.content as Ast.Node[]);
      }
      if (node.type === "macro" && Array.isArray(node.args)) {
        for (const arg of node.args) walk(arg.content);
      }
    }
  };
  walk(tree.content);
  return count;
}

function containsEnv(nodes: Ast.Node[], targetName: string): boolean {
  return nodes.some((node) => {
    if (
      (node.type === "environment" || node.type === "mathenv") &&
      envName(node).replace(/\*$/, "") === targetName
    ) {
      return true;
    }
    if ("content" in node && Array.isArray(node.content)) {
      return containsEnv(node.content as Ast.Node[], targetName);
    }
    return false;
  });
}

function placeholder(text: string, links: Ast.Node[]): Ast.Macro {
  return htmlLike({
    tag: "div",
    attributes: { className: "ax-placeholder" },
    content: [
      htmlLike({ tag: "p", content: [texString(text)] }),
      htmlLike({ tag: "p", content: links }),
    ],
  });
}

function link(href: string, text: string): Ast.Macro {
  return htmlLike({
    tag: "a",
    attributes: { href, className: "ax-ref" },
    content: [texString(text)],
  });
}
