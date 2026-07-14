import type * as Ast from "@unified-latex/unified-latex-types";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { match } from "@unified-latex/unified-latex-util-match";
import { replaceNode } from "@unified-latex/unified-latex-util-replace";
import type { WarningCollector } from "../warnings";
import type { TheoremDef } from "./theorems";
import {
  IdMinter,
  envName,
  lastArgContent,
  plainText,
  rawText,
  slugify,
  texMacro,
  texString,
} from "./tex-utils";

export interface NumberInfo {
  numberText: string;
  id: string;
}

interface LabelEntry extends NumberInfo {
  /** Word used by \cref/\autoref, e.g. "Section", "Figure", "Lemma". */
  word: string;
}

export interface DocNumbering {
  sections: WeakMap<Ast.Macro, NumberInfo>;
  equations: WeakMap<Ast.Environment, NumberInfo>;
  figures: WeakMap<Ast.Environment, NumberInfo>;
  tables: WeakMap<Ast.Environment, NumberInfo>;
  theorems: WeakMap<Ast.Environment, NumberInfo>;
  labels: Map<string, LabelEntry>;
  /** Report/book-class source (\chapter present) — heading tags shift down one. */
  hasChapters: boolean;
}

/**
 * Sectioning levels. When the document uses \chapter (report/book class),
 * chapter takes level 0 and everything shifts down one so numbers nest as
 * "2.1" under the right chapter.
 */
function sectionLevelsFor(hasChapters: boolean): Record<string, number> {
  return hasChapters
    ? { chapter: 0, section: 1, subsection: 2, subsubsection: 3 }
    : { section: 0, subsection: 1, subsubsection: 2 };
}

/** Display-math environments that consume the equation counter. */
const MATH_ENV_BASES = new Set([
  "equation",
  "align",
  "gather",
  "multline",
  "eqnarray",
  "alignat",
  "flalign",
]);

const REF_MACROS = new Set(["ref", "eqref", "autoref", "cref", "Cref", "pageref"]);

/**
 * Float environments that consume the FIGURE counter. buildMiscEnvReplacements
 * turns wrapfigure/SCfigure/subcaptionbox into unnumbered layout divs later, so
 * numbering.ts must bind their \labels to a figure here — otherwise a loose
 * \label inside one falls through to the section-binding path and a \ref shows
 * the wrong kind/number.
 */
const FIGURE_FLOAT_BASES = new Set(["figure", "wrapfigure", "SCfigure", "subcaptionbox"]);

/**
 * One document-order pass that drives every counter (sections, equations,
 * figures, tables, theorems), binds \label keys to what they follow, strips
 * the \label nodes, and injects \tag{N} into numbered display math so KaTeX
 * shows equation numbers. A second pass then rewrites \ref/\eqref/\cref
 * into in-page links. Determinism of this pass is what makes anchors and
 * ids stable for a given (source, converter version).
 */
export function numberDocument(
  tree: Ast.Root,
  theoremDefs: TheoremDef[],
  warnings: WarningCollector,
): DocNumbering {
  attachMacroArgs(tree, {
    label: { signature: "m" },
    ref: { signature: "m" },
    eqref: { signature: "m" },
    autoref: { signature: "m" },
    cref: { signature: "m" },
    Cref: { signature: "m" },
    pageref: { signature: "m" },
    // Attach \tag's argument so stripManualTags removes the macro AND its
    // {…}; otherwise the orphaned group renders as visible text in the eq.
    tag: { signature: "m" },
  });

  const hasChapters = treeHasMacro(tree, "chapter");
  const numbering: DocNumbering = {
    sections: new WeakMap(),
    equations: new WeakMap(),
    figures: new WeakMap(),
    tables: new WeakMap(),
    theorems: new WeakMap(),
    labels: new Map(),
    hasChapters,
  };
  const ids = new IdMinter();
  const theoremsByEnv = new Map(theoremDefs.map((d) => [d.envName, d]));

  const SECTION_LEVELS = sectionLevelsFor(hasChapters);

  const counters = {
    section: [0, 0, 0, 0],
    equation: 0,
    figure: 0,
    table: 0,
    theorem: new Map<string, number>(),
  };
  // Loose \label{...}s bind to the most recent numbered thing.
  let currentTarget: LabelEntry | null = null;
  // After \appendix, top-level sections number as letters (A, B, …).
  let inAppendix = false;

  function sectionNumberText(level: number): string {
    const parts = counters.section.slice(0, level + 1);
    if (inAppendix) {
      const letter = String.fromCharCode(64 + parts[0]); // 1 → "A"
      return [letter, ...parts.slice(1)].join(".");
    }
    return parts.join(".");
  }

  function bindLabel(key: string, target: LabelEntry | null): void {
    if (!key) return;
    if (!target) {
      warnings.add("unresolved-label", key);
      return;
    }
    numbering.labels.set(key, target);
  }

  /** Remove \label nodes from an array (deeply), binding them to `target`. */
  function stripLabels(nodes: Ast.Node[], target: LabelEntry | null): void {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (match.macro(node, "label")) {
        bindLabel(rawText(lastArgContent(node)).trim(), target);
        nodes.splice(i, 1);
        continue;
      }
      for (const childArray of childArraysOf(node)) stripLabels(childArray, target);
    }
  }


  /**
   * Number a display-math environment. Returns a replacement node (the env
   * wrapped in a div carrying the equation's id, so \ref/\eqref anchors
   * resolve) or null when the env should stay as-is.
   */
  function handleMathEnv(env: Ast.Environment): Ast.Node | null {
    const name = envName(env);
    const base = name.replace(/\*$/, "");
    const starred = name.endsWith("*");
    if (starred || !MATH_ENV_BASES.has(base)) {
      stripLabels(env.content, null);
      return null;
    }
    const isMultiRow = base !== "equation" && base !== "multline";
    // Each row of align/gather/eqnarray gets its own number in real LaTeX. We
    // approximate the block with a single number (v1), but must still advance
    // the counter by the number of rows so every *later* equation matches the
    // PDF. Rows carrying \notag/\nonumber don't consume a number.
    const rows = isMultiRow ? countNumberedRows(env.content) : 1;
    const labelCount = countLabels(env.content);
    if (isMultiRow && labelCount > 1) {
      warnings.add(
        "equation-numbering",
        `${labelCount} labels in one ${base} share equation (${counters.equation + 1})`,
      );
    }

    counters.equation++;
    const info: NumberInfo = {
      numberText: String(counters.equation),
      id: ids.mint(`ax-eq-${counters.equation}`),
    };
    // Consume the remaining row numbers so downstream equations stay in sync.
    counters.equation += Math.max(0, rows - 1);

    numbering.equations.set(env, info);
    const target: LabelEntry = { ...info, word: "Equation" };
    stripLabels(env.content, target);
    // Suppress KaTeX's per-row auto-numbering (a page-global CSS counter,
    // unrelated to document numbers) so our single \tag is the only number
    // shown; insert it before any trailing row break to avoid a phantom row.
    stripManualTags(env.content);
    insertTagBeforeTrailingBreak(env.content, info.numberText);

    return htmlLike({
      tag: "div",
      attributes: { id: info.id, className: "ax-equation" },
      content: [env],
    });
  }

  function handleFloat(
    env: Ast.Environment,
    kind: "figure" | "table",
  ): LabelEntry {
    counters[kind]++;
    const n = counters[kind];
    const info: NumberInfo = {
      numberText: String(n),
      id: ids.mint(`ax-${kind === "figure" ? "fig" : "tab"}-${n}`),
    };
    numbering[kind === "figure" ? "figures" : "tables"].set(env, info);
    return { ...info, word: kind === "figure" ? "Figure" : "Table" };
  }

  function walk(nodes: Ast.Node[]): void {
    for (const node of [...nodes]) {
      if (match.anyMacro(node)) {
        if (node.content === "appendix" || node.content === "appendices") {
          inAppendix = true;
          counters.section = [0, 0, 0, 0];
          const index = nodes.indexOf(node);
          if (index !== -1) nodes.splice(index, 1);
          continue;
        }
        const level = SECTION_LEVELS[node.content];
        if (level !== undefined) {
          const starred = rawText(node.args?.[0]?.content ?? []).includes("*");
          // Pull any \label{} written inside the heading argument out first,
          // so it neither pollutes the title/slug nor renders as junk in the
          // <h2>; bind it once the section's target exists.
          const inlineLabelKeys = extractLabelKeys(lastArgContent(node));
          const title = plainText(lastArgContent(node));
          let numberText = "";
          if (!starred) {
            counters.section[level]++;
            for (let l = level + 1; l < counters.section.length; l++) {
              counters.section[l] = 0;
            }
            numberText = sectionNumberText(level);
          }
          const info: NumberInfo = {
            numberText,
            id: ids.mint(`ax-sec-${slugify(title)}`),
          };
          numbering.sections.set(node, info);
          const topWord =
            node.content === "chapter"
              ? "Chapter"
              : inAppendix && level === 0
                ? "Appendix"
                : "Section";
          // Starred sections have no number, but a following \label should
          // still link to the heading rather than rendering "?".
          currentTarget = { ...info, word: topWord };
          for (const key of inlineLabelKeys) bindLabel(key, currentTarget);
        } else if (match.macro(node, "label")) {
          // Loose label (e.g. right after \section) — bind and remove.
          bindLabel(rawText(lastArgContent(node)).trim(), currentTarget);
          const index = nodes.indexOf(node);
          if (index !== -1) nodes.splice(index, 1);
        } else {
          for (const arr of childArraysOf(node)) walk(arr);
        }
        continue;
      }

      if (node.type === "environment" || node.type === "mathenv") {
        const env = node;
        const base = envName(env).replace(/\*$/, "");
        if (node.type === "mathenv" || MATH_ENV_BASES.has(base)) {
          const replacement = handleMathEnv(env);
          if (replacement) {
            const index = nodes.indexOf(env);
            if (index !== -1) nodes.splice(index, 1, replacement);
          }
          continue;
        }
        if (
          FIGURE_FLOAT_BASES.has(base) ||
          base === "table" ||
          base === "longtable"
        ) {
          const kind = base === "table" || base === "longtable" ? "table" : "figure";
          const target = handleFloat(env, kind);
          const outer = currentTarget;
          currentTarget = target;
          stripLabels(env.content, target);
          walk(env.content);
          currentTarget = outer;
          continue;
        }
        if (envName(env).replace(/\*$/, "") === "appendices") {
          inAppendix = true;
          counters.section = [0, 0, 0, 0];
          walk(env.content);
          continue;
        }
        const theoremDef = theoremsByEnv.get(envName(env));
        if (theoremDef) {
          const count = (counters.theorem.get(theoremDef.counterKey) ?? 0) + 1;
          counters.theorem.set(theoremDef.counterKey, count);
          const info: NumberInfo = {
            numberText: String(count),
            id: ids.mint(`ax-thm-${slugify(theoremDef.envName)}-${count}`),
          };
          numbering.theorems.set(env, info);
          const outer = currentTarget;
          currentTarget = { ...info, word: theoremDef.title };
          walk(env.content);
          currentTarget = outer;
          continue;
        }
        walk(env.content);
        continue;
      }

      if (node.type === "displaymath") {
        stripLabels(node.content, null);
        continue;
      }
      for (const arr of childArraysOf(node)) walk(arr);
    }
  }

  walk(tree.content);
  rewriteRefs(tree, numbering, warnings);
  return numbering;
}

function treeHasMacro(tree: Ast.Root, name: string): boolean {
  let found = false;
  const walk = (nodes: Ast.Node[]) => {
    for (const node of nodes) {
      if (found) return;
      if (match.anyMacro(node) && node.content === name) {
        found = true;
        return;
      }
      for (const arr of childArraysOf(node)) walk(arr);
    }
  };
  walk(tree.content);
  return found;
}

function childArraysOf(node: Ast.Node): Ast.Node[][] {
  const arrays: Ast.Node[][] = [];
  if ("content" in node && Array.isArray(node.content)) {
    arrays.push(node.content as Ast.Node[]);
  }
  if ("args" in node && Array.isArray(node.args)) {
    for (const arg of node.args) arrays.push(arg.content);
  }
  return arrays;
}

const ROW_BREAK = "\\";
const NOTAG_MACROS = new Set(["notag", "nonumber"]);

function isRowBreak(node: Ast.Node): boolean {
  return match.anyMacro(node) && node.content === ROW_BREAK;
}

function hasMacroDeep(nodes: Ast.Node[], names: Set<string>): boolean {
  return nodes.some(
    (node) =>
      (match.anyMacro(node) && names.has(node.content)) ||
      childArraysOf(node).some((arr) => hasMacroDeep(arr, names)),
  );
}

/**
 * Count the rows of a multi-row math environment that consume an equation
 * number: rows separated by `\\`, excluding a trailing empty row and any row
 * carrying `\notag`/`\nonumber`.
 */
function countNumberedRows(content: Ast.Node[]): number {
  const rows: Ast.Node[][] = [[]];
  for (const node of content) {
    if (isRowBreak(node)) rows.push([]);
    else rows[rows.length - 1].push(node);
  }
  // Drop a trailing whitespace/parbreak-only row from a final `\\`.
  const last = rows[rows.length - 1];
  if (
    rows.length > 1 &&
    last.every((n) => n.type === "whitespace" || n.type === "parbreak")
  ) {
    rows.pop();
  }
  const numbered = rows.filter((row) => !hasMacroDeep(row, NOTAG_MACROS));
  return Math.max(1, numbered.length);
}

/** Remove \label macros from an array (deeply), returning their keys. */
function extractLabelKeys(nodes: Ast.Node[]): string[] {
  const keys: string[] = [];
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (match.macro(node, "label")) {
      const key = rawText(lastArgContent(node)).trim();
      if (key) keys.push(key);
      nodes.splice(i, 1);
      continue;
    }
    for (const arr of childArraysOf(node)) keys.push(...extractLabelKeys(arr));
  }
  return keys;
}

function countLabels(content: Ast.Node[]): number {
  let count = 0;
  const walk = (nodes: Ast.Node[]) => {
    for (const node of nodes) {
      if (match.macro(node, "label")) count++;
      for (const arr of childArraysOf(node)) walk(arr);
    }
  };
  walk(content);
  return count;
}

/** Remove author \tag/\notag/\nonumber so our single imposed number is unique. */
function stripManualTags(content: Ast.Node[]): void {
  for (let i = content.length - 1; i >= 0; i--) {
    const node = content[i];
    if (
      match.anyMacro(node) &&
      (node.content === "tag" || NOTAG_MACROS.has(node.content))
    ) {
      content.splice(i, 1);
      continue;
    }
    for (const arr of childArraysOf(node)) stripManualTags(arr);
  }
}

/** Append \tag{n}, but before a trailing `\\` so it lands on the last real row. */
function insertTagBeforeTrailingBreak(content: Ast.Node[], numberText: string): void {
  let insertAt = content.length;
  for (let i = content.length - 1; i >= 0; i--) {
    const node = content[i];
    if (node.type === "whitespace" || node.type === "parbreak") continue;
    if (isRowBreak(node)) insertAt = i;
    break;
  }
  content.splice(insertAt, 0, texMacro("tag", numberText));
}

function rewriteRefs(
  tree: Ast.Root,
  numbering: DocNumbering,
  warnings: WarningCollector,
): void {
  replaceNode(tree, (node, info) => {
    if (!match.anyMacro(node) || !REF_MACROS.has(node.content)) return;
    const macroName = node.content;
    // Inside math (or \text{} within math), an html-like link node would
    // reach KaTeX as garbage TeX and destroy the whole formula — emit the
    // plain number text instead.
    const inMath =
      info.context?.inMathMode === true ||
      info.context?.hasMathModeAncestor === true;
    const keys = rawText(lastArgContent(node))
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (keys.length === 0) return null;

    const parts: Ast.Node[] = [];
    keys.forEach((key, i) => {
      if (i > 0) parts.push(texString(", "));
      const entry = numbering.labels.get(key);
      if (!entry) {
        warnings.add("unresolved-ref", key);
        parts.push(texString("?"));
        return;
      }
      if (inMath) {
        parts.push(texString(refText(entry, macroName)));
      } else {
        parts.push(refLink(entry, macroName));
      }
    });
    if (macroName === "pageref") {
      warnings.add("pageref", "page references approximated to plain links");
    }
    return parts;
  });
}

function refText(entry: LabelEntry, macroName: string): string {
  // Starred sections carry no number; refer to them by their kind word.
  if (!entry.numberText) {
    if (macroName === "cref") return entry.word.toLowerCase();
    if (macroName === "Cref" || macroName === "autoref") return entry.word;
    return "§";
  }
  switch (macroName) {
    case "eqref":
      return `(${entry.numberText})`;
    case "autoref":
    case "cref":
    case "Cref": {
      const word =
        macroName === "cref" ? entry.word.toLowerCase() : entry.word;
      return entry.word === "Equation"
        ? `${word} (${entry.numberText})`
        : `${word} ${entry.numberText}`;
    }
    default:
      return entry.numberText;
  }
}

function refLink(entry: LabelEntry, macroName: string): Ast.Macro {
  return htmlLike({
    tag: "a",
    attributes: { href: `#${entry.id}`, className: "ax-ref" },
    content: [texString(refText(entry, macroName))],
  });
}
