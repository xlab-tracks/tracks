import type { LengthClass } from "./prompts";

// Word-count thresholds for the three grader configurations. Boundaries:
// short < 100 words; medium 100–400; long > 400.
export const SHORT_MAX_WORDS = 99;
export const MEDIUM_MAX_WORDS = 400;

export function countWords(text: string): number {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  return words.length;
}

export function classifyLength(text: string): LengthClass {
  const words = countWords(text);
  if (words <= SHORT_MAX_WORDS) return "short";
  if (words <= MEDIUM_MAX_WORDS) return "medium";
  return "long";
}

const DEFAULT_MODEL = "tencent/hy3:free";

// Grading billed to a user's own OpenRouter key defaults to a paid, stronger
// model — their key, their spend; the server-wide key stays on the free tier.
const DEFAULT_USER_KEY_MODEL = "moonshotai/kimi-k3";

/** Whose OpenRouter key pays for the grading call. */
export type GraderKeySource = "server" | "user";

/**
 * The OpenRouter model slug for a length class. With the server key, each
 * class can be pointed elsewhere via env (OPENROUTER_MODEL_SHORT / _MEDIUM /
 * _LONG), with OPENROUTER_MODEL as the shared fallback. With a user-supplied
 * key, one slug covers all classes (OPENROUTER_MODEL_USER, default Kimi K3).
 */
export function modelFor(
  lengthClass: LengthClass,
  keySource: GraderKeySource = "server",
): string {
  if (keySource === "user") {
    return process.env.OPENROUTER_MODEL_USER || DEFAULT_USER_KEY_MODEL;
  }
  const perClass = {
    short: process.env.OPENROUTER_MODEL_SHORT,
    medium: process.env.OPENROUTER_MODEL_MEDIUM,
    long: process.env.OPENROUTER_MODEL_LONG,
  }[lengthClass];
  return perClass || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}
