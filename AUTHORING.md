# Authoring guide

How to add content to Tracks. **Content is code**: the graph (tracks → modules →
lessons and papers, plus exercises, assessments, resources) is defined in typed TS
data files under `src/content/`, and lesson bodies are MDX under
`src/content/lessons/`. There is **no database or CMS for content** and **no route
files to add** — pages resolve by slug automatically.

A few rules that apply throughout:

- **Hierarchy:** `Track → Module → items`. A track holds ordered **modules**; a
  module holds ordered **items** — lessons (an MDX page), papers (a full-page inline
  arXiv reading, §2), and readers (several lessons stitched into one numbered page,
  §6), interleaved in any order. (In Khan terms a module is a "lesson/unit" and an
  item is a "sublesson" — the page learners read.)
- **The `*Ids` arrays drive everything.** Adding a `Lesson`/`Paper`/`Reader`/`Module`/
  `Track` object is not enough — you must also list its `id` in the parent's
  `itemIds` / `moduleIds` array. Those arrays set order (sidebar, prev/next) and
  membership. (A reader's own lessons are the exception: they live in `readers.data.ts`
  and stay OUT of `itemIds`.)
- **`id` is globally unique; `slug` is unique within its parent.** URLs use slugs:
  `/tracks/<trackSlug>/<moduleSlug>/<itemSlug>` (lessons, papers, and readers share
  the namespace; `assessment` is reserved).
- **Verify after editing:** `npm run typecheck` (catches shape errors) and
  `npm run test` — `src/lib/content/content.test.ts` checks referential integrity
  (every `moduleIds`/`itemIds`/`prerequisiteModuleIds`/`assessmentId` resolves,
  paper artifacts are built at the current converter version, and every paper
  insertion resolves to a real section/exercise/lesson), and `readers.test.ts`
  checks reader integrity and that the committed reader output is not stale.
- Placeholder copy is lorem ipsum — keep it lorem or leave it empty; don't invent
  real curriculum. (Paper titles/authors are factual — they come from arXiv.)

---

## 1. Add a lesson / sublesson to a track

A "sublesson" is a `Lesson` — the MDX page inside a module. To add one to an
**existing** module:

1. **Add the lesson object** to the `lessons` array in
   `src/content/curriculum.data.ts`:

   ```ts
   {
     id: "g-intro-l3",        // globally unique
     slug: "frameworks",      // unique within the module; used in the URL
     moduleId: "g-intro",     // the module it belongs to
     title: "Governance frameworks",
     contentRef: "g-intro-l3", // MDX filename (without .mdx); convention: same as id
     estimatedMinutes: 12,
   }
   ```

2. **Register it in the module's `itemIds`** (same file) — insert the `id` at the
   position you want it to appear (order in the array is the order learners see):

   ```ts
   // module "g-intro"
   itemIds: ["g-intro-l1", "g-intro-l2", "g-intro-l3"],
   ```

3. **Create the MDX body** at `src/content/lessons/<contentRef>.mdx`
   (e.g. `src/content/lessons/g-intro-l3.mdx`). If the file is missing the lesson
   404s. Inside the MDX you can use these components (no imports needed):

   ```mdx
   Lorem ipsum intro paragraph.

   <Video src="https://www.youtube.com/watch?v=…" title="Optional caption" />

   ## A heading

   <Callout variant="tip" title="Optional title">A note for learners.</Callout>

   <Demo id="sample-demo" />

   <Exercise id="ex-mc-3" />

   A claim that needs a source.<Footnote>The footnote body — can hold prose, links,
   `code`, etc.</Footnote>
   ```

   - `<Video src … title? provider? poster? />` — provider (`youtube`/`vimeo`/`file`)
     is inferred from the URL when omitted.
   - `<Callout variant?="note|tip|warning" title?>…</Callout>` (defaults to `note`).
   - `<Demo id="…" />` — a demo registered in the demo registry (see §3–4).
   - `<Exercise id="…" />` — an exercise defined in `src/content/exercises.data.ts`.
   - `<ArxivPaper id="1706.03762v7" defaultOpen? />` — embeds an arXiv paper,
     rendered from its LaTeX source with KaTeX math (collapsible card).
     **The version suffix (`v7`) is required**: it pins an immutable snapshot,
     which is what makes caching and (future) highlight anchors safe. Rendering
     is best-effort by design — TikZ diagrams and vector-PDF/EPS figures show
     placeholders linking to the PDF, exotic packages degrade with a warning
     chip in the card footer. Papers without LaTeX source (PDF-only
     submissions) render a link card instead. After adding a paper, build its
     committed artifact locally and commit the result — papers convert at
     authoring time, never in production: `npm run arxiv:build`, then commit
     the generated `src/content/arxiv/{id}.json` and `public/arxiv/{id}/…`
     files alongside the lesson. For a **full-page paper** with exercises and
     lessons interleaved into its sections, use a `Paper` module item instead —
     see §2.
   - `<Footnote>…</Footnote>` — drop it right after the word/claim it annotates, no
     id needed. It numbers itself automatically (in document order) and renders as
     a sidenote in the right margin on wide screens, or a tap-to-expand marker on
     narrower ones — no separate "References" section at the bottom of the lesson.

The lesson is now live at `/tracks/<trackSlug>/<moduleSlug>/<itemSlug>` and shows
in the sidebar + prev/next.

**Adding a new module** (a new unit / top-level "lesson" in the track) is the same
shape one level up: add a `Module` to the `modules` array (`id`, `slug`, `trackId`,
`title`, `summary`, `order`, `prerequisiteModuleIds: []`, `itemIds: []`, optional
`assessmentId` / `furtherReadingTopics` / `estimatedMinutes`), add its `id` to the
track's `moduleIds`, then add lessons as above. To attach an end-of-module
assessment, add an `Assessment` to `src/content/assessments.data.ts` with
`moduleId` set to the module, and set the module's `assessmentId` to match.

---

## 2. Add an arXiv paper to a module

A `Paper` is a first-class module item: the arXiv paper renders **full-page**
inline (LaTeX → HTML with KaTeX), the sidebar grows a per-paper section tree with
scroll-synced highlighting, and you can splice **activities** — exercise cards and
inline lessons — into the reading at the end of any (sub)section. Papers count
toward progress exactly like lessons.

1. **Add the paper object** to `src/content/papers.data.ts`:

   ```ts
   {
     id: "g-intro-p1",                 // globally unique (shared space with lessons)
     slug: "some-paper",               // unique within the module; used in the URL
     moduleId: "g-intro",
     title: "Paper Title (factual, from arXiv)",
     source: { kind: "arxiv", arxivId: "2301.12345v2" }, // pinned version required
     estimatedMinutes: 45,             // optional; fold into module.estimatedMinutes
     insertions: [                     // optional activities, see step 4
       {
         sectionId: "ax-sec-some-section",
         items: [
           { kind: "exercise", id: "some-exercise" },
           { kind: "lesson", id: "g-intro-p1-note" },
         ],
       },
     ],
   }
   ```

2. **Register it in the module's `itemIds`** (in `curriculum.data.ts`), interleaved
   wherever it belongs: `itemIds: ["g-intro-l1", "g-intro-p1", "g-intro-l2"]`.

3. **Build + commit the artifact**: `npm run arxiv:build` (it discovers arXiv ids
   from `papers.data.ts` and from `<ArxivPaper/>` embeds in lessons), then commit
   `src/content/arxiv/{id}.json` and `public/arxiv/{id}/…`.

4. **Choosing insertion `sectionId`s**: the build prints each paper's section tree
   (`§3.2 Multi-Head Attention → ax-sec-multi-head-attention`); re-print anytime
   from the committed artifact — no network — with
   `npm run arxiv:build -- --toc 2301.12345v2`. An insertion renders at the **end
   of that section's subtree** (after its subsections, before the next
   same-or-shallower heading); landmark ids (`ax-abstract`, `ax-references`) work
   too. Ids are stable for a pinned arXiv version + converter version.

5. **Insertion items**:
   - `kind: "exercise"` — an id from `src/content/exercises.data.ts`; renders the
     standard exercise card in the paper flow. An exercise can be inserted at
     most once per paper (its block gets a DOM anchor id; reusing it across
     different papers is fine).
   - `kind: "lesson"` — a regular `Lesson` in `curriculum.data.ts` with its own MDX
     body, but **not** listed in any module's `itemIds` (it renders only inside the
     paper, completes on scroll-past, and shows in the paper's sidebar tree). A
     lesson can be inserted into at most one paper.

6. **Rebuild on converter bumps**: when `CONVERTER_VERSION` changes, `npm run test`
   fails on stale artifacts — re-run `npm run arxiv:build` and recommit. Section
   ids can change across bumps/versions; the tests name any insertion that broke.

Degradation: a paper whose artifact isn't `ready` (PDF-only, unbuilt, failed)
renders a link-out fallback page, with its activities stacked below so progress
stays completable.

---

## 3. Create a new demo

A demo is a **self-contained client component** with no app dependencies and **no
required props** (the registry renders it as `<Component />`).

1. **Write the component** under `src/components/demos/` — either add to
   `sample-demos.tsx` or create a new file. It must start with `"use client"`:

   ```tsx
   "use client";
   import { useState } from "react";

   export function MyDemo() {
     const [n, setN] = useState(0);
     return <button onClick={() => setN(n + 1)}>Clicked {n}</button>;
   }
   ```

2. **Register it** in `src/lib/demos/registry.ts` — import the component and add an
   entry keyed by a unique `id` (a `DemoDefinition`):

   ```ts
   import { MyDemo } from "@/components/demos/sample-demos";

   export const demoRegistry: Record<string, DemoDefinition> = {
     // …existing entries…
     "my-demo": {
       id: "my-demo",
       title: "My demo",
       description: "What it shows.", // optional
       component: MyDemo,
       tags: ["placeholder"],         // optional
     },
   };
   ```

That's all. The demo is now reachable everywhere by its `id`: the gallery
(`/demos`), a standalone page (`/demos/my-demo`), the chrome-less iframe embed
(`/demos/my-demo/embed`), and inside any lesson via `<Demo id="my-demo" />`. The
demo renders inside a titled `DemoFrame` by default.

---

## 4. Add a demo to a track

Demos attach to a track by being embedded in one of its lessons:

1. Make sure the demo is registered (see §3) and note its `id`.
2. In the target lesson's MDX (`src/content/lessons/<contentRef>.mdx`), drop the tag
   where you want it:

   ```mdx
   <Demo id="my-demo" />
   ```

It renders inline in that lesson within the track. The tag only takes `id` — demo
state/props live inside the component itself. (Demos are also browsable in the
`/demos` gallery and embeddable in external pages via `/demos/<id>/embed` without
touching any track.)

---

## 5. Create a new track

1. **Add the track** to the `tracks` array in `src/content/curriculum.data.ts`:

   ```ts
   {
     id: "evals",
     slug: "evals",                       // URL: /tracks/evals
     title: "AI Evaluations",
     shortTitle: "Evals",                 // optional, for compact UI
     description: "Lorem ipsum…",
     kind: "technical",                   // "foundations" | "technical" | "governance"
     moduleIds: ["e-intro"],              // ordered module IDs (added next)
     prerequisiteEnforcement: "soft",     // "soft" (warn) | "hard" (lock)
     estimatedHours: 12,                  // optional
   }
   ```

2. **Add its modules** to the `modules` array, each with `trackId: "evals"`, and
   list their `id`s in the track's `moduleIds` (ordered). See §1 for module fields.

3. **Add lessons + MDX** for each module as in §1.

4. **Optional content:** assessments (`assessments.data.ts` + `module.assessmentId`),
   exercises (`exercises.data.ts`, referenced via `<Exercise id />` in MDX), and
   "Further reading" (tag resources in `resources.data.ts`, then set the module's
   `furtherReadingTopics` to matching topic strings).

The track appears on `/tracks` and is reachable at `/tracks/<slug>` automatically —
no routing or DB changes. Prerequisites may point at modules in **other** tracks
(cross-track gating), so you can require a Foundations/Control module before a
Governance one.

> **New `kind` value?** `kind` is the `TrackKind` union in
> `src/lib/content/types.ts`. To add a kind beyond foundations/technical/governance,
> extend that union **and** add a label to the `KIND_LABEL` map in
> `src/app/tracks/page.tsx`.

---

## 6. Bundle lessons into a reader

A **reader** stitches an ordered set of lessons into one long, scrollable page:
each lesson's title becomes a top-level `#` section and its own headings nest
below, with **generated `1.1.1` numbering** in both the body and the sidebar
section tree. The referenced lessons have **no standalone page** — they render
only inside the reader (like a paper's inserted lessons). Compiling the whole
thing as one MDX document is what keeps every heading's anchor id unique, so the
combined body and its TOC are **precomputed** by a build step.

1. **Define the reader** in `src/content/readers.data.ts` (`id`, `slug` unique in
   the module, `moduleId`, `title`, ordered `lessonIds`, optional
   `estimatedMinutes`). The lessons are ordinary `Lesson` entries in
   `curriculum.data.ts` — authored exactly like any lesson (§1), with embedded
   `<Demo>`/`<Exercise>`/`<Footnote>` and `$math$`.

2. **Add the reader's `id` to its module's `itemIds`** (in `curriculum.data.ts`).
   Do **not** add the reader's lessons to `itemIds` — that is what keeps them
   reader-only.

3. **Build the combined document:** `npm run readers:build`. This regenerates
   `src/content/readers/<id>.mdx` (the concatenated body) and
   `readers/tocs.generated.ts` (the numbered section tree). **Commit both.** The
   transform, per lesson: shift the lesson's headings so its shallowest becomes
   `##`, strip any manual `N.` section number from headings (the reader supplies
   its own), then prepend the lesson title as `#`. Re-run it after editing the
   reader or **any lesson it includes**; `readers.test.ts` fails if the committed
   output is stale.

The reader is now live at `/tracks/<trackSlug>/<moduleSlug>/<readerSlug>`, with the
numbered section tree in the sidebar (reusing the paper section-nav) and matching
`1.1.1` numbers rendered in the body via CSS counters (`.reader-body`, globals.css).
A reader counts as one completion unit.
