# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Tracks is an AI-safety learning platform (Khan Academy–style) with two tracks —
**Control** (technical) and **Governance**. Content is placeholder lorem ipsum;
do not invent real curriculum.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production build / serve
- `npm run typecheck` — `tsc --noEmit` (do this after edits; the build also type-checks)
- `npm run lint` — ESLint
- `npm run test` — Vitest (all). Single file: `npx vitest run src/lib/content/exercise-view.test.ts`; by name: `npx vitest run -t "gradeChoice"`
- `npx prisma migrate dev` / `npx prisma generate` — requires `DATABASE_URL`

Setup: `cp .env.example .env`, then fill `DATABASE_URL` and the `WORKOS_*` values
(AuthKit with Google enabled, redirect `/callback`). Public pages render without
these; auth + persistence do not.

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
  capstone, classrooms), keyed by **string content IDs** — there are no FKs into
  the content graph.

**MDX pipeline.** `src/mdx-components.tsx` wires the global component map from
`src/components/mdx/mdx-components.tsx`. `LessonContent` dynamically imports
`src/content/lessons/${contentRef}.mdx`, so authors embed `<Video/>`, `<Demo/>`,
`<Exercise/>`, `<Callout/>` by name inside lesson text.

**Exercises & writing (security-relevant).** Closed-exercise answer keys are
server-only: `toPublicChoice()` strips `correctOptionIds` before they reach the
client, and `gradeExercise` (a server action) grades + persists. Never pass answer
keys into client components. `WritingEditor` is the one editor reused by inline
writing exercises, end-of-module assessments, and the capstone; persistence is done
by `.bind()`-ing server actions in a server component and passing them as props.

**Auth & mutations.** WorkOS AuthKit. `src/proxy.ts` only refreshes the session.
`getCurrentUser()` / `requireUser()` (`src/lib/auth.ts`, `cache()`-wrapped per
request) upsert the WorkOS user into the local `User` table. Enforce sign-in
**per page/action** (`requireUser`, or `withAuth({ ensureSignedIn: true })`), not in
the proxy. All mutations are server actions in `src/app/actions/`; each re-checks
auth because they're reachable by direct POST. Classroom reads are scoped to
membership (`requireInstructor` / `getMembership`).

**Demos.** `src/lib/demos/registry.ts` is the single integration point: a demo is a
self-contained client component registered by id, embeddable in MDX, the `/demos`
gallery, a standalone page, and the chrome-less `/demos/[id]/embed` iframe route
(which is excluded from the proxy matcher).

**Prerequisites & capstone (per-track config).** `Track.prerequisiteEnforcement`
is `soft` (warn) or `hard` (lock); `isAccessLocked()` (pure, tested) +
`getPrerequisiteStatus()` drive the lock, and the lesson page redirects on hard
locks. `Track.capstoneMode` is `progressive` (per-module checkpoints) or
`final-only`; `Track.hasCapstone` gates it entirely. Prerequisites may be
cross-track.
