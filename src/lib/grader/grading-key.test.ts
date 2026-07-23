import { afterEach, describe, expect, it, vi } from "vitest";

// Locks grader key selection end to end (minus the DB): the AAD namespace
// split between user and classroom ciphertexts, the preference-resolution
// rules (stored preference wins while available; automatic never silently
// picks among several classroom keys), and the DB-backed lookups — option
// assembly probes real decryption, and a classroom key decrypts only for a
// member of that classroom.

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userApiKey: { findUnique: vi.fn() },
    classroomApiKey: { findUnique: vi.fn() },
    classroomMembership: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ prisma }));

import { encryptApiKey } from "./key-crypto";
import { keyAad } from "./user-key";
import {
  classroomIdOfSelection,
  classroomKeyAad,
  getClassroomKeyStatus,
  getClassroomOpenRouterKey,
  getGraderKeyView,
  isGraderKeySelection,
  resolveGraderKeySelection,
} from "./grading-key";

const SECRET = "test-secret-with-at-least-32-characters!";
const ROTATED_SECRET = "a-different-secret-also-32-characters!!!";
const KEY = "sk-or-v1-" + "ab12".repeat(16);

function configureSecret(secret = SECRET) {
  vi.stubEnv("API_KEY_ENCRYPTION_SECRET", secret);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("classroomKeyAad", () => {
  it("is disjoint from the user-key AAD namespace", () => {
    // A classroom ciphertext moved onto a user row (or vice versa) must fail
    // AES-GCM authentication, which the AAD prefix guarantees.
    expect(classroomKeyAad("x")).toBe("classroom:x:openrouter");
    expect(classroomKeyAad("x")).not.toBe(keyAad("x"));
    expect(classroomKeyAad("x").startsWith("classroom:")).toBe(true);
  });
});

describe("isGraderKeySelection / classroomIdOfSelection", () => {
  it("accepts the three selection shapes and nothing else", () => {
    expect(isGraderKeySelection("server")).toBe(true);
    expect(isGraderKeySelection("user")).toBe(true);
    expect(isGraderKeySelection("classroom:abc")).toBe(true);
    expect(isGraderKeySelection("openai")).toBe(false);
    expect(isGraderKeySelection("")).toBe(false);
  });

  it("extracts the classroom id only from classroom selections", () => {
    expect(classroomIdOfSelection("classroom:abc")).toBe("abc");
    expect(classroomIdOfSelection("server")).toBeNull();
    expect(classroomIdOfSelection("user")).toBeNull();
  });
});

describe("resolveGraderKeySelection", () => {
  it("honors a stored preference that is still available", () => {
    expect(resolveGraderKeySelection("server", "active", ["c1"])).toBe("server");
    expect(resolveGraderKeySelection("user", "active", ["c1"])).toBe("user");
    expect(resolveGraderKeySelection("classroom:c1", "active", ["c1", "c2"])).toBe(
      "classroom:c1",
    );
  });

  it("keeps a needs-reentry own key selected rather than silently falling back", () => {
    // Grading then errors with a fix-it message — never a surprise bill.
    expect(resolveGraderKeySelection("user", "needs-reentry", [])).toBe("user");
    expect(resolveGraderKeySelection(null, "needs-reentry", [])).toBe("user");
  });

  it("degrades a stale preference to the automatic choice", () => {
    // Left the classroom / instructor removed the key.
    expect(resolveGraderKeySelection("classroom:gone", "active", [])).toBe("user");
    expect(resolveGraderKeySelection("classroom:gone", "none", ["c1"])).toBe(
      "classroom:c1",
    );
    // Removed their own key after preferring it.
    expect(resolveGraderKeySelection("user", "none", [])).toBe("server");
  });

  it("automatic: own key, else a sole classroom key, else server", () => {
    expect(resolveGraderKeySelection(null, "active", ["c1"])).toBe("user");
    expect(resolveGraderKeySelection(null, "none", ["c1"])).toBe("classroom:c1");
    expect(resolveGraderKeySelection(null, "none", [])).toBe("server");
  });

  it("never auto-picks among several classroom keys", () => {
    expect(resolveGraderKeySelection(null, "none", ["c1", "c2"])).toBe("server");
  });
});

// Helpers for the DB-backed tests: real ciphertexts under the right AADs so
// the decryption probes exercise the actual crypto, not a stub.
async function classroomKeyRow(classroomId: string, secret = SECRET) {
  return {
    ciphertext: await encryptApiKey(KEY, secret, classroomKeyAad(classroomId)),
    last4: KEY.slice(-4),
  };
}

function membershipRow(
  id: string,
  name: string,
  apiKeys: { ciphertext: string; last4: string }[],
) {
  return { classroom: { id, name, apiKeys } };
}

describe("getGraderKeyView", () => {
  it("returns null when key storage is unconfigured (no DB reads)", async () => {
    expect(await getGraderKeyView("u1")).toBeNull();
    expect(prisma.classroomMembership.findMany).not.toHaveBeenCalled();
  });

  it("assembles personal + classroom options and resolves the selection", async () => {
    configureSecret();
    prisma.user.findUnique.mockResolvedValue({ graderKeyPref: null });
    prisma.userApiKey.findUnique.mockResolvedValue(null);
    prisma.classroomMembership.findMany.mockResolvedValue([
      membershipRow("c1", "AI Safety 101", [await classroomKeyRow("c1")]),
    ]);
    const view = await getGraderKeyView("u1");
    expect(view).toEqual({
      personal: { state: "none", last4: null },
      classrooms: [
        {
          classroomId: "c1",
          classroomName: "AI Safety 101",
          last4: KEY.slice(-4),
          usable: true,
        },
      ],
      // Sole classroom key + no own key + no preference → automatic.
      selected: "classroom:c1",
    });
  });

  it("marks a classroom key encrypted under a rotated secret unusable, but keeps it listed and selectable", async () => {
    configureSecret();
    prisma.user.findUnique.mockResolvedValue({ graderKeyPref: "classroom:c1" });
    prisma.userApiKey.findUnique.mockResolvedValue(null);
    prisma.classroomMembership.findMany.mockResolvedValue([
      membershipRow("c1", "AI Safety 101", [
        await classroomKeyRow("c1", ROTATED_SECRET),
      ]),
    ]);
    const view = await getGraderKeyView("u1");
    expect(view?.classrooms[0]?.usable).toBe(false);
    // Still the selection: grading errors with a fix-it message instead of
    // silently billing another key someone didn't agree to.
    expect(view?.selected).toBe("classroom:c1");
  });

  it("defaults to the server key when several classroom keys exist and no preference is stored", async () => {
    configureSecret();
    prisma.user.findUnique.mockResolvedValue({ graderKeyPref: null });
    prisma.userApiKey.findUnique.mockResolvedValue(null);
    prisma.classroomMembership.findMany.mockResolvedValue([
      membershipRow("c1", "First", [await classroomKeyRow("c1")]),
      membershipRow("c2", "Second", [await classroomKeyRow("c2")]),
    ]);
    const view = await getGraderKeyView("u1");
    expect(view?.classrooms.map((c) => c.classroomId)).toEqual(["c1", "c2"]);
    expect(view?.selected).toBe("server");
  });

  it("honors a stored classroom preference over an own key", async () => {
    configureSecret();
    prisma.user.findUnique.mockResolvedValue({ graderKeyPref: "classroom:c2" });
    prisma.userApiKey.findUnique.mockResolvedValue({
      ciphertext: await encryptApiKey(KEY, SECRET, keyAad("u1")),
      last4: KEY.slice(-4),
    });
    prisma.classroomMembership.findMany.mockResolvedValue([
      membershipRow("c1", "First", [await classroomKeyRow("c1")]),
      membershipRow("c2", "Second", [await classroomKeyRow("c2")]),
    ]);
    const view = await getGraderKeyView("u1");
    expect(view?.personal).toEqual({ state: "active", last4: KEY.slice(-4) });
    expect(view?.selected).toBe("classroom:c2");
  });
});

describe("getClassroomOpenRouterKey", () => {
  it("returns null when key storage is unconfigured (no DB reads)", async () => {
    expect(await getClassroomOpenRouterKey("u1", "c1")).toBeNull();
    expect(prisma.classroomMembership.findUnique).not.toHaveBeenCalled();
  });

  it("returns null for a non-member — a forged classroom id never decrypts", async () => {
    configureSecret();
    prisma.classroomMembership.findUnique.mockResolvedValue(null);
    expect(await getClassroomOpenRouterKey("u1", "c1")).toBeNull();
    expect(prisma.classroomMembership.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { classroomId_userId: { classroomId: "c1", userId: "u1" } },
      }),
    );
  });

  it("decrypts the key for a member", async () => {
    configureSecret();
    prisma.classroomMembership.findUnique.mockResolvedValue({
      classroom: { apiKeys: [await classroomKeyRow("c1")] },
    });
    expect(await getClassroomOpenRouterKey("u1", "c1")).toBe(KEY);
  });

  it("returns null for a ciphertext bound to another classroom (AAD mismatch)", async () => {
    configureSecret();
    // Simulates a ciphertext copied between rows: encrypted for c-other,
    // served from c1 — AES-GCM authentication must fail, not decrypt.
    prisma.classroomMembership.findUnique.mockResolvedValue({
      classroom: { apiKeys: [await classroomKeyRow("c-other")] },
    });
    expect(await getClassroomOpenRouterKey("u1", "c1")).toBeNull();
  });
});

describe("getClassroomKeyStatus", () => {
  it("returns null when key storage is unconfigured", async () => {
    expect(await getClassroomKeyStatus("c1")).toBeNull();
  });

  it("reports none / active / needs-reentry", async () => {
    configureSecret();
    prisma.classroomApiKey.findUnique.mockResolvedValue(null);
    expect(await getClassroomKeyStatus("c1")).toEqual({
      state: "none",
      last4: null,
    });

    prisma.classroomApiKey.findUnique.mockResolvedValue(
      await classroomKeyRow("c1"),
    );
    expect(await getClassroomKeyStatus("c1")).toEqual({
      state: "active",
      last4: KEY.slice(-4),
    });

    // Encrypted under a previous API_KEY_ENCRYPTION_SECRET.
    prisma.classroomApiKey.findUnique.mockResolvedValue(
      await classroomKeyRow("c1", ROTATED_SECRET),
    );
    expect(await getClassroomKeyStatus("c1")).toEqual({
      state: "needs-reentry",
      last4: KEY.slice(-4),
    });
  });
});
