/**
 * Server-side rasterization of PDF figures to PNG via mupdf (WASM). Runs once
 * per paper on the cold conversion path; the resulting PNGs are cached like any
 * other figure asset, so students get a normal <img> with zero client JS.
 *
 * Best-effort by design: a bad PDF or an unavailable rasterizer just leaves the
 * source PDF without a PNG sibling, and the converter falls back to a link
 * placeholder for that figure.
 */

const MAX_PDF_BYTES = 20 * 1024 * 1024; // skip pathologically large PDFs
const MAX_FIGURES = 30; // cap rasterizations per paper
const TARGET_WIDTH_PX = 1400; // aim for crisp figures on hi-dpi displays
const MIN_SCALE = 1.5;
const MAX_SCALE = 4;
const MAX_DIMENSION_PX = 2400; // clamp output so a huge page can't blow up

/** Suffix appended to a PDF path to hold its rasterized PNG in the files map. */
export function rasterPngPath(pdfPath: string): string {
  return `${pdfPath}.png`;
}

/**
 * Rasterize page 1 of every PDF figure in `files`, adding `${path}.png`
 * entries. Never throws — failures are logged and skipped.
 */
export async function rasterizePdfFigures(
  files: Map<string, Uint8Array>,
): Promise<void> {
  const pdfPaths = [...files.keys()].filter((p) =>
    p.toLowerCase().endsWith(".pdf"),
  );
  if (pdfPaths.length === 0) return;

  let mupdf: typeof import("mupdf");
  try {
    mupdf = await import("mupdf");
  } catch (err) {
    console.warn(
      `[arxiv] PDF rasterizer unavailable: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return;
  }

  let rendered = 0;
  for (const path of pdfPaths) {
    if (rendered >= MAX_FIGURES) break;
    const bytes = files.get(path)!;
    if (bytes.length > MAX_PDF_BYTES) continue;
    const png = renderFirstPage(mupdf, bytes);
    if (png) {
      files.set(rasterPngPath(path), png);
      rendered++;
    }
  }
}

function renderFirstPage(
  mupdf: typeof import("mupdf"),
  bytes: Uint8Array,
): Uint8Array | null {
  let doc: import("mupdf").Document | undefined;
  let page: import("mupdf").Page | undefined;
  let pixmap: import("mupdf").Pixmap | undefined;
  try {
    doc = mupdf.Document.openDocument(bytes, "application/pdf");
    if (doc.countPages() < 1) return null;
    page = doc.loadPage(0);
    const [x0, y0, x1, y1] = page.getBounds();
    const width = Math.abs(x1 - x0);
    const height = Math.abs(y1 - y0);
    if (width <= 0 || height <= 0) return null;

    let scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, TARGET_WIDTH_PX / width));
    scale = Math.min(scale, MAX_DIMENSION_PX / Math.max(width, height));

    pixmap = page.toPixmap(
      mupdf.Matrix.scale(scale, scale),
      mupdf.ColorSpace.DeviceRGB,
      false, // no alpha — figures render on white
    );
    return pixmap.asPNG();
  } catch {
    return null;
  } finally {
    pixmap?.destroy();
    page?.destroy();
    doc?.destroy();
  }
}
