import { gzipSync } from "node:zlib";
import { createTar } from "nanotar";
import { describe, expect, it } from "vitest";
import { classifyEprint } from "./fetch";

const encoder = new TextEncoder();

describe("classifyEprint", () => {
  it("detects PDF-only papers", () => {
    expect(classifyEprint(encoder.encode("%PDF-1.5 blah")).kind).toBe(
      "pdf-only",
    );
  });

  it("re-sniffs after gunzip: gzipped PDF is still pdf-only", () => {
    const gz = gzipSync(Buffer.from("%PDF-1.5 blah"));
    expect(classifyEprint(new Uint8Array(gz)).kind).toBe("pdf-only");
  });

  it("classifies a gzipped single .tex file", () => {
    const tex = "\\documentclass{article}\\begin{document}hi\\end{document}";
    const gz = gzipSync(Buffer.from(tex));
    const result = classifyEprint(new Uint8Array(gz));
    expect(result.kind).toBe("single-tex");
    if (result.kind === "single-tex") {
      expect(new TextDecoder().decode(result.data)).toBe(tex);
    }
  });

  it("classifies tar archives, gzipped or not", () => {
    const tar = createTar([{ name: "main.tex", data: "\\documentclass{article}" }]);
    expect(classifyEprint(new Uint8Array(tar)).kind).toBe("tar");
    const gz = gzipSync(Buffer.from(tar));
    expect(classifyEprint(new Uint8Array(gz)).kind).toBe("tar");
  });

  it("rejects DVI and PostScript as unsupported", () => {
    expect(classifyEprint(new Uint8Array([0xf7, 0x02, 0x01])).kind).toBe(
      "unsupported",
    );
    expect(classifyEprint(encoder.encode("%!PS-Adobe-2.0")).kind).toBe(
      "unsupported",
    );
  });

  it("rejects binary junk and empty bodies", () => {
    const junk = new Uint8Array(1024).fill(0x01);
    junk[0] = 0x00;
    expect(classifyEprint(junk).kind).toBe("unsupported");
    expect(classifyEprint(new Uint8Array(0)).kind).toBe("transient-error");
  });
});
