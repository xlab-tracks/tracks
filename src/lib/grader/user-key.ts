import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { decryptApiKey, isUsableEncryptionSecret } from "./key-crypto";

// Server-side access to a user's stored OpenRouter key. Decrypted key
// material stays inside this module's callers (the grading action) — it is
// never returned to the client; the UI only ever sees the status state +
// last4.

const PROVIDER = "openrouter";

/** AES-GCM additionalData binding a ciphertext to its owning row. */
export function keyAad(userId: string): string {
  return `${userId}:${PROVIDER}`;
}

export function keyStorageSecret(): string | null {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  return isUsableEncryptionSecret(secret) ? secret : null;
}

export interface OpenRouterKeyStatus {
  /**
   * none — no stored key; active — stored and decryptable;
   * needs-reentry — a row exists but no longer decrypts (rotated
   * API_KEY_ENCRYPTION_SECRET): the user must replace or remove it.
   */
  state: "none" | "active" | "needs-reentry";
  last4: string | null;
}

/**
 * Display status for the signed-in user's stored key, or null when key
 * storage is unconfigured (the feature is hidden entirely — nothing can be
 * saved or decrypted). Probes decryption so the UI never claims a key is in
 * use that grading cannot actually read. cache()-wrapped so the many
 * <Exercise/> instances on one lesson page share a single query.
 */
export const getOpenRouterKeyStatus = cache(
  async (userId: string): Promise<OpenRouterKeyStatus | null> => {
    const secret = keyStorageSecret();
    if (!secret) return null;
    const row = await prisma.userApiKey.findUnique({
      where: { userId_provider: { userId, provider: PROVIDER } },
      select: { ciphertext: true, last4: true },
    });
    if (!row) return { state: "none", last4: null };
    const decrypted = await decryptApiKey(row.ciphertext, secret, keyAad(userId));
    return decrypted != null
      ? { state: "active", last4: row.last4 }
      : { state: "needs-reentry", last4: row.last4 };
  },
);

/**
 * The user's decrypted OpenRouter key, or null when absent, storage is
 * unconfigured, or the row is undecryptable. Callers wanting to distinguish
 * "absent" from "needs re-entry" use getOpenRouterKeyStatus.
 */
export async function getUserOpenRouterKey(
  userId: string,
): Promise<string | null> {
  const secret = keyStorageSecret();
  if (!secret) return null;
  const row = await prisma.userApiKey.findUnique({
    where: { userId_provider: { userId, provider: PROVIDER } },
    select: { ciphertext: true },
  });
  if (!row) return null;
  return decryptApiKey(row.ciphertext, secret, keyAad(userId));
}
