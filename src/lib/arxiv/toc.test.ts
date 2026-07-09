import { describe, expect, it } from "vitest";
import { convertLatexToHtml } from "./convert";
import { parseArxivId } from "./id";

const id = parseArxivId("2301.12345v1")!;

function convert(tex: string) {
  return convertLatexToHtml(tex, { id, files: new Map() });
}

const DOC = (body: string) =>
  `\\documentclass{article}\\begin{document}\n${body}\n\\end{document}`;

describe("toc extraction", () => {
  it("extracts numbered sections at their heading levels, in document order", () => {
    const { toc } = convert(
      DOC(
        [
          "\\section{Introduction}",
          "Intro text.",
          "\\section{Model}",
          "\\subsection{Encoder}",
          "Encoder text.",
          "\\subsubsection{Layers}",
          "Layer text.",
          "\\section{Conclusion}",
          "Done.",
        ].join("\n"),
      ),
    );
    const sections = toc.filter((e) => e.kind === "section");
    expect(sections.map((e) => [e.number, e.title, e.level])).toEqual([
      ["1", "Introduction", 2],
      ["2", "Model", 2],
      ["2.1", "Encoder", 3],
      ["2.1.1", "Layers", 4],
      ["3", "Conclusion", 2],
    ]);
    for (const entry of sections) {
      expect(entry.id).toMatch(/^ax-sec-/);
    }
  });

  it("titles exclude the section number text", () => {
    const { toc } = convert(DOC("\\section{Background}\nText."));
    const section = toc.find((e) => e.kind === "section")!;
    expect(section.title).toBe("Background");
    expect(section.title).not.toContain("1");
  });

  it("unnumbered (starred) sections get an empty number", () => {
    const { toc } = convert(
      DOC("\\section*{Acknowledgements}\nThanks everyone."),
    );
    const section = toc.find(
      (e) => e.kind === "section" && e.title === "Acknowledgements",
    );
    expect(section).toBeDefined();
    expect(section!.number).toBe("");
  });

  it("stamps and lists the abstract landmark, without a duplicate section entry", () => {
    const { html, toc } = convert(
      DOC("\\begin{abstract}We study things.\\end{abstract}\n\\section{Intro}\nText."),
    );
    expect(html).toContain('id="ax-abstract"');
    const abstract = toc.filter((e) => e.kind === "abstract");
    expect(abstract).toEqual([
      { kind: "abstract", id: "ax-abstract", title: "Abstract", number: "", level: 2 },
    ]);
    // The abstract's inner h2 has no ax-sec id and must not leak in as a section.
    expect(toc.filter((e) => e.kind === "section")).toHaveLength(1);
    expect(toc[0].kind).toBe("abstract"); // document order
  });

  it("stamps and lists the references landmark", () => {
    const { html, toc } = convert(
      DOC(
        [
          "\\section{Intro}",
          "See \\cite{smith}.",
          "\\begin{thebibliography}{9}",
          "\\bibitem{smith} A. Smith. A paper. 2020.",
          "\\end{thebibliography}",
        ].join("\n"),
      ),
    );
    expect(html).toContain('id="ax-references"');
    const refs = toc.find((e) => e.kind === "references");
    expect(refs).toMatchObject({ id: "ax-references", title: "References", level: 2 });
  });

  it("extracts titles with inline math as readable text, not KaTeX markup", () => {
    const { toc } = convert(DOC("\\section{Bounding $\\epsilon$-error}\nText."));
    const section = toc.find((e) => e.kind === "section")!;
    expect(section.title).not.toContain("katex");
    expect(section.title).not.toContain("<");
    expect(section.title).toContain("error");
  });

  it("dedupes repeated landmark ids (two bibliographies)", () => {
    const { html, toc } = convert(
      DOC(
        [
          "\\section{Intro}",
          "See \\cite{a}.",
          "\\begin{thebibliography}{9}\\bibitem{a} First bib.\\end{thebibliography}",
          "\\section{Supplementary}",
          "Supp text \\cite{b}.",
          "\\begin{thebibliography}{9}\\bibitem{b} Second bib.\\end{thebibliography}",
        ].join("\n"),
      ),
    );
    const refs = toc.filter((e) => e.kind === "references");
    expect(refs.map((e) => e.id)).toEqual(["ax-references", "ax-references-2"]);
    expect(html).toContain('id="ax-references"');
    expect(html).toContain('id="ax-references-2"');
    // All toc ids unique — split offsets stay monotonic.
    expect(new Set(toc.map((e) => e.id)).size).toBe(toc.length);
  });

  it("nests sections under chapters in report-class sources", () => {
    const { toc } = convert(
      "\\documentclass{report}\\begin{document}\n" +
        [
          "\\chapter{One}",
          "Chapter intro.",
          "\\section{First}",
          "Section body.",
          "\\chapter{Two}",
          "More.",
        ].join("\n") +
        "\n\\end{document}",
    );
    const sections = toc.filter((e) => e.kind === "section");
    expect(sections.map((e) => [e.number, e.title, e.level])).toEqual([
      ["1", "One", 2],
      ["1.1", "First", 3],
      ["2", "Two", 2],
    ]);
  });

  it("keeps toc ids findable in the serialized HTML", () => {
    const { html, toc } = convert(
      DOC("\\section{Alpha}\nA.\n\\subsection{Beta}\nB."),
    );
    for (const entry of toc) {
      expect(html).toContain(` id="${entry.id}"`);
    }
  });
});
