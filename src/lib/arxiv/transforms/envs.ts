import type * as Ast from "@unified-latex/unified-latex-types";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { match } from "@unified-latex/unified-latex-util-match";
import { visit } from "@unified-latex/unified-latex-util-visit";
import type { TheoremDef } from "./theorems";
import { envName, rawText, texString } from "./tex-utils";

type EnvReplacement = (node: Ast.Environment) => Ast.Node;

/**
 * Standard theorem-family environments many document classes predefine, so
 * papers use them without \newtheorem. Registering defaults means they get
 * numbered theorem boxes (with optional names) instead of unknown-env divs.
 */
const STANDARD_THEOREM_ENVS: Record<string, string> = {
  theorem: "Theorem",
  lemma: "Lemma",
  corollary: "Corollary",
  proposition: "Proposition",
  definition: "Definition",
  remark: "Remark",
  example: "Example",
  claim: "Claim",
  assumption: "Assumption",
  conjecture: "Conjecture",
  observation: "Observation",
  fact: "Fact",
};

/**
 * Add default defs for standard theorem envs the paper uses but never
 * declares. User \newtheorem declarations always win.
 */
export function addDefaultTheoremDefs(
  tree: Ast.Root,
  defs: TheoremDef[],
): TheoremDef[] {
  const defined = new Set(defs.map((d) => d.envName));
  const used = new Set<string>();
  visit(tree, (node) => {
    if (node.type !== "environment" && node.type !== "mathenv") return;
    const name = envName(node);
    if (name in STANDARD_THEOREM_ENVS && !defined.has(name)) used.add(name);
  });
  return [
    ...defs,
    ...[...used].map((name) => ({
      envName: name,
      title: STANDARD_THEOREM_ENVS[name],
      counterKey: name,
    })),
  ];
}

/**
 * description lists → real <dl>/<dt>/<dd> instead of span soup.
 */
function descriptionReplacement(env: Ast.Environment): Ast.Node {
  const items: { term: Ast.Node[]; body: Ast.Node[] }[] = [];
  let current: { term: Ast.Node[]; body: Ast.Node[] } | null = null;
  for (const node of env.content) {
    if (match.anyMacro(node) && node.content === "item") {
      const term = node.args?.find((a) => a.openMark === "[")?.content ?? [];
      // The parser gobbles the item's text into a trailing unmarked arg.
      const trailing = [...(node.args ?? [])]
        .reverse()
        .find((a) => a.openMark === "" && a.content.length > 0);
      current = { term, body: [...(trailing?.content ?? [])] };
      items.push(current);
      continue;
    }
    current?.body.push(node);
  }
  if (items.length === 0) {
    return htmlLike({ tag: "dl", content: env.content });
  }
  return htmlLike({
    tag: "dl",
    content: items.flatMap((item) => [
      htmlLike({ tag: "dt", content: item.term }),
      htmlLike({ tag: "dd", content: item.body }),
    ]),
  });
}

/** Peel leading groups/brackets that are layout args (widths, placement). */
function peelLayoutArgs(content: Ast.Node[], max: number): Ast.Node[] {
  const rest = [...content];
  let peeled = 0;
  while (peeled < max && rest.length > 0) {
    const first = rest[0];
    if (first.type === "whitespace" || first.type === "parbreak") {
      rest.shift();
      continue;
    }
    if (first.type === "group") {
      rest.shift();
      peeled++;
      continue;
    }
    if (first.type === "string" && first.content.startsWith("[")) {
      // consume tokens through the closing "]"
      let i = 0;
      let closed = false;
      for (; i < rest.length && i < 12; i++) {
        const n = rest[i];
        if (n.type === "string" && n.content.includes("]")) {
          closed = true;
          break;
        }
      }
      if (!closed) break;
      rest.splice(0, i + 1);
      peeled++;
      continue;
    }
    break;
  }
  return rest;
}

/**
 * Environment replacements for common wrappers unified-latex doesn't know:
 * subfigure/wrapfigure (peel width/placement args; content flows), adjustbox
 * (drop its option arg), appendices (unwrapped; numbering.ts handles the
 * letter switch), spacing wrappers.
 */
export function buildMiscEnvReplacements(
  tree: Ast.Root,
): Record<string, EnvReplacement> {
  attachMacroArgs(tree, { item: { signature: "o" } });

  const subfigure: EnvReplacement = (env) =>
    htmlLike({
      tag: "div",
      attributes: { className: "ax-subfigure" },
      content: peelLayoutArgs(env.content, 2),
    });

  const wrapfigure: EnvReplacement = (env) =>
    htmlLike({
      tag: "figure",
      attributes: { className: "ax-figure" },
      content: peelLayoutArgs(env.content, 4),
    });

  const unwrap =
    (peel: number): EnvReplacement =>
    (env) =>
      htmlLike({ tag: "div", content: peelLayoutArgs(env.content, peel) });

  // minipage[pos]{width}: render as an inline-block column so side-by-side
  // transcript/figure layouts actually sit side by side.
  const WIDTH_BUCKETS = [15, 25, 33, 40, 50, 60, 66, 75, 90, 100];
  const minipage: EnvReplacement = (env) => {
    const content = [...env.content];
    let bucket: number | null = null;
    // Args may be attached (known env) or leading tokens.
    const widthText =
      rawText(env.args?.find((a) => a.openMark === "{")?.content ?? []) ||
      (() => {
        // peel [pos] then read {width} group
        while (
          content.length > 0 &&
          (content[0].type === "whitespace" || content[0].type === "parbreak")
        ) {
          content.shift();
        }
        if (content[0]?.type === "string" && content[0].content.startsWith("[")) {
          for (let i = 0; i < content.length && i < 8; i++) {
            const n = content[i];
            if (n.type === "string" && n.content.includes("]")) {
              content.splice(0, i + 1);
              break;
            }
          }
        }
        while (
          content.length > 0 &&
          (content[0].type === "whitespace" || content[0].type === "parbreak")
        ) {
          content.shift();
        }
        if (content[0]?.type === "group") {
          const g = content.shift() as Ast.Group;
          return rawText(g.content);
        }
        return "";
      })();
    const m = /([\d.]+)\s*\\(?:text|line|column)width/.exec(widthText);
    if (m) {
      const pct = Math.min(100, parseFloat(m[1]) * 100);
      if (Number.isFinite(pct) && pct > 0) {
        bucket = WIDTH_BUCKETS.reduce((best, b) =>
          Math.abs(b - pct) < Math.abs(best - pct) ? b : best,
        );
      }
    }
    return htmlLike({
      tag: "div",
      attributes: {
        className: ["ax-minipage", ...(bucket ? [`ax-w-${bucket}`] : [])],
      },
      content,
    });
  };

  // multicols{N}: honor the column count with CSS columns.
  const multicols: EnvReplacement = (env) => {
    const content = [...env.content];
    let cols = 2;
    // The {N} arg arrives as env args or as a leading group.
    const fromArgs = env.args?.find((a) => a.openMark === "{");
    if (fromArgs) {
      cols = parseInt(rawText(fromArgs.content).trim(), 10) || 2;
    } else {
      while (
        content.length > 0 &&
        (content[0].type === "whitespace" || content[0].type === "parbreak")
      ) {
        content.shift();
      }
      if (content[0]?.type === "group") {
        const n = parseInt(rawText(content[0].content).trim(), 10);
        if (Number.isFinite(n)) {
          cols = n;
          content.shift();
        }
      }
    }
    cols = Math.min(4, Math.max(2, cols));
    return htmlLike({
      tag: "div",
      attributes: { className: ["ax-multicols", `ax-cols-${cols}`] },
      content,
    });
  };

  return {
    description: descriptionReplacement,
    minipage,
    subfigure,
    "subfigure*": subfigure,
    subcaptionbox: subfigure,
    wrapfigure,
    "wrapfigure*": wrapfigure,
    SCfigure: wrapfigure,
    adjustbox: unwrap(1),
    spacing: unwrap(1),
    multicols,
    "multicols*": multicols,
    appendices: unwrap(0),
    sloppypar: unwrap(0),
    refsection: unwrap(0),
    small: unwrap(0),
    footnotesize: unwrap(0),
  };
}

/**
 * \item[Custom label] in itemize/enumerate: unified-latex drops the optional
 * label. Turn it into bold inline text at the start of the item.
 */
export function applyItemLabels(tree: Ast.Root): void {
  attachMacroArgs(tree, { item: { signature: "o" } });
  visit(tree, (node) => {
    if (node.type !== "environment") return;
    const name = envName(node);
    if (name !== "itemize" && name !== "enumerate") return;
    for (let i = node.content.length - 1; i >= 0; i--) {
      const child = node.content[i];
      if (!match.macro(child, "item")) continue;
      const optional = child.args?.find((a) => a.openMark === "[");
      if (!optional || optional.content.length === 0) continue;
      const label = optional.content;
      optional.content = [];
      node.content.splice(
        i + 1,
        0,
        htmlLike({ tag: "strong", content: [...label] }),
        texString(" "),
      );
    }
  });
}
