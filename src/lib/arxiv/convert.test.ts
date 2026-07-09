import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { convertLatexToHtml } from "./convert";
import { extractTarball } from "./extract";
import { parseArxivId } from "./id";
import { resolveMainTex } from "./main-tex";

const id = parseArxivId("2301.12345v1")!;

function convert(tex: string) {
  return convertLatexToHtml(tex, { id, files: new Map() });
}

const DOC = (body: string) =>
  `\\documentclass{article}\\begin{document}\n${body}\n\\end{document}`;

describe("convertLatexToHtml", () => {
  it("renders prose, sections, and emphasis", () => {
    const { html } = convert(
      DOC("\\section{Introduction}\nHello \\emph{world}."),
    );
    expect(html).toContain("Introduction");
    expect(html).toContain("<em");
    expect(html).toContain("Hello");
  });

  it("renders inline and display math with KaTeX", () => {
    const { html } = convert(
      DOC("Let $x^2 + y^2 = z^2$ hold.\n\\begin{equation}E = mc^2\\end{equation}"),
    );
    expect(html).toContain("katex");
    expect(html).not.toContain("$x^2");
  });

  it("strips javascript: links from \\href", () => {
    const { html } = convert(
      DOC("\\href{javascript:alert(1)}{click} and \\href{https://ok.example}{fine}"),
    );
    expect(html).not.toContain("javascript:");
    expect(html).toContain("https://ok.example");
  });

  it("strips inline styles from author content", () => {
    // tabular alignment is emitted as inline styles by unified-latex;
    // sanitize must remove them. (KaTeX styles and our own validated
    // color styles are added post-sanitize and are the only exceptions.)
    const { html } = convert(
      DOC("\\begin{tabular}{|c|r|}a & b\\\\\\end{tabular}"),
    );
    expect(html).toContain("<table");
    const styles = [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1]);
    for (const style of styles) {
      expect(style).toMatch(
        /^((background-)?color:#[0-9a-f]{6};?)+$|katex/,
      );
    }
  });

  it("renders \\cellcolor/\\rowcolor/\\textcolor with resolved xcolor values", () => {
    const { html } = convert(
      DOC(
        [
          "\\definecolor{headbase}{HTML}{C8E6C9}",
          "\\colorlet{head}{headbase!50!white}",
          "\\begin{tabular}{|c|}\\hline\\cellcolor{head}Header \\\\ \\hline Body \\\\ \\hline\\end{tabular}",
          "Also \\textcolor{red}{warning text} inline.",
        ].join("\n"),
      ),
    );
    // headbase #C8E6C9 mixed 50% with white (rounded) = #e4f3e4
    expect(html).toContain('style="background-color:#e4f3e4"');
    expect(html).toContain('style="color:#ff0000"');
    expect(html).toContain("warning text");
    expect(html).not.toContain("headbase"); // color setup never leaks
    expect(html).not.toContain("dataAxBg");
    expect(html).not.toContain("data-ax-bg");
  });

  it("renders multicols as CSS column containers", () => {
    const { html } = convert(
      DOC(
        "\\begin{multicols}{3}Box one text.\n\nBox two text.\\end{multicols}",
      ),
    );
    expect(html).toContain("ax-multicols");
    expect(html).toContain("ax-cols-3");
    expect(html).toContain("Box one text.");
    expect(html).not.toMatch(/>3</); // the {3} arg doesn't leak as text
  });

  it("keeps content of unknown macros and records a warning", () => {
    const result = convert(DOC("\\unknowncmd{kept text}"));
    expect(result.html).toContain("kept text");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("numbers sections and equations, resolving \\ref/\\eqref links", () => {
    const { html, warnings } = convert(
      DOC(
        [
          "\\section{Setup}\\label{sec:setup}",
          "\\begin{equation}\\label{eq:loss}L = 1\\end{equation}",
          "\\section{Results}",
          "As shown in \\eqref{eq:loss} and \\cref{sec:setup}.",
        ].join("\n"),
      ),
    );
    expect(html).toContain('id="ax-sec-setup"');
    expect(html).toContain('class="ax-secnum"');
    expect(html).toContain('id="ax-eq-1"');
    expect(html).toContain('href="#ax-eq-1"');
    expect(html).toContain("(1)</a>");
    expect(html).toContain('href="#ax-sec-setup"');
    expect(html).toContain("section 1</a>");
    expect(warnings.filter((w) => w.code === "unresolved-ref")).toEqual([]);
  });

  it("keeps \\ref working when a paper redefines \\label (hyperref-style)", () => {
    // The paper wraps \label to also write custom .aux data (via \oldlabel).
    // Expanding that wrapper would break every \ref and leak aux internals.
    const { html, warnings } = convert(
      "\\documentclass{article}" +
        "\\let\\oldlabel\\label" +
        "\\renewcommand{\\label}[1]{\\protected@write\\@auxout{}{extra}\\oldlabel{#1}}" +
        "\\begin{document}" +
        "\\section{Setup}\\label{sec:setup}" +
        "As in \\cref{sec:setup}." +
        "\\end{document}",
    );
    expect(html).toContain('id="ax-sec-setup"');
    expect(html).toContain("section 1</a>"); // \cref resolves, not "?"
    expect(html).not.toContain("protected@write"); // no aux internals leak
    expect(html).not.toContain("oldlabel");
    expect(warnings.filter((w) => w.code === "unresolved-ref")).toEqual([]);
  });

  it("expands user \\newcommand macros including in math", () => {
    const { html } = convert(
      "\\documentclass{article}\\newcommand{\\model}{Transformer}" +
        "\\newcommand{\\loss}[1]{\\mathcal{L}_{#1}}" +
        "\\begin{document}The \\model{} minimizes $\\loss{train}$.\\end{document}",
    );
    expect(html).toContain("Transformer");
    expect(html).not.toContain("\\model");
    expect(html).toContain("katex");
    // \mathcal{L} rendered by KaTeX, not left as literal TeX prose
    expect(html).not.toContain("\\loss");
  });

  it("links citations to a generated references section with back-links", () => {
    const { html, warnings } = convert(
      DOC(
        [
          "Sequence models \\citep{smith2020} are neat \\citep[p.~3]{doe2021}.",
          "\\begin{thebibliography}{9}",
          "\\bibitem{smith2020} Smith. \\newblock A paper.",
          "\\bibitem{doe2021} Doe. \\newblock Another paper.",
          "\\end{thebibliography}",
        ].join("\n"),
      ),
    );
    expect(html).toContain('href="#ax-ref-smith2020"');
    expect(html).toContain(">1</a>");
    expect(html).toContain('<li id="ax-ref-smith2020"');
    expect(html).toContain("References");
    expect(html).toContain('class="ax-backlink"');
    expect(html).toMatch(/, p\.[\s\u00a0]3\]/); // post-note survives (~ becomes nbsp)
    expect(warnings.filter((w) => w.code === "unknown-citation")).toEqual([]);
  });

  it("renders theorem environments with numbers and names", () => {
    const { html } = convert(
      "\\documentclass{article}\\newtheorem{thm}{Theorem}\\newtheorem{lem}[thm]{Lemma}" +
        "\\begin{document}" +
        "\\begin{thm}\\label{thm:main}Main claim.\\end{thm}" +
        "\\begin{lem}[Helper]Aux claim.\\end{lem}" +
        "See \\cref{thm:main}." +
        "\\begin{proof}Trivial.\\end{proof}" +
        "\\end{document}",
    );
    expect(html).toContain("Theorem 1");
    expect(html).toContain("Lemma 2"); // shared counter via [thm]
    expect(html).toContain("(Helper)");
    expect(html).toContain("theorem 1</a>");
    expect(html).toContain("Proof.");
    expect(html).toContain("∎");
  });

  it("turns footnotes into linked end-notes", () => {
    const { html } = convert(DOC("Claim.\\footnote{Fine print.} More."));
    expect(html).toContain('id="ax-fnref-1"');
    expect(html).toContain('href="#ax-fn-1"');
    expect(html).toContain("Fine print.");
    expect(html).toContain("Footnotes");
  });

  it("resolves figures against the file map and placeholders the rest", () => {
    const files = new Map<string, Uint8Array>([
      ["figs/arch.png", new Uint8Array([1])],
      ["figs/plot.pdf", new Uint8Array([1])],
    ]);
    const result = convertLatexToHtml(
      DOC(
        [
          "\\begin{figure}\\includegraphics{figs/arch}\\caption{The arch.}\\label{fig:arch}\\end{figure}",
          "\\begin{figure}\\includegraphics{figs/plot}\\caption{A plot.}\\end{figure}",
          "\\begin{figure}\\includegraphics{gone}\\caption{Lost.}\\end{figure}",
          "See \\ref{fig:arch}.",
        ].join("\n"),
      ),
      { id, files },
    );
    expect(result.html).toContain(
      'src="/arxiv/2301.12345v1/assets/figs/arch.png"',
    );
    expect(result.html).toContain("Figure 1: ");
    expect(result.html).toContain('id="ax-fig-1"');
    expect(result.html).toContain('href="#ax-fig-1"');
    expect(result.html).toContain("ax-placeholder");
    expect(result.usedAssets).toEqual(["figs/arch.png", "figs/plot.pdf"]);
    expect(
      result.warnings.some((w) => w.code === "missing-graphic"),
    ).toBe(true);
  });

  it("uses a rasterized PNG for a PDF figure when the pipeline made one", () => {
    // Pipeline rasterizes vis/fig.pdf → vis/fig.pdf.png before conversion.
    const files = new Map<string, Uint8Array>([
      ["vis/fig.pdf", new Uint8Array([1])],
      ["vis/fig.pdf.png", new Uint8Array([2])],
    ]);
    const result = convertLatexToHtml(
      DOC("\\begin{figure}\\includegraphics{vis/fig.pdf}\\caption{Viz.}\\end{figure}"),
      { id, files },
    );
    // Renders as an inline image of the rasterized PNG, not a placeholder.
    expect(result.html).toContain(
      'src="/arxiv/2301.12345v1/assets/vis/fig.pdf.png"',
    );
    expect(result.html).not.toContain("ax-placeholder");
    expect(result.usedAssets).toEqual(["vis/fig.pdf.png"]);
    // The raw PDF is not stored — only the rendered PNG.
    expect(result.usedAssets).not.toContain("vis/fig.pdf");
  });

  it("renders multicolumn/multirow/rule tables without leaking args", () => {
    const { html } = convert(
      DOC(
        [
          "\\begin{table}\\begin{tabular}{lcccc}",
          "\\multirow{2}{*}{Model} & \\multicolumn{2}{c}{BLEU} & \\multicolumn{2}{c}{Cost} \\\\",
          "& EN-DE & EN-FR & EN-DE & EN-FR \\\\ \\hline",
          "\\rule{0pt}{2.2ex}Transformer & 27.3 & 38.1 & \\multicolumn{2}{c}{$3.3\\cdot10^{18}$} \\\\",
          "\\end{tabular}\\caption{Results.}\\end{table}",
        ].join("\n"),
      ),
    );
    // \multirow / \multicolumn / \rule args no longer leak as text.
    expect(html).not.toContain("2*Model");
    expect(html).not.toContain("2c");
    expect(html).not.toContain("0pt");
    // multicolumn becomes a real spanning cell...
    expect(html).toContain('colspan="2"');
    expect(html).toContain(">Model</td>");
    // ...and math inside a spanned cell renders (no literal TeX in the cell).
    expect(html).toMatch(/colspan="2"[^>]*><span class="inline-math">/);
    expect(html).toContain("katex");
    expect(html).not.toContain("$3.3");
  });

  it("renders vertical column dividers from the spec", () => {
    const { html } = convert(
      DOC(
        [
          "\\begin{tabular}{c|cc|c}",
          "A & B & C & D \\\\",
          "\\multicolumn{2}{|c|}{Span} & E & F \\\\",
          "\\end{tabular}",
        ].join("\n"),
      ),
    );
    // `c|cc|c`: divider after col 0 (left of col 1) and after col 2 (left of col 3).
    expect(html).toContain("ax-border-l");
    // The \multicolumn{2}{|c|}{...} carries its own left+right dividers.
    expect(html).toMatch(/class="[^"]*ax-border-l ax-border-r[^"]*"[^>]*colspan="2"/);
  });

  it("draws table rules only where they occur, not on every row", () => {
    const { html } = convert(
      DOC(
        [
          "\\begin{tabular}{lcc}",
          "\\toprule",
          "Model & A & B \\\\",
          "\\midrule",
          "X & 1 & 2 \\\\",
          "Y & 3 & 4 \\\\",
          "Z & 5 & 6 \\\\",
          "\\bottomrule",
          "\\end{tabular}",
        ].join("\n"),
      ),
    );
    const tops = (html.match(/ax-rule-top/g) ?? []).length;
    const bottoms = (html.match(/ax-rule-bottom/g) ?? []).length;
    // toprule (header) + midrule (first data row) = 2 top rules; bottomrule = 1.
    expect(tops).toBe(2);
    expect(bottoms).toBe(1);
    // The data rows X/Y/Z carry no inter-row borders.
    expect((html.match(/<tr/g) ?? []).length).toBe(4);
  });

  it("keeps equation counter in sync after multi-row align (no drift)", () => {
    const { html, warnings } = convert(
      DOC(
        [
          "\\begin{align}a &= b \\label{eq:one}\\\\ c &= d \\label{eq:two}\\end{align}",
          "\\begin{equation}\\label{eq:three}e = f\\end{equation}",
          "See \\eqref{eq:three}.",
        ].join("\n"),
      ),
    );
    // The 2-row align consumes numbers 1 and 2, so the next equation is (3) —
    // exactly as the published PDF numbers it (counter stays in sync).
    expect(html).toContain('id="ax-eq-3"');
    expect(html).toContain("(3)</a>");
    // Two labels sharing one align number is surfaced, not silent.
    expect(warnings.some((w) => w.code === "equation-numbering")).toBe(true);
  });

  it("inserts the equation tag before a trailing \\\\ (no phantom row)", () => {
    const { html } = convert(DOC("\\begin{align}x &= 1 \\\\\\end{align}"));
    // \tag lands before the trailing row break, on the real row.
    expect(html).toContain("\\tag{1}\\\\");
    expect(html).toContain('class="tag"');
  });

  it("numbers appendix sections with letters and resolves cross-refs", () => {
    const { html, warnings } = convert(
      DOC(
        [
          "\\section{Intro}\\label{sec:intro}",
          "\\appendix",
          "\\section{Proofs}\\label{app:proofs}",
          "\\subsection{Lemmas}\\label{app:lemmas}",
          "See \\cref{app:proofs} and \\cref{app:lemmas} and \\cref{sec:intro}.",
        ].join("\n"),
      ),
    );
    // Appendix heading numbers switch to letters (A, A.1); \cref says "appendix A".
    expect(html).toContain('class="ax-secnum">A</span>');
    expect(html).toContain("appendix A</a>");
    expect(html).toContain('class="ax-secnum">A.1</span>'); // appendix subsection
    expect(html).toContain("section 1</a>"); // pre-appendix section unchanged
    expect(warnings.filter((w) => w.code === "unresolved-ref")).toEqual([]);
  });

  it("recovers captions nested in center/minipage inside floats", () => {
    const files = new Map([["fig.png", new Uint8Array([1])]]);
    const result = convertLatexToHtml(
      DOC(
        "\\begin{figure}\\begin{center}\\includegraphics{fig}\\caption{Nested cap.}\\end{center}\\end{figure}",
      ),
      { id, files },
    );
    expect(result.html).toContain("Nested cap.");
    expect(result.html).toContain("<figcaption");
    expect(result.warnings.some((w) => w.detail?.includes("caption"))).toBe(
      false,
    );
  });

  it("reads \\citep[pre][]{k} as a pre-note, not a post-note", () => {
    const { html } = convert(
      DOC(
        [
          "Text \\citep[see][]{smith2020} more \\citep[p.~3]{smith2020}.",
          "\\begin{thebibliography}{9}\\bibitem{smith2020} Smith. \\newblock X.\\end{thebibliography}",
        ].join("\n"),
      ),
    );
    expect(html).toContain("[see "); // pre-note before the number
    expect(html).toMatch(/\[<a[^>]*>1<\/a>, p\./); // post-note after
    expect(html).not.toContain("1, see"); // the old bug
  });

  it("does not resurrect commented-out \\def in the KaTeX macro table", () => {
    const { html } = convert(
      "\\documentclass{article}\\def\\w{\\alpha}\n% \\def\\w{\\beta}\n\\begin{document}$\\w$\\end{document}",
    );
    // KaTeX renders \alpha (α), never the commented \beta.
    expect(html).toContain("α");
    expect(html).not.toContain("β");
  });

  it("consumes glue values so they do not leak into prose", () => {
    const { html } = convert(
      DOC("Tight\\looseness=-1 paragraph and \\vskip 5pt plus 1pt spaced."),
    );
    expect(html).not.toContain("=-1");
    expect(html).not.toContain("5pt");
    expect(html).not.toContain("plus 1pt");
    expect(html).toContain("paragraph");
    expect(html).toContain("spaced");
  });

  it("strips \\label inside a section title (no junk, refs resolve)", () => {
    const { html, warnings } = convert(
      DOC("\\section{Intro\\label{sec:intro}}\nSee \\cref{sec:intro}."),
    );
    expect(html).toContain('id="ax-sec-intro"');
    expect(html).not.toContain("sec:intro</"); // no visible label text
    expect(html).not.toContain("macro-label");
    expect(html).toContain("section 1</a>");
    expect(warnings.filter((w) => w.code === "unresolved-ref")).toEqual([]);
  });

  it("survives \\textsuperscript without aborting the rest of the document", () => {
    // unified-latex's own handler throws an unhandled rejection here, which
    // used to silently kill conversion of EVERYTHING after the first use.
    const { html } = convert(
      DOC(
        "First\\textsuperscript{2} then\\textsubscript{i}.\n\\section{Later}\nStill \\textbf{converted}.",
      ),
    );
    expect(html).toContain("<sup");
    expect(html).toContain(">2</sup>");
    expect(html).toContain("<sub");
    expect(html).toContain('id="ax-sec-later"'); // sections after it survive
    expect(html).toContain("<b"); // formatting after it survives
    expect(html).not.toContain("macro-textsuperscript");
  });

  it("expands \\def text macros so their content renders in prose", () => {
    const { html } = convert(
      "\\documentclass{article}\\def\\modelname{GPT-5}\\def\\wrap#1{[#1]}" +
        "\\begin{document}We test \\modelname{} and \\wrap{this}.\\end{document}",
    );
    expect(html).toContain("GPT-5");
    expect(html).toContain("[this]");
    expect(html).not.toContain("macro-modelname");
  });

  it("expands \\let aliases without stealing following words", () => {
    const { html } = convert(
      DOC("\\let\\B\\textbf Also \\B{bold} text."),
    );
    expect(html).toMatch(/Also\s/); // "Also" not swallowed as an argument
    expect(html).toMatch(/<b[^>]*>bold<\/b>/);
  });

  it("expands \\newenvironment uses with args substituted", () => {
    const { html } = convert(
      "\\documentclass{article}" +
        "\\NewDocumentEnvironment{finding}{m}{\\textbf{Finding: #1.}}{}" +
        "\\newenvironment{transcript}[1][]{}{}" +
        "\\begin{document}" +
        "\\begin{finding}{Deception}The model schemed.\\end{finding}" +
        "\\begin{transcript}[label-xyz]Body text.\\end{transcript}" +
        "\\end{document}",
    );
    expect(html).toContain("Finding: Deception.");
    expect(html).toContain("The model schemed.");
    expect(html).not.toContain("[label-xyz]"); // env optional arg swallowed
    expect(html).toContain("Body text.");
  });

  it("never leaks internal \\html-tag markup from captions in unknown envs", () => {
    const { html } = convert(
      DOC(
        "\\begin{labeledbox}\nStuff\n\\caption{Results for \\textbf{Model A} on tasks.}\n\\end{labeledbox}",
      ),
    );
    expect(html).not.toContain("html-tag");
    expect(html).not.toContain("macro-caption");
    expect(html).toContain("Results for");
    expect(html).toMatch(/<b[^>]*>Model A<\/b>/);
  });

  it("strips mid-document \\definecolor/\\newlength setup garbage", () => {
    const { html } = convert(
      DOC(
        "Before. \\definecolor{mycolor}{HTML}{C8E6C9}\\colorlet{shade}{mycolor!70!white}\\newlength{\\ysep} After.",
      ),
    );
    expect(html).not.toContain("C8E6C9");
    expect(html).not.toContain("mycolor");
    expect(html).not.toContain("ysep");
    expect(html).toContain("Before.");
    expect(html).toContain("After.");
  });

  it("unwraps \\resizebox/\\scalebox around tables and figures", () => {
    const files = new Map([["fig.png", new Uint8Array([1])]]);
    const result = convertLatexToHtml(
      DOC(
        "\\resizebox{\\textwidth}{!}{\\begin{tabular}{cc}a & b\\\\\\end{tabular}}\n" +
          "\\scalebox{0.5}{\\includegraphics{fig}}",
      ),
      { id, files },
    );
    expect(result.html).toContain("<table");
    expect(result.html).toContain("<img");
    expect(result.html).not.toContain("html-tag");
  });

  it("converts longtable with caption and no leaked markers", () => {
    const { html } = convert(
      DOC(
        [
          "\\begin{longtable}{lcc}",
          "\\caption{Long results.}\\\\",
          "\\toprule Name & A & B \\\\ \\midrule\\endhead",
          "X & 1 & 2 \\\\",
          "\\bottomrule",
          "\\end{longtable}",
        ].join("\n"),
      ),
    );
    expect(html).toContain("<table");
    expect(html).toContain("Long results.");
    expect(html).not.toContain("endhead");
    expect(html).not.toContain("lcc");
    expect(html).toMatch(/>\s*X\s*<\/td>/);
  });

  it("renders \\ensuremath in text mode as math", () => {
    const { html } = convert(DOC("The value \\ensuremath{\\alpha^2} is small."));
    expect(html).toContain("katex");
    expect(html).not.toContain("ensuremath");
  });

  it("keeps \\eqref inside math from destroying the formula", () => {
    const { html, warnings } = convert(
      DOC(
        "\\begin{equation}\\label{eq:a}x = 1\\end{equation}\n" +
          "\\begin{equation}y \\text{ as in \\eqref{eq:a}}\\end{equation}",
      ),
    );
    expect((html.match(/katex-error/g) ?? []).length).toBe(0);
    expect(warnings.filter((w) => w.code === "katex-error")).toEqual([]);
  });

  it("renders symbol and formatting text macros", () => {
    const { html } = convert(
      DOC(
        "\\LaTeX{} beats plain \\TeX. Ranges 1--5, math \\textless{}5\\textgreater. " +
          "\\textsc{OpenAI} models\\newline next line. Struck \\sout{old} text.",
      ),
    );
    expect(html).toContain("LaTeX");
    expect(html).toContain("&#x3C;5>"); // \textless renders <
    expect(html).toContain('class="ax-sc"');
    expect(html).toContain("<br");
    expect(html).toContain("<s");
    expect(html).not.toContain("macro-textsc");
  });

  it("resolves figures through \\graphicspath directories", () => {
    const files = new Map([["figures/plot.png", new Uint8Array([1])]]);
    const result = convertLatexToHtml(
      DOC(
        "\\graphicspath{{figures/}}\\begin{figure}\\includegraphics{plot}\\caption{P.}\\end{figure}",
      ),
      { id, files },
    );
    expect(result.html).toContain("figures/plot.png");
    expect(result.warnings.filter((w) => w.code === "missing-graphic")).toEqual([]);
  });

  it("maps \\includegraphics width options to size classes", () => {
    const files = new Map([["a.png", new Uint8Array([1])]]);
    const result = convertLatexToHtml(
      DOC("\\includegraphics[width=0.5\\textwidth]{a}"),
      { id, files },
    );
    expect(result.html).toContain("ax-w-50");
  });

  it("renders description lists as dl/dt/dd", () => {
    const { html } = convert(
      DOC(
        "\\begin{description}\\item[Term one] First def.\\item[Term two] Second def.\\end{description}",
      ),
    );
    expect(html).toContain("<dl");
    expect(html).toMatch(/<dt[^>]*>Term one<\/dt>/);
    expect(html).toContain("First def.");
  });

  it("numbers standard theorem envs without \\newtheorem and keeps names", () => {
    const { html } = convert(
      DOC("\\begin{theorem}[Main]The claim.\\end{theorem}"),
    );
    expect(html).toContain("Theorem 1");
    expect(html).toContain("(Main)");
    expect(html).not.toContain("environment theorem");
  });

  it("renders raw keys when the bibliography is unavailable (biblatex)", () => {
    const { html, warnings } = convert(
      DOC("As shown by \\parencite{smith2020} and \\textcite{doe2021}."),
    );
    expect(html).toContain("[smith2020]");
    expect(html).toContain("[doe2021]");
    expect(html).not.toContain("macro-parencite");
    expect(warnings.some((w) => w.detail.includes("bibliography unavailable"))).toBe(true);
  });

  it("renders each of two bibliographies with its own entries", () => {
    const { html } = convert(
      DOC(
        [
          "\\cite{a} \\cite{b}",
          "\\begin{thebibliography}{9}\\bibitem{a} First entry.\\end{thebibliography}",
          "\\begin{thebibliography}{9}\\bibitem{b} Second entry.\\end{thebibliography}",
        ].join("\n"),
      ),
    );
    expect(html).toContain("First entry.");
    expect(html).toContain("Second entry.");
    // The second bibliography must not duplicate the first's entries.
    expect((html.match(/First entry\./g) ?? []).length).toBe(1);
  });

  it("repairs environments split across \\newenvironment begin/end bodies", () => {
    // Begin-code OPENS an env that end-code CLOSES — the transcript-box
    // pattern. Both the wrapper and its content must render, with no raw
    // \begin/\end tokens or env-name text leaking.
    const { html } = convert(
      "\\documentclass{article}" +
        "\\newenvironment{fancybox}[1][]{\\begin{center}\\textbf{Box start}}{\\end{center}}" +
        "\\begin{document}\\begin{fancybox}[lbl]Inner text.\\end{fancybox}\\end{document}",
    );
    expect(html).toContain("Box start");
    expect(html).toContain("Inner text.");
    expect(html).not.toContain("macro-begin");
    expect(html).not.toContain("fancybox");
    expect(html).not.toContain("[lbl]");
  });

  it("strips counter bookkeeping macros instead of leaking their names", () => {
    const { html } = convert(
      DOC(
        "\\newcounter{scen}Row one\\stepcounter{scen} and two\\stepcounter{scen}. Total \\arabic{scen}. \\begingroup grouped \\endgroup\\par After.",
      ),
    );
    expect(html).not.toContain("scen");
    expect(html).not.toContain("begingroup");
    expect(html).toContain("Row one");
    expect(html).toContain("grouped");
    expect(html).toContain("After.");
    expect(html).not.toContain("macro-par");
  });

  it("renders \\newtcolorbox uses as titled, colored boxes", () => {
    const { html } = convert(
      "\\documentclass{article}" +
        "\\definecolor{usergreen}{HTML}{2E7D32}" +
        "\\definecolor{GreenLightest}{HTML}{E8F5E9}" +
        "\\newtcolorbox{userbox}[1][]{colframe=usergreen,colback=GreenLightest,title=User,#1}" +
        "\\begin{document}\\begin{userbox}Hello there.\\end{userbox}\\end{document}",
    );
    expect(html).toContain('class="ax-box"');
    expect(html).toContain(">User</div>"); // speaker title chip
    expect(html).toContain("background-color:#e8f5e9"); // colback
    expect(html).toContain("border-color:#2e7d32"); // colframe
    expect(html).toContain("Hello there.");
    expect(html).not.toContain("colframe"); // options never leak
    // tcolorbox's coltitle default is WHITE — the chip sits on colframe.
    expect(html).toMatch(
      /ax-box-title[^>]*style="background-color:#2e7d32;color:#ffffff"/,
    );
  });

  it("honors an explicit coltitle= on the title chip", () => {
    const { html } = convert(
      "\\documentclass{article}" +
        "\\definecolor{chipbg}{HTML}{DDDDDD}" +
        "\\newtcolorbox{notebox}[1][]{colframe=chipbg,coltitle=black,title=Note,#1}" +
        "\\begin{document}\\begin{notebox}Body.\\end{notebox}\\end{document}",
    );
    expect(html).toMatch(
      /ax-box-title[^>]*style="background-color:#dddddd;color:#000000"/,
    );
  });

  it("renders side-by-side minipage columns with width classes", () => {
    const { html } = convert(
      DOC(
        "\\begin{minipage}[t]{0.49\\textwidth}Left col\\end{minipage}" +
          "\\begin{minipage}[t]{0.49\\textwidth}Right col\\end{minipage}",
      ),
    );
    expect((html.match(/ax-minipage ax-w-50/g) ?? []).length).toBe(2);
    expect(html).toContain("Left col");
    expect(html).toContain("Right col");
    expect(html).not.toContain("textwidth");
    expect(html).not.toContain("[t]");
  });

  it("renders a pre-compiled TikZ SVG as an inline image, placeholder otherwise", async () => {
    const { renderTikzDiagrams } = await import("./tikz");
    const source = DOC(
      "\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}\n" +
        "\\begin{tikzpicture}\\brokenmacro\\end{tikzpicture}",
    );
    const files = new Map<string, Uint8Array>();
    await renderTikzDiagrams(source, files);
    const result = convertLatexToHtml(source, { id, files });
    // Diagram 0 compiled → inline <img> backed by the SVG asset.
    expect(result.html).toContain("ax-tikz");
    expect(result.html).toContain("__tikz__/0.svg");
    expect(result.usedAssets).toContain("__tikz__/0.svg");
    // Diagram 1 failed to compile → placeholder, not a broken image.
    expect(result.html).toContain("ax-placeholder");
    expect(result.usedAssets).not.toContain("__tikz__/1.svg");
  }, 60000);

  it("produces identical, sequential anchors across repeated runs", () => {
    const source = DOC(
      "\\section{A}\nOne.\n\nTwo.\n\\begin{equation}x\\end{equation}",
    );
    const first = convert(source).html;
    const second = convert(source).html;
    expect(second).toBe(first);
    const anchors = [...first.matchAll(/data-anchor="(b-\d+)"/g)].map(
      (m) => m[1],
    );
    expect(anchors.length).toBeGreaterThan(2);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(anchors).toEqual([...anchors].sort());
  });
});

// Real-paper regression: flattened source of "Attention Is All You Need",
// generated from the actual e-print (text only; binary figures are listed in
// the manifest and stubbed).
const FIXTURE_DIR = `${import.meta.dirname}/fixtures`;

describe("real paper: 1706.03762v7 (fixture)", () => {
  const texSource = readFileSync(
    `${FIXTURE_DIR}/1706.03762v7.flattened.tex`,
    "utf8",
  );
  const manifest = JSON.parse(
    readFileSync(`${FIXTURE_DIR}/1706.03762v7.files.json`, "utf8"),
  ) as string[];
  const files = new Map(manifest.map((p) => [p, new Uint8Array([0])]));

  it("converts Attention Is All You Need end to end", () => {
    const start = performance.now();
    const result = convertLatexToHtml(texSource, {
      id: parseArxivId("1706.03762v7")!,
      files,
    });
    const ms = Math.round(performance.now() - start);

    expect(result.html.length).toBeGreaterThan(50_000);
    expect(result.html).toContain("katex");
    expect(result.html).toContain("Scaled Dot-Product Attention");

    console.info(
      `[spike] convert took ${ms}ms, html=${result.html.length}B, warnings:`,
      result.warnings.slice(0, 25),
    );
    console.info("[spike] meta:", result.meta, "assets:", result.usedAssets);
    if (process.env.ARXIV_DUMP) {
      writeFileSync(process.env.ARXIV_DUMP, result.html);
    }
  });
});

// Full-tarball path (fetch classification aside): runs only where the
// downloaded e-print exists.
const REAL_PAPER = "/Users/akallu/.claude/jobs/c514fbda/tmp/1706.03762v7.bin";

describe.skipIf(!existsSync(REAL_PAPER))("real paper: 1706.03762v7 (tarball)", () => {
  it("extracts and finds the main file", () => {
    const tar = gunzipSync(readFileSync(REAL_PAPER));
    const { files: extracted } = extractTarball(new Uint8Array(tar));
    const main = resolveMainTex(extracted);
    expect(main?.mainFile).toBe("ms.tex");
    expect(main!.texSource).toContain("\\begin{thebibliography}");
  });
});
