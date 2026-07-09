import type * as Ast from "@unified-latex/unified-latex-types";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { match } from "@unified-latex/unified-latex-util-match";
import { walkNodeArrays } from "./tex-utils";

/**
 * Layout-only macros that carry no meaning in HTML. Removing them keeps the
 * warning list focused on degradations that matter. Values are argument
 * signatures to attach first so braces are eaten along with the macro.
 */
const STRIP_WITH_SIGNATURE: Record<string, string> = {
  vspace: "s m",
  hspace: "s m",
  setlength: "m m",
  addtolength: "m m",
  setcounter: "m m",
  addtocounter: "m m",
  pagestyle: "m",
  thispagestyle: "m",
  pagenumbering: "m",
  linespread: "m",
  hyphenation: "m",
  markboth: "m m",
  markright: "m",
  usepackage: "o m",
  documentclass: "o m",
  PassOptionsToPackage: "m m",
  bibliographystyle: "m",
  graphicspath: "m",
  theoremstyle: "m",
  numberwithin: "m m",
  allowdisplaybreaks: "o",
  captionsetup: "o m",
  addcontentsline: "m m m",
  phantomsection: "",
  stepcounter: "m",
  refstepcounter: "m",
  // Counter display macros: values are untrackable statically; render nothing
  // rather than the counter NAME as text.
  arabic: "m",
  roman: "m",
  Roman: "m",
  alph: "m",
  Alph: "m",
  value: "m",
  fnsymbol: "m",
  // \rule[raise]{width}{height} — invisible strut in table cells; args like
  // {0pt}{2.2ex} otherwise leak as "0pt2.2ex" text.
  rule: "o m m",
};

const STRIP_BARE = new Set([
  "centering",
  "raggedright",
  "raggedleft",
  "noindent",
  "indent",
  "small",
  "footnotesize",
  "scriptsize",
  "tiny",
  "normalsize",
  "large",
  "Large",
  "LARGE",
  "huge",
  "Huge",
  "clearpage",
  "cleardoublepage",
  "newpage",
  "pagebreak",
  "nopagebreak",
  "samepage",
  "smallskip",
  "medskip",
  "bigskip",
  "onecolumn",
  "flushbottom",
  "raggedbottom",
  "sloppy",
  "fussy",
  "protect",
  "boldmath",
  "unboldmath",
  "ignorespaces",
  "newblock",
  "hfill",
  "vfill",
  "hss",
  "strut",
  "relax",
  "frontmatter",
  "mainmatter",
  // NB: \appendix is intentionally NOT stripped here — numbering.ts consumes
  // it to switch section numbering to letters (Appendix A, A.1, …).
  "tableofcontents",
  "listoffigures",
  "listoftables",
  "printbibliography",
  "IEEEpeerreviewmaketitle",
  "qed",
  "leavevmode",
  "begingroup",
  "endgroup",
  "bgroup",
  "egroup",
  "makeatletter",
  "makeatother",
]);

/**
 * TeX-primitive glue like `\looseness=-1` or `\vskip 5pt plus 1pt` leaves the
 * value as sibling tokens the parser splits (`=`, `-`, `1`; or `5pt`, `plus`,
 * `1pt`). A single-node peek misses these, so the value is consumed as a token
 * run instead.
 */
const GLUE_MACROS = new Set([
  "looseness",
  "parskip",
  "parindent",
  "baselineskip",
  "vskip",
  "hskip",
]);
const GLUE_TOKEN_RE =
  /^[=+\-.\d]|^(plus|minus|fil|fill|filll|true)$|^(pt|em|ex|in|cm|mm|bp|pc|sp|mu|dd|cc)$/i;

function isGlueToken(node: Ast.Node): boolean {
  return node.type === "string" && GLUE_TOKEN_RE.test(node.content);
}

/**
 * Number of nodes after `start` that form a glue value: value tokens plus the
 * whitespace between them, but never trailing whitespace (which would fuse the
 * following prose onto the previous word).
 */
function glueRunLength(nodes: Ast.Node[], start: number): number {
  let end = start;
  for (let j = start; j < nodes.length; j++) {
    const node = nodes[j];
    if (node.type === "whitespace") continue; // provisional until a value follows
    if (isGlueToken(node)) {
      end = j + 1;
      continue;
    }
    break;
  }
  return end - start;
}

/**
 * \addlinespace adds vertical space (not a line); strip it. The actual rules
 * (\toprule/\midrule/\bottomrule/\cmidrule/\specialrule/\hline) are left for
 * the table converter, which places borders only where they occur.
 */
const BOOKTABS_STRIP: Record<string, string> = {
  addlinespace: "o",
};

export function stripNoise(tree: Ast.Root): void {
  attachMacroArgs(tree, {
    ...Object.fromEntries(
      Object.entries(STRIP_WITH_SIGNATURE)
        .filter(([, sig]) => sig !== "")
        .map(([name, signature]) => [name, { signature }]),
    ),
    ...Object.fromEntries(
      Object.entries(BOOKTABS_STRIP).map(([name, signature]) => [
        name,
        { signature },
      ]),
    ),
  });

  walkNodeArrays(tree, (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!match.anyMacro(node)) continue;
      const name = node.content;

      if (name in STRIP_WITH_SIGNATURE || STRIP_BARE.has(name) || name in BOOKTABS_STRIP) {
        nodes.splice(i, 1);
      } else if (GLUE_MACROS.has(name)) {
        nodes.splice(i, 1 + glueRunLength(nodes, i + 1));
      }
    }
  });
}
