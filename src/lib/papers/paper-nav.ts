import type { PaperTocEntry } from "@/lib/arxiv/types";
import type { PaperInsertionItem } from "@/lib/content/types";
import { anchorNum, sectionIndexForAnchor } from "./anchors";
import type { InsertedSection, SectionInsertPlan } from "./section-inserts";
import { insertionAnchorId, subtreeEndIndex } from "./split-paper";

// Builds the sidebar's per-paper navigation model: the paper's section tree
// with entries for activity edits spliced in at the positions where the
// reader actually renders them — section-end activities at their subtree
// end (boundary math shared with split-paper.ts), block/sentence-level
// activities nested under their containing section. Hidden/added content
// gets no nav entries. Inserted `op: "section"` subsections get a real
// section entry (nested under their parent, in document order), and the
// paper's own later sibling subsections show their shifted display numbers
// (see section-inserts.ts) — ids/anchors stay verbatim.

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
  plan?: SectionInsertPlan,
): PaperNavItem[] {
  const sections = plan?.sections ?? [];
  const numberOverrides = plan?.numberOverrides;

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
  // Merge activities with inserted-section entries into one document-ordered
  // stream. A section leads its cluster: at the same anchor its sort key beats
  // the activities that follow it (sort[1] = -1 < any sentence index / MAX),
  // while activities on earlier blocks still precede it.
  type Contribution =
    | {
        beforeIndex: number;
        key: [number, number, number, number];
        activity: PaperNavActivity;
        level: number;
      }
    | {
        beforeIndex: number;
        key: [number, number, number, number];
        section: InsertedSection;
      };
  const contributions: Contribution[] = [
    ...resolved.map((r) => ({
      beforeIndex: r.beforeIndex,
      key: [r.group, r.sort[0], r.sort[1], r.sort[2]] as [
        number,
        number,
        number,
        number,
      ],
      activity: r.activity,
      level: r.level,
    })),
    ...sections.map((section, i) => ({
      beforeIndex: section.beforeIndex,
      key: [0, section.afterNum, -1, i] as [number, number, number, number],
      section,
    })),
  ];
  contributions.sort(
    (a, b) =>
      a.beforeIndex - b.beforeIndex ||
      a.key[0] - b.key[0] ||
      a.key[1] - b.key[1] ||
      a.key[2] - b.key[2] ||
      a.key[3] - b.key[3],
  );

  // The inserted section (if any) an anchor activity renders inside — so its
  // nav entries nest one level deeper than the section heading.
  const containingSection = (
    beforeIndex: number,
    after: PaperNavActivity["after"],
  ): InsertedSection | undefined => {
    if (!("anchor" in after)) return undefined;
    const n = anchorNum(after.anchor);
    return sections.find((s) => s.beforeIndex === beforeIndex && s.afterNum <= n);
  };

  const itemsBefore = new Map<number, PaperNavItem[]>();
  for (const contribution of contributions) {
    const bucket = itemsBefore.get(contribution.beforeIndex) ?? [];
    if ("section" in contribution) {
      const s = contribution.section;
      bucket.push({
        kind: "section",
        id: s.id,
        title: s.title,
        number: s.number,
        level: s.level,
      });
    } else {
      const { activity, beforeIndex, level } = contribution;
      const parent = containingSection(beforeIndex, activity.after);
      const itemLevel = (parent ? parent.level : level) + 1;
      for (const item of activity.items) {
        const anchorId = insertionAnchorId(item);
        const shared = { anchorId, title: item.title, level: itemLevel };
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
    }
    itemsBefore.set(contribution.beforeIndex, bucket);
  }

  const nav: PaperNavItem[] = [];
  toc.forEach((entry, index) => {
    nav.push(...(itemsBefore.get(index) ?? []));
    nav.push({
      kind: "section",
      id: entry.id,
      title: entry.title,
      number: numberOverrides?.get(entry.id) ?? entry.number,
      level: entry.level,
    });
  });
  nav.push(...(itemsBefore.get(toc.length) ?? []));
  return nav;
}
