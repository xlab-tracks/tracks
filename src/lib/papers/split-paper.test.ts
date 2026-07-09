import { describe, expect, it } from "vitest";
import type { PaperTocEntry } from "@/lib/arxiv/types";
import type { PaperInsertion } from "@/lib/content/types";
import { insertionAnchorId, splitPaperHtml, subtreeEndIndex } from "./split-paper";

// Mirrors real converter output shape: landmark sections with stamped ids,
// top-level h2/h3 section headings with ax-sec ids and secnum spans.
const HTML = [
  '<section class="ax-abstract" id="ax-abstract"><h2 data-anchor="b-0001">Abstract</h2>Abstract text.</section>',
  '<h2 id="ax-sec-a" data-anchor="b-0002"><span class="ax-secnum">1</span> Alpha</h2>',
  '<p data-anchor="b-0003">A text.</p>',
  '<h3 id="ax-sec-a-1" data-anchor="b-0004"><span class="ax-secnum">1.1</span> Alpha One</h3>',
  '<p data-anchor="b-0005">A1 text.</p>',
  '<h2 id="ax-sec-b" data-anchor="b-0006"><span class="ax-secnum">2</span> Beta</h2>',
  '<p data-anchor="b-0007">B text.</p>',
  '<section class="ax-references" id="ax-references"><h2 data-anchor="b-0008">References</h2><ol><li>A ref.</li></ol></section>',
].join("");

const TOC: PaperTocEntry[] = [
  { kind: "abstract", id: "ax-abstract", title: "Abstract", number: "", level: 2 },
  { kind: "section", id: "ax-sec-a", title: "Alpha", number: "1", level: 2 },
  { kind: "section", id: "ax-sec-a-1", title: "Alpha One", number: "1.1", level: 3 },
  { kind: "section", id: "ax-sec-b", title: "Beta", number: "2", level: 2 },
  { kind: "references", id: "ax-references", title: "References", number: "", level: 2 },
];

const ins = (sectionId: string, id = "x"): PaperInsertion => ({
  sectionId,
  items: [{ kind: "exercise", id }],
});

describe("subtreeEndIndex", () => {
  it("ends a subsection at the next same-or-shallower entry", () => {
    expect(subtreeEndIndex(TOC, 2)).toBe(3); // a-1 → b
  });
  it("includes child subsections in a parent's subtree", () => {
    expect(subtreeEndIndex(TOC, 1)).toBe(3); // a (contains a-1) → b
  });
  it("runs to the end of the toc for the last entry", () => {
    expect(subtreeEndIndex(TOC, 4)).toBe(TOC.length);
  });
});

describe("splitPaperHtml", () => {
  it("returns the whole document for no insertions", () => {
    expect(splitPaperHtml(HTML, TOC, undefined)).toEqual({
      segments: [HTML],
      points: [],
      unmatched: [],
    });
    expect(splitPaperHtml(HTML, TOC, []).segments).toEqual([HTML]);
  });

  it("splits at the end of a subsection, before the next heading", () => {
    const { segments, points } = splitPaperHtml(HTML, TOC, [ins("ax-sec-a-1")]);
    expect(points).toEqual([
      { sectionId: "ax-sec-a-1", items: [{ kind: "exercise", id: "x" }] },
    ]);
    expect(segments[0].endsWith("A1 text.</p>")).toBe(true);
    expect(segments[1].startsWith('<h2 id="ax-sec-b"')).toBe(true);
  });

  it("a parent section's end includes its child subtree", () => {
    const { segments } = splitPaperHtml(HTML, TOC, [ins("ax-sec-a")]);
    expect(segments[0].endsWith("A1 text.</p>")).toBe(true);
    expect(segments[1].startsWith('<h2 id="ax-sec-b"')).toBe(true);
  });

  it("treats the references landmark as a boundary for the last body section", () => {
    const { segments } = splitPaperHtml(HTML, TOC, [ins("ax-sec-b")]);
    expect(segments[0].endsWith("B text.</p>")).toBe(true);
    expect(segments[1].startsWith('<section class="ax-references"')).toBe(true);
  });

  it("splits after the abstract landmark", () => {
    const { segments } = splitPaperHtml(HTML, TOC, [ins("ax-abstract")]);
    expect(segments[0].endsWith("</section>")).toBe(true);
    expect(segments[1].startsWith('<h2 id="ax-sec-a"')).toBe(true);
  });

  it("splits at document end for the last toc entry", () => {
    const { segments } = splitPaperHtml(HTML, TOC, [ins("ax-references")]);
    expect(segments[0]).toBe(HTML);
    expect(segments[1]).toBe("");
  });

  it("reports unknown sectionIds as unmatched without throwing", () => {
    const missing = ins("ax-sec-nope");
    const { segments, points, unmatched } = splitPaperHtml(HTML, TOC, [missing]);
    expect(unmatched).toEqual([missing]);
    expect(points).toEqual([]);
    expect(segments).toEqual([HTML]);
  });

  it("ignores spoofed id strings in text content", () => {
    const spoofed =
      '<p data-anchor="b-0000">see id="ax-sec-a" in the text</p>' + HTML;
    const { segments } = splitPaperHtml(spoofed, TOC, [ins("ax-sec-a")]);
    // The boundary must come from the real heading, not the quoted text.
    expect(segments[0]).toContain('see id="ax-sec-a" in the text');
    expect(segments[0].endsWith("A1 text.</p>")).toBe(true);
    expect(segments.join("")).toBe(spoofed);
  });

  it("does not confuse dedup-suffixed ids with their prefix", () => {
    const html =
      '<h2 id="ax-sec-foo-2" data-anchor="b-0001">Foo again</h2><p>second</p>' +
      '<h2 id="ax-sec-foo" data-anchor="b-0002">Foo</h2><p>first</p>';
    const toc: PaperTocEntry[] = [
      { kind: "section", id: "ax-sec-foo-2", title: "Foo again", number: "1", level: 2 },
      { kind: "section", id: "ax-sec-foo", title: "Foo", number: "2", level: 2 },
    ];
    const { segments } = splitPaperHtml(html, toc, [ins("ax-sec-foo-2")]);
    expect(segments[0]).toBe('<h2 id="ax-sec-foo-2" data-anchor="b-0001">Foo again</h2><p>second</p>');
    expect(segments[1].startsWith('<h2 id="ax-sec-foo"')).toBe(true);
  });

  it("orders coincident boundaries deeper-first and reassembles byte-for-byte", () => {
    // End of 1.1 and end of 1 are the same offset; the subsection's block
    // must come before the parent's.
    const { segments, points } = splitPaperHtml(HTML, TOC, [
      ins("ax-sec-a", "parent"),
      ins("ax-sec-a-1", "child"),
      ins("ax-sec-b", "later"),
    ]);
    expect(points.map((p) => p.sectionId)).toEqual([
      "ax-sec-a-1",
      "ax-sec-a",
      "ax-sec-b",
    ]);
    expect(segments).toHaveLength(4);
    expect(segments[1]).toBe(""); // between the two coincident blocks
    expect(segments.join("")).toBe(HTML);
  });

  it("merges multiple insertions targeting the same section in config order", () => {
    const { points } = splitPaperHtml(HTML, TOC, [
      { sectionId: "ax-sec-b", items: [{ kind: "exercise", id: "one" }] },
      { sectionId: "ax-sec-b", items: [{ kind: "lesson", id: "two" }] },
    ]);
    expect(points).toEqual([
      {
        sectionId: "ax-sec-b",
        items: [
          { kind: "exercise", id: "one" },
          { kind: "lesson", id: "two" },
        ],
      },
    ]);
  });
});

describe("insertionAnchorId", () => {
  it("is stable and kind-scoped", () => {
    expect(insertionAnchorId({ kind: "exercise", id: "mc" })).toBe("ins-exercise-mc");
    expect(insertionAnchorId({ kind: "lesson", id: "l1" })).toBe("ins-lesson-l1");
  });
});
