import { afterEach, describe, expect, it, vi } from "vitest";

// The classroom actions are the only mutation path with membership-scoped
// authorization; this pins the invariants that keep a student from acting as
// an instructor and an instructor from removing a co-instructor.

// vi.mock factories are hoisted, so build the mocks with vi.hoisted.
const { prisma, getCurrentUser } = vi.hoisted(() => ({
  prisma: {
    classroomMembership: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    classroom: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  },
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import {
  createClassroom,
  joinClassroom,
  regenerateJoinCode,
  removeMember,
} from "./classrooms";

afterEach(() => {
  vi.clearAllMocks();
});

describe("removeMember", () => {
  it("refuses non-instructors", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroomMembership.findUnique.mockResolvedValue({ role: "student" });
    await expect(removeMember("c1", "u2")).rejects.toThrow("Forbidden");
    expect(prisma.classroomMembership.deleteMany).not.toHaveBeenCalled();
  });

  it("only ever deletes student rows (never a co-instructor)", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroomMembership.findUnique.mockResolvedValue({ role: "instructor" });
    prisma.classroomMembership.deleteMany.mockResolvedValue({ count: 1 });
    await removeMember("c1", "u2");
    expect(prisma.classroomMembership.deleteMany).toHaveBeenCalledWith({
      where: { classroomId: "c1", userId: "u2", role: "student" },
    });
  });

  it("rejects signed-out callers before touching the DB", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(removeMember("c1", "u2")).rejects.toThrow("Not signed in");
    expect(prisma.classroomMembership.findUnique).not.toHaveBeenCalled();
  });
});

describe("createClassroom", () => {
  const form = (entries: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(entries)) fd.set(k, v);
    return fd;
  };

  it("stores a real trackId and nulls a bogus one", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroom.create.mockResolvedValue({ id: "c1" });

    await expect(
      createClassroom({}, form({ name: "A", trackId: "does-not-exist" })),
    ).rejects.toThrow("REDIRECT:/classrooms/c1");
    expect(prisma.classroom.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ trackId: null }) }),
    );

    await expect(
      createClassroom({}, form({ name: "A", trackId: "verification" })),
    ).rejects.toThrow("REDIRECT:/classrooms/c1");
    expect(prisma.classroom.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ trackId: "verification" }),
      }),
    );
  });

  it("requires a name", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    const result = await createClassroom({}, form({ name: "  " }));
    expect(result.error).toBeTruthy();
    expect(prisma.classroom.create).not.toHaveBeenCalled();
  });
});

describe("joinClassroom", () => {
  const form = (code: string) => {
    const fd = new FormData();
    fd.set("code", code);
    return fd;
  };

  it("rejects an unknown code without creating a membership", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroom.findUnique.mockResolvedValue(null);
    const result = await joinClassroom({}, form("zzzzzz"));
    expect(result.error).toBeTruthy();
    expect(prisma.classroomMembership.upsert).not.toHaveBeenCalled();
  });

  it("enrolls as a student on a valid code", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroom.findUnique.mockResolvedValue({ id: "c9" });
    prisma.classroomMembership.upsert.mockResolvedValue({});
    await expect(joinClassroom({}, form("ABC234"))).rejects.toThrow(
      "REDIRECT:/classrooms/c9",
    );
    expect(prisma.classroomMembership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { classroomId: "c9", userId: "u1", role: "student" },
      }),
    );
  });
});

describe("regenerateJoinCode", () => {
  it("requires instructor role", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroomMembership.findUnique.mockResolvedValue({ role: "student" });
    await expect(regenerateJoinCode("c1")).rejects.toThrow("Forbidden");
    expect(prisma.classroom.update).not.toHaveBeenCalled();
  });

  it("generates codes from the unambiguous alphabet", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    prisma.classroomMembership.findUnique.mockResolvedValue({ role: "instructor" });
    prisma.classroom.update.mockResolvedValue({});
    await regenerateJoinCode("c1");
    const code = prisma.classroom.update.mock.calls[0][0].data.joinCode as string;
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });
});
