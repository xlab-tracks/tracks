"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  encryptApiKey,
  isValidOpenRouterKeyShape,
} from "@/lib/grader/key-crypto";
import { keyAad, keyStorageSecret } from "@/lib/grader/user-key";

const PROVIDER = "openrouter";

export type SaveKeyResult =
  | { ok: true; last4: string }
  | { ok: false; error: string };

/**
 * Stores the caller's own OpenRouter API key for the grader (reachable by
 * direct POST — re-checks auth; the key is validated live against OpenRouter,
 * then persisted AES-GCM-encrypted). The plaintext key is never logged,
 * stored, or returned; the response carries only the last four characters.
 */
export async function saveOpenRouterKey(rawKey: string): Promise<SaveKeyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to save an API key." };
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
  const secret = keyStorageSecret();
  if (!secret) {
    return { ok: false, error: "Key storage is not configured on this server." };
  }

  // Verify the key against OpenRouter before storing it, so a typo'd or
  // revoked key fails here rather than at grading time.
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

  const last4 = key.slice(-4);
  const ciphertext = await encryptApiKey(key, secret, keyAad(user.id));
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
