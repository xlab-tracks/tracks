# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Tracks is an AI-safety learning platform (Khan Academy–style) with three
tracks — **Control** (technical), **Governance**, and **Verification**. The
Control track's first module carries real curriculum (an authored lesson on
the control game, the Redwood AI Control paper, and two readings reproduced
with permission); the Verification track is fully populated by the 17
native React interactive widgets (see "Verification
interactives" below); everything else is placeholder. **Never invent or
fabricate curriculum content** — real content is human-authored or reproduced
with permission; otherwise use lorem ipsum or leave it empty. The **Example track** (`ex-content`/`ex-assess`)
is the live reference for every content feature; `AUTHORING.md` is the
step-by-step guide for adding content (its rules are enforced by
`src/lib/content/content.test.ts`).

## Commands

- `npm run dev` — dev server (Turbopack). DB-backed pages need `DATABASE_URL`
  in `.env` (a PlanetScale dev branch or any local Postgres).
- `npm run build` / `npm run start` — production build / serve (plain Node)
- `npm run preview` — OpenNext build + serve in workerd locally (the real
  Workers runtime; uses `.dev.vars`)
- `npm run typecheck` — `tsc --noEmit` (do this after edits; the build also type-checks)
- `npm run lint` — ESLint
- `npm run test` — Vitest (all). Single file: `npx vitest run src/lib/content/exercise-view.test.ts`; by name: `npx vitest run -t "gradeChoice"`
- `npm run arxiv:build` — convert every arXiv paper the content references into
  committed artifacts (`src/content/arxiv/*.json` + `public/arxiv/*`; network,
  authoring-time only). `-- --id <id>` builds one paper; `-- --toc <id>` /
  `-- --blocks <id> [--section <toc-id>]` print section ids / block anchors +
  sentences from the committed artifact (offline — the source for edit targets).
- `npx prisma generate` — regenerate the client after editing `prisma/schema.prisma`.
  Do **not** run `prisma migrate` against the hosted DB (see Database & deploy).
- `npm run cf-typegen` — regenerate `cloudflare-env.d.ts` after changing
  bindings in `wrangler.jsonc`.

Setup: `cp .env.example .env`, then fill the `WORKOS_*` values (AuthKit, Google
enabled, redirect `/callback`) and `DATABASE_URL` (see `.env.example`). Public
pages render without any of this; auth + persistence do not.

## Non-obvious constraints

- **Middleware deliberately uses the deprecated `src/middleware.ts` convention,
  NOT Next 16's `proxy.ts`.** proxy.ts compiles to Node middleware, which
  `@opennextjs/cloudflare` rejects at build time (opennextjs-cloudflare#1277).
  Do not "fix" the deprecation warning by renaming to proxy.ts.
- **Next.js 16** (see `@AGENTS.md`): `params`/`searchParams` are **async
  Promises** (always `await`); Cache Components is intentionally **off** — don't
  enable it casually (it would force `<Suspense>`/`use cache` everywhere). Stay
  on Next 16.2.x — OpenNext support for 16.3 is unresolved (issue #1300).
- **Prisma is pinned to v6 on purpose** (with `driverAdapters` + per-request
  clients for Workers — see `src/lib/db.ts`). v7 additionally requires
  `prisma.config.ts`, ESM, and new import paths. Don't bump casually.
- **Tailwind v4** is CSS-first: theme tokens (including the soft-gray palette and
  `--shadow-soft*`) live in `src/app/globals.css` `@theme`; there is no
  `tailwind.config.js`. UI is shadcn/ui (radix-nova preset, `components.json`).

## Architecture

**Content is code; user data is Postgres.** This split is the core mental model:

- The content graph (tracks, modules, lessons, papers, exercises, assessments,
  resources) is static and code-defined in `src/content/*.data.ts` plus MDX
  bodies in `src/content/lessons/*.mdx`. Modules order lessons and papers
  together via `itemIds`. Access it **only** through `src/lib/content/`
  (in-memory indexes + accessors). Never store curriculum in the DB.
- `prisma/schema.prisma` holds **only** user/stateful data (progress, submissions,
  classrooms), keyed by **string content IDs** — there are no FKs into
  the content graph. `LessonProgress.lessonId` holds generic content ids
  (lessons, papers, and papers' inserted lessons each count as one unit).

**Papers.** A `Paper` (`src/content/papers.data.ts`) is a module item that
renders an arXiv paper full-page from its precomputed artifact, editable via
`Paper.edits`: hide sentences/paragraphs behind expandable markers, add
editorial markdown (navy "Note" styling), and splice activities (exercises /
inline lessons) at section ends, between blocks, or mid-paragraph. Targets key
on stable `data-anchor`/`data-s` values plus a required `snippet` drift
tripwire (validated by content.test.ts). `src/lib/papers/apply-edits.ts`
patches only edited sections (HAST tree ops; unedited papers keep the string
fast path via `split-paper.ts`); `paper-nav.ts` builds the sidebar's per-paper
section tree (scroll-spy in `src/components/layout/use-scroll-spy.ts`;
multi-heading lessons get the same docked nav — see MDX pipeline). The
LaTeX→HTML converter lives in `src/lib/arxiv/` and runs ONLY at authoring time
(`npm run arxiv:build`) — never in the deployed worker. When changing converter
output shape, bump `CONVERTER_VERSION` (`src/lib/arxiv/types.ts`) and ship the
rebuilt artifacts in the same commit: stale artifacts read as "not-built" at
runtime and fail content.test.ts, and anchors/sentence indices may renumber
(the snippet tripwires name every content edit that drifted).

**Routing (tracks).** `/tracks/[trackSlug]/[moduleSlug]/[itemSlug]` is one
dispatching route serving both lessons and papers (they share a slug
namespace); the static sibling segment `assessment` is reserved. The
`[trackSlug]` layout owns the sidebar; active-item detection is client-side
via `usePathname()` (layouts can't see deeper params).

**MDX pipeline.** `src/mdx-components.tsx` wires the global component map from
`src/components/mdx/mdx-components.tsx`. `LessonContent` dynamically imports
`src/content/lessons/${contentRef}.mdx`, so authors embed `<Video/>`, `<Demo/>`,
`<Exercise/>`, `<Callout/>`, `<ArxivPaper/>` (collapsible card — distinct from
full-page Paper items), and `<Footnote/>` by name inside lesson text.
A lesson body with 2+ top-level `##`/`###` headings automatically gets a
paper-style "In this lesson" sidebar nav: `src/lib/mdx/rehype-lesson-sections.mjs`
compiles a `sections` export into every lesson module (read via
`getLessonSections`, assembled into `itemNavs` in the `[trackSlug]` layout).
The plugin is registered in `next.config.ts` and must stay AFTER `rehype-slug`
(it reads the ids slug assigns); Turbopack takes MDX plugins as strings only,
and local plugin paths must be absolute.

**Exercises & writing (security-relevant).** Closed-exercise answer keys are
server-only: `toPublicChoice()` / `toPublicFlowchart()` strip `correctOptionIds`
/ stage `solution`s before they reach the client, and the server actions
(`gradeExercise`, `gradeFlowchartStage` — which sanitizes the POSTed attempt
tree — and `recordTapReveal`) grade + persist. Never pass answer keys into
client components (`tap-reveal` answers, `understanding-check` sample
answers, and whole `allocation`/`argue-reveal` definitions ship to the client
by design — self-assessment; they persist via `saveAllocationScenario` /
`saveArgueRevealItem` + `saveArgueRevealConstruction`).
Standalone exercises can surface on the `/exercises` tab via the curated
`featuredExercises` list in `src/app/exercises/featured.ts`. `WritingEditor` is the
one editor reused by inline writing exercises and end-of-module assessments;
persistence is done by `.bind()`-ing server actions in a server component and
passing them as props. Exercise prompt/answer strings render `$…$` math via
`MathText`; lesson MDX math uses remark-math + rehype-katex.
`src/lib/control-model/` is the pure closed-form model behind the Control
track's demos — its calibration test pins the paper's headline numbers (±4pp);
plan-level rationale lives in the demos, the code + test are normative.
`bestResponse` is memoized at module scope, keyed on the levers `evaluateGame`
reads (`q|b|d|attackSd`): never mutate its returned object, and extend the key
if `evaluateGame` grows a new lever dependency.

**Auth & mutations.** WorkOS AuthKit. `src/middleware.ts` only refreshes the session.
`getCurrentUser()` / `requireUser()` (`src/lib/auth.ts`, `cache()`-wrapped per
request) upsert the WorkOS user into the local `User` table. Enforce sign-in
**per page/action** (`requireUser`, or `withAuth({ ensureSignedIn: true })`), not in
the proxy. All mutations are server actions in `src/app/actions/`; each re-checks
auth because they're reachable by direct POST. Classroom reads are scoped to
membership (`requireInstructor` / `getMembership`).

**Database & deploy (PlanetScale Postgres + Cloudflare Workers).** Postgres is
**PlanetScale for Postgres** (PS-5 single-node, AWS us-east-1); the app runs on
**Cloudflare Workers** (worker `tracks`) via `@opennextjs/cloudflare`. In prod
the DB is reached through the **Hyperdrive binding** (`HYPERDRIVE` in
`wrangler.jsonc`, origin = direct port 5432 with the least-privilege
`pscale_api_*` role, **caching disabled** — Hyperdrive never invalidates its
query cache on writes and this app reads user state right after writing it).
`src/lib/db.ts` builds a **per-request** PrismaClient (driver adapter over `pg`)
from the binding and falls back to `DATABASE_URL` (pooled port-6432 string in
`.env`) for local dev — never share a Prisma client across requests on Workers.
**Schema migrations live in `db/migrations/` as numbered SQL files and are
applied manually** — `psql "<direct-5432 url>" -f db/migrations/<file>.sql`
using the **admin** role (the app role has no DDL rights) *before* pushing code
that depends on them; PlanetScale Postgres has no deploy requests/safe
migrations, and never run `prisma migrate deploy` against prod. To change the
schema: edit `prisma/schema.prisma` (types/client) **and** add a matching SQL
file under `db/migrations/`, apply it, then push. Deploys are git-connected via
**Workers Builds**: push to `main` → `npx opennextjs-cloudflare build` +
`npx opennextjs-cloudflare deploy`. Worker secrets (`WORKOS_*`) are set with
`wrangler secret put`; `NEXT_PUBLIC_WORKOS_REDIRECT_URI` lives in
`wrangler.jsonc` vars **and** must be a Workers Builds build variable
(`NEXT_PUBLIC_` values are inlined at build time).

**Demos.** `src/lib/demos/registry.ts` is the single integration point: a demo is a
self-contained client component registered by id, embeddable in MDX, the `/demos`
gallery, a standalone page, and the chrome-less `/demos/[id]/embed` iframe route
(which is excluded from the proxy matcher).

**Verification interactives.** The Verification track's 17 exercises are
**native React widgets** (`src/components/verification/widgets/<id>.tsx`) in the
app design system, keyed by id in `widgets/registry.tsx`. Copy/data is lifted
verbatim into `src/lib/verification/data/*` (human-authored curriculum —
**never regenerate content**); six have pure engines in
`src/lib/verification/engines/*` (+ vitest suites). Each is a content-graph
lesson (`v-<id>`) whose MDX embeds `<VerificationExercise id/>` — an async
server component that resolves the user and renders the client widget host
(`verification-widget-host.tsx`); the registry of metadata (id/title/bridged)
is `src/lib/verification/exercises.ts`. `bridged` widgets call `onComplete`
(→ `setLessonComplete` via `kit/use-completion.ts`) at their finish event and
their lessons disable scroll auto-complete; unbridged explorables keep normal
scroll-to-complete. Shared kit in `src/components/verification/kit/`
(drag, `[[term]]` tooltips, completion hook). `src/lib/verification/widgets.test.ts`
enforces the registry ↔ graph ↔ MDX ↔ widget mapping. (The originals were
standalone HTML pages; only `public/verification/assets/` remains, for the
what-do-they-say portraits.)

**Prerequisites & progress.** `Track.prerequisiteEnforcement` is `soft` (warn)
or `hard` (lock); `isAccessLocked()` (pure, tested) + `getPrerequisiteStatus()`
drive the lock, and the item page redirects signed-in learners on hard locks
(signed-out visitors may preview). Prerequisites may be cross-track. Progress
units are lessons, papers, and papers' inserted lessons — see
`getModuleProgressContentIds` in `src/lib/content/` — assessments never gate
completion; an item's sidebar checkmark lights only when all of its units are
complete.
