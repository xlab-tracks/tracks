import { parseAlignEnvironment } from "@unified-latex/unified-latex-util-align";
import {
  attachMacroArgs,
  getArgsContent,
} from "@unified-latex/unified-latex-util-arguments";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { match } from "@unified-latex/unified-latex-util-match";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";
import type * as Ast from "@unified-latex/unified-latex-types";
import type { WarningCollector } from "../warnings";
import { lastArgContent, rawText, texString } from "./tex-utils";
import { resolveColorHex, type ColorTable } from "./colors";

type Align = "left" | "center" | "right";
type EnvReplacement = (node: Ast.Environment) => Ast.Node;

/**
 * Horizontal-rule macros. Their positions become borders on the adjacent
 * row; they carry no cell content. (\addlinespace / \rule are vertical
 * spacing, not lines — stripped as noise, not treated here.)
 */
const RULE_MACROS = new Set([
  "hline",
  "toprule",
  "midrule",
  "bottomrule",
  "cline",
  "cmidrule",
  "specialrule",
  "hdashline",
]);

/**
 * Custom tabular/tabularx converter. unified-latex's built-in table handler
 * ignores \multicolumn, \multirow and \hline, so their arguments leak as
 * literal text ("2cBLEU", "2*Model") and math inside spanned cells never
 * renders. This one:
 *  - honours \multicolumn{n}{align}{content} as a colspan cell (and renders
 *    its content — including math — through the normal pipeline),
 *  - unwraps \multirow{n}{width}{content} to its content (the empty cells in
 *    following rows stay empty, which reads correctly),
 *  - draws horizontal rules ONLY where \hline/\toprule/\midrule/\bottomrule/
 *    \cmidrule/\specialrule actually occur, instead of bordering every row,
 *  - applies per-column alignment as classes.
 */
export function buildTableReplacements(
  tree: Ast.Root,
  warnings: WarningCollector,
  colors: ColorTable = new Map(),
): Record<string, EnvReplacement> {
  // \cmidrule(lr){2-3}: the "(lr)" trim spec is not brace-delimited, so
  // attachMacroArgs can't absorb it — scrub those token runs first or they
  // leak as text into the next row's first cell.
  scrubRuleTrims(tree);
  // Attach args so rule/span macros absorb their braces (e.g. \cmidrule{2-3}),
  // otherwise the leftover group would make a rule row look like data.
  attachMacroArgs(tree, {
    multicolumn: { signature: "m m m" },
    // \multirow[vpos]{nrows}[bigstruts]{width}[vmove]{content}
    multirow: { signature: "o m o m o m" },
    cmidrule: { signature: "o m" },
    cline: { signature: "m" },
    specialrule: { signature: "m m m" },
    // Cell/row colors resolve to backgrounds via the color table.
    cellcolor: { signature: "o m" },
    rowcolor: { signature: "o m" },
    columncolor: { signature: "o m" },
    arrayrulecolor: { signature: "o m" },
  });
  const replace: EnvReplacement = (env) => buildTable(env, warnings, colors);
  const longtable: EnvReplacement = (env) => buildLongtable(env, warnings, colors);
  return {
    tabular: replace,
    tabularx: replace,
    "tabular*": replace,
    longtable,
    "longtable*": longtable,
  };
}

/** Remove `(lr)`-style trim runs following \cmidrule/\cline. */
function scrubRuleTrims(tree: Ast.Root): void {
  walkArrays(tree, (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!match.anyMacro(node)) continue;
      if (node.content !== "cmidrule" && node.content !== "cline") continue;
      const next = nodes[i + 1];
      if (next?.type !== "string" || !next.content.startsWith("(")) continue;
      let end = i + 1;
      for (; end < nodes.length && end < i + 8; end++) {
        const tok = nodes[end];
        if (tok.type === "string" && tok.content.includes(")")) break;
      }
      if (end < nodes.length) {
        const closing = nodes[end];
        const after =
          closing.type === "string"
            ? closing.content.slice(closing.content.indexOf(")") + 1)
            : "";
        nodes.splice(
          i + 1,
          end - i,
          ...(after ? [{ type: "string", content: after } as Ast.Node] : []),
        );
      }
    }
  });
}

function walkArrays(
  node: Ast.Ast | Ast.Node,
  fn: (nodes: Ast.Node[]) => void,
): void {
  if (Array.isArray(node)) {
    fn(node);
    for (const child of node) walkArrays(child, fn);
    return;
  }
  if (typeof node !== "object" || node === null) return;
  if ("content" in node && Array.isArray(node.content)) {
    fn(node.content as Ast.Node[]);
    for (const child of node.content as Ast.Node[]) walkArrays(child, fn);
  }
  if ("args" in node && Array.isArray(node.args)) {
    for (const arg of node.args) {
      fn(arg.content);
      for (const child of arg.content) walkArrays(child, fn);
    }
  }
}

/** Markers meaningful only to longtable's pagination — dropped. */
const LONGTABLE_MARKERS = new Set([
  "endfirsthead",
  "endhead",
  "endfoot",
  "endlastfoot",
  "kill",
  "tabularnewline",
  "pagebreak",
  "nopagebreak",
]);

/**
 * longtable ≈ tabular + inline captions + pagination markers. Convert to a
 * figure-wrapped table: extract \caption, drop markers, reuse buildTable.
 */
function buildLongtable(
  env: Ast.Environment,
  warnings: WarningCollector,
  colors: ColorTable,
): Ast.Node {
  const captions: Ast.Node[][] = [];
  const cleaned: Ast.Node[] = [];
  for (const node of env.content) {
    if (match.anyMacro(node)) {
      if (node.content === "caption") {
        captions.push(lastArgContent(node));
        continue;
      }
      if (LONGTABLE_MARKERS.has(node.content)) continue;
    }
    cleaned.push(node);
  }
  // longtable is unknown to the parser, so its [pos]{colspec} arrive as
  // leading content tokens rather than attached args — peel them.
  let specArg: Ast.Argument[] | undefined = env.args;
  while (
    cleaned.length > 0 &&
    (cleaned[0].type === "whitespace" || cleaned[0].type === "parbreak")
  ) {
    cleaned.shift();
  }
  if (cleaned[0]?.type === "string" && cleaned[0].content.startsWith("[")) {
    // drop a [pos] token run
    for (let i = 0; i < cleaned.length && i < 6; i++) {
      const tok = cleaned[i];
      if (tok.type === "string" && tok.content.includes("]")) {
        cleaned.splice(0, i + 1);
        break;
      }
    }
  }
  while (
    cleaned.length > 0 &&
    (cleaned[0].type === "whitespace" || cleaned[0].type === "parbreak")
  ) {
    cleaned.shift();
  }
  if ((!specArg || specArg.length === 0) && cleaned[0]?.type === "group") {
    const specGroup = cleaned.shift() as Ast.Group;
    specArg = [
      {
        type: "argument",
        content: specGroup.content,
        openMark: "{",
        closeMark: "}",
      },
    ];
  }

  const table = buildTable({ ...env, args: specArg, content: cleaned }, warnings, colors);
  const children: Ast.Node[] = [table];
  if (captions.length > 0) {
    children.push(
      htmlLike({
        tag: "figcaption",
        content: [
          htmlLike({ tag: "strong", content: [texString("Table: ")] }),
          ...captions[0],
        ],
      }),
    );
  }
  return htmlLike({
    tag: "figure",
    attributes: { className: "ax-table" },
    content: children,
  });
}

function buildTable(
  env: Ast.Environment,
  warnings: WarningCollector,
  colors: ColorTable,
): Ast.Node {
  let rows: { cells: Ast.Node[][] }[];
  let colStyles: ColumnStyle[];
  try {
    // Row separators are `\\`/`\cr` only. The default list also treats
    // `\hline` as a separator and CONSUMES it — which would discard the rule
    // entirely; keep it as cell content so we can place a border there.
    rows = parseAlignEnvironment(env.content, ["&"], ["\\", "cr"]);
    colStyles = parseColumnSpec(columnSpecArg(env));
  } catch {
    warnings.add("tables", "table could not be parsed");
    return htmlLike({ tag: "div", content: env.content });
  }

  // Fold rule-only rows into a "rule above the next data row" flag so borders
  // land exactly where \hline/\midrule/etc. sit — not on every row.
  const dataRows: { cells: Ast.Node[][]; ruleTop: boolean }[] = [];
  let pendingRuleTop = false;
  for (const row of rows) {
    if (isRuleRow(row.cells)) {
      pendingRuleTop = true;
      continue;
    }
    if (isEmptyRow(row.cells)) continue; // blank spacer / trailing \\
    dataRows.push({
      cells: row.cells,
      ruleTop: pendingRuleTop || firstCellStartsWithRule(row.cells),
    });
    pendingRuleTop = false;
  }
  const trailingRule = pendingRuleTop; // a rule after the last data row

  const trs = dataRows.map((dr, rowIndex) => {
    const tds: Ast.Node[] = [];
    let rowBg: string | null = null;
    let col = 0;
    for (const cell of dr.cells) {
      const { colspan, style, content, cellBg, rowColor } = interpretCell(
        cell,
        warnings,
        colors,
      );
      if (rowColor) rowBg = rowColor;
      // A \multicolumn brings its own alignment + dividers; otherwise inherit
      // the table's column spec for this position.
      const effective = style ?? colStyles[col] ?? null;
      const classes: string[] = [];
      if (effective?.align) classes.push(`ax-align-${effective.align}`);
      if (effective?.borderLeft) classes.push("ax-border-l");
      if (effective?.borderRight) classes.push("ax-border-r");
      const attributes: Record<string, unknown> = {};
      if (classes.length) attributes.className = classes;
      if (colspan > 1) attributes.colSpan = colspan;
      if (cellBg) attributes.dataAxBg = cellBg;
      tds.push(htmlLike({ tag: "td", attributes, content }));
      col += colspan;
    }
    const rowClasses: string[] = [];
    if (dr.ruleTop) rowClasses.push("ax-rule-top");
    if (trailingRule && rowIndex === dataRows.length - 1) {
      rowClasses.push("ax-rule-bottom");
    }
    const trAttributes: Record<string, unknown> = {};
    if (rowClasses.length) trAttributes.className = rowClasses;
    if (rowBg) trAttributes.dataAxBg = rowBg;
    return htmlLike({
      tag: "tr",
      attributes: trAttributes,
      content: tds,
    });
  });

  return htmlLike({
    tag: "table",
    attributes: { className: ["tabular"] },
    content: [htmlLike({ tag: "tbody", content: trs })],
  });
}

/** tabular is `[pos]{spec}`; tabularx/tabular* are `{width}{spec}` — spec is last. */
function columnSpecArg(env: Ast.Environment): Ast.Node[] {
  const args = getArgsContent(env);
  for (let i = args.length - 1; i >= 0; i--) {
    if (args[i] && args[i]!.length > 0) return args[i]!;
  }
  return [];
}

/** Cell-level macros that carry no renderable content. */
const CELL_NOISE = new Set([
  "cellcolor",
  "rowcolor",
  "columncolor",
  "arrayrulecolor",
]);

function interpretCell(
  cell: Ast.Node[],
  warnings: WarningCollector,
  colors: ColorTable,
): {
  colspan: number;
  style: ColumnStyle | null;
  content: Ast.Node[];
  cellBg: string | null;
  rowColor: string | null;
} {
  // \cellcolor colors this cell; \rowcolor (at row start) the whole row.
  let cellBg: string | null = null;
  let rowColor: string | null = null;
  for (const n of cell) {
    if (!match.anyMacro(n)) continue;
    if (n.content === "cellcolor" || n.content === "rowcolor") {
      const hex = resolveColorHex(rawText(lastArgContent(n)).trim(), colors);
      if (hex) {
        if (n.content === "cellcolor") cellBg = hex;
        else rowColor = hex;
      }
    }
  }
  const significant = cell.filter(
    (n) =>
      !(
        match.anyMacro(n) &&
        (RULE_MACROS.has(n.content) || CELL_NOISE.has(n.content))
      ),
  );
  const first = significant.find(
    (n) => n.type !== "whitespace" && n.type !== "parbreak",
  );

  if (first && match.anyMacro(first) && first.content === "multicolumn") {
    const args = getArgsContent(first);
    const colspan = Math.max(1, parseInt(printRaw(args[0] ?? []).trim(), 10) || 1);
    // The 2nd arg is a one-column spec (e.g. `|c|`) carrying align + dividers.
    return {
      colspan,
      style: parseColumnSpec(args[1] ?? [])[0] ?? null,
      content: args[2] ?? [],
      cellBg,
      rowColor,
    };
  }
  if (first && match.anyMacro(first) && first.content === "multirow") {
    warnings.add("tables", "row-spanning cell shown without vertical merge");
    // Content is the LAST attached arg — the full \multirow signature has
    // optional [vpos]/[bigstruts]/[vmove] slots that shift positions.
    return { colspan: 1, style: null, content: lastArgContent(first), cellBg, rowColor };
  }
  return { colspan: 1, style: null, content: significant, cellBg, rowColor };
}

function isBlankNode(n: Ast.Node): boolean {
  return (
    n.type === "whitespace" ||
    n.type === "parbreak" ||
    (n.type === "string" && n.content.trim() === "")
  );
}

function isRuleNode(n: Ast.Node): boolean {
  return match.anyMacro(n) && RULE_MACROS.has(n.content);
}

/** A row that is nothing but rule macros (+ blanks) — a rule position. */
function isRuleRow(cells: Ast.Node[][]): boolean {
  const nodes = cells.flat();
  return nodes.some(isRuleNode) && nodes.every((n) => isRuleNode(n) || isBlankNode(n));
}

/** A row with no content and no rule — a spacer or trailing `\\`; dropped. */
function isEmptyRow(cells: Ast.Node[][]): boolean {
  return cells.every((cell) => cell.every(isBlankNode));
}

/** True when the row's first cell opens with a rule (e.g. `\toprule Model`). */
function firstCellStartsWithRule(cells: Ast.Node[][]): boolean {
  const first = cells[0]?.find(
    (n) => n.type !== "whitespace" && n.type !== "parbreak",
  );
  return !!first && isRuleNode(first);
}

interface ColumnStyle {
  align: Align | null;
  borderLeft: boolean;
  borderRight: boolean;
}

/**
 * Parse a column spec like "l|c|c" or "|l|r|" into per-column style. Each `|`
 * is assigned to exactly one cell side (left of the following column, or the
 * right of the last column when trailing), so `border-collapse` never has to
 * dedupe a doubled line.
 */
function parseColumnSpec(specNodes: Ast.Node[]): ColumnStyle[] {
  const raw = printRaw(specNodes);
  const cols: ColumnStyle[] = [];
  let pendingLeft = false;
  const push = (align: Align | null) => {
    cols.push({ align, borderLeft: pendingLeft, borderRight: false });
    pendingLeft = false;
  };
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "|") pendingLeft = true;
    else if (ch === "l") push("left");
    else if (ch === "c") push("center");
    else if (ch === "r") push("right");
    else if (ch === "p" || ch === "m" || ch === "b" || ch === "X") {
      push("left");
      i = skipBraced(raw, i + 1);
    } else if (ch === "@" || ch === "!" || ch === ">" || ch === "<") {
      i = skipBraced(raw, i + 1);
    }
    // whitespace, '*' and stray chars are ignored.
  }
  // A `|` after the final column is that column's right border.
  if (pendingLeft && cols.length > 0) cols[cols.length - 1].borderRight = true;
  return cols;
}

/** If the char after `start` opens a `{...}`, return the index of its `}`. */
function skipBraced(raw: string, start: number): number {
  let i = start;
  while (i < raw.length && /\s/.test(raw[i])) i++;
  if (raw[i] !== "{") return start - 1;
  let depth = 0;
  for (; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}" && --depth === 0) return i;
  }
  return i;
}
