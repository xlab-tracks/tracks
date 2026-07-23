import type { Element, ElementContent, Root } from "hast";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { sanitize } from "hast-util-sanitize";
import { toHtml } from "hast-util-to-html";
import { visit, SKIP } from "unist-util-visit";
import { addAnchors } from "@/lib/arxiv/hast-passes";
import { renderMathInHast } from "@/lib/arxiv/katex";
import { paperSanitizeSchema } from "@/lib/arxiv/sanitize-schema";
import { wrapSentences } from "@/lib/arxiv/sentences";
import type { ConversionWarning, PaperTocEntry } from "@/lib/arxiv/types";
import { WarningCollector } from "@/lib/arxiv/warnings";
import {
  assetPathFor,
  buildFootnoteMarker,
  buildFootnotesSection,
  classListOf,
  cleanCaption,
  dropEmptyParagraphs,
  extractSourceToc,
  findFirst,
  hasClass,
  ImageFetchError,
  normalizeHeadings,
  stringProp,
  stripAuthorIdsAndReservedClasses,
  textOf,
  rewriteAuthorFragmentLinks,
  unwrapSpans,
  type FootnoteNote,
} from "@/lib/paper-source/convert-shared";
import { buildAssetUrl, type LessWrongRef } from "./id";

export { ImageFetchError };

/**
 * LessWrong/Alignment Forum post html → annotated artifact HTML, honoring
 * the arXiv converter's structural contract (see convert-shared.ts) so the
 * whole downstream stack works unchanged. LessWrong-specific work:
 *
 *   - Footnotes, BOTH formats: the modern CkEditor markup
 *     (span.footnote-reference + li.footnote-item — what LessWrong renders
 *     as margin sidenotes) and the legacy markdown markup (sup.footnote-ref
 *     + section.footnotes). Both rebuild into the shared `lw-footnotes`
 *     landmark with `lw-fnref-N`/`lw-fn-N` ids — which is exactly what the
 *     reader's sidenote layer keys on, so LessWrong sidenotes render as
 *     sidenotes here too. Marker↔note correlation uses fragment hrefs
 *     (#fn{key} ↔ #fnref{key}), which survive both the up-front author-id
 *     strip and sanitization.
 *   - Math: LessWrong serves prerendered MathJax CHTML (inline styles the
 *     sanitizer rightly strips) with the original TeX in the mjx-math
 *     aria-label. The TeX is extracted into arXiv-convention
 *     .inline-math/.display-math placeholders pre-sanitize and re-rendered
 *     with KaTeX post-sanitize — the same trusted-local-output ordering as
 *     the arXiv converter.
 *   - Spoiler blocks become native <details> (minted post-sanitize).
 *   - Images (cloudinary mirrors) download to committed static assets;
 *     iframe-widget embeds carry only an internal id and degrade with a
 *     warning; oembed wrappers degrade to link cards.
 */

export interface LessWrongConversionResult {
  html: string;
  toc: PaperTocEntry[];
  warnings: ConversionWarning[];
  /** Relative asset path → image bytes, for everything the HTML references. */
  assets: Map<string, Uint8Array>;
}

export interface ConvertPostOptions {
  ref: LessWrongRef;
  /**
   * Fetch original image bytes at conversion time; `assetPath` is the
   * deterministic committed path (usable as a cache key). Return null for a
   * failed download — the converter throws ImageFetchError so the build
   * aborts without committing or negative-caching.
   */
  fetchImage: (url: string, assetPath: string) => Promise<Uint8Array | null>;
}

export async function convertPostHtml(
  bodyHtml: string,
  opts: ConvertPostOptions,
): Promise<LessWrongConversionResult> {
  const warnings = new WarningCollector();
  const tree = fromHtmlIsomorphic(bodyHtml, { fragment: true }) as Root;

  // Author-controlled tree: neutralize reserved namespaces, then run the
  // transforms that need LessWrong's own attribute vocabulary (aria-labels,
  // data-oembed-url) before sanitize strips it. Author ids are stashed
  // (data-author-id) so in-post fragment links can be repointed at the
  // minted heading ids after normalizeHeadings.
  stripAuthorIdsAndReservedClasses(tree, { stashIds: true });
  const images = collectImages(tree, warnings);
  const assets = await downloadImages(images, opts);
  rewriteImages(tree, images, opts.ref, warnings);
  transformMath(tree, warnings);
  transformEmbeds(tree, warnings);

  const clean = sanitize(tree, paperSanitizeSchema) as Root;

  // Settled tree: shape-dependent passes and id minting. Footnotes run
  // before unwrapSpans (the modern marker is itself a span wrapper);
  // normalizeHeadings skips the rebuilt footnotes section.
  transformFootnotes(clean, warnings);
  transformSpoilers(clean);
  unwrapSpans(clean);
  dropEmptyParagraphs(clean);
  normalizeHeadings(clean, "lw");
  // After heading ids are minted: repoint the author's in-post links (bare
  // fragments and self-URL fragments — the same post on any mirror host)
  // and drop the id stash. LessWrong mints its ToC anchors client-side
  // (every non-alphanumeric character of the heading text becomes "_"), so
  // that rule doubles as a fallback for links no stashed id can explain.
  rewriteAuthorFragmentLinks(
    clean,
    warnings,
    (url) => url.includes(`/posts/${opts.ref.postId}`),
    {
      legacyHeadingSlug: (text) => text.replace(/[^A-Za-z0-9]/g, "_"),
      mintAnchorId: (n) => `lw-anchor-${n}`,
    },
  );

  addAnchors(clean);
  wrapSentences(clean);
  const toc = extractSourceToc(clean, "lw");
  // Fresh table per conversion: KaTeX persists \gdef definitions into the
  // macros object, and shared state would make output depend on build order.
  renderMathInHast(clean, { macros: {}, pairedDelims: [] }, warnings);
  degradeKatexErrors(clean);
  const html = toHtml(clean);

  // Ship only bytes the final HTML references.
  for (const path of [...assets.keys()]) {
    if (!html.includes(buildAssetUrl(opts.ref, path))) assets.delete(path);
  }

  return { html, toc, warnings: warnings.list(), assets };
}

// --- Images ---------------------------------------------------------------

interface ImageRef {
  node: Element;
  kind: "figure" | "img";
  /** https source URL, or null when non-https (dropped, never hotlinked). */
  url: string | null;
  rawSrc: string | undefined;
  assetPath: string | null;
  alt: string;
  caption: ElementContent[] | null;
}

function collectImages(tree: Root, warnings: WarningCollector): ImageRef[] {
  const refs: ImageRef[] = [];
  let counted = 0;
  const push = (
    node: Element,
    kind: ImageRef["kind"],
    rawSrc: string | undefined,
    alt: string,
    caption: ElementContent[] | null,
  ) => {
    const url = rawSrc && /^https:\/\//i.test(rawSrc) ? rawSrc : null;
    refs.push({
      node,
      kind,
      url,
      rawSrc,
      assetPath: url ? assetPathFor(url, counted++) : null,
      alt,
      caption,
    });
  };

  visit(tree, "element", (node: Element) => {
    if (node.tagName === "figure") {
      const imgs = collectAll(node, (el) => el.tagName === "img");
      const img = imgs[0];
      if (!img) return; // oembed/media figures are the embed pass's job
      for (const extra of imgs.slice(1)) {
        warnings.add(
          "image-dropped",
          `additional image in a figure: ${stringProp(extra, "src") ?? "unknown"}`,
        );
      }
      const caption = findFirst(node, (el) => el.tagName === "figcaption");
      push(
        node,
        "figure",
        stringProp(img, "src"),
        stringProp(img, "alt") ?? "",
        caption ? caption.children : null,
      );
      return SKIP;
    }
    if (node.tagName === "img") {
      push(node, "img", stringProp(node, "src"), stringProp(node, "alt") ?? "", null);
    }
  });
  return refs;
}

async function downloadImages(
  images: ImageRef[],
  opts: ConvertPostOptions,
): Promise<Map<string, Uint8Array>> {
  const assets = new Map<string, Uint8Array>();
  for (const image of images) {
    if (!image.url || !image.assetPath) continue;
    const bytes = await opts.fetchImage(image.url, image.assetPath);
    if (!bytes) throw new ImageFetchError(image.url);
    assets.set(image.assetPath, bytes);
  }
  return assets;
}

function rewriteImages(
  tree: Root,
  images: ImageRef[],
  ref: LessWrongRef,
  warnings: WarningCollector,
): void {
  const byNode = new Map(images.map((image) => [image.node, image]));
  visit(tree, "element", (node: Element, index, parent) => {
    const image = byNode.get(node);
    if (!image || index === undefined || !parent) return;
    if (!image.url || !image.assetPath) {
      parent.children.splice(index, 1);
      warnings.add("image-dropped", image.rawSrc ?? "unknown source");
      return index;
    }
    const img: Element = {
      type: "element",
      tagName: "img",
      properties: { src: buildAssetUrl(ref, image.assetPath), alt: image.alt },
      children: [],
    };
    if (image.kind === "img") {
      // Bare <img> may sit in phrasing content — swap in place, never wrap
      // in a <figure> that would re-parent on the next parse.
      parent.children[index] = img;
      return SKIP;
    }
    const figure: Element = {
      type: "element",
      tagName: "figure",
      properties: {},
      children: image.caption
        ? [
            img,
            {
              type: "element",
              tagName: "figcaption",
              properties: {},
              children: cleanCaption(image.caption, warnings),
            },
          ]
        : [img],
    };
    parent.children[index] = figure;
    return SKIP;
  });
}

// --- Math -------------------------------------------------------------------

/**
 * Replace `span.math-tex` (prerendered MathJax CHTML) with arXiv-convention
 * placeholders carrying the raw TeX: `<span class="inline-math">` /
 * `<div class="display-math">`. The TeX comes from the mjx-math aria-label
 * (MathJax v3 CHTML), a math/tex script (v2), or — for posts serving raw
 * delimiters — the text content. renderMathInHast turns the placeholders
 * into KaTeX post-sanitize; block-index collapses them to "⟨math⟩".
 */
const DISPLAY_ONLY_ENV_RE =
  /\\begin\{(?:align|alignat|flalign|gather|eqnarray|multline)\*?\}/;

/**
 * A formula KaTeX still couldn't parse (the katex-error span, red inline
 * text) degrades to a plain <code> of the raw TeX — the warning collector
 * already recorded the katex-error, so the reader shows legible source
 * instead of an error styled as content.
 */
function degradeKatexErrors(tree: Root): void {
  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent) return;
    if (!hasClass(node, "katex-error")) return;
    parent.children[index] = {
      type: "element",
      tagName: "code",
      properties: {},
      children: [{ type: "text", value: textOf(node) }],
    };
    return SKIP;
  });
}

function transformMath(tree: Root, warnings: WarningCollector): void {
  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent) return;
    if (!hasClass(node, "math-tex")) return;

    const extracted = extractTex(node);
    if (!extracted) {
      parent.children.splice(index, 1);
      warnings.add("math-dropped", textOf(node).slice(0, 40) || "empty formula");
      return index;
    }
    // Environments KaTeX only accepts in display mode: authors sometimes
    // inline an {align} block (MathJax tolerates it, KaTeX parse-errors), so
    // promote it rather than shipping a red error span.
    const display =
      extracted.display || DISPLAY_ONLY_ENV_RE.test(extracted.tex);
    parent.children[index] = {
      type: "element",
      tagName: display ? "div" : "span",
      properties: {
        className: [display ? "display-math" : "inline-math"],
      },
      children: [{ type: "text", value: extracted.tex }],
    };
    return SKIP;
  });
}

function extractTex(node: Element): { tex: string; display: boolean } | null {
  const display =
    findFirst(node, (el) =>
      classListOf(el).some((c) => c === "MJXc-display" || c === "mjpage__block"),
    ) !== null;

  // MathJax v3 CHTML: <span class="mjx-math" aria-label="{tex}">.
  const mjxMath = findFirst(node, (el) => hasClass(el, "mjx-math"));
  const ariaLabel = mjxMath && stringProp(mjxMath, "ariaLabel");
  if (ariaLabel && ariaLabel.trim()) return { tex: ariaLabel.trim(), display };

  // MathJax v2: <script type="math/tex[; mode=display]">{tex}</script>.
  const script = findFirst(
    node,
    (el) =>
      el.tagName === "script" &&
      (stringProp(el, "type")?.startsWith("math/tex") ?? false),
  );
  if (script) {
    const tex = textOf(script).trim();
    if (tex) {
      return {
        tex,
        display:
          display || (stringProp(script, "type")?.includes("display") ?? false),
      };
    }
  }

  // Raw delimiters: \( … \) or \[ … \].
  const text = textOf(node).trim();
  const m = /^\\[([]([\s\S]*)\\[)\]]$/.exec(text);
  if (m && m[1].trim()) {
    return { tex: m[1].trim(), display: display || text.startsWith("\\[") };
  }
  return null;
}

// --- Footnotes ----------------------------------------------------------------

/**
 * Rebuild footnotes from BOTH LessWrong formats into the shared landmark.
 * Correlation is href-based (author ids are long gone): a marker links to
 * `#fn{key}` and its note's back-link to `#fnref{key}` — in the legacy
 * markdown format the key is "-{docKey}-{n}", in the modern CkEditor format
 * a short random id. Only markers with a matching note are rewritten, so a
 * stray author link shaped like `#fn…` in a <sup> can't fabricate one.
 */
function transformFootnotes(tree: Root, warnings: WarningCollector): void {
  // Pass 1: find the note list items (both formats) and their keys. Content
  // is NOT extracted yet — a note's body may itself reference another
  // footnote, and that nested marker must be rewritten (pass 2, in-tree)
  // before the content is copied out.
  const items: { node: Element; key: string }[] = [];
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "li") return;
    const classed = hasClass(node, "footnote-item");
    const back = findFirst(
      node,
      (el) =>
        el.tagName === "a" &&
        (hasClass(el, "footnote-backref") ||
          (stringProp(el, "href")?.startsWith("#fnref") ?? false)),
    );
    const key = back ? stringProp(back, "href")?.slice("#fnref".length) : undefined;
    if (!key) {
      if (classed) {
        // No back-link means no marker can reference it — the note is
        // dropped with the containers below. Surface the content loss.
        // (A classless li without a back-link is just an ordinary list
        // item — not ours to touch.)
        warnings.add(
          "footnote-dropped",
          textOf(node).slice(0, 60) || "empty note",
        );
      }
      return;
    }
    // Bare-list format (div.footnotes > ol > li#fnN, ids long stripped):
    // the #fnref back-link alone identifies a note — ordinary prose never
    // links to #fnref anchors. Deliberately NOT skipping the subtree:
    // malformed author HTML (an unclosed <ul> inside a note) makes the
    // parser nest later notes inside an earlier one, and they must still be
    // discovered as their own items.
    items.push({ node, key });
  });
  const keys = new Set(items.map((item) => item.key));

  // Un-nest items swallowed by a malformed sibling (see above) so each
  // note's content is its own — otherwise dropping an orphaned outer note
  // would silently take the nested real notes with it.
  const itemNodes = new Set(items.map((item) => item.node));
  for (const item of items) {
    detachNestedItems(item.node, itemNodes);
  }

  // Nothing recognized: leave the source markup alone rather than letting
  // the container purge below silently delete note bodies we failed to
  // parse (the failure mode that dropped a post's whole Notes list).
  if (items.length === 0) {
    let sawContainer = false;
    visit(tree, "element", (node: Element) => {
      if (
        classListOf(node).includes("footnotes") ||
        classListOf(node).includes("footnote-section")
      ) {
        sawContainer = true;
      }
    });
    if (sawContainer) {
      warnings.add("footnote-format-unrecognized", "source markup kept as-is");
    }
    return;
  }

  // Pass 2: rewrite markers whose key has a note. Display numbers follow the
  // marker's own text when it's unclaimed; otherwise (digit-less markers,
  // or duplicate numbers across keys — e.g. legacy and modern formats mixed
  // in one post, each with its own "[1]") the next free integer is used, so
  // minted lw-fn-N ids never collide.
  const numbers = new Map<string, string>();
  const usedNumbers = new Set<string>();
  const nextFree = () => {
    for (let n = 1; ; n++) {
      if (!usedNumbers.has(String(n))) return String(n);
    }
  };
  const seenMarkers = new Set<string>();
  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent) return;
    const marker = markerOf(node);
    if (!marker) return;
    if (!keys.has(marker.key)) return; // not a real footnote reference
    let number = numbers.get(marker.key);
    if (!number) {
      number =
        marker.number && !usedNumbers.has(marker.number)
          ? marker.number
          : nextFree();
      numbers.set(marker.key, number);
      usedNumbers.add(number);
    }
    parent.children[index] = buildFootnoteMarker(number, "lw", {
      withId: !seenMarkers.has(number),
    });
    seenMarkers.add(number);
    return SKIP;
  });

  // Pass 3: now extract each note's (fully rewritten) content, drop the
  // source's footnote containers, and append the rebuilt section.
  const notes: FootnoteNote[] = [];
  for (const item of items) {
    const number = numbers.get(item.key);
    if (!number) {
      warnings.add("footnote-orphan", `#fn${item.key}`);
      continue;
    }
    const contentDiv = findFirst(item.node, (el) =>
      hasClass(el, "footnote-content"),
    );
    const content = contentDiv ? contentDiv.children : item.node.children;
    notes.push({ number, content: stripAuthorBacklinks(content) });
  }

  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent) return;
    const classes = classListOf(node);
    const isContainer =
      classes.includes("footnote-section") ||
      classes.includes("footnotes") ||
      classes.includes("footnotes-list") ||
      classes.includes("footnotes-sep") ||
      classes.includes("footnote-item");
    if (!isContainer) return;
    parent.children.splice(index, 1);
    return index;
  });

  notes.sort((a, b) => Number(a.number) - Number(b.number));
  if (notes.length === 0) return;
  tree.children.push(buildFootnotesSection(notes, "lw"));

  // Source-authored dangling footnote links — markers whose note never
  // existed in this post (e.g. leftovers of an earlier draft keyed to a
  // different document id). They are equally dead on the source site, but
  // inside the reader a dead link reads as our bug: unwrap to plain text
  // and record it. Minted markers are untouched (#lw-fn… ≠ #fn…).
  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent) return;
    if (node.tagName !== "a") return;
    const href = stringProp(node, "href");
    if (!href || !href.startsWith("#fn")) return;
    warnings.add("footnote-link-dead", href);
    parent.children.splice(index, 1, ...node.children);
    return index;
  });
}

/**
 * A footnote marker in either format: the modern `span.footnote-reference`
 * wrapper or the legacy `sup.footnote-ref`, each containing `a[href^=#fn]`.
 */
function markerOf(
  node: Element,
): { key: string; number: string | null } | null {
  const modern = node.tagName === "span" && hasClass(node, "footnote-reference");
  // Legacy markers come classed (sup.footnote-ref) or bare (<sup><a href=
  // "#fn1">); accepting any sup is safe because callers only rewrite
  // markers whose key has a matching note (keys.has guard).
  const legacy = node.tagName === "sup";
  if (!modern && !legacy) return null;
  const link = findFirst(
    node,
    (el) => el.tagName === "a" && (stringProp(el, "href")?.startsWith("#fn") ?? false),
  );
  const href = link && stringProp(link, "href");
  if (!href || href.startsWith("#fnref")) return null;
  const key = href.slice("#fn".length);
  if (!key) return null;
  const digits = /(\d+)/.exec(textOf(node));
  return { key, number: digits ? digits[1] : null };
}

/** Splice any OTHER footnote item out of this item's subtree. */
function detachNestedItems(root: Element, itemNodes: Set<Element>): void {
  const walk = (el: Element) => {
    el.children = el.children.filter(
      (child) => !(child.type === "element" && itemNodes.has(child) && child !== root),
    );
    for (const child of el.children) {
      if (child.type === "element") walk(child);
    }
  };
  walk(root);
}

/** Every matching descendant (including the node itself), document order. */
function collectAll(
  node: Element,
  match: (el: Element) => boolean,
): Element[] {
  const out: Element[] = [];
  const walk = (el: Element) => {
    if (match(el)) out.push(el);
    for (const child of el.children) {
      if (child.type === "element") walk(child);
    }
  };
  walk(node);
  return out;
}

/** Remove the source's own back-links from note content (we mint our own). */
function stripAuthorBacklinks(content: ElementContent[]): ElementContent[] {
  const strip = (children: ElementContent[]): ElementContent[] =>
    children.flatMap((child): ElementContent[] => {
      if (child.type !== "element") return [child];
      if (
        hasClass(child, "footnote-backref") ||
        hasClass(child, "footnote-back-link") ||
        // The bare-list format's back-link carries no class — just
        // `<a href="#fnrefN">↩</a>` — and would survive as a dead link
        // inside the rebuilt note.
        (child.tagName === "a" &&
          (stringProp(child, "href")?.startsWith("#fnref") ?? false))
      ) {
        return [];
      }
      const element: Element = { ...child, children: strip(child.children) };
      return [element];
    });
  return strip(content);
}

// --- Embeds & spoilers --------------------------------------------------------

/**
 * Degrade rich embeds. oembed wrappers carry their URL and become link
 * cards; iframe-widget embeds reference an id in LessWrong's database (no
 * URL is recoverable), so they drop with a warning the build surfaces.
 */
function transformEmbeds(tree: Root, warnings: WarningCollector): void {
  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent) return;

    if (hasClass(node, "iframe-widget")) {
      parent.children.splice(index, 1);
      warnings.add("dropped-embed", "iframe-widget");
      return index;
    }

    const isOembed =
      (node.tagName === "figure" && hasClass(node, "media")) ||
      stringProp(node, "dataOembedUrl") !== undefined;
    if (isOembed) {
      const carrier = findFirst(
        node,
        (el) => stringProp(el, "dataOembedUrl") !== undefined,
      );
      const oembed = carrier ? stringProp(carrier, "dataOembedUrl") : undefined;
      if (oembed && /^https?:\/\//.test(oembed)) {
        warnings.add("embed-as-link", oembed);
        parent.children[index] = {
          type: "element",
          tagName: "figure",
          properties: { className: ["lw-embed"] },
          children: [
            {
              type: "element",
              tagName: "a",
              properties: { href: oembed },
              children: [{ type: "text", value: `Embedded content: ${oembed}` }],
            },
          ],
        };
        return SKIP;
      }
      parent.children.splice(index, 1);
      warnings.add("dropped-embed", node.tagName);
      return index;
    }
  });
}

/**
 * LessWrong spoiler blocks (`div.spoilers`, legacy `.spoiler`) become
 * native <details> — the same zero-JS reveal idiom as the edit engine's
 * hide markers. Minted post-sanitize (details isn't in the schema), with
 * already-sanitized children.
 */
function transformSpoilers(tree: Root): void {
  visit(tree, "element", (node: Element, index, parent) => {
    if (index === undefined || !parent) return;
    const classes = classListOf(node);
    if (!classes.includes("spoilers") && !classes.includes("spoiler")) return;

    const body: ElementContent[] =
      node.tagName === "div"
        ? node.children
        : [
            {
              ...node,
              properties: {
                ...node.properties,
                className: undefined,
              },
            },
          ];
    parent.children[index] = {
      type: "element",
      tagName: "details",
      properties: { className: ["lw-spoiler"] },
      children: [
        {
          type: "element",
          tagName: "summary",
          properties: {},
          children: [{ type: "text", value: "Spoiler — click to reveal" }],
        },
        ...body,
      ],
    };
    return SKIP;
  });
}
