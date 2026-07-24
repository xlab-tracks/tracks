import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { lessons, modules } from "@/content/curriculum.data";
import { exercises } from "@/content/exercises.data";
import { assessments } from "@/content/assessments.data";
import { ARGUE_REVEAL_DEFAULTS } from "@/lib/content/types";
import { featuredExercises } from "@/app/exercises/featured";
import {
  getAssessmentForModule,
  getExerciseById,
  getItemNavigation,
  getItemsForModule,
  getLessonById,
  getModuleProgressContentIds,
  getContentLocation,
  getModulesForTrack,
  getPrerequisiteModules,
  getTrackItemSequence,
  itemIdOf,
  itemSlugOf,
  paperResources,
  papers,
  resources,
  tracks,
} from "@/lib/content";
import { parseArxivId } from "@/lib/arxiv/id";
import { getDemo } from "@/lib/demos/registry";
import {
  CONVERTER_VERSION,
  type PaperArtifact,
  type PaperTocEntry,
} from "@/lib/arxiv/types";
import { parseSubstackPostUrl } from "@/lib/substack/id";
import {
  SUBSTACK_CONVERTER_VERSION,
  type SubstackArtifact,
} from "@/lib/substack/types";
import { parseLessWrongPostUrl } from "@/lib/lesswrong/id";
import {
  LESSWRONG_CONVERTER_VERSION,
  type LessWrongArtifact,
} from "@/lib/lesswrong/types";
import {
  editTargetRef,
  isSectionEndRef,
  type Paper,
} from "@/lib/content/types";
import { getGlossaryTerm } from "@/lib/content/glossary";
import { buildBlockIndex, normalizeText } from "@/lib/papers/block-index";
import { markdownInlineToHast } from "@/lib/papers/markdown";
import { findSentenceSpan, wrapGlossPhrase } from "@/lib/papers/patch-section";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import type { Element, Root } from "hast";

describe("content integrity", () => {
  it("every track's modules resolve and belong to it", () => {
    for (const track of tracks) {
      const modules = getModulesForTrack(track.id);
      expect(modules.length).toBe(track.moduleIds.length);
      for (const m of modules) expect(m.trackId).toBe(track.id);
    }
  });

  it("every module item resolves to exactly one lesson or paper", () => {
    const lessonIds = new Set(lessons.map((l) => l.id));
    const paperIds = new Set(papers.map((p) => p.id));
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        expect(getItemsForModule(m.id).length).toBe(m.itemIds.length);
        for (const id of m.itemIds) {
          expect(lessonIds.has(id) !== paperIds.has(id)).toBe(true);
        }
      }
    }
  });

  it("content ids are globally unique across lessons and papers", () => {
    const ids = [...lessons.map((l) => l.id), ...papers.map((p) => p.id)];
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

  // The content indexes are `new Map(xs.map(x => [x.id, x]))`, so a duplicate
  // id silently shadows (last wins) — e.g. a duplicate exercise id would swap
  // the answer key gradeExercise reads. Guard every id/slug space explicitly.
  it("ids and slugs are unique across every content collection", () => {
    const dupId = (xs: { id: string }[]) => {
      const ids = xs.map((x) => x.id);
      expect(new Set(ids).size, `duplicate id in ${JSON.stringify(ids)}`).toBe(
        ids.length,
      );
    };
    dupId(tracks);
    dupId(modules);
    dupId(exercises);
    dupId(assessments);
    // The hub renders curated + paper-derived entries as one keyed list.
    dupId([...resources, ...paperResources]);

    const trackSlugs = tracks.map((t) => t.slug);
    expect(new Set(trackSlugs).size).toBe(trackSlugs.length);

    // Module slugs must be unique within their own track (they form the URL).
    for (const track of tracks) {
      const slugs = getModulesForTrack(track.id).map((m) => m.slug);
      expect(new Set(slugs).size, `duplicate module slug in ${track.id}`).toBe(
        slugs.length,
      );
    }

    // At most one assessment per module.
    const assessmentModuleIds = assessments.map((a) => a.moduleId);
    expect(new Set(assessmentModuleIds).size).toBe(assessmentModuleIds.length);
  });

  // Every real-track paper links out from the resource hub; the Example
  // track's papers (feature reference, not curriculum) must not leak in.
  it("paper-derived resources cover every real-track paper source", () => {
    const urls = new Set(paperResources.map((r) => r.url));
    for (const track of tracks) {
      if (track.kind === "example") continue;
      for (const mod of getModulesForTrack(track.id)) {
        for (const item of getItemsForModule(mod.id)) {
          if (item.kind !== "paper") continue;
          const source = item.paper.source;
          const url =
            source.kind === "arxiv"
              ? `https://arxiv.org/abs/${source.arxivId}`
              : source.postUrl;
          expect(urls.has(url), `${item.paper.id} missing from hub`).toBe(true);
        }
      }
    }
    const examplePaperIds = new Set(
      papers.filter((p) => p.moduleId.startsWith("ex-")).map((p) => p.id),
    );
    for (const r of paperResources) {
      const paperId = r.id.replace(/^paper-res-/, "");
      expect(
        examplePaperIds.has(paperId),
        `${r.id} derives from an Example-track paper`,
      ).toBe(false);
      // The hub links course readings to their in-course viewer.
      expect(r.internalHref, `${r.id} internalHref`).toBe(
        getContentLocation(paperId)?.href,
      );
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

describe("control-scenarios exercise integrity", () => {
  const controlScenarios = exercises.flatMap((e) =>
    e.type === "control-scenarios" ? [e] : [],
  );

  it("scenario ids are unique and copy is non-empty", () => {
    for (const exercise of controlScenarios) {
      expect(exercise.scenarios.length, `${exercise.id} scenarios`).toBeGreaterThan(0);
      const ids = exercise.scenarios.map((s) => s.id);
      expect(new Set(ids).size, `${exercise.id} has duplicate scenario ids`).toBe(
        ids.length,
      );
      for (const s of exercise.scenarios) {
        for (const [field, value] of Object.entries({
          displayTitle: s.displayTitle,
          card: s.card,
          outcome: s.outcome,
          revealName: s.revealName,
          reveal: s.reveal,
        })) {
          expect(value.trim(), `${exercise.id}/${s.id} ${field}`).not.toBe("");
        }
      }
    }
  });

  it("graphs are well-formed: unique node ids, edges resolve, actors defined", () => {
    for (const exercise of controlScenarios) {
      const actorIds = new Set(exercise.actors.map((a) => a.id));
      for (const s of exercise.scenarios) {
        const nodeIds = s.graph.nodes.map((n) => n.id);
        expect(
          new Set(nodeIds).size,
          `${exercise.id}/${s.id} has duplicate node ids`,
        ).toBe(nodeIds.length);
        const known = new Set(nodeIds);
        for (const edge of s.graph.edges) {
          expect(known.has(edge.from), `${exercise.id}/${s.id} edge from ${edge.from}`).toBe(true);
          expect(known.has(edge.to), `${exercise.id}/${s.id} edge to ${edge.to}`).toBe(true);
        }
        for (const node of s.graph.nodes) {
          if (node.kind === "actor") {
            expect(
              node.actor && actorIds.has(node.actor),
              `${exercise.id}/${s.id} node ${node.id} has an undefined actor`,
            ).toBe(true);
          }
        }
      }
    }
  });
});

describe("staged-questions exercise integrity", () => {
  const stagedQuestions = exercises.flatMap((e) =>
    e.type === "staged-questions" ? [e] : [],
  );

  it("parts and questions are non-empty with unique ids", () => {
    for (const exercise of stagedQuestions) {
      expect(exercise.parts.length, `${exercise.id} parts`).toBeGreaterThan(0);
      const questions = exercise.parts.flatMap((p) => p.questions);
      expect(questions.length, `${exercise.id} questions`).toBeGreaterThan(0);
      const ids = [...exercise.parts.map((p) => p.id), ...questions.map((q) => q.id)];
      expect(new Set(ids).size, `${exercise.id} has duplicate part/question ids`).toBe(
        ids.length,
      );
      for (const q of questions) {
        for (const [field, value] of Object.entries({
          title: q.title,
          question: q.question,
          reveal: q.reveal,
        })) {
          expect(value.trim(), `${exercise.id}/${q.id} ${field}`).not.toBe("");
        }
        if (q.acknowledgement !== undefined) {
          expect(q.acknowledgement.trim(), `${exercise.id}/${q.id} acknowledgement`).not.toBe("");
        }
        // A forward link must point somewhere and appear in the forward text.
        if (q.forwardLinkText || q.forwardHref) {
          expect(q.forward, `${exercise.id}/${q.id} forward`).toBeTruthy();
          expect(q.forwardHref, `${exercise.id}/${q.id} forwardHref`).toBeTruthy();
          expect(
            q.forward!.includes(q.forwardLinkText!),
            `${exercise.id}/${q.id} forwardLinkText not in forward`,
          ).toBe(true);
        }
      }
    }
  });
});

describe("commit-construct exercise integrity", () => {
  const commitConstructs = exercises.flatMap((e) =>
    e.type === "commit-construct" ? [e] : [],
  );

  it("options are unique, guidance keys resolve, and copy is non-empty", () => {
    for (const exercise of commitConstructs) {
      const optionIds = exercise.commit.options.map((o) => o.id);
      const confidenceIds = exercise.commit.confidenceOptions.map((o) => o.id);
      expect(optionIds.length, `${exercise.id} options`).toBeGreaterThanOrEqual(2);
      expect(confidenceIds.length, `${exercise.id} confidence`).toBeGreaterThanOrEqual(2);
      for (const ids of [optionIds, confidenceIds]) {
        expect(new Set(ids).size, `${exercise.id} has duplicate option ids`).toBe(
          ids.length,
        );
      }
      for (const key of Object.keys(exercise.construct.guidanceByChoice ?? {})) {
        expect(
          optionIds.includes(key),
          `${exercise.id} guidance key "${key}" is not an option id`,
        ).toBe(true);
      }
      expect(
        exercise.construct.compareQuestions.length,
        `${exercise.id} compareQuestions`,
      ).toBeGreaterThan(0);
      for (const [field, value] of Object.entries({
        question: exercise.commit.question,
        commitReveal: exercise.commit.reveal,
        threatPrompt: exercise.construct.threatPrompt,
        revealLead: exercise.construct.revealLead,
        constructReveal: exercise.construct.reveal,
      })) {
        expect(value.trim(), `${exercise.id} ${field}`).not.toBe("");
      }
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
      const ref = editTargetRef(edit);
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

  it("notes appear only on expandable hides (a silent hide renders no marker to label)", () => {
    for (const paper of papers) {
      for (const edit of paper.edits ?? []) {
        if (edit.op !== "hide" || !edit.silent) continue;
        expect(
          edit.note === undefined,
          `${paper.id}: silent hide at ${edit.at.anchor} carries note "${edit.note}" — ` +
            `drop the note or the silent flag`,
        ).toBe(true);
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

  it("paper sources are valid and their artifacts are committed", () => {
    for (const paper of papers) {
      const source = paper.source;
      if (source.kind === "arxiv") {
        expect(
          parseArxivId(source.arxivId),
          `paper ${paper.id} needs a pinned arXiv id`,
        ).not.toBeNull();
      } else if (source.kind === "substack") {
        expect(
          parseSubstackPostUrl(source.postUrl),
          `paper ${paper.id} needs a public Substack post URL (https://{host}/p/{slug})`,
        ).not.toBeNull();
      } else {
        expect(
          parseLessWrongPostUrl(source.postUrl),
          `paper ${paper.id} needs a LessWrong/Alignment Forum post URL (https://{host}/posts/{id}/…)`,
        ).not.toBeNull();
      }
      const facts = artifactFactsOf(paper);
      expect(
        existsSync(facts.path),
        `artifact for ${facts.id} — run \`${facts.buildCmd}\``,
      ).toBe(true);
    }
  });

  it("every module-referenced paper has a ready, current-version artifact", () => {
    // Not just edited papers: any paper in a module renders an unavailable
    // card at runtime if its artifact is missing or stale, and CI should
    // catch that.
    for (const paper of papers) {
      const facts = artifactFactsOf(paper);
      const artifact = readArtifact(paper);
      expect(
        artifact.state,
        `${facts.id} must be ready — run \`${facts.buildCmd}\``,
      ).toBe("ready");
      if (!artifact.ready) continue;
      expect(
        artifact.ready.converterVersion,
        `${facts.id} artifact is stale — run \`${facts.buildCmd}\``,
      ).toBe(facts.expectedVersion);
    }
  });

  it("every ready artifact's listed assets are committed", () => {
    // The HTML hotlinks nothing — every image it references must exist as a
    // committed static file, or the deployed page renders broken images.
    for (const paper of papers) {
      const artifact = readArtifact(paper);
      if (!artifact.ready) continue;
      const facts = artifactFactsOf(paper);
      for (const assetPath of artifact.ready.assets) {
        expect(
          existsSync(join(facts.assetsDir, assetPath)),
          `${facts.id}: missing committed asset ${assetPath} — run \`${facts.buildCmd}\``,
        ).toBe(true);
      }
    }
  });

  it("every sectionEnd target is in the artifact toc", () => {
    for (const paper of papers) {
      const sectionEnds = (paper.edits ?? []).flatMap((edit) => {
        const ref = editTargetRef(edit);
        return isSectionEndRef(ref) ? [ref.sectionEnd] : [];
      });
      if (sectionEnds.length === 0) continue;
      const facts = artifactFactsOf(paper);
      const artifact = readArtifact(paper);
      if (!artifact.ready) continue; // covered above
      const tocIds = new Set(artifact.ready.toc.map((entry) => entry.id));
      for (const sectionEnd of sectionEnds) {
        expect(
          tocIds.has(sectionEnd),
          `sectionEnd ${sectionEnd} not in ${facts.id} toc — ` +
            `run \`${facts.tocCmd}\` to list valid ids`,
        ).toBe(true);
      }
    }
  });

  it("every block/sentence edit target exists with a matching snippet", () => {
    for (const paper of papers) {
      const refs = blockRefsOf(paper);
      if (refs.length === 0) continue;
      const artifact = readArtifact(paper);
      if (!artifact.ready) continue; // covered above
      const index = buildBlockIndex(artifact.ready.html);
      const listCmd = artifactFactsOf(paper).blocksCmd;
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
        } else if (edit.op === "hide" || edit.op === "gloss") {
          expect(
            !/^h[1-6]$/.test(info.tag),
            `${paper.id}: ${edit.op} may not target heading ${ref.anchor} (nav/scroll anchor)`,
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
      const artifact = readArtifact(paper);
      if (!artifact.ready) continue;
      const index = buildBlockIndex(artifact.ready.html);
      const hides = (paper.edits ?? []).flatMap((edit) =>
        edit.op === "hide" ? [edit] : [],
      );
      // Expand each hide to covered units: "anchor" (whole block, incl.
      // descendant anchors) or "anchor:s".
      const covered = new Map<string, string>(); // unit → hiding anchor
      const silentUnits = new Set<string>(); // units a SILENT hide removes
      const coverUnit = (unit: string, owner: string, silent: boolean) => {
        expect(
          covered.has(unit),
          `${paper.id}: overlapping hides at ${unit} (${covered.get(unit)} and ${owner})`,
        ).toBe(false);
        covered.set(unit, owner);
        if (silent) silentUnits.add(unit);
      };
      for (const hide of hides) {
        const { anchor, s } = hide.at;
        const silent = hide.silent === true;
        if (s !== undefined) {
          for (let i = s; i <= (hide.sEnd ?? s); i++) {
            coverUnit(`${anchor}:${i}`, anchor, silent);
          }
          continue;
        }
        coverUnit(anchor, anchor, silent);
        const info = index.get(anchor);
        for (let i = 1; i <= (info?.sentences.length ?? 0); i++) {
          coverUnit(`${anchor}:${i}`, anchor, silent);
        }
        for (const [other, otherInfo] of index) {
          let parent = otherInfo.parentAnchor;
          while (parent) {
            if (parent === anchor) {
              // Cover the descendant block AND its sentence units — an
              // inline add after a sentence of a hidden container would
              // render invisibly inside the collapsed marker.
              coverUnit(other, anchor, silent);
              for (let i = 1; i <= otherInfo.sentences.length; i++) {
                coverUnit(`${other}:${i}`, anchor, silent);
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
        if (edit.op === "gloss") {
          // A glossed phrase inside an EXPANDABLE hide is fine — it reveals
          // (and its card works) when the learner expands the marker. Inside
          // a silent hide the text is removed, so it would never render.
          expect(
            silentUnits.has(unit),
            `${paper.id}: gloss at ${unit} is inside a silently removed range ` +
              `and would never render`,
          ).toBe(false);
          continue;
        }
        if (!covered.has(unit)) continue;
        expect(
          lastUnits.has(unit),
          `${paper.id}: ${edit.op} after ${unit} is inside a hidden range — ` +
            `target the range's last unit or move it outside`,
        ).toBe(true);
        // Hide-then-replace after a silently removed li has nowhere valid to
        // land — the note renders inside the li (valid list markup), which
        // the silent hide then removes.
        expect(
          edit.op === "add" &&
            ref.s === undefined &&
            silentUnits.has(unit) &&
            index.get(ref.anchor)?.tag === "li",
          `${paper.id}: add after ${unit} would render inside a silently removed ` +
            `list item — move it after the list or hide expandably`,
        ).toBe(false);
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

  it("every gloss edit resolves: known term, unique target, phrase wrappable", () => {
    for (const paper of papers) {
      const glosses = (paper.edits ?? []).flatMap((edit) =>
        edit.op === "gloss" ? [edit] : [],
      );
      if (glosses.length === 0) continue;

      // Duplicate identical targets would nest or double-wrap triggers.
      const keys = glosses.map(
        (op) => `${op.at.anchor}:${op.at.s ?? 0}:${normalizeText(op.phrase)}`,
      );
      expect(new Set(keys).size, `${paper.id}: duplicate gloss edits`).toBe(
        keys.length,
      );

      const artifact = readArtifact(paper);
      if (!artifact.ready) continue; // covered above
      const tree = fromHtmlIsomorphic(artifact.ready.html, {
        fragment: true,
      }) as Root;
      const blockByAnchor = new Map<string, Element>();
      const collect = (node: Root | Element): void => {
        for (const child of node.children ?? []) {
          if (child.type !== "element") continue;
          const anchor = child.properties?.dataAnchor;
          if (typeof anchor === "string") blockByAnchor.set(anchor, child);
          collect(child);
        }
      };
      collect(tree);

      // Apply each block's glosses SEQUENTIALLY to one clone, in edits
      // order — the exact phase-A0 semantics. A pristine-clone-per-op check
      // would pass overlapping phrases ("trusted monitoring" then
      // "monitoring") that the runtime silently drops as unmatched, because
      // an earlier wrap consumes the text a later phrase needs.
      const cloneByAnchor = new Map<string, Element>();
      for (const op of glosses) {
        const where = `${op.at.anchor}${op.at.s ? ` s=${op.at.s}` : ""}`;
        expect(
          getGlossaryTerm(op.termId),
          `${paper.id}: gloss at ${where} references unknown term "${op.termId}" — add it to src/content/glossary.json`,
        ).toBeDefined();
        const block = blockByAnchor.get(op.at.anchor);
        if (!block) continue; // unknown anchors already failed the snippet test
        let clone = cloneByAnchor.get(op.at.anchor);
        if (!clone) {
          clone = structuredClone(block);
          cloneByAnchor.set(op.at.anchor, clone);
        }
        const target = op.at.s ? findSentenceSpan(clone, op.at.s) : clone;
        if (!target) continue; // out-of-range s already failed the snippet test
        // The EXACT runtime matcher — a phrase split by inline markup (a
        // link, citation, math, emphasis), or already consumed by an
        // earlier gloss on this block, must fail here, not silently at
        // render time.
        expect(
          wrapGlossPhrase(target, op.phrase, op.termId),
          `${paper.id}: gloss phrase "${op.phrase}" at ${where} is not wrappable — ` +
            `not plain running text there, or an earlier gloss already consumed it`,
        ).toBe(true);
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

  it("gates have unique stable ids, non-empty copy, and no sentence-level targets", () => {
    for (const paper of papers) {
      const gates = (paper.edits ?? []).flatMap((edit) =>
        edit.op === "gate" ? [edit] : [],
      );
      const ids = gates.map((gate) => gate.id);
      expect(
        new Set(ids).size,
        `${paper.id}: duplicate gate ids (they key the learner's opened state)`,
      ).toBe(ids.length);
      for (const gate of gates) {
        expect(gate.id.trim().length, `${paper.id}: empty gate id`).toBeGreaterThan(0);
        if (gate.prompt !== undefined) {
          expect(
            gate.prompt.trim().length,
            `${paper.id}: gate ${gate.id} has an empty prompt — omit it for a bare gate`,
          ).toBeGreaterThan(0);
        }
        if (gate.cta !== undefined) {
          expect(
            gate.cta.trim().length,
            `${paper.id}: gate ${gate.id} has an empty cta — omit it for the default`,
          ).toBeGreaterThan(0);
        }
        // The engine only supports section-end and whole-block gates
        // (patch-section fails soft on a sentence target; catch it here).
        expect(
          "anchor" in gate.after && gate.after.s !== undefined,
          `${paper.id}: gate ${gate.id} targets a sentence — gates take section ends or whole blocks`,
        ).toBe(false);
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

/** Per-source artifact facts: committed paths, expected version, CLI strings. */
function artifactFactsOf(paper: Paper): {
  id: string;
  path: string;
  assetsDir: string;
  buildCmd: string;
  tocCmd: string;
  blocksCmd: string;
  expectedVersion: number;
} {
  const source = paper.source;
  switch (source.kind) {
    case "arxiv":
      return {
        id: source.arxivId,
        path: join(process.cwd(), "src/content/arxiv", `${source.arxivId}.json`),
        assetsDir: join(process.cwd(), "public/arxiv", source.arxivId, "assets"),
        buildCmd: "npm run arxiv:build",
        tocCmd: `npm run arxiv:build -- --toc ${source.arxivId}`,
        blocksCmd: `npm run arxiv:build -- --blocks ${source.arxivId}`,
        expectedVersion: CONVERTER_VERSION,
      };
    case "substack": {
      // Unparseable URLs fail the source-validity test; keep messages readable.
      const id = parseSubstackPostUrl(source.postUrl)?.id ?? source.postUrl;
      return {
        id,
        path: join(process.cwd(), "src/content/substack", `${id}.json`),
        assetsDir: join(process.cwd(), "public/substack", id, "assets"),
        buildCmd: "npm run substack:build",
        tocCmd: `npm run substack:build -- --toc ${id}`,
        blocksCmd: `npm run substack:build -- --blocks ${id}`,
        expectedVersion: SUBSTACK_CONVERTER_VERSION,
      };
    }
    case "lesswrong": {
      const id = parseLessWrongPostUrl(source.postUrl)?.id ?? source.postUrl;
      return {
        id,
        path: join(process.cwd(), "src/content/lesswrong", `${id}.json`),
        assetsDir: join(process.cwd(), "public/lesswrong", id, "assets"),
        buildCmd: "npm run lesswrong:build",
        tocCmd: `npm run lesswrong:build -- --toc ${id}`,
        blocksCmd: `npm run lesswrong:build -- --blocks ${id}`,
        expectedVersion: LESSWRONG_CONVERTER_VERSION,
      };
    }
  }
}

/** Committed artifact, normalized across sources to the shared ready payload. */
function readArtifact(paper: Paper): {
  state: string;
  ready?: {
    html: string;
    toc: PaperTocEntry[];
    converterVersion: number;
    assets: string[];
  };
} {
  const facts = artifactFactsOf(paper);
  const raw = JSON.parse(readFileSync(facts.path, "utf8"));
  const artifact =
    paper.source.kind === "arxiv"
      ? (raw as PaperArtifact)
      : (raw as SubstackArtifact | LessWrongArtifact);
  if (artifact.state !== "ready") return { state: artifact.state };
  const ready = "paper" in artifact ? artifact.paper : artifact.post;
  if (!ready || typeof ready.html !== "string") {
    // Fail loudly, not by skipping — a malformed "ready" artifact must not
    // silently pass the ready/toc/snippet assertions above.
    throw new Error(
      `${facts.id}: artifact says "ready" but its payload is malformed — run \`${facts.buildCmd}\``,
    );
  }
  return { state: "ready", ready };
}
