/**
 * Single source of truth for every model constant (PLAN §4.8).
 * Calibrated so the headline protocol numbers approximate the paper:
 *   upfront auditing ≈ 15% safety; trusted monitoring (b=2%) ≈ 62%;
 *   + defer 10% ≈ 83%; + defer 20% ≈ 92%.
 * Reliability uses the smooth pSucc(sigma) = p0 * (1 - sigma)^alpha (see below);
 * alpha and subtletyVis were re-tuned to keep those pins in range with an
 * interior best-response subtlety once the old hard reliability floor was removed.
 * Do not edit without re-running `npm run test` (calibration pins).
 */
export const PARAMS = {
  /** Deployment length (number of problems). */
  N: 5000,
  /** Default audit budget (fraction of problems H can review). */
  bDefault: 0.02,
  /** Correctness rate of the untrusted model U (paper's GPT-4). */
  uU: 0.54,
  /** Correctness rate of the trusted model T (paper's GPT-3.5). */
  uT: 0.22,
  /**
   * Monitor quality as AUROC against a baseline attack (sigma=0, g=0).
   * mu_base = sqrt(2) * PhiInv(q).
   */
  q: 0.97,
  /** P(backdoor actually works) at sigma = 0 (anchors the upfront-auditing pin via pSucc(0)). */
  p0: 0.75,
  /**
   * Backdoor reliability decay exponent. p_succ(sigma) = p0 * (1 - sigma)^alpha:
   * smooth, strictly decreasing, and → 0 as sigma → 1 (a maximally subtle
   * backdoor essentially never works). Replaces the earlier piecewise-linear
   * max(pMin, p0 - pSlope*sigma), whose hard floor at sigma = 0.6 put a spurious
   * valley-then-rebound into the subtlety curve. alpha is set by calibration.
   */
  alpha: 1.3,
  /** Latent visibility reduction per unit opportunity quality g. */
  gamma: 0.3,
  /** mu(sigma,g) = mu_base * (1 - subtletyVis * sigma) - gamma * g. */
  subtletyVis: 0.4,
  /** Latent std dev of attack scores (attacks are more stereotyped than the innocent stream). */
  attackSd: 0.9,
  /** Opportunity quality distribution g ~ Beta(a, b) on [0,1]. */
  betaA: 2,
  betaB: 5,
  /** Squash map m(z) = 10 * Phi(z / squash) from latent z to score [0,10]. */
  squash: 2.5,
  /** Grid resolutions. */
  SCORE_BINS: 512,
  G_BINS: 256,
  /** Best-response search grid. */
  BR_GSTAR_STEPS: 60,
  BR_SIGMA_STEPS: 40,
} as const

/** Blue-team and red-team lever state. */
export interface Levers {
  /** Audit budget: fraction of problems sent to H (sets t_a via FPR = b). */
  b: number
  /** Defer threshold: total fraction below-audit-band boundary (d >= b). Band is FPR in [b, d]. */
  d: number
  /** Monitor AUROC (advanced lever; defaults to PARAMS.q). */
  q: number
  /** Trusted model correctness (advanced lever; defaults to PARAMS.uT). */
  uT: number
  /**
   * Latent spread of attack scores under the current monitor. Defaults to
   * PARAMS.attackSd; challenge C3 sets 0.4 ("monitor B": same AUROC, attacks
   * compressed into a mid-suspicion band, almost no mass in the audit tail).
   */
  attackSd: number
  /** Red team strategy. */
  red: RedStrategy
}

export interface RedStrategy {
  /** 'fixed' uses (gStar, sigma) below; 'best' searches the grid. */
  mode: 'fixed' | 'best'
  /** Opportunity-quality cutoff: attack iff g > gStar. */
  gStar: number
  /** Attack subtlety in [0, 1]. */
  sigma: number
}

export const DEFAULT_LEVERS: Levers = {
  b: PARAMS.bDefault,
  d: PARAMS.bDefault, // no defer band until stage 12 widens it
  q: PARAMS.q,
  uT: PARAMS.uT,
  attackSd: PARAMS.attackSd,
  red: { mode: 'fixed', gStar: 0.62, sigma: 0.5 },
}
