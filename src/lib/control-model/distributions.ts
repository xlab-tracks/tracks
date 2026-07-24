/**
 * Suspicion-score machinery (PLAN §4.1–§4.2).
 *
 * Latent model: innocent z ~ N(0,1); attacked z ~ N(mu, 1) with
 * mu = mu_base(q) * (1 - subtletyVis * sigma) - gamma * g.
 * Displayed score s = m(z) = 10 * Phi(z / squash)  (fixed monotone squash).
 *
 * Because m is monotone, all probabilities are computed in latent space
 * (exact, via Phi); the squash is used only for rendering densities.
 */
import { PARAMS } from './params'
import { Phi, PhiInv, phi, betaPdf } from './math'

/** mu_base from AUROC q: AUROC = Phi(mu / sqrt(1 + sd^2)). */
export function muBase(q: number, sd: number = PARAMS.attackSd): number {
  return Math.sqrt(1 + sd * sd) * PhiInv(q)
}

/** Latent mean of an attack with subtlety sigma at opportunity quality g. */
export function muAttack(q: number, sigma: number, g: number, sd: number = PARAMS.attackSd): number {
  return muAttackFromBase(muBase(q, sd), sigma, g)
}

/** muAttack with muBase precomputed — hot loops hoist muBase's PhiInv out. */
export function muAttackFromBase(mb: number, sigma: number, g: number): number {
  return mb * (1 - PARAMS.subtletyVis * sigma) - PARAMS.gamma * g
}

/**
 * P(backdoor works) as a function of subtlety.
 * Smooth power decay pSucc(sigma) = p0 * (1 - sigma)^alpha: strictly decreasing
 * on [0,1], equal to p0 at sigma = 0 (anchors upfront auditing), and → 0 as
 * sigma → 1 (a maximally subtle backdoor is essentially always broken). No
 * floor, so the subtlety curve declines monotonically past its peak instead of
 * bottoming out and rebounding the way the old piecewise-linear floor did.
 */
export function pSucc(sigma: number): number {
  return PARAMS.p0 * Math.pow(Math.max(0, 1 - sigma), PARAMS.alpha)
}

/** Squash latent z to display score in [0, 10]. */
export function squash(z: number): number {
  return 10 * Phi(z / PARAMS.squash)
}

/** Inverse squash: display score in (0, 10) to latent z. */
export function unsquash(s: number): number {
  return PARAMS.squash * PhiInv(s / 10)
}

/** Latent audit threshold z_a such that innocent FPR = b. */
export function zAudit(b: number): number {
  return PhiInv(1 - b)
}

/** Latent defer threshold z_d such that innocent mass above it = d. */
export function zDefer(d: number): number {
  return PhiInv(1 - d)
}

/** Per-attack outcome probabilities at latent mean mu (PLAN §4.2). */
export interface AttackOutcome {
  /** P(score >= t_a): audited, red caught. */
  catch_: number
  /** P(t_d <= score < t_a): deferred, attack silently neutralized. */
  defer_: number
  /** P(score < t_d): ships. */
  ship: number
}

export function attackOutcome(mu: number, b: number, d: number, sd: number = PARAMS.attackSd): AttackOutcome {
  return attackOutcomeAt(mu, zAudit(b), zDefer(d), sd)
}

/** attackOutcome with thresholds precomputed — hot loops hoist the two PhiInv out. */
export function attackOutcomeAt(mu: number, za: number, zd: number, sd: number = PARAMS.attackSd): AttackOutcome {
  const catch_ = Phi((mu - za) / sd) // P(N(mu,sd) >= za)
  const ship = Phi((zd - mu) / sd) // P(N(mu,sd) < zd)
  const defer_ = Math.max(0, 1 - catch_ - ship)
  return { catch_, defer_, ship }
}

/**
 * Density of the DISPLAYED score for a latent N(mu,1), on a score grid.
 * f_S(s) = f_Z(z(s)) * dz/ds where z(s) = squash^{-1}(s).
 * Used for rendering only.
 */
export interface ScoreDensity {
  /** Bin centers on [0,10]. */
  s: Float64Array
  /** Density values (integrate to ~1 over [0,10]). */
  f: Float64Array
}

export function scoreDensity(mu: number, bins: number = PARAMS.SCORE_BINS, sd: number = PARAMS.attackSd): ScoreDensity {
  const s = new Float64Array(bins)
  const f = new Float64Array(bins)
  const ds = 10 / bins
  for (let i = 0; i < bins; i++) {
    const si = (i + 0.5) * ds
    const z = unsquash(si)
    // dz/ds = squash / (10 * phi(z / squash))
    const dzds = PARAMS.squash / (10 * phi(z / PARAMS.squash))
    s[i] = si
    f[i] = (phi((z - mu) / sd) / sd) * dzds
  }
  return { s, f }
}

/**
 * Displayed-score density of the attack MIXTURE over opportunities g > gStar
 * with subtlety sigma (renders the red histogram after stage 9).
 */
export function attackMixtureDensity(q: number, sigma: number, gStar: number, bins: number = PARAMS.SCORE_BINS, sd: number = PARAMS.attackSd): ScoreDensity {
  const gGrid = opportunityGrid()
  const s = new Float64Array(bins)
  const f = new Float64Array(bins)
  const ds = 10 / bins
  let wSum = 0
  const mus: number[] = []
  const ws: number[] = []
  const mb = muBase(q, sd)
  for (let j = 0; j < gGrid.g.length; j++) {
    if (gGrid.g[j] <= gStar) continue
    mus.push(muAttackFromBase(mb, sigma, gGrid.g[j]))
    ws.push(gGrid.w[j])
    wSum += gGrid.w[j]
  }
  if (wSum === 0) {
    // Degenerate: no opportunities taken; return zeros.
    for (let i = 0; i < bins; i++) s[i] = (i + 0.5) * ds
    return { s, f }
  }
  for (let i = 0; i < bins; i++) {
    const si = (i + 0.5) * ds
    const z = unsquash(si)
    const dzds = PARAMS.squash / (10 * phi(z / PARAMS.squash))
    let fi = 0
    for (let j = 0; j < mus.length; j++) fi += (ws[j] / wSum) * (phi((z - mus[j]) / sd) / sd)
    s[i] = si
    f[i] = fi * dzds
  }
  return { s, f }
}

/** Opportunity-quality grid: Beta(a,b) discretized with trapezoid weights. */
export interface OpportunityGrid {
  g: Float64Array
  /** Probability mass per node (sums to ~1). */
  w: Float64Array
}

let _oppCache: OpportunityGrid | null = null
export function opportunityGrid(): OpportunityGrid {
  if (_oppCache) return _oppCache
  const n = PARAMS.G_BINS
  const g = new Float64Array(n)
  const w = new Float64Array(n)
  const dg = 1 / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    const gi = (i + 0.5) * dg
    g[i] = gi
    w[i] = betaPdf(gi, PARAMS.betaA, PARAMS.betaB) * dg
    sum += w[i]
  }
  for (let i = 0; i < n; i++) w[i] /= sum
  _oppCache = { g, w }
  return _oppCache
}

/** P(g > gStar) under the opportunity distribution. */
export function attackRate(gStar: number): number {
  const { g, w } = opportunityGrid()
  let r = 0
  for (let i = 0; i < g.length; i++) if (g[i] > gStar) r += w[i]
  return r
}

/** ROC: TPR at a given FPR for a homogeneous attack with latent mean mu. */
export function tprAtFpr(mu: number, fpr: number, sd: number = PARAMS.attackSd): number {
  return Phi((mu + PhiInv(fpr)) / sd)
}

/**
 * Unequal-variance ROC (stage 7b's monitor B): attack z ~ N(mu, sd).
 * TPR = Phi((mu + PhiInv(FPR)) / sd).  AUROC = Phi(mu / sqrt(1 + sd^2)).
 */
export function tprAtFprUnequal(mu: number, sd: number, fpr: number): number {
  return Phi((mu + PhiInv(fpr)) / sd)
}

export function aurocUnequal(mu: number, sd: number): number {
  return Phi(mu / Math.sqrt(1 + sd * sd))
}
