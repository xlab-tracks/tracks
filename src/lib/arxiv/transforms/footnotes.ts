import type * as Ast from "@unified-latex/unified-latex-types";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import { htmlLike } from "@unified-latex/unified-latex-util-html-like";
import { match } from "@unified-latex/unified-latex-util-match";
import { replaceNode } from "@unified-latex/unified-latex-util-replace";
import { visit } from "@unified-latex/unified-latex-util-visit";
import type { WarningCollector } from "../warnings";
import { envName, lastArgContent, texString } from "./tex-utils";

/**
 * \footnote{...} → superscript markers linking to a generated end-of-paper
 * footnotes section with back-links. \footnotemark/\footnotetext pairs are
 * beyond v1 — stripped with a warning.
 */
export function processFootnotes(
  tree: Ast.Root,
  warnings: WarningCollector,
): void {
  attachMacroArgs(tree, { footnote: { signature: "o m" } });

  const collected: Ast.Node[][] = [];
  replaceNode(tree, (node) => {
    if (!match.anyMacro(node)) return;
    if (node.content === "footnotemark" || node.content === "footnotetext") {
      warnings.add("footnotes", `\\${node.content} not supported; removed`);
      return null;
    }
    if (node.content !== "footnote") return;
    const n = collected.length + 1;
    collected.push(lastArgContent(node));
    return htmlLike({
      tag: "sup",
      attributes: { id: `ax-fnref-${n}`, className: "ax-fnref" },
      content: [
        htmlLike({
          tag: "a",
          attributes: { href: `#ax-fn-${n}` },
          content: [texString(String(n))],
        }),
      ],
    });
  });

  if (collected.length === 0) return;
  // Conversion only covers content inside \begin{document}; append there.
  let target: Ast.Node[] = tree.content;
  visit(tree, (node) => {
    if (
      (node.type === "environment" || node.type === "mathenv") &&
      envName(node) === "document"
    ) {
      target = node.content;
    }
  });
  target.push(
    htmlLike({
      tag: "section",
      attributes: { className: "ax-footnotes" },
      content: [
        htmlLike({ tag: "h2", content: [texString("Footnotes")] }),
        htmlLike({
          tag: "ol",
          content: collected.map((content, i) =>
            htmlLike({
              tag: "li",
              attributes: { id: `ax-fn-${i + 1}` },
              content: [
                ...content,
                texString(" "),
                htmlLike({
                  tag: "a",
                  attributes: {
                    href: `#ax-fnref-${i + 1}`,
                    className: "ax-backlink",
                  },
                  content: [texString("↩")],
                }),
              ],
            }),
          ),
        }),
      ],
    }),
  );
}
