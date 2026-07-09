/**
 * Bump when converter output changes shape or rendering meaningfully, so
 * cached conversions from older code are discarded (a version mismatch on
 * read forces a re-convert from the cached raw e-print). Also stamped on the
 * rendered root as data-conv so future highlight persistence can invalidate.
 *
 * v2: multicolumn/multirow tables, positional table rules, equation-number
 *     sync, appendix lettering, nested-caption recovery, citation fixes.
 * v3: PDF figures rasterized to inline PNGs (was a link placeholder).
 * v4: vertical column dividers (| in the column spec) rendered as borders.
 * v5: don't expand user redefinitions of structural commands (\label, \ref,
 *     \cite, \caption, …) — keeps cross-refs working on papers that wrap them.
 * v6: full-scan overhaul — \textsuperscript crash bypass, \def/\let/
 *     \newenvironment expansion, longtable, orphan captions, \resizebox
 *     unwrap, \ensuremath, graphicspath, width buckets, description lists,
 *     default theorems, biblatex fallback, symbol macros, and more.
 * v7: split-environment repair (begin/end across \newenvironment bodies),
 *     counter/display-macro strips, \par, multicols, group/catcode noise.
 * v8: xcolor support (\definecolor/\colorlet/\cellcolor/\rowcolor/
 *     \textcolor render real colors) and multicols → CSS columns.
 * v9: tcolorbox transcript boxes render titled + colored; minipage columns
 *     sit side by side.
 * v10: TikZ diagrams compile server-side (node-tikzjax WASM) to inline SVG
 *      with the paper's macros/colors; failures keep the placeholder.
 * v11: ordered (interleaved) xparse env args, deduped macro expansion (no
 *      double-expansion from twice-\input definition files), box footer
 *      labels.
 * v12: TikZ — named-color model, color fallbacks, in-snippet def hardening,
 *      count-verified index correlation; more diagrams compile.
 * v13: tcolorbox title chips honor coltitle (default WHITE, per tcolorbox)
 *      instead of inheriting dark body text on a dark chip.
 * v14: TikZ defs move to the TeX preamble (addToPreamble) — injected in the
 *      document body their glue widened the shipped page, so SVG viewports
 *      were ~3000pt wide and diagrams rendered as tiny slivers.
 * v15: papers precompute at authoring time (`npm run arxiv:build`) into
 *      committed artifacts; asset URLs point at static /arxiv/… paths instead
 *      of the (removed) /api/arxiv asset route.
 * v16: precomputed section TOC (`toc` on the artifact) + stamped landmark ids
 *      (ax-abstract/ax-references/ax-footnotes) — powers full-page Paper
 *      items: sidebar section navigation and end-of-section insertions.
 */
export const CONVERTER_VERSION = 16;

export interface ConversionWarning {
  /** Stable machine code, e.g. "unknown-macro", "katex-error". */
  code: string;
  /** Human-readable specifics, e.g. the macro name. */
  detail: string;
  /** Occurrences, when the same (code, detail) repeats. */
  count: number;
}

export interface TexMeta {
  title?: string;
  authors?: string[];
  abstract?: string;
}

export type PaperTocEntryKind = "abstract" | "section" | "references" | "footnotes";

/**
 * One entry of a paper's section tree, extracted at conversion time from the
 * sanitized HAST. Flat array in document order; nesting derives from `level`.
 * Entry ids are the anchor targets used by sidebar navigation and by
 * `Paper.insertions[].sectionId` — stable for a pinned arXiv version +
 * converter version (same contract as data-anchor).
 */
export interface PaperTocEntry {
  kind: PaperTocEntryKind;
  /** "ax-sec-…" for sections; "ax-abstract"/"ax-references"/"ax-footnotes" for landmarks. */
  id: string;
  /** Plain-text title WITHOUT the section number, e.g. "Model Architecture". */
  title: string;
  /** "3.2", "A.1", or "" for unnumbered (starred) sections and landmarks. */
  number: string;
  /** Heading depth 2–4 (h2–h4); landmark sections are 2. */
  level: number;
}

export interface ConversionResult {
  html: string;
  toc: PaperTocEntry[];
  warnings: ConversionWarning[];
  /** Tarball paths of assets actually referenced by the HTML. */
  usedAssets: string[];
  meta: TexMeta;
}

export interface ConvertedPaper {
  html: string;
  toc: PaperTocEntry[];
  warnings: ConversionWarning[];
  meta: TexMeta;
  assets: string[];
  converterVersion: number;
  createdAt: string;
}

/**
 * What `npm run arxiv:build` commits under src/content/arxiv/{id}.json —
 * either a rendered paper or a terminal reason it can't render. Transient
 * failures are never committed; the build script exits nonzero instead.
 */
export type PaperArtifact =
  | { state: "ready"; paper: ConvertedPaper }
  | { state: "pdf-only" }
  | { state: "not-found" }
  | { state: "too-large" }
  | { state: "unsupported" }
  | { state: "failed" };
