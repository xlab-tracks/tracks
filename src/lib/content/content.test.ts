import { describe, it, expect } from "vitest";
import {
  getAssessmentForModule,
  getLessonsForModule,
  getModulesForTrack,
  getPrerequisiteModules,
  tracks,
} from "@/lib/content";

describe("content integrity", () => {
  it("every track's modules resolve and belong to it", () => {
    for (const track of tracks) {
      const modules = getModulesForTrack(track.id);
      expect(modules.length).toBe(track.moduleIds.length);
      for (const m of modules) expect(m.trackId).toBe(track.id);
    }
  });

  it("every module's lessons resolve", () => {
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        expect(getLessonsForModule(m.id).length).toBe(m.lessonIds.length);
      }
    }
  });

  it("every declared prerequisite resolves to a real module", () => {
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        expect(getPrerequisiteModules(m.id).length).toBe(
          m.prerequisiteModuleIds.length,
        );
      }
    }
  });

  it("each module assessment is attached to that module", () => {
    for (const track of tracks) {
      for (const m of getModulesForTrack(track.id)) {
        if (m.assessmentId) {
          expect(getAssessmentForModule(m.id)?.id).toBe(m.assessmentId);
        }
      }
    }
  });
});
