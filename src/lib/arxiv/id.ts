/**
 * arXiv identifier parsing and URL construction.
 *
 * Only new-style ids (2007-04 onwards) with a *pinned version* are accepted,
 * e.g. "2301.12345v2". The strict shape doubles as the SSRF guard: validated
 * ids are interpolated into the e-print URL, blob keys, and asset routes, so
 * nothing looser may pass. Old-style ids ("hep-th/9901001") contain a slash
 * that breaks route segments and blob-key hygiene; support would require an
 * encoding scheme and is deliberately out of scope.
 */

export const ARXIV_ID_RE = /^(\d{2})(\d{2})\.(\d{4,5})v(\d{1,3})$/;

export interface ArxivId {
  /** The full pinned id, e.g. "2301.12345v2". */
  id: string;
  /** Year+month prefix, e.g. "2301". */
  yymm: string;
  /** Sequence number within the month, e.g. "12345". */
  number: string;
  /** Pinned version, >= 1. */
  version: number;
}

export function parseArxivId(raw: unknown): ArxivId | null {
  if (typeof raw !== "string") return null;
  const m = ARXIV_ID_RE.exec(raw);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  const version = Number(m[4]);
  if (version < 1) return null;
  return { id: raw, yymm: m[1] + m[2], number: m[3], version };
}

/** export.arxiv.org is arXiv's designated mirror for automated access. */
export function buildEprintUrl(id: ArxivId): string {
  return `https://export.arxiv.org/e-print/${id.id}`;
}

export function buildAbsUrl(id: ArxivId): string {
  return `https://arxiv.org/abs/${id.id}`;
}

export function buildPdfUrl(id: ArxivId): string {
  return `https://arxiv.org/pdf/${id.id}`;
}

/**
 * Site-relative URL of a committed figure asset. `npm run arxiv:build` writes
 * the bytes to public/arxiv/{id}/assets/{path}, so these are plain static
 * files — no runtime asset route.
 */
export function buildAssetUrl(id: ArxivId, assetPath: string): string {
  const encoded = assetPath.split("/").map(encodeURIComponent).join("/");
  return `/arxiv/${id.id}/assets/${encoded}`;
}

/**
 * Normalize a path taken from a tarball or an asset-route segment list.
 * Returns null for anything unsafe: absolute paths, backslashes, `..`
 * segments, empty results, or control characters.
 */
export function sanitizeAssetPath(raw: string): string | null {
  if (raw.includes("\\")) return null;
  if (raw.startsWith("/")) return null;
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) return null;
  }
  const segments = raw.split("/").filter((s) => s !== "" && s !== ".");
  if (segments.length === 0) return null;
  if (segments.some((s) => s === "..")) return null;
  return segments.join("/");
}
