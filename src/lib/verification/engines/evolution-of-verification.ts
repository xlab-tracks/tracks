/**
 * The Evolution of Verification: simulation engine.
 *
 * Pure, seed-deterministic functions. No DOM, no Date, no Math.random. Lifted
 * verbatim from the standalone page
 * (public/verification/evolution-of-verification.html, the `window.EVENGINE`
 * UMD module) and ported to typed ES modules so the same code is calibrated in
 * tests and shipped in the native widget. Decisions may only read RECORDED
 * history; payoffs always follow TRUE actions. This is human-authored
 * curriculum — do not re-author the numbers, rules, or calibration notes.
 */

export type Move = "C" | "D";
export type Rng = () => number;

export type StrategyKey =
  | "cooperator"
  | "defector"
  | "copycat"
  | "grudger"
  | "random"
  | "vcopycat"
  | "vgrudger"
  | "vcooperator";

export type RuleKey = "cooperator" | "defector" | "copycat" | "grudger" | "random";

export interface MatchOpts {
  rounds: number;
  noise: number;
  vCost: number;
  reliability: number;
}

export type Mix = Partial<Record<StrategyKey, number>>;
export type Counts = Record<StrategyKey, number>;

// ---- seeded PRNG (mulberry32) ----
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- payoff matrix (true actions only) ----
export const PAYOFF = { R: 3, P: 1, T: 5, S: 0 } as const;
export function payoff(myTrue: Move, theirTrue: Move): number {
  if (myTrue === "C") return theirTrue === "C" ? PAYOFF.R : PAYOFF.S;
  return theirTrue === "C" ? PAYOFF.T : PAYOFF.P;
}

// ---- strategies ----
// decide(recordedOpponentMoves, rng) -> 'C' | 'D'
// Decisions may only read RECORDED history, never true history, never round number.
const RULES: Record<RuleKey, (rec: Move[], rng: Rng) => Move> = {
  cooperator: function () {
    return "C";
  },
  defector: function () {
    return "D";
  },
  copycat: function (rec) {
    return rec.length === 0 ? "C" : rec[rec.length - 1];
  },
  grudger: function (rec) {
    return rec.indexOf("D") >= 0 ? "D" : "C";
  },
  random: function (_rec, rng) {
    return rng() < 0.5 ? "C" : "D";
  },
};

export const STRATEGIES: Record<
  StrategyKey,
  { rule: RuleKey; verifier: boolean }
> = {
  cooperator: { rule: "cooperator", verifier: false },
  defector: { rule: "defector", verifier: false },
  copycat: { rule: "copycat", verifier: false },
  grudger: { rule: "grudger", verifier: false },
  random: { rule: "random", verifier: false },
  vcopycat: { rule: "copycat", verifier: true },
  vgrudger: { rule: "grudger", verifier: true },
  vcooperator: { rule: "cooperator", verifier: true },
};
export const STRAT_KEYS = Object.keys(STRATEGIES) as StrategyKey[];

// ---- perception ----
// Noise is misperception: the true action stands and determines payoffs; only
// the observer's RECORD of it can flip. A verifier's record is true with
// probability r (reliability, default 1); a non-verifier's record flips with
// probability e (noise). Independent per observer per round.
export function perceive(
  trueAction: Move,
  observerIsVerifier: boolean,
  e: number,
  r: number,
  rng: Rng,
): Move {
  const flipProb = observerIsVerifier ? 1 - r : e;
  const flip = rng() < flipProb;
  return flip ? (trueAction === "C" ? "D" : "C") : trueAction;
}

export interface MatchResult {
  scoreA: number;
  scoreB: number;
}

// ---- one match ----
// opts: { rounds, noise, vCost, reliability }
// Returns summed scores. rng consumption order is fixed:
// per round: A decides, B decides, A perceives B, B perceives A.
export function playMatch(
  stratA: StrategyKey,
  stratB: StrategyKey,
  opts: MatchOpts,
  rng: Rng,
): MatchResult {
  const a = STRATEGIES[stratA],
    b = STRATEGIES[stratB];
  const recA: Move[] = [],
    recB: Move[] = []; // recA = A's records of B's actions
  let scoreA = 0,
    scoreB = 0;
  for (let round = 0; round < opts.rounds; round++) {
    const actA = RULES[a.rule](recA, rng);
    const actB = RULES[b.rule](recB, rng);
    scoreA += payoff(actA, actB);
    scoreB += payoff(actB, actA);
    if (a.verifier) scoreA -= opts.vCost;
    if (b.verifier) scoreB -= opts.vCost;
    recA.push(perceive(actB, a.verifier, opts.noise, opts.reliability, rng));
    recB.push(perceive(actA, b.verifier, opts.noise, opts.reliability, rng));
  }
  return { scoreA: scoreA, scoreB: scoreB };
}

export interface RoundLog {
  actA: Move;
  actB: Move;
  seenByA: Move;
  seenByB: Move;
  pA: number;
  pB: number;
}

export interface DetailedMatchResult extends MatchResult {
  rounds: RoundLog[];
}

// Same as playMatch but returns full per-round detail (for UI replay / tests).
export function playMatchDetailed(
  stratA: StrategyKey,
  stratB: StrategyKey,
  opts: MatchOpts,
  rng: Rng,
): DetailedMatchResult {
  const a = STRATEGIES[stratA],
    b = STRATEGIES[stratB];
  const recA: Move[] = [],
    recB: Move[] = [];
  const roundsLog: RoundLog[] = [];
  let scoreA = 0,
    scoreB = 0;
  for (let round = 0; round < opts.rounds; round++) {
    const actA = RULES[a.rule](recA, rng);
    const actB = RULES[b.rule](recB, rng);
    const pA = payoff(actA, actB) - (a.verifier ? opts.vCost : 0);
    const pB = payoff(actB, actA) - (b.verifier ? opts.vCost : 0);
    scoreA += pA;
    scoreB += pB;
    const seenByA = perceive(actB, a.verifier, opts.noise, opts.reliability, rng);
    const seenByB = perceive(actA, b.verifier, opts.noise, opts.reliability, rng);
    recA.push(seenByA);
    recB.push(seenByB);
    roundsLog.push({
      actA: actA,
      actB: actB,
      seenByA: seenByA,
      seenByB: seenByB,
      pA: pA,
      pB: pB,
    });
  }
  return { scoreA: scoreA, scoreB: scoreB, rounds: roundsLog };
}

// ---- one generation: full round robin, one match per pair ----
export function generationScores(
  pop: StrategyKey[],
  opts: MatchOpts,
  rng: Rng,
): number[] {
  const scores = new Array(pop.length).fill(0);
  for (let i = 0; i < pop.length; i++) {
    for (let j = i + 1; j < pop.length; j++) {
      const m = playMatch(pop[i], pop[j], opts, rng);
      scores[i] += m.scoreA;
      scores[j] += m.scoreB;
    }
  }
  return scores;
}

// ---- replication: eliminate 5 lowest, clone 5 highest, seeded tie-break ----
export function replicate(
  pop: StrategyKey[],
  scores: number[],
  rng: Rng,
  churn?: number,
): StrategyKey[] {
  churn = churn || 5;
  const tb = pop.map(function () {
    return rng();
  }); // tie-break draws, index order
  const order = pop.map(function (_, i) {
    return i;
  });
  order.sort(function (x, y) {
    return scores[x] - scores[y] || tb[x] - tb[y];
  });
  const removed: Record<number, boolean> = {};
  for (let k = 0; k < churn; k++) removed[order[k]] = true;
  const next: StrategyKey[] = [];
  for (let i = 0; i < pop.length; i++) if (!removed[i]) next.push(pop[i]);
  for (let k = pop.length - churn; k < pop.length; k++) next.push(pop[order[k]]);
  return next;
}

export function countByStrategy(pop: StrategyKey[]): Counts {
  const c = {} as Counts;
  STRAT_KEYS.forEach(function (k) {
    c[k] = 0;
  });
  pop.forEach(function (k) {
    c[k]++;
  });
  return c;
}

// mix: {strategyKey: count}. Population order is fixed: STRAT_KEYS order.
export function buildPopulation(mix: Mix): StrategyKey[] {
  const pop: StrategyKey[] = [];
  STRAT_KEYS.forEach(function (k) {
    for (let n = 0; n < (mix[k] || 0); n++) pop.push(k);
  });
  return pop;
}

export interface SimResult {
  history: Counts[];
  avgByGen: Partial<Record<StrategyKey, number>>[];
  finalPop: StrategyKey[];
}

// ---- full simulation ----
// Returns { history: [counts at gen 0 .. generations], avgByGen, finalPop }
export function simulate(
  mix: Mix,
  opts: MatchOpts,
  seed: number,
  generations: number,
): SimResult {
  const rng = mulberry32(seed);
  let pop = buildPopulation(mix);
  const history: Counts[] = [countByStrategy(pop)];
  const avgByGen: Partial<Record<StrategyKey, number>>[] = [];
  for (let g = 0; g < generations; g++) {
    const scores = generationScores(pop, opts, rng);
    const sums: Partial<Record<StrategyKey, number>> = {},
      ns: Partial<Record<StrategyKey, number>> = {};
    pop.forEach(function (k, i) {
      sums[k] = (sums[k] || 0) + scores[i];
      ns[k] = (ns[k] || 0) + 1;
    });
    const avg: Partial<Record<StrategyKey, number>> = {};
    (Object.keys(sums) as StrategyKey[]).forEach(function (k) {
      avg[k] = sums[k]! / ns[k]!;
    });
    avgByGen.push(avg);
    pop = replicate(pop, scores, rng);
    history.push(countByStrategy(pop));
  }
  return { history: history, avgByGen: avgByGen, finalPop: pop };
}

// ---- family groupings used by stages and calibration ----
export type FamilyKey =
  | "reciprocators"
  | "vreciprocators"
  | "cooperators"
  | "vcooperators"
  | "defectors"
  | "randoms";

const FAMILIES: Record<FamilyKey, StrategyKey[]> = {
  reciprocators: ["copycat", "grudger"],
  vreciprocators: ["vcopycat", "vgrudger"],
  cooperators: ["cooperator"],
  vcooperators: ["vcooperator"],
  defectors: ["defector"],
  randoms: ["random"],
};
export function familyCounts(counts: Counts): Record<FamilyKey, number> {
  const f = {} as Record<FamilyKey, number>;
  (Object.keys(FAMILIES) as FamilyKey[]).forEach(function (fam) {
    f[fam] = FAMILIES[fam].reduce(function (s, k) {
      return s + (counts[k] || 0);
    }, 0);
  });
  return f;
}

// ---- stage definitions (single source of truth for UI and calibration) ----
// Calibrated 2026-07-08 (see CALIBRATION.md). Deviations from the build brief,
// made in the protocol's allowed order (mix, then noise, then match length):
// stages 2-3 run at 20% noise, not 10% (at 10% misperception is too mild to
// break reciprocity in 10-round matches, and the verifier premium is below
// v=0.2 in any mix tried); stage 3 swaps one copycat for one v-copycat.
export interface StageDef {
  mix: Mix;
  opts: MatchOpts;
}

export const STAGES: Record<1 | 2 | 3, StageDef> = {
  1: {
    mix: { copycat: 5, cooperator: 5, defector: 5, grudger: 5, random: 5 },
    opts: { rounds: 10, noise: 0, vCost: 0.2, reliability: 1 },
  },
  2: {
    mix: { copycat: 5, cooperator: 5, defector: 5, grudger: 5, random: 5 },
    opts: { rounds: 10, noise: 0.2, vCost: 0.2, reliability: 1 },
  },
  3: {
    mix: {
      copycat: 3,
      grudger: 3,
      cooperator: 3,
      defector: 5,
      random: 2,
      vcopycat: 5,
      vgrudger: 2,
      vcooperator: 2,
    },
    opts: { rounds: 10, noise: 0.2, vCost: 0.2, reliability: 1 },
  },
};

// ---- calibration criteria ----
// Success is judged at generation `gens` (default 30):
// Stage 1: reciprocator family (copycat+grudger) holds a majority (>= 13 of 25).
// Stage 2: defectors reach at least half (>= 13 of 25), OR cooperative share
//          (everything except defector and random) falls below 25%.
// Stage 3: verifying reciprocators (vcopycat+vgrudger) are the plurality
//          among the six families above.
export function stageCriterion(stage: number, counts: Counts): boolean {
  const f = familyCounts(counts);
  const total = STRAT_KEYS.reduce(function (s, k) {
    return s + counts[k];
  }, 0);
  if (stage === 1) return f.reciprocators >= Math.floor(total / 2) + 1;
  if (stage === 2) {
    const coop =
      f.reciprocators + f.vreciprocators + f.cooperators + f.vcooperators;
    return f.defectors >= Math.ceil(total / 2) || coop / total < 0.25;
  }
  if (stage === 3) {
    const others: FamilyKey[] = [
      "reciprocators",
      "cooperators",
      "vcooperators",
      "defectors",
      "randoms",
    ];
    return others.every(function (fam) {
      return f.vreciprocators > f[fam];
    });
  }
  return false;
}

export interface CalibrationResult {
  stage: number;
  passes: number;
  total: number;
  results: { seed: number; pass: boolean; finalCounts: Counts }[];
}

export function calibrateStage(
  stage: 1 | 2 | 3,
  seeds: number[],
  gens: number,
): CalibrationResult {
  const def = STAGES[stage];
  const results: { seed: number; pass: boolean; finalCounts: Counts }[] = [];
  seeds.forEach(function (seed) {
    const sim = simulate(def.mix, def.opts, seed, gens);
    const last = sim.history[sim.history.length - 1];
    results.push({
      seed: seed,
      pass: stageCriterion(stage, last),
      finalCounts: last,
    });
  });
  const passes = results.filter(function (r) {
    return r.pass;
  }).length;
  return { stage: stage, passes: passes, total: seeds.length, results: results };
}

// Stage 4 challenge check: at 10% noise, verifiers persist at some v and go
// extinct at some higher v within the slider range [0, 1].
export function verifierOutcomeAtCost(
  v: number,
  seed: number,
  gens: number,
): { verifierTotal: number; vreciprocators: number; counts: Counts } {
  const def = STAGES[3];
  const opts: MatchOpts = {
    rounds: def.opts.rounds,
    noise: def.opts.noise,
    vCost: v,
    reliability: 1,
  };
  const sim = simulate(def.mix, opts, seed, gens);
  const last = sim.history[sim.history.length - 1];
  const f = familyCounts(last);
  return {
    verifierTotal: f.vreciprocators + f.vcooperators,
    vreciprocators: f.vreciprocators,
    counts: last,
  };
}

// ---- inline unit tests (also surfaced by ?debug=1 in the original page) ----
export function runTests(): { name: string; pass: boolean }[] {
  const t: { name: string; pass: boolean }[] = [];
  function check(name: string, cond: unknown) {
    t.push({ name: name, pass: !!cond });
  }

  // 1. Determinism: same seed + settings replay identically.
  (function () {
    const a = JSON.stringify(
      simulate(STAGES[3].mix, STAGES[3].opts, 42, 12).history,
    );
    const b = JSON.stringify(
      simulate(STAGES[3].mix, STAGES[3].opts, 42, 12).history,
    );
    check("determinism: identical seed gives identical history", a === b);
    const c = JSON.stringify(
      simulate(STAGES[3].mix, STAGES[3].opts, 43, 12).history,
    );
    check("determinism: different seed gives different history", a !== c);
  })();

  // 2. Payoffs derive from TRUE actions while decisions derive from RECORDED ones.
  // At e=1 every non-verifier record flips. Two Cooperators still truly cooperate,
  // so they must score R=3 per round despite both recording pure defection.
  (function () {
    const opts: MatchOpts = { rounds: 10, noise: 1.0, vCost: 0.2, reliability: 1 };
    const m = playMatchDetailed("cooperator", "cooperator", opts, mulberry32(7));
    check(
      "payoffs use true actions (cooperators score 3/round at e=1)",
      m.scoreA === 30 && m.scoreB === 30,
    );
    check(
      "records flipped at e=1 (each saw defection every round)",
      m.rounds.every(function (r) {
        return r.seenByA === "D" && r.seenByB === "D";
      }),
    );
    // Decisions use recorded history: copycat vs cooperator at e=1 sees 'D'
    // after round 1 and defects from round 2 on, though the cooperator never defected.
    const m2 = playMatchDetailed("copycat", "cooperator", opts, mulberry32(7));
    check(
      "decisions use recorded history (copycat turns on a phantom defection)",
      m2.rounds[0].actA === "C" &&
        m2.rounds.slice(1).every(function (r) {
          return r.actA === "D";
        }),
    );
  })();

  // 3. Verifier records never flip at r=1, regardless of noise.
  (function () {
    const opts: MatchOpts = { rounds: 10, noise: 1.0, vCost: 0.2, reliability: 1 };
    const m = playMatchDetailed("vgrudger", "cooperator", opts, mulberry32(9));
    check(
      "verifier records never flip at r=1 (v-grudger never triggered at e=1)",
      m.rounds.every(function (r) {
        return r.actA === "C" && r.seenByA === "C";
      }),
    );
    check(
      "verifier pays cost every round (30 - 10*0.2 = 28)",
      Math.abs(m.scoreA - 28) < 1e-9,
    );
    // And at r<1 verifier records CAN flip (reliability extension is live).
    const opts2: MatchOpts = { rounds: 200, noise: 0, vCost: 0, reliability: 0.5 };
    const m3 = playMatchDetailed("vcooperator", "cooperator", opts2, mulberry32(11));
    const flips = m3.rounds.filter(function (r) {
      return r.seenByA === "D";
    }).length;
    check("verifier records flip at r<1 (reliability mechanic live)", flips > 0);
  })();

  // 4. Replication rule: 25 stay 25; 5 lowest die; 5 highest clone.
  (function () {
    const pop = buildPopulation(STAGES[1].mix);
    const rng = mulberry32(5);
    const scores = generationScores(pop, STAGES[1].opts, rng);
    const next = replicate(pop, scores, rng);
    check("population stays at 25 after replication", next.length === 25);
    // In stage 1 (no noise) defectors surrounded by grudgers/copycats score low:
    // the strategy counts must change only by eliminations plus clones (net 0..5 shifts).
    const before = countByStrategy(pop),
      after = countByStrategy(next);
    let shifted = 0;
    STRAT_KEYS.forEach(function (k) {
      shifted += Math.abs(after[k] - before[k]);
    });
    check("replication churn bounded by 2x5", shifted <= 10);
  })();

  // 5. V-Cooperator never outperforms Cooperator at v>0 (same behavior, pays for
  // information its behavior never uses).
  (function () {
    const opts: MatchOpts = { rounds: 10, noise: 0.1, vCost: 0.2, reliability: 1 };
    let ok = true;
    for (let s = 1; s <= 30; s++) {
      STRAT_KEYS.forEach(function (op) {
        // Same seed => same opponent stream shape; cooperator's actions are
        // identical (always C), so scores differ exactly by the paid cost.
        const mc = playMatch("cooperator", op, opts, mulberry32(s));
        const mv = playMatch("vcooperator", op, opts, mulberry32(s));
        if (!(mv.scoreA <= mc.scoreA + 1e-9)) ok = false;
      });
    }
    check("v-cooperator never outperforms cooperator at v>0", ok);
  })();

  // 6. Payoff matrix sanity.
  check(
    "payoff matrix: CC=3, DD=1, DvC=5, CvD=0",
    payoff("C", "C") === 3 &&
      payoff("D", "D") === 1 &&
      payoff("D", "C") === 5 &&
      payoff("C", "D") === 0,
  );

  return t;
}
