# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Tracks is an AI-safety learning platform (Khan Academy–style) with two tracks —
**Control** (technical) and **Governance**. Content is placeholder lorem ipsum;
do not invent real curriculum.

## Commands

- `npm run dev` — dev server (Turbopack). For DB-backed pages locally use
  **`npx netlify dev`** instead — it injects `NETLIFY_DB_URL` and starts a local DB.
- `npm run build` / `npm run start` — production build / serve
- `npm run typecheck` — `tsc --noEmit` (do this after edits; the build also type-checks)
- `npm run lint` — ESLint
- `npm run test` — Vitest (all). Single file: `npx vitest run src/lib/content/exercise-view.test.ts`; by name: `npx vitest run -t "gradeChoice"`
- `npx prisma generate` — regenerate the client after editing `prisma/schema.prisma`.
  Do **not** run `prisma migrate` against the hosted DB (see Database & deploy).

Setup: `cp .env.example .env`, then fill the `WORKOS_*` values (AuthKit, Google
enabled, redirect `/callback`). `NETLIFY_DB_URL` is injected by Netlify (and by
`netlify dev`) — you don't set it. Public pages render without any of this; auth +
persistence do not.

## Non-obvious constraints

- **Next.js 16** (see `@AGENTS.md`): middleware lives in **`src/proxy.ts`** (not
  `middleware.ts`); `params`/`searchParams` are **async Promises** (always `await`);
  Cache Components is intentionally **off** — don't enable it casually (it would
  force `<Suspense>`/`use cache` everywhere).
- **Prisma is pinned to v6 on purpose.** v7 drops `url` from the schema and requires
  driver adapters + `prisma.config.ts`. Don't bump without doing that migration.
- **Tailwind v4** is CSS-first: theme tokens (including the soft-gray palette and
  `--shadow-soft*`) live in `src/app/globals.css` `@theme`; there is no
  `tailwind.config.js`. UI is shadcn/ui (radix-nova preset, `components.json`).

## Architecture

**Content is code; user data is Postgres.** This split is the core mental model:

- The content graph (tracks, modules, lessons, exercises, assessments, resources)
  is static and code-defined in `src/content/*.data.ts` plus MDX bodies in
  `src/content/lessons/*.mdx`. Access it **only** through `src/lib/content/`
  (in-memory indexes + accessors). Never store curriculum in the DB.
- `prisma/schema.prisma` holds **only** user/stateful data (progress, submissions,
  classrooms), keyed by **string content IDs** — there are no FKs into
  the content graph.

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

**Auth & mutations.** WorkOS AuthKit. `src/proxy.ts` only refreshes the session.
`getCurrentUser()` / `requireUser()` (`src/lib/auth.ts`, `cache()`-wrapped per
request) upsert the WorkOS user into the local `User` table. Enforce sign-in
**per page/action** (`requireUser`, or `withAuth({ ensureSignedIn: true })`), not in
the proxy. All mutations are server actions in `src/app/actions/`; each re-checks
auth because they're reachable by direct POST. Classroom reads are scoped to
membership (`requireInstructor` / `getMembership`).

**Database & deploy (Netlify Database).** Postgres is **Netlify Database** (GA,
Neon-backed). Prisma is only the runtime query client and reads **`NETLIFY_DB_URL`**
(injected into builds/functions/`netlify dev`) — not `DATABASE_URL`, and not the
deprecated `NETLIFY_DATABASE_URL`. **Schema migrations live in
`netlify/database/migrations/` as SQL files and are applied by the Netlify deploy** —
never run `prisma migrate deploy` against the hosted DB. To change the schema: edit
`prisma/schema.prisma` (types/client) **and** add a matching SQL file under
`netlify/database/migrations/`, then push. The site auto-deploys from `main`;
`netlify.toml` must keep `publish = ".next"` (a `[build]` block otherwise defaults
publish to the repo root, which `@netlify/plugin-nextjs` rejects). The repo-local
`netlify-database` skill is the source of truth.

**Demos.** `src/lib/demos/registry.ts` is the single integration point: a demo is a
self-contained client component registered by id, embeddable in MDX, the `/demos`
gallery, a standalone page, and the chrome-less `/demos/[id]/embed` iframe route
(which is excluded from the proxy matcher).

**Prerequisites (per-track config).** `Track.prerequisiteEnforcement`
is `soft` (warn) or `hard` (lock); `isAccessLocked()` (pure, tested) +
`getPrerequisiteStatus()` drive the lock, and the lesson page redirects on hard
locks. Prerequisites may be cross-track.
