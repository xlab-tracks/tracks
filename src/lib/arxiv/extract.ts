import { parseTar } from "nanotar";
import { sanitizeAssetPath } from "./id";

export interface ExtractResult {
  /** Normalized member path → file bytes. */
  files: Map<string, Uint8Array>;
  warnings: string[];
}

/**
 * Parse an (already gunzipped) tar archive fully in memory. Member names are
 * normalized and anything unsafe (traversal, absolute paths) is skipped with
 * a warning rather than failing the whole paper.
 */
export function extractTarball(tarData: Uint8Array): ExtractResult {
  const files = new Map<string, Uint8Array>();
  const warnings: string[] = [];

  for (const entry of parseTar(tarData)) {
    // nanotar reports regular files as type "file"; directories, PAX
    // headers, and links are irrelevant to a TeX source tree.
    if (entry.type !== "file" || !entry.data) continue;
    const path = sanitizeAssetPath(entry.name);
    if (path === null) {
      warnings.push(`skipped unsafe tar member: ${JSON.stringify(entry.name)}`);
      continue;
    }
    files.set(path, new Uint8Array(entry.data));
  }

  if (files.size === 0) {
    warnings.push("tar archive contained no regular files");
  }
  return { files, warnings };
}
