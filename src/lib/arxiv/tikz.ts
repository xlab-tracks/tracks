import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "@unified-latex/unified-latex-util-parse";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";
import type * as Ast from "@unified-latex/unified-latex-types";
import { collectColors, declaredColorNames } from "./transforms/colors";
import { envName, stripTexComments } from "./transforms/tex-utils";

/**
 * Server-side TikZ rendering via node-tikzjax (a TeX engine compiled to
 * WASM — no native deps, same deployment story as mupdf). Runs once per
 * paper on the cold conversion path; produced SVGs are cached like any
 * other figure asset and rendered as plain <img>, keeping the widget
 * zero-client-JS.
 *
 * Best-effort by design: each diagram compiles independently with the
 * paper's own macro/color/style definitions prepended; failures fall back
 * to the existing placeholder card.
 */

const MAX_DIAGRAMS = 24;
const MAX_SNIPPET_BYTES = 60_000;
const MAX_SVG_BYTES = 2_000_000;
const MAX_EMBEDDED_FONT_BYTES = 800_000;
/**
 * Compile budgets. A spinning TeX loop is hard-TERMINATED per diagram; the
 * whole-paper budget leaves the rest as placeholders. Netlify's synchronous
 * function ceiling is tight, so budgets shrink there — the warm script (or
 * any later request, since raw bytes are already persisted) retries with
 * whatever budget remains. Real published diagrams compile in ~1–3s.
 */
const ON_NETLIFY = !!process.env.NETLIFY;
const DIAGRAM_TIMEOUT_MS = ON_NETLIFY ? 6_000 : 25_000;
const TOTAL_TIKZ_BUDGET_MS = ON_NETLIFY ? 18_000 : 90_000;

/**
 * Locate node-tikzjax on disk WITHOUT module resolution: bundlers rewrite
 * require/require.resolve for externalized packages into virtual ids that a
 * worker thread cannot require. cwd works in next dev, vitest, and Netlify
 * functions (whose bundle keeps external node_modules alongside).
 */
function resolveTikzjaxRoot(): string | null {
  let dir = process.cwd();
  for (let hop = 0; hop < 4; hop++) {
    const candidate = path.join(dir, "node_modules", "node-tikzjax");
    if (existsSync(path.join(candidate, "dist", "index.js"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function tikzAssetPath(index: number): string {
  return `__tikz__/${index}.svg`;
}

/** Manifest of compiled diagrams. */
export const TIKZ_MANIFEST_PATH = "__tikz__/manifest.json";

export interface TikzManifest {
  /** How many tikzpicture environments the fresh parse saw, in total. */
  total: number;
  /** Indices (document order) that compiled successfully. */
  indices: number[];
}

interface TikzJob {
  index: number;
  source: string;
}

/** Definition macros whose bodies must not contribute diagrams. */
const DEFINITION_MACRO_NAMES = new Set([
  "newcommand",
  "renewcommand",
  "providecommand",
  "def",
  "gdef",
  "edef",
  "NewDocumentCommand",
  "RenewDocumentCommand",
  "newenvironment",
  "renewenvironment",
  "NewDocumentEnvironment",
  "RenewDocumentEnvironment",
  "newtcolorbox",
  "renewtcolorbox",
]);

/**
 * Collect document-order tikzpicture environments from a FRESH parse.
 * Walks content arrays AND wrapper-macro args (\resizebox{..}{..}{tikz} is
 * common), but skips definition-macro bodies so an unused \newcommand'd
 * diagram doesn't shift the ordering the converter will see.
 */
export function extractTikzPictures(texSource: string): TikzJob[] {
  const tree = parse(texSource);
  const jobs: TikzJob[] = [];
  const walk = (nodes: Ast.Node[]) => {
    for (const node of nodes) {
      if (
        (node.type === "environment" || node.type === "mathenv") &&
        envName(node).replace(/\*$/, "") === "tikzpicture"
      ) {
        jobs.push({ index: jobs.length, source: printRaw(node) });
        continue; // no nested tikzpictures
      }
      if ("content" in node && Array.isArray(node.content)) {
        walk(node.content as Ast.Node[]);
      }
      if (
        node.type === "macro" &&
        !DEFINITION_MACRO_NAMES.has(node.content) &&
        Array.isArray(node.args)
      ) {
        for (const arg of node.args) walk(arg.content);
      }
    }
  };
  walk(tree.content);
  return jobs;
}

/** Replace tikzpicture bodies with blanks (offsets preserved for scanning). */
function blankTikzBodies(source: string): string {
  let out = source;
  const beginTag = "\\begin{tikzpicture}";
  const endTag = "\\end{tikzpicture}";
  let from = 0;
  for (;;) {
    const start = out.indexOf(beginTag, from);
    if (start === -1) break;
    const end = out.indexOf(endTag, start);
    if (end === -1) break;
    const stop = end + endTag.length;
    out = out.slice(0, start) + " ".repeat(stop - start) + out.slice(stop);
    from = stop;
  }
  return out;
}

/**
 * Apply the collision-proof provide+renew form to command definitions INSIDE
 * a snippet too (papers define helpers inside tikzpicture bodies).
 */
function hardenSnippetDefs(snippet: string): string {
  return snippet.replace(
    /\\(?:new|renew|provide)command(\*?)\s*(\{?)\\([a-zA-Z@]+)(\}?)/g,
    (_m, star, open, name, close) =>
      `\\providecommand{\\${name}}{}\\renewcommand${star}${open}\\${name}${close}`,
  );
}

/** Balanced `{...}` reader starting at the char after the opening brace. */
function readBalanced(source: string, start: number): number {
  let depth = 1;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === "\\") i++;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return i + 1;
  }
  return -1;
}

/**
 * Assemble a preamble of the paper's own definitions so diagrams that use
 * custom macros/colors/styles compile: resolved \definecolor for every color
 * we know, plus raw \newcommand/\def/\newlength/\setlength/\tikzset/
 * \tikzstyle/\pgfdeclarelayer blocks in document order.
 */
export function buildTikzPreamble(texSource: string): {
  preamble: string;
  libraries: string;
  packages: Record<string, string>;
} {
  const stripped = stripTexComments(texSource);

  // Colors — regenerated from the resolved table (covers colorlet mixing).
  const colorLines: string[] = [];
  for (const [name, rgb] of collectColors(texSource)) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) continue;
    const hex = rgb
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    colorLines.push(`\\definecolor{${name}}{HTML}{${hex}}`);
  }

  // Raw definition blocks, in document order. Environment/xparse definitions
  // are CONSUMED but not emitted (their bodies contain #1 params that are
  // illegal outside a definition, and env expansion already handled them) —
  // consuming them keeps their inner \def/\newcommand fragments out.
  const defLines: string[] = [];
  const SKIP_STARTERS = new Set([
    "newenvironment",
    "renewenvironment",
    "NewDocumentEnvironment",
    "RenewDocumentEnvironment",
    "NewDocumentCommand",
    "RenewDocumentCommand",
    "newtcolorbox",
    "renewtcolorbox",
  ]);
  const starterRe =
    /\\(newcommand\*?|renewcommand\*?|providecommand\*?|def|newlength|setlength|newcounter|tikzset|pgfdeclarelayer|pgfsetlayers|pgfplotsset|newenvironment|renewenvironment|NewDocumentEnvironment|RenewDocumentEnvironment|NewDocumentCommand|RenewDocumentCommand|newtcolorbox|renewtcolorbox)\b/g;
  for (let m = starterRe.exec(stripped); m !== null; m = starterRe.exec(stripped)) {
    const starter = m[1].replace(/\*$/, "");
    const isSkip = SKIP_STARTERS.has(starter);
    const maxGroups = isSkip ? 6 : 4;
    // Grab from the starter through the last balanced group on this command.
    // Control words (\name) and #-params may only appear BEFORE the first
    // group; after a group, only another {..}/[..] continues the command —
    // anything else (e.g. a following \else from a .bbl \ifx idiom) ends it.
    let end = m.index + m[0].length;
    let groups = 0;
    let declaredParams = 0;
    while (end < stripped.length && groups < maxGroups) {
      const ch = stripped[end];
      if (ch === " " || ch === "\t" || ch === "\n") {
        if (groups > 0 && ch === "\n" && !isSkip) break;
        end++;
        continue;
      }
      if (ch === "{") {
        const close = readBalanced(stripped, end + 1);
        if (close === -1) break;
        end = close;
        groups++;
        // Peek: continue only if another argument follows directly.
        let peek = end;
        while (peek < stripped.length && (stripped[peek] === " " || stripped[peek] === "\t")) peek++;
        if (stripped[peek] !== "{" && stripped[peek] !== "[") break;
        continue;
      }
      if (ch === "[") {
        const close = stripped.indexOf("]", end);
        if (close === -1) break;
        const inner = stripped.slice(end + 1, close).trim();
        if (declaredParams === 0 && /^\d+$/.test(inner)) {
          declaredParams = parseInt(inner, 10);
        }
        end = close + 1;
        continue;
      }
      if (ch === "\\" && groups === 0) {
        end++;
        while (end < stripped.length && /[a-zA-Z@]/.test(stripped[end])) end++;
        continue;
      }
      if ((ch === "#" || /\d/.test(ch)) && groups === 0) {
        if (ch === "#") declaredParams++;
        end++;
        continue;
      }
      break;
    }
    if (groups > 0 && !isSkip) {
      const block = stripped.slice(m.index, end).trim();
      // A block using #k beyond its declared parameter count would be a TeX
      // error at top level ("Illegal parameter number") — skip it.
      // (\tikzset styles may use #1 legally via .style handlers.)
      const usedParams = Math.max(
        0,
        ...[...block.matchAll(/#(\d)/g)].map((p) => Number(p[1])),
      );
      const paramsOk =
        starter === "tikzset" || usedParams <= declaredParams;
      if (block.length < 4000 && paramsOk) {
        defLines.push(hardenDefinitionBlock(starter, block));
      }
    }
    starterRe.lastIndex = Math.max(starterRe.lastIndex, end);
  }

  // Drop \setlength for registers never \newlength'd here and not standard —
  // \setlength on an undefined register is a hard TeX error.
  const KNOWN_LENGTHS = new Set([
    "parindent",
    "parskip",
    "columnsep",
    "tabcolsep",
    "arraycolsep",
    "itemsep",
    "topsep",
    "baselineskip",
    "textwidth",
    "linewidth",
    "columnwidth",
    "fboxsep",
    "fboxrule",
  ]);
  const declaredLengths = new Set(
    defLines
      .map((l) => /^\\newlength\s*\{?\\([a-zA-Z@]+)/.exec(l)?.[1])
      .filter((n): n is string => !!n),
  );
  const safeLines = defLines.filter((line) => {
    const setlen = /^\\setlength\s*\{?\\([a-zA-Z@]+)/.exec(line);
    if (setlen) {
      return declaredLengths.has(setlen[1]) || KNOWN_LENGTHS.has(setlen[1]);
    }
    if (line.startsWith("\\pgfplotsset")) return false; // only if pgfplots loads
    return true;
  });

  // \tikzstyle{x}=[...] (pre-tikzset style declarations)
  for (const m of stripped.matchAll(/\\tikzstyle\s*\{[^{}]+\}\s*=\s*\[[^\]]*\]/g)) {
    safeLines.push(m[0]);
  }

  // Libraries: merge every \usetikzlibrary list.
  const libs = new Set<string>();
  for (const m of stripped.matchAll(/\\usetikzlibrary\s*\{([^{}]+)\}/g)) {
    for (const lib of m[1].split(",")) {
      const name = lib.trim();
      if (name) libs.add(name);
    }
  }

  const packages: Record<string, string> = { amsmath: "", amssymb: "" };
  if (/\\begin\{axis\}|\\addplot/.test(stripped)) packages.pgfplots = "";

  // Fallbacks for utility macros absent from TikZJax's kernel — paper macros
  // routinely end with \xspace, and bib/link commands appear in node labels.
  const kernelShims = [
    "\\providecommand{\\xspace}{}",
    "\\providecommand{\\href}[2]{#2}",
    "\\providecommand{\\url}[1]{\\texttt{#1}}",
    "\\providecommand{\\doi}[1]{#1}",
    "\\providecommand{\\texorpdfstring}[2]{#1}",
    "\\providecommand{\\cref}[1]{}",
    "\\providecommand{\\Cref}[1]{}",
  ];
  return {
    preamble: [...kernelShims, ...colorLines, ...safeLines].join("\n"),
    libraries: [...libs].join(","),
    packages,
  };
}

/**
 * Make an extracted definition safe to run in the minimal TikZJax TeX
 * environment: \renewcommand of a command that doesn't exist there (e.g.
 * hyperref's \sectionautorefname) is a hard error — shim it with
 * \providecommand first.
 */
function hardenDefinitionBlock(starter: string, block: string): string {
  // Both directions are hard TeX errors that would kill a diagram:
  // \renewcommand of a command that doesn't exist in TikZJax's kernel, and
  // \newcommand of one that does (or a duplicate). Normalize every command
  // definition to `\providecommand{\x}{}\renewcommand\x...`, which succeeds
  // in all cases.
  if (
    starter === "newcommand" ||
    starter === "renewcommand" ||
    starter === "providecommand"
  ) {
    const m = /^\\(?:new|renew|provide)command(\*?)\s*(\{?)\\([a-zA-Z@]+)(\}?)/.exec(
      block,
    );
    if (m) {
      const rest = block.slice(m[0].length);
      return `\\providecommand{\\${m[3]}}{}\\renewcommand${m[1]}${m[2]}\\${m[3]}${m[4]}${rest}`;
    }
  }
  return block;
}

/**
 * Compile the paper's TikZ diagrams to SVG assets in `files`
 * (`__tikz__/N.svg` + a manifest for index/fingerprint correlation).
 * Never throws; failed diagrams simply have no asset (placeholder fallback).
 */
export async function renderTikzDiagrams(
  texSource: string,
  files: Map<string, Uint8Array>,
): Promise<void> {
  if (!texSource.includes("\\begin{tikzpicture}")) return;

  // Resolve the engine's entry point on disk up front (the worker requires
  // it by absolute path — bundler-mediated resolution yields virtual ids
  // that workers cannot load).
  const tikzjaxRoot = resolveTikzjaxRoot();
  if (!tikzjaxRoot) {
    console.warn("[arxiv] TikZ renderer unavailable: node-tikzjax not found on disk");
    return;
  }
  const enginePath = path.join(tikzjaxRoot, "dist", "index.js");

  let jobs: TikzJob[];
  let preamble: { preamble: string; libraries: string; packages: Record<string, string> };
  try {
    jobs = extractTikzPictures(texSource);
    preamble = buildTikzPreamble(texSource);
  } catch {
    return;
  }
  if (jobs.length === 0) return;

  const encoder = new TextEncoder();
  const indices: number[] = [];
  const deadline = Date.now() + TOTAL_TIKZ_BUDGET_MS;

  for (const job of jobs.slice(0, MAX_DIAGRAMS)) {
    if (job.source.length > MAX_SNIPPET_BYTES) continue;
    if (Date.now() > deadline) break; // remaining diagrams → placeholders
    // Definitions go through addToPreamble (before \begin{document}): inside
    // the body their inter-line glue widens the shipped page — TikZJax sizes
    // the SVG viewport to the page, so the diagram renders as a sliver at the
    // far right of a several-thousand-pt canvas.
    const input = `\\begin{document}\n${hardenSnippetDefs(job.source)}\n\\end{document}`;
    let svg = await compileInWorker(enginePath, input, {
      showConsole: false,
      embedFontCss: false,
      tikzLibraries: preamble.libraries,
      texPackages: preamble.packages,
      addToPreamble: preamble.preamble,
    });
    if (!svg || !svg.startsWith("<svg") || svg.length > MAX_SVG_BYTES) {
      continue;
    }
    svg = embedUsedFonts(svg);
    files.set(tikzAssetPath(job.index), encoder.encode(svg));
    indices.push(job.index);
  }

  if (indices.length > 0) {
    const manifest: TikzManifest = { total: jobs.length, indices };
    files.set(TIKZ_MANIFEST_PATH, encoder.encode(JSON.stringify(manifest)));
  }
  console.info(
    `[arxiv] tikz: compiled ${indices.length}/${Math.min(jobs.length, MAX_DIAGRAMS)} diagrams`,
  );
}

/**
 * Compile one diagram in a worker thread so a pathological TeX loop can be
 * hard-TERMINATED instead of hanging the conversion (WASM never yields to
 * the event loop, so an in-process timeout could never fire).
 */
async function compileInWorker(
  enginePath: string,
  input: string,
  options: object,
): Promise<string | null> {
  let WorkerCtor: typeof import("node:worker_threads").Worker;
  try {
    ({ Worker: WorkerCtor } = await import("node:worker_threads"));
  } catch {
    return null;
  }

  const workerCode = `
    const { parentPort, workerData } = require("node:worker_threads");
    (async () => {
      try {
        const mod = require(workerData.enginePath);
        const tex2svg = (mod && mod.default) ? (mod.default.default ?? mod.default) : mod;
        const svg = await tex2svg(workerData.input, workerData.options);
        parentPort.postMessage({ ok: true, svg });
      } catch (err) {
        parentPort.postMessage({ ok: false, error: String(err && err.message || err) });
      }
    })();
  `;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      resolve(value);
    };
    const worker = new WorkerCtor(workerCode, {
      eval: true,
      workerData: { enginePath, input, options },
    });
    const timer = setTimeout(() => finish(null), DIAGRAM_TIMEOUT_MS);
    worker.on("message", (msg: { ok: boolean; svg?: string; error?: string }) => {
      if (!msg.ok && msg.error) {
        console.warn(`[arxiv] tikz worker: ${msg.error.slice(0, 160)}`);
      }
      finish(msg.ok && typeof msg.svg === "string" ? msg.svg : null);
    });
    worker.on("error", (err) =>
      {
        console.warn(`[arxiv] tikz worker spawn: ${err.message.slice(0, 160)}`);
        finish(null);
      });
    worker.on("exit", () => finish(null));
  });
}

/**
 * SVGs loaded via <img> cannot fetch external fonts, so embed the BaKoMa
 * font faces the SVG actually uses as data URIs (self-hosted from the
 * node-tikzjax npm package — no CDN).
 */
function embedUsedFonts(svg: string): string {
  const families = new Set<string>();
  for (const m of svg.matchAll(/font-family[:="]+\s*([a-zA-Z][a-zA-Z0-9]*)/g)) {
    families.add(m[1]);
  }
  if (families.size === 0) return svg;

  const root = resolveTikzjaxRoot();
  if (!root) return svg; // fonts unavailable — text falls back to system serif
  const fontDir = path.join(root, "css", "bakoma", "ttf");

  const faces: string[] = [];
  let total = 0;
  for (const family of families) {
    try {
      const ttf = readFileSync(path.join(fontDir, `${family}.ttf`));
      total += ttf.length;
      if (total > MAX_EMBEDDED_FONT_BYTES) break;
      faces.push(
        `@font-face{font-family:${family};src:url(data:font/ttf;base64,${ttf.toString("base64")})}`,
      );
    } catch {
      // unknown family — skip
    }
  }
  if (faces.length === 0) return svg;
  return svg.replace(/(<svg[^>]*>)/, `$1<style>${faces.join("")}</style>`);
}
