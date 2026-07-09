import { describe, expect, it } from "vitest";
import type { PaperTocEntry } from "@/lib/arxiv/types";
import { buildPaperNav } from "./paper-nav";

const TOC: PaperTocEntry[] = [
  { kind: "abstract", id: "ax-abstract", title: "Abstract", number: "", level: 2 },
  { kind: "section", id: "ax-sec-a", title: "Alpha", number: "1", level: 2 },
  { kind: "section", id: "ax-sec-a-1", title: "Alpha One", number: "1.1", level: 3 },
  { kind: "section", id: "ax-sec-b", title: "Beta", number: "2", level: 2 },
  { kind: "references", id: "ax-references", title: "References", number: "", level: 2 },
];

describe("buildPaperNav", () => {
  it("maps the toc one-to-one when there are no insertions", () => {
    const nav = buildPaperNav(TOC, undefined);
    expect(nav.map((n) => n.kind)).toEqual([
      "section",
      "section",
      "section",
      "section",
      "section",
    ]);
    expect(nav.map((n) => (n.kind === "section" ? n.id : ""))).toEqual(
      TOC.map((e) => e.id),
    );
  });

  it("places inserted items after their target's subtree, indented one level", () => {
    const nav = buildPaperNav(TOC, [
      {
        sectionId: "ax-sec-a-1",
        items: [{ kind: "exercise", id: "mc", title: "Multiple choice" }],
      },
    ]);
    const ids = nav.map((n) => (n.kind === "section" ? n.id : n.anchorId));
    // After Alpha One's subtree = before Beta.
    expect(ids).toEqual([
      "ax-abstract",
      "ax-sec-a",
      "ax-sec-a-1",
      "ins-exercise-mc",
      "ax-sec-b",
      "ax-references",
    ]);
    const inserted = nav.find((n) => n.kind === "inserted-exercise")!;
    expect(inserted.level).toBe(4); // target h3 (level 3) + 1
    expect(inserted.title).toBe("Multiple choice");
  });

  it("matches the splitter's coincident-boundary ordering (deeper first)", () => {
    const nav = buildPaperNav(TOC, [
      { sectionId: "ax-sec-a", items: [{ kind: "lesson", id: "p", title: "Parent" }] },
      { sectionId: "ax-sec-a-1", items: [{ kind: "exercise", id: "c", title: "Child" }] },
    ]);
    const ids = nav.map((n) => (n.kind === "section" ? n.id : n.anchorId));
    expect(ids).toEqual([
      "ax-abstract",
      "ax-sec-a",
      "ax-sec-a-1",
      "ins-exercise-c", // child subsection's block first…
      "ins-lesson-p", // …then the parent section's
      "ax-sec-b",
      "ax-references",
    ]);
  });

  it("keeps lesson and exercise kinds distinct with their ids", () => {
    const nav = buildPaperNav(TOC, [
      {
        sectionId: "ax-sec-b",
        items: [
          { kind: "lesson", id: "note", title: "Reading guide" },
          { kind: "exercise", id: "uc", title: "Understanding check" },
        ],
      },
    ]);
    const lesson = nav.find((n) => n.kind === "inserted-lesson");
    const exercise = nav.find((n) => n.kind === "inserted-exercise");
    expect(lesson).toMatchObject({ lessonId: "note", anchorId: "ins-lesson-note" });
    expect(exercise).toMatchObject({ exerciseId: "uc", anchorId: "ins-exercise-uc" });
    // Both land before the references landmark.
    const refIndex = nav.findIndex((n) => n.kind === "section" && n.id === "ax-references");
    expect(nav.indexOf(lesson!)).toBeLessThan(refIndex);
    expect(nav.indexOf(exercise!)).toBeLessThan(refIndex);
  });

  it("appends unmatched-section insertions at the end, like the reader does", () => {
    const nav = buildPaperNav(TOC, [
      { sectionId: "ax-sec-gone", items: [{ kind: "exercise", id: "x", title: "X" }] },
    ]);
    expect(nav[nav.length - 1]).toMatchObject({ anchorId: "ins-exercise-x" });
  });
});
