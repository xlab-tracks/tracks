import { readFileSync } from "node:fs";

/**
 * Rehype plugin (registered in next.config.ts, after rehype-lesson-sections,
 * before rehype-katex): auto-wraps the FIRST running-text occurrence of each
 * opted-in glossary term in a lesson body with an inline
 * `<Term id="…">matched text</Term>` element, so common jargon gets the
 * glossary hover card without authors hand-placing `<Term>` everywhere.
 *
 * Opt-in and opt-out both live in src/content/glossary.json:
 *   - an entry participates only with `"autoGloss": true` (reserve the flag
 *     for unambiguous jargon — never common words like "control" or "audit",
 *     which stay manual-`<Term>`-only);
 *   - the top-level `"autoGlossExclude"` array names lesson ids (MDX
 *     basenames) the plugin must leave untouched — the verbatim-reproduced
 *     lessons, where we don't decorate someone else's prose by default.
 *
 * Matching rules:
 *   - first occurrence per document per entry id, longest surface first, so
 *     "trusted monitoring" wins over a hypothetical "monitoring" entry;
 *   - case-insensitive, word-boundary guarded (hyphens count as word chars,
 *     so "x-risk" never fires inside "x-risk-focused");
 *   - a surface's inner spaces match any whitespace run — markdown soft line
 *     breaks land in text nodes as "\n";
 *   - hand-authored `<Term>`s win: a pre-pass records their entry ids and the
 *     auto pass skips those terms entirely (no doubled cards);
 *   - never matches inside headings, code/pre (inline math is still a `code`
 *     element at this stage), links, or JSX components — the only JSX
 *     descended into is flow-position `<Callout>`, whose body is ordinary
 *     lesson prose. Every other mdxJsx* node (inline `<Term>`, `<Footnote>`,
 *     literal `<a>`, and flow components like `<SiteQuote>` whose children
 *     render inside a real link) is left whole; plain hast elements still
 *     recurse as usual.
 *
 * The MDX component map resolves the injected `Term` name globally
 * (src/mdx-components.tsx), so no import is added to the lesson module.
 * Plain .mjs (not TS): the MDX loader imports it by file path at build time.
 * Turbopack note: glossary.json is read here, not imported, so Turbopack's
 * persistent cache can't see the dependency — after a glossary edit, restart
 * the dev server AND clear the cache (`rm -rf .next`) or lessons keep serving
 * the stale compile. Production builds are always correct.
 */
export default function rehypeAutoGloss(options = {}) {
  const registry = options.registry ?? loadRegistry();
  const ctx = buildContext(registry);
  return (tree, file) => {
    if (!ctx) return;
    if (ctx.excludeLessons.has(lessonIdOf(file))) return;
    const seen = collectAuthoredTermIds(tree, ctx);
    glossSubtree(tree, seen, ctx);
  };
}

/** { terms, autoGlossExclude } straight from the committed registry. */
function loadRegistry() {
  const url = new URL("../../content/glossary.json", import.meta.url);
  const data = JSON.parse(readFileSync(url, "utf8"));
  return { terms: data.terms ?? [], autoGlossExclude: data.autoGlossExclude ?? [] };
}

/**
 * Precomputed matcher state, or null when no entry opts in (the plugin then
 * costs one Set lookup per lesson).
 */
function buildContext(registry) {
  const surfaceToId = new Map();
  for (const term of registry.terms) {
    for (const surface of [term.term, ...(term.aliases ?? [])]) {
      surfaceToId.set(normalizeSurface(surface), term.id);
    }
  }
  const autoSurfaces = registry.terms
    .filter((term) => term.autoGloss === true)
    .flatMap((term) => [term.term, ...(term.aliases ?? [])])
    .sort((a, b) => b.length - a.length);
  if (autoSurfaces.length === 0) return null;
  const alternation = autoSurfaces.map(surfaceToPattern).join("|");
  return {
    surfaceToId,
    // Hyphen-aware boundaries: see the header comment's matching rules.
    pattern: new RegExp(`(?<![\\w-])(?:${alternation})(?![\\w-])`, "gi"),
    excludeLessons: new Set(registry.autoGlossExclude),
  };
}

function surfaceToPattern(surface) {
  return surface
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

/** Same normalization as src/lib/content/glossary.ts `resolveGlossaryTerm`. */
function normalizeSurface(s) {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function lessonIdOf(file) {
  const path = typeof file?.path === "string" ? file.path : "";
  return path.split(/[\\/]/).pop()?.replace(/\.mdx?$/, "") ?? "";
}

/**
 * Entry ids the author already `<Term>`ed by hand anywhere in the lesson
 * (by id attribute, or by resolving the child text like the runtime does).
 */
function collectAuthoredTermIds(node, ctx, seen = new Set()) {
  if (
    (node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement") &&
    node.name === "Term"
  ) {
    const idAttr = (node.attributes ?? []).find(
      (attr) => attr.type === "mdxJsxAttribute" && attr.name === "id",
    );
    const id =
      literalIdOf(idAttr) ?? ctx.surfaceToId.get(normalizeSurface(toText(node)));
    if (id) seen.add(id);
  }
  for (const child of node.children ?? []) {
    collectAuthoredTermIds(child, ctx, seen);
  }
  return seen;
}

function toText(node) {
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(toText).join("");
}

/**
 * A <Term> id attribute's literal value, covering both spellings the tests
 * accept and the runtime resolves: the plain string form (`id="x"`) and an
 * attribute-value expression wrapping a single quoted literal (`id={"x"}`,
 * where attr.value.value is the raw source text `"x"`). Anything else — no
 * attribute, an empty literal, or a genuine expression — returns undefined
 * so the caller falls back to resolving the child text.
 */
function literalIdOf(attr) {
  if (!attr) return undefined;
  if (typeof attr.value === "string") return attr.value || undefined;
  if (attr.value && typeof attr.value.value === "string") {
    const match = /^\s*(["'])((?:(?!\1)[^\\])*)\1\s*$/.exec(attr.value.value);
    if (match) return match[2] || undefined;
  }
  return undefined;
}

// No auto-gloss inside these: headings gloss nothing, code/pre carry inline
// math at this stage, and links must stay single-purpose.
const SKIP_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "code", "pre", "a", "script", "style"]);

// The only JSX auto-gloss descends into: flow-position components whose
// children are ordinary lesson prose. Everything else (e.g. <SiteQuote>,
// whose children render inside a real <a>) is left whole — never inject a
// Term inside a component that may wrap its children in a link.
const DESCEND_FLOW_JSX = new Set(["Callout"]);

function glossSubtree(node, seen, ctx) {
  // JSX is skip-by-default: inline JSX (hand-placed <Term>, <Footnote>,
  // literal <a>) is always left whole, and flow JSX only falls through when
  // allowlisted above. Plain hast elements recurse as usual.
  if (node.type === "mdxJsxTextElement") return;
  if (node.type === "mdxJsxFlowElement" && !DESCEND_FLOW_JSX.has(node.name)) {
    return;
  }
  if (node.type === "element" && SKIP_TAGS.has(node.tagName)) return;
  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === "text") {
      const replacement = glossTextNode(child.value, seen, ctx);
      if (replacement) {
        children.splice(i, 1, ...replacement);
        i += replacement.length - 1;
      }
    } else {
      glossSubtree(child, seen, ctx);
    }
  }
}

/**
 * Split one text value around its first unseen matches. Returns the
 * replacement node list, or null when nothing matched (the common case —
 * the original node is then kept, no churn).
 */
function glossTextNode(value, seen, ctx) {
  const nodes = [];
  let cursor = 0;
  ctx.pattern.lastIndex = 0;
  for (let match; (match = ctx.pattern.exec(value)); ) {
    const id = ctx.surfaceToId.get(normalizeSurface(match[0]));
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (match.index > cursor) {
      nodes.push({ type: "text", value: value.slice(cursor, match.index) });
    }
    nodes.push({
      type: "mdxJsxTextElement",
      name: "Term",
      attributes: [{ type: "mdxJsxAttribute", name: "id", value: id }],
      children: [{ type: "text", value: match[0] }],
    });
    cursor = match.index + match[0].length;
  }
  if (nodes.length === 0) return null;
  if (cursor < value.length) {
    nodes.push({ type: "text", value: value.slice(cursor) });
  }
  return nodes;
}
