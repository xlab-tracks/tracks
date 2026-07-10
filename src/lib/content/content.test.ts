import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { lessons } from "@/content/curriculum.data";
import { readers } from "@/content/readers.data";
import { exercises } from "@/content/exercises.data";
import { ARGUE_REVEAL_DEFAULTS } from "@/lib/content/types";
import { featuredExercises } from "@/app/exercises/featured";
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
import { getDemo } from "@/lib/demos/registry";
import { CONVERTER_VERSION, type PaperArtifact } from "@/lib/arxiv/types";
import { buildBlockIndex, normalizeText } from "@/lib/papers/block-index";
import { markdownInlineToHast } from "@/lib/papers/markdown";

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
            Number(lessonIds.has(id)) +
            Number(paperIds.has(id)) +
            Number(readerIds.has(id));
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

describe("allocation exercise integrity", () => {
  const allocations = exercises.flatMap((e) =>
    e.type === "allocation" ? [e] : [],
  );

  it("agenda and scenario ids are unique and non-empty", () => {
    for (const exercise of allocations) {
      expect(exercise.agendas.length, `${exercise.id} agendas`).toBeGreaterThan(0);
      expect(exercise.scenarios.length, `${exercise.id} scenarios`).toBeGreaterThan(0);
      const agendaIds = exercise.agendas.map((a) => a.id);
      expect(
        new Set(agendaIds).size,
        `${exercise.id} has duplicate agenda ids`,
      ).toBe(agendaIds.length);
      const scenarioIds = exercise.scenarios.map((s) => s.id);
      expect(
        new Set(scenarioIds).size,
        `${exercise.id} has duplicate scenario ids`,
      ).toBe(scenarioIds.length);
    }
  });

  it("the pool is positive and reachable with the stepper", () => {
    for (const exercise of allocations) {
      expect(exercise.totalPeople, `${exercise.id} totalPeople`).toBeGreaterThan(0);
      const step = exercise.step ?? 0.5;
      expect(step, `${exercise.id} step`).toBeGreaterThan(0);
      // totalPeople must sit on the step grid, or "Next" can never enable.
      const ratio = exercise.totalPeople / step;
      expect(
        Math.abs(ratio - Math.round(ratio)),
        `${exercise.id}: totalPeople is not a multiple of step`,
      ).toBeLessThan(1e-9);
      expect(
        exercise.minReasoningChars ?? 0,
        `${exercise.id} minReasoningChars`,
      ).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("argue-reveal exercise integrity", () => {
  const argueReveals = exercises.flatMap((e) =>
    e.type === "argue-reveal" ? [e] : [],
  );

  it("item, concept, and surface ids are unique and non-empty", () => {
    for (const exercise of argueReveals) {
      expect(exercise.items.length, `${exercise.id} items`).toBeGreaterThan(0);
      expect(exercise.concepts.length, `${exercise.id} concepts`).toBeGreaterThan(0);
      expect(exercise.toolbox.length, `${exercise.id} toolbox`).toBeGreaterThan(0);
      for (const ids of [
        exercise.items.map((i) => i.id),
        exercise.concepts.map((c) => c.id),
        exercise.construction.surfaces.map((s) => s.id),
      ]) {
        expect(new Set(ids).size, `${exercise.id} has duplicate ids`).toBe(
          ids.length,
        );
      }
      for (const item of exercise.items) {
        expect(
          item.rounds.length,
          `${exercise.id}/${item.id} rounds`,
        ).toBeGreaterThan(0);
        for (const round of item.rounds) {
          expect(round.critique.trim(), `${exercise.id}/${item.id}`).not.toBe("");
          expect(round.reveal.trim(), `${exercise.id}/${item.id}`).not.toBe("");
        }
      }
      expect(
        exercise.construction.surfaces.length,
        `${exercise.id} surfaces`,
      ).toBeGreaterThan(0);
    }
  });

  it("char bounds are coherent (min below max)", () => {
    for (const exercise of argueReveals) {
      const min = exercise.responseMinChars ?? ARGUE_REVEAL_DEFAULTS.responseMinChars;
      const max = exercise.responseMaxChars ?? ARGUE_REVEAL_DEFAULTS.responseMaxChars;
      const rMin = exercise.residualMinChars ?? ARGUE_REVEAL_DEFAULTS.residualMinChars;
      const rMax = exercise.residualMaxChars ?? ARGUE_REVEAL_DEFAULTS.residualMaxChars;
      expect(min, `${exercise.id} response bounds`).toBeLessThan(max);
      expect(rMin, `${exercise.id} residual bounds`).toBeLessThan(rMax);
      expect(
        exercise.noteMaxChars ?? ARGUE_REVEAL_DEFAULTS.noteMaxChars,
        `${exercise.id} note cap`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("exercises tab integrity", () => {
  it("every featured entry resolves to a real exercise, once", () => {
    const ids = featuredExercises.map((f) => f.id);
    expect(new Set(ids).size, "duplicate featured exercise id").toBe(ids.length);
    for (const entry of featuredExercises) {
      // A typo here silently drops the card and 404s its page.
      expect(
        getExerciseById(entry.id),
        `featured exercise ${entry.id} not in exercises.data.ts`,
      ).toBeDefined();
      expect(entry.blurb.trim(), `featured ${entry.id} blurb`).not.toBe("");
    }
  });
});

describe("paper integrity", () => {
  const activityEditsOf = (p: (typeof papers)[number]) =>
    (p.edits ?? []).flatMap((edit) => (edit.op === "activity" ? [edit] : []));
  const blockRefsOf = (p: (typeof papers)[number]) =>
    (p.edits ?? []).flatMap((edit) => {
      const ref = edit.op === "hide" ? edit.at : edit.after;
      return "anchor" in ref ? [{ edit, ref }] : [];
    });
  const insertedLessonIds = papers.flatMap((p) =>
    activityEditsOf(p).flatMap((edit) =>
      edit.items.filter((i) => i.kind === "lesson").map((i) => i.id),
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
      // Standalone exercise items and sequence members share one namespace —
      // a sequence's anchor id derives from its first exercise id.
      const exerciseIds = activityEditsOf(paper).flatMap((edit) =>
        edit.items.flatMap((i) =>
          i.kind === "exercise" ? [i.id] : i.kind === "sequence" ? i.exerciseIds : [],
        ),
      );
      expect(
        new Set(exerciseIds).size,
        `paper ${paper.id} inserts an exercise twice`,
      ).toBe(exerciseIds.length);
      // Demos too — duplicate insertions would collide on ins-demo-<id>.
      const demoIds = activityEditsOf(paper).flatMap((edit) =>
        edit.items.flatMap((i) => (i.kind === "demo" ? [i.id] : [])),
      );
      expect(
        new Set(demoIds).size,
        `paper ${paper.id} inserts a demo twice`,
      ).toBe(demoIds.length);
    }
  });

  it("add labels appear only on block/section-level adds (inline adds ignore them)", () => {
    for (const paper of papers) {
      for (const edit of paper.edits ?? []) {
        if (edit.op !== "add" || edit.label === undefined) continue;
        const inline = "anchor" in edit.after && edit.after.s !== undefined;
        expect(
          inline,
          `${paper.id}: label "${edit.label}" on a sentence-level add would be silently dropped`,
        ).toBe(false);
      }
    }
  });

  it("every activity item resolves and inserted lessons have MDX bodies", () => {
    // Sequences gate progression client-side over these part kinds only.
    const SEQUENCEABLE = new Set([
      "tap-reveal",
      "multiple-choice",
      "multi-select",
      "true-false",
      "understanding-check",
    ]);
    for (const paper of papers) {
      for (const edit of activityEditsOf(paper)) {
        for (const item of edit.items) {
          if (item.kind === "exercise") {
            expect(
              getExerciseById(item.id),
              `exercise ${item.id} in ${paper.id}`,
            ).toBeDefined();
          } else if (item.kind === "demo") {
            expect(
              getDemo(item.id),
              `demo ${item.id} in ${paper.id} is not in the demo registry`,
            ).toBeDefined();
          } else if (item.kind === "sequence") {
            expect(
              item.exerciseIds.length,
              `empty sequence in ${paper.id}`,
            ).toBeGreaterThan(0);
            for (const id of item.exerciseIds) {
              const exercise = getExerciseById(id);
              expect(exercise, `sequence exercise ${id} in ${paper.id}`).toBeDefined();
              expect(
                SEQUENCEABLE.has(exercise!.type),
                `sequence exercise ${id} in ${paper.id} has non-sequenceable type "${exercise!.type}"`,
              ).toBe(true);
            }
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

  it("papers with edits have ready, current-version artifacts", () => {
    for (const paper of papers) {
      if (!paper.edits?.length) continue;
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
    }
  });

  it("every sectionEnd target is in the artifact toc", () => {
    for (const paper of papers) {
      const sectionEnds = (paper.edits ?? []).flatMap((edit) =>
        edit.op !== "hide" && "sectionEnd" in edit.after ? [edit.after.sectionEnd] : [],
      );
      if (sectionEnds.length === 0) continue;
      const artifact = readArtifact(paper.source.arxivId);
      if (artifact.state !== "ready") continue; // covered above
      const tocIds = new Set(artifact.paper.toc.map((entry) => entry.id));
      for (const sectionEnd of sectionEnds) {
        expect(
          tocIds.has(sectionEnd),
          `sectionEnd ${sectionEnd} not in ${paper.source.arxivId} toc — ` +
            `run \`npm run arxiv:build -- --toc ${paper.source.arxivId}\` to list valid ids`,
        ).toBe(true);
      }
    }
  });

  it("every block/sentence edit target exists with a matching snippet", () => {
    for (const paper of papers) {
      const refs = blockRefsOf(paper);
      if (refs.length === 0) continue;
      const artifact = readArtifact(paper.source.arxivId);
      if (artifact.state !== "ready") continue; // covered above
      const index = buildBlockIndex(artifact.paper.html);
      const listCmd = `npm run arxiv:build -- --blocks ${paper.source.arxivId}`;
      for (const { edit, ref } of refs) {
        const info = index.get(ref.anchor);
        expect(
          info,
          `${paper.id}: edit targets unknown anchor ${ref.anchor} — run \`${listCmd}\``,
        ).toBeDefined();
        if (!info) continue;
        const sEnd = edit.op === "hide" ? (edit.sEnd ?? ref.s) : ref.s;
        if (edit.op === "hide" && edit.sEnd !== undefined) {
          expect(
            ref.s !== undefined,
            `${paper.id}: hide at ${ref.anchor} sets sEnd without s — the engine would hide the whole block`,
          ).toBe(true);
        }
        if (ref.s !== undefined) {
          expect(
            ["p", "li", "blockquote"].includes(info.tag),
            `${paper.id}: ${ref.anchor} is <${info.tag}> — sentence refs need prose blocks`,
          ).toBe(true);
          expect(
            ref.s >= 1 && (sEnd ?? ref.s) <= info.sentences.length && (sEnd ?? ref.s) >= ref.s,
            `${paper.id}: ${ref.anchor} has ${info.sentences.length} sentences, ` +
              `edit references s=${ref.s}${sEnd !== ref.s ? `..${sEnd}` : ""} — run \`${listCmd} --section …\``,
          ).toBe(true);
        } else if (edit.op === "hide") {
          expect(
            !/^h[1-6]$/.test(info.tag),
            `${paper.id}: hide may not target heading ${ref.anchor} (nav/scroll anchor)`,
          ).toBe(true);
        }
        const targetText = ref.s !== undefined ? info.sentences[ref.s - 1] : info.text;
        expect(ref.snippet.trim().length, `${paper.id}: empty snippet at ${ref.anchor}`).toBeGreaterThan(0);
        expect(
          normalizeText(targetText ?? "").startsWith(normalizeText(ref.snippet)),
          `${paper.id}: snippet drift at ${ref.anchor}${ref.s ? ` s=${ref.s}` : ""} — ` +
            `expected text starting "${ref.snippet}", target starts "${(targetText ?? "").slice(0, 70)}" — ` +
            `re-run \`${listCmd}\` and re-verify this edit`,
        ).toBe(true);
      }
    }
  });

  it("hides do not overlap and nothing renders inside a hidden region", () => {
    for (const paper of papers) {
      const artifactState = readArtifact(paper.source.arxivId);
      if (artifactState.state !== "ready") continue;
      const index = buildBlockIndex(artifactState.paper.html);
      const hides = (paper.edits ?? []).flatMap((edit) =>
        edit.op === "hide" ? [edit] : [],
      );
      // Expand each hide to covered units: "anchor" (whole block, incl.
      // descendant anchors) or "anchor:s".
      const covered = new Map<string, string>(); // unit → hiding anchor
      const coverUnit = (unit: string, owner: string) => {
        expect(
          covered.has(unit),
          `${paper.id}: overlapping hides at ${unit} (${covered.get(unit)} and ${owner})`,
        ).toBe(false);
        covered.set(unit, owner);
      };
      for (const hide of hides) {
        const { anchor, s } = hide.at;
        if (s !== undefined) {
          for (let i = s; i <= (hide.sEnd ?? s); i++) coverUnit(`${anchor}:${i}`, anchor);
          continue;
        }
        coverUnit(anchor, anchor);
        const info = index.get(anchor);
        for (let i = 1; i <= (info?.sentences.length ?? 0); i++) {
          coverUnit(`${anchor}:${i}`, anchor);
        }
        for (const [other, otherInfo] of index) {
          let parent = otherInfo.parentAnchor;
          while (parent) {
            if (parent === anchor) {
              // Cover the descendant block AND its sentence units — an
              // inline add after a sentence of a hidden container would
              // render invisibly inside the collapsed marker.
              coverUnit(other, anchor);
              for (let i = 1; i <= otherInfo.sentences.length; i++) {
                coverUnit(`${other}:${i}`, anchor);
              }
              break;
            }
            parent = index.get(parent)?.parentAnchor;
          }
        }
      }
      // Adds/activities may not target a hidden unit, except the last unit of
      // its own range (hide-then-replace idiom renders after the marker).
      const lastUnits = new Set(
        hides.map((hide) =>
          hide.at.s !== undefined
            ? `${hide.at.anchor}:${hide.sEnd ?? hide.at.s}`
            : hide.at.anchor,
        ),
      );
      for (const { edit, ref } of blockRefsOf(paper)) {
        if (edit.op === "hide") continue;
        const unit = ref.s !== undefined ? `${ref.anchor}:${ref.s}` : ref.anchor;
        if (!covered.has(unit)) continue;
        expect(
          lastUnits.has(unit),
          `${paper.id}: ${edit.op} after ${unit} is inside a hidden range — ` +
            `target the range's last unit or move it outside`,
        ).toBe(true);
      }
      // Mid-paragraph activities may not split a hidden block.
      for (const { edit, ref } of blockRefsOf(paper)) {
        if (edit.op !== "activity" || ref.s === undefined) continue;
        expect(
          covered.has(ref.anchor),
          `${paper.id}: mid-paragraph activity splits hidden block ${ref.anchor}`,
        ).toBe(false);
      }
    }
  });

  it("edit markdown is non-empty and sentence-level adds pass the renderer's inline gate", () => {
    for (const paper of papers) {
      for (const edit of paper.edits ?? []) {
        if (edit.op !== "add") continue;
        expect(edit.markdown.trim().length, `${paper.id}: empty add markdown`).toBeGreaterThan(0);
        const inline = "anchor" in edit.after && edit.after.s !== undefined;
        if (inline) {
          // The EXACT runtime gate — a heuristic here would let markdown pass
          // CI that the renderer silently drops (CommonMark lists/headings
          // can interrupt a paragraph without a blank line).
          expect(
            markdownInlineToHast(edit.markdown),
            `${paper.id}: sentence-level add must render as a single inline paragraph ` +
              `(no lists/headings/fences — even after a single newline)`,
          ).not.toBeNull();
        }
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
            for (const edit of item.paper.edits ?? []) {
              if (edit.op !== "activity") continue;
              for (const inserted of edit.items) {
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
