import type * as Ast from "@unified-latex/unified-latex-types";
import {
  attachMacroArgs,
  getArgsContent,
} from "@unified-latex/unified-latex-util-arguments";
import {
  expandMacrosExcludingDefinitions,
  listNewcommands,
} from "@unified-latex/unified-latex-util-macros";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { match } from "@unified-latex/unified-latex-util-match";
import { replaceNode } from "@unified-latex/unified-latex-util-replace";
import type { WarningCollector } from "../warnings";
import { envName, plainText, rawText, stripTexComments, walkNodeArrays } from "./tex-utils";
import { resolveColorHex, type ColorTable } from "./colors";

/** Macros defined in terms of other user macros need extra rounds. */
const EXPANSION_ROUNDS = 3;

/**
 * Structural commands the later transforms recognize by name. Papers commonly
 * wrap these (hyperref redefines \label, .bbl files \providecommand \url,
 * etc.); expanding the wrapper would break cross-reference/citation handling
 * and leak internals. Keep the original command name intact.
 */
const PROTECTED_FROM_EXPANSION = new Set([
  "label",
  "ref",
  "cref",
  "Cref",
  "eqref",
  "autoref",
  "pageref",
  "cite",
  "citep",
  "citet",
  "citealp",
  "citealt",
  "citenum",
  "citeauthor",
  "citeyear",
  "citeyearpar",
  "caption",
  "includegraphics",
  "section",
  "subsection",
  "subsubsection",
  "paragraph",
  "footnote",
  "item",
  "newtheorem",
  "bibitem",
  "appendix",
  "url",
  "href",
  "doi",
]);

const DEFINITION_MACROS = new Set([
  "newcommand",
  "renewcommand",
  "providecommand",
  "NewDocumentCommand",
  "RenewDocumentCommand",
  "ProvideDocumentCommand",
  "DeclareMathOperator",
  "DeclarePairedDelimiter",
]);

/** Setup commands whose arguments must never render as text. */
const SETUP_STRIP_SIGNATURES: Record<string, string> = {
  DeclareMathOperator: "s m m",
  DeclarePairedDelimiter: "m m m",
  definecolor: "o m m m",
  providecolor: "o m m m",
  colorlet: "o m o m",
  newlength: "m",
  newcounter: "m o",
  newsavebox: "m",
  crefname: "m m m",
  Crefname: "m m m",
  creflabelformat: "m m",
  DeclareCaptionFormat: "m m",
  DeclareCaptionStyle: "o m m",
  pdfbookmark: "o m m",
  hypersetup: "m",
  lstset: "m",
  sisetup: "m",
  tcbset: "m",
  tikzset: "m",
  pgfplotsset: "m",
  DeclareUnicodeCharacter: "m m",
  addbibresource: "o m",
  bibliography: "m", // spliced earlier when a .bbl exists; strip stragglers
};

interface MacroSpec {
  name: string;
  signature: string;
  body: Ast.Node[];
}

export interface EnvArgSpec {
  kind: "o" | "m";
  default: Ast.Node[];
}

export interface EnvDef {
  name: string;
  /** Ordered argument sequence — xparse allows interleaving (O m O O). */
  argSpec: EnvArgSpec[];
  beginBody: Ast.Node[];
  endBody: Ast.Node[];
  /** For \newtcolorbox: the raw option nodes (title=, colback=, ...). */
  boxOptions?: Ast.Node[];
}

/**
 * Expand user-defined macros throughout the tree: \newcommand-family (via
 * unified-latex), plus \def/\gdef/\edef with simple #1..#n parameters and
 * \let aliases (collected by our own scanner, since listNewcommands sees
 * neither). Definitions are removed so they never render.
 *
 * Bodies containing TeX conditionals (\ifx/\else/\fi) cannot be statically
 * expanded — those macros are skipped with a warning instead of producing
 * both branches as garbage.
 */
export function expandUserMacros(
  tree: Ast.Root,
  warnings: WarningCollector,
): void {
  const scanned = collectDefAndLetSpecs(tree, warnings);

  for (let round = 0; round < EXPANSION_ROUNDS; round++) {
    const candidates = [...listNewcommands(tree), ...scanned].filter((c) => {
      if (PROTECTED_FROM_EXPANSION.has(c.name)) return false;
      if (hasConditionalBody(c.body)) {
        warnings.add("macro-conditional", `\\${c.name} uses TeX conditionals`);
        return false;
      }
      return true;
    });
    // Dedupe by name (last definition wins, like TeX). Duplicate specs —
    // e.g. a definitions file \input twice — would EXPAND EVERY USE TWICE.
    const byName = new Map(candidates.map((c) => [c.name, c]));
    const commands = [...byName.values()];
    if (commands.length === 0) break;
    const signatures = Object.fromEntries(
      commands.map((c) => [c.name, { signature: c.signature }]),
    );
    attachMacroArgs(tree, signatures);
    expandMacrosExcludingDefinitions(
      tree,
      commands.map((c) => ({ name: c.name, body: c.body })),
    );
  }
  removeDefinitions(tree);
}

function hasConditionalBody(body: Ast.Node[]): boolean {
  return body.some((node) => {
    if (
      match.anyMacro(node) &&
      /^(if[a-zA-Z@]*|else|fi|or)$/.test(node.content)
    ) {
      return true;
    }
    if ("content" in node && Array.isArray(node.content)) {
      return hasConditionalBody(node.content as Ast.Node[]);
    }
    return false;
  });
}

/**
 * Scan for `\def\name<params>{body}` and `\let\alias\target`, returning
 * newcommand-style specs and REMOVING the definition tokens from the tree.
 * Simple `#1..#n` parameter lists are supported; delimited-parameter \defs
 * (e.g. `\def\pair(#1,#2){...}`) are removed wholesale with a warning so
 * neither the definition nor stray delimiter tokens leak into prose.
 */
function collectDefAndLetSpecs(
  tree: Ast.Root,
  warnings: WarningCollector,
): MacroSpec[] {
  const specs: MacroSpec[] = [];

  walkNodeArrays(tree, (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!match.anyMacro(node)) continue;

      if (node.content === "def" || node.content === "gdef" || node.content === "edef") {
        const target = nextSignificant(nodes, i + 1);
        if (!target || !match.anyMacro(nodes[target])) {
          nodes.splice(i, 1);
          continue;
        }
        const name = (nodes[target] as Ast.Macro).content;
        // Read parameter tokens between the name and the body group.
        let j = target + 1;
        let params = 0;
        let delimited = false;
        while (j < nodes.length && nodes[j].type !== "group") {
          const tok = nodes[j];
          if (tok.type === "whitespace" || tok.type === "parbreak") {
            j++;
            continue;
          }
          if (tok.type === "string" && tok.content === "#") {
            const digit = nodes[j + 1];
            if (digit?.type === "string" && /^\d$/.test(digit.content)) {
              params++;
              j += 2;
              continue;
            }
          }
          if (tok.type === "string" && /^#\d$/.test(tok.content)) {
            params++;
            j++;
            continue;
          }
          delimited = true;
          j++;
          if (j - target > 12) break; // runaway guard
        }
        const bodyIndex = j < nodes.length && nodes[j].type === "group" ? j : -1;
        if (bodyIndex === -1) {
          // No body group found — drop just the \def tokens scanned so far.
          nodes.splice(i, Math.min(j, nodes.length) - i);
          warnings.add("def-skipped", `\\def\\${name} has no simple body`);
          continue;
        }
        if (delimited) {
          warnings.add(
            "def-skipped",
            `\\def\\${name} uses delimited parameters`,
          );
        } else {
          specs.push({
            name,
            signature: Array(params).fill("m").join(" "),
            body: (nodes[bodyIndex] as Ast.Group).content,
          });
        }
        nodes.splice(i, bodyIndex - i + 1);
        continue;
      }

      if (node.content === "let") {
        // \let\alias\target  (optionally \let\alias=\target)
        const aliasAt = nextSignificant(nodes, i + 1);
        if (aliasAt === null || !match.anyMacro(nodes[aliasAt])) continue;
        let targetAt = nextSignificant(nodes, aliasAt + 1);
        if (
          targetAt !== null &&
          nodes[targetAt].type === "string" &&
          (nodes[targetAt] as Ast.String).content === "="
        ) {
          targetAt = nextSignificant(nodes, targetAt + 1);
        }
        if (targetAt === null || !match.anyMacro(nodes[targetAt])) continue;
        const alias = (nodes[aliasAt] as Ast.Macro).content;
        const target = nodes[targetAt] as Ast.Macro;
        specs.push({
          name: alias,
          signature: "",
          body: [{ type: "macro", content: target.content }],
        });
        // The parser may have already attached following prose as the
        // target's argument (\let\B\textbf Also -> textbf{Also}); reinsert
        // that content so it isn't deleted with the definition.
        const stolen: Ast.Node[] = (target.args ?? [])
          .filter((a) => a.content.length > 0)
          .map((a) => ({ type: "group", content: a.content }) as Ast.Node);
        nodes.splice(i, targetAt - i + 1, ...stolen);
      }
    }
  });
  return specs;
}

function nextSignificant(nodes: Ast.Node[], from: number): number | null {
  for (let i = from; i < nodes.length; i++) {
    if (nodes[i].type !== "whitespace" && nodes[i].type !== "parbreak") {
      return i;
    }
  }
  return null;
}

function removeDefinitions(tree: Ast.Root): void {
  attachMacroArgs(
    tree,
    Object.fromEntries(
      Object.entries(SETUP_STRIP_SIGNATURES).map(([name, signature]) => [
        name,
        { signature },
      ]),
    ),
  );

  walkNodeArrays(tree, (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!match.anyMacro(node)) continue;

      if (DEFINITION_MACROS.has(node.content) || node.content in SETUP_STRIP_SIGNATURES) {
        // With args attached, the whole definition is one node. Without
        // (exotic forms), eat following groups defensively.
        let end = i + 1;
        if (
          DEFINITION_MACROS.has(node.content) &&
          (!node.args || node.args.length === 0)
        ) {
          while (end < nodes.length && isDefinitionTail(nodes[end])) end++;
        }
        nodes.splice(i, end - i);
      }
    }
  });
}

function isDefinitionTail(node: Ast.Node): boolean {
  return (
    node.type === "group" ||
    node.type === "whitespace" ||
    (match.anyMacro(node) && node.content !== "par")
  );
}

/** `\texorpdfstring{tex}{pdf}` → the TeX branch. */
export function applyTexorpdfstring(tree: Ast.Root): void {
  attachMacroArgs(tree, { texorpdfstring: { signature: "m m" } });
  replaceNode(tree, (node) => {
    if (!match.macro(node, "texorpdfstring")) return;
    return getArgsContent(node)[0] ?? [];
  });
}

// ---------------------------------------------------------------------------
// User-defined environments
// ---------------------------------------------------------------------------

const ENV_DEFINITION_MACROS: Record<string, string> = {
  newenvironment: "s m o o m m",
  renewenvironment: "s m o o m m",
  NewDocumentEnvironment: "m m m m",
  RenewDocumentEnvironment: "m m m m",
  DeclareDocumentEnvironment: "m m m m",
  newtcolorbox: "o m o o m",
  renewtcolorbox: "o m o o m",
  newtcbox: "o m o o m",
};

/**
 * Collect \newenvironment/\NewDocumentEnvironment/\newtcolorbox definitions
 * (removing them from the tree), so uses can be expanded instead of rendering
 * as unknown environments with leaked arguments and lost begin-code.
 */
export function collectEnvDefinitions(
  tree: Ast.Root,
  warnings: WarningCollector,
): EnvDef[] {
  attachMacroArgs(
    tree,
    Object.fromEntries(
      Object.entries(ENV_DEFINITION_MACROS).map(([name, signature]) => [
        name,
        { signature },
      ]),
    ),
  );

  const defs = new Map<string, EnvDef>();
  walkNodeArrays(tree, (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!match.anyMacro(node) || !(node.content in ENV_DEFINITION_MACROS)) {
        continue;
      }
      const def = parseEnvDefinition(node, warnings);
      if (def) defs.set(def.name, def);
      nodes.splice(i, 1);
    }
  });
  return [...defs.values()];
}

/** LaTeX-style spec: [n args][default] → first arg optional iff default given. */
function latexArgSpec(total: number, defaultValue: Ast.Node[] | null): EnvArgSpec[] {
  const spec: EnvArgSpec[] = [];
  for (let k = 0; k < total; k++) {
    if (k === 0 && defaultValue !== null) {
      spec.push({ kind: "o", default: defaultValue });
    } else {
      spec.push({ kind: "m", default: [] });
    }
  }
  return spec;
}

/** xparse spec string ("O{normal} m o o") → ordered sequence. */
function xparseArgSpec(spec: string): EnvArgSpec[] {
  const out: EnvArgSpec[] = [];
  for (let i = 0; i < spec.length; i++) {
    const ch = spec[i];
    if (ch === "m") out.push({ kind: "m", default: [] });
    else if (ch === "o") out.push({ kind: "o", default: [] });
    else if (ch === "O") {
      // Read the {default} that follows.
      let j = spec.indexOf("{", i);
      let defaultText = "";
      if (j !== -1) {
        let depth = 0;
        const start = j + 1;
        for (; j < spec.length; j++) {
          if (spec[j] === "{") depth++;
          else if (spec[j] === "}" && --depth === 0) break;
        }
        defaultText = spec.slice(start, j);
        i = j;
      }
      out.push({
        kind: "o",
        default: defaultText ? [{ type: "string", content: defaultText }] : [],
      });
    }
  }
  return out;
}

function parseEnvDefinition(
  node: Ast.Macro,
  warnings: WarningCollector,
): EnvDef | null {
  const args = getArgsContent(node);
  const kind = node.content;

  if (kind === "newtcolorbox" || kind === "renewtcolorbox" || kind === "newtcbox") {
    // [init]{name}[nargs][default]{options} — the OPTIONS carry the box's
    // identity (title=User, colback=..., colframe=...); keep them so uses
    // render as titled, colored boxes instead of bare flowing text.
    const name = rawText(args[1] ?? []).trim();
    if (!name) return null;
    const nArgsRaw = parseInt(rawText(args[2] ?? []).trim(), 10);
    // "[1][]" = one OPTIONAL arg with empty default: presence is args[3] !=
    // null (getArgsContent yields null for omitted, [] for present-but-empty).
    const total = Number.isFinite(nArgsRaw) ? nArgsRaw : 0;
    return {
      name,
      argSpec: latexArgSpec(total, args[3] ?? null),
      beginBody: [],
      endBody: [],
      boxOptions: args[4] ?? [],
    };
  }

  if (kind === "newenvironment" || kind === "renewenvironment") {
    // The parser may know \newenvironment with its own arg layout — derive
    // slots from openMarks rather than positions: name = first {...} arg,
    // then [nargs] and [default] brackets, then the last two {...} args are
    // begin/end code.
    const braced = (node.args ?? []).filter((a) => a.openMark === "{");
    const brackets = (node.args ?? []).filter((a) => a.openMark === "[");
    const name = rawText(braced[0]?.content ?? []).trim();
    if (!name || braced.length < 3) return null;
    const nArgsRaw = parseInt(rawText(brackets[0]?.content ?? []).trim(), 10);
    const total = Number.isFinite(nArgsRaw) ? nArgsRaw : 0;
    const argSpec = latexArgSpec(
      total,
      brackets.length >= 2 ? brackets[1].content : null,
    );
    const begin = braced[braced.length - 2]?.content ?? [];
    const end = braced[braced.length - 1]?.content ?? [];
    if (hasConditionalBody(begin) || hasConditionalBody(end)) {
      warnings.add("env-conditional", `environment "${name}" uses conditionals`);
      return { name, argSpec, beginBody: [], endBody: [] };
    }
    return { name, argSpec, beginBody: begin, endBody: end };
  }

  // xparse: {name}{argspec}{begin}{end} — args may INTERLEAVE (O m O O).
  const name = rawText(args[0] ?? []).trim();
  if (!name) return null;
  const argSpec = xparseArgSpec(rawText(args[1] ?? []));
  const begin = args[2] ?? [];
  const end = args[3] ?? [];
  if (hasConditionalBody(begin) || hasConditionalBody(end)) {
    warnings.add("env-conditional", `environment "${name}" uses conditionals`);
    return { name, argSpec, beginBody: [], endBody: [] };
  }
  return { name, argSpec, beginBody: begin, endBody: end };
}

/**
 * Replace each use of a user-defined environment with
 * begin-code(args) + content + end-code, so headers/labels the environment
 * adds actually render and its [optional]/{mandatory} args never leak.
 */
export function expandUserEnvironments(
  tree: Ast.Root,
  envDefs: EnvDef[],
  warnings: WarningCollector,
  colors: ColorTable = new Map(),
): void {
  if (envDefs.length === 0) return;
  const byName = new Map(envDefs.map((d) => [d.name, d]));

  // Multiple rounds handle environments whose bodies use other defined envs
  // (including ones only reconstructed by the re-pairing pass below).
  for (let round = 0; round < 4; round++) {
    let expanded = false;
    walkNodeArrays(tree, (nodes) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node.type !== "environment" && node.type !== "mathenv") continue;
        const def = byName.get(envName(node));
        if (!def) continue;

        const content = [...node.content];
        const argValues = peelEnvArgs(content, def);
        if (def.boxOptions) {
          // tcolorbox: render as a titled, colored box.
          nodes.splice(i, 1, buildTcolorbox(def, argValues, content, colors));
          expanded = true;
          continue;
        }
        const begin = substituteHashParams(def.beginBody, argValues);
        const end = substituteHashParams(def.endBody, argValues);
        nodes.splice(i, 1, ...begin, ...content, ...end);
        expanded = true;
      }
    });
    // Definition bodies often open an environment in begin-code and close it
    // in end-code (\newenvironment{x}{\begin{figure*}...}{...\end{figure*}}).
    // Those arrive as raw unpaired \begin/\end macro tokens — reconstruct
    // real environment nodes from them so they render (and so defined envs
    // they name get expanded next round).
    const repaired = repairSplitEnvironments(tree, warnings);
    if (!expanded && !repaired) break;
  }
}

/**
 * Render a \newtcolorbox use as a styled box: the tcolorbox OPTIONS carry
 * its whole identity (title=User, colback=..., colframe=...). Colors resolve
 * through the xcolor table to validated hex (applied post-sanitize).
 */
function buildTcolorbox(
  def: EnvDef,
  argValues: Ast.Node[][],
  content: Ast.Node[],
  colors: ColorTable,
): Ast.Node {
  const options = plainText(substituteHashParams(def.boxOptions ?? [], argValues));
  const readOpt = (key: string): string | null => {
    const m = new RegExp(`(?:^|,)\\s*${key}\\s*=\\s*([^,]+)`).exec(options);
    return m ? m[1].trim() : null;
  };
  const title = readOpt("title");
  const colback = readOpt("colback");
  const colframe = readOpt("colframe");
  const coltitle = readOpt("coltitle");
  const bg = colback ? resolveColorHex(colback, colors) : null;
  const frame = colframe ? resolveColorHex(colframe, colors) : null;
  // tcolorbox renders the title bar in colframe with coltitle text, and
  // coltitle DEFAULTS TO WHITE — only apply it when the chip actually has a
  // dark background to sit on.
  const titleFg =
    (coltitle ? resolveColorHex(coltitle, colors) : null) ??
    (frame ? "#ffffff" : null);

  const children: Ast.Node[] = [];
  if (title) {
    children.push(
      htmlLike({
        tag: "div",
        attributes: {
          className: "ax-box-title",
          ...(frame ? { dataAxBg: frame } : {}),
          ...(titleFg ? { dataAxFg: titleFg } : {}),
        },
        content: [{ type: "string", content: title }],
      }),
    );
  }
  children.push(...content);

  // The labeled box variants take label args (environment name, model tag)
  // that the print version shows via a TikZ overlay we can't run — surface
  // them as a small footer line instead of dropping them.
  const labelParts = def.argSpec
    .map((slot, i) => ({ slot, text: plainText(argValues[i] ?? []) }))
    .filter(
      ({ slot, text }) =>
        text.length > 0 &&
        text.length < 120 &&
        // internal link targets look like ids (transcript:o3:task:hash)
        !(text.includes(":") && /^[\w:.-]+$/.test(text)) &&
        (slot.kind === "m" || !/^(normal|tiny|small|large|huge)$/.test(text)),
    )
    .map(({ text }) => text);
  if (labelParts.length > 0) {
    children.push(
      htmlLike({
        tag: "div",
        attributes: { className: "ax-box-label" },
        content: [{ type: "string", content: labelParts.join(" · ") }],
      }),
    );
  }

  return htmlLike({
    tag: "div",
    attributes: {
      className: "ax-box",
      ...(bg ? { dataAxBg: bg } : {}),
      ...(frame ? { dataAxBc: frame } : {}),
    },
    content: children,
  });
}

/**
 * Rebuild Environment nodes from raw sibling `\begin{X} … \end{X}` macro
 * tokens (produced when env definition bodies contain unbalanced opens or
 * closes). Unpaired leftovers are dropped with a warning rather than leaking
 * "\begin" spans and the env name as text.
 */
function repairSplitEnvironments(
  tree: Ast.Root,
  warnings: WarningCollector,
): boolean {
  let repaired = false;

  const nameAfter = (nodes: Ast.Node[], i: number): string | null => {
    const next = nodes[i + 1];
    if (next?.type !== "group") return null;
    return rawText(next.content).trim() || null;
  };

  walkNodeArrays(tree, (nodes) => {
    // Innermost-first: repeatedly find an \end whose nearest preceding
    // \begin matches, and fold the span into an environment node.
    for (let guard = 0; guard < 32; guard++) {
      let changed = false;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!match.anyMacro(node) || node.content !== "end") continue;
        const endName = nameAfter(nodes, i);
        if (!endName) continue;
        // Find the nearest preceding matching \begin in the same array.
        for (let j = i - 1; j >= 0; j--) {
          const cand = nodes[j];
          if (!match.anyMacro(cand) || cand.content !== "begin") continue;
          if (nameAfter(nodes, j) !== endName) continue;
          const inner = nodes.slice(j + 2, i);
          const env: Ast.Node = {
            type: "environment",
            env: endName,
            content: inner,
          } as Ast.Node;
          nodes.splice(j, i - j + 2, env);
          changed = true;
          repaired = true;
          break;
        }
        if (changed) break;
      }
      if (!changed) break;
    }
    // Drop any unpaired leftovers (with their name groups).
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!match.anyMacro(node)) continue;
      if (node.content !== "begin" && node.content !== "end") continue;
      const name = nameAfter(nodes, i);
      warnings.add(
        "env-repair",
        `unpaired \\${node.content}{${name ?? "?"}} dropped`,
      );
      nodes.splice(i, name ? 2 : 1);
    }
  });
  return repaired;
}

/** Peel the env's leading [opt] and {mandatory} args off its content. */
function peelEnvArgs(content: Ast.Node[], def: EnvDef): Ast.Node[][] {
  const values: Ast.Node[][] = [];

  // Walk the ORDERED spec — xparse args interleave (O m O O), so peeling
  // all optionals first would leave trailing [..] brackets to leak as text.
  for (const slot of def.argSpec) {
    skipLeadingBlank(content);
    if (slot.kind === "o") {
      const opt = peelBracketRun(content);
      values.push(opt ?? slot.default);
      continue;
    }
    const first = content[0];
    if (first?.type === "group") {
      content.shift();
      values.push((first as Ast.Group).content);
    } else if (first) {
      content.shift();
      values.push([first]);
    } else {
      values.push([]);
    }
  }
  return values;
}

function skipLeadingBlank(content: Ast.Node[]): void {
  while (
    content.length > 0 &&
    (content[0].type === "whitespace" || content[0].type === "parbreak")
  ) {
    content.shift();
  }
}

/** Remove a leading `[...]` token run, returning its inner nodes, or null. */
function peelBracketRun(content: Ast.Node[]): Ast.Node[] | null {
  const first = content[0];
  if (!first || first.type !== "string" || !first.content.startsWith("[")) {
    return null;
  }
  const inner: Ast.Node[] = [];
  for (let i = 0; i < content.length && i < 24; i++) {
    const node = content[i];
    if (node.type === "string") {
      let text = node.content;
      if (i === 0) text = text.slice(1);
      const close = text.indexOf("]");
      if (close !== -1) {
        const before = text.slice(0, close);
        const after = text.slice(close + 1);
        if (before) inner.push({ type: "string", content: before });
        content.splice(0, i + 1);
        if (after) content.unshift({ type: "string", content: after });
        return inner;
      }
      if (text) inner.push({ type: "string", content: text });
    } else {
      inner.push(node);
    }
  }
  return null; // unclosed — not really an optional arg
}

/** Deep-substitute #1..#n parameter tokens in a cloned body. */
function substituteHashParams(
  body: Ast.Node[],
  args: Ast.Node[][],
): Ast.Node[] {
  const clone = structuredClone(body);
  const substitute = (nodes: Ast.Node[]) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.type === "string") {
        let m = /^#(\d)$/.exec(node.content);
        if (m) {
          nodes.splice(i, 1, ...structuredClone(args[Number(m[1]) - 1] ?? []));
          continue;
        }
        if (node.content === "#") {
          const next = nodes[i + 1];
          if (next?.type === "string" && (m = /^(\d)/.exec(next.content))) {
            const rest = next.content.slice(1);
            const replacement = structuredClone(args[Number(m[1]) - 1] ?? []);
            nodes.splice(
              i,
              2,
              ...replacement,
              ...(rest ? [{ type: "string", content: rest } as Ast.Node] : []),
            );
            continue;
          }
        }
      }
      if ("content" in node && Array.isArray(node.content)) {
        substitute(node.content as Ast.Node[]);
      }
      if ("args" in node && Array.isArray(node.args)) {
        for (const arg of node.args) substitute(arg.content);
      }
    }
  };
  substitute(clone);
  return clone;
}

// ---------------------------------------------------------------------------
// KaTeX macro table (math-mode support for \def and friends)
// ---------------------------------------------------------------------------

const KATEX_MACRO_CAP = 1000;

/** Common commands KaTeX lacks; paper definitions override these. */
const KATEX_SEED_MACROS: Record<string, string> = {
  "\\hdots": "\\ldots",
  "\\ensuremath": "#1",
  "\\mbox": "\\text{#1}",
  "\\textup": "\\text{#1}",
  "\\textnormal": "\\text{#1}",
  // Text-mode spacing macros that ride into math via expanded user macros.
  "\\xspace": "{}",
  "\\strut": "{}",
};

export interface KatexMacroTable {
  macros: Record<string, string>;
  /** Names defined via \DeclarePairedDelimiter (starred uses need scrubbing). */
  pairedDelims: string[];
}

/**
 * Regex/scanner prepass over the RAW source building a KaTeX `macros` table
 * for definitions used in math mode.
 */
export function collectKatexMacros(
  rawSource: string,
  warnings: WarningCollector,
): KatexMacroTable {
  const macros: Record<string, string> = { ...KATEX_SEED_MACROS };
  const pairedDelims: string[] = [];
  // Scan comment-free source so a commented-out `% \def\x{OLD}` can't shadow
  // the live definition (later matches overwrite earlier ones in the table).
  const texSource = stripTexComments(rawSource);

  // \def\name{body} (params like #1 between name and body are kept —
  // KaTeX understands #1).
  forEachCommand(texSource, /\\[gex]?def\s*\\([a-zA-Z@]+)\s*((?:#\d)*)\s*\{/g, (m, at) => {
    const body = readBalanced(texSource, at);
    if (body === null) return;
    macros[`\\${m[1]}`] = body.text;
  });

  // \DeclareMathOperator*{\op}{body} → \operatorname*{body}
  forEachCommand(
    texSource,
    /\\DeclareMathOperator(\*?)\s*\{\\([a-zA-Z@]+)\}\s*\{/g,
    (m, at) => {
      const body = readBalanced(texSource, at);
      if (body === null) return;
      macros[`\\${m[2]}`] = `\\operatorname${m[1]}{${body.text}}`;
    },
  );

  // \DeclarePairedDelimiter\abs{\lvert}{\rvert} → \lvert #1 \rvert
  forEachCommand(
    texSource,
    /\\DeclarePairedDelimiter\s*\{?\\([a-zA-Z@]+)\}?\s*\{/g,
    (m, at) => {
      const left = readBalanced(texSource, at);
      if (left === null) return;
      const rest = texSource.slice(left.end).match(/^\s*\{/);
      if (!rest) return;
      const right = readBalanced(texSource, left.end + rest[0].length);
      if (right === null) return;
      macros[`\\${m[1]}`] = `${left.text}#1${right.text}`;
      pairedDelims.push(m[1]);
    },
  );

  const names = Object.keys(macros);
  if (names.length > KATEX_MACRO_CAP) {
    warnings.add(
      "macro-table",
      `${names.length} math macros; truncated to ${KATEX_MACRO_CAP}`,
    );
    return {
      macros: Object.fromEntries(
        Object.entries(macros).slice(0, KATEX_MACRO_CAP),
      ),
      pairedDelims,
    };
  }
  return { macros, pairedDelims };
}

function forEachCommand(
  source: string,
  re: RegExp,
  fn: (m: RegExpExecArray, bodyStart: number) => void,
): void {
  for (let m = re.exec(source); m !== null; m = re.exec(source)) {
    fn(m, m.index + m[0].length);
  }
}

/** Read a `{...}`-balanced body whose opening brace is just before `start`. */
function readBalanced(
  source: string,
  start: number,
): { text: string; end: number } | null {
  let depth = 1;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === "\\") {
      i++;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return { text: source.slice(start, i), end: i + 1 };
    }
  }
  return null;
}
