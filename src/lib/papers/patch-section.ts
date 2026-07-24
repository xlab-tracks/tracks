import type { Element, ElementContent, Root, RootContent } from "hast";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { toHtml } from "hast-util-to-html";
import {
  editTargetRef,
  type PaperBlockRef,
  type PaperEdit,
  type PaperInsertionItem,
} from "@/lib/content/types";
import { anchorNum } from "./anchors";
import { blockTextOf, normalizeText } from "./block-index";
import { markdownBlocksToHast, markdownInlineToHast } from "./markdown";

// Applies block/sentence-level paper edits to ONE section's HTML by tree
// patching: parse the slice (its boundaries are top-level toc elements, so
// fragment parsing is safe), mutate, then re-serialize into html parts split
// around activity positions. Ops are applied in fixed phases so earlier
// splices never invalidate later lookups:
//   A0 glossary wraps (text-preserving, so no later lookup can drift) →
//   A1 sentence hides (asc s) → A2 inline adds (asc s) →
//   B mid-paragraph activity splits (DESC s — the first half keeps every
//     not-yet-split earlier sentence) →
//   C block-level adds/activities after blocks (edits order) →
//   D block hides, with consecutive hidden siblings merged into one marker.
// Silent hides (A1/D) remove their target instead of wrapping it — no
// marker, nothing to expand.

export type SectionPart =
  | { kind: "html"; html: string }
  | { kind: "activity"; items: PaperInsertionItem[] }
  | { kind: "gate"; id: string; prompt?: string; cta?: string };

export interface PatchedSection {
  parts: SectionPart[];
  /** Ops whose target didn't resolve (unknown anchor/sentence, snippet drift). */
  unmatched: PaperEdit[];
}

const SENTINEL_TAG = "ax-part-break";

/** Rendered html for a section-end `add` edit (used by apply-edits tier 1). */
export function renderBlockAddHtml(markdown: string, label?: string): string {
  return toHtml({
    type: "root",
    children: [blockAddedWrapper(markdownBlocksToHast(markdown), label)],
  });
}

/**
 * Rendered html for a gate's prompt markdown — bare blocks, no card chrome
 * (PaperGate owns the chrome; PaperReader wraps this in the paper-typography
 * div so dangerouslySetInnerHTML stays in the server component).
 */
export function renderGatePromptHtml(markdown: string): string {
  return toHtml({ type: "root", children: markdownBlocksToHast(markdown) });
}

export function patchSectionHtml(
  sectionHtml: string,
  ops: PaperEdit[],
): PatchedSection {
  const tree = fromHtmlIsomorphic(sectionHtml, { fragment: true }) as Root;
  const unmatched: PaperEdit[] = [];
  const sentinels: Exclude<SectionPart, { kind: "html" }>[] = [];

  // Parent links for every element (nested blocks need real DOM ancestry,
  // not just the anchored chain).
  const parentOf = new Map<Element, Element | Root>();
  const blockByAnchor = new Map<string, Element>();
  const link = (node: Element | Root): void => {
    for (const child of node.children ?? []) {
      if (child.type !== "element") continue;
      parentOf.set(child, node);
      const anchor = child.properties?.dataAnchor;
      if (typeof anchor === "string") blockByAnchor.set(anchor, child);
      link(child);
    }
  };
  link(tree);

  const isTopLevel = (node: Element) => parentOf.get(node) === tree;
  const topLevelAncestorOf = (node: Element): Element => {
    let current = node;
    for (;;) {
      const parent = parentOf.get(current);
      if (!parent || parent === tree) return current;
      current = parent as Element;
    }
  };

  /** Resolve a block ref: existence + snippet tripwire. Null → unmatched. */
  const resolve = (ref: PaperBlockRef): Element | null => {
    const block = blockByAnchor.get(ref.anchor);
    if (!block) return null;
    const target = ref.s ? findSentenceSpan(block, ref.s) : block;
    if (!target) return null;
    if (
      ref.snippet &&
      !normalizeText(blockTextOf(target)).startsWith(normalizeText(ref.snippet))
    ) {
      return null;
    }
    return block;
  };

  // Group ops per target anchor.
  interface BlockOps {
    glosses: Extract<PaperEdit, { op: "gloss" }>[];
    sentenceHides: Extract<PaperEdit, { op: "hide" }>[];
    inlineAdds: Extract<PaperEdit, { op: "add" }>[];
    splits: Extract<PaperEdit, { op: "activity" }>[];
    after: PaperEdit[]; // block-level adds + activities, edits order
    blockHide?: Extract<PaperEdit, { op: "hide" }>;
  }
  const byAnchor = new Map<string, BlockOps>();
  const opsFor = (anchor: string): BlockOps => {
    let entry = byAnchor.get(anchor);
    if (!entry) {
      entry = { glosses: [], sentenceHides: [], inlineAdds: [], splits: [], after: [] };
      byAnchor.set(anchor, entry);
    }
    return entry;
  };
  for (const op of ops) {
    const ref = editTargetRef(op);
    if (!("anchor" in ref)) {
      unmatched.push(op); // sectionEnd ops never reach the section patcher
      continue;
    }
    if (!resolve(ref)) {
      unmatched.push(op);
      continue;
    }
    const bucket = opsFor(ref.anchor);
    if (op.op === "gloss") {
      bucket.glosses.push(op);
    } else if (op.op === "hide") {
      if (ref.s) bucket.sentenceHides.push(op);
      else bucket.blockHide = bucket.blockHide ?? op;
    } else if (op.op === "gate") {
      // Sentence-level gates are unsupported (content.test.ts enforces this;
      // fail-soft here for local iteration).
      if (ref.s) unmatched.push(op);
      else bucket.after.push(op);
    } else if (ref.s) {
      if (op.op === "add") bucket.inlineAdds.push(op);
      else bucket.splits.push(op);
    } else {
      bucket.after.push(op);
    }
  }

  const anchorsAsc = [...byAnchor.keys()].sort((a, b) => anchorNum(a) - anchorNum(b));

  // ---- Phase A0: glossary term wraps ---------------------------------------
  // Wrapping a phrase in a span preserves the block's text content and its
  // sentence spans, so every later phase (and any snippet check) sees an
  // unchanged tree shape.
  for (const anchor of anchorsAsc) {
    const block = blockByAnchor.get(anchor)!;
    for (const op of byAnchor.get(anchor)!.glosses) {
      const scope = op.at.s ? findSentenceSpan(block, op.at.s) : block;
      if (!scope || !wrapGlossPhrase(scope, op.phrase, op.termId)) {
        unmatched.push(op);
      }
    }
  }

  // ---- Phase A1: sentence hides ------------------------------------------
  for (const anchor of anchorsAsc) {
    const block = blockByAnchor.get(anchor)!;
    for (const op of [...byAnchor.get(anchor)!.sentenceHides].sort(
      (a, b) => (a.at.s ?? 0) - (b.at.s ?? 0),
    )) {
      const from = childIndexContainingSentence(block, op.at.s!);
      const to = childIndexContainingSentence(block, op.sEnd ?? op.at.s!);
      if (from === -1 || to === -1 || to < from) {
        unmatched.push(op);
        continue;
      }
      const run = block.children.slice(from, to + 1);
      if (op.silent) {
        // Removed outright. The empty span keeps the range's LAST data-s
        // resolvable, so hide-then-replace adds/splits still land here.
        block.children.splice(from, run.length, {
          type: "element",
          tagName: "span",
          properties: { dataS: String(op.sEnd ?? op.at.s!) },
          children: [],
        });
        continue;
      }
      const count = (op.sEnd ?? op.at.s!) - op.at.s! + 1;
      block.children.splice(from, run.length, inlineHiddenWrapper(run, count, op.note));
    }
  }

  // ---- Phase A2: inline adds ---------------------------------------------
  for (const anchor of anchorsAsc) {
    const block = blockByAnchor.get(anchor)!;
    const adds = [...byAnchor.get(anchor)!.inlineAdds].sort(
      (a, b) => sOf(a) - sOf(b),
    );
    // Same-sentence adds insert together so edits-array order is preserved.
    for (let i = 0; i < adds.length; ) {
      const s = sOf(adds[i]);
      const group = adds.filter((add) => sOf(add) === s);
      i += group.length;
      const idx = childIndexContainingSentence(block, s);
      if (idx === -1) {
        unmatched.push(...group);
        continue;
      }
      const nodes: ElementContent[] = [];
      for (const add of group) {
        const inline = markdownInlineToHast(add.markdown);
        if (!inline) {
          unmatched.push(add);
          continue;
        }
        nodes.push({ type: "text", value: " " }, inlineAddedWrapper(inline));
      }
      block.children.splice(idx + 1, 0, ...nodes);
    }
  }

  // ---- Phase B: mid-paragraph activity splits (desc s) --------------------
  // Tracks each block's trailing fragment so phase C lands after ALL halves.
  // Activities on NESTED blocks can't split their container box — they defer
  // into per-container hoist lists, flushed after phase C in document order
  // (direct insert-at-container+1 would reverse them).
  const tailFragment = new Map<string, Element>();
  const hoisted = new Map<
    Element,
    Array<{
      key: [number, number, number];
      part: Exclude<SectionPart, { kind: "html" }>;
    }>
  >();
  const deferHoist = (
    container: Element,
    key: [number, number, number],
    part: Exclude<SectionPart, { kind: "html" }>,
  ) => {
    const list = hoisted.get(container) ?? [];
    list.push({ key, part });
    hoisted.set(container, list);
  };
  for (const anchor of anchorsAsc) {
    const block = blockByAnchor.get(anchor)!;
    // Multiple activities on the same sentence merge into ONE split point
    // (items in edits-array order) — re-splitting an already-truncated block
    // would land the second batch after the paragraph's remainder.
    const byS = new Map<number, { items: PaperInsertionItem[]; first: number }>();
    for (const op of byAnchor.get(anchor)!.splits) {
      const entry = byS.get(sOf(op));
      if (entry) entry.items.push(...op.items);
      else byS.set(sOf(op), { items: [...op.items], first: ops.indexOf(op) });
    }
    const splits = [...byS.entries()].sort(([a], [b]) => b - a);
    for (const [s, { items, first }] of splits) {
      if (!isTopLevel(block)) {
        // Never split a container box in two — hoist the activity to after
        // the outermost top-level ancestor.
        deferHoist(topLevelAncestorOf(block), [anchorNum(anchor), s, first], {
          kind: "activity",
          items,
        });
        continue;
      }
      let idx = childIndexContainingSentence(block, s);
      if (idx === -1) {
        unmatched.push(
          ...byAnchor.get(anchor)!.splits.filter((op) => sOf(op) === s),
        );
        continue;
      }
      // The first half keeps everything attached to the target sentence:
      // trailing whitespace and inline editorial adds spliced in phase A2.
      for (;;) {
        const next = block.children[idx + 1];
        if (next && next.type === "text" && next.value.trim() === "") idx++;
        else if (
          next &&
          next.type === "element" &&
          hasClass(next, "ax-added-inline")
        )
          idx++;
        else break;
      }
      const rest = block.children.slice(idx + 1);
      if (rest.every(isIgnorable)) {
        // Split at the last sentence — no second half, activity goes after.
        insertSentinelAfter(tailFragment.get(anchor) ?? block, {
          kind: "activity",
          items,
        });
        continue;
      }
      block.children = block.children.slice(0, idx + 1);
      // Second half keeps tag + styling props but not the anchor/id — the
      // first half stays "the block" for anchors, ids, and highlights.
      const halfProps = { ...(block.properties ?? {}) };
      delete halfProps.dataAnchor;
      delete halfProps.id;
      const secondHalf: Element = {
        type: "element",
        tagName: block.tagName,
        properties: halfProps,
        children: rest,
      };
      const root = parentOf.get(block) as Root;
      const at = root.children.indexOf(block);
      root.children.splice(at + 1, 0, sentinel({ kind: "activity", items }), secondHalf);
      parentOf.set(secondHalf, root);
      if (!tailFragment.has(anchor)) tailFragment.set(anchor, secondHalf);
    }
  }

  // ---- Phase C: block-level adds/activities after blocks ------------------
  // `cursor` tracks the last node placed for this block (fragment, added
  // note, or activity sentinel) so mixed ops keep their edits-array order.
  for (const anchor of anchorsAsc) {
    const block = blockByAnchor.get(anchor)!;
    let cursor: Element = tailFragment.get(anchor) ?? block;
    for (const op of byAnchor.get(anchor)!.after) {
      if (op.op === "add") {
        const added = blockAddedWrapper(markdownBlocksToHast(op.markdown), op.label);
        if (cursor.tagName === "li") {
          // A div after an li would be a non-conforming ul/ol child — the
          // note renders inside the list item instead.
          cursor.children.push(added);
          parentOf.set(added, cursor);
        } else {
          const parent = parentOf.get(cursor) ?? tree;
          const at = parent.children.indexOf(cursor);
          parent.children.splice(at + 1, 0, added);
          parentOf.set(added, parent);
          cursor = added;
        }
      } else if (op.op === "activity" || op.op === "gate") {
        // Activities and gates render as React parts, so their sentinels must
        // sit at the top level — nested cursors defer into the container's
        // hoist list (Number.MAX_SAFE_INTEGER sorts after any mid-paragraph
        // hoist of the same block).
        const part: Exclude<SectionPart, { kind: "html" }> =
          op.op === "activity"
            ? { kind: "activity", items: op.items }
            : { kind: "gate", id: op.id, prompt: op.prompt, cta: op.cta };
        const top = topLevelAncestorOf(cursor);
        if (top === cursor) {
          cursor = insertSentinelAfter(cursor, part);
        } else {
          deferHoist(
            top,
            [anchorNum(anchor), Number.MAX_SAFE_INTEGER, ops.indexOf(op)],
            part,
          );
        }
      }
    }
  }

  // Flush hoisted activities per container in document order.
  for (const [container, list] of hoisted) {
    list.sort(
      (a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2],
    );
    let at = container;
    for (const entry of list) {
      at = insertSentinelAfter(at, entry.part);
    }
  }

  // ---- Phase D: block hides (+ merge of consecutive hidden siblings) ------
  const hideNotes = new Map<Element, string | undefined>();
  const hiddenBlocks = new Set<Element>();
  const parentsWithHides = new Set<Element | Root>();
  for (const anchor of anchorsAsc) {
    const op = byAnchor.get(anchor)!.blockHide;
    if (!op) continue;
    const block = blockByAnchor.get(anchor)!;
    if (op.silent) {
      // Removed outright — no details wrapper, no merge run. Phase C ran
      // first, so a hide-then-replace add/activity sibling survives; works
      // for li too (dropping the item is valid list markup — the details
      // special case below exists only for the expandable variant).
      const parent = parentOf.get(block)!;
      const at = parent.children.indexOf(block);
      if (at !== -1) parent.children.splice(at, 1);
      continue;
    }
    if (block.tagName === "li") {
      // <details> is not a valid child of ul/ol — wrap the li's CHILDREN.
      const inner = block.children;
      block.children = [
        detailsWrapper(
          inner,
          hiddenSummaryLabel([{ tagName: "li" } as Element], op.note),
        ),
      ];
      continue;
    }
    hiddenBlocks.add(block);
    hideNotes.set(block, op.note);
    parentsWithHides.add(parentOf.get(block)!);
  }
  for (const parent of parentsWithHides) {
    const children = parent.children as RootContent[];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.type !== "element" || !hiddenBlocks.has(child)) continue;
      // Extend the run over adjacent hidden siblings (whitespace between ok).
      let end = i;
      let probe = i + 1;
      while (probe < children.length) {
        const candidate = children[probe];
        if (candidate.type === "text" && candidate.value.trim() === "") {
          probe++;
          continue;
        }
        if (candidate.type === "element" && hiddenBlocks.has(candidate)) {
          end = probe;
          probe++;
          continue;
        }
        break;
      }
      const run = children.slice(i, end + 1);
      const blocks = run.filter(
        (node): node is Element => node.type === "element" && hiddenBlocks.has(node),
      );
      const note = blocks.map((b) => hideNotes.get(b)).find(Boolean);
      children.splice(
        i,
        run.length,
        detailsWrapper(run as ElementContent[], hiddenSummaryLabel(blocks, note)),
      );
    }
  }

  // ---- Emission: partition at sentinels ------------------------------------
  const parts: SectionPart[] = [];
  let current: RootContent[] = [];
  const flushHtml = () => {
    if (current.length === 0) return;
    parts.push({ kind: "html", html: toHtml({ type: "root", children: current }) });
    current = [];
  };
  for (const child of tree.children) {
    if (child.type === "element" && child.tagName === SENTINEL_TAG) {
      flushHtml();
      parts.push(
        sentinels[Number(child.properties?.dataPart)] ?? {
          kind: "activity",
          items: [],
        },
      );
      continue;
    }
    current.push(child);
  }
  flushHtml();

  return { parts, unmatched };

  // ---- helpers bound to tree state ----------------------------------------

  function sentinel(part: Exclude<SectionPart, { kind: "html" }>): Element {
    sentinels.push(part);
    return {
      type: "element",
      tagName: SENTINEL_TAG,
      properties: { dataPart: String(sentinels.length - 1) },
      children: [],
    };
  }

  /** Insert a part sentinel after a TOP-LEVEL node; returns the marker. */
  function insertSentinelAfter(
    node: Element,
    part: Exclude<SectionPart, { kind: "html" }>,
  ): Element {
    const at = tree.children.indexOf(node);
    const marker = sentinel(part);
    tree.children.splice(at === -1 ? tree.children.length : at + 1, 0, marker);
    parentOf.set(marker, tree);
    return marker;
  }
}

function sOf(op: PaperEdit): number {
  const ref = editTargetRef(op);
  return "anchor" in ref ? (ref.s ?? 0) : 0;
}

function isIgnorable(node: ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

/** Index in block.children of the child whose subtree holds sentence s. */
function childIndexContainingSentence(block: Element, s: number): number {
  const target = String(s);
  const holds = (node: ElementContent): boolean => {
    if (node.type !== "element") return false;
    if (typeof node.properties?.dataAnchor === "string") return false; // nested block
    if (node.properties?.dataS === target) return true;
    return node.children.some(holds);
  };
  return block.children.findIndex(holds);
}

/** The sentence span itself (skipping nested anchored blocks). */
export function findSentenceSpan(block: Element, s: number): Element | null {
  const target = String(s);
  for (const child of block.children) {
    if (child.type !== "element") continue;
    if (typeof child.properties?.dataAnchor === "string") continue;
    if (child.properties?.dataS === target) return child;
    const found = findSentenceSpan(child, s);
    if (found) return found;
  }
  return null;
}

function text(value: string): ElementContent {
  return { type: "text", value };
}

// Inline containers a glossary wrap must not reach into: links and citations
// (nested interactive content), code, footnote markers, and rendered math
// (KaTeX MathML+HTML duplication would garble a text match anyway).
const GLOSS_SKIP_TAGS = new Set(["a", "code", "pre", "sup", "sub", "svg", "script", "style"]);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps the first occurrence of `phrase` inside `target` in a glossary
 * trigger span (`span.ax-gloss[data-gloss=termId]`). Whitespace in the
 * phrase matches any whitespace run, but the match must lie within a SINGLE
 * text node — a phrase broken by a link, citation, math, or other inline
 * markup does not match — and a phrase edge that is a word character must
 * fall on a word boundary (also refusing hyphen adjacency), so glossing
 * "attention" never wraps the tail of "intra-attention". content.test.ts
 * runs this exact matcher against the artifact — sequentially, in edits
 * order, like phase A0 — so a non-matching edit fails CI instead of
 * silently at render time. Returns whether a wrap happened.
 */
export function wrapGlossPhrase(
  target: Element,
  phrase: string,
  termId: string,
): boolean {
  const normalized = normalizeText(phrase);
  if (!normalized) return false;
  const wordChar = /[\p{L}\p{N}]/u;
  const boundary = "[\\p{L}\\p{N}\\p{Pd}]"; // letters, digits, dashes
  const pattern = new RegExp(
    (wordChar.test(normalized[0]) ? `(?<!${boundary})` : "") +
      normalized.split(" ").map(escapeRegExp).join("\\s+") +
      (wordChar.test(normalized[normalized.length - 1]) ? `(?!${boundary})` : ""),
    "u",
  );
  let wrapped = false;
  const visit = (node: Element): void => {
    const children = node.children;
    for (let i = 0; i < children.length && !wrapped; i++) {
      const child = children[i];
      if (child.type === "text") {
        const match = pattern.exec(child.value);
        if (!match) continue;
        const before = child.value.slice(0, match.index);
        const after = child.value.slice(match.index + match[0].length);
        const replacement: ElementContent[] = [];
        if (before) replacement.push(text(before));
        replacement.push(glossWrapper(match[0], termId));
        if (after) replacement.push(text(after));
        children.splice(i, 1, ...replacement);
        wrapped = true;
        return;
      }
      if (child.type !== "element") continue;
      if (GLOSS_SKIP_TAGS.has(child.tagName)) continue;
      if (hasClass(child, "inline-math") || hasClass(child, "display-math")) continue;
      if (hasClass(child, "ax-gloss")) continue; // never nest triggers
      if (typeof child.properties?.dataAnchor === "string") continue; // nested block
      visit(child);
    }
  };
  visit(target);
  return wrapped;
}

function glossWrapper(value: string, termId: string): Element {
  return {
    type: "element",
    tagName: "span",
    properties: {
      className: ["ax-gloss"],
      dataGloss: termId,
      // The PaperGlossary client layer drives these: keyboard reachable,
      // Enter/Space toggles the anchored card, aria-expanded tracks it.
      tabIndex: 0,
      role: "button",
      ariaHasPopup: "dialog",
      ariaExpanded: "false",
    },
    children: [text(value)],
  };
}

function inlineHiddenWrapper(
  run: ElementContent[],
  count: number,
  note: string | undefined,
): Element {
  return {
    type: "element",
    tagName: "span",
    properties: { className: ["ax-hidden-inline"] },
    children: [
      {
        type: "element",
        tagName: "label",
        properties: note ? { title: note } : {},
        children: [
          {
            type: "element",
            tagName: "input",
            properties: {
              type: "checkbox",
              className: ["ax-hidden-toggle"],
              ariaLabel:
                note ??
                `Show ${count} hidden sentence${count > 1 ? "s" : ""}`,
            },
            children: [],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["ax-hidden-marker"] },
            children: [text("···")],
          },
        ],
      },
      {
        type: "element",
        tagName: "span",
        properties: { className: ["ax-hidden-content"] },
        children: [text(" "), ...run],
      },
    ],
  };
}

function inlineAddedWrapper(children: ElementContent[]): Element {
  return {
    type: "element",
    tagName: "span",
    properties: {
      className: ["ax-added-inline"],
      title: "Added by the course",
    },
    children,
  };
}

function blockAddedWrapper(children: ElementContent[], label?: string): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["ax-added"] },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["ax-added-label"] },
        children: [text(label ?? "Note")],
      },
      ...children,
    ],
  };
}

function detailsWrapper(content: ElementContent[], summaryLabel: string): Element {
  return {
    type: "element",
    tagName: "details",
    properties: { className: ["ax-hidden"] },
    children: [
      {
        type: "element",
        tagName: "summary",
        // No aria-label: the visible text (count, noun, note) IS the
        // accessible name — overriding it would hide it from screen readers.
        properties: {},
        children: [text(summaryLabel)],
      },
      ...content,
    ],
  };
}

const HIDE_NOUNS: Array<[test: (b: Element) => boolean, noun: string]> = [
  [(b) => b.tagName === "p", "paragraph"],
  [(b) => b.tagName === "li", "list item"],
  [(b) => b.tagName === "figure", "figure"],
  [(b) => b.tagName === "table", "table"],
  [(b) => b.tagName === "pre", "code block"],
  [(b) => b.tagName === "blockquote", "quote"],
  [(b) => hasClass(b, "display-math"), "equation"],
  [(b) => hasClass(b, "ax-theorem"), "theorem"],
  [(b) => hasClass(b, "ax-proof"), "proof"],
];

function hasClass(node: Element, cls: string): boolean {
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.map(String).includes(cls);
  if (typeof className === "string") return className.split(/\s+/).includes(cls);
  return false;
}

function hiddenSummaryLabel(blocks: Element[], note: string | undefined): string {
  const nouns = blocks.map(
    (block) => HIDE_NOUNS.find(([test]) => test(block))?.[1] ?? "block",
  );
  const noun = nouns.every((n) => n === nouns[0]) ? nouns[0] : "block";
  const desc = `${blocks.length} ${noun}${blocks.length > 1 ? "s" : ""}`;
  return `··· ${desc} hidden${note ? ` — ${note}` : ""} ···`;
}
