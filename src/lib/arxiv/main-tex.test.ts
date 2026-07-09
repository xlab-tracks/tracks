import { describe, expect, it } from "vitest";
import { decodeTexBytes, resolveMainTex } from "./main-tex";

const enc = (s: string) => new TextEncoder().encode(s);

function filesFrom(entries: Record<string, string>): Map<string, Uint8Array> {
  return new Map(Object.entries(entries).map(([k, v]) => [k, enc(v)]));
}

describe("main tex detection", () => {
  it("uses the only .tex file when there is exactly one", () => {
    const result = resolveMainTex(
      filesFrom({ "whatever.tex": "\\documentclass{article}", "a.png": "" }),
    );
    expect(result?.mainFile).toBe("whatever.tex");
  });

  it("honors 00README.json toplevel declarations", () => {
    const result = resolveMainTex(
      filesFrom({
        "00README.json": JSON.stringify({
          sources: [
            { filename: "supplement.tex", usage: "include" },
            { filename: "real-main.tex", usage: "toplevel" },
          ],
        }),
        "real-main.tex": "\\documentclass{article}\\begin{document}x\\end{document}",
        "supplement.tex": "\\documentclass{article}\\begin{document}y\\end{document}",
      }),
    );
    expect(result?.mainFile).toBe("real-main.tex");
  });

  it("prefers \\documentclass + \\begin{document} over included files", () => {
    const result = resolveMainTex(
      filesFrom({
        "intro.tex": "Some section text.",
        "paper.tex":
          "\\documentclass{article}\\begin{document}\\input{intro}\\end{document}",
      }),
    );
    expect(result?.mainFile).toBe("paper.tex");
  });

  it("ignores commented-out \\documentclass", () => {
    const result = resolveMainTex(
      filesFrom({
        "notes.tex": "% \\documentclass{article} draft scaffold",
        "main.tex": "\\documentclass{article}\\begin{document}x\\end{document}",
      }),
    );
    expect(result?.mainFile).toBe("main.tex");
  });

  it("returns null when nothing has a \\documentclass", () => {
    expect(
      resolveMainTex(filesFrom({ "a.tex": "one", "b.tex": "two" })),
    ).toBeNull();
  });
});

describe("flattening", () => {
  it("splices \\input and \\include, appending .tex when extensionless", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\n\\input{sections/intro}\n\\include{ch1}\n\\end{document}",
        "sections/intro.tex": "INTRO-BODY",
        "ch1.tex": "CHAPTER-ONE",
      }),
    );
    expect(result?.texSource).toContain("INTRO-BODY");
    expect(result?.texSource).toContain("CHAPTER-ONE");
    expect(result?.texSource).not.toContain("\\input{sections/intro}");
  });

  it("does not resurrect commented-out \\input lines", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\n% \\input{dead}\nlive\n\\end{document}",
        "other.tex": "irrelevant",
      }),
    );
    expect(result?.texSource).toContain("% \\input{dead}");
    expect(result?.warnings ?? []).not.toContain("unresolved \\input{dead}");
  });

  it("does not mistake \\includegraphics for \\include", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\\includegraphics{fig1}\\end{document}",
        "extra.tex": "unused",
      }),
    );
    expect(result?.texSource).toContain("\\includegraphics{fig1}");
    expect(result?.warnings).toEqual([]);
  });

  it("allows the same file to be \\input more than once", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\n\\input{notation}\nBODY\n\\input{notation}\n\\end{document}",
        "notation.tex": "NOTATION-TABLE",
      }),
    );
    const occurrences = result!.texSource.split("NOTATION-TABLE").length - 1;
    expect(occurrences).toBe(2);
    expect(result?.warnings.some((w) => w.includes("circular"))).toBe(false);
  });

  it("survives circular includes with a warning", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\n\\input{a}\n\\end{document}",
        "a.tex": "A-TOP \\input{b}",
        "b.tex": "B-TOP \\input{a}",
      }),
    );
    expect(result?.texSource).toContain("A-TOP");
    expect(result?.texSource).toContain("B-TOP");
    expect(result?.warnings.some((w) => w.includes("circular"))).toBe(true);
  });

  it("leaves unresolved \\input in place with a warning", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\\input{ghost}\\end{document}",
        "pad.tex": "unused",
      }),
    );
    expect(result?.texSource).toContain("\\input{ghost}");
    expect(result?.warnings.some((w) => w.includes("ghost"))).toBe(true);
  });
});

describe(".bbl splicing", () => {
  it("replaces \\bibliography with the main file's .bbl", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\n\\bibliography{refs,more-refs}\n\\end{document}",
        "main.bbl":
          "\\begin{thebibliography}{9}\\bibitem{k} K.\\end{thebibliography}",
        "pad.tex": "unused",
      }),
    );
    expect(result?.texSource).toContain("\\begin{thebibliography}");
    expect(result?.texSource).not.toContain("\\bibliography{refs");
  });

  it("warns when no .bbl exists", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\\bibliography{refs}\\end{document}",
        "pad.tex": "unused",
      }),
    );
    expect(result?.warnings.some((w) => w.includes(".bbl"))).toBe(true);
  });

  it("leaves \\bibliographystyle alone", () => {
    const result = resolveMainTex(
      filesFrom({
        "main.tex":
          "\\documentclass{article}\\begin{document}\\bibliographystyle{plain}\\end{document}",
        "pad.tex": "unused",
      }),
    );
    expect(result?.texSource).toContain("\\bibliographystyle{plain}");
  });
});

describe("decodeTexBytes", () => {
  it("decodes UTF-8", () => {
    expect(decodeTexBytes(enc("naïve ↦ test"))).toBe("naïve ↦ test");
  });

  it("falls back to latin1 for non-UTF-8 bytes", () => {
    // "café" in latin1: 0xe9 is invalid as a UTF-8 sequence here.
    const latin1 = new Uint8Array([0x63, 0x61, 0x66, 0xe9]);
    expect(decodeTexBytes(latin1)).toBe("café");
  });
});
