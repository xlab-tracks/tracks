import type { PaperTocEntry } from "@/lib/arxiv/types";
import type { PaperInsertionItem } from "@/lib/content/types";
import { anchorNum, sectionIndexForAnchor } from "./anchors";
import { insertionAnchorId, subtreeEndIndex } from "./split-paper";

// Builds the sidebar's per-paper navigation model: the paper's section tree
// with entries for activity edits spliced in at the positions where the
// reader actually renders them — section-end activities at their subtree
// end (boundary math shared with split-paper.ts), block/sentence-level
// activities nested under their containing section. Hidden/added content
// gets no nav entries.

export type PaperNavItem =
  | { kind: "section"; id: string; title: string; number: string; level: number }
  | { kind: "inserted-lesson"; anchorId: string; lessonId: string; title: string; level: number }
  | { kind: "inserted-exercise"; anchorId: string; exerciseId: string; title: string; level: number }
  | { kind: "inserted-demo"; anchorId: string; demoId: string; title: string; level: number }
  | { kind: "inserted-sequence"; anchorId: string; title: string; level: number };

/** An activity edit with display titles already resolved by the caller. */
export interface PaperNavActivity {
  after: { sectionEnd: string } | { anchor: string; s?: number };
  items: Array<PaperInsertionItem & { title: string }>;
}

export function buildPaperNav(
  toc: PaperTocEntry[],
  activities: PaperNavActivity[] | undefined,
): PaperNavItem[] {
  // Resolve every activity to the toc index its entries render before, with
  // an intra-bucket sort key. Anchor-level activities come before the same
  // bucket's section-end ones (they sit inside the section's own text);
  // section-end ordering mirrors splitAtSectionEnds (deeper targets first).
  const resolved = (activities ?? []).map((activity, configIndex) => {
    if ("sectionEnd" in activity.after) {
      const target = activity.after.sectionEnd;
      const index = toc.findIndex((entry) => entry.id === target);
      return {
        activity,
        beforeIndex: index === -1 ? toc.length : subtreeEndIndex(toc, index),
        group: 1,
        sort: [index === -1 ? Number.MAX_SAFE_INTEGER : -toc[index].level, index, configIndex],
        level: index === -1 ? 2 : toc[index].level,
      };
    }
    const section = sectionIndexForAnchor(toc, activity.after.anchor);
    return {
      activity,
      // A preamble anchor (before the first toc entry) renders in the
      // preamble; place its nav entry before toc[0], matching the reader's
      // slice-key -1 (not after the first section).
      beforeIndex: section === -1 ? 0 : section + 1,
      group: 0,
      sort: [anchorNum(activity.after.anchor), activity.after.s ?? Number.MAX_SAFE_INTEGER, configIndex],
      level: section === -1 ? 2 : toc[section].level,
    };
  });
  resolved.sort(
    (a, b) =>
      a.beforeIndex - b.beforeIndex ||
      a.group - b.group ||
      a.sort[0] - b.sort[0] ||
      a.sort[1] - b.sort[1] ||
      a.sort[2] - b.sort[2],
  );

  const itemsBefore = new Map<number, PaperNavItem[]>();
  for (const { activity, beforeIndex, level } of resolved) {
    const bucket = itemsBefore.get(beforeIndex) ?? [];
    for (const item of activity.items) {
      const anchorId = insertionAnchorId(item);
      const shared = { anchorId, title: item.title, level: level + 1 };
      bucket.push(
        item.kind === "lesson"
          ? { kind: "inserted-lesson", lessonId: item.id, ...shared }
          : item.kind === "demo"
            ? { kind: "inserted-demo", demoId: item.id, ...shared }
            : item.kind === "sequence"
              ? { kind: "inserted-sequence", ...shared }
              : { kind: "inserted-exercise", exerciseId: item.id, ...shared },
      );
    }
    itemsBefore.set(beforeIndex, bucket);
  }

  const nav: PaperNavItem[] = [];
  toc.forEach((entry, index) => {
    nav.push(...(itemsBefore.get(index) ?? []));
    nav.push({
      kind: "section",
      id: entry.id,
      title: entry.title,
      number: entry.number,
      level: entry.level,
    });
  });
  nav.push(...(itemsBefore.get(toc.length) ?? []));
  return nav;
}
