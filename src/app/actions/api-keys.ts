"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  encryptApiKey,
  isValidOpenRouterKeyShape,
} from "@/lib/grader/key-crypto";
import { keyAad, keyStorageSecret } from "@/lib/grader/user-key";
import {
  classroomKeyAad,
  isGraderKeySelection,
  classroomIdOfSelection,
} from "@/lib/grader/grading-key";

const PROVIDER = "openrouter";

export type SaveKeyResult =
  | { ok: true; last4: string }
  | { ok: false; error: string };

type KeyCheck = { ok: true; key: string } | { ok: false; error: string };

// Shared shape + live-verification gate for every stored OpenRouter key
// (user or classroom): a typo'd or revoked key fails here rather than at
// grading time. The plaintext key is never logged, stored, or returned.
async function checkOpenRouterKey(rawKey: string): Promise<KeyCheck> {
  if (typeof rawKey !== "string") {
    return { ok: false, error: "Invalid key." };
  }
  const key = rawKey.trim();
  if (!isValidOpenRouterKeyShape(key)) {
    return {
      ok: false,
      error: "That doesn't look like an OpenRouter key (they start with sk-or-).",
    };
  }
  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach OpenRouter to verify the key. Try again.",
    };
  }
  if (response.status === 401 || response.status === 403) {
    return { ok: false, error: "OpenRouter rejected that key." };
  }
  if (!response.ok) {
    return {
      ok: false,
      error: `OpenRouter could not verify the key (${response.status}). Try again.`,
    };
  }
  return { ok: true, key };
}

/**
 * Stores the caller's own OpenRouter API key for the grader (reachable by
 * direct POST — re-checks auth; the key is validated live against OpenRouter,
 * then persisted AES-GCM-encrypted). The response carries only the last four
 * characters.
 */
export async function saveOpenRouterKey(rawKey: string): Promise<SaveKeyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to save an API key." };
  const secret = keyStorageSecret();
  if (!secret) {
    return { ok: false, error: "Key storage is not configured on this server." };
  }
  const checked = await checkOpenRouterKey(rawKey);
  if (!checked.ok) return checked;

  const last4 = checked.key.slice(-4);
  const ciphertext = await encryptApiKey(checked.key, secret, keyAad(user.id));
  await prisma.userApiKey.upsert({
    where: { userId_provider: { userId: user.id, provider: PROVIDER } },
    create: { userId: user.id, provider: PROVIDER, ciphertext, last4 },
    update: { ciphertext, last4 },
  });
  return { ok: true, last4 };
}

export async function removeOpenRouterKey(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };
  await prisma.userApiKey.deleteMany({
    where: { userId: user.id, provider: PROVIDER },
  });
  return { ok: true };
}

async function isInstructor(
  userId: string,
  classroomId: string,
): Promise<boolean> {
  const membership = await prisma.classroomMembership.findUnique({
    where: { classroomId_userId: { classroomId, userId } },
    select: { role: true },
  });
  return membership?.role === "instructor";
}

/**
 * Stores a classroom's OpenRouter key so grading can bill the classroom for
 * any of its members (reachable by direct POST — re-checks auth and requires
 * the caller to be an instructor of that classroom). Same verification and
 * encryption path as personal keys; the AAD binds the ciphertext to the
 * classroom row.
 */
export async function saveClassroomOpenRouterKey(
  classroomId: string,
  rawKey: string,
): Promise<SaveKeyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to save an API key." };
  if (typeof classroomId !== "string" || !classroomId) {
    return { ok: false, error: "Invalid classroom." };
  }
  if (!(await isInstructor(user.id, classroomId))) {
    return { ok: false, error: "Only instructors can manage the classroom key." };
  }
  const secret = keyStorageSecret();
  if (!secret) {
    return { ok: false, error: "Key storage is not configured on this server." };
  }
  const checked = await checkOpenRouterKey(rawKey);
  if (!checked.ok) return checked;

  const last4 = checked.key.slice(-4);
  const ciphertext = await encryptApiKey(
    checked.key,
    secret,
    classroomKeyAad(classroomId),
  );
  await prisma.classroomApiKey.upsert({
    where: { classroomId_provider: { classroomId, provider: PROVIDER } },
    create: { classroomId, provider: PROVIDER, ciphertext, last4 },
    update: { ciphertext, last4 },
  });
  return { ok: true, last4 };
}

export async function removeClassroomOpenRouterKey(
  classroomId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };
  if (typeof classroomId !== "string" || !classroomId) {
    return { ok: false, error: "Invalid classroom." };
  }
  if (!(await isInstructor(user.id, classroomId))) {
    return { ok: false, error: "Only instructors can manage the classroom key." };
  }
  await prisma.classroomApiKey.deleteMany({
    where: { classroomId, provider: PROVIDER },
  });
  return { ok: true };
}

/**
 * Persists which key the caller's grading calls should bill: "server",
 * "user", or "classroom:<classroomId>" (reachable by direct POST — a
 * classroom selection requires membership, so a forged id can't be stored;
 * grading re-validates regardless, so a later-stale value degrades to the
 * automatic choice rather than someone else's key).
 */
export async function setGraderKeySelection(
  selection: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };
  if (typeof selection !== "string" || !isGraderKeySelection(selection)) {
    return { ok: false, error: "Invalid key selection." };
  }
  const classroomId = classroomIdOfSelection(selection);
  if (classroomId != null) {
    const membership = await prisma.classroomMembership.findUnique({
      where: { classroomId_userId: { classroomId, userId: user.id } },
      select: { id: true },
    });
    if (!membership) {
      return { ok: false, error: "Invalid key selection." };
    }
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { graderKeyPref: selection },
  });
  return { ok: true };
}
