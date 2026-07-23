import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Locks the grading action's guards: auth re-check, submitted-only, the
// billed-call throttles (per-submission cooldown + hourly cap), and the
// .env.example placeholder being treated as no server key at all.

const { prisma, getCurrentUser, callGrader, userKey, sample } = vi.hoisted(
  () => ({
    prisma: {
      submission: {
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    },
    getCurrentUser: vi.fn(),
    callGrader: vi.fn(),
    userKey: {
      getOpenRouterKeyStatus: vi.fn(),
      getUserOpenRouterKey: vi.fn(),
    },
    sample: {
      assembleWriting: vi.fn(),
      assembleArgueReveal: vi.fn(),
    },
  }),
);

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/grader/openrouter", () => ({ callGrader }));
vi.mock("@/lib/grader/user-key", () => userKey);
vi.mock("@/lib/grader/sample", () => sample);
vi.mock("@/lib/content", () => ({ getExerciseById: vi.fn() }));

import { requestTransparencyGrade } from "./grading";

const OLD = new Date(Date.now() - 10 * 60 * 1000);

function submittedRow(overrides: Record<string, unknown> = {}) {
  return {
    status: "submitted",
    feedback: null,
    updatedAt: OLD,
    responseJson: { intro: "text" },
    ...overrides,
  };
}

beforeEach(() => {
  getCurrentUser.mockResolvedValue({ id: "u1" });
  prisma.submission.count.mockResolvedValue(0);
  sample.assembleWriting.mockReturnValue({ sample: "text", context: "ctx" });
  userKey.getOpenRouterKeyStatus.mockResolvedValue(null);
  userKey.getUserOpenRouterKey.mockResolvedValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("requestTransparencyGrade guards", () => {
  it("rejects when signed out (no reads, no LLM call)", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await requestTransparencyGrade("c1", "exercise");
    expect(result.ok).toBe(false);
    expect(prisma.submission.findUnique).not.toHaveBeenCalled();
    expect(callGrader).not.toHaveBeenCalled();
  });

  it("rejects drafts and missing submissions", async () => {
    prisma.submission.findUnique.mockResolvedValue(null);
    expect((await requestTransparencyGrade("c1", "exercise")).ok).toBe(false);
    prisma.submission.findUnique.mockResolvedValue(
      submittedRow({ status: "draft" }),
    );
    expect((await requestTransparencyGrade("c1", "exercise")).ok).toBe(false);
    expect(callGrader).not.toHaveBeenCalled();
  });

  it("refuses a regrade inside the cooldown window (no LLM call)", async () => {
    prisma.submission.findUnique.mockResolvedValue(
      submittedRow({ feedback: "old report", updatedAt: new Date() }),
    );
    const result = await requestTransparencyGrade("c1", "exercise");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/wait a minute/i);
    expect(callGrader).not.toHaveBeenCalled();
  });

  it("allows a regrade once the cooldown has passed", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-real-key");
    prisma.submission.findUnique.mockResolvedValue(
      submittedRow({ feedback: "old report", updatedAt: OLD }),
    );
    callGrader.mockResolvedValue({ ok: false, error: "upstream down" });
    const result = await requestTransparencyGrade("c1", "exercise");
    expect(callGrader).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false); // upstream error propagates as-is
  });

  it("enforces the hourly cap (no LLM call)", async () => {
    prisma.submission.findUnique.mockResolvedValue(submittedRow());
    prisma.submission.count.mockResolvedValue(12);
    const result = await requestTransparencyGrade("c1", "exercise");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/limit/i);
    expect(callGrader).not.toHaveBeenCalled();
  });

  it("treats the .env.example placeholder as no server key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-...");
    prisma.submission.findUnique.mockResolvedValue(submittedRow());
    const result = await requestTransparencyGrade("c1", "exercise");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not configured/i);
    expect(callGrader).not.toHaveBeenCalled();
  });

  it("surfaces a stored-but-undecryptable user key instead of billing the server", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-real-key");
    prisma.submission.findUnique.mockResolvedValue(submittedRow());
    userKey.getOpenRouterKeyStatus.mockResolvedValue({ state: "needs-reentry" });
    const result = await requestTransparencyGrade("c1", "exercise");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/no longer be read/i);
    expect(callGrader).not.toHaveBeenCalled();
  });
});
