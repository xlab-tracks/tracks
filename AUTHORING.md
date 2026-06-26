# Authoring guide

How to add content to Tracks. **Content is code**: the graph (tracks → modules →
lessons, plus exercises, assessments, resources) is defined in typed TS data files
under `src/content/`, and lesson bodies are MDX under `src/content/lessons/`. There
is **no database or CMS for content** and **no route files to add** — pages resolve
by slug automatically.

A few rules that apply throughout:

- **Hierarchy:** `Track → Module → Lesson`. A track holds ordered **modules**; a
  module holds ordered **lessons**; a lesson points at one MDX body. (In Khan terms a
  module is a "lesson/unit" and a lesson is a "sublesson" — the page learners read.)
- **The `*Ids` arrays drive everything.** Adding a `Lesson`/`Module`/`Track` object
  is not enough — you must also list its `id` in the parent's `lessonIds` /
  `moduleIds` array. Those arrays set order (sidebar, prev/next) and membership.
- **`id` is globally unique; `slug` is unique within its parent.** URLs use slugs:
  `/tracks/<trackSlug>/<moduleSlug>/<lessonSlug>`.
- **Verify after editing:** `npm run typecheck` (catches shape errors) and
  `npm run test` — `src/lib/content/content.test.ts` checks referential integrity
  (every `moduleIds`/`lessonIds`/`prerequisiteModuleIds`/`assessmentId` resolves).
- Placeholder copy is lorem ipsum — keep it lorem or leave it empty; don't invent
  real curriculum.

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
     order: 3,                // 1-based position within the module
     contentRef: "g-intro-l3", // MDX filename (without .mdx); convention: same as id
     estimatedMinutes: 12,
   }
   ```

2. **Register it in the module's `lessonIds`** (same file) — append the `id` in the
   position you want it to appear:

   ```ts
   // module "g-intro"
   lessonIds: ["g-intro-l1", "g-intro-l2", "g-intro-l3"],
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
   ```

   - `<Video src … title? provider? poster? />` — provider (`youtube`/`vimeo`/`file`)
     is inferred from the URL when omitted.
   - `<Callout variant?="note|tip|warning" title?>…</Callout>` (defaults to `note`).
   - `<Demo id="…" />` — a demo registered in the demo registry (see §2–3).
   - `<Exercise id="…" />` — an exercise defined in `src/content/exercises.data.ts`.

The lesson is now live at `/tracks/<trackSlug>/<moduleSlug>/<lessonSlug>` and shows
in the sidebar + prev/next.

**Adding a new module** (a new unit / top-level "lesson" in the track) is the same
shape one level up: add a `Module` to the `modules` array (`id`, `slug`, `trackId`,
`title`, `summary`, `order`, `prerequisiteModuleIds: []`, `lessonIds: []`, optional
`assessmentId` / `furtherReadingTopics` / `estimatedMinutes`), add its `id` to the
track's `moduleIds`, then add lessons as above. To attach an end-of-module
assessment, add an `Assessment` to `src/content/assessments.data.ts` with
`moduleId` set to the module, and set the module's `assessmentId` to match.

---

## 2. Create a new demo

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

## 3. Add a demo to a track

Demos attach to a track by being embedded in one of its lessons:

1. Make sure the demo is registered (see §2) and note its `id`.
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

## 4. Create a new track

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
