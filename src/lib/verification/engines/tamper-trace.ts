/**
 * Pure headless probability model for the "Tamper & Trace" Red/Blue exercise.
 *
 * Ported verbatim from the standalone HTML (public/verification/tamper-trace.html,
 * `techChance` / `falsePositiveChance` / `bandFor`, lines ~278–316). All DOM /
 * global reads are threaded in as arguments: the red technique set, the blue
 * layer set, and the three scenario toggles. Nothing here reads the DOM or any
 * module global, so it is unit-testable and reusable by the React widget.
 *
 * Design note carried over from the source: probability and roll are decoupled.
 * `techChance` returns a detection *probability*; the widget rolls dice against
 * it separately. Verification yields confidence, not certainty.
 */

import { MATRIX, DIRECT_WEIGHT, WHISTLE_FLAT, FP_PER_NOISY } from "../data/tamper-trace";
import type { RedTechId, BlueLayerId } from "../data/tamper-trace";

/** The three scenario toggles that reweight the model. */
export interface Scenario {
  /** Nation-state adversary (Red budget +3). */
  state: boolean;
  /** Vendor won't patch physical attacks (interposer near-invisible w/o enclosure). */
  amd: boolean;
  /** Legacy fleet, no root of trust (on-chip layers weakened). */
  legacy: boolean;
}

export const RED_BASE_BUDGET = 8;
export const RED_STATE_BONUS = 3;
export const BLUE_BUDGET = 9;

/** Crosses into challenge-inspection territory. */
export const THRESH = 0.55;

/** Red / Blue budgets given the scenario (state adds +3 to Red). */
export function budgets(scenario: Scenario): { rmax: number; bmax: number } {
  let rmax = RED_BASE_BUDGET;
  if (scenario.state) rmax += RED_STATE_BONUS;
  return { rmax, bmax: BLUE_BUDGET };
}

/**
 * Detection *probability* for a single red technique, given the blue stack and
 * the scenario. Combines: the direct counter (0.6, reweighted by legacy /
 * masking), independent tell-catchers (per-tell weights, reweighted by amd for
 * physical attacks), and the flat whistleblower chance. Capped at 0.95.
 */
export function techChance(
  id: RedTechId,
  redSet: ReadonlySet<RedTechId>,
  blueSet: ReadonlySet<BlueLayerId>,
  scenario: Scenario,
): number {
  const m = MATRIX[id];
  if (!m) return 0;
  const amd = scenario.amd;
  const legacy = scenario.legacy;
  const maskOn = redSet.has("mask");
  let p = 0;

  // direct counter
  if (blueSet.has(m.direct)) {
    let w = DIRECT_WEIGHT;
    if (legacy && (m.direct === "puf" || m.direct === "boot")) w *= 0.4; // legacy guts on-chip layers
    if (id === "meter" && maskOn && !blueSet.has("osint")) w *= 0.5; // masking blunts power sensing
    p += w;
  }

  // tell-catchers
  for (const [layer, w] of Object.entries(m.tells) as [BlueLayerId, number][]) {
    if (blueSet.has(layer)) {
      let ww = w;
      if (id === "interposer" && amd && layer !== "enc") ww *= 0.4; // physical attack: only enclosure really works
      p += ww;
    }
  }

  // whistleblower flat
  if (blueSet.has("whistle")) p += WHISTLE_FLAT;
  return Math.min(p, 0.95);
}

/**
 * False-positive chance for an honest Red: each "noisy" blue layer (pow, recon,
 * whistle, osint) adds a flat contribution, capped at 0.4.
 */
export function falsePositiveChance(blueSet: ReadonlySet<BlueLayerId>): number {
  let noisy = 0;
  (["pow", "recon", "whistle", "osint"] as const).forEach((l) => {
    if (blueSet.has(l)) noisy++;
  });
  return Math.min(noisy * FP_PER_NOISY, 0.4);
}

/** Band label + CSS color token for a peak-evidence probability. */
export function bandFor(p: number): [string, string] {
  if (p < 0.15) return ["Compliant", "var(--good)"];
  if (p < 0.35) return ["Likely compliant", "var(--good)"];
  if (p < 0.55) return ["Ambiguous — needs clarification", "var(--warn)"];
  if (p < 0.75) return ["Suspicious anomaly", "var(--warn)"];
  if (p < 0.9) return ["Probable non-compliance", "var(--bad)"];
  return ["Material breach", "var(--bad)"];
}
