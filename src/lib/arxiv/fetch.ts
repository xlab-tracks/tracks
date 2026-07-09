import { gunzipSync } from "node:zlib";
import { buildEprintUrl, type ArxivId } from "./id";

/**
 * Fetch and classify an arXiv e-print. arXiv serves several shapes behind
 * one endpoint (gzipped tar, gzipped single .tex, bare PDF for papers with
 * no source, ancient DVI/PS), and Node's fetch transparently gunzips bodies
 * with `Content-Encoding: x-gzip` — so headers can't be trusted. Everything
 * is classified by magic bytes, re-sniffing after decompression.
 */

/** Hard cap on downloaded bytes (compressed or not). */
export const DOWNLOAD_CAP_BYTES = 30 * 1024 * 1024;
/** Hard cap on decompressed bytes (zlib enforces this — zip-bomb guard). */
export const UNCOMPRESSED_CAP_BYTES = 100 * 1024 * 1024;
/**
 * Covers the WHOLE request including the body read — source tarballs run to
 * several MB, so this must budget for the transfer, not just the connection
 * (6s used to kill large downloads mid-body: "SocketError: other side
 * closed"). The pipeline persists raw bytes immediately after this succeeds,
 * so the cost is paid at most once per paper version.
 */
const FETCH_TIMEOUT_MS = 25_000;

const USER_AGENT =
  "Tracks/0.1 (AI-safety learning platform; contact: akallu@andrew.cmu.edu)";

export type EprintFetchResult =
  | { kind: "tar"; data: Uint8Array }
  | { kind: "single-tex"; data: Uint8Array }
  | { kind: "pdf-only" }
  | { kind: "unsupported"; detail: string }
  | { kind: "not-found" }
  | { kind: "too-large" }
  | { kind: "transient-error"; detail: string };

export async function fetchEprint(id: ArxivId): Promise<EprintFetchResult> {
  let res: Response;
  try {
    res = await fetch(buildEprintUrl(id), {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      // Next.js patches server-side fetch and tries to buffer responses into
      // its data cache — multi-MB tarballs must bypass that ("Failed to set
      // fetch cache" + slowed/duplicated body reads). We do our own caching.
      cache: "no-store",
    });
  } catch (err) {
    return { kind: "transient-error", detail: describeError(err) };
  }

  if (res.status === 404) return { kind: "not-found" };
  if (!res.ok) {
    // 403/429/5xx from the export mirror are all retryable; never
    // negative-cache them.
    return { kind: "transient-error", detail: `arXiv responded ${res.status}` };
  }

  let body: Uint8Array;
  try {
    body = await readCapped(res, DOWNLOAD_CAP_BYTES);
  } catch (err) {
    if (err instanceof TooLargeError) return { kind: "too-large" };
    return { kind: "transient-error", detail: describeError(err) };
  }

  return classifyEprint(body);
}

/** Classify e-print bytes by magic numbers. Exported for unit tests. */
export function classifyEprint(data: Uint8Array): EprintFetchResult {
  if (data.length === 0) {
    return { kind: "transient-error", detail: "empty response body" };
  }
  if (startsWith(data, "%PDF-")) return { kind: "pdf-only" };

  if (data[0] === 0x1f && data[1] === 0x8b) {
    let inflated: Uint8Array;
    try {
      inflated = gunzipSync(data, { maxOutputLength: UNCOMPRESSED_CAP_BYTES });
    } catch (err) {
      if (isBufferTooLarge(err)) return { kind: "too-large" };
      return { kind: "unsupported", detail: "corrupt gzip stream" };
    }
    return classifyEprint(inflated);
  }

  if (isTar(data)) return { kind: "tar", data };

  // DVI starts with 0xf7 0x02; PostScript with "%!PS".
  if (data[0] === 0xf7 && data[1] === 0x02) {
    return { kind: "unsupported", detail: "DVI source" };
  }
  if (startsWith(data, "%!PS")) {
    return { kind: "unsupported", detail: "PostScript source" };
  }

  if (looksLikeText(data)) return { kind: "single-tex", data };
  return { kind: "unsupported", detail: "unrecognized e-print format" };
}

function isTar(data: Uint8Array): boolean {
  if (data.length < 512) return false;
  // POSIX ustar magic at offset 257 ("ustar\0" or GNU "ustar ").
  const magic = String.fromCharCode(...data.subarray(257, 262));
  return magic === "ustar";
}

function startsWith(data: Uint8Array, ascii: string): boolean {
  if (data.length < ascii.length) return false;
  for (let i = 0; i < ascii.length; i++) {
    if (data[i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/** Heuristic: mostly printable in the first KB → treat as a bare .tex file. */
function looksLikeText(data: Uint8Array): boolean {
  const sample = data.subarray(0, 1024);
  let printable = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte === 0x09 || byte === 0x0a || byte === 0x0d || byte >= 0x20) {
      printable++;
    }
  }
  return printable / sample.length > 0.97;
}

class TooLargeError extends Error {}

async function readCapped(res: Response, cap: number): Promise<Uint8Array> {
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > cap) throw new TooLargeError();
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) {
      await reader.cancel();
      throw new TooLargeError();
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function isBufferTooLarge(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "ERR_BUFFER_TOO_LARGE"
  );
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    return err.name === "TimeoutError" ? "fetch timed out" : err.message;
  }
  return String(err);
}
