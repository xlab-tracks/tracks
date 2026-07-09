import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { ArxivId } from "./id";
import { CONVERTER_VERSION, type ConvertedPaper } from "./types";

/**
 * Authoring-time filesystem cache used by `npm run arxiv:build` (and unit
 * tests). E-prints are immutable per pinned version, so entries never expire:
 *
 *   {id}/raw             decompressed e-print bytes (tar or bare .tex)
 *   {id}/converted.json  ConvertedPaper (checked against CONVERTER_VERSION)
 *   {id}/assets/{path}   figure bytes actually referenced by the HTML
 *   {id}/status.json     negative cache (pdf-only, too-large, failed, ...)
 *
 * This never runs in the deployed app: the build script converts locally and
 * commits artifacts (src/content/arxiv/, public/arxiv/) that the site reads.
 * Lives under the OS temp dir by default; override with ARXIV_CACHE_DIR.
 * Writes are idempotent (immutable content), so concurrent writers are
 * harmless; a torn read just looks like a cache miss and re-converts.
 */

export type { ConvertedPaper } from "./types";

export type PaperStatus =
  | { kind: "pdf-only" }
  | { kind: "too-large" }
  | { kind: "unsupported"; detail: string }
  | { kind: "not-found"; checkedAt: string }
  | { kind: "failed"; detail: string; converterVersion: number };

const NOT_FOUND_TTL_MS = 24 * 60 * 60 * 1000;

const root = () =>
  process.env.ARXIV_CACHE_DIR ?? join(tmpdir(), "tracks-arxiv-cache");

const pathFor = (key: string) => join(root(), key);

function write(key: string, data: string | Uint8Array): void {
  const p = pathFor(key);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
}

function readJSON(key: string): unknown | null {
  try {
    return JSON.parse(readFileSync(pathFor(key), "utf8"));
  } catch {
    return null;
  }
}

function readBytes(key: string): Uint8Array | null {
  try {
    return new Uint8Array(readFileSync(pathFor(key)));
  } catch {
    return null;
  }
}

export async function getRawEprint(id: ArxivId): Promise<Uint8Array | null> {
  return readBytes(`${id.id}/raw`);
}

export async function setRawEprint(
  id: ArxivId,
  bytes: Uint8Array,
): Promise<void> {
  write(`${id.id}/raw`, bytes);
}

export async function getConvertedPaper(
  id: ArxivId,
): Promise<ConvertedPaper | null> {
  const value = readJSON(`${id.id}/converted.json`) as ConvertedPaper | null;
  if (!value || value.converterVersion !== CONVERTER_VERSION) return null;
  return value;
}

export async function setConvertedPaper(
  id: ArxivId,
  paper: ConvertedPaper,
): Promise<void> {
  write(`${id.id}/converted.json`, JSON.stringify(paper));
}

/** Returns the effective status, treating stale not-found entries as absent. */
export async function getPaperStatus(id: ArxivId): Promise<PaperStatus | null> {
  const status = readJSON(`${id.id}/status.json`) as PaperStatus | null;
  if (!status) return null;
  if (status.kind === "not-found") {
    const age = Date.now() - new Date(status.checkedAt).getTime();
    if (!Number.isFinite(age) || age > NOT_FOUND_TTL_MS) return null;
  }
  if (
    status.kind === "failed" &&
    status.converterVersion !== CONVERTER_VERSION
  ) {
    // A newer converter gets to retry papers that previously failed.
    return null;
  }
  return status;
}

export async function setPaperStatus(
  id: ArxivId,
  status: PaperStatus,
): Promise<void> {
  write(`${id.id}/status.json`, JSON.stringify(status));
}

export async function getAsset(
  id: ArxivId,
  assetPath: string,
): Promise<Uint8Array | null> {
  return readBytes(`${id.id}/assets/${assetPath}`);
}

export async function setAsset(
  id: ArxivId,
  assetPath: string,
  bytes: Uint8Array,
): Promise<void> {
  write(`${id.id}/assets/${assetPath}`, bytes);
}
