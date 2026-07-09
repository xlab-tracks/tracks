import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rasterizePdfFigures, rasterPngPath } from "./rasterize";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

describe("rasterizePdfFigures", () => {
  it("rasterizes a real PDF figure to a PNG sibling", async () => {
    const pdf = new Uint8Array(
      readFileSync(`${import.meta.dirname}/fixtures/sample-figure.pdf`),
    );
    const files = new Map<string, Uint8Array>([["vis/fig.pdf", pdf]]);
    await rasterizePdfFigures(files);

    const png = files.get(rasterPngPath("vis/fig.pdf"));
    expect(png).toBeInstanceOf(Uint8Array);
    expect([...png!.slice(0, 4)]).toEqual(PNG_MAGIC);
    expect(png!.length).toBeGreaterThan(1000);
  });

  it("skips corrupt PDFs without throwing, leaving no PNG", async () => {
    const files = new Map<string, Uint8Array>([
      ["bad.pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00])],
    ]);
    await expect(rasterizePdfFigures(files)).resolves.toBeUndefined();
    expect(files.has(rasterPngPath("bad.pdf"))).toBe(false);
  });

  it("is a no-op when there are no PDFs", async () => {
    const files = new Map<string, Uint8Array>([["a.png", new Uint8Array([1])]]);
    await rasterizePdfFigures(files);
    expect([...files.keys()]).toEqual(["a.png"]);
  });
});
