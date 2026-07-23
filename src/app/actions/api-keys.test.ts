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
  },
  getCurrentUser: vi.fn(),
  keyStorageSecret: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/grader/user-key", () => ({
  keyStorageSecret,
  keyAad: (userId: string) => `${userId}:openrouter`,
}));

import { removeOpenRouterKey, saveOpenRouterKey } from "./api-keys";

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
