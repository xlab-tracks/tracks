import { createTar } from "nanotar";
import { describe, expect, it } from "vitest";
import { extractTarball } from "./extract";
import { sanitizeAssetPath } from "./id";

/** Overwrite the name field of the tar header at `offset` and fix its checksum. */
function renameTarMember(tar: Uint8Array, offset: number, name: string): void {
  tar.fill(0, offset, offset + 100);
  tar.set(new TextEncoder().encode(name), offset);
  // Checksum: sum of header bytes with the checksum field (148-156) as spaces.
  tar.fill(0x20, offset + 148, offset + 156);
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += tar[offset + i];
  const octal = sum.toString(8).padStart(6, "0");
  tar.set(new TextEncoder().encode(octal), offset + 148);
  tar[offset + 154] = 0;
  tar[offset + 155] = 0x20;
}

describe("extractTarball", () => {
  it("extracts regular files with normalized names", () => {
    const tar = createTar([
      { name: "./main.tex", data: "\\documentclass{article}" },
      { name: "figs/a.png", data: new Uint8Array([1, 2, 3]) },
    ]);
    const { files, warnings } = extractTarball(new Uint8Array(tar));
    expect([...files.keys()].sort()).toEqual(["figs/a.png", "main.tex"]);
    expect(files.get("figs/a.png")).toEqual(new Uint8Array([1, 2, 3]));
    expect(warnings).toEqual([]);
  });

  it("never yields unsafe paths from hostile member names", () => {
    // createTar normalizes names at creation, so binary-patch a header to
    // smuggle a hostile member name into the archive. nanotar's parser
    // normalizes "../" away and sanitizeAssetPath catches anything left; the
    // invariant is that every resulting key is safe, however it got that way.
    const tar = new Uint8Array(
      createTar([
        { name: "evil-placeholder", data: "rm -rf" },
        { name: "ok.tex", data: "x" },
      ]),
    );
    renameTarMember(tar, 0, "../evil.sh");
    const { files } = extractTarball(new Uint8Array(tar));
    expect(files.has("ok.tex")).toBe(true);
    for (const key of files.keys()) {
      expect(sanitizeAssetPath(key)).toBe(key);
    }
  });
});
