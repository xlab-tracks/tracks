import { defaultSchema } from "hast-util-sanitize";
import type { Schema } from "hast-util-sanitize";

/**
 * Sanitization schema for converted paper HTML. The source TeX is
 * third-party (arXiv authors), and the result is rendered with
 * dangerouslySetInnerHTML, so everything unknown is stripped.
 *
 * Two deliberate choices:
 * - No `style` attribute anywhere. KaTeX (which needs inline styles) runs
 *   AFTER this pass on text content only, so its output never faces the
 *   sanitizer; converter transforms express alignment etc. as classes.
 * - `clobberPrefix` is disabled because every id in the tree is minted by
 *   our own transforms with an `ax-` prefix — author-controlled text is
 *   slugified into suffixes, never used as a bare id.
 */
export const paperSanitizeSchema: Schema = {
  ...defaultSchema,
  clobberPrefix: "",
  clobber: [],
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "figure",
    "figcaption",
    "section",
    "span",
    "dl",
    "dt",
    "dd",
    "u",
    "cite",
    "small",
  ],
  attributes: {
    ...defaultSchema.attributes,
    // data-anchor/data-s/data-conv are deliberately NOT allowed through:
    // every converter stamps them post-sanitize (and data-conv at render
    // time), so an occurrence in author-controlled input is a forgery that
    // could shadow real block anchors.
    // data-author-id is a conversion-internal stash (the pre-sanitize strip
    // moves author ids into it — after deleting any forged instance — and
    // rewriteAuthorFragmentLinks consumes and deletes every one), so it
    // never appears in committed artifact HTML.
    "*": ["className", "dataAuthorId"],
    // Resolved colors: values are OUR "#rrggbb" strings (strictly validated
    // in transforms/colors.ts), converted to inline styles post-sanitize.
    tr: ["className", "dataAxBg"],
    a: ["href", "id"],
    img: ["src", "alt"],
    td: ["colSpan", "rowSpan", "dataAxBg"],
    th: ["colSpan", "rowSpan", "dataAxBg"],
    span: ["id", "dataAxFg"],
    h1: ["id"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    h5: ["id"],
    h6: ["id"],
    div: ["id", "dataAxBg", "dataAxBc", "dataAxFg"],
    figure: ["id"],
    li: ["id"],
    sup: ["id"],
    section: ["id"],
    table: ["id"],
  },
};
