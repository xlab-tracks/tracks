import { describe, it, expect } from "vitest";
import { gradeChoice, toPublicChoice } from "@/lib/content/exercise-view";
import type { ChoiceExercise } from "@/lib/content/types";

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
});
