import { prisma } from "@/lib/db";

export async function getCapstone(userId: string, trackId: string) {
  return prisma.capstoneProject.findUnique({
    where: { userId_trackId: { userId, trackId } },
    include: { entries: true },
  });
}
