import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { lessons } from "@/content/curriculum.data";
import { readers } from "@/content/readers.data";
import {
  getAssessmentForModule,
  getExerciseById,
  getItemNavigation,
  getItemsForModule,
  getLessonById,
  getModuleProgressContentIds,
  getModulesForTrack,
  getPrerequisiteModules,
  getTrackItemSequence,
  itemIdOf,
  itemSlugOf,
  papers,
  tracks,
} from "@/lib/content";
import { parseArxivId } from "@/lib/arxiv/id";
import { CONVERTER_VERSION, type PaperArtifact } from "@/lib/arxiv/types";

describe("content integrity", () => {
  it("every track's modules resolve and belong to it", () => {
    for (const track of tracks) {
      const modules = getModulesForTrack(track.id);
      expect(modules.length).toBe(track.moduleIds.length);
      for (const m of modules) expect(m.trackId).toBe(track.id);
    }
  });

  it("every module item resolves to exactly one lesson, paper, or reader", () => {
    const lessonIds = new Set(lessons.map((l) => l.id));
    const paperIds = new Set(papers.map((p) => p.id));
    const readerIds = new Set(readers.map((r) => r.id));
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        expect(getItemsForModule(m.id).length).toBe(m.itemIds.length);
        for (const id of m.itemIds) {
          const kinds =
            Number(lessonIds.has(id)) + Number(paperIds.has(id)) + Number(readerIds.has(id));
          expect(kinds, `${id} should resolve to exactly one kind`).toBe(1);
        }
      }
    }
  });

  it("content ids are globally unique across lessons, papers, and readers", () => {
    const ids = [
      ...lessons.map((l) => l.id),
      ...papers.map((p) => p.id),
      ...readers.map((r) => r.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("item slugs are unique within a module and never shadow the assessment segment", () => {
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        const slugs = getItemsForModule(m.id).map(itemSlugOf);
        expect(new Set(slugs).size).toBe(slugs.length);
        expect(slugs).not.toContain("assessment");
      }
    }
  });

  it("every declared prerequisite resolves to a real module", () => {
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        expect(getPrerequisiteModules(m.id).length).toBe(
          m.prerequisiteModuleIds.length,
        );
      }
    }
  });

  it("each module assessment is attached to that module", () => {
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        if (m.assessmentId) {
          expect(getAssessmentForModule(m.id)?.id).toBe(m.assessmentId);
        }
      }
    }
  });
});

describe("paper integrity", () => {
  const insertedLessonIds = papers.flatMap((p) =>
    (p.insertions ?? []).flatMap((insertion) =>
      insertion.items.filter((i) => i.kind === "lesson").map((i) => i.id),
    ),
  );

  it("every paper belongs to a real module and appears in that module's itemIds exactly once", () => {
    for (const paper of papers) {
      const listers = tracks
        .flatMap((t) => getModulesForTrack(t.id))
        .filter((m) => m.itemIds.includes(paper.id));
      expect(listers, `paper ${paper.id} must be listed by exactly one module`).toHaveLength(1);
      // The listing module must be the paper's own — getContentLocation and
      // revalidation resolve through paper.moduleId.
      expect(listers[0].id, `paper ${paper.id} listed outside its moduleId`).toBe(
        paper.moduleId,
      );
      expect(
        listers[0].itemIds.filter((id) => id === paper.id),
        `paper ${paper.id} duplicated in itemIds`,
      ).toHaveLength(1);
    }
  });

  it("an exercise is inserted at most once per paper (anchor ids must be unique)", () => {
    for (const paper of papers) {
      const exerciseIds = (paper.insertions ?? []).flatMap((insertion) =>
        insertion.items.filter((i) => i.kind === "exercise").map((i) => i.id),
      );
      expect(
        new Set(exerciseIds).size,
        `paper ${paper.id} inserts an exercise twice`,
      ).toBe(exerciseIds.length);
    }
  });

  it("every insertion item resolves and inserted lessons have MDX bodies", () => {
    for (const paper of papers) {
      for (const insertion of paper.insertions ?? []) {
        for (const item of insertion.items) {
          if (item.kind === "exercise") {
            expect(
              getExerciseById(item.id),
              `exercise ${item.id} in ${paper.id}`,
            ).toBeDefined();
          } else {
            const lesson = getLessonById(item.id);
            expect(lesson, `lesson ${item.id} in ${paper.id}`).toBeDefined();
            expect(lesson!.moduleId, `inserted lesson ${item.id} module`).toBe(
              paper.moduleId,
            );
            expect(
              existsSync(
                join(process.cwd(), "src/content/lessons", `${lesson!.contentRef}.mdx`),
              ),
              `MDX body for inserted lesson ${item.id}`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("inserted lessons are not module items and are inserted only once", () => {
    const allItemIds = new Set(
      tracks.flatMap((t) => getModulesForTrack(t.id)).flatMap((m) => m.itemIds),
    );
    for (const id of insertedLessonIds) {
      expect(allItemIds.has(id), `inserted lesson ${id} must not be an item`).toBe(
        false,
      );
    }
    expect(new Set(insertedLessonIds).size).toBe(insertedLessonIds.length);
  });

  it("insertion sectionIds are unique per paper", () => {
    for (const paper of papers) {
      const sectionIds = (paper.insertions ?? []).map((i) => i.sectionId);
      expect(new Set(sectionIds).size).toBe(sectionIds.length);
    }
  });

  it("arXiv sources are version-pinned and their artifacts are committed", () => {
    for (const paper of papers) {
      expect(
        parseArxivId(paper.source.arxivId),
        `paper ${paper.id} needs a pinned arXiv id`,
      ).not.toBeNull();
      expect(
        existsSync(artifactPath(paper.source.arxivId)),
        `artifact for ${paper.source.arxivId} — run \`npm run arxiv:build\``,
      ).toBe(true);
    }
  });

  it("papers with insertions have current-version artifacts whose toc contains every sectionId", () => {
    for (const paper of papers) {
      if (!paper.insertions?.length) continue;
      const artifact = readArtifact(paper.source.arxivId);
      expect(
        artifact.state,
        `${paper.source.arxivId} must be ready — run \`npm run arxiv:build\``,
      ).toBe("ready");
      if (artifact.state !== "ready") continue;
      expect(
        artifact.paper.converterVersion,
        `${paper.source.arxivId} artifact is stale — run \`npm run arxiv:build\``,
      ).toBe(CONVERTER_VERSION);
      const tocIds = new Set(artifact.paper.toc.map((entry) => entry.id));
      for (const insertion of paper.insertions) {
        expect(
          tocIds.has(insertion.sectionId),
          `sectionId ${insertion.sectionId} not in ${paper.source.arxivId} toc — ` +
            `run \`npm run arxiv:build -- --toc ${paper.source.arxivId}\` to list valid ids`,
        ).toBe(true);
      }
    }
  });
});

describe("module item navigation", () => {
  it("walking next from the first item visits every track item exactly once", () => {
    for (const track of tracks) {
      const sequence = getTrackItemSequence(track.slug);
      if (sequence.length === 0) continue;
      const bySlugs = new Map(
        sequence.map((entry) => [
          `${entry.module.slug}/${itemSlugOf(entry.item)}`,
          entry,
        ]),
      );
      const visited: string[] = [];
      let entry: (typeof sequence)[number] | undefined = sequence[0];
      while (entry && visited.length <= sequence.length) {
        visited.push(itemIdOf(entry.item));
        const nav = getItemNavigation(itemIdOf(entry.item));
        entry = nav.next
          ? bySlugs.get(`${nav.next.moduleSlug}/${nav.next.itemSlug}`)
          : undefined;
      }
      expect(visited).toEqual(sequence.map(({ item }) => itemIdOf(item)));
    }
  });

  it("prev is the inverse of next, with nulls at the boundaries", () => {
    for (const track of tracks) {
      const sequence = getTrackItemSequence(track.slug);
      sequence.forEach(({ item }, index) => {
        const nav = getItemNavigation(itemIdOf(item));
        if (index === 0) expect(nav.prev).toBeNull();
        else expect(nav.prev?.itemSlug).toBe(itemSlugOf(sequence[index - 1].item));
        if (index === sequence.length - 1) expect(nav.next).toBeNull();
        else expect(nav.next?.itemSlug).toBe(itemSlugOf(sequence[index + 1].item));
      });
    }
  });

  it("module progress ids list papers and their inserted lessons exactly once", () => {
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        const ids = getModuleProgressContentIds(m.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const item of getItemsForModule(m.id)) {
          expect(ids).toContain(itemIdOf(item));
          if (item.kind === "paper") {
            for (const insertion of item.paper.insertions ?? []) {
              for (const inserted of insertion.items) {
                if (inserted.kind === "lesson") expect(ids).toContain(inserted.id);
              }
            }
          }
        }
      }
    }
  });
});

function artifactPath(arxivId: string): string {
  return join(process.cwd(), "src/content/arxiv", `${arxivId}.json`);
}

function readArtifact(arxivId: string): PaperArtifact {
  return JSON.parse(readFileSync(artifactPath(arxivId), "utf8")) as PaperArtifact;
}
