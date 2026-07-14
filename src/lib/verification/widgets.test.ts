/**
 * Consistency checks for the Verification track's native React widgets: every
 * registered exercise must have a widget, a content-graph lesson (`v-<id>`),
 * and an MDX body that embeds it — and vice versa. (The interactives used to be
 * standalone HTML pages under public/verification/; they are now React widgets
 * in src/components/verification/widgets/, so the old static-site checks are
 * gone. Widget behaviour is covered by the engine unit tests in
 * src/lib/verification/engines/*.test.ts and browser smoke.)
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { lessons, modules, tracks } from "@/content/curriculum.data";
import {
  verificationExercises,
  verificationLessonId,
} from "@/lib/verification/exercises";
import { verificationWidgets } from "@/components/verification/widgets/registry";

const LESSONS_DIR = join(__dirname, "../../content/lessons");

const track = tracks.find((t) => t.id === "verification");
const trackModuleIds = new Set(track?.moduleIds ?? []);
const trackLessons = lessons.filter((l) => trackModuleIds.has(l.moduleId));

describe("verification track structure", () => {
  it("the verification track exists with its modules", () => {
    expect(track).toBeTruthy();
    for (const moduleId of track!.moduleIds) {
      expect(
        modules.some((m) => m.id === moduleId && m.trackId === "verification"),
        moduleId + " missing or mis-parented",
      ).toBe(true);
    }
  });
});

describe("registry ↔ widget ↔ content graph ↔ MDX", () => {
  it("every registered exercise has a native widget", () => {
    for (const exercise of verificationExercises) {
      expect(
        verificationWidgets[exercise.id],
        exercise.id + " has no widget in widgets/registry.tsx",
      ).toBeTruthy();
    }
  });

  it("every widget maps back to a registered exercise", () => {
    const ids = new Set(verificationExercises.map((e) => e.id));
    for (const id of Object.keys(verificationWidgets)) {
      expect(ids.has(id), id + " widget has no registry entry").toBe(true);
    }
    expect(Object.keys(verificationWidgets).length).toBe(
      verificationExercises.length,
    );
  });

  it("every exercise has a v-<id> lesson and an MDX body that embeds it", () => {
    for (const exercise of verificationExercises) {
      const lessonId = verificationLessonId(exercise.id);
      const lesson = trackLessons.find((l) => l.id === lessonId);
      expect(lesson, lessonId + " missing from the verification track").toBeTruthy();
      const mdxPath = join(LESSONS_DIR, lesson!.contentRef + ".mdx");
      expect(existsSync(mdxPath), lesson!.contentRef + ".mdx missing").toBe(true);
      expect(
        readFileSync(mdxPath, "utf8"),
        mdxPath + " must embed its exercise",
      ).toContain(`<VerificationExercise id="${exercise.id}" />`);
    }
  });

  it("every verification lesson maps back to a registered exercise", () => {
    const expected = new Set(
      verificationExercises.map((e) => verificationLessonId(e.id)),
    );
    for (const lesson of trackLessons) {
      expect(expected.has(lesson.id), lesson.id + " has no registry entry").toBe(true);
    }
    expect(trackLessons.length).toBe(verificationExercises.length);
  });
});
