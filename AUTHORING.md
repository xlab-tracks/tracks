# Authoring guide

How to add content to Tracks. **Content is code**: the graph (tracks → modules →
lessons and papers, plus exercises, assessments, resources) is defined in typed TS
data files under `src/content/`, and lesson bodies are MDX under
`src/content/lessons/`. There is **no database or CMS for content** and **no route
files to add** — pages resolve by slug automatically.

A few rules that apply throughout:

- **Hierarchy:** `Track → Module → items`. A track holds ordered **modules**; a
  module holds ordered **items** — lessons (an MDX page) and papers (a full-page
  inline arXiv reading, §2), interleaved in any order. (In Khan terms a module is
  a "lesson/unit" and an item is a "sublesson" — the page learners read.)
- **The `*Ids` arrays drive everything.** Adding a `Lesson`/`Paper`/`Module`/`Track`
  object is not enough — you must also list its `id` in the parent's `itemIds` /
  `moduleIds` array. Those arrays set order (sidebar, prev/next) and membership.
  (`Module.order` is display-only — it renders "Module N" labels; keep it in sync
  with the `moduleIds` position by hand.)
- **`id` is globally unique; `slug` is unique within its parent.** Lessons and
  papers share one id space and one slug namespace. URLs:
  `/tracks/<trackSlug>/<moduleSlug>/<itemSlug>`; the segment `assessment` is
  reserved (it's the module's assessment page).
- **Verify after editing:** `npm run typecheck` (catches shape errors) and
  `npm run test` — `src/lib/content/content.test.ts` checks referential integrity
  (every `moduleIds`/`itemIds`/`prerequisiteModuleIds`/`assessmentId` resolves),
  and for papers **with edits** also that the artifact is built at the current
  converter version and every edit target resolves with a matching snippet.
- Placeholder copy is lorem ipsum — keep it lorem or leave it empty; don't invent
  real curriculum. (Paper titles/authors are factual — they come from arXiv.)
- **Not everything is test-enforced.** Lesson+paper ids/slugs are; uniqueness of
  exercise/assessment/resource ids and of track/module slugs is NOT — a
  duplicate silently shadows the earlier entry (last one wins). Prerequisite
  cycles aren't validated either (a cycle under `hard` enforcement would
  deadlock both modules).
- Examples below use hypothetical ids (`g-intro`, …). The repo's live reference
  for every feature is the **Example track** (`ex-content` / `ex-assess` in
  `curriculum.data.ts` and `papers.data.ts`).

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

   <Demo id="parameter-slider" />

   <Exercise id="multiple-choice" />

   A claim that needs a source.<Footnote>The footnote body — can hold prose, links,
   `code`, etc.</Footnote>
   ```

   - `<Video src … title? provider? poster? />` — provider (`youtube`/`vimeo`/`file`)
     is inferred from the URL when omitted; `poster` applies to `file` videos only.
   - `<Callout variant?="note|tip|warning" title?>…</Callout>` (defaults to `note`).
   - `<Demo id="…" />` — a demo registered in the demo registry (see §3–4).
   - `<Exercise id="…" />` — an exercise defined in `src/content/exercises.data.ts`
     (see §1b). Choice answer keys and explanations never reach the client and
     grading is exact-match server-side; an understanding-check's `sampleAnswer`
     **is** sent to the client (revealed on demand) — don't put gated content
     there. An unknown id renders an inline error card (same for `<Demo>`).
   - `<VerificationExercise id="…" />` — renders one of the Verification
     track's native React widgets (`src/components/verification/widgets/<id>.tsx`,
     keyed in `widgets/registry.tsx`). The id must exist in
     `src/lib/verification/exercises.ts` and the hosting lesson's id must be
     `v-<id>` (both enforced by `src/lib/verification/widgets.test.ts`). An
     unknown id renders an inline error card. Data/copy lives in
     `src/lib/verification/data/`; shared primitives (drag, `[[term]]` tooltips,
     the completion hook) are in `src/components/verification/kit/`.
   - `<ArxivPaper id="1706.03762v7" defaultOpen? />` — embeds an arXiv paper as a
     **collapsible card**, rendered from its LaTeX source with KaTeX math.
     **The version suffix (`v7`) is required**: it pins an immutable snapshot,
     which is what makes caching and edit anchors safe. Rendering is
     best-effort by design — PDF figures are rasterized to inline PNGs and TikZ
     diagrams compile to SVG; only failures degrade to placeholders linking to
     the PDF, and exotic packages degrade with a warning chip in the card
     footer. Papers without LaTeX source (PDF-only submissions) render a link
     card instead. After adding a paper, build its committed artifact locally
     and commit the result — papers convert at authoring time, never in
     production: `npm run arxiv:build`, then commit the generated
     `src/content/arxiv/{id}.json` and `public/arxiv/{id}/…` files alongside
     the lesson. (Write the `id` as a double-quoted literal attribute —
     `id="1706.03762v7"`, never `id={expr}` — the build script discovers embeds
     with a regex over the MDX text, not a parser.) For a **full-page paper** with
     editorial edits and interleaved activities, use a `Paper` module item
     instead — see §2.
   - `<Footnote>…</Footnote>` — drop it right after the word/claim it annotates, no
     id needed. It numbers itself automatically (in document order) and renders as
     a sidenote in the right margin on wide screens, or a tap-to-expand marker on
     narrower ones — no separate "References" section at the bottom of the lesson.

The lesson is now live at `/tracks/<trackSlug>/<moduleSlug>/<itemSlug>` and shows
in the sidebar + prev/next. A lesson completes when the learner scrolls to its end
(or clicks "Mark complete").

**Long, multi-section lessons.** Nothing to declare: a lesson body with two or
more top-level `##`/`###` headings automatically gets a paper-style section
tree — the docked "In this lesson" panel in the track sidebar, with scroll-spy
highlighting and anchor links (the same UI papers get). The heading ids and
titles are collected at compile time from the rendered MDX
(`src/lib/mdx/rehype-lesson-sections.mjs`, wired in `next.config.ts` right
after rehype-slug), so the nav can never drift from the document. Prefer
plain-text headings — math/code in a heading makes an ugly nav label. See
lesson `c-game` (Control track) or `ex-content-l2` for live examples.

**Adding a new module** (a new unit / top-level "lesson" in the track) is the same
shape one level up: add a `Module` to the `modules` array (`id`, `slug`, `trackId`,
`title`, `summary`, `order`, `prerequisiteModuleIds: []`, `itemIds: []`, optional
`assessmentId` / `furtherReadingTopics` / `estimatedMinutes`), add its `id` to the
track's `moduleIds`, then add lessons as above. To attach an end-of-module
assessment, add an `Assessment` to `src/content/assessments.data.ts` with
`moduleId` set to the module, and set the module's `assessmentId` to match — at
most one assessment per module. An Assessment requires `title`, `format`,
`prompt`, and (unlike writing exercises) **non-optional** `sections` and `rubric`
arrays (see `ex-assessment`). Assessments do **not** count toward module
completion or prerequisite gating — only lessons, papers, and inserted lessons do.
"Further reading" comes from `src/content/resources.data.ts`: tag resources with
`topics`, set the module's `furtherReadingTopics` to matching strings
(`coveredHere: false` marks background we deliberately do **not** teach —
surfaced as a "learn this elsewhere" link).

---

## 1b. Add an exercise

Exercises live in `src/content/exercises.data.ts` and are referenced by id from
lesson MDX (`<Exercise id="…" />`) or paper activities (§2). One closed and one
writing example:

```ts
{
  id: "g-intro-mc1",
  type: "multiple-choice",          // or "multi-select" | "true-false"
  prompt: "Lorem ipsum question?",
  options: [
    { id: "a", label: "An option" },
    { id: "b", label: "The correct option" },
  ],
  correctOptionIds: ["b"],          // single entry for MC/true-false
  explanation: "Shown after answering.",   // optional
},
{
  id: "g-intro-memo1",
  type: "memo",                     // or "short-answer" | "writing-prompt" | "essay"
  prompt: "Lorem ipsum writing task.",
  format: "policy-memo",            // REQUIRED for writing types — a DeliverableFormat:
                                    // free-form | memo | essay | research-summary |
                                    // policy-memo | bill-draft | briefing
  sections: [                       // optional; omit → one free-form editor
    { id: "thesis", label: "Thesis", placeholder: "…", guidance: "…" },
  ],
  rubric: [{ id: "clarity", label: "Clarity", description: "…" }], // optional
  minWords: 80,                     // blocks the submit button until met
  maxWords: 300,                    // advisory only — the counter warns, submit still works
}
```

Notes: `true-false` uses option ids `"true"`/`"false"` by convention;
`understanding-check` takes just `prompt` + `sampleAnswer` (self-assessed, not
auto-graded, and the sample answer ships to the client). Grading for choice types
is exact-match (every correct option and nothing else). A learner has ONE
submission row per exercise id — reusing an id in a lesson and a paper shares the
same draft/submission.

Four more closed types:

- **`tap-reveal`** (flashcard / quick recall) — `prompt` + `answer`; the answer
  hides behind a "click to reveal" cover, then the learner self-rates
  ("Got it" / "Partially" / "Didn't get it"; recorded via `recordTapReveal`
  with the timestamp doubling as a future spaced-repetition hook). The answer
  ships to the client — self-assessment, not graded.
- **`flowchart`** — a shared `palette` of blocks (`step`/`branch`/`terminal`,
  branches with `branchLabels` arms) plus `stages`, each with a prose
  `description`, a server-only `solution` tree, and an `explanation` revealed
  on success. Learners drag (or tap-to-place) blocks; grading is server-side
  order-sensitive structural equality per stage; "Show solution" unlocks after
  two wrong attempts. See `c-paper-l2-protocol-flowcharts` for a full example.
- **`allocation`** (scenario-based judgment) — a `title`, `agendas`, and
  `scenarios`; the learner divides `totalPeople` (in `step` increments,
  default 0.5) across the agendas once per scenario and explains each
  allocation (`minReasoningChars` gates advancing), then reviews a summary
  table + stacked bars. No answer key — the whole definition ships to the
  client, and completed scenarios persist per signed-in learner
  (`saveAllocationScenario`; the row flips to `submitted` once every scenario
  is saved). `totalPeople` must sit on the step grid (content.test.ts
  enforces it). See `control-usefulness-allocation`.
- **`argue-reveal`** (respond-then-reveal judgment) — a `title` plus `items`
  (each a sequence of `rounds`: the critic's `critique`, then a `reveal`
  shown only after the learner submits a response), toggleable `concepts`
  chips, a collapsible `toolbox` recap, a post-reveal self-rating
  (Fully/Partially/Not really + optional note), and a final `construction`
  step (pick an attack-`surface`, write argument/best response/residual).
  Char bounds default to response 80–450, residual 30–200, note ≤ 200. The
  reveals ship to the client by design (self-assessment); completed items
  and the construction persist per signed-in learner (`saveArgueRevealItem`
  / `saveArgueRevealConstruction`; `submitted` once everything is saved).
  See `contra-control-argue-reveal`.

Standalone exercises can also be surfaced on the **/exercises tab**: add an
entry (id + blurb) to `featuredExercises` in `src/app/exercises/featured.ts`
to list it in the gallery and give it a page at `/exercises/<id>` — useful for
exercises not (yet) referenced by any lesson or paper.

**`<ExerciseSequence ids={[…]} label? />`** (in MDX, or a paper `sequence`
activity) chains existing exercises into one gated multi-part card — parts
unlock in order. Sequence-compatible types: `tap-reveal`, the choice types, and
`understanding-check` (not flowchart/allocation/argue-reveal/writing). Exercise `prompt`/`answer`/
`sampleAnswer` strings support `$…$` math everywhere (rendered by `MathText`),
and lesson MDX bodies support `$…$`/`$$…$$` via remark-math + rehype-katex.
Writing-type `prompt`s additionally render as block markdown (paragraphs,
lists, `$…$` math — `src/lib/content/writing-prompt-html.ts`), so a structured
multi-part prompt can be authored directly instead of flattened into one
paragraph; see `c-areas-l1-theory-of-change`.

---

## 2. Add an arXiv paper to a module

A `Paper` is a first-class module item: the arXiv paper renders **full-page**
inline (LaTeX → HTML with KaTeX), the sidebar grows a docked **"In this paper"**
section panel with scroll-synced highlighting, and `edits` let you **hide** text,
**add** editorial notes, and splice **activities** — exercise cards and inline
lessons — at section ends, between paragraphs, or between sentences. Papers count
toward progress exactly like lessons.

1. **Add the paper object** to `src/content/papers.data.ts`:

   ```ts
   {
     id: "g-intro-p1",                 // globally unique (shared space with lessons)
     slug: "some-paper",               // unique within the module; used in the URL
     moduleId: "g-intro",
     title: "Paper Title (factual, from arXiv)",
     source: { kind: "arxiv", arxivId: "2301.12345v2" }, // pinned version required;
                                       // new-style ids only (2007+) — old-style
                                       // slash ids (hep-th/…) are unsupported
     estimatedMinutes: 45,             // optional; fold into module.estimatedMinutes
     edits: [                          // optional, see step 4 and §2b
       {
         op: "activity",
         after: { sectionEnd: "ax-sec-some-section" },
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
   A paper must be listed by exactly one module — the one in its `moduleId`.

3. **Build + commit the artifact**: `npm run arxiv:build` (it discovers arXiv ids
   from `papers.data.ts` and from `<ArxivPaper/>` embeds in lessons; use
   `-- --id 2301.12345v2` to build just one paper — raw e-prints cache in the OS
   temp dir, so re-runs skip the network), then commit
   `src/content/arxiv/{id}.json` and `public/arxiv/{id}/…`.

4. **Choosing `sectionEnd` targets**: the build prints each paper's section tree
   (`§3.2.2 Multi-Head Attention → ax-sec-multi-head-attention`); re-print
   anytime from the committed artifact — no network — with
   `npm run arxiv:build -- --toc 2301.12345v2`. A `sectionEnd` activity renders
   at the **end of that section's subtree** (after its subsections, before the
   next same-or-shallower heading); landmark ids (`ax-abstract`,
   `ax-references`, `ax-footnotes`) work too. Ids are stable for a pinned arXiv
   version + converter version. For block/sentence-level targets see §2b.

5. **Activity items**:
   - `kind: "exercise"` — an id from `src/content/exercises.data.ts`; renders the
     standard exercise card in the paper flow. An exercise can be inserted at
     most once per paper (its block gets a DOM anchor id; reusing it across
     different papers is fine). In the sidebar panel, exercises show their
     **type label** ("Multiple choice", "True / false", …), not a custom title.
   - `kind: "lesson"` — a regular `Lesson` in `curriculum.data.ts` with its own MDX
     body and **`moduleId` equal to the paper's module**, but **not** listed in any
     module's `itemIds` (it renders only inside the paper as a framed "Lesson"
     card, completes on scroll-past, and shows in the paper's sidebar panel). A
     lesson can be inserted into at most one paper.
   - `kind: "demo"` — a registry id from `src/lib/demos/registry.ts`; renders the
     interactive demo inline. Sidebar entry uses the demo's registry title.
   - `kind: "sequence"` — `{ exerciseIds: […], label? }`; renders an
     `ExerciseSequence` card (gated multi-part; tap-reveal/choice/
     understanding-check members only). Its member ids share the
     once-per-paper namespace with standalone exercise items.

6. **Completion mechanics** (what "done" means): the paper and each inserted
   lesson are independent completion units — reaching the end of the paper
   completes the paper; scrolling past an inserted lesson's card completes that
   lesson; inserted **exercises are not** completion units. The paper's sidebar
   checkmark lights only when **all** of its units are complete, and module/track
   percentages count each unit. A manual "Mark complete" button is always
   available too (scroll-past completion still works even on the fallback page).

7. **Rebuild on converter bumps**: when `CONVERTER_VERSION` changes,
   `npm run test` fails on stale artifacts for any paper **with edits** — re-run
   `npm run arxiv:build` and recommit. Section ids, anchors, and sentence indices
   can change across bumps/versions; the tests name any edit that broke.

Degradation: a paper whose artifact isn't `ready` (PDF-only, unbuilt, failed)
renders a link-out fallback page, with its activities stacked below under an
"Activities" heading so progress stays completable (hide/add edits simply don't
apply). Ready papers with conversion approximations list them in a footer
disclosure next to the Abstract/PDF links.

### 2b. Edit a paper: hide, add, insert

Beyond section-end activities, `Paper.edits` supports fine-grained editorial
control keyed to **block anchors** and **sentences**:

- Every flow block in a converted paper carries a stable anchor (`b-0042`), and
  every sentence of prose blocks (`p`/`li`/`blockquote` — not headings, figures,
  tables, or equations) a 1-based index (`s`). Both are deterministic for a
  pinned arXiv version + converter version.
- **Discovery workflow**: `npm run arxiv:build -- --blocks <id>` lists every
  block with its anchor, tag, sentence count, and a text preview; add
  `--section <toc-id>` to scope to one section's subtree and print each
  sentence (`s1 …`, `s2 …`). Both read the committed artifact — no network.
  **Copy snippets from this output** (math shows as `⟨math⟩` — copy, don't
  retype).
- Every block/sentence ref requires a **`snippet`** — the first ~5 words of the
  target's text. It documents the edit in place and makes `npm run test` fail
  loudly if the target drifts (re-pinned version, converter bump) instead of
  silently retargeting. Matching is whitespace-collapsed, case-sensitive
  prefix.
- Sentence boundaries deliberately **under-split**: abbreviations (e.g., i.e.,
  et al., Fig., Eq., Thm., dotted acronyms like w.r.t.), initials, and inline
  math/citations never split a sentence — when in doubt the segmenter merges,
  so trust the `--blocks` output over your own reading.

The three ops, targeting the example paper (`1706.03762v7`; anchors/snippets
below are real — see `papers.data.ts` for the live config):

```ts
edits: [
  // HIDE a whole block (or one sentence: add s; or a range: s + sEnd, same
  // block, sEnd requires s). Learners see an expandable marker; consecutive
  // hidden blocks merge into ONE marker. `note` labels it.
  { op: "hide",
    at: { anchor: "b-0010", snippet: "Self-attention, sometimes called" },
    note: "Related-work details (optional)" },

  // ADD editorial text (markdown + $…$ math), styled as the course's voice.
  // A sentence target (s) means INLINE markdown — one paragraph; a block or
  // sectionEnd target renders a block-level "Note" card.
  { op: "add",
    after: { anchor: "b-0005", snippet: "Recurrent models typically factor" },
    markdown: "A block-level note. Inline math works: $h_t$." },

  // ACTIVITY (exercise / inline lesson) after a section, block, or sentence —
  // a sentence target splits the paragraph around the card.
  { op: "activity",
    after: { anchor: "b-0004", s: 1, snippet: "Recurrent neural networks," },
    items: [{ kind: "exercise", id: "true-false" }] },
]
```

**What learners see:**

- **Block hide** → a centered dashed pill: `··· N paragraphs hidden — note ···`
  (noun adapts: figure/table/equation/theorem/…; consecutive hidden siblings
  merge, first non-empty `note` wins; list-item hides render per-item and never
  merge). Clicking expands the original below the pill. **Sentence hide** → an
  inline `···` pill that toggles the sentence back into the text (the note
  becomes its tooltip). Zero client JS either way.
- **Block add** → a navy left-accented card with an uppercase "NOTE" label.
  **Inline add** → a navy-tinted span with a dashed underline, appended right
  after the target sentence, tooltipped "Added by the course". Editorial voice
  is always navy, distinct from the paper's red links.
- **Mid-paragraph activity** → the paragraph ends after the target sentence
  (keeping any inline adds attached to it), the card renders, and the remainder
  continues as a normal-looking paragraph. Splitting at the last sentence just
  places the card after the block.
- **Placement details**: multiple ops on one target render in edits-array
  order (same-sentence activities merge into one card stack); activities
  targeting blocks nested in containers (theorem/proof boxes, figures, the
  abstract/references landmark sections) never split the container — the card
  renders after the whole box; a block-level add after a list item renders
  inside that item (valid list markup).
- **Sidebar**: activity entries appear in the "In this paper" panel under their
  containing section, in reading order; hide/add edits produce no panel
  entries.

**Add markdown capabilities**: CommonMark (emphasis, links, inline code, lists,
fences, blockquotes) plus `$…$` / `$$…$$` KaTeX math — rendered with *vanilla*
KaTeX, so the paper's own `\newcommand`s do **not** apply. Raw HTML is escaped,
never rendered. Sentence-targeted adds must render to a single inline
paragraph — no lists/headings/fences, **even after a single newline**
(CommonMark lets `- item` interrupt a paragraph); the tests run the exact
renderer gate.

Legality rules enforced by `npm run test` (messages name the fix): hides may
not target headings; hides may not overlap (a whole-block hide covers all its
sentences and nested blocks); adds/activities may not sit inside a hidden range
(except after its last unit — the "hide-then-replace" idiom: for a
sentence-range hide target its last sentence; for a whole-block hide target the
block itself with no `s` — sentence-targeted activities may never split a
hidden block); `sEnd` requires `s`; sentence refs only on prose blocks;
snippets must match. If an edit's
target fails to resolve at render time (local iteration), it fails soft: hides
and adds do nothing, unmatched activities append at the paper's end, and the
server console names the target. Re-pinning a paper's arXiv version invalidates
anchors AND sentence indices — the snippet checks name every edit to re-verify.

---

## 3. Create a new demo

A demo is a **self-contained client component** with no app dependencies and **no
required props** (the registry renders it as `<Component />`).

1. **Write the component** under `src/components/demos/` — either add to
   `example-demos.tsx` or create a new file. It must start with `"use client"`:

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
   import { MyDemo } from "@/components/demos/example-demos";

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
     kind: "technical",                   // "foundations" | "technical" | "governance" | "example"
     moduleIds: ["e-intro"],              // ordered module IDs (added next)
     prerequisiteEnforcement: "soft",     // "soft" (warn) | "hard" (lock)
     estimatedHours: 12,                  // optional
   }
   ```

2. **Add its modules** to the `modules` array, each with `trackId: "evals"`, and
   list their `id`s in the track's `moduleIds` (ordered). See §1 for module fields.

3. **Add lessons + MDX** for each module as in §1, and papers as in §2.

4. **Optional content:** assessments (`assessments.data.ts` + `module.assessmentId`),
   exercises (`exercises.data.ts`, referenced via `<Exercise id />` in MDX or paper
   activities), and "Further reading" (tag resources in `resources.data.ts`, then
   set the module's `furtherReadingTopics` to matching topic strings).

The track appears on `/tracks` and is reachable at `/tracks/<slug>` automatically —
no routing or DB changes. Prerequisites may point at modules in **other** tracks
(cross-track gating), so you can require a Foundations/Control module before a
Governance one. `soft` enforcement only warns; `hard` redirects **signed-in**
learners with unmet prerequisites back to the module page — signed-out visitors
can always preview, so test gating while signed in. Don't create prerequisite
cycles: they aren't validated, and `hard` enforcement would deadlock both
modules.

> **New `kind` value?** `kind` is the `TrackKind` union in
> `src/lib/content/types.ts` (currently foundations/technical/governance/example).
> To add another, extend that union **and** add a label to the `KIND_LABEL` map in
> `src/app/tracks/page.tsx`.
