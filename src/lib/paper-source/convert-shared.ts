import type { Element, ElementContent, Root } from "hast";
import { visit } from "unist-util-visit";
import { IdMinter, slugify } from "@/lib/arxiv/transforms/tex-utils";
import type { PaperTocEntry } from "@/lib/arxiv/types";
import type { WarningCollector } from "@/lib/arxiv/warnings";

/**
 * Transforms shared by the HTML-source paper converters (Substack,
 * LessWrong). Each converter owns its source's markup vocabulary (widgets,
 * embeds, image containers, footnote correlation); what lives here is the
 * source-agnostic machinery that makes their output honor the arXiv
 * converter's annotation contract — reserved-namespace hygiene, heading
 * normalization + section-id minting, the footnotes landmark shape, the
 * generic toc extractor, and asset-path derivation.
 *
 * Everything here operates on author-controlled trees the same way the
 * arXiv converter does: ids/classes in the converters' namespaces are
 * dropped up front and re-minted, so downstream code (split-paper.ts's
 * id-offset slicing, the sanitize schema's disabled clobbering, the edit
 * UI's class vocabulary) can trust that a reserved-prefix id or class was
 * emitted by us.
 */

/** A failed image download — treated as transient, never negative-cached. */
export class ImageFetchError extends Error {
  constructor(url: string) {
    super(`could not download image: ${url}`);
    this.name = "ImageFetchError";
  }
}

/** Every converter-minted namespace, kept mutually exclusive with authors'. */
const RESERVED_CLASS_RE = /^(?:sb|lw|ax)-/;
/**
 * Exact converter-output classes with special downstream semantics:
 * block-index collapses them to "⟨math⟩", unwrapSpans exempts them, and the
 * KaTeX pass renders their text. (math-tex — LessWrong's SOURCE vocabulary —
 * deliberately stays: its semantics ARE "this is a formula".)
 */
const RESERVED_EXACT_CLASSES = new Set(["inline-math", "display-math"]);
/** Annotation attributes only the converters may stamp (post-sanitize). */
const RESERVED_PROPS = [
  "dataAnchor",
  "dataS",
  "dataConv",
  "dataAxBg",
  "dataAxFg",
  "dataAxBc",
];
/** Elements whose text content is never prose (sanitize only strips script). */
const DROPPED_TAGS = new Set(["style", "link", "meta", "title", "base"]);

/**
 * Drop every author id, every author class in the converters' reserved
 * namespaces, and every forged annotation attribute. Runs FIRST, before
 * anything is minted, so "reserved-prefix id/class/attribute" downstream
 * really does mean "minted by a converter" — an author id like
 * `sb-sec-introduction`, a class like `lw-footnotes`/`ax-added`, or a
 * forged `data-anchor` could otherwise hijack section offsets, shadow real
 * block anchors, fabricate toc landmarks, or spoof the edit UI. Also drops
 * <style>-like elements whose text would otherwise leak into prose when
 * sanitize unwraps the tag.
 */
export function stripAuthorIdsAndReservedClasses(
  tree: Root,
  opts: { stashIds?: boolean } = {},
): void {
  visit(tree, "element", (node: Element, index, parent) => {
    if (DROPPED_TAGS.has(node.tagName) && index !== undefined && parent) {
      parent.children.splice(index, 1);
      return index;
    }
    if (!node.properties) return;
    // A forged data-author-id in source HTML dies here unconditionally —
    // only the stash below (our own write, after the strip) survives, so
    // downstream "author id" really means "was an id before this pass".
    delete node.properties.dataAuthorId;
    if (node.properties.id !== undefined) {
      // Stash the author id (opt-in) so rewriteAuthorFragmentLinks can map
      // in-post fragment links onto the converter-minted heading ids after
      // sanitize rebuilds the tree; data-author-id never reaches output —
      // the rewrite pass deletes every instance.
      if (opts.stashIds && typeof node.properties.id === "string") {
        node.properties.dataAuthorId = node.properties.id;
      }
      delete node.properties.id;
    }
    for (const prop of RESERVED_PROPS) {
      if (node.properties[prop] !== undefined) delete node.properties[prop];
    }
    const classes = classListOf(node);
    const reserved = (c: string) =>
      RESERVED_CLASS_RE.test(c) || RESERVED_EXACT_CLASSES.has(c);
    if (classes.some(reserved)) {
      const kept = classes.filter((c) => !reserved(c));
      if (kept.length > 0) node.properties.className = kept;
      else delete node.properties.className;
    }
  });
}

/**
 * Repoint in-post links at the converter-minted heading ids. Authors link to
 * their own sections two ways — a bare fragment (`#Some_Heading`) or an
 * absolute URL of the post itself with a fragment — and both die when
 * stripAuthorIdsAndReservedClasses removes the author ids. With `stashIds`
 * on, the old id rides through sanitize as `data-author-id`; after
 * normalizeHeadings mints the real ids this pass maps old → new, rewrites
 * matching hrefs to local fragments, warns (`anchor-dropped`) for targets
 * that no longer have an id (non-heading anchors), and strips every stash.
 */
export function rewriteAuthorFragmentLinks(
  tree: Root,
  warnings: { add(code: string, detail: string): void },
  isSelfUrl: (url: string) => boolean,
  opts: {
    /**
     * Some platforms mint heading anchors CLIENT-side (LessWrong's ToC ids
     * never exist in the fetched html), so author links can target ids no
     * stash ever saw. Given the platform's text→anchor rule, map each
     * id-bearing element's text through it as a fallback resolution.
     */
    legacyHeadingSlug?: (headingText: string) => string;
    /**
     * Mint an id (n is 1-based) for a stashed non-heading target that an
     * in-post link actually references — without it those links degrade to
     * an `anchor-dropped` warning.
     */
    mintAnchorId?: (n: number) => string;
  } = {},
): void {
  const newIdByAuthorId = new Map<string, string>();
  const newIdBySlug = new Map<string, string>();
  const stashedNodes = new Map<string, Element>();
  visit(tree, "element", (node: Element) => {
    const newId = node.properties?.id;
    const hasNewId = typeof newId === "string" && newId !== "";
    const authorId = node.properties?.dataAuthorId;
    if (typeof authorId === "string" && authorId !== "") {
      if (!stashedNodes.has(authorId)) stashedNodes.set(authorId, node);
      if (hasNewId) newIdByAuthorId.set(authorId, newId as string);
    }
    if (hasNewId && opts.legacyHeadingSlug) {
      const slug = opts.legacyHeadingSlug(textOf(node).trim());
      if (slug && !newIdBySlug.has(slug)) newIdBySlug.set(slug, newId as string);
    }
  });
  let minted = 0;
  const resolveByMinting = (fragment: string): string | undefined => {
    if (!opts.mintAnchorId) return undefined;
    const target = stashedNodes.get(fragment);
    if (!target) return undefined;
    const id = opts.mintAnchorId(++minted);
    target.properties = { ...target.properties, id };
    newIdByAuthorId.set(fragment, id);
    return id;
  };

  visit(tree, "element", (node: Element) => {
    if (node.properties?.dataAuthorId !== undefined) {
      delete node.properties.dataAuthorId;
    }
    if (node.tagName !== "a") return;
    const href = stringProp(node, "href");
    if (!href) return;
    let fragment: string | null = null;
    if (href.startsWith("#")) {
      fragment = href.slice(1);
    } else {
      const hash = href.indexOf("#");
      if (hash !== -1 && isSelfUrl(href.slice(0, hash))) {
        fragment = href.slice(hash + 1);
      }
    }
    if (!fragment) return;
    const decoded = safeDecode(fragment);
    const newId =
      newIdByAuthorId.get(fragment) ??
      newIdByAuthorId.get(decoded) ??
      newIdBySlug.get(fragment) ??
      newIdBySlug.get(decoded) ??
      resolveByMinting(fragment) ??
      resolveByMinting(decoded);
    if (newId) {
      node.properties!.href = `#${newId}`;
    } else if (stashedNodes.has(fragment) || stashedNodes.has(decoded)) {
      // The target existed but isn't a heading anymore — no id to point at.
      warnings.add("anchor-dropped", `#${fragment}`);
    }
  });
}

function safeDecode(fragment: string): string {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

/**
 * Unwrap every <span>. Both sources wrap text runs in spans (Substack's
 * pre-2020 editor wraps everything; LessWrong's CkEditor output is
 * span-heavy; style-only spans are common), and the sentence segmenter
 * treats inline elements as opaque units — a paragraph whose text sits
 * inside one span would collapse to a single unaddressable "sentence".
 * Runs post-sanitize so style-carrying spans (style is stripped) unwrap
 * too; the converters' own data-s and math spans don't exist yet.
 */
export function unwrapSpans(tree: Root): void {
  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent || node.tagName !== "span") return;
    // Math placeholders are meaningful spans — the arXiv-convention
    // .inline-math wrapper is what the KaTeX pass and block-index's
    // "⟨math⟩" collapse key on.
    if (classListOf(node).includes("inline-math")) return;
    parent.children.splice(index, 1, ...node.children);
    // Revisit the spliced-in children (they may be spans themselves).
    return index;
  });
}

/**
 * Drop paragraphs with no content — editors keep authors' blank lines as
 * empty <p></p> or <p><br></p>, and sanitize can empty a paragraph whose
 * only child it stripped. They'd otherwise consume anchors and clutter the
 * --blocks listing with untargetable entries.
 */
export function dropEmptyParagraphs(tree: Root): void {
  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent || node.tagName !== "p") return;
    const empty = node.children.every(
      (child) =>
        (child.type === "text" && child.value.trim() === "") ||
        (child.type === "element" && child.tagName === "br"),
    );
    if (!empty) return;
    parent.children.splice(index, 1);
    return index;
  });
}

const HEADING_RE = /^h([1-6])$/;

/**
 * Blog authors use h1–h6 freely (body h1s are common on both sources). Map
 * the ranks that actually occur onto the h2–h4 ladder by prominence — the
 * shallowest rank in the post becomes h2, the next h3, everything deeper
 * h4 — then mint `{prefix}-sec-…` ids on the top-level headings so they
 * become toc entries. Runs post-sanitize so a heading hoisted out of a
 * stripped wrapper is top-level by now (and gets its id). The converter's
 * own rebuilt footnotes section (whose synthetic "Footnotes" h2 must
 * neither skew the ladder nor be retagged) is skipped whether it was
 * appended before or after this pass.
 */
export function normalizeHeadings(tree: Root, prefix: string): void {
  const footnotesClass = `${prefix}-footnotes`;
  const inFootnotes = (ancestors: Element[]) =>
    ancestors.some(
      (el) => el.tagName === "section" && classListOf(el).includes(footnotesClass),
    );

  const ranks = new Set<number>();
  visitWithAncestors(tree, (node, ancestors) => {
    const m = HEADING_RE.exec(node.tagName);
    if (m && !inFootnotes(ancestors)) ranks.add(Number(m[1]));
  });
  if (ranks.size === 0) return;
  const ladder = new Map(
    [...ranks].sort((a, b) => a - b).map((rank, i) => [rank, Math.min(2 + i, 4)]),
  );
  visitWithAncestors(tree, (node, ancestors) => {
    const m = HEADING_RE.exec(node.tagName);
    if (m && !inFootnotes(ancestors)) {
      node.tagName = `h${ladder.get(Number(m[1]))}`;
    }
  });

  const ids = new IdMinter();
  for (const node of tree.children) {
    if (node.type !== "element" || !HEADING_RE.test(node.tagName)) continue;
    const title = collapse(textOf(node));
    node.properties = {
      ...node.properties,
      id: ids.mint(`${prefix}-sec-${slugify(title)}`),
    };
  }
}

function visitWithAncestors(
  tree: Root,
  visitor: (node: Element, ancestors: Element[]) => void,
): void {
  const walk = (children: ElementContent[], ancestors: Element[]) => {
    for (const child of children) {
      if (child.type !== "element") continue;
      visitor(child, ancestors);
      walk(child.children, [...ancestors, child]);
    }
  };
  walk(tree.children as ElementContent[], []);
}

export interface FootnoteNote {
  /** Display number, e.g. "12". */
  number: string;
  content: ElementContent[];
}

/** The inline marker: `<sup class="{prefix}-fnref"><a id href>N</a></sup>`. */
export function buildFootnoteMarker(
  number: string,
  prefix: string,
  options?: { withId?: boolean },
): Element {
  return {
    type: "element",
    tagName: "sup",
    properties: { className: [`${prefix}-fnref`] },
    children: [
      {
        type: "element",
        tagName: "a",
        properties: {
          ...(options?.withId === false ? {} : { id: `${prefix}-fnref-${number}` }),
          href: `#${prefix}-fn-${number}`,
        },
        children: [{ type: "text", value: number }],
      },
    ],
  };
}

/**
 * The rebuilt footnotes landmark:
 * `<section class="{prefix}-footnotes" id="{prefix}-footnotes">` with an
 * ordered list — the same shape the arXiv converter gives \footnote, so the
 * section is a toc landmark, every footnote body is anchor/sentence-
 * addressable, and the sidenote layer can find notes by id. Nodes minted
 * here are converter-trusted; the content children must come from the
 * already-sanitized tree.
 */
export function buildFootnotesSection(
  notes: FootnoteNote[],
  prefix: string,
): Element {
  return {
    type: "element",
    tagName: "section",
    properties: { className: [`${prefix}-footnotes`], id: `${prefix}-footnotes` },
    children: [
      {
        type: "element",
        tagName: "h2",
        properties: {},
        children: [{ type: "text", value: "Footnotes" }],
      },
      {
        type: "element",
        tagName: "ol",
        properties: {},
        children: notes.map((note): Element => {
          const backlink: Element = {
            type: "element",
            tagName: "a",
            properties: {
              href: `#${prefix}-fnref-${note.number}`,
              className: [`${prefix}-backlink`],
            },
            children: [{ type: "text", value: "↩" }],
          };
          // Single-paragraph notes unwrap so the li itself is the prose
          // block (the arXiv footnote shape — one sentence-addressable
          // unit); multi-block notes keep their blocks and the backlink
          // rides in the last paragraph. Whitespace-only text nodes (real
          // source markup is "<p>…</p>\n") don't count as content.
          const content = note.content.filter(
            (child) => !(child.type === "text" && child.value.trim() === ""),
          );
          const single =
            content.length === 1 &&
            content[0].type === "element" &&
            content[0].tagName === "p";
          let children: ElementContent[];
          if (single) {
            children = [
              ...(content[0] as Element).children,
              { type: "text", value: " " },
              backlink,
            ];
          } else {
            const last = content[content.length - 1];
            if (last?.type === "element" && last.tagName === "p") {
              last.children.push({ type: "text", value: " " }, backlink);
              children = content;
            } else {
              children = [...content, { type: "text", value: " " }, backlink];
            }
          }
          return {
            type: "element",
            tagName: "li",
            properties: { id: `${prefix}-fn-${note.number}` },
            children,
          };
        }),
      },
    ],
  };
}

/**
 * Section-tree extraction for full-page posts — the shared mirror of
 * src/lib/arxiv/toc.ts. Walks ONLY the top-level children of the root: the
 * converters emit section headings as top-level siblings (the rebuilt
 * footnotes section is the one landmark wrapper). Keeping toc entries
 * top-level is load-bearing — split-paper.ts slices the serialized HTML at
 * these elements' start offsets, which is only safe when they never sit
 * inside another element. Run after addAnchors.
 */
export function extractSourceToc(tree: Root, prefix: string): PaperTocEntry[] {
  const toc: PaperTocEntry[] = [];
  const sectionIdPrefix = `${prefix}-sec-`;
  const footnotesClass = `${prefix}-footnotes`;
  for (const node of tree.children) {
    if (node.type !== "element") continue;

    if (
      node.tagName === "section" &&
      classListOf(node).includes(footnotesClass)
    ) {
      // The stamped id is required — a fabricated entry with no real id
      // would resolve section offsets to the wrong element (author
      // reserved-prefix classes are stripped up front, this is
      // belt-and-braces).
      const stamped = node.properties?.id;
      if (typeof stamped !== "string") continue;
      toc.push({
        kind: "footnotes",
        id: stamped,
        title: "Footnotes",
        number: "",
        level: 2,
        anchor: firstAnchorOf(node),
      });
      continue;
    }

    if (!/^h[2-4]$/.test(node.tagName)) continue;
    const id = node.properties?.id;
    if (typeof id !== "string" || !id.startsWith(sectionIdPrefix)) continue;
    toc.push({
      kind: "section",
      id,
      title: collapse(textOf(node)),
      // Blog posts have no section numbering.
      number: "",
      level: Number(node.tagName[1]),
      anchor: anchorOf(node),
    });
  }
  return toc;
}

function anchorOf(node: Element): string | undefined {
  const anchor = node.properties?.dataAnchor;
  return typeof anchor === "string" ? anchor : undefined;
}

/** First anchored descendant (the footnotes section carries no anchor itself). */
function firstAnchorOf(node: Element): string | undefined {
  const own = anchorOf(node);
  if (own) return own;
  for (const child of node.children) {
    if (child.type !== "element") continue;
    const found = firstAnchorOf(child);
    if (found) return found;
  }
  return undefined;
}

/** Deterministic committed path: document-order counter + sanitized basename. */
export function assetPathFor(url: string, index: number): string {
  let basename = "image";
  try {
    const segments = new URL(url).pathname.split("/");
    const last = decodeURIComponent(segments[segments.length - 1] ?? "");
    const safe = last.replace(/[^a-zA-Z0-9._-]+/g, "").slice(0, 80);
    if (safe) basename = safe;
  } catch {
    // keep the fallback basename
  }
  return `images/${String(index + 1).padStart(3, "0")}-${basename}`;
}

/** Captions keep inline content only — a nested img would ship a hotlink. */
export function cleanCaption(
  caption: ElementContent[],
  warnings: WarningCollector,
): ElementContent[] {
  const IMAGEY = new Set(["img", "picture", "source"]);
  const clean = (children: ElementContent[]): ElementContent[] =>
    children.flatMap((child): ElementContent[] => {
      if (child.type !== "element") return [child];
      if (IMAGEY.has(child.tagName)) {
        warnings.add("image-dropped", "image nested in a figure caption");
        return [];
      }
      const element: Element = { ...child, children: clean(child.children) };
      return [element];
    });
  return clean(caption);
}

/**
 * Magic-byte sniff: png/jpeg/gif/webp/avif only. Downloaded image bytes are
 * committed verbatim under public/, so SVG (which can script when navigated
 * to directly) and anything unrecognized is rejected.
 */
export function looksLikeRasterImage(buf: Uint8Array): boolean {
  const ascii = (start: number, text: string) =>
    [...text].every((ch, i) => buf[start + i] === ch.charCodeAt(0));
  if (buf.length < 16) return false;
  if (buf[0] === 0x89 && ascii(1, "PNG")) return true;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (ascii(0, "GIF8")) return true;
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return true;
  if (ascii(4, "ftypavif") || ascii(4, "ftypheic")) return true;
  return false;
}

// --- Small helpers shared by the source converters --------------------------

export function hasClass(node: Element, cls: string): boolean {
  return classListOf(node).includes(cls);
}

export function classListOf(node: Element): string[] {
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.map(String);
  if (typeof className === "string") return className.split(/\s+/);
  return [];
}

export function stringProp(
  node: Element | null,
  name: string,
): string | undefined {
  const value = node?.properties?.[name];
  return typeof value === "string" ? value : undefined;
}

export function findFirst(
  node: Element,
  match: (el: Element) => boolean,
): Element | null {
  if (match(node)) return node;
  for (const child of node.children) {
    if (child.type !== "element") continue;
    const found = findFirst(child, match);
    if (found) return found;
  }
  return null;
}

export function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

export function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
