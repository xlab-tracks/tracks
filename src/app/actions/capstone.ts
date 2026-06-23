"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function ensureCapstone(userId: string, trackId: string) {
  return prisma.capstoneProject.upsert({
    where: { userId_trackId: { userId, trackId } },
    create: { userId, trackId },
    update: {},
  });
}

export async function setCapstoneTopic(
  trackId: string,
  topic: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  await prisma.capstoneProject.upsert({
    where: { userId_trackId: { userId: user.id, trackId } },
    create: { userId: user.id, trackId, topic, status: "in_progress" },
    update: { topic, status: "in_progress" },
  });
  revalidatePath("/capstone");
}

export async function saveCapstoneEntry(
  trackId: string,
  moduleId: string,
  values: Record<string, string>,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const project = await ensureCapstone(user.id, trackId);
  await prisma.capstoneEntry.upsert({
    where: { capstoneId_moduleId: { capstoneId: project.id, moduleId } },
    create: { capstoneId: project.id, moduleId, contentText: values.text ?? "" },
    update: { contentText: values.text ?? "" },
  });
}

export async function submitCapstoneEntry(
  trackId: string,
  moduleId: string,
  values: Record<string, string>,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const project = await ensureCapstone(user.id, trackId);
  await prisma.capstoneEntry.upsert({
    where: { capstoneId_moduleId: { capstoneId: project.id, moduleId } },
    create: {
      capstoneId: project.id,
      moduleId,
      contentText: values.text ?? "",
      status: "submitted",
    },
    update: { contentText: values.text ?? "", status: "submitted" },
  });
  await prisma.capstoneProject.update({
    where: { id: project.id },
    data: { status: "submitted" },
  });
  revalidatePath("/capstone");
}
