import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

/**
 * unified-latex's tabular conversion (and a few other subs) express layout
 * as inline styles, which the sanitizer strips wholesale. Convert the ones
 * worth keeping into classes first.
 */
export function styleToClass(tree: Root): void {
  visit(tree, "element", (node: Element) => {
    const style = node.properties?.style;
    if (typeof style !== "string") return;
    delete node.properties.style;
    const align = /text-align\s*:\s*(left|center|right)/.exec(style)?.[1];
    if (align) addClass(node, `ax-align-${align}`);
    if (/border-left/.test(style)) addClass(node, "ax-border-l");
    if (/border-right/.test(style)) addClass(node, "ax-border-r");
  });
}

const ANCHOR_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "figure",
  "table",
  "blockquote",
  "pre",
]);
const ANCHOR_DIV_CLASSES = new Set([
  "display-math",
  "ax-theorem",
  "ax-proof",
  "ax-placeholder",
  "ax-degraded",
]);

/**
 * Stamp every renderable flow block with a deterministic document-order
 * anchor (data-anchor="b-0001"...). This is the contract future highlighting
 * builds on: for a pinned arXiv version and converter version, anchors are a
 * pure function of the source, so persisted highlights can re-attach.
 * Formulas are atomic — a display equation is one anchored block; inline
 * math is a single opaque .katex element inside its block.
 */
export function addAnchors(tree: Root): void {
  let n = 0;
  visit(tree, "element", (node: Element) => {
    const anchorable =
      ANCHOR_TAGS.has(node.tagName) ||
      (node.tagName === "div" &&
        classListOf(node).some((c) => ANCHOR_DIV_CLASSES.has(c)));
    if (!anchorable) return;
    n++;
    node.properties = {
      ...node.properties,
      dataAnchor: `b-${String(n).padStart(4, "0")}`,
    };
  });
}

function classListOf(node: Element): string[] {
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.map(String);
  if (typeof className === "string") return className.split(/\s+/);
  return [];
}

function addClass(node: Element, cls: string): void {
  const existing = classListOf(node);
  if (existing.includes(cls)) return;
  node.properties = { ...node.properties, className: [...existing, cls] };
}

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/;

/**
 * Convert resolved-color data attributes into inline styles. Runs AFTER
 * sanitization: the values are our own strictly-validated "#rrggbb" strings
 * (see transforms/colors.ts), never author-controlled text — the same trust
 * argument as splicing KaTeX output post-sanitize.
 */
export function applyResolvedColors(tree: Root): void {
  visit(tree, "element", (node: Element) => {
    const props = node.properties ?? {};
    const bg = props.dataAxBg;
    const fg = props.dataAxFg;
    const bc = props.dataAxBc;
    const styles: string[] = [];
    if (typeof bg === "string" && HEX_COLOR_RE.test(bg)) {
      styles.push(`background-color:${bg}`);
    }
    if (typeof fg === "string" && HEX_COLOR_RE.test(fg)) {
      styles.push(`color:${fg}`);
    }
    if (typeof bc === "string" && HEX_COLOR_RE.test(bc)) {
      styles.push(`border-color:${bc}`);
    }
    if (styles.length) props.style = styles.join(";");
    delete props.dataAxBg;
    delete props.dataAxFg;
    delete props.dataAxBc;
    node.properties = props;
  });
}
