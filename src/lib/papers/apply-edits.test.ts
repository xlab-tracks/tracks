import { describe, expect, it } from "vitest";
import type { PaperTocEntry } from "@/lib/arxiv/types";
import type { PaperBlockRef, PaperEdit } from "@/lib/content/types";
import { applyPaperEdits, type PaperPart } from "./apply-edits";
import { insertionAnchorId } from "./split-paper";

// Fixture mirrors real converter output shape (canonical hast-util-to-html
// serialization: no self-closing slashes) with v17 sentence spans.
const HTML = [
  '<section class="ax-abstract" id="ax-abstract"><h2 data-anchor="b-0001">Abstract</h2>Abstract text.</section>',
  '<h2 id="ax-sec-a" data-anchor="b-0002"><span class="ax-secnum">1</span> Alpha</h2>',
  '<p data-anchor="b-0003"><span data-s="1">One one.</span> <span data-s="2">One two.</span> <span data-s="3">One three.</span></p>',
  '<p data-anchor="b-0004"><span data-s="1">Two one.</span> <span data-s="2">Two two.</span></p>',
  '<div class="ax-theorem" data-anchor="b-0005"><strong>Theorem 1:</strong><p data-anchor="b-0006"><span data-s="1">Claim text.</span></p></div>',
  '<h3 id="ax-sec-a-1" data-anchor="b-0007"><span class="ax-secnum">1.1</span> Alpha One</h3>',
  '<p data-anchor="b-0008"><span data-s="1">Sub para.</span></p>',
  '<h2 id="ax-sec-b" data-anchor="b-0009"><span class="ax-secnum">2</span> Beta</h2>',
  '<p data-anchor="b-0010"><span data-s="1">Beta one.</span></p>',
  '<p data-anchor="b-0011"><span data-s="1">Beta two.</span></p>',
  '<ul><li data-anchor="b-0012"><span data-s="1">Item text.</span></li></ul>',
  '<figure data-anchor="b-0013"><img src="/x.png"><table data-anchor="b-0014"><tbody><tr><td>cell</td></tr></tbody></table></figure>',
  '<p data-anchor="b-0015"><span data-s="1">Intra-attention beats attention here.</span> <span data-s="2">See <a href="#x">attention span</a> or <code>attention</code>, else attention wins.</span> <span data-s="3">P(doom) rises.</span></p>',
].join("");

const TOC: PaperTocEntry[] = [
  { kind: "abstract", id: "ax-abstract", title: "Abstract", number: "", level: 2, anchor: "b-0001" },
  { kind: "section", id: "ax-sec-a", title: "Alpha", number: "1", level: 2, anchor: "b-0002" },
  { kind: "section", id: "ax-sec-a-1", title: "Alpha One", number: "1.1", level: 3, anchor: "b-0007" },
  { kind: "section", id: "ax-sec-b", title: "Beta", number: "2", level: 2, anchor: "b-0009" },
];

const ref = (anchor: string, snippet: string, s?: number): PaperBlockRef => ({
  anchor,
  snippet,
  ...(s !== undefined ? { s } : {}),
});

const htmlOf = (parts: PaperPart[]) =>
  parts.map((p) => (p.kind === "html" ? p.html : `[activity]`)).join("");

describe("applyPaperEdits", () => {
  it("no edits → one byte-identical part, nothing parsed", () => {
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, undefined);
    expect(parts).toEqual([{ kind: "html", html: HTML }]);
    expect(unmatchedEdits).toEqual([]);
  });

  it("section-end activity keeps the original splitter semantics", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "activity", after: { sectionEnd: "ax-sec-a-1" }, items: [{ kind: "exercise", id: "x" }] },
    ]);
    expect(parts).toHaveLength(3);
    expect(parts[1]).toEqual({ kind: "activity", items: [{ kind: "exercise", id: "x" }] });
    expect((parts[0] as { html: string }).html.endsWith("Sub para.</span></p>")).toBe(true);
    expect((parts[2] as { html: string }).html.startsWith('<h2 id="ax-sec-b"')).toBe(true);
    expect(htmlOf(parts).replace("[activity]", "")).toBe(HTML);
  });

  it("section-end add renders an editorial block at the boundary", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "add", after: { sectionEnd: "ax-sec-a-1" }, markdown: "A **note**." },
    ]);
    expect(parts).toHaveLength(1); // html parts merge
    const html = (parts[0] as { html: string }).html;
    const at = html.indexOf('<div class="ax-added">');
    expect(at).toBeGreaterThan(html.indexOf("Sub para."));
    expect(at).toBeLessThan(html.indexOf('id="ax-sec-b"'));
    expect(html).toContain('<span class="ax-added-label">Note</span>');
    expect(html).toContain("<strong>note</strong>");
  });

  it("hides a block behind a details marker, preserving it byte-for-byte", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0010", "Beta one.") },
    ]);
    const html = htmlOf(parts);
    expect(html).toContain(
      '<details class="ax-hidden"><summary>··· 1 paragraph hidden ···</summary>' +
        '<p data-anchor="b-0010"><span data-s="1">Beta one.</span></p></details>',
    );
    // neighbors untouched
    expect(html).toContain('<p data-anchor="b-0011"><span data-s="1">Beta two.</span></p>');
    expect(html).toContain('<p data-anchor="b-0003"><span data-s="1">One one.</span>');
  });

  it("merges consecutive hidden siblings into one marker with the first note", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0010", "Beta one."), note: "Optional detail" },
      { op: "hide", at: ref("b-0011", "Beta two.") },
    ]);
    const html = htmlOf(parts);
    expect(html).toContain("··· 2 paragraphs hidden — Optional detail ···");
    expect(html.match(/<details/g)).toHaveLength(1);
    expect(html).toContain('data-anchor="b-0010"');
    expect(html).toContain('data-anchor="b-0011"');
  });

  it("does not merge non-adjacent hides", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0003", "One one.") },
      { op: "hide", at: ref("b-0010", "Beta one.") },
    ]);
    expect(htmlOf(parts).match(/<details/g)).toHaveLength(2);
  });

  it("hides a sentence behind the inline checkbox toggle", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0003", "One two.", 2) },
    ]);
    const html = htmlOf(parts);
    expect(html).toContain('<span class="ax-hidden-inline">');
    expect(html).toContain('<input type="checkbox" class="ax-hidden-toggle"');
    expect(html).toContain('<span class="ax-hidden-marker">···</span>');
    expect(html).toMatch(
      /<span class="ax-hidden-content"> <span data-s="2">One two\.<\/span><\/span>/,
    );
    // sentences 1 and 3 stay outside the wrapper
    expect(html).toMatch(/<span data-s="1">One one\.<\/span>\s*<span class="ax-hidden-inline">/);
  });

  it("hides an inclusive sentence range in one wrapper", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0003", "One two.", 2), sEnd: 3 },
    ]);
    const html = htmlOf(parts);
    expect(html.match(/ax-hidden-inline/g)).toHaveLength(1);
    const content = /<span class="ax-hidden-content">([\s\S]*?)<\/span><\/span><\/p>/.exec(html);
    expect(content?.[1]).toContain('data-s="2"');
    expect(content?.[1]).toContain('data-s="3"');
  });

  it("hides li content inside the li (details invalid in ul), and figures/nested tables", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0012", "Item text.") },
      { op: "hide", at: ref("b-0013", "cell") },
    ]);
    const html = htmlOf(parts);
    expect(html).toMatch(/<li data-anchor="b-0012"><details class="ax-hidden">/);
    expect(html).toContain("··· 1 list item hidden ···");
    expect(html).toContain("··· 1 figure hidden ···");
    expect(html).toMatch(/<details class="ax-hidden">(?:(?!<\/details>).)*<figure data-anchor="b-0013">/);
  });

  it("hides a nested block (table in figure) in place", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0014", "cell") },
    ]);
    const html = htmlOf(parts);
    expect(html).toMatch(
      /<figure data-anchor="b-0013"><img src="\/x.png"><details class="ax-hidden">/,
    );
    expect(html).toContain("··· 1 table hidden ···");
  });

  it("adds a block-level note after a block", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "add", after: ref("b-0004", "Two one."), markdown: "Editorial *aside*." },
    ]);
    const html = htmlOf(parts);
    const added = html.indexOf('<div class="ax-added">');
    expect(added).toBeGreaterThan(html.indexOf("Two two."));
    expect(added).toBeLessThan(html.indexOf("ax-theorem"));
    expect(html).toContain("<em>aside</em>");
  });

  it("adds an inline note right after its sentence", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "add", after: ref("b-0003", "One one.", 1), markdown: "*inline note*" },
    ]);
    const html = htmlOf(parts);
    expect(html).toMatch(
      /<span data-s="1">One one\.<\/span> <span class="ax-added-inline" title="Added by the course"><em>inline note<\/em><\/span> <span data-s="2">/,
    );
  });

  it("splits a paragraph around a mid-paragraph activity", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      {
        op: "activity",
        after: ref("b-0003", "One one.", 1),
        items: [{ kind: "exercise", id: "tf" }],
      },
    ]);
    expect(parts.map((p) => p.kind)).toEqual(["html", "activity", "html"]);
    const before = (parts[0] as { html: string }).html;
    const after = (parts[2] as { html: string }).html;
    expect(before.endsWith('<p data-anchor="b-0003"><span data-s="1">One one.</span> </p>')).toBe(true);
    // second half keeps tag but not the anchor
    expect(after.startsWith('<p><span data-s="2">One two.</span>')).toBe(true);
    expect(after).toContain('data-anchor="b-0004"');
  });

  it("split at the last sentence emits no empty second half", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      {
        op: "activity",
        after: ref("b-0003", "One three.", 3),
        items: [{ kind: "exercise", id: "tf" }],
      },
    ]);
    expect(parts.map((p) => p.kind)).toEqual(["html", "activity", "html"]);
    const before = (parts[0] as { html: string }).html;
    expect(before.endsWith("One three.</span></p>")).toBe(true);
    expect((parts[2] as { html: string }).html.startsWith('<p data-anchor="b-0004">')).toBe(true);
  });

  it("hoists activities targeting nested blocks after the outer container", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      {
        op: "activity",
        after: ref("b-0006", "Claim text.", 1),
        items: [{ kind: "exercise", id: "tf" }],
      },
    ]);
    expect(parts.map((p) => p.kind)).toEqual(["html", "activity", "html"]);
    const before = (parts[0] as { html: string }).html;
    // theorem box NOT split — activity lands after the whole container
    expect(before.endsWith("</p></div>")).toBe(true);
    expect(before).toContain("Claim text.");
    expect((parts[2] as { html: string }).html.startsWith('<h3 id="ax-sec-a-1"')).toBe(true);
  });

  it("two mid-paragraph activities produce three fragments in order", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "activity", after: ref("b-0003", "One one.", 1), items: [{ kind: "exercise", id: "a" }] },
      { op: "activity", after: ref("b-0003", "One two.", 2), items: [{ kind: "exercise", id: "b" }] },
    ]);
    expect(parts.map((p) => (p.kind === "activity" ? insertionAnchorId(p.items[0]) : "html"))).toEqual([
      "html",
      "ins-exercise-a",
      "html",
      "ins-exercise-b",
      "html",
    ]);
    const middle = (parts[2] as { html: string }).html;
    expect(middle).toContain('data-s="2"');
    expect(middle).not.toContain('data-s="1"');
    expect(middle).not.toContain('data-s="3"');
  });

  it("combined ops on one paragraph are edits-array-order independent", () => {
    const edits: PaperEdit[] = [
      { op: "hide", at: ref("b-0003", "One two.", 2) },
      { op: "add", after: ref("b-0003", "One two.", 2), markdown: "*after hidden*" },
      { op: "activity", after: ref("b-0003", "One one.", 1), items: [{ kind: "exercise", id: "tf" }] },
    ];
    const forward = applyPaperEdits(HTML, TOC, edits);
    const reversed = applyPaperEdits(HTML, TOC, [...edits].reverse());
    expect(forward.parts).toEqual(reversed.parts);
    expect(forward.unmatchedEdits).toEqual([]);
    const html = htmlOf(forward.parts);
    // the inline add follows the hide wrapper of sentence 2
    expect(html).toMatch(/ax-hidden-content"> <span data-s="2">One two\.<\/span><\/span><\/span> <span class="ax-added-inline"/);
  });

  it("hoisted activities on nested blocks keep document order", () => {
    // Theorem (b-0005) contains p b-0006; both a mid-paragraph activity on
    // the nested p AND an after-block activity on it hoist after the box —
    // in (anchor, s, config) order, never reversed.
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "activity", after: ref("b-0006", "Claim text.", 1), items: [{ kind: "exercise", id: "mid" }] },
      { op: "activity", after: ref("b-0006", "Claim text."), items: [{ kind: "exercise", id: "end" }] },
    ]);
    expect(
      parts.map((p) => (p.kind === "activity" ? insertionAnchorId(p.items[0]) : "html")),
    ).toEqual(["html", "ins-exercise-mid", "ins-exercise-end", "html"]);
    expect((parts[0] as { html: string }).html.endsWith("</p></div>")).toBe(true);
  });

  it("merges same-sentence activities into one split point in edits order", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "activity", after: ref("b-0003", "One one.", 1), items: [{ kind: "exercise", id: "a1" }] },
      { op: "activity", after: ref("b-0003", "One one.", 1), items: [{ kind: "exercise", id: "a2" }] },
    ]);
    expect(parts.map((p) => p.kind)).toEqual(["html", "activity", "html"]);
    expect((parts[1] as { items: Array<{ id: string }> }).items.map((i) => i.id)).toEqual([
      "a1",
      "a2",
    ]);
    // paragraph split exactly once
    expect((parts[2] as { html: string }).html.startsWith('<p><span data-s="2">')).toBe(true);
  });

  it("keeps an inline add attached to its sentence when the same sentence hosts a split", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "add", after: ref("b-0003", "One two.", 2), markdown: "*aside*" },
      { op: "activity", after: ref("b-0003", "One two.", 2), items: [{ kind: "exercise", id: "tf" }] },
    ]);
    const before = (parts[0] as { html: string }).html;
    // the aside stays in the FIRST half, right after sentence 2
    expect(before).toMatch(/data-s="2">One two\.<\/span> <span class="ax-added-inline"/);
    expect(before.endsWith("</p>")).toBe(true);
    expect((parts[2] as { html: string }).html.startsWith('<p><span data-s="3">')).toBe(true);
  });

  it("renders a block add after an li inside the li (valid list markup)", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "add", after: ref("b-0012", "Item text."), markdown: "List note." },
    ]);
    const html = htmlOf(parts);
    expect(html).toMatch(
      /<li data-anchor="b-0012"><span data-s="1">Item text\.<\/span><div class="ax-added">/,
    );
    // never a div as a direct ul child
    expect(html).not.toMatch(/<\/li><div class="ax-added">/);
  });

  it("fails soft on unknown anchors, sentences, and snippet drift", () => {
    const bad: PaperEdit[] = [
      { op: "hide", at: ref("b-9999", "Nope.") },
      { op: "hide", at: ref("b-0003", "One one.", 9) },
      { op: "add", after: ref("b-0004", "WRONG SNIPPET"), markdown: "x" },
    ];
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, bad);
    expect(unmatchedEdits).toHaveLength(3);
    expect(htmlOf(parts)).toBe(HTML);
  });

  it("re-serializes untouched blocks in an edited section byte-identically", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0004", "Two one.") },
    ]);
    const html = htmlOf(parts);
    // every other block of section A survives byte-for-byte
    expect(html).toContain(
      '<p data-anchor="b-0003"><span data-s="1">One one.</span> <span data-s="2">One two.</span> <span data-s="3">One three.</span></p>',
    );
    expect(html).toContain(
      '<div class="ax-theorem" data-anchor="b-0005"><strong>Theorem 1:</strong><p data-anchor="b-0006"><span data-s="1">Claim text.</span></p></div>',
    );
    // and every other section is a raw slice
    expect(html).toContain('<h2 id="ax-sec-b"');
  });

  it("gloss wraps its phrase in the full trigger-markup contract, on a word boundary", () => {
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, [
      { op: "gloss", at: ref("b-0015", "Intra-attention beats", 1), termId: "attn", phrase: "attention" },
    ]);
    expect(unmatchedEdits).toEqual([]);
    // The exact markup PaperGlossary delegates on ([data-gloss] + the aria
    // contract) — renaming any attribute breaks every paper glossary card.
    // "Intra-attention" is skipped: word-char phrase edges refuse letter/
    // digit/hyphen adjacency.
    expect(htmlOf(parts)).toContain(
      'Intra-attention beats <span class="ax-gloss" data-gloss="attn" tabindex="0" ' +
        'role="button" aria-haspopup="dialog" aria-expanded="false">attention</span> here.',
    );
  });

  it("gloss skips links, code, and earlier triggers when matching", () => {
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, [
      { op: "gloss", at: ref("b-0015", "See attention span or", 2), termId: "attn", phrase: "attention" },
    ]);
    expect(unmatchedEdits).toEqual([]);
    const html = htmlOf(parts);
    expect(html).toContain('<a href="#x">attention span</a>'); // untouched
    expect(html).toContain("<code>attention</code>"); // untouched
    expect(html).toMatch(/else <span class="ax-gloss"[^>]*>attention<\/span> wins/);
  });

  it("gloss escapes regex metacharacters in phrases", () => {
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, [
      { op: "gloss", at: ref("b-0015", "P(doom) rises.", 3), termId: "pdoom", phrase: "P(doom)" },
    ]);
    expect(unmatchedEdits).toEqual([]);
    expect(htmlOf(parts)).toMatch(/<span class="ax-gloss"[^>]*>P\(doom\)<\/span> rises\./);
  });

  it("block-level gloss wraps the first occurrence anywhere in the block", () => {
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, [
      { op: "gloss", at: ref("b-0003", "One one."), termId: "t", phrase: "One two" },
    ]);
    expect(unmatchedEdits).toEqual([]);
    expect(htmlOf(parts)).toMatch(
      /<span data-s="2"><span class="ax-gloss"[^>]*>One two<\/span>\.<\/span>/,
    );
  });

  it("gloss composes with a hide and a split on the same paragraph (phase A0 first)", () => {
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, [
      { op: "gloss", at: ref("b-0003", "One two.", 2), termId: "t", phrase: "One two" },
      { op: "hide", at: ref("b-0003", "One two.", 2) },
      { op: "activity", after: ref("b-0003", "One one.", 1), items: [{ kind: "exercise", id: "tf" }] },
    ]);
    expect(unmatchedEdits).toEqual([]);
    expect(parts.map((p) => p.kind)).toEqual(["html", "activity", "html"]);
    // The wrap happened before the hide, so the hidden content carries the
    // trigger — it reveals (and works) when the learner expands the marker.
    expect((parts[2] as { html: string }).html).toMatch(
      /ax-hidden-content"> <span data-s="2"><span class="ax-gloss"/,
    );
  });

  it("gloss fails soft on markup-broken and empty phrases", () => {
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, [
      // "attention span" exists only inside the link — never as plain text.
      { op: "gloss", at: ref("b-0015", "See attention span or", 2), termId: "attn", phrase: "attention span" },
      { op: "gloss", at: ref("b-0015", "P(doom) rises.", 3), termId: "attn", phrase: "   " },
    ]);
    expect(unmatchedEdits).toHaveLength(2);
    expect(htmlOf(parts)).toBe(HTML);
  });

  it("an earlier gloss consumes text a later overlapping gloss needs (fails soft)", () => {
    const { parts, unmatchedEdits } = applyPaperEdits(HTML, TOC, [
      { op: "gloss", at: ref("b-0015", "Intra-attention beats", 1), termId: "a", phrase: "beats attention" },
      { op: "gloss", at: ref("b-0015", "Intra-attention beats", 1), termId: "b", phrase: "attention" },
    ]);
    // content.test.ts mirrors exactly this sequence, so an overlap like
    // this fails CI rather than silently dropping the second card.
    expect(unmatchedEdits).toHaveLength(1);
    expect((unmatchedEdits[0] as { termId?: string }).termId).toBe("b");
    expect(htmlOf(parts)).toMatch(/<span class="ax-gloss"[^>]*data-gloss="a"[^>]*>beats attention<\/span>/);
  });

  it("tier-1 point and tier-2 edits coexist in one section", () => {
    const { parts } = applyPaperEdits(HTML, TOC, [
      { op: "hide", at: ref("b-0008", "Sub para.") },
      { op: "activity", after: { sectionEnd: "ax-sec-a-1" }, items: [{ kind: "exercise", id: "x" }] },
    ]);
    const kinds = parts.map((p) => p.kind);
    expect(kinds).toEqual(["html", "activity", "html"]);
    expect((parts[0] as { html: string }).html).toContain("··· 1 paragraph hidden ···");
  });
});
