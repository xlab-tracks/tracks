// AES-256-GCM for user-supplied API keys, via WebCrypto so the same code runs
// on Cloudflare Workers and Node. Pure module: the encryption secret is a
// parameter (env resolution lives in user-key.ts), which keeps it unit-testable.
// Ciphertext format: "v1:" + base64(iv) + ":" + base64(ciphertext+tag) — the
// version prefix leaves room for secret/algorithm rotation. The caller's `aad`
// (userId:provider) is bound as AES-GCM additionalData, so a ciphertext moved
// to another row fails authentication instead of decrypting there.

const VERSION = "v1";
const IV_BYTES = 12;

// The .env.example placeholder; treated as unset so the documented
// copy-.env.example setup can never silently encrypt under a public secret.
const PLACEHOLDER_SECRET = "change_me_to_a_random_32_char_min_secret";

/**
 * Whether a value is usable as the encryption secret: present, 32+ chars
 * (the derived AES key is only as strong as this secret), and not the
 * committed placeholder. Callers treat unusable exactly like unset.
 */
export function isUsableEncryptionSecret(
  secret: string | null | undefined,
): secret is string {
  return (
    typeof secret === "string" &&
    secret.length >= 32 &&
    secret !== PLACEHOLDER_SECRET
  );
}

// OpenRouter keys look like sk-or-v1-<64 hex>; accept a generous superset so
// format changes don't lock users out, while still rejecting obvious paste
// accidents (whole curl commands, other providers' keys).
export function isValidOpenRouterKeyShape(key: string): boolean {
  return /^sk-or-[A-Za-z0-9_-]{8,250}$/.test(key);
}

async function importAesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptApiKey(
  plaintext: string,
  secret: string,
  aad: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await importAesKey(secret);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(aad) },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );
  return `${VERSION}:${toBase64(iv)}:${toBase64(ciphertext)}`;
}

/**
 * Decrypts a stored key. Returns null on any failure — unknown version,
 * malformed base64, tampered ciphertext, a rotated secret, or an `aad`
 * mismatch (ciphertext copied to another row) — so callers treat an
 * undecryptable key exactly like an absent one.
 */
export async function decryptApiKey(
  stored: string,
  secret: string,
  aad: string,
): Promise<string | null> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  try {
    const iv = fromBase64(parts[1]);
    const ciphertext = fromBase64(parts[2]);
    if (iv.length !== IV_BYTES) return null;
    const key = await importAesKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(aad) },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
