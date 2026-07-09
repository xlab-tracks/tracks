import type { Element, ElementContent, Root } from "hast";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import katex from "katex";
import { visit } from "unist-util-visit";
import type { KatexMacroTable } from "./transforms/macros";
import type { WarningCollector } from "./warnings";

/**
 * unified-latex-to-hast deliberately leaves math untouched: inline math
 * becomes `span.inline-math` and display math `div.display-math`, each with
 * the raw TeX as text content. This pass renders that TeX with KaTeX and
 * splices the output in. It MUST run after sanitization — KaTeX output is
 * locally generated (never author-controlled markup) and full of inline
 * styles a sanitizer would have to whitelist.
 */
export function renderMathInHast(
  tree: Root,
  table: KatexMacroTable,
  warnings: WarningCollector,
): void {
  const { macros, pairedDelims } = table;
  const starScrubs = pairedDelims.map(
    (name) => new RegExp(`\\\\${name}\\s*\\*`, "g"),
  );
  visit(tree, "element", (node: Element) => {
    const classes = classList(node);
    const display = classes.includes("display-math");
    if (!display && !classes.includes("inline-math")) return;

    let tex = textContent(node);
    // \abs*{x}: the starred paired-delimiter form isn't expressible as a
    // KaTeX macro — the * would be captured as the argument. Use the
    // unstarred form.
    for (let i = 0; i < starScrubs.length; i++) {
      tex = tex.replace(starScrubs[i], `\\${pairedDelims[i]}`);
    }
    let rendered: string;
    try {
      rendered = katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        // Persisting one macros object lets \gdef / \newcommand made inside
        // one formula remain visible in later ones, like real TeX.
        macros,
        strict: (_code: string, message: string) => {
          warnings.add("katex-strict", message);
          return "ignore";
        },
        trust: false,
        maxExpand: 1000,
      });
    } catch {
      warnings.add("katex-error", truncateTex(tex));
      node.children = [errorNode(tex)];
      return;
    }
    // ParseErrors render as .katex-error spans; undefined control sequences
    // inside otherwise-valid input surface only as errorColor spans.
    if (rendered.includes("katex-error") || rendered.includes("#cc0000")) {
      warnings.add("katex-error", truncateTex(tex));
    }
    const fragment = fromHtmlIsomorphic(rendered, { fragment: true });
    node.children = fragment.children as ElementContent[];
  });
}

function classList(node: Element): string[] {
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.map(String);
  if (typeof className === "string") return className.split(/\s+/);
  return [];
}

function textContent(node: Element): string {
  let out = "";
  for (const child of node.children) {
    if (child.type === "text") out += child.value;
    else if (child.type === "element") out += textContent(child);
  }
  return out;
}

function errorNode(tex: string): ElementContent {
  return {
    type: "element",
    tagName: "code",
    properties: { className: ["ax-math-error"] },
    children: [{ type: "text", value: tex }],
  };
}

function truncateTex(tex: string): string {
  const flat = tex.replace(/\s+/g, " ").trim();
  return flat.length > 80 ? `${flat.slice(0, 77)}...` : flat;
}
