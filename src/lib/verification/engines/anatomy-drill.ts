/**
 * Pure grading engine for the Anatomy Drill, ported from the standalone HTML's
 * `resolveDrop` / `handleDrop` logic (public/verification/anatomy-drill.html).
 *
 * The widget owns UI state; this module owns the two pure decisions the source
 * makes: which feedback tier a drop earns (`resolveDrop`, in the data module),
 * and how a drop advances the per-card attempt/result state (`applyDrop`).
 */
import {
  resolveDrop,
  type Card,
  type DropResult,
} from "@/lib/verification/data/anatomy-drill";

export { resolveDrop };
export type { DropResult };

/** Per-card outcome recorded for the summary. */
export type CardResult = "clean" | "near" | "miss";

/** Feedback tier shown after a drop (mirrors the source `fb.kind`). */
export type FeedbackKind =
  | "good" // clean on the first attempt
  | "good-after" // clean, but after a wrong attempt (records as a miss)
  | "near" // defensible near-tag, auto-placed
  | "retry" // wrong, first attempt — try again
  | "reveal"; // wrong, second attempt — filed for you, answer shown

export interface DropOutcome {
  /** Feedback tier for this drop. */
  kind: FeedbackKind;
  /** Feedback body (undefined only for clean, which uses card.ok in the widget). */
  msg: string;
  /** New attempts counter after this drop. */
  attempts: number;
  /** The result to record for this card, or null while still retrying. */
  result: CardResult | null;
  /** Whether the card was auto-filed into a bin (near / reveal). */
  autoPlaced: boolean;
  /** Whether the drill should advance past this card (retry keeps the same card). */
  resolved: boolean;
}

/**
 * Advance one card's state given a drop into `binN`, faithfully reproducing the
 * source `handleDrop`. `attempts` is the count of prior wrong attempts on this
 * card (0 or 1 in normal play).
 *
 * Notes-not-bugs preserved from the original:
 *  - a clean or near tag AFTER a prior wrong attempt records as a "miss";
 *  - a second wrong attempt auto-files the card and reveals the answer;
 *  - the first wrong attempt is a "retry" that does not advance the card.
 */
export function applyDrop(
  card: Card,
  binN: number,
  attempts: number,
): DropOutcome {
  const r = resolveDrop(card, binN);

  if (r.kind === "clean") {
    return {
      kind: attempts === 0 ? "good" : "good-after",
      msg: card.ok,
      attempts,
      result: attempts === 0 ? "clean" : "miss",
      autoPlaced: false,
      resolved: true,
    };
  }

  if (r.kind === "near") {
    return {
      kind: "near",
      msg: r.msg ?? "",
      attempts,
      result: attempts === 0 ? "near" : "miss",
      autoPlaced: true,
      resolved: true,
    };
  }

  // bad
  const nextAttempts = attempts + 1;
  if (nextAttempts >= 2) {
    return {
      kind: "reveal",
      msg: r.msg ?? "",
      attempts: nextAttempts,
      result: "miss",
      autoPlaced: true,
      resolved: true,
    };
  }
  return {
    kind: "retry",
    msg: r.msg ?? "",
    attempts: nextAttempts,
    result: null,
    autoPlaced: false,
    resolved: false,
  };
}
