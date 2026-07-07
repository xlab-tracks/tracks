import { describe, it, expect } from "vitest";
import {
  flowchartEquals,
  gradeChoice,
  gradeFlowchartStage,
  toPublicChoice,
  toPublicFlowchart,
} from "@/lib/content/exercise-view";
import type { ChoiceExercise, FlowchartExercise } from "@/lib/content/types";

const mc: ChoiceExercise = {
  id: "mc",
  type: "multiple-choice",
  prompt: "?",
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  correctOptionIds: ["b"],
  explanation: "because",
};

const ms: ChoiceExercise = {
  id: "ms",
  type: "multi-select",
  prompt: "?",
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C" },
  ],
  correctOptionIds: ["a", "c"],
};

const tf: ChoiceExercise = {
  id: "tf",
  type: "true-false",
  prompt: "?",
  options: [
    { id: "true", label: "True" },
    { id: "false", label: "False" },
  ],
  correctOptionIds: ["false"],
};

describe("gradeChoice", () => {
  it("grades multiple-choice", () => {
    expect(gradeChoice(mc, ["b"])).toBe(true);
    expect(gradeChoice(mc, ["a"])).toBe(false);
    expect(gradeChoice(mc, [])).toBe(false);
  });

  it("requires an exact set for multi-select", () => {
    expect(gradeChoice(ms, ["a", "c"])).toBe(true);
    expect(gradeChoice(ms, ["c", "a"])).toBe(true);
    expect(gradeChoice(ms, ["a"])).toBe(false);
    expect(gradeChoice(ms, ["a", "b", "c"])).toBe(false);
  });

  it("grades true/false", () => {
    expect(gradeChoice(tf, ["false"])).toBe(true);
    expect(gradeChoice(tf, ["true"])).toBe(false);
  });
});

describe("toPublicChoice", () => {
  it("strips the answer key and explanation", () => {
    const pub = toPublicChoice(mc);
    expect(pub).not.toHaveProperty("correctOptionIds");
    expect(pub).not.toHaveProperty("explanation");
    expect(pub.options).toHaveLength(2);
    expect(pub.multiple).toBe(false);
  });

  it("flags multi-select as multiple", () => {
    expect(toPublicChoice(ms).multiple).toBe(true);
  });

  it("defaults monospaceOptions to false when unset", () => {
    expect(toPublicChoice(mc).monospaceOptions).toBe(false);
  });

  it("passes monospaceOptions through when set", () => {
    expect(toPublicChoice({ ...mc, monospaceOptions: true }).monospaceOptions).toBe(true);
  });
});

const flow: FlowchartExercise = {
  id: "flow",
  type: "flowchart",
  prompt: "?",
  palette: [
    { id: "write", kind: "step", label: "Write" },
    { id: "rate", kind: "step", label: "Rate" },
    {
      id: "split",
      kind: "branch",
      label: "Rank?",
      branchLabels: ["Top", "Rest"],
    },
    { id: "audit", kind: "terminal", label: "Audit" },
    { id: "submit", kind: "terminal", label: "Submit" },
  ],
  stages: [
    {
      id: "s1",
      title: "Stage 1",
      description: "Write, rate, split.",
      solution: [
        { blockId: "write" },
        { blockId: "rate" },
        {
          blockId: "split",
          branches: [[{ blockId: "audit" }], [{ blockId: "submit" }]],
        },
      ],
      explanation: "because",
    },
  ],
};

describe("flowchartEquals", () => {
  const solution = flow.stages[0].solution;

  it("accepts a structurally identical chart", () => {
    expect(flowchartEquals(solution, structuredClone(solution))).toBe(true);
  });

  it("treats omitted and empty branches as equivalent", () => {
    expect(
      flowchartEquals([{ blockId: "write" }], [{ blockId: "write", branches: [] }]),
    ).toBe(true);
  });

  it("rejects wrong block order", () => {
    const swapped = structuredClone(solution);
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    expect(flowchartEquals(solution, swapped)).toBe(false);
  });

  it("rejects swapped branch arms", () => {
    const swapped = structuredClone(solution);
    swapped[2].branches!.reverse();
    expect(flowchartEquals(solution, swapped)).toBe(false);
  });

  it("rejects missing or extra nodes", () => {
    expect(flowchartEquals(solution, solution.slice(0, 2))).toBe(false);
    expect(
      flowchartEquals(solution, [...solution, { blockId: "submit" }]),
    ).toBe(false);
  });
});

describe("gradeFlowchartStage", () => {
  it("grades against the stage's solution", () => {
    expect(
      gradeFlowchartStage(flow, "s1", structuredClone(flow.stages[0].solution)),
    ).toBe(true);
    expect(gradeFlowchartStage(flow, "s1", [{ blockId: "submit" }])).toBe(false);
  });

  it("fails an unknown stage", () => {
    expect(gradeFlowchartStage(flow, "nope", [])).toBe(false);
  });
});

describe("toPublicFlowchart", () => {
  it("strips solutions and explanations from stages", () => {
    const pub = toPublicFlowchart(flow);
    expect(pub.palette).toHaveLength(5);
    expect(pub.stages).toHaveLength(1);
    expect(pub.stages[0]).not.toHaveProperty("solution");
    expect(pub.stages[0]).not.toHaveProperty("explanation");
    expect(pub.stages[0].description).toBe("Write, rate, split.");
  });
});
