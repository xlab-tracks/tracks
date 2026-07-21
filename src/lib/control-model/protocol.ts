/**
 * Protocol evaluation: safety, usefulness, per-attack aggregates (PLAN §4.4–§4.6).
 * All quantities are exact expectations (grid integration over opportunities);
 * no Monte Carlo (PLAN P6).
 */
import { PARAMS, Levers, RedStrategy } from './params'
import { attackOutcome, attackOutcomeAt, muAttack, muAttackFromBase, muBase, opportunityGrid, pSucc, attackRate, zAudit, zDefer } from './distributions'
import { clamp } from './math'

export interface AttackAggregates {
  /** Expected number of attacks k = r * N. */
  k: number
  /** Attack rate r = P(g > gStar). */
  r: number
  /** Mean per-attack catch probability. */
  cBar: number
  /** Mean per-attack defer probability. */
  fBar: number
  /** Mean per-attack ship probability. */
  shipBar: number
  /** Mean per-attack win probability wBar = E[ship] * pSucc(sigma). */
  wBar: number
}

/** Aggregate per-attack outcome probabilities over opportunities g > gStar. */
export function attackAggregates(levers: Levers, red: RedStrategy): AttackAggregates {
  const { g, w } = opportunityGrid()
  const ps = pSucc(red.sigma)
  // Loop invariants (3 of the 5 Phi/PhiInv per grid point) hoisted out.
  const mb = muBase(levers.q, levers.attackSd)
  const za = zAudit(levers.b)
  const zd = zDefer(levers.d)
  let mass = 0
  let c = 0
  let f = 0
  let ship = 0
  for (let i = 0; i < g.length; i++) {
    if (g[i] <= red.gStar) continue
    const mu = muAttackFromBase(mb, red.sigma, g[i])
    const out = attackOutcomeAt(mu, za, zd, levers.attackSd)
    c += w[i] * out.catch_
    f += w[i] * out.defer_
    ship += w[i] * out.ship
    mass += w[i]
  }
  if (mass === 0) return { k: 0, r: 0, cBar: 0, fBar: 0, shipBar: 0, wBar: 0 }
  const r = mass
  return {
    k: r * PARAMS.N,
    r,
    cBar: c / mass,
    fBar: f / mass,
    shipBar: ship / mass,
    wBar: (ship / mass) * ps,
  }
}

export interface GameResult {
  /** P(red team wins): a working backdoor ships before any catch. */
  pRedWin: number
  /** Safety = 1 - pRedWin. */
  safety: number
  /** The two factors of PLAN §4.5, exposed for the stage-8 formula panel. */
  raceFactor: number // wBar / (wBar + cBar)
  eventFactor: number // 1 - (1 - r (wBar + cBar))^N
  agg: AttackAggregates
}

/**
 * P(red wins) = [wBar/(wBar+cBar)] * [1 - (1 - r (wBar+cBar))^N]   (PLAN §4.5)
 * Each of the N problems is independently decisive with probability
 * r (wBar+cBar); this is the exact first-decisive-event probability for
 * i.i.d. problems. (The previous 1 - exp(-k (wBar+cBar)), with k = r N, was the
 * Poisson limit of this power form.)
 */
export function evaluateGame(levers: Levers, red: RedStrategy): GameResult {
  const agg = attackAggregates(levers, red)
  const decisive = agg.wBar + agg.cBar
  if (agg.k === 0 || decisive <= 0) {
    return { pRedWin: 0, safety: 1, raceFactor: 0, eventFactor: 0, agg }
  }
  const raceFactor = agg.wBar / decisive
  const eventFactor = 1 - Math.pow(1 - agg.r * decisive, PARAMS.N)
  const pRedWin = raceFactor * eventFactor
  return { pRedWin, safety: 1 - pRedWin, raceFactor, eventFactor, agg }
}

/**
 * Stage-8 didactic variant: homogeneous attacks (no opportunity
 * heterogeneity), red directly chooses the number of attacks k.
 * Uses the attack distribution at fixed opportunity quality gFixed.
 * P(red wins) = [wBar/(wBar+cBar)] * [1 - (1 - (wBar+cBar))^k], exact for
 * i.i.d. attacks; at k=1 it collapses to pRedWin = wBar (the sanity check the
 * lesson invites). The previous 1 - exp(-k (wBar+cBar)) was its Poisson limit.
 */
export function evaluateHomogeneous(levers: Levers, sigma: number, k: number, gFixed = 0.5): GameResult {
  const mu = muAttack(levers.q, sigma, gFixed, levers.attackSd)
  const out = attackOutcome(mu, levers.b, levers.d, levers.attackSd)
  const wBar = out.ship * pSucc(sigma)
  const cBar = out.catch_
  const decisive = wBar + cBar
  const agg: AttackAggregates = { k, r: k / PARAMS.N, cBar, fBar: out.defer_, shipBar: out.ship, wBar }
  if (k === 0 || decisive <= 0) return { pRedWin: 0, safety: 1, raceFactor: 0, eventFactor: 0, agg }
  const raceFactor = wBar / decisive
  const eventFactor = 1 - Math.pow(1 - decisive, k)
  return { pRedWin: raceFactor * eventFactor, safety: 1 - raceFactor * eventFactor, raceFactor, eventFactor, agg }
}

/**
 * Usefulness (PLAN §4.6), rescaled so all-T = 0 and all-U = 1.
 * Deferred fraction ≈ innocent mass in the defer band = d - b.
 */
export function usefulness(levers: Levers): number {
  const deferFrac = clamp(levers.d - levers.b, 0, 1)
  return 1 - deferFrac
}

/**
 * Upfront-auditing baseline (stage 3; PLAN §4.5 note).
 * Audit the first bN problems positionally; no monitor. Red is memoryless:
 * attacks each problem with probability rho (obvious backdoor, sigma = 0).
 * Any attack in the audited prefix is caught (blue wins); afterwards attacks
 * ship and win with probability pSucc(0).
 * P(red) = (1-rho)^(bN) * [1 - (1 - rho * p)^((1-b)N)]; maximized over rho.
 */
export function upfrontAuditing(b: number = PARAMS.bDefault): { safety: number; bestRho: number } {
  const p = pSucc(0)
  const nPrefix = Math.round(b * PARAMS.N)
  const nRest = PARAMS.N - nPrefix
  let best = 0
  let bestRho = 0
  // rho swept on a log grid; the optimum is well inside.
  for (let i = 0; i <= 400; i++) {
    const rho = Math.pow(10, -5 + (5 * i) / 400) // 1e-5 .. 1
    if (rho > 1) break
    const pRed = Math.pow(1 - rho, nPrefix) * (1 - Math.pow(1 - rho * p, nRest))
    if (pRed > best) {
      best = pRed
      bestRho = rho
    }
  }
  return { safety: 1 - best, bestRho }
}

/** Attack rate helper re-exported for UI convenience. */
export { attackRate }
