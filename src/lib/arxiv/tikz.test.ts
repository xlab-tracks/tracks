import { describe, expect, it } from "vitest";
import {
  buildTikzPreamble,
  extractTikzPictures,
  renderTikzDiagrams,
  tikzAssetPath,
  TIKZ_MANIFEST_PATH,
} from "./tikz";

describe("extractTikzPictures", () => {
  it("collects diagrams in document order, including wrapper-macro args", () => {
    const jobs = extractTikzPictures(
      "\\begin{document}" +
        "\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}" +
        "\\resizebox{\\textwidth}{!}{\\begin{tikzpicture}\\node {x};\\end{tikzpicture}}" +
        "\\end{document}",
    );
    expect(jobs.length).toBe(2);
    expect(jobs[0].source).toContain("draw");
    expect(jobs[1].source).toContain("node");
  });

  it("skips diagrams inside definition bodies", () => {
    const jobs = extractTikzPictures(
      "\\newcommand{\\dia}{\\begin{tikzpicture}\\draw (0,0);\\end{tikzpicture}}" +
        "\\begin{document}text only\\end{document}",
    );
    expect(jobs.length).toBe(0);
  });
});

describe("buildTikzPreamble", () => {
  const source =
    "\\usetikzlibrary{calc,arrows.meta}\n" +
    "\\usetikzlibrary{positioning}\n" +
    "\\definecolor{mygreen}{HTML}{2E7D32}\n" +
    "\\newcommand{\\modelname}{GPT-5\\xspace}\n" +
    "\\renewcommand{\\sectionautorefname}{Section}\n" +
    "\\newenvironment{mybox}[1][]{\\def\\lbl{#1}}{}\n" +
    "\\begin{document}x\\end{document}";

  it("merges libraries and regenerates colors", () => {
    const pre = buildTikzPreamble(source);
    expect(pre.libraries).toContain("calc");
    expect(pre.libraries).toContain("positioning");
    expect(pre.preamble).toContain("\\definecolor{mygreen}{HTML}{2E7D32}");
  });

  it("hardens command definitions and skips env-definition bodies", () => {
    const pre = buildTikzPreamble(source);
    // newcommand → collision-proof provide+renew form
    expect(pre.preamble).toContain(
      "\\providecommand{\\modelname}{}\\renewcommand{\\modelname}",
    );
    // renewcommand of a possibly-undefined command gets a shim
    expect(pre.preamble).toContain(
      "\\providecommand{\\sectionautorefname}{}\\renewcommand{\\sectionautorefname}",
    );
    // \def\lbl{#1} lives inside a \newenvironment body — must NOT leak
    // (bare #1 at top level is a hard TeX error).
    expect(pre.preamble).not.toContain("\\lbl");
    // kernel shims present
    expect(pre.preamble).toContain("\\providecommand{\\xspace}{}");
  });
});

describe("renderTikzDiagrams", () => {
  it("compiles a diagram using paper macros/colors to an SVG asset", async () => {
    const files = new Map<string, Uint8Array>();
    await renderTikzDiagrams(
      "\\definecolor{mygreen}{HTML}{2E7D32}\n" +
        "\\newcommand{\\lbl}{model\\xspace}\n" +
        "\\begin{document}\\begin{tikzpicture}" +
        "\\draw[fill=mygreen!30] (0,0) rectangle (2,1);" +
        "\\node at (1,0.5) {\\lbl};" +
        "\\end{tikzpicture}\\end{document}",
      files,
    );
    const svg = files.get(tikzAssetPath(0));
    expect(svg).toBeInstanceOf(Uint8Array);
    const text = new TextDecoder().decode(svg);
    expect(text.startsWith("<svg")).toBe(true);
    expect(text).toContain("@font-face"); // fonts embedded for <img> use
    expect(files.has(TIKZ_MANIFEST_PATH)).toBe(true);
    // The viewport must hug the picture: defs injected into the document
    // body once inflated the page to ~3000pt and diagrams rendered tiny.
    const viewBox = /viewBox=['"]-72 -72 ([\d.]+) ([\d.]+)['"]/.exec(text);
    expect(viewBox).not.toBeNull();
    expect(parseFloat(viewBox![1])).toBeLessThan(100); // 2cm rect ≈ 57pt
  }, 60000);

  it("survives an uncompilable diagram without an asset", async () => {
    const files = new Map<string, Uint8Array>();
    await renderTikzDiagrams(
      "\\begin{document}\\begin{tikzpicture}\\undefinedcmd{boom}\\end{tikzpicture}\\end{document}",
      files,
    );
    expect(files.has(tikzAssetPath(0))).toBe(false);
  }, 60000);
});
