/**
 * Pure payoff model behind the "Change the Game: The Race Dilemma Lab" widget,
 * lifted verbatim (structure and constants) from the authored HTML at
 * public/verification/change-the-game.html (lines ~537-736). This module is the
 * normative implementation of the spec; its behaviour is pinned by
 * change-the-game.test.ts (a port of the source's __runTests harness).
 *
 * Do not re-author the numbers: they are calibrated QA anchors.
 */

export type GameFamily = "pd" | "deadlock" | "assurance" | "harmony" | "chicken";

export type PersonaType = "cautious" | "opportunist" | "mirror";

export type Move = "restrain" | "race";

/** The lab levers the learner controls. */
export interface LabState {
  v: number;
  c: number;
  p: number;
  F: number;
  delta: number;
  share: boolean;
  agreement: boolean;
}

/** A four-anchor payoff quadruple: R (both restrain), T (temptation, you race
 * alone), S (sucker, you restrain alone), P (both race). */
export interface Payoffs {
  R: number;
  T: number;
  S: number;
  P: number;
}

export interface EffPayoffs extends Payoffs {
  transformed: boolean;
}

/* ================================================================
   CONFIG: every tunable number lives here.
   QA anchors (verified, see change-the-game.test.ts):
   - Baseline (v=75, c=25, share off, agreement on, p=0, F=40)
     classifies as Prisoner's Dilemma: T=65 > R=40, P=-12.5 > S=-60, P < R.
   - p=0.7, F=40 at otherwise-baseline classifies as Assurance Game:
     T_eff = 0.3*65 + 0.7*(-52.5) = -17.25 < R=40; P=-12.5 > S_eff=-26.75.
   NOTE: with these constants Deadlock (P_eff >= R_eff) is unreachable from
   the sliders, since max P = Pbase = 10 < R = 40. That is deliberate and is
   the intended discovery of Challenge 2 (its reveal copy explains it).
   Staff can make Deadlock reachable by raising payoffs.Pbase above payoffs.R.
   ================================================================ */
export const CONFIG = {
  payoffs: {
    R: 40, // mutual restraint
    Tbase: 20, // temptation intercept
    TslopeV: 0.6, // temptation slope in v  -> T_base = 20 + 0.6v
    S: -60, // sucker payoff
    Pbase: 10, // mutual-race intercept
    PslopeC: 0.9, // mutual-race slope in c -> P = 10 - 0.9c
    shareFactor: 0.5, // if winner shares risk: T = T_base - 0.5c
  },
  sliders: {
    v: { min: 0, max: 100, step: 1, def: 75 },
    c: { min: 0, max: 100, step: 1, def: 25 },
    p: { min: 0, max: 1, step: 0.01, def: 0 },
    F: { min: 0, max: 100, step: 1, def: 40 },
    delta: { min: 0, max: 0.95, step: 0.05, def: 0 },
  },
  defaults: { share: false, agreement: true },
  presets: {
    hawk: { v: 90, c: 15, share: false },
    dove: { v: 40, c: 85, share: true },
  },
  schedule: ["cautious", "cautious", "opportunist", "mirror", "mirror"] as PersonaType[],
  opportunistCatchThreshold: 0.5, // opportunist restrains iff p >= this
  phase1p: 0, // no verification exists in phase 1
  mirrorDefault: "restrain" as Move, // mirror's move when there is no history
  eps: 1e-9, // tie tolerance for classification
  tiltUnit: 50, // scale: payoff gap per full beam tilt
  tiltMaxDeg: 7,
} as const;

/* ---------------- payoff model (implements the spec exactly) ------------- */
export function basePayoffs(s: LabState): Payoffs {
  const k = CONFIG.payoffs;
  let T = k.Tbase + k.TslopeV * s.v;
  if (s.share) T -= k.shareFactor * s.c;
  const P = k.Pbase - k.PslopeC * s.c;
  return { R: k.R, T, S: k.S, P };
}

export function effPayoffs(s: LabState): EffPayoffs {
  const b = basePayoffs(s);
  if (!s.agreement) return { R: b.R, T: b.T, S: b.S, P: b.P, transformed: false };
  return {
    R: b.R,
    T: (1 - s.p) * b.T + s.p * (b.P - s.F), // caught cheater: collapsed world minus penalty
    S: (1 - s.p) * b.S + s.p * b.P, // their cheating caught early: symmetric-race world
    P: b.P,
    transformed: true,
  };
}

/* Classification on effective payoffs. Tie convention: >= goes to the Race
   side consistently; exact ties flag a knife edge. */
export function classify(e: Payoffs): { fam: GameFamily; knife: boolean } {
  const eps = CONFIG.eps;
  const eq = (a: number, b: number) => Math.abs(a - b) <= eps;
  const tie1 = eq(e.T, e.R),
    tie2 = eq(e.P, e.S);
  const raceBR1 = tie1 ? true : e.T > e.R; // race weakly-best if they restrain
  const raceBR2 = tie2 ? true : e.P > e.S; // race weakly-best if they race
  let fam: GameFamily,
    knife = tie1 || tie2;
  if (raceBR1 && raceBR2) {
    const tie3 = eq(e.P, e.R);
    fam = !tie3 && e.P < e.R ? "pd" : "deadlock";
    knife = knife || tie3;
  } else if (!raceBR1 && raceBR2) fam = "assurance";
  else if (!raceBR1 && !raceBR2) fam = "harmony";
  else fam = "chicken";
  return { fam, knife };
}

/* Pure-strategy equilibria (weak best responses, so ties highlight both). */
export function equilibria(e: Payoffs): string[] {
  const eps = CONFIG.eps;
  const M = [
    [e.R, e.S],
    [e.T, e.P],
  ]; // M[myMove][theirMove], 0=restrain 1=race
  const out: string[] = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const rowOK = M[i][j] >= M[1 - i][j] - eps; // row can't gain by switching
      const colOK = M[j][i] >= M[1 - j][i] - eps; // column can't gain by switching
      if (rowOK && colOK) out.push(i + "" + j);
    }
  return out;
}

/* Repeated play: expected future cost of cheating under detection-triggered
   permanent reversion. Non-decreasing in delta, p, and (R - P). */
export function repeatMultiplier(delta: number, p: number): number {
  return (delta * p) / (1 - delta * (1 - p));
}

export function repeatedVerdict(
  e: Payoffs,
  delta: number,
  p: number,
): { gain: number; cost: number; sustainable: boolean } {
  const gain = e.T - e.R;
  const cost = repeatMultiplier(delta, p) * (e.R - e.P);
  return { gain, cost, sustainable: cost >= gain - CONFIG.eps };
}

/* ---------------- phase 1 rival personalities ---------------------------- */
/* pacMove is pure: personality + memory + context in, move out. */
export function pacMove(
  type: PersonaType,
  mem: { betrayed?: boolean },
  ctx: { p?: number; lastYou?: Move | null },
): Move {
  if (type === "cautious") return mem.betrayed ? "race" : "restrain";
  if (type === "opportunist")
    return (ctx.p ?? 0) >= CONFIG.opportunistCatchThreshold ? "restrain" : "race";
  if (type === "mirror") return ctx.lastYou || CONFIG.mirrorDefault;
  throw new Error("unknown personality " + type);
}

/** Baseline lab defaults, matching CONFIG.sliders/defaults. */
export function labDefaults(): LabState {
  const s = CONFIG.sliders;
  return {
    v: s.v.def,
    c: s.c.def,
    p: s.p.def,
    F: s.F.def,
    delta: s.delta.def,
    share: CONFIG.defaults.share,
    agreement: CONFIG.defaults.agreement,
  };
}
