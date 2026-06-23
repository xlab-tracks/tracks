"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface ClassroomActionState {
  error?: string;
}

// No ambiguous characters (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateJoinCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
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
  const trackId = String(formData.get("trackId") ?? "").trim() || null;

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
    } catch {
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
    } catch {
      if (attempt === 4) throw new Error("Could not regenerate code");
    }
  }
  revalidatePath(`/classrooms/${classroomId}`);
}
