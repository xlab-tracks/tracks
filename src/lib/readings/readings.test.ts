import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { getAllResources, getContentLocation, papers } from "@/lib/content";
import { parseLessWrongId, parseLessWrongPostUrl } from "@/lib/lesswrong/id";
import {
  LESSWRONG_CONVERTER_VERSION,
  type LessWrongArtifact,
} from "@/lib/lesswrong/types";
import { parseSubstackId, parseSubstackPostUrl } from "@/lib/substack/id";
import {
  SUBSTACK_CONVERTER_VERSION,
  type SubstackArtifact,
} from "@/lib/substack/types";
import {
  linkedReadings,
  linkedReadingSource,
  type LinkedReading,
} from "./registry";
import { resolveInternalReadingHref } from "./resolve";

// The linked-readings registry is generated (`npm run readings:build`) —
// these tests pin its contract: every entry backs a ready committed artifact,
// linked readings stay OUT of the content graph and the resource hub, and
// link resolution prefers course pages and stays one layer deep.

/** Site-agnostic key, mirroring resolve.ts. */
function keyOf(reading: LinkedReading): string {
  if (reading.kind === "lesswrong") {
    const ref = parseLessWrongId(reading.id);
    expect(ref, `${reading.id} must parse as a LessWrong artifact id`).not.toBeNull();
    return `lw:${ref!.postId}`;
  }
  expect(
    parseSubstackId(reading.id),
    `${reading.id} must parse as a Substack artifact id`,
  ).not.toBeNull();
  return `sb:${reading.id}`;
}

function primaryKey(postUrl: string): string | null {
  const lw = parseLessWrongPostUrl(postUrl);
  if (lw) return `lw:${lw.postId}`;
  const sb = parseSubstackPostUrl(postUrl);
  if (sb) return `sb:${sb.id}`;
  return null;
}

describe("linked readings registry", () => {
  it("has entries (regenerate with `npm run readings:build` if this fails)", () => {
    expect(linkedReadings.length).toBeGreaterThan(0);
  });

  it("every entry backs a ready, current-converter committed artifact", () => {
    for (const reading of linkedReadings) {
      const path = join(
        process.cwd(),
        "src",
        "content",
        reading.kind,
        `${reading.id}.json`,
      );
      expect(existsSync(path), `${reading.id}: missing artifact`).toBe(true);
      const artifact = JSON.parse(readFileSync(path, "utf8")) as
        | SubstackArtifact
        | LessWrongArtifact;
      expect(artifact.state, `${reading.id}: not ready`).toBe("ready");
      if (artifact.state !== "ready") continue;
      const expected =
        reading.kind === "substack"
          ? SUBSTACK_CONVERTER_VERSION
          : LESSWRONG_CONVERTER_VERSION;
      expect(
        artifact.post.converterVersion,
        `${reading.id}: stale converter — rerun npm run readings:build`,
      ).toBe(expected);
      expect(reading.title, `${reading.id}: title drifted`).toBe(
        artifact.post.meta.title,
      );
    }
  });

  // Reproduction gate: every served linked reading is a committed FULL COPY
  // of a third-party post, so each must carry a permission record —
  // "permitted" (permission/license confirmed) or "unreviewed"
  // (grandfathered, pending review); "denied" entries must not be served.
  // readings:build refuses to convert new links without an entry; this pins
  // the registry side of that contract.
  it("every linked reading has a non-denied permission record", () => {
    const permissions = JSON.parse(
      readFileSync(
        join(process.cwd(), "src/content/reading-permissions.json"),
        "utf8",
      ),
    ) as { entries: { id: string; status: string; note?: string }[] };
    const byId = new Map(permissions.entries.map((e) => [e.id, e]));
    expect(permissions.entries.length).toBe(byId.size); // no duplicate ids
    for (const entry of permissions.entries) {
      expect(
        ["permitted", "unreviewed", "denied"].includes(entry.status),
        `${entry.id}: unknown permission status "${entry.status}"`,
      ).toBe(true);
    }
    for (const reading of linkedReadings) {
      const entry = byId.get(reading.id);
      expect(
        entry,
        `${reading.id}: served without a permission record — add it to reading-permissions.json`,
      ).toBeDefined();
      expect(
        entry!.status,
        `${reading.id}: denied posts must not be in the registry — rerun readings:build and delete the artifact`,
      ).not.toBe("denied");
    }
  });

  // The /readings viewer derives its paper source from the artifact id
  // (linkedReadingSource), and the paper reader re-derives the artifact ref
  // from that source's postUrl. Pin the full round trip for EVERY entry so a
  // canonical-host drift (registry url host ≠ artifact id host, e.g.
  // blog.aifutures.org vs blog.ai-futures.org) can never strand a reading on
  // the "unavailable" screen again.
  it("every entry's derived reader source resolves back to its own artifact", () => {
    for (const reading of linkedReadings) {
      const source = linkedReadingSource(reading);
      expect(source.kind, `${reading.id}: source kind drifted`).toBe(reading.kind);
      if (source.kind === "substack") {
        const ref = parseSubstackPostUrl(source.postUrl);
        expect(ref?.id, `${reading.id}: reader would look up a different artifact`).toBe(
          reading.id,
        );
      } else if (source.kind === "lesswrong") {
        const ref = parseLessWrongPostUrl(source.postUrl);
        const idRef = parseLessWrongId(reading.id);
        expect(ref?.postId, `${reading.id}: reader would look up a different post`).toBe(
          idRef?.postId,
        );
      }
    }
  });

  it("ids are unique and disjoint from course paper sources", () => {
    const ids = linkedReadings.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);

    const readingKeys = new Set(linkedReadings.map(keyOf));
    for (const paper of papers) {
      if (paper.source.kind === "arxiv") continue;
      const key = primaryKey(paper.source.postUrl);
      expect(
        key && readingKeys.has(key),
        `${paper.id}: its source is also a linked reading — regenerate the registry`,
      ).toBeFalsy();
    }
  });

  it("linked readings never surface in the resource hub", () => {
    const readingKeys = new Set(linkedReadings.map(keyOf));
    for (const resource of getAllResources()) {
      const key = primaryKey(resource.url);
      expect(
        key && readingKeys.has(key),
        `resource ${resource.id} duplicates linked reading ${resource.url}`,
      ).toBeFalsy();
    }
  });
});

describe("resolveInternalReadingHref", () => {
  it("routes a course paper's source URL to its course page (both LW hosts)", () => {
    const paper = papers.find((p) => p.id === "c-case-for-control")!;
    const postUrl = (paper.source as { postUrl: string }).postUrl;
    const href = getContentLocation(paper.id)!.href;
    expect(resolveInternalReadingHref(postUrl)).toBe(href);

    // Same post id on the Alignment Forum host resolves site-agnostically.
    const ref = parseLessWrongPostUrl(postUrl)!;
    expect(
      resolveInternalReadingHref(
        `https://www.alignmentforum.org/posts/${ref.postId}/mirror-slug`,
      ),
    ).toBe(href);
  });

  it("routes a registered linked reading to /readings/[id]", () => {
    const reading = linkedReadings[0];
    expect(resolveInternalReadingHref(reading.url)).toBe(
      `/readings/${reading.id}`,
    );
  });

  it("leaves comment permalinks, anchored links, and foreign URLs external", () => {
    const reading = linkedReadings.find((r) => r.kind === "lesswrong")!;
    expect(resolveInternalReadingHref(`${reading.url}?commentId=abc`)).toBeNull();
    expect(resolveInternalReadingHref(`${reading.url}#section`)).toBeNull();
    expect(resolveInternalReadingHref("https://example.com/posts/x")).toBeNull();
    expect(resolveInternalReadingHref("not a url")).toBeNull();
  });
});
