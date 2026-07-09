import type { PaperTocEntry } from "@/lib/arxiv/types";
import type { PaperInsertion, PaperInsertionItem } from "@/lib/content/types";

// Splits a converted paper's HTML at end-of-section boundaries so activity
// blocks (exercise cards, inline lessons) can be interleaved into the flow.
// Driven entirely by the artifact's precomputed toc: every toc entry is a
// TOP-LEVEL element in the serialized HTML (see src/lib/arxiv/toc.ts), so
// slicing at an entry's start offset can never land inside another element.

export interface PaperInsertionPoint {
  sectionId: string;
  items: PaperInsertionItem[];
}

export interface PaperSplit {
  /** segments.length === points.length + 1; points[i] renders between segments[i] and segments[i+1]. */
  segments: string[];
  points: PaperInsertionPoint[];
  /** Insertions whose sectionId matched no locatable toc entry (fail-soft). */
  unmatched: PaperInsertion[];
}

/**
 * Index of the first toc entry after `i` at the same or a shallower level —
 * i.e. where entry `i`'s subtree ends ("end of a section" includes its
 * subsections). Returns toc.length when the subtree runs to document end.
 */
export function subtreeEndIndex(toc: PaperTocEntry[], i: number): number {
  for (let j = i + 1; j < toc.length; j++) {
    if (toc[j].level <= toc[i].level) return j;
  }
  return toc.length;
}

/** Stable DOM id for an insertion block; shared by PaperReader and the sidebar nav. */
export function insertionAnchorId(item: PaperInsertionItem): string {
  return `ins-${item.kind}-${item.id}`;
}

/**
 * Start offset of the toc entry's element in the serialized HTML, i.e. the
 * position of its opening `<`. The ` id="…"` search needs an inside-a-tag
 * guard: attribute-style strings can legitimately appear in text content
 * (quotes are not escaped there), so require that we're inside an open tag
 * and that the tag is one a toc entry can be (h2–h4 or a landmark section).
 */
function entryStartOffset(html: string, id: string): number {
  const needle = ` id="${id}"`;
  let from = 0;
  for (;;) {
    const at = html.indexOf(needle, from);
    if (at === -1) return -1;
    const open = html.lastIndexOf("<", at);
    const close = html.lastIndexOf(">", at);
    if (open > close && /^<(?:h[2-4]|section)[\s>]/.test(html.slice(open, open + 9))) {
      return open;
    }
    from = at + 1;
  }
}

export function splitPaperHtml(
  html: string,
  toc: PaperTocEntry[],
  insertions: PaperInsertion[] | undefined,
): PaperSplit {
  if (!insertions?.length) return { segments: [html], points: [], unmatched: [] };

  const startOffsets = toc.map((entry) => entryStartOffset(html, entry.id));

  /** End offset of entry i's subtree: start of the next locatable boundary entry. */
  const subtreeEndOffset = (i: number): number => {
    for (let j = subtreeEndIndex(toc, i); j < toc.length; j++) {
      if (startOffsets[j] !== -1) return startOffsets[j];
    }
    return html.length;
  };

  // Resolve each insertion to a boundary; merge duplicates targeting the same
  // section (items in config order).
  const bySection = new Map<
    string,
    { offset: number; level: number; docIndex: number; items: PaperInsertionItem[] }
  >();
  const unmatched: PaperInsertion[] = [];
  for (const insertion of insertions) {
    const i = toc.findIndex((entry) => entry.id === insertion.sectionId);
    if (i === -1 || startOffsets[i] === -1) {
      unmatched.push(insertion);
      continue;
    }
    const existing = bySection.get(insertion.sectionId);
    if (existing) {
      existing.items.push(...insertion.items);
    } else {
      bySection.set(insertion.sectionId, {
        offset: subtreeEndOffset(i),
        level: toc[i].level,
        docIndex: i,
        items: [...insertion.items],
      });
    }
  }

  // Deeper sections first when boundaries coincide (the end of 3.2 and the
  // end of 3 can be the same offset — the subsection's activities belong
  // above the parent's); document order breaks remaining ties.
  const ordered = [...bySection.entries()].sort(
    ([, a], [, b]) => a.offset - b.offset || b.level - a.level || a.docIndex - b.docIndex,
  );

  const segments: string[] = [];
  const points: PaperInsertionPoint[] = [];
  let prev = 0;
  for (const [sectionId, point] of ordered) {
    segments.push(html.slice(prev, point.offset));
    points.push({ sectionId, items: point.items });
    prev = point.offset;
  }
  segments.push(html.slice(prev));

  return { segments, points, unmatched };
}
