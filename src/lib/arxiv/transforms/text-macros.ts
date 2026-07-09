import type * as Ast from "@unified-latex/unified-latex-types";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import type { WarningCollector } from "../warnings";
import { resolveColorHex, type ColorTable } from "./colors";
import { lastArgContent, rawText, texString, walkNodeArrays } from "./tex-utils";

type MacroReplacement = (node: Ast.Macro) => Ast.Node | Ast.Node[];

/**
 * Replacements for everyday text-mode macros that unified-latex-to-hast
 * either mishandles or crashes on. Notably \textsuperscript/\textsubscript:
 * the library's own handler throws an UNHANDLED REJECTION mid-pass, silently
 * aborting conversion for the rest of the document — providing our own
 * replacement (and attaching the argument signature) bypasses that path.
 */

/** Simple tag wraps: macro content → <tag class=...>content</tag>. */
const TAG_WRAPS: Record<string, { tag: string; className?: string }> = {
  textsuperscript: { tag: "sup" },
  textsubscript: { tag: "sub" },
  sout: { tag: "s" },
  st: { tag: "s" },
  underline: { tag: "u" },
  uline: { tag: "u" },
  textsc: { tag: "span", className: "ax-sc" },
  textmd: { tag: "span" },
  textup: { tag: "span" },
  textnormal: { tag: "span" },
};

/**
 * Wrappers whose non-content arguments (sizes, colors, angles) are dropped
 * and whose LAST argument is the real content. Includes \resizebox/\scalebox
 * around tables/figures, which otherwise printRaw already-converted children
 * as literal \html-tag: internals.
 */
const UNWRAP_SIGNATURES: Record<string, string> = {
  mbox: "m",
  hbox: "m",
  fbox: "m",
  makebox: "o o m",
  framebox: "o o m",
  centerline: "m",
  smash: "o m",
  parbox: "o o o m m",
  raisebox: "m o o m",
  textcolor: "o m m",
  colorbox: "o m m",
  fcolorbox: "o m m m",
  hl: "m",
  highlight: "m",
  resizebox: "s m m m",
  scalebox: "m o m",
  rotatebox: "o m m",
  reflectbox: "m",
  adjustbox: "m m",
  bibinfo: "m m",
  bibfield: "m m",
  natexlab: "m",
  texttt: "", // native; listed only so a .bbl \providecommand can't break it
};

/** Zero-content macros producing a fixed string/glyph. */
const SYMBOLS: Record<string, string> = {
  LaTeX: "LaTeX",
  TeX: "TeX",
  BibTeX: "BibTeX",
  textless: "<",
  textgreater: ">",
  lbrack: "[",
  rbrack: "]",
  dag: "†",
  ddag: "‡",
  S: "§",
  P: "¶",
  copyright: "©",
  textregistered: "®",
  texttrademark: "™",
  ldots: "…",
  dots: "…",
  textellipsis: "…",
  textbackslash: "\\",
  textasciitilde: "~",
  textasciicircum: "^",
  textbar: "|",
  textbullet: "•",
  textemdash: "—",
  textendash: "–",
  textquotedblleft: "“",
  textquotedblright: "”",
  textquoteleft: "‘",
  textquoteright: "’",
  textperiodcentered: "·",
  textdegree: "°",
  checkmark: "✓",
  textperthousand: "‰",
  pounds: "£",
  euro: "€",
};

/** Macros that produce nothing visible; strip together with their args. */
const STRIP_SIGNATURES: Record<string, string> = {
  xspace: "",
  phantom: "m",
  hphantom: "m",
  vphantom: "m",
  ding: "m",
  pdfoutput: "",
  ignorespaces: "",
  ignorespacesafterend: "",
  urlprefix: "",
  global: "",
};

/**
 * Font commands whose to-hast handler THROWS (unhandled rejection, aborting
 * the whole pass) when the macro has no attached args and nothing follows it.
 * Macro expansion can produce exactly that shape (\let\B\textbf → bare
 * \textbf). Attach args now; sweep any still-orphaned ones.
 */
const FONT_COMMANDS = [
  "textbf",
  "textit",
  "texttt",
  "textsf",
  "textrm",
  "textsl",
  "emph",
  "underline",
];

function armorFontCommands(tree: Ast.Root, warnings: WarningCollector): void {
  attachMacroArgs(
    tree,
    Object.fromEntries(FONT_COMMANDS.map((n) => [n, { signature: "m" }])),
  );
  walkNodeArrays(tree, (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (
        !("type" in node) ||
        node.type !== "macro" ||
        !FONT_COMMANDS.includes(node.content)
      ) {
        continue;
      }
      if (node.args && node.args.some((a) => a.content.length > 0)) continue;
      // Arg-less after attachment: nothing consumable follows — the library
      // handler would throw. Drop the macro.
      const hasFollowing = nodes
        .slice(i + 1)
        .some((n) => n.type !== "whitespace" && n.type !== "parbreak");
      if (!hasFollowing) {
        warnings.add("orphan-font", "\\" + node.content + " with no content");
        nodes.splice(i, 1);
      }
    }
  });
}

export function buildTextMacroReplacements(
  tree: Ast.Root,
  warnings: WarningCollector,
  colors: ColorTable = new Map(),
): Record<string, MacroReplacement> {
  armorFontCommands(tree, warnings);
  attachMacroArgs(tree, {
    ...Object.fromEntries(
      Object.keys(TAG_WRAPS).map((name) => [name, { signature: "m" }]),
    ),
    ...Object.fromEntries(
      Object.entries(UNWRAP_SIGNATURES)
        .filter(([, sig]) => sig !== "")
        .map(([name, signature]) => [name, { signature }]),
    ),
    ...Object.fromEntries(
      Object.entries(STRIP_SIGNATURES)
        .filter(([, sig]) => sig !== "")
        .map(([name, signature]) => [name, { signature }]),
    ),
    linebreak: { signature: "o" },
    ensuremath: { signature: "m" },
    doi: { signature: "m" },
  });

  const replacements: Record<string, MacroReplacement> = {};

  for (const [name, { tag, className }] of Object.entries(TAG_WRAPS)) {
    replacements[name] = (node) =>
      htmlLike({
        tag,
        attributes: className ? { className } : undefined,
        content: lastArgContent(node),
      });
  }

  for (const name of Object.keys(UNWRAP_SIGNATURES)) {
    if (name === "texttt") continue; // keep the native handler
    replacements[name] = (node) => lastArgContent(node);
  }

  for (const [name, text] of Object.entries(SYMBOLS)) {
    replacements[name] = () => texString(text);
  }

  for (const name of Object.keys(STRIP_SIGNATURES)) {
    replacements[name] = (node) => {
      if (name === "ding") {
        warnings.add("symbols", `\\ding{${rawText(lastArgContent(node))}} omitted`);
      }
      return [];
    };
  }

  // Author line breaks become real <br>.
  replacements.newline = () => htmlLike({ tag: "br" });
  replacements.linebreak = () => htmlLike({ tag: "br" });
  // \par is a paragraph break, not an unknown macro.
  replacements.par = () => ({ type: "parbreak" }) as Ast.Node;

  // \ensuremath{X}: in text mode, X is math.
  replacements.ensuremath = (node) => ({
    type: "inlinemath",
    content: lastArgContent(node),
  });

  // \textcolor{spec}{text}: keep the color when it resolves; otherwise the
  // UNWRAP fallback above already keeps the text.
  replacements.textcolor = (node) => {
    const args = node.args ?? [];
    const specArg = args.filter((a) => a.openMark === "{")[0];
    const hex = specArg
      ? resolveColorHex(rawText(specArg.content).trim(), colors)
      : null;
    if (!hex) return lastArgContent(node);
    return htmlLike({
      tag: "span",
      attributes: { dataAxFg: hex },
      content: lastArgContent(node),
    });
  };

  // \doi{10.x/y} → a link (common in .bbl files).
  replacements.doi = (node) => {
    const doi = rawText(lastArgContent(node)).trim();
    return htmlLike({
      tag: "a",
      attributes: { href: `https://doi.org/${doi}`, className: "ax-ref" },
      content: [texString(doi)],
    });
  };

  return replacements;
}
