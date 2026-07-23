import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getGlossaryTerm,
  glossaryTerms,
  resolveGlossaryTerm,
} from "@/lib/content/glossary";
import { papers } from "@/lib/content";

// Integrity of the hand-authored glossary registry
// (src/content/glossary.json) and of every reference into it: <Term> tags in
// lesson MDX and `gloss` edits in papers.data.ts. Phrase-level validation of
// gloss targets (does the phrase exist as plain text in the artifact?) lives
// in content.test.ts next to the other artifact-backed checks.

describe("glossary integrity", () => {
  it("term ids are unique kebab-case with non-empty copy", () => {
    const ids = glossaryTerms.map((t) => t.id);
    expect(new Set(ids).size, "duplicate glossary id").toBe(ids.length);
    for (const term of glossaryTerms) {
      expect(term.id, `bad id "${term.id}"`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(term.term.trim(), `${term.id}: empty display name`).not.toBe("");
      expect(term.definition.trim(), `${term.id}: empty definition`).not.toBe("");
      if (term.source) {
        expect(term.source.label.trim(), `${term.id}: empty source label`).not.toBe("");
        if (term.source.url) {
          expect(term.source.url, `${term.id}: source url`).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it("display names and aliases resolve unambiguously (case-insensitive)", () => {
    const seen = new Map<string, string>();
    for (const term of glossaryTerms) {
      for (const surface of [term.term, ...(term.aliases ?? [])]) {
        const key = surface.replace(/\s+/g, " ").trim().toLowerCase();
        expect(key, `${term.id}: empty alias`).not.toBe("");
        expect(
          seen.has(key),
          `surface "${surface}" maps to both ${seen.get(key)} and ${term.id}`,
        ).toBe(false);
        seen.set(key, term.id);
      }
    }
  });

  it("seeAlso ids resolve and never self-reference", () => {
    for (const term of glossaryTerms) {
      for (const id of term.seeAlso ?? []) {
        expect(getGlossaryTerm(id), `${term.id}: seeAlso "${id}"`).toBeDefined();
        expect(id, `${term.id}: seeAlso references itself`).not.toBe(term.id);
      }
    }
  });

  it("every <Term> in lesson MDX resolves to a glossary entry", () => {
    const lessonsDir = join(process.cwd(), "src/content/lessons");
    for (const file of readdirSync(lessonsDir)) {
      if (!file.endsWith(".mdx")) continue;
      const body = readFileSync(join(lessonsDir, file), "utf8");
      for (const match of body.matchAll(/<Term\b([^>]*?)(\/)?>/g)) {
        const attrs = match[1];
        // Accept the quoted-literal spellings MDX allows; anything else
        // (id={expr}, unquoted) must fail here rather than fall through to
        // children-text resolution while the runtime resolves the id.
        const idMatch =
          /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})/.exec(
            attrs,
          );
        const id = idMatch?.[1] ?? idMatch?.[2] ?? idMatch?.[3];
        if (/\bid\s*=/.test(attrs)) {
          expect(
            id,
            `${file}: <Term> id must be a quoted literal (got \`${attrs.trim()}\`)`,
          ).toBeTruthy();
        }
        if (id) {
          expect(
            getGlossaryTerm(id),
            `${file}: unknown term id "${id}"`,
          ).toBeDefined();
          continue;
        }
        // Without an id, the component resolves the children text — so the
        // tag must wrap plain text (no nesting, no expressions).
        expect(
          match[2],
          `${file}: a self-closing <Term/> needs an id`,
        ).toBeUndefined();
        const rest = body.slice(match.index! + match[0].length);
        const close = rest.indexOf("</Term>");
        expect(close, `${file}: unclosed <Term>`).toBeGreaterThan(-1);
        const inner = rest.slice(0, close);
        expect(inner, `${file}: <Term> children must be plain text`).not.toMatch(
          /[<{]/,
        );
        expect(
          resolveGlossaryTerm(inner.replace(/\s+/g, " ").trim()),
          `${file}: <Term>${inner.trim()}</Term> doesn't resolve — give it an id or add an alias to glossary.json`,
        ).toBeDefined();
      }
    }
  });

  it("every paper gloss edit references a real glossary term with a phrase", () => {
    for (const paper of papers) {
      for (const edit of paper.edits ?? []) {
        if (edit.op !== "gloss") continue;
        expect(
          getGlossaryTerm(edit.termId),
          `${paper.id}: gloss termId "${edit.termId}" not in glossary.json`,
        ).toBeDefined();
        expect(edit.phrase.trim(), `${paper.id}: empty gloss phrase`).not.toBe("");
      }
    }
  });

  // The auto-gloss opt-out list (rehype-auto-gloss.mjs matches lesson MDX
  // basenames against it) fails silently on a stale entry, so pin both
  // directions: every listed id must be a real lesson, and every
  // verbatim-reproduced lesson (the "Reproduced verbatim" attribution line is
  // the project's marker) must be listed — reproduced prose is never
  // decorated by default.
  it("autoGlossExclude names real lessons and covers every verbatim reproduction", () => {
    const registry = JSON.parse(
      readFileSync(join(process.cwd(), "src/content/glossary.json"), "utf8"),
    ) as { autoGlossExclude?: string[] };
    const exclude = new Set(registry.autoGlossExclude ?? []);
    const lessonsDir = join(process.cwd(), "src/content/lessons");
    const lessonIds = new Set(
      readdirSync(lessonsDir)
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => f.replace(/\.mdx$/, "")),
    );
    for (const id of exclude) {
      expect(
        lessonIds.has(id),
        `autoGlossExclude entry "${id}" has no matching lesson MDX — stale after a rename?`,
      ).toBe(true);
    }
    for (const id of lessonIds) {
      const body = readFileSync(join(lessonsDir, `${id}.mdx`), "utf8");
      if (!body.includes("Reproduced verbatim")) continue;
      expect(
        exclude.has(id),
        `verbatim-reproduced lesson "${id}" is missing from autoGlossExclude in glossary.json`,
      ).toBe(true);
    }
  });
});
