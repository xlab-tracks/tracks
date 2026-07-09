import type * as Ast from "@unified-latex/unified-latex-types";
import { getArgsContent } from "@unified-latex/unified-latex-util-arguments";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { match } from "@unified-latex/unified-latex-util-match";
import { visit } from "@unified-latex/unified-latex-util-visit";
import type { WarningCollector } from "../warnings";
import type { DocNumbering } from "./numbering";
import { plainText, rawText, texString, walkNodeArrays } from "./tex-utils";

export interface TheoremDef {
  envName: string;
  /** Display word, e.g. "Theorem", "Lemma". */
  title: string;
  /** Environments sharing a counter share this key. */
  counterKey: string;
}

type EnvReplacement = (
  node: Ast.Environment,
) => Ast.Macro | Ast.String | Ast.Environment;

/**
 * Read `\newtheorem{env}[sharedCounter]{Title}[within]` declarations, then
 * remove them from the tree. Numbering resets ("within" a section) are
 * approximated by a flat counter, with a warning.
 */
export function scanTheoremDefs(
  tree: Ast.Root,
  warnings: WarningCollector,
): TheoremDef[] {
  attachMacroArgs(tree, { newtheorem: { signature: "s m o m o" } });
  const defs: TheoremDef[] = [];

  visit(tree, (node) => {
    if (!match.macro(node, "newtheorem")) return;
    const args = getArgsContent(node);
    const envName = rawText(args[1] ?? []).trim();
    const sharedCounter = rawText(args[2] ?? []).trim();
    const title = plainText(args[3] ?? []);
    const within = rawText(args[4] ?? []).trim();
    if (!envName || !title) return;
    if (within) {
      warnings.add(
        "theorem-numbering",
        `per-${within} numbering of "${envName}" approximated by a flat counter`,
      );
    }
    defs.push({ envName, title, counterKey: sharedCounter || envName });
  });

  walkNodeArrays(tree, (nodes) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (match.macro(node, "newtheorem")) nodes.splice(i, 1);
    }
  });
  return defs;
}

export function buildTheoremReplacements(
  defs: TheoremDef[],
  numbering: DocNumbering,
): Record<string, EnvReplacement> {
  const replacements: Record<string, EnvReplacement> = {};

  for (const def of defs) {
    replacements[def.envName] = (env) => {
      const info = numbering.theorems.get(env);
      // Known envs get [Name] attached as an env arg; unknown ones carry it
      // as leading literal content — support both.
      const attached = env.args?.find((a) => a.openMark === "[")?.content;
      const { name, rest } = attached?.length
        ? { name: attached, rest: env.content }
        : peelBracketedName(env.content);
      const head: Ast.Node[] = [
        htmlLike({
          tag: "strong",
          content: [
            texString(
              info ? `${def.title} ${info.numberText}` : def.title,
            ),
          ],
        }),
      ];
      if (name.length > 0) {
        head.push(texString(" ("), ...name, texString(")"));
      }
      head.push(texString("."));
      return htmlLike({
        tag: "div",
        attributes: { className: "ax-theorem", id: info?.id },
        content: [
          htmlLike({ tag: "p", attributes: { className: "ax-theorem-head" }, content: head }),
          ...rest,
        ],
      });
    };
  }

  replacements.proof = (env) => {
    const attached = env.args?.find((a) => a.openMark === "[")?.content;
    const { name, rest } = attached?.length
      ? { name: attached, rest: env.content }
      : peelBracketedName(env.content);
    const head: Ast.Node[] =
      name.length > 0
        ? [htmlLike({ tag: "em", content: name }), texString(".")]
        : [htmlLike({ tag: "em", content: [texString("Proof.")] })];
    return htmlLike({
      tag: "div",
      attributes: { className: "ax-proof" },
      content: [
        htmlLike({ tag: "p", attributes: { className: "ax-proof-head" }, content: head }),
        ...rest,
        htmlLike({
          tag: "span",
          attributes: { className: "ax-qed" },
          content: [texString("∎")],
        }),
      ],
    });
  };

  return replacements;
}

/**
 * Theorem-family environments take an unparsed leading `[Name]` (unknown env
 * signatures leave it as literal content). Peel it off when present.
 */
function peelBracketedName(content: Ast.Node[]): {
  name: Ast.Node[];
  rest: Ast.Node[];
} {
  const nodes = [...content];
  let start = 0;
  while (start < nodes.length && nodes[start].type === "whitespace") start++;
  const first = nodes[start];
  if (!first || first.type !== "string" || !first.content.startsWith("[")) {
    return { name: [], rest: content };
  }

  const name: Ast.Node[] = [];
  let closed = false;
  let i = start;
  for (; i < nodes.length && !closed; i++) {
    const node = nodes[i];
    if (node.type === "string") {
      let text = node.content;
      if (i === start) text = text.slice(1);
      const closeAt = text.indexOf("]");
      if (closeAt !== -1) {
        closed = true;
        const before = text.slice(0, closeAt);
        const after = text.slice(closeAt + 1);
        if (before) name.push(texString(before));
        if (after) name.push(texString(after)); // rare; keep text
      } else if (text) {
        name.push(texString(text));
      }
    } else {
      name.push(node);
    }
    // Unclosed after a handful of nodes → not really an optional arg.
    if (!closed && i - start > 12) return { name: [], rest: content };
  }
  if (!closed) return { name: [], rest: content };
  return { name, rest: nodes.slice(i) };
}
