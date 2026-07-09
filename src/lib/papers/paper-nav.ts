import type { PaperTocEntry } from "@/lib/arxiv/types";
import { insertionAnchorId, subtreeEndIndex } from "./split-paper";

// Builds the sidebar's per-paper navigation model: the paper's section tree
// with entries for inserted activities spliced in at the positions where
// PaperReader actually renders them. Boundary math is shared with
// split-paper.ts so the nav always mirrors the page.

export type PaperNavItem =
  | { kind: "section"; id: string; title: string; number: string; level: number }
  | { kind: "inserted-lesson"; anchorId: string; lessonId: string; title: string; level: number }
  | { kind: "inserted-exercise"; anchorId: string; exerciseId: string; title: string; level: number };

/** A paper insertion with display titles already resolved by the caller. */
export interface PaperNavInsertion {
  sectionId: string;
  items: Array<{ kind: "lesson" | "exercise"; id: string; title: string }>;
}

export function buildPaperNav(
  toc: PaperTocEntry[],
  insertions: PaperNavInsertion[] | undefined,
): PaperNavItem[] {
  // Resolve every insertion to the toc index its block renders before.
  // Ordering mirrors splitPaperHtml: position asc, deeper targets first,
  // then document order. Unmatched sectionIds render at document end there,
  // so they land at the end here too.
  const resolved = (insertions ?? []).map((insertion, configIndex) => {
    const i = toc.findIndex((entry) => entry.id === insertion.sectionId);
    return {
      insertion,
      beforeIndex: i === -1 ? toc.length : subtreeEndIndex(toc, i),
      level: i === -1 ? 2 : toc[i].level,
      docIndex: i === -1 ? toc.length + configIndex : i,
    };
  });
  resolved.sort(
    (a, b) =>
      a.beforeIndex - b.beforeIndex || b.level - a.level || a.docIndex - b.docIndex,
  );

  const itemsBefore = new Map<number, PaperNavItem[]>();
  for (const { insertion, beforeIndex, level } of resolved) {
    const bucket = itemsBefore.get(beforeIndex) ?? [];
    for (const item of insertion.items) {
      bucket.push(
        item.kind === "lesson"
          ? {
              kind: "inserted-lesson",
              anchorId: insertionAnchorId(item),
              lessonId: item.id,
              title: item.title,
              level: level + 1,
            }
          : {
              kind: "inserted-exercise",
              anchorId: insertionAnchorId(item),
              exerciseId: item.id,
              title: item.title,
              level: level + 1,
            },
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
