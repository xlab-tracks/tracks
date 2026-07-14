# Tracks

An AI-safety learning platform by XLab — a Khan Academy–style home that
de-centralizes the messy AI-safety onboarding pipeline. It offers structured
**tracks** (Control, Governance, and Verification), interactive demos, real
writing practice, and a curated resource hub.

## Features

- **Modular, lesson-style content** with a persistent module sidebar that also
  carries per-paper section navigation.
- **Content types**: embedded video (media-chrome), text, interactive demos
  embedded inline, exercises, and full-page arXiv papers with exercises and
  lessons interleaved into their sections.
- **Exercises** — choice types (multiple-choice, multi-select, true/false) and
  flowcharts graded server-side against server-only answer keys; tap-reveal,
  understanding checks, allocation, and argue-reveal are self-assessed; plus
  open-ended writing.
- **End-of-module assessments** that mirror real deliverables (policy memo, bill
  draft, research summary, briefing, essay) with section scaffolds + rubrics.
- **Prerequisites** per module, including cross-track gating, with soft (warn) or
  hard (lock) enforcement.
- **Centralized resource hub** with filters, plus an explicit "background we
  don't teach — learn it elsewhere" section.
- **Progress tracking** (checkmarks, % complete, continue-where-you-left-off) and
  **autosaving** writing drafts.
- **Classrooms** — instructors create a class, share a join code, and track each
  student's progress and submissions; reads are scoped to classroom membership.
- **Embeddable demos** — a central registry renders demos in lessons, a gallery,
  standalone pages, or any external page via an `/embed` iframe route.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui ·
MDX (`@next/mdx`) · media-chrome · WorkOS AuthKit (Google OAuth) · Postgres +
Prisma · Vitest.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill it in:

   ```bash
   cp .env.example .env
   ```

   - **`DATABASE_URL`** — a Postgres connection string for local dev (local
     Docker, or a PlanetScale dev branch — pooled port-6432 string). Production
     doesn't use this var; it connects through Cloudflare Hyperdrive.
   - **WorkOS** — create a project at the [WorkOS dashboard](https://dashboard.workos.com),
     enable **Google** as the only connection, register the redirect URI
     `http://localhost:3000/callback`, then set `WORKOS_API_KEY`,
     `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD` (32+ chars:
     `openssl rand -base64 32`), and `NEXT_PUBLIC_WORKOS_REDIRECT_URI`.

3. Create the database schema by applying the SQL migrations in order:

   ```bash
   for f in db/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
   ```

   (Against PlanetScale, run these over the *direct* port-5432 connection.)

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. Browsing tracks, demos, and resources works
   signed-out; progress, writing, and classrooms require signing in.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build / serve
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run test` — Vitest unit tests (grading, prerequisite locking, content integrity)

## Authoring content

The content graph is **code-defined**; only user data lives in Postgres. See
**[AUTHORING.md](AUTHORING.md)** for step-by-step workflows (add a lesson, create a
demo, embed a demo in a track, create a track).

- **Structure** — edit the typed data files in `src/content/`:
  `curriculum.data.ts` (tracks/modules/lessons), `exercises.data.ts`,
  `assessments.data.ts`, `resources.data.ts`.
- **Lesson bodies** — MDX files in `src/content/lessons/<contentRef>.mdx`. Inside
  them you can drop:
  - `<Video src="…" title="…" />` (YouTube/Vimeo/file)
  - `<Demo id="…" />` (a registered demo)
  - `<Exercise id="…" />` (an exercise from `exercises.data.ts`)
  - `<Callout variant="note|tip|warning">…</Callout>`
- **Demos** — add a self-contained client component and register it in
  `src/lib/demos/registry.ts`. It is then embeddable everywhere by `id`.

Placeholder copy is lorem ipsum — replace it with real curriculum.

## Architecture notes

- Auth: WorkOS AuthKit. `src/middleware.ts` refreshes the session — deliberately
  the deprecated `middleware.ts` convention, not Next 16's `proxy.ts` (which
  compiles to Node middleware that `@opennextjs/cloudflare` rejects; see
  `CLAUDE.md`). Pages/actions call `getCurrentUser()` / `requireUser()` from
  `src/lib/auth.ts`, which upserts the WorkOS user into the local `User` table.
- Mutations are React Server Actions in `src/app/actions/`; closed-exercise
  answer keys never reach the client (graded in `gradeExercise`).
- Prisma models (`prisma/schema.prisma`) cover users, lesson progress,
  submissions, and classrooms/memberships.

## Deploy

The site deploys to Cloudflare Workers (worker `tracks`) via git-connected
Workers Builds: pushes to `main` run `npx opennextjs-cloudflare build` and
`npx opennextjs-cloudflare deploy`. The database is PlanetScale for Postgres,
reached through a Hyperdrive binding (`wrangler.jsonc`); WorkOS secrets live on
the worker (`wrangler secret put`), and the WorkOS redirect URI must point at
the production `/callback` URL. Apply new SQL migrations from `db/migrations/`
manually with psql over the direct port 5432 (admin role) — never
`prisma migrate` against production.
