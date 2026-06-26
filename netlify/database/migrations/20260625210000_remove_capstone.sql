-- Remove the capstone feature: drop its tables and status enum, and drop the
-- now-unused 'capstone' value from SubmissionKind.

-- Capstone tables (their FKs are defined on these tables, so they drop with them).
DROP TABLE IF EXISTS "CapstoneEntry";
DROP TABLE IF EXISTS "CapstoneProject";

-- Capstone-only status enum (no other table references it).
DROP TYPE IF EXISTS "CapstoneStatus";

-- Postgres can't drop a value from an enum in place, so recreate SubmissionKind
-- without 'capstone'. No code path ever wrote that value, but delete any stray
-- rows first so the column cast can't fail.
DELETE FROM "Submission" WHERE "kind" = 'capstone';
ALTER TYPE "SubmissionKind" RENAME TO "SubmissionKind_old";
CREATE TYPE "SubmissionKind" AS ENUM ('exercise', 'assessment');
ALTER TABLE "Submission"
  ALTER COLUMN "kind" TYPE "SubmissionKind" USING ("kind"::text::"SubmissionKind");
DROP TYPE "SubmissionKind_old";
