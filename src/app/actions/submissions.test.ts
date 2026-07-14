import { afterEach, describe, expect, it, vi } from "vitest";

// Locks the headline hardening: writing submissions validate contentId/kind
// and the shape of `values` (reachable by direct POST) instead of persisting
// whatever the client sends.

const { prisma, getCurrentUser, getWritingTarget } = vi.hoisted(() => ({
  prisma: {
    submission: {
      updateMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
  getCurrentUser: vi.fn(),
  getWritingTarget: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/content", () => ({ getWritingTarget }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { saveWritingDraft, submitWriting } from "./submissions";

afterEach(() => vi.clearAllMocks());

describe("submitWriting", () => {
  it("rejects an unknown / mistyped content id (no write)", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    getWritingTarget.mockReturnValue(undefined);
    await expect(
      submitWriting("bogus", "assessment", null, { intro: "hi" }),
    ).rejects.toThrow("Invalid submission");
    expect(prisma.submission.upsert).not.toHaveBeenCalled();
  });

  it("rejects values with unknown section keys (no write)", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    getWritingTarget.mockReturnValue({ sectionIds: ["intro"], format: "memo" });
    await expect(
      submitWriting("a1", "assessment", null, { evil: "x" }),
    ).rejects.toThrow("Invalid submission");
    expect(prisma.submission.upsert).not.toHaveBeenCalled();
  });

  it("persists valid values with the server-derived format", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    getWritingTarget.mockReturnValue({ sectionIds: ["intro"], format: "memo" });
    prisma.submission.upsert.mockResolvedValue({});
    // The caller's format arg ("spoofed") must be ignored.
    await submitWriting("a1", "assessment", "spoofed", { intro: "hello" });
    const arg = prisma.submission.upsert.mock.calls[0][0];
    expect(arg.create.format).toBe("memo");
    expect(arg.create.responseJson).toEqual({ intro: "hello" });
    expect(arg.update.status).toBe("submitted");
  });

  it("throws when signed out", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(
      submitWriting("a1", "assessment", null, { intro: "hi" }),
    ).rejects.toThrow("Not signed in");
  });
});

describe("saveWritingDraft", () => {
  it("no-ops on invalid payloads", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    getWritingTarget.mockReturnValue({ sectionIds: ["intro"], format: "memo" });
    await saveWritingDraft("a1", "assessment", null, { intro: 42 } as never);
    expect(prisma.submission.updateMany).not.toHaveBeenCalled();
    expect(prisma.submission.create).not.toHaveBeenCalled();
  });

  it("updates a non-submitted row atomically, only creating when none matched", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    getWritingTarget.mockReturnValue({ sectionIds: ["intro"], format: "memo" });
    // Row exists and is a draft → updateMany hits it, no create.
    prisma.submission.updateMany.mockResolvedValue({ count: 1 });
    await saveWritingDraft("a1", "assessment", null, { intro: "draft" });
    expect(prisma.submission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: "submitted" } }),
      }),
    );
    expect(prisma.submission.create).not.toHaveBeenCalled();
  });

  it("creates the row when nothing matched the update", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    getWritingTarget.mockReturnValue({ sectionIds: ["intro"], format: "memo" });
    prisma.submission.updateMany.mockResolvedValue({ count: 0 });
    prisma.submission.create.mockResolvedValue({});
    await saveWritingDraft("a1", "assessment", null, { intro: "draft" });
    expect(prisma.submission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "draft", format: "memo" }),
      }),
    );
  });
});
