import { describe, it, expect } from "vitest";
import {
  getAssessmentForModule,
  getLessonsForModule,
  getModulesForTrack,
  getPrerequisiteModules,
  tracks,
} from "@/lib/content";
import { exercises } from "@/content/exercises.data";
import type { FlowchartNode } from "@/lib/content/types";

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

  it("flowchart solutions are well-formed against their palettes", () => {
    for (const exercise of exercises) {
      if (exercise.type !== "flowchart") continue;
      const blocks = new Map(exercise.palette.map((b) => [b.id, b]));

      const checkSequence = (nodes: FlowchartNode[]) => {
        for (const [i, node] of nodes.entries()) {
          const block = blocks.get(node.blockId);
          expect(block, `${exercise.id}: unknown block ${node.blockId}`).toBeDefined();
          if (block!.kind === "branch") {
            // A branch closes its sequence and has one child arm per label.
            expect(i).toBe(nodes.length - 1);
            expect(node.branches?.length).toBe(block!.branchLabels?.length);
            for (const arm of node.branches ?? []) checkSequence(arm);
          } else {
            expect(node.branches).toBeUndefined();
            // A terminal also closes its sequence.
            if (block!.kind === "terminal") expect(i).toBe(nodes.length - 1);
          }
        }
        // Every complete path ends in a terminal or fans out through a branch.
        const last = blocks.get(nodes[nodes.length - 1]?.blockId ?? "");
        expect(last && last.kind !== "step", `${exercise.id}: open path`).toBe(true);
      };

      for (const stage of exercise.stages) checkSequence(stage.solution);
    }
  });
});
