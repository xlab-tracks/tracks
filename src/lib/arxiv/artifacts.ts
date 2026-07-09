import { cache } from "react";
import { CONVERTER_VERSION, type PaperArtifact } from "./types";

/**
 * Runtime loader for paper artifacts precomputed by `npm run arxiv:build` and
 * committed under src/content/arxiv/{id}.json. Papers convert at authoring
 * time in Node — the conversion toolchain (mupdf/TikZ WASM, LaTeX passes)
 * never ships in the deployed worker, and the app only ever reads these
 * bundled JSON modules (same dynamic-import pattern as lesson MDX).
 */
export type PaperLookup = PaperArtifact | { state: "not-built" };

export const getPaperArtifact = cache(
  async (id: string): Promise<PaperLookup> => {
    let artifact: PaperArtifact;
    try {
      const mod = (await import(`@/content/arxiv/${id}.json`)) as {
        default: PaperArtifact;
      };
      artifact = mod.default;
    } catch {
      return { state: "not-built" };
    }
    if (
      artifact.state === "ready" &&
      artifact.paper.converterVersion !== CONVERTER_VERSION
    ) {
      // Predates the current converter — nudge authors to rebuild rather
      // than render stale-format HTML.
      return { state: "not-built" };
    }
    return artifact;
  },
);
