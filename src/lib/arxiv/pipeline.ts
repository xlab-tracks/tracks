import { convertLatexToHtml } from "./convert";
import { classifyEprint, fetchEprint } from "./fetch";
import { extractTarball } from "./extract";
import { parseArxivId, type ArxivId } from "./id";
import { resolveMainTex } from "./main-tex";
import { rasterizePdfFigures } from "./rasterize";
import { renderTikzDiagrams } from "./tikz";
import {
  getConvertedPaper,
  getPaperStatus,
  getRawEprint,
  setAsset,
  setConvertedPaper,
  setPaperStatus,
  setRawEprint,
  type ConvertedPaper,
} from "./store";
import { CONVERTER_VERSION } from "./types";

export type PaperResult =
  | { state: "ready"; paper: ConvertedPaper }
  | { state: "pdf-only" }
  | { state: "not-found" }
  | { state: "too-large" }
  | { state: "unsupported" }
  | { state: "failed" }
  | { state: "transient-error" };

/**
 * Cache-first orchestrator. The cold path persists the raw e-print BEFORE
 * converting, so progress is monotonic: even if this invocation dies at the
 * platform's function timeout, the next request skips the network and
 * usually completes. Terminal outcomes are negative-cached; transient ones
 * never are.
 */
export async function getOrConvertPaperUncached(
  idString: string,
): Promise<PaperResult> {
  const id = parseArxivId(idString);
  if (!id) return { state: "failed" };
  try {
    return await runPipeline(id);
  } catch (err) {
    // Any unexpected store/network failure degrades to a reload-me card
    // rather than throwing out of the RSC render and 500-ing the lesson.
    console.error(
      `[arxiv] pipeline error for ${id.id}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return { state: "transient-error" };
  }
}

async function runPipeline(id: ArxivId): Promise<PaperResult> {
  const status = await getPaperStatus(id);
  if (status) {
    switch (status.kind) {
      case "pdf-only":
        return { state: "pdf-only" };
      case "too-large":
        return { state: "too-large" };
      case "unsupported":
        return { state: "unsupported" };
      case "not-found":
        return { state: "not-found" };
      case "failed":
        return { state: "failed" };
    }
  }

  const converted = await getConvertedPaper(id);
  if (converted) return { state: "ready", paper: converted };

  let raw = await getRawEprint(id);
  if (!raw) {
    const fetched = await fetchEprint(id);
    switch (fetched.kind) {
      case "tar":
      case "single-tex":
        raw = fetched.data;
        await setRawEprint(id, raw);
        break;
      case "pdf-only":
        await setPaperStatus(id, { kind: "pdf-only" });
        return { state: "pdf-only" };
      case "not-found":
        await setPaperStatus(id, {
          kind: "not-found",
          checkedAt: new Date().toISOString(),
        });
        return { state: "not-found" };
      case "too-large":
        await setPaperStatus(id, { kind: "too-large" });
        return { state: "too-large" };
      case "unsupported":
        await setPaperStatus(id, {
          kind: "unsupported",
          detail: fetched.detail,
        });
        return { state: "unsupported" };
      case "transient-error":
        return { state: "transient-error" };
    }
  }

  return convertFromRaw(id, raw);
}

async function convertFromRaw(
  id: ArxivId,
  raw: Uint8Array,
): Promise<PaperResult> {
  // The deterministic section (classify → extract → convert) is a pure
  // function of the immutable source: a throw here is a genuine conversion
  // failure, safe to negative-cache. Blob I/O is deliberately kept OUTSIDE
  // this try so a transient store blip never bricks a convertible paper.
  let paper: ConvertedPaper;
  let assetBytes: Map<string, Uint8Array>;
  try {
    const classified = classifyEprint(raw);
    let files: Map<string, Uint8Array>;
    if (classified.kind === "tar") {
      files = extractTarball(classified.data).files;
    } else if (classified.kind === "single-tex") {
      files = new Map([["main.tex", classified.data]]);
    } else {
      await tryFailPermanently(id, `raw blob classified as ${classified.kind}`);
      return { state: "failed" };
    }

    const main = resolveMainTex(files);
    if (!main) {
      await tryFailPermanently(id, "no main .tex found");
      return { state: "failed" };
    }

    // Rasterize PDF figures to PNGs and compile TikZ diagrams to SVGs
    // (added into `files`) so the converter can emit <img> for them instead
    // of link placeholders. Both are best-effort and never throw.
    await rasterizePdfFigures(files);
    await renderTikzDiagrams(main.texSource, files);

    const result = convertLatexToHtml(main.texSource, { id, files });

    paper = {
      html: result.html,
      toc: result.toc,
      warnings: [
        ...main.warnings.map((detail) => ({ code: "source", detail, count: 1 })),
        ...result.warnings,
      ],
      meta: result.meta,
      assets: result.usedAssets,
      converterVersion: CONVERTER_VERSION,
      createdAt: new Date().toISOString(),
    };

    assetBytes = new Map(
      result.usedAssets
        .map((path) => [path, files.get(path)] as const)
        .filter((entry): entry is [string, Uint8Array] => entry[1] != null),
    );
  } catch (err) {
    await tryFailPermanently(id, err instanceof Error ? err.message : String(err));
    return { state: "failed" };
  }

  // Store writes: a failure here is transient infrastructure, never cached.
  // The already-persisted raw blob means the next request retries cheaply.
  try {
    for (const [path, bytes] of assetBytes) await setAsset(id, path, bytes);
    await setConvertedPaper(id, paper);
  } catch (err) {
    console.error(
      `[arxiv] transient store write failure for ${id.id}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    // Still serve the freshly converted paper this time.
    return { state: "ready", paper };
  }
  return { state: "ready", paper };
}

/**
 * Negative-cache a genuine (deterministic) conversion failure. If the status
 * write itself fails, that's transient — swallow it so we don't turn an infra
 * blip into a thrown error; the paper simply gets retried next request.
 */
async function tryFailPermanently(id: ArxivId, detail: string): Promise<void> {
  console.error(`[arxiv] conversion of ${id.id} failed: ${detail}`);
  try {
    await setPaperStatus(id, {
      kind: "failed",
      detail,
      converterVersion: CONVERTER_VERSION,
    });
  } catch (err) {
    console.error(
      `[arxiv] could not record failed status for ${id.id}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
