import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readers } from "@/content/readers.data";
import { readerTocs } from "@/content/readers/tocs.generated";
import { lessons, modules } from "@/content/curriculum.data";
import { getReaderById } from "@/lib/content";
import { buildReaders } from "../../scripts/build-readers";

const READERS_DIR = join(process.cwd(), "src/content/readers");
const lessonById = new Map(lessons.map((l) => [l.id, l]));
const allItemIds = new Set(modules.flatMap((m) => m.itemIds));

describe("readers: integrity", () => {
  it("every reader is a real item of its module", () => {
    for (const reader of readers) {
      const mod = modules.find((m) => m.id === reader.moduleId);
      expect(mod, `reader ${reader.id} module`).toBeDefined();
      expect(mod!.itemIds).toContain(reader.id);
      expect(getReaderById(reader.id)?.id).toBe(reader.id);
    }
  });

  it("every reader lesson resolves and belongs to the reader's module", () => {
    for (const reader of readers) {
      expect(reader.lessonIds.length).toBeGreaterThan(0);
      for (const lessonId of reader.lessonIds) {
        const lesson = lessonById.get(lessonId);
        expect(lesson, `reader ${reader.id}: lesson ${lessonId}`).toBeDefined();
        expect(lesson!.moduleId).toBe(reader.moduleId);
      }
    }
  });

  it("reader-owned lessons are NOT standalone items (no double route)", () => {
    for (const reader of readers) {
      for (const lessonId of reader.lessonIds) {
        expect(allItemIds.has(lessonId), `${lessonId} should not be in any itemIds`).toBe(
          false,
        );
      }
    }
  });

  it("each lesson belongs to at most one reader", () => {
    const seen = new Set<string>();
    for (const reader of readers) {
      for (const lessonId of reader.lessonIds) {
        expect(seen.has(lessonId), `${lessonId} in two readers`).toBe(false);
        seen.add(lessonId);
      }
    }
  });
});

describe("readers: generated output is fresh", () => {
  const built = buildReaders();

  it("committed <id>.mdx matches a fresh build (run `npm run readers:build`)", () => {
    for (const { id, mdx } of built) {
      const committed = readFileSync(join(READERS_DIR, `${id}.mdx`), "utf8");
      expect(committed, `${id}.mdx is stale`).toBe(mdx);
    }
  });

  it("committed tocs.generated.ts matches a fresh build", () => {
    for (const { id, toc } of built) {
      expect(readerTocs[id], `${id} toc is stale`).toEqual(toc);
    }
  });
});

describe("readers: toc is well-formed", () => {
  it("anchor ids are unique within each reader", () => {
    for (const [id, toc] of Object.entries(readerTocs)) {
      const ids = toc.map((e) => e.id);
      expect(new Set(ids).size, `${id} has duplicate anchor ids`).toBe(ids.length);
    }
  });

  it("each reader opens with a level-1 section number", () => {
    for (const [id, toc] of Object.entries(readerTocs)) {
      expect(toc[0]?.level, `${id} first entry`).toBe(1);
      expect(toc[0]?.number).toBe("1");
    }
  });
});
