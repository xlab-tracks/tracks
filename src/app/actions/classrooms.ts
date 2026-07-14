"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTrackById } from "@/lib/content";

export interface ClassroomActionState {
  error?: string;
}

// No ambiguous characters (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
// Join codes gate classroom membership (which exposes the roster), so draw
// from a CSPRNG — Math.random's state is recoverable from observed codes.
// Rejection-sample so the 256-value byte space maps uniformly onto the
// 31-char alphabet. (Brute-force enumeration of the ~30-bit space would still
// need request-rate online guessing; a counter-based throttle is future work.)
function generateJoinCode(length = 6): string {
  const max = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let code = "";
  while (code.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const byte of bytes) {
      if (byte >= max) continue;
      code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
      if (code.length === length) break;
    }
  }
  return code;
}

// The retry loops exist only to dodge a joinCode unique collision; retry that,
// but never swallow connection/validation errors.
function isJoinCodeCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function requireInstructor(userId: string, classroomId: string) {
  const membership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId } },
    select: { role: true },
  });
  if (membership?.role !== "instructor") {
    throw new Error("Forbidden");
  }
}

export async function createClassroom(
  _prev: ClassroomActionState,
  formData: FormData,
): Promise<ClassroomActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in first." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Classroom name is required." };
  // Only real track ids may be stored (a bogus one, reachable by direct POST,
  // would make a broken classroom the roster pages can't scope).
  const rawTrackId = String(formData.get("trackId") ?? "").trim() || null;
  const trackId = rawTrackId && getTrackById(rawTrackId) ? rawTrackId : null;

  let newId: string | undefined;
  for (let attempt = 0; attempt < 5 && !newId; attempt++) {
    try {
      const classroom = await prisma.classroom.create({
        data: {
          name,
          trackId,
          createdById: user.id,
          joinCode: generateJoinCode(),
          memberships: { create: { userId: user.id, role: "instructor" } },
        },
        select: { id: true },
      });
      newId = classroom.id;
    } catch (error) {
      if (!isJoinCodeCollision(error)) throw error;
      if (attempt === 4) return { error: "Could not create classroom. Try again." };
    }
  }

  redirect(`/classrooms/${newId}`);
}

export async function joinClassroom(
  _prev: ClassroomActionState,
  formData: FormData,
): Promise<ClassroomActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in first." };

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) return { error: "Enter a join code." };

  const classroom = await prisma.classroom.findUnique({
    where: { joinCode: code },
    select: { id: true },
  });
  if (!classroom) return { error: "That join code isn't valid." };

  await prisma.classroomMembership.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: user.id } },
    create: { classroomId: classroom.id, userId: user.id, role: "student" },
    update: {},
  });

  redirect(`/classrooms/${classroom.id}`);
}

export async function removeMember(
  classroomId: string,
  memberUserId: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  await requireInstructor(user.id, classroomId);
  // Only students can be removed (never instructors).
  await prisma.classroomMembership.deleteMany({
    where: { classroomId, userId: memberUserId, role: "student" },
  });
  revalidatePath(`/classrooms/${classroomId}`);
}

export async function regenerateJoinCode(classroomId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  await requireInstructor(user.id, classroomId);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await prisma.classroom.update({
        where: { id: classroomId },
        data: { joinCode: generateJoinCode() },
      });
      break;
    } catch (error) {
      if (!isJoinCodeCollision(error)) throw error;
      if (attempt === 4) throw new Error("Could not regenerate code");
    }
  }
  revalidatePath(`/classrooms/${classroomId}`);
}
