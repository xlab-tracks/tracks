/**
 * Convert every arXiv paper the content references — <ArxivPaper id="..."/>
 * embeds in lessons AND Paper sources in src/content/papers.data.ts — into
 * committed artifacts the site reads at runtime:
 *
 *   src/content/arxiv/{id}.json     PaperArtifact (rendered HTML + toc, or a
 *                                   terminal state like pdf-only)
 *   public/arxiv/{id}/assets/{path} figure bytes referenced by the HTML
 *
 * Runs locally in Node at authoring time — this is where mupdf and TikZ WASM
 * live now; they never ship in the deployed worker. Raw e-prints cache under
 * ARXIV_CACHE_DIR (default: OS temp dir) so re-runs skip the network.
 *
 * Usage:
 *   npm run arxiv:build                       # all ids found in lessons + papers.data.ts
 *   npm run arxiv:build -- --id 2301.12345v2  # build one paper
 *   npm run arxiv:build -- --toc 2301.12345v2 # print a committed artifact's
 *                                             # section ids (for Paper.insertions)
 *
 * Transient failures (network blips) exit nonzero without writing an
 * artifact — only deterministic outcomes get committed. 3s spacing between
 * papers (arXiv rate courtesy).
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { papers } from "../src/content/papers.data";
import { parseArxivId } from "../src/lib/arxiv/id";
import { getOrConvertPaperUncached } from "../src/lib/arxiv/pipeline";
import { getAsset } from "../src/lib/arxiv/store";
import type { PaperArtifact, PaperTocEntry } from "../src/lib/arxiv/types";

const LESSONS_DIR = join(process.cwd(), "src", "content", "lessons");
const ARTIFACTS_DIR = join(process.cwd(), "src", "content", "arxiv");
const ASSETS_ROOT = join(process.cwd(), "public", "arxiv");

function idsFromLessons(): string[] {
  const ids = new Set<string>();
  for (const file of readdirSync(LESSONS_DIR)) {
    if (!file.endsWith(".mdx")) continue;
    const source = readFileSync(join(LESSONS_DIR, file), "utf8");
    for (const m of source.matchAll(/<ArxivPaper[^>]*\bid="([^"]+)"/g)) {
      ids.add(m[1]);
    }
  }
  return [...ids];
}

function idsFromPapers(): string[] {
  return papers
    .filter((p) => p.source.kind === "arxiv")
    .map((p) => p.source.arxivId);
}

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function printToc(toc: PaperTocEntry[]): void {
  for (const entry of toc) {
    const label = entry.number ? `§${entry.number} ${entry.title}` : entry.title;
    console.log(`  ${label.padEnd(48)} →  ${entry.id}`);
  }
}

/** Print a committed artifact's section ids without any network/conversion. */
function tocCommand(idString: string): void {
  const id = parseArxivId(idString);
  if (!id) {
    console.error(`✗ ${idString}: invalid id (pinned version required)`);
    process.exitCode = 1;
    return;
  }
  const path = join(ARTIFACTS_DIR, `${id.id}.json`);
  if (!existsSync(path)) {
    console.error(
      `✗ ${id.id}: no committed artifact — run \`npm run arxiv:build -- --id ${id.id}\` first`,
    );
    process.exitCode = 1;
    return;
  }
  const artifact = JSON.parse(readFileSync(path, "utf8")) as PaperArtifact;
  if (artifact.state !== "ready") {
    console.error(`✗ ${id.id}: artifact state is "${artifact.state}" — no toc`);
    process.exitCode = 1;
    return;
  }
  console.log(`${id.id} (converter v${artifact.paper.converterVersion}):`);
  printToc(artifact.paper.toc);
}

async function buildOne(idString: string): Promise<boolean> {
  const id = parseArxivId(idString);
  if (!id) {
    console.error(`✗ ${idString}: invalid id (pinned version required)`);
    return false;
  }

  const result = await getOrConvertPaperUncached(id.id);
  if (result.state === "transient-error") {
    console.error(`✗ ${id.id}: transient failure — nothing written, retry`);
    return false;
  }

  // Everything else is deterministic and safe to commit as-is.
  const artifact: PaperArtifact =
    result.state === "ready"
      ? { state: "ready", paper: result.paper }
      : { state: result.state };

  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  writeFileSync(
    join(ARTIFACTS_DIR, `${id.id}.json`),
    JSON.stringify(artifact),
  );

  // Mirror the referenced figure bytes into public/ (replacing any previous
  // set, so removed figures don't linger).
  rmSync(join(ASSETS_ROOT, id.id), { recursive: true, force: true });
  if (artifact.state === "ready") {
    for (const assetPath of artifact.paper.assets) {
      const bytes = await getAsset(id, assetPath);
      if (!bytes) {
        console.error(`✗ ${id.id}: asset ${assetPath} missing from cache`);
        return false;
      }
      const target = join(ASSETS_ROOT, id.id, "assets", assetPath);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
    }
    const warnings = artifact.paper.warnings.reduce((n, w) => n + w.count, 0);
    console.log(
      `✓ ${id.id}: ready — ${artifact.paper.assets.length} assets, ` +
        `${warnings} approximated elements`,
    );
    // Section ids are what Paper.insertions key on — surface them here so
    // authors don't have to dig through the JSON.
    printToc(artifact.paper.toc);
  } else {
    console.log(`✓ ${id.id}: recorded terminal state "${artifact.state}"`);
  }
  return true;
}

async function main(): Promise<void> {
  const tocId = argValue("--toc");
  if (tocId) {
    tocCommand(tocId);
    return;
  }

  const single = argValue("--id");
  const ids = single
    ? [single]
    : [...new Set([...idsFromLessons(), ...idsFromPapers()])].sort();
  if (ids.length === 0) {
    console.log(
      "No <ArxivPaper/> embeds in src/content/lessons/ and no arXiv sources in src/content/papers.data.ts.",
    );
    return;
  }

  let ok = true;
  for (const [i, idString] of ids.entries()) {
    if (i > 0) await sleep(3000);
    ok = (await buildOne(idString)) && ok;
  }
  process.exitCode = ok ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
