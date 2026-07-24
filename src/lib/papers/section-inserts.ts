import type { PaperTocEntry } from "@/lib/arxiv/types";
import type { PaperEdit } from "@/lib/content/types";
import { anchorNum, sectionIndexForAnchor } from "./anchors";
import { subtreeEndIndex } from "./split-paper";

// Plans the `op: "section"` edits: an authored subsection spliced into a paper
// after a block. Everything the renderer and the sidebar nav need is DERIVED
// here from the artifact's toc — the committed artifact JSON is never touched.
//
//  - the inserted section's display number + heading level come from the
//    parent section (the toc entry whose subtree contains the edit's anchor);
//  - the parent's later sibling subsections have their DISPLAYED numbers
//    shifted (+1 per inserted sibling before them) so the sequence stays
//    contiguous — their ids/anchors/text stay verbatim (numberOverrides drives
//    both the body ax-secnum rewrite and the nav numbers);
//  - the shift is scoped STRICTLY to the parent's direct later siblings;
//    nothing outside the parent subtree, and no earlier sibling, renumbers.

/** A subsection spliced in by an `op: "section"` edit, resolved against the toc. */
export interface InsertedSection {
  /** DOM heading id + sidebar nav anchor (the edit's `id`). */
  id: string;
  title: string;
  /** Derived display number, e.g. "3.2.1" (parent number + child ordinal). */
  number: string;
  /** Heading level (h2–h6) = parent.level + 1. */
  level: number;
  /** Block anchor after which the heading renders. */
  afterAnchor: string;
  /** Numeric form of `afterAnchor` (document order key). */
  afterNum: number;
  /** toc index of the containing (parent) section, or -1 for the preamble. */
  parentIndex: number;
  /** First toc index rendering after the heading — its nav insert position. */
  beforeIndex: number;
}

export interface SectionInsertPlan {
  sections: InsertedSection[];
  /** Existing toc-entry id → shifted display number (parent's siblings only). */
  numberOverrides: Map<string, string>;
}

const EMPTY_PLAN: SectionInsertPlan = { sections: [], numberOverrides: new Map() };

/** Add `by` to a dotted number's last segment: bump("3.2.1", 1) → "3.2.2". */
function bumpLastSegment(number: string, by: number): string {
  const parts = number.split(".");
  const last = Number(parts[parts.length - 1]);
  if (!Number.isInteger(last)) return number;
  parts[parts.length - 1] = String(last + by);
  return parts.join(".");
}

/** First toc index whose anchor sits after `afterNum`, or toc.length. */
function firstIndexAfter(toc: PaperTocEntry[], afterNum: number): number {
  for (let i = 0; i < toc.length; i++) {
    const n = toc[i].anchor ? anchorNum(toc[i].anchor!) : NaN;
    if (!Number.isNaN(n) && n > afterNum) return i;
  }
  return toc.length;
}

export function planSectionInserts(
  toc: PaperTocEntry[],
  edits: PaperEdit[] | undefined,
): SectionInsertPlan {
  const sectionOps = (edits ?? []).filter(
    (op): op is Extract<PaperEdit, { op: "section" }> => op.op === "section",
  );
  if (sectionOps.length === 0) return EMPTY_PLAN;

  // Resolve each op to its parent section + heading level (parent.level + 1).
  const resolved = sectionOps.map((op) => {
    const afterNum = anchorNum(op.after.anchor);
    const parentIndex = sectionIndexForAnchor(toc, op.after.anchor);
    const parent = parentIndex === -1 ? undefined : toc[parentIndex];
    return {
      op,
      afterNum,
      parentIndex,
      parent,
      level: parent ? parent.level + 1 : 2,
    };
  });

  const sections: InsertedSection[] = resolved.map((r) => {
    const { op, parent, parentIndex, afterNum, level } = r;

    // The parent's direct child subsections — the level our section joins.
    let existingBefore = 0;
    if (parent) {
      const end = subtreeEndIndex(toc, parentIndex);
      for (let j = parentIndex + 1; j < end; j++) {
        if (toc[j].level !== level) continue; // direct siblings only
        const n = toc[j].anchor ? anchorNum(toc[j].anchor!) : NaN;
        if (!Number.isNaN(n) && n <= afterNum) existingBefore++;
      }
    }
    // Other inserted sections under the same parent that render before this one.
    const insertedBefore = resolved.filter(
      (o) => o !== r && o.parentIndex === parentIndex && o.afterNum < afterNum,
    ).length;
    const ordinal = existingBefore + insertedBefore + 1;

    return {
      id: op.id,
      title: op.title,
      number: parent ? `${parent.number}.${ordinal}` : String(ordinal),
      level,
      afterAnchor: op.after.anchor,
      afterNum,
      parentIndex,
      beforeIndex: firstIndexAfter(toc, afterNum),
    };
  });

  // Shift each displaced sibling by the number of inserted sections (across all
  // section ops) sharing its parent whose insertion anchor precedes it. Bumps
  // from the ORIGINAL number each time, so repeated visits are idempotent.
  const numberOverrides = new Map<string, string>();
  for (const r of resolved) {
    if (!r.parent) continue;
    const end = subtreeEndIndex(toc, r.parentIndex);
    for (let j = r.parentIndex + 1; j < end; j++) {
      const e = toc[j];
      if (e.level !== r.level || !e.number) continue; // direct siblings only
      const eNum = e.anchor ? anchorNum(e.anchor) : NaN;
      if (Number.isNaN(eNum)) continue;
      const shift = resolved.filter(
        (o) => o.parentIndex === r.parentIndex && o.afterNum < eNum,
      ).length;
      if (shift > 0) numberOverrides.set(e.id, bumpLastSegment(e.number, shift));
    }
  }

  return { sections, numberOverrides };
}

/**
 * Rewrite the `ax-secnum` text of the given headings in the paper HTML —
 * keyed by toc-entry id → new display number — leaving ids, anchors, tags, and
 * body text verbatim. A render-time transform (the artifact stays as built);
 * runs on the full HTML before the edit pipeline slices it, so numbers in
 * untouched sections shift too.
 */
export function applySecnumOverrides(
  html: string,
  overrides: Map<string, string>,
): string {
  let result = html;
  for (const [sectionId, number] of overrides) {
    result = rewriteSecnum(result, sectionId, number);
  }
  return result;
}

const AX_SECNUM_OPEN = '<span class="ax-secnum">';

function rewriteSecnum(html: string, sectionId: string, number: string): string {
  const idAt = html.indexOf(`id="${sectionId}"`);
  if (idAt === -1) return html;
  const tagClose = html.indexOf(">", idAt);
  if (tagClose === -1) return html;
  const spanAt = html.indexOf(AX_SECNUM_OPEN, tagClose);
  if (spanAt === -1) return html;
  // The ax-secnum span must lead the heading (only whitespace between the
  // heading's opening tag and the span), never a later block's number.
  if (html.slice(tagClose + 1, spanAt).trim() !== "") return html;
  const start = spanAt + AX_SECNUM_OPEN.length;
  const end = html.indexOf("</span>", start);
  if (end === -1) return html;
  return html.slice(0, start) + number + html.slice(end);
}
