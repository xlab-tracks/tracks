import type { PaperTocEntry } from "@/lib/arxiv/types";
import {
  editTargetRef,
  isSectionEndRef,
  type PaperBlockRef,
  type PaperEdit,
  type PaperInsertionItem,
} from "@/lib/content/types";
import { anchorNum } from "./anchors";
import { sectionStartOffset, splitAtSectionEnds } from "./split-paper";
import { patchSectionHtml, renderBlockAddHtml, type SectionPart } from "./patch-section";

// Applies a paper's edits in two tiers:
//   tier 1 — section-end ops (activities/adds after a toc subtree) via the
//     existing string splitter: byte-identical fast path, nothing parsed;
//   tier 2 — block/sentence ops: ONLY the sections containing them are
//     parsed, tree-patched, and re-serialized (patch-section.ts). Unedited
//     stretches are emitted as raw slices of the original html.
// A paper without edits costs exactly one html part, no parsing.

export type PaperPart =
  | { kind: "html"; html: string }
  | { kind: "activity"; items: PaperInsertionItem[] }
  | { kind: "gate"; id: string; prompt?: string; cta?: string };

export interface AppliedPaper {
  parts: PaperPart[];
  /** Ops whose target didn't resolve (fail-soft; see content.test.ts for the real gate). */
  unmatchedEdits: PaperEdit[];
}

export function applyPaperEdits(
  html: string,
  toc: PaperTocEntry[],
  edits: PaperEdit[] | undefined,
): AppliedPaper {
  const all = edits ?? [];
  if (all.length === 0) return { parts: [{ kind: "html", html }], unmatchedEdits: [] };

  // hide/gloss target blocks by construction; add/activity may target either.
  const sectionEndOps = all.filter((op) => isSectionEndRef(editTargetRef(op)));
  const blockOps = all.filter((op) => !isSectionEndRef(editTargetRef(op)));
  const unmatchedEdits: PaperEdit[] = [];

  // ---- Tier 1: section-end boundaries -------------------------------------
  const tier1 = splitAtSectionEnds<PaperEdit>(
    html,
    toc,
    sectionEndOps.map((op) => {
      const ref = editTargetRef(op);
      return {
        sectionId: isSectionEndRef(ref) ? ref.sectionEnd : "",
        payload: op,
      };
    }),
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
    const ref = editTargetRef(op) as PaperBlockRef;
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
    else if (op.op === "gate")
      parts.push({ kind: "gate", id: op.id, prompt: op.prompt, cta: op.cta });
    else if (op.op === "add") emitHtml(renderBlockAddHtml(op.markdown, op.label));
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
      const patched = patchSectionHtml(html.slice(start, end), slice.ops);
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
