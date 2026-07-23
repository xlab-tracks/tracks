import { afterEach, describe, expect, it, vi } from "vitest";

// Locks the API-key action contracts: auth is re-checked (direct POST),
// malformed keys never reach the network, verification failures never
// persist, and the response only ever carries the last four characters.

const { prisma, getCurrentUser, keyStorageSecret } = vi.hoisted(() => ({
  prisma: {
    userApiKey: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    classroomApiKey: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    classroomMembership: {
      findUnique: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
  getCurrentUser: vi.fn(),
  keyStorageSecret: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/grader/user-key", () => ({
  keyStorageSecret,
  keyAad: (userId: string) => `${userId}:openrouter`,
}));

import {
  removeClassroomOpenRouterKey,
  removeOpenRouterKey,
  saveClassroomOpenRouterKey,
  saveOpenRouterKey,
  setGraderKeySelection,
} from "./api-keys";

const VALID_KEY = "sk-or-v1-0123456789abcdef0123456789abcdef";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("saveOpenRouterKey", () => {
  it("rejects when signed out (no network, no write)", async () => {
    getCurrentUser.mockResolvedValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await saveOpenRouterKey(VALID_KEY);
    expect(result.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(prisma.userApiKey.upsert).not.toHaveBeenCalled();
  });

  it("rejects malformed keys before any network call", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const bad of ["", "sk-openai-123", "not a key", 42 as unknown as string]) {
      const result = await saveOpenRouterKey(bad);
      expect(result.ok).toBe(false);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(prisma.userApiKey.upsert).not.toHaveBeenCalled();
  });

  it("does not persist a key OpenRouter rejects", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    keyStorageSecret.mockReturnValue("s".repeat(32));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );
    const result = await saveOpenRouterKey(VALID_KEY);
    expect(result).toEqual({ ok: false, error: "OpenRouter rejected that key." });
    expect(prisma.userApiKey.upsert).not.toHaveBeenCalled();
  });

  it("persists ciphertext (never plaintext) and returns only last4", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    keyStorageSecret.mockReturnValue("s".repeat(32));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    prisma.userApiKey.upsert.mockResolvedValue({});
    const result = await saveOpenRouterKey(VALID_KEY);
    expect(result).toEqual({ ok: true, last4: VALID_KEY.slice(-4) });
    const arg = prisma.userApiKey.upsert.mock.calls[0][0];
    expect(arg.create.last4).toBe(VALID_KEY.slice(-4));
    // The stored blob must be an encryption, not the raw key.
    expect(arg.create.ciphertext).not.toContain(VALID_KEY);
    expect(arg.update.ciphertext).toBe(arg.create.ciphertext);
  });

  it("hides the feature when key storage is unconfigured", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    keyStorageSecret.mockReturnValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await saveOpenRouterKey(VALID_KEY);
    expect(result.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("removeOpenRouterKey", () => {
  it("rejects when signed out (no delete)", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await removeOpenRouterKey();
    expect(result.ok).toBe(false);
    expect(prisma.userApiKey.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes only the caller's own row", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.userApiKey.deleteMany.mockResolvedValue({ count: 1 });
    const result = await removeOpenRouterKey();
    expect(result).toEqual({ ok: true });
    expect(prisma.userApiKey.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", provider: "openrouter" },
    });
  });
});

describe("saveClassroomOpenRouterKey", () => {
  it("rejects non-instructors (students and non-members; no network, no write)", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    keyStorageSecret.mockReturnValue("s".repeat(32));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const membership of [{ role: "student" }, null]) {
      prisma.classroomMembership.findUnique.mockResolvedValue(membership);
      const result = await saveClassroomOpenRouterKey("cls1", VALID_KEY);
      expect(result.ok).toBe(false);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(prisma.classroomApiKey.upsert).not.toHaveBeenCalled();
  });

  it("persists ciphertext (never plaintext) for an instructor, returns only last4", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    keyStorageSecret.mockReturnValue("s".repeat(32));
    prisma.classroomMembership.findUnique.mockResolvedValue({ role: "instructor" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    prisma.classroomApiKey.upsert.mockResolvedValue({});
    const result = await saveClassroomOpenRouterKey("cls1", VALID_KEY);
    expect(result).toEqual({ ok: true, last4: VALID_KEY.slice(-4) });
    const arg = prisma.classroomApiKey.upsert.mock.calls[0][0];
    expect(arg.create.classroomId).toBe("cls1");
    expect(arg.create.ciphertext).not.toContain(VALID_KEY);
  });
});

describe("removeClassroomOpenRouterKey", () => {
  it("is instructor-gated", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroomMembership.findUnique.mockResolvedValue({ role: "student" });
    const result = await removeClassroomOpenRouterKey("cls1");
    expect(result.ok).toBe(false);
    expect(prisma.classroomApiKey.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes the classroom's row for an instructor", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroomMembership.findUnique.mockResolvedValue({ role: "instructor" });
    prisma.classroomApiKey.deleteMany.mockResolvedValue({ count: 1 });
    const result = await removeClassroomOpenRouterKey("cls1");
    expect(result).toEqual({ ok: true });
    expect(prisma.classroomApiKey.deleteMany).toHaveBeenCalledWith({
      where: { classroomId: "cls1", provider: "openrouter" },
    });
  });
});

describe("setGraderKeySelection", () => {
  it("rejects malformed selections (no write)", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    for (const bad of ["", "openai", "classroom", 7 as unknown as string]) {
      const result = await setGraderKeySelection(bad);
      expect(result.ok).toBe(false);
    }
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a classroom selection the caller is not a member of", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroomMembership.findUnique.mockResolvedValue(null);
    const result = await setGraderKeySelection("classroom:cls1");
    expect(result.ok).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("stores valid selections", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroomMembership.findUnique.mockResolvedValue({ id: "m1" });
    prisma.user.update.mockResolvedValue({});
    for (const value of ["server", "user", "classroom:cls1"]) {
      expect((await setGraderKeySelection(value)).ok).toBe(true);
    }
    expect(prisma.user.update).toHaveBeenLastCalledWith({
      where: { id: "u1" },
      data: { graderKeyPref: "classroom:cls1" },
    });
  });
});
