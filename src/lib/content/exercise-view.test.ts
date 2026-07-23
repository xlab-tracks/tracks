import { describe, it, expect } from "vitest";
import {
  ALLOCATION_MAX_REASONING_CHARS,
  CONTROL_SCENARIO_MAX_ANSWER_CHARS,
  WRITING_MAX_SECTION_CHARS,
  flowchartEquals,
  gradeChoice,
  gradeFlowchartStage,
  sanitizeAllocationScenario,
  sanitizeArgueRevealConstruction,
  sanitizeArgueRevealItem,
  sanitizeCommitConstructCommit,
  sanitizeCommitConstructConstruct,
  sanitizeControlScenarioAnswer,
  sanitizeFlowchartAttempt,
  sanitizeStagedQuestionEntry,
  sanitizeWritingValues,
  toPublicChoice,
  toPublicFlowchart,
} from "@/lib/content/exercise-view";
import type {
  AllocationExercise,
  ArgueRevealExercise,
  ChoiceExercise,
  CommitConstructExercise,
  ControlScenariosExercise,
  FlowchartExercise,
  StagedQuestionsExercise,
} from "@/lib/content/types";

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

  it("does not let duplicated ids satisfy a multi-select", () => {
    // A direct POST of ["a","a"] must not pass as the set {"a","c"}.
    expect(gradeChoice(ms, ["a", "a"])).toBe(false);
    expect(gradeChoice(ms, ["a", "c", "c"])).toBe(true);
  });

  it("grades true/false", () => {
    expect(gradeChoice(tf, ["false"])).toBe(true);
    expect(gradeChoice(tf, ["true"])).toBe(false);
  });
});

describe("sanitizeFlowchartAttempt", () => {
  const valid = new Set(["start", "check", "escalate"]);

  it("accepts a bounded, known-id tree and preserves branch arms", () => {
    const attempt = [
      { blockId: "start" },
      { blockId: "check", branches: [[{ blockId: "escalate" }], []] },
    ];
    expect(sanitizeFlowchartAttempt(attempt, valid)).toEqual(attempt);
  });

  it("rejects unknown block ids", () => {
    expect(sanitizeFlowchartAttempt([{ blockId: "nope" }], valid)).toBeNull();
  });

  it("rejects non-arrays, oversized breadth, and excess depth", () => {
    expect(sanitizeFlowchartAttempt({ blockId: "start" }, valid)).toBeNull();
    expect(
      sanitizeFlowchartAttempt(
        Array.from({ length: 21 }, () => ({ blockId: "start" })),
        valid,
      ),
    ).toBeNull();
    // 9 levels of nesting exceeds the depth-8 cap.
    let deep: unknown = [{ blockId: "start" }];
    for (let i = 0; i < 9; i++) deep = [{ blockId: "start", branches: [deep] }];
    expect(sanitizeFlowchartAttempt(deep, valid)).toBeNull();
  });

  it("rejects malformed nodes and over-wide branch sets", () => {
    expect(sanitizeFlowchartAttempt([null], valid)).toBeNull();
    expect(
      sanitizeFlowchartAttempt(
        [{ blockId: "check", branches: Array.from({ length: 6 }, () => []) }],
        valid,
      ),
    ).toBeNull();
  });
});

describe("sanitizeWritingValues", () => {
  const allowed = new Set(["intro", "body"]);

  it("accepts a partial map of known sections", () => {
    expect(sanitizeWritingValues({ intro: "hello" }, allowed)).toEqual({
      intro: "hello",
    });
    expect(sanitizeWritingValues({}, allowed)).toEqual({});
  });

  it("rejects unknown keys, non-strings, arrays, and oversized text", () => {
    expect(sanitizeWritingValues({ evil: "x" }, allowed)).toBeNull();
    expect(sanitizeWritingValues({ intro: 42 }, allowed)).toBeNull();
    expect(sanitizeWritingValues({ intro: { a: 1 } }, allowed)).toBeNull();
    expect(sanitizeWritingValues([], allowed)).toBeNull();
    expect(sanitizeWritingValues(null, allowed)).toBeNull();
    expect(
      sanitizeWritingValues(
        { body: "y".repeat(WRITING_MAX_SECTION_CHARS + 1) },
        allowed,
      ),
    ).toBeNull();
  });

  it("rejects text that cannot round-trip through jsonb", () => {
    expect(sanitizeWritingValues({ intro: "ok" + String.fromCharCode(0) }, allowed)).toBeNull();
    expect(sanitizeWritingValues({ intro: String.fromCharCode(0xd800) }, allowed)).toBeNull();
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

const alloc: AllocationExercise = {
  id: "alloc",
  type: "allocation",
  title: "Allocate",
  prompt: "?",
  agendas: [
    { id: "x", label: "X" },
    { id: "y", label: "Y" },
    { id: "z", label: "Z" },
  ],
  scenarios: [
    { id: "s1", title: "Scenario 1", description: "First." },
    { id: "s2", title: "Scenario 2", description: "Second." },
  ],
  totalPeople: 10,
  step: 0.5,
  minReasoningChars: 10,
};

describe("sanitizeAllocationScenario", () => {
  const good = { x: 4.5, y: 5.5, z: 0 };
  const why = "long enough reasoning";

  it("accepts a valid scenario attempt", () => {
    expect(sanitizeAllocationScenario(alloc, "s1", good, why)).toEqual({
      allocation: good,
      reasoning: why,
    });
  });

  it("rejects an unknown scenario id", () => {
    expect(sanitizeAllocationScenario(alloc, "nope", good, why)).toBeNull();
    expect(sanitizeAllocationScenario(alloc, 3, good, why)).toBeNull();
  });

  it("requires exactly the exercise's agenda ids", () => {
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: 5, y: 5 }, why),
    ).toBeNull();
    expect(
      sanitizeAllocationScenario(alloc, "s1", { ...good, extra: 0 }, why),
    ).toBeNull();
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: 5, y: 5, w: 0 }, why),
    ).toBeNull();
    expect(sanitizeAllocationScenario(alloc, "s1", null, why)).toBeNull();
  });

  it("requires the pool to be exactly spent", () => {
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: 4, y: 5.5, z: 0 }, why),
    ).toBeNull();
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: 5, y: 5.5, z: 0 }, why),
    ).toBeNull();
  });

  it("rejects values off the step grid, negative, or non-finite", () => {
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: 4.3, y: 5.7, z: 0 }, why),
    ).toBeNull();
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: 12, y: -2, z: 0 }, why),
    ).toBeNull();
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: NaN, y: 10, z: 0 }, why),
    ).toBeNull();
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: "5", y: 5, z: 0 }, why),
    ).toBeNull();
  });

  it("rejects a single value above the pool even if compensated", () => {
    expect(
      sanitizeAllocationScenario(alloc, "s1", { x: 10.5, y: -0.5, z: 0 }, why),
    ).toBeNull();
  });

  it("snaps epsilon-off values back onto the step grid", () => {
    const entry = sanitizeAllocationScenario(
      alloc,
      "s1",
      { x: 4.5000000001, y: 5.4999999999, z: 0 },
      why,
    );
    expect(entry?.allocation).toEqual({ x: 4.5, y: 5.5, z: 0 });
  });

  it("rejects reasoning that can't be stored as jsonb", () => {
    const pad = "a".repeat(20);
    expect(
      sanitizeAllocationScenario(alloc, "s1", good, `${pad}\u0000`),
    ).toBeNull();
    expect(
      sanitizeAllocationScenario(alloc, "s1", good, `${pad}\uD800`),
    ).toBeNull();
    expect(
      sanitizeAllocationScenario(alloc, "s1", good, `${pad}\uDC00${pad}`),
    ).toBeNull();
    // Well-formed astral pairs are fine.
    expect(
      sanitizeAllocationScenario(alloc, "s1", good, `${pad} 👍 ${pad}`),
    ).not.toBeNull();
  });


  it("enforces reasoning length bounds", () => {
    expect(sanitizeAllocationScenario(alloc, "s1", good, "short")).toBeNull();
    expect(sanitizeAllocationScenario(alloc, "s1", good, "         \n ")).toBeNull();
    expect(sanitizeAllocationScenario(alloc, "s1", good, 42)).toBeNull();
    expect(
      sanitizeAllocationScenario(
        alloc,
        "s1",
        good,
        "a".repeat(ALLOCATION_MAX_REASONING_CHARS + 1),
      ),
    ).toBeNull();
  });

  it("defaults the step to halves and the reasoning minimum to zero", () => {
    const bare: AllocationExercise = {
      ...alloc,
      step: undefined,
      minReasoningChars: undefined,
    };
    expect(sanitizeAllocationScenario(bare, "s1", good, "")).toEqual({
      allocation: good,
      reasoning: "",
    });
    expect(
      sanitizeAllocationScenario(bare, "s1", { x: 4.25, y: 5.75, z: 0 }, ""),
    ).toBeNull();
  });
});

const argue: ArgueRevealExercise = {
  id: "argue",
  type: "argue-reveal",
  title: "Respond",
  prompt: "?",
  conceptsPrompt: "Which ideas?",
  concepts: [
    { id: "c1", label: "C1", tip: "tip 1" },
    { id: "c2", label: "C2", tip: "tip 2" },
  ],
  toolboxLabel: "Toolbox",
  toolbox: [{ heading: "H", text: "T" }],
  items: [
    {
      id: "one",
      label: "one",
      title: "Item 1",
      rounds: [{ critique: "crit", reveal: "reveal" }],
    },
    {
      id: "two",
      label: "two",
      title: "Item 2",
      rounds: [
        { critique: "crit a", reveal: "reveal a" },
        { critique: "crit b", reveal: "reveal b" },
      ],
    },
  ],
  revealFraming: "One response:",
  postRevealPrompt: "Does it answer?",
  construction: {
    intro: "Build your own.",
    surfaces: [
      { id: "s1", text: "Surface 1" },
      { id: "s2", text: "Surface 2" },
    ],
  },
  responseMinChars: 10,
  responseMaxChars: 50,
  residualMinChars: 5,
  residualMaxChars: 20,
  noteMaxChars: 15,
};

describe("sanitizeArgueRevealItem", () => {
  const round = {
    chips: ["c1"],
    response: "long enough answer",
    toolboxOpened: false,
  };

  it("accepts a valid single-round item", () => {
    expect(
      sanitizeArgueRevealItem(argue, "one", [round], "partially", "why"),
    ).toEqual({ rounds: [round], rating: "partially", note: "why" });
  });

  it("requires one entry per authored round", () => {
    expect(sanitizeArgueRevealItem(argue, "two", [round], "fully", "")).toBeNull();
    expect(
      sanitizeArgueRevealItem(argue, "one", [round, round], "fully", ""),
    ).toBeNull();
  });

  it("rejects unknown items, ratings, and chips", () => {
    expect(sanitizeArgueRevealItem(argue, "nope", [round], "fully", "")).toBeNull();
    expect(sanitizeArgueRevealItem(argue, "one", [round], "sorta", "")).toBeNull();
    expect(
      sanitizeArgueRevealItem(
        argue,
        "one",
        [{ ...round, chips: ["c1", "bogus"] }],
        "fully",
        "",
      ),
    ).toBeNull();
  });

  it("dedupes chips and enforces response bounds", () => {
    const entry = sanitizeArgueRevealItem(
      argue,
      "one",
      [{ ...round, chips: ["c1", "c1"] }],
      "fully",
      "",
    );
    expect(entry?.rounds[0].chips).toEqual(["c1"]);
    expect(
      sanitizeArgueRevealItem(
        argue,
        "one",
        [{ ...round, response: "short" }],
        "fully",
        "",
      ),
    ).toBeNull();
    expect(
      sanitizeArgueRevealItem(
        argue,
        "one",
        [{ ...round, response: "x".repeat(51) }],
        "fully",
        "",
      ),
    ).toBeNull();
  });

  it("enforces the note cap and storable text", () => {
    expect(
      sanitizeArgueRevealItem(argue, "one", [round], "fully", "x".repeat(16)),
    ).toBeNull();
    expect(
      sanitizeArgueRevealItem(
        argue,
        "one",
        [round],
        "fully",
        "ok" + String.fromCharCode(0),
      ),
    ).toBeNull();
  });

  it("rejects non-boolean toolboxOpened and oversized chip arrays", () => {
    expect(
      sanitizeArgueRevealItem(
        argue,
        "one",
        [{ ...round, toolboxOpened: "yes" }],
        "fully",
        "",
      ),
    ).toBeNull();
    expect(
      sanitizeArgueRevealItem(
        argue,
        "one",
        [{ ...round, chips: ["c1", "c2", "c1"] }],
        "fully",
        "",
      ),
    ).toBeNull();
  });

  it("applies the documented default bounds when none are authored", () => {
    const bare: ArgueRevealExercise = {
      ...argue,
      responseMinChars: undefined,
      responseMaxChars: undefined,
      residualMinChars: undefined,
      residualMaxChars: undefined,
      noteMaxChars: undefined,
    };
    const shortResponse = { ...round, response: "x".repeat(79) };
    const okResponse = { ...round, response: "x".repeat(80) };
    expect(
      sanitizeArgueRevealItem(bare, "one", [shortResponse], "fully", ""),
    ).toBeNull();
    expect(
      sanitizeArgueRevealItem(bare, "one", [okResponse], "fully", ""),
    ).not.toBeNull();
    expect(
      sanitizeArgueRevealItem(bare, "one", [okResponse], "fully", "n".repeat(201)),
    ).toBeNull();
    expect(
      sanitizeArgueRevealConstruction(bare, {
        attackSurface: "s1",
        argument: "a".repeat(80),
        bestResponse: "b".repeat(80),
        residual: "r".repeat(29),
      }),
    ).toBeNull();
    expect(
      sanitizeArgueRevealConstruction(bare, {
        attackSurface: "s1",
        argument: "a".repeat(80),
        bestResponse: "b".repeat(80),
        residual: "r".repeat(30),
      }),
    ).not.toBeNull();
  });
});

describe("sanitizeArgueRevealConstruction", () => {
  const good = {
    attackSurface: "s1",
    argument: "an argument here",
    bestResponse: "a best response",
    residual: "residual",
  };

  it("accepts a valid construction", () => {
    expect(sanitizeArgueRevealConstruction(argue, good)).toEqual(good);
  });

  it("rejects unknown surfaces and out-of-bounds fields", () => {
    expect(
      sanitizeArgueRevealConstruction(argue, { ...good, attackSurface: "s9" }),
    ).toBeNull();
    expect(
      sanitizeArgueRevealConstruction(argue, { ...good, argument: "tiny" }),
    ).toBeNull();
    expect(
      sanitizeArgueRevealConstruction(argue, { ...good, residual: "abc" }),
    ).toBeNull();
    expect(
      sanitizeArgueRevealConstruction(argue, {
        ...good,
        residual: "y".repeat(21),
      }),
    ).toBeNull();
    expect(sanitizeArgueRevealConstruction(argue, null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Direct-POST sanitizers for the reveal-bearing self-assessment types
// (control-scenarios / staged-questions / commit-construct). These ship
// their reveals to the client by design — the sanitizers only guard what
// comes BACK by direct POST.
// ---------------------------------------------------------------------------

const LONE_SURROGATE = "\ud800";

const scenarios: ControlScenariosExercise = {
  id: "cs",
  type: "control-scenarios",
  prompt: "p",
  title: "Run the evaluation",
  question: "Does the control property hold?",
  placeholder: "…",
  actors: [],
  scenarios: [
    {
      id: "s1",
      displayTitle: "Scenario 1",
      card: "c",
      outcome: "o",
      revealName: "r",
      reveal: "reveal",
      graph: { width: 10, height: 10, nodes: [], edges: [] },
    },
  ],
};

describe("sanitizeControlScenarioAnswer", () => {
  it("accepts a known scenario with storable text and round-trips the answer", () => {
    expect(sanitizeControlScenarioAnswer(scenarios, "s1", "my reasoning")).toEqual({
      answer: "my reasoning",
    });
  });

  it("rejects unknown scenarios and non-string ids", () => {
    expect(sanitizeControlScenarioAnswer(scenarios, "nope", "x")).toBeNull();
    expect(sanitizeControlScenarioAnswer(scenarios, 3, "x")).toBeNull();
    expect(sanitizeControlScenarioAnswer(scenarios, null, "x")).toBeNull();
  });

  it("rejects malformed answers: wrong type, empty, unstorable, oversized", () => {
    expect(sanitizeControlScenarioAnswer(scenarios, "s1", 42)).toBeNull();
    expect(sanitizeControlScenarioAnswer(scenarios, "s1", "   ")).toBeNull();
    expect(sanitizeControlScenarioAnswer(scenarios, "s1", "a\u0000b")).toBeNull();
    expect(
      sanitizeControlScenarioAnswer(scenarios, "s1", LONE_SURROGATE),
    ).toBeNull();
    expect(
      sanitizeControlScenarioAnswer(
        scenarios,
        "s1",
        "x".repeat(CONTROL_SCENARIO_MAX_ANSWER_CHARS + 1),
      ),
    ).toBeNull();
    expect(
      sanitizeControlScenarioAnswer(
        scenarios,
        "s1",
        "x".repeat(CONTROL_SCENARIO_MAX_ANSWER_CHARS),
      ),
    ).not.toBeNull();
  });
});

const staged: StagedQuestionsExercise = {
  id: "sq",
  type: "staged-questions",
  prompt: "p",
  title: "Why catching counts",
  parts: [
    {
      id: "a",
      title: "Part A",
      questions: [
        { id: "q1", title: "t", question: "q?", reveal: "reveal" },
        { id: "q2", title: "t2", question: "q2?", reveal: "reveal2" },
      ],
    },
    {
      id: "b",
      title: "Part B",
      questions: [{ id: "q3", title: "t3", question: "q3?", reveal: "reveal3" }],
    },
  ],
};

describe("sanitizeStagedQuestionEntry", () => {
  it("accepts known questions from any part and round-trips the answer", () => {
    expect(sanitizeStagedQuestionEntry(staged, "q1", "because")).toEqual({
      answer: "because",
    });
    expect(sanitizeStagedQuestionEntry(staged, "q3", "later part")).toEqual({
      answer: "later part",
    });
  });

  it("rejects unknown question ids and non-string ids", () => {
    expect(sanitizeStagedQuestionEntry(staged, "q9", "x")).toBeNull();
    expect(sanitizeStagedQuestionEntry(staged, { id: "q1" }, "x")).toBeNull();
  });

  it("rejects malformed answers: wrong type, empty, unstorable, oversized", () => {
    expect(sanitizeStagedQuestionEntry(staged, "q1", ["x"])).toBeNull();
    expect(sanitizeStagedQuestionEntry(staged, "q1", "\n \t")).toBeNull();
    expect(sanitizeStagedQuestionEntry(staged, "q1", LONE_SURROGATE)).toBeNull();
    expect(
      sanitizeStagedQuestionEntry(
        staged,
        "q1",
        "x".repeat(CONTROL_SCENARIO_MAX_ANSWER_CHARS + 1),
      ),
    ).toBeNull();
  });
});

const commitConstruct: CommitConstructExercise = {
  id: "cc",
  type: "commit-construct",
  prompt: "p",
  title: "Commit & construct",
  commit: {
    partTitle: "Commit to a view",
    question: "Which view?",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
    confidencePrompt: "How confident?",
    confidenceOptions: [
      { id: "low", label: "Low" },
      { id: "high", label: "High" },
    ],
    reveal: "course correction",
  },
  construct: {
    partTitle: "Construct the threat model",
    threatPrompt: "How could it happen?",
    revealLead: "lead",
    reveal: "worked example",
    compareIntro: "compare",
    compareQuestions: ["q"],
  },
};

describe("sanitizeCommitConstructCommit", () => {
  it("accepts known choice + confidence with storable reasoning", () => {
    expect(
      sanitizeCommitConstructCommit(commitConstruct, "yes", "high", "since…"),
    ).toEqual({ choice: "yes", confidence: "high", reasoning: "since…" });
  });

  it("rejects unknown or non-string choice/confidence (no cross-list bleed)", () => {
    expect(
      sanitizeCommitConstructCommit(commitConstruct, "maybe", "high", "r"),
    ).toBeNull();
    expect(
      sanitizeCommitConstructCommit(commitConstruct, "yes", "medium", "r"),
    ).toBeNull();
    // A confidence id is not a valid choice id and vice versa.
    expect(
      sanitizeCommitConstructCommit(commitConstruct, "high", "yes", "r"),
    ).toBeNull();
    expect(
      sanitizeCommitConstructCommit(commitConstruct, 1, "high", "r"),
    ).toBeNull();
  });

  it("rejects malformed reasoning: wrong type, empty, unstorable, oversized", () => {
    expect(
      sanitizeCommitConstructCommit(commitConstruct, "yes", "high", 7),
    ).toBeNull();
    expect(
      sanitizeCommitConstructCommit(commitConstruct, "yes", "high", " "),
    ).toBeNull();
    expect(
      sanitizeCommitConstructCommit(commitConstruct, "yes", "high", LONE_SURROGATE),
    ).toBeNull();
    expect(
      sanitizeCommitConstructCommit(
        commitConstruct,
        "yes",
        "high",
        "x".repeat(CONTROL_SCENARIO_MAX_ANSWER_CHARS + 1),
      ),
    ).toBeNull();
  });
});

describe("sanitizeCommitConstructConstruct", () => {
  it("accepts storable text and round-trips it", () => {
    expect(sanitizeCommitConstructConstruct("the model could…")).toEqual({
      threatModel: "the model could…",
    });
  });

  it("rejects wrong type, empty, unstorable, and oversized text", () => {
    expect(sanitizeCommitConstructConstruct(undefined)).toBeNull();
    expect(sanitizeCommitConstructConstruct("")).toBeNull();
    expect(sanitizeCommitConstructConstruct("a\u0000b")).toBeNull();
    expect(sanitizeCommitConstructConstruct(LONE_SURROGATE)).toBeNull();
    expect(
      sanitizeCommitConstructConstruct(
        "x".repeat(CONTROL_SCENARIO_MAX_ANSWER_CHARS + 1),
      ),
    ).toBeNull();
  });
});
