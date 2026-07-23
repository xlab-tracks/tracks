import { describe, expect, it } from "vitest";
import {
  decryptApiKey,
  encryptApiKey,
  isUsableEncryptionSecret,
  isValidOpenRouterKeyShape,
} from "./key-crypto";

const SECRET = "test-secret-with-at-least-32-characters!";
const KEY = "sk-or-v1-" + "ab12".repeat(16);
const AAD = "user_123:openrouter";

describe("isValidOpenRouterKeyShape", () => {
  it("accepts a realistic OpenRouter key", () => {
    expect(isValidOpenRouterKeyShape(KEY)).toBe(true);
  });

  it("rejects other providers, prose, and embedded whitespace", () => {
    expect(isValidOpenRouterKeyShape("sk-ant-api03-xxxx")).toBe(false);
    expect(isValidOpenRouterKeyShape("my key is sk-or-v1-abc")).toBe(false);
    expect(isValidOpenRouterKeyShape("sk-or-v1-abc def")).toBe(false);
    expect(isValidOpenRouterKeyShape("")).toBe(false);
    expect(isValidOpenRouterKeyShape("sk-or-")).toBe(false);
  });
});

describe("isUsableEncryptionSecret", () => {
  it("accepts a 32+ char non-placeholder secret", () => {
    expect(isUsableEncryptionSecret(SECRET)).toBe(true);
  });

  it("rejects unset, short, and placeholder secrets", () => {
    expect(isUsableEncryptionSecret(undefined)).toBe(false);
    expect(isUsableEncryptionSecret(null)).toBe(false);
    expect(isUsableEncryptionSecret("")).toBe(false);
    expect(isUsableEncryptionSecret("too-short")).toBe(false);
    expect(
      isUsableEncryptionSecret("change_me_to_a_random_32_char_min_secret"),
    ).toBe(false);
  });
});

describe("encryptApiKey / decryptApiKey", () => {
  it("round-trips a key", async () => {
    const stored = await encryptApiKey(KEY, SECRET, AAD);
    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored).not.toContain(KEY);
    await expect(decryptApiKey(stored, SECRET, AAD)).resolves.toBe(KEY);
  });

  it("uses a fresh IV per encryption", async () => {
    const a = await encryptApiKey(KEY, SECRET, AAD);
    const b = await encryptApiKey(KEY, SECRET, AAD);
    expect(a).not.toBe(b);
  });

  it("returns null for a wrong secret", async () => {
    const stored = await encryptApiKey(KEY, SECRET, AAD);
    await expect(
      decryptApiKey(stored, "a-different-secret-of-enough-length", AAD),
    ).resolves.toBeNull();
  });

  it("returns null when the aad does not match (ciphertext moved rows)", async () => {
    const stored = await encryptApiKey(KEY, SECRET, AAD);
    await expect(
      decryptApiKey(stored, SECRET, "user_456:openrouter"),
    ).resolves.toBeNull();
  });

  it("returns null for tampered ciphertext", async () => {
    const stored = await encryptApiKey(KEY, SECRET, AAD);
    const parts = stored.split(":");
    const bytes = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));
    bytes[0] ^= 0xff;
    const tampered = `${parts[0]}:${parts[1]}:${btoa(String.fromCharCode(...bytes))}`;
    await expect(decryptApiKey(tampered, SECRET, AAD)).resolves.toBeNull();
  });

  it("returns null for malformed or unknown-version input", async () => {
    await expect(decryptApiKey("", SECRET, AAD)).resolves.toBeNull();
    await expect(decryptApiKey("v1:only-two", SECRET, AAD)).resolves.toBeNull();
    await expect(decryptApiKey("v2:aaaa:bbbb", SECRET, AAD)).resolves.toBeNull();
    await expect(decryptApiKey("v1:!!!:###", SECRET, AAD)).resolves.toBeNull();
  });
});
