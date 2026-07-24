import type { PaperTocEntry } from "@/lib/arxiv/types";
import {
  isSectionEndRef,
  type PaperBlockRef,
  type PaperEdit,
  type PaperInsertionItem,
} from "@/lib/content/types";
import { anchorNum } from "./anchors";
import {
  applySecnumOverrides,
  planSectionInserts,
} from "./section-inserts";
import { sectionStartOffset, splitAtSectionEnds } from "./split-paper";
import {
  patchSectionHtml,
  renderBlockAddHtml,
  type InsertedSectionRender,
  type SectionPart,
} from "./patch-section";

// Applies a paper's edits in two tiers:
//   tier 1 — section-end ops (activities/adds after a toc subtree) via the
//     existing string splitter: byte-identical fast path, nothing parsed;
//   tier 2 — block/sentence ops: ONLY the sections containing them are
//     parsed, tree-patched, and re-serialized (patch-section.ts). Unedited
//     stretches are emitted as raw slices of the original html.
// A paper without edits costs exactly one html part, no parsing.

export type PaperPart =
  | { kind: "html"; html: string }
  | { kind: "activity"; items: PaperInsertionItem[] };

export interface AppliedPaper {
  parts: PaperPart[];
  /** Ops whose target didn't resolve (fail-soft; see content.test.ts for the real gate). */
  unmatchedEdits: PaperEdit[];
}

export function applyPaperEdits(
  sourceHtml: string,
  toc: PaperTocEntry[],
  edits: PaperEdit[] | undefined,
): AppliedPaper {
  const all = edits ?? [];
  if (all.length === 0)
    return { parts: [{ kind: "html", html: sourceHtml }], unmatchedEdits: [] };

  // Inserted-section plan: derived numbers/levels for `op: "section"` edits and
  // the display-number shift for the paper's own later sibling subsections.
  // The ax-secnum rewrite runs on the FULL html up front, so numbers shift even
  // in sections that carry no block ops (the artifact JSON itself is untouched).
  const plan = planSectionInserts(toc, all);
  const html = applySecnumOverrides(sourceHtml, plan.numberOverrides);
  const insertedSections = new Map<string, InsertedSectionRender>(
    plan.sections.map((s) => [
      s.id,
      { number: s.number, level: s.level, title: s.title },
    ]),
  );

  const sectionEndOps = all.filter(
    (op) => op.op !== "hide" && isSectionEndRef(op.after),
  );
  const blockOps = all.filter(
    (op) => op.op === "hide" || !isSectionEndRef(op.after),
  );
  const unmatchedEdits: PaperEdit[] = [];

  // ---- Tier 1: section-end boundaries -------------------------------------
  const tier1 = splitAtSectionEnds<PaperEdit>(
    html,
    toc,
    sectionEndOps.map((op) => ({
      sectionId:
        op.op === "hide" ? "" : isSectionEndRef(op.after) ? op.after.sectionEnd : "",
      payload: op,
    })),
  );
  unmatchedEdits.push(...tier1.unmatched.map((entry) => entry.payload));

  // ---- Tier 2: map block ops to section slices -----------------------------
  // A slice runs from a locatable toc entry to the next locatable one — the
  // smallest parse region containing the target block. Ops map to the last
  // locatable+anchored entry preceding their block (preamble = key -1).
  const locatable = toc
    .map((entry, tocIndex) => ({
      tocIndex,
      anchor: entry.anchor,
      start: sectionStartOffset(html, entry.id),
    }))
    .filter((slice) => slice.start !== -1);

  const sliceKeyForAnchor = (anchor: string): number => {
    const target = anchorNum(anchor);
    let key = -1;
    for (const slice of locatable) {
      if (!slice.anchor) continue;
      const own = anchorNum(slice.anchor);
      if (!Number.isNaN(own) && own <= target) key = slice.tocIndex;
    }
    return key;
  };

  const opsBySlice = new Map<number, PaperEdit[]>();
  for (const op of blockOps) {
    const ref = (op.op === "hide" ? op.at : op.after) as PaperBlockRef;
    if (Number.isNaN(anchorNum(ref.anchor))) {
      unmatchedEdits.push(op);
      continue;
    }
    const key = sliceKeyForAnchor(ref.anchor);
    const bucket = opsBySlice.get(key) ?? [];
    bucket.push(op);
    opsBySlice.set(key, bucket);
  }

  interface EditedSlice {
    start: number;
    end: number;
    ops: PaperEdit[];
  }
  const editedSlices: EditedSlice[] = [];
  if (opsBySlice.has(-1)) {
    editedSlices.push({
      start: 0,
      end: locatable[0]?.start ?? html.length,
      ops: opsBySlice.get(-1)!,
    });
  }
  locatable.forEach((slice, i) => {
    const ops = opsBySlice.get(slice.tocIndex);
    if (!ops) return;
    editedSlices.push({
      start: slice.start,
      end: locatable[i + 1]?.start ?? html.length,
      ops,
    });
  });
  editedSlices.sort((a, b) => a.start - b.start);

  // ---- Emit: tier-1 segments with tier-2 patches spliced in ---------------
  const parts: PaperPart[] = [];
  const emitHtml = (value: string) => {
    if (value) parts.push({ kind: "html", html: value });
  };
  const emitSectionEndOp = (op: PaperEdit) => {
    if (op.op === "activity") parts.push({ kind: "activity", items: op.items });
    else if (op.op === "add")
      emitHtml(renderBlockAddHtml(op.markdown, op.label, op.plain));
  };

  let sliceIndex = 0;
  let abs = 0;
  tier1.segments.forEach((segment, k) => {
    const segStart = abs;
    const segEnd = segStart + segment.length;
    abs = segEnd;

    let cursor = segStart;
    while (
      sliceIndex < editedSlices.length &&
      editedSlices[sliceIndex].start < segEnd
    ) {
      const slice = editedSlices[sliceIndex];
      // Tier-1 boundaries are section starts, so slices nest inside segments;
      // clamp defensively regardless.
      const start = Math.max(slice.start, segStart);
      const end = Math.min(slice.end, segEnd);
      emitHtml(html.slice(cursor, start));
      const patched = patchSectionHtml(
        html.slice(start, end),
        slice.ops,
        insertedSections,
      );
      parts.push(...patched.parts);
      unmatchedEdits.push(...patched.unmatched);
      cursor = end;
      sliceIndex++;
    }
    emitHtml(html.slice(cursor, segEnd));

    tier1.points[k]?.payloads.forEach(emitSectionEndOp);
  });

  // ---- Merge adjacent html parts -------------------------------------------
  const merged: PaperPart[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (part.kind === "html" && last?.kind === "html") {
      last.html += part.html;
      continue;
    }
    merged.push(part);
  }
  return { parts: merged, unmatchedEdits };
}

export type { SectionPart };
