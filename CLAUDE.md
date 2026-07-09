# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Tracks is an AI-safety learning platform (Khan Academy–style) with two tracks —
**Control** (technical) and **Governance**. Content is placeholder lorem ipsum;
do not invent real curriculum.

## Commands

- `npm run dev` — dev server (Turbopack). DB-backed pages need `DATABASE_URL`
  in `.env` (a PlanetScale dev branch or any local Postgres).
- `npm run build` / `npm run start` — production build / serve (plain Node)
- `npm run preview` — OpenNext build + serve in workerd locally (the real
  Workers runtime; uses `.dev.vars`)
- `npm run typecheck` — `tsc --noEmit` (do this after edits; the build also type-checks)
- `npm run lint` — ESLint
- `npm run test` — Vitest (all). Single file: `npx vitest run src/lib/content/exercise-view.test.ts`; by name: `npx vitest run -t "gradeChoice"`
- `npx prisma generate` — regenerate the client after editing `prisma/schema.prisma`.
  Do **not** run `prisma migrate` against the hosted DB (see Database & deploy).

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
renders an arXiv paper full-page from its precomputed artifact, with exercises
and inline lessons spliced in at section ends (`insertions`, keyed by the
artifact's toc section ids). `src/lib/papers/split-paper.ts` slices the
artifact HTML; `src/lib/papers/paper-nav.ts` builds the sidebar's per-paper
section tree (scroll-spy in `src/components/layout/use-scroll-spy.ts`).
Artifacts precompute at authoring time via `npm run arxiv:build` (also prints
section ids; `-- --toc <id>` re-prints from the committed artifact).

**MDX pipeline.** `src/mdx-components.tsx` wires the global component map from
`src/components/mdx/mdx-components.tsx`. `LessonContent` dynamically imports
`src/content/lessons/${contentRef}.mdx`, so authors embed `<Video/>`, `<Demo/>`,
`<Exercise/>`, `<Callout/>` by name inside lesson text.

**Exercises & writing (security-relevant).** Closed-exercise answer keys are
server-only: `toPublicChoice()` strips `correctOptionIds` before they reach the
client, and `gradeExercise` (a server action) grades + persists. Never pass answer
keys into client components. `WritingEditor` is the one editor reused by inline
writing exercises and end-of-module assessments; persistence is done
by `.bind()`-ing server actions in a server component and passing them as props.

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

**Prerequisites (per-track config).** `Track.prerequisiteEnforcement`
is `soft` (warn) or `hard` (lock); `isAccessLocked()` (pure, tested) +
`getPrerequisiteStatus()` drive the lock, and the lesson page redirects on hard
locks. Prerequisites may be cross-track.
