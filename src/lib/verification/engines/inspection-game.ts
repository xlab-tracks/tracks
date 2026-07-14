/**
 * The Inspection Game — DOM-free engine, lifted verbatim from the
 * `<script id="ig-engine">` IIFE in public/verification/inspection-game.html
 * (lines ~260-708) and typed as a module. The behaviour is unchanged: every
 * function body, constant, and numeric literal is copied exactly. Do not
 * re-author — this is normative curriculum logic and its calibration is pinned
 * by inspection-game.test.ts (ported from the source's `__runTests`).
 */

export interface Tipster {
  id: string;
  genuine: number;
}

export interface IGConfig {
  sites: { id: string; name: string; g: number }[];
  F: number;
  k: number;
  quarters: number;
  manualQuarters: number;
  ewmaAlpha: number;
  ewmaPrior: number;
  entropyWindow: number;
  cautionTax: number;
  tipChance: number;
  tipsters: Tipster[];
  announceCheatProb: number;
  sliderCap: number;
  sweepChance: number;
  flipQuarters: number;
  seedDefault: number;
}

export interface TipClaim {
  site?: number;
  quiet?: boolean;
}

export interface Tip {
  tipster: string;
  reliability: number;
  genuine: boolean;
  claim: TipClaim;
}

export interface EvaderPlan {
  cheat: boolean;
  site: number;
  evs?: number[];
  caution: number;
}

export interface QuarterRecord {
  q: number;
  mode: "manual" | "auto";
  placement: number[];
  cheated: boolean;
  site: number | null;
  caught: boolean;
  caution: number;
  tip: Tip | null;
  revealedTruth: PendingTruth | null;
  sweep?: boolean;
  sweepFound?: boolean;
}

export interface PendingTruth {
  q: number;
  cheated: boolean;
  site: number | null;
  caught: boolean;
}

export interface FlipRecord {
  n: number;
  action: "comply" | number;
  delta: number;
  placement?: number[];
  caught?: boolean;
  ev?: number;
}

export interface FlipState {
  done: number;
  tally: number;
  log: FlipRecord[];
  policy: number[] | null;
}

export interface GameState {
  seed: number;
  rng: () => number;
  q: number;
  ewma: number[];
  hist: number[][];
  quartersLog: QuarterRecord[];
  pendingTruth: PendingTruth | null;
  quarterOpen: boolean;
  plan: EvaderPlan | null;
  tip: Tip | null;
  announced: number[] | null;
  deterred: boolean;
  covert: { exists: boolean; found: boolean; sweeps: number };
  flip: FlipState;
  finished: boolean;
}

export const CONFIG: IGConfig = {
  sites: [
    { id: "meridian", name: "Meridian Array", g: 25 },
    { id: "halcyon", name: "Halcyon Port Annex", g: 35 },
    { id: "cobalt", name: "Cobalt Ridge Fab", g: 45 },
    { id: "vantage", name: "Vantage Deepwater DC", g: 55 },
    { id: "aurelia", name: "Aurelia National Lab", g: 65 },
  ],
  F: 150, // fine when a diversion is caught
  k: 2, // inspection teams per quarter
  quarters: 10,
  manualQuarters: 5, // Q1..Q5 are hand-placed
  ewmaAlpha: 0.25, // evader belief update rate
  ewmaPrior: 0.4, // k / sites
  entropyWindow: 5, // last N placements feed the caution term
  cautionTax: 20, // EV tax per unit of normalized entropy
  tipChance: 0.5, // chance a tip arrives in a manual quarter
  tipsters: [
    { id: "broker", genuine: 0.6 },
    { id: "insider", genuine: 0.7 },
  ],
  announceCheatProb: 0.85, // if a weak policy is announced, evader acts this often
  sliderCap: 0.95,
  sweepChance: 0.4,
  flipQuarters: 3,
  seedDefault: 11,
};

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pStar(): number[] {
  return CONFIG.sites.map(function (s) {
    return s.g / (s.g + CONFIG.F);
  });
}

/* Normalized entropy (0..1) of site usage across the last `win` placements.
   Empty history reads as maximally unpredictable: 1. */
export function entropyOf(hist: number[][], win: number): number {
  const recent = hist.slice(-win);
  if (recent.length === 0) return 1;
  const counts = new Array(CONFIG.sites.length).fill(0);
  let total = 0;
  recent.forEach(function (pl) {
    pl.forEach(function (i) {
      counts[i]++;
      total++;
    });
  });
  if (total === 0) return 1;
  let H = 0;
  counts.forEach(function (c: number) {
    if (c > 0) {
      const q = c / total;
      H -= q * Math.log2(q);
    }
  });
  return H / Math.log2(CONFIG.sites.length);
}

/* Weighted sample of `n` distinct site indices, weights w (not all zero). */
export function sampleDistinct(
  rng: () => number,
  w: number[],
  n: number,
): number[] {
  const picked: number[] = [];
  let weights = w.slice();
  for (let d = 0; d < n; d++) {
    let sum = weights.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (sum <= 0) {
      // degenerate: fall back to uniform over the unpicked
      weights = weights.map(function (x, i) {
        return picked.indexOf(i) === -1 ? 1 : 0;
      });
      sum = weights.reduce(function (a, b) {
        return a + b;
      }, 0);
    }
    const r = rng() * sum;
    let acc = 0,
      chosen = -1;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r < acc) {
        chosen = i;
        break;
      }
    }
    if (chosen === -1)
      chosen = weights.findIndex(function (x) {
        return x > 0;
      });
    picked.push(chosen);
    weights[chosen] = 0;
  }
  return picked;
}

export function newGame(seed: number): GameState {
  return {
    seed: seed >>> 0,
    rng: mulberry32(seed >>> 0),
    q: 1, // current quarter, 1-based
    ewma: CONFIG.sites.map(function () {
      return CONFIG.ewmaPrior;
    }),
    hist: [], // placements per quarter: [siteIdx, siteIdx]
    quartersLog: [], // one record per resolved quarter
    pendingTruth: null, // truth of last quarter, revealed next quarter
    quarterOpen: false, // beginQuarter called, awaiting resolve
    plan: null, // evader plan for the open quarter
    tip: null, // tip for the open quarter
    announced: null, // slider vector once committed
    deterred: false,
    covert: { exists: false, found: false, sweeps: 0 },
    flip: { done: 0, tally: 0, log: [], policy: null },
    finished: false,
  };
}

/* Evader plan for a manual quarter. Beliefs are EWMA estimates of your
   per-site coverage; a caution tax scales with how unpredictable your
   recent placements look. */
function evaderPlan(st: GameState): EvaderPlan {
  const caution = entropyOf(st.hist, CONFIG.entropyWindow);
  let best = -1,
    bestEv = 0;
  const evs = CONFIG.sites.map(function (s, i) {
    const p = st.ewma[i];
    const ev = (1 - p) * s.g - p * CONFIG.F - caution * CONFIG.cautionTax;
    if (ev > bestEv) {
      bestEv = ev;
      best = i;
    }
    return ev;
  });
  return { cheat: best !== -1, site: best, evs: evs, caution: caution };
}

/* Tip generation. A tip claims to know this quarter's plan. Genuine tips
   report the truth (a site, or all-quiet); false tips name a random site. */
function drawTip(st: GameState, plan: EvaderPlan): Tip | null {
  if (st.rng() >= CONFIG.tipChance) return null;
  const tipster = CONFIG.tipsters[st.rng() < 0.5 ? 0 : 1];
  const genuine = st.rng() < tipster.genuine;
  let claim: TipClaim;
  if (genuine) {
    claim = plan.cheat ? { site: plan.site } : { quiet: true };
  } else {
    claim = { site: Math.floor(st.rng() * CONFIG.sites.length) };
  }
  return {
    tipster: tipster.id,
    reliability: tipster.genuine,
    genuine: genuine,
    claim: claim,
  };
}

/* Open a manual quarter: fixes the evader plan and any tip. */
export function beginQuarter(st: GameState): { tip: Tip | null } {
  if (st.quarterOpen) throw new Error("quarter already open");
  if (st.q > CONFIG.manualQuarters) throw new Error("manual phase is over");
  st.plan = evaderPlan(st);
  st.tip = drawTip(st, st.plan);
  st.quarterOpen = true;
  return { tip: st.tip };
}

function resolveCommon(
  st: GameState,
  placement: number[],
  mode: "manual" | "auto",
): QuarterRecord {
  const plan = st.plan!;
  const cheated = plan.cheat;
  const site = plan.site;
  const caught = cheated && placement.indexOf(site) !== -1;
  const rec: QuarterRecord = {
    q: st.q,
    mode: mode,
    placement: placement.slice(),
    cheated: cheated,
    site: cheated ? site : null,
    caught: caught,
    caution: plan.caution,
    tip: st.tip,
    revealedTruth: st.pendingTruth, // last quarter's truth, delivered now
  };
  // EWMA update: the evader watches where the teams went.
  st.ewma = st.ewma.map(function (p, i) {
    const x = placement.indexOf(i) !== -1 ? 1 : 0;
    return (1 - CONFIG.ewmaAlpha) * p + CONFIG.ewmaAlpha * x;
  });
  st.hist.push(placement.slice());
  st.pendingTruth = {
    q: st.q,
    cheated: cheated,
    site: cheated ? site : null,
    caught: caught,
  };
  st.quartersLog.push(rec);
  st.quarterOpen = false;
  st.plan = null;
  st.tip = null;
  st.q++;
  return rec;
}

/* Resolve a manual quarter with a chosen placement of k distinct sites. */
export function placeAndResolve(
  st: GameState,
  placement: number[],
): QuarterRecord {
  if (!st.quarterOpen) throw new Error("call beginQuarter first");
  if (placement.length !== CONFIG.k) throw new Error("need exactly k sites");
  if (new Set(placement).size !== placement.length)
    throw new Error("sites must be distinct");
  return resolveCommon(st, placement, "manual");
}

/* Commit an announced policy. Valid iff each 0..cap and the sum is k. */
export function announce(
  st: GameState,
  p: number[],
): { deterred: boolean; evs: number[] } {
  if (st.announced) throw new Error("already announced");
  if (p.length !== CONFIG.sites.length) throw new Error("bad vector");
  const sum = p.reduce(function (a, b) {
    return a + b;
  }, 0);
  if (Math.abs(sum - CONFIG.k) > 0.001) throw new Error("must sum to k");
  if (
    p.some(function (x) {
      return x < 0 || x > CONFIG.sliderCap + 1e-9;
    })
  )
    throw new Error("slider out of range");
  const evs = CONFIG.sites.map(function (s, i) {
    return (1 - p[i]) * s.g - p[i] * CONFIG.F;
  });
  st.announced = p.slice();
  st.deterred = evs.every(function (ev) {
    return ev <= 1e-9;
  });
  // A binding declared-site regime redirects the incentive rather than
  // erasing it: capital starts moving off the books.
  if (st.deterred) st.covert.exists = true;
  return { deterred: st.deterred, evs: evs };
}

/* Run one announced-policy quarter. opts.sweep diverts one team to hunt the
   undeclared site (allowed from Q8 once intel lands, and only while unfound). */
export function autoQuarter(
  st: GameState,
  opts?: { sweep?: boolean },
): QuarterRecord {
  opts = opts || {};
  if (!st.announced) throw new Error("announce first");
  if (st.q > CONFIG.quarters) throw new Error("game over");
  const sweeping =
    !!opts.sweep && st.q >= 8 && st.covert.exists && !st.covert.found;

  // Evader plan under an announced policy: the numbers are public, so there
  // is no estimation risk and no caution term.
  let plan: EvaderPlan;
  if (st.deterred) {
    plan = { cheat: false, site: -1, caution: 0 };
  } else {
    let best = -1,
      bestEv = 0;
    CONFIG.sites.forEach(function (s, i) {
      const ev = (1 - st.announced![i]) * s.g - st.announced![i] * CONFIG.F;
      if (ev > bestEv) {
        bestEv = ev;
        best = i;
      }
    });
    const acts = best !== -1 && st.rng() < CONFIG.announceCheatProb;
    plan = { cheat: acts, site: acts ? best : -1, caution: 0 };
  }
  st.plan = plan;
  st.tip = null;
  st.quarterOpen = true;

  const teams = sweeping ? CONFIG.k - 1 : CONFIG.k;
  const placement = sampleDistinct(st.rng, st.announced, teams);
  let sweepFound = false;
  if (sweeping) {
    st.covert.sweeps++;
    sweepFound = st.rng() < CONFIG.sweepChance;
    if (sweepFound) st.covert.found = true;
  }
  const rec = resolveCommon(st, placement, "auto");
  rec.sweep = sweeping;
  rec.sweepFound = sweepFound;
  if (st.q > CONFIG.quarters) st.finished = true;
  return rec;
}

/* Role flip: the machine inspector announces optimal marginals, scaled so
   every site sits strictly above its deterrence threshold. */
export function flipPolicy(): number[] {
  const ps = pStar();
  const total = ps.reduce(function (a, b) {
    return a + b;
  }, 0);
  return ps.map(function (p) {
    return (p * CONFIG.k) / total;
  });
}

export function flipChoice(
  st: GameState,
  action: "comply" | number,
): FlipRecord {
  if (st.flip.done >= CONFIG.flipQuarters) throw new Error("flip over");
  if (!st.flip.policy) st.flip.policy = flipPolicy();
  const q = st.flip.policy;
  const rec: FlipRecord = { n: st.flip.done + 1, action: action, delta: 0 };
  if (action === "comply") {
    rec.delta = 0;
  } else {
    const i = action;
    if (typeof i !== "number" || i < 0 || i >= CONFIG.sites.length)
      throw new Error("bad action");
    const placement = sampleDistinct(st.rng, q, CONFIG.k);
    rec.placement = placement;
    rec.caught = placement.indexOf(i) !== -1;
    rec.delta = rec.caught ? -CONFIG.F : CONFIG.sites[i].g;
    rec.ev = (1 - q[i]) * CONFIG.sites[i].g - q[i] * CONFIG.F;
  }
  st.flip.tally += rec.delta;
  st.flip.log.push(rec);
  st.flip.done++;
  return rec;
}

/* ---------- headless simulation ---------- */
/* policy: 'uniform' | 'greedy-pair' | 'rotate' | function(state) -> [i,j]
   announceVec: vector for Q6, defaults to a deterring one.
   sweepFrom8: divert a team from Q8 while the covert site is unfound. */
export interface SimulateOpts {
  policy?: string | ((s: GameState) => number[]);
  announceVec?: number[];
  sweepFrom8?: boolean;
  flipAction?: "comply" | number;
}

export interface SimulateResult {
  seed: number;
  quarters: QuarterRecord[];
  announced: number[] | null;
  deterred: boolean;
  announceEvs: number[];
  covert: { exists: boolean; found: boolean; sweeps: number };
  flip: FlipState;
  cheats: number;
  catches: number;
}

export function __simulate(
  seed: number | null | undefined,
  opts?: SimulateOpts,
): SimulateResult {
  opts = opts || {};
  const st = newGame(seed == null ? CONFIG.seedDefault : seed);
  const pickers: Record<string, (s: GameState) => number[]> = {
    uniform: function (s) {
      return sampleDistinct(s.rng, [1, 1, 1, 1, 1], CONFIG.k);
    },
    "greedy-pair": function () {
      return [3, 4];
    },
    rotate: function (s) {
      const b = (s.q - 1) % CONFIG.sites.length;
      return [b, (b + 1) % CONFIG.sites.length];
    },
  };
  const pick =
    typeof opts.policy === "function"
      ? opts.policy
      : pickers[opts.policy as string] || pickers["uniform"];
  while (st.q <= CONFIG.manualQuarters) {
    beginQuarter(st);
    placeAndResolve(st, pick(st));
  }
  let vec = opts.announceVec;
  if (!vec) {
    const ps = pStar();
    const total = ps.reduce(function (a, b) {
      return a + b;
    }, 0);
    vec = ps.map(function (p) {
      return (p * CONFIG.k) / total;
    });
  }
  const ann = announce(st, vec);
  while (st.q <= CONFIG.quarters) {
    autoQuarter(st, { sweep: !!opts.sweepFrom8 && st.q >= 8 });
  }
  for (let f = 0; f < CONFIG.flipQuarters; f++) {
    flipChoice(st, opts.flipAction != null ? opts.flipAction : "comply");
  }
  return {
    seed: st.seed,
    quarters: st.quartersLog,
    announced: st.announced,
    deterred: st.deterred,
    announceEvs: ann.evs,
    covert: st.covert,
    flip: st.flip,
    cheats: st.quartersLog.filter(function (r) {
      return r.cheated;
    }).length,
    catches: st.quartersLog.filter(function (r) {
      return r.caught;
    }).length,
  };
}

/* ---------- self-tests (engine half; the page adds DOM checks) ---------- */
export interface TestResult {
  name: string;
  pass: boolean;
}

export function __runTests(): {
  pass: number;
  fail: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];
  const assert = function (name: string, cond: unknown) {
    results.push({ name: name, pass: !!cond });
    if (typeof console !== "undefined")
      console[cond ? "log" : "error"](
        (cond ? "PASS" : "FAIL") + " - " + name,
      );
  };
  const ps = pStar();

  assert(
    "p* matches G/(G+F) per site",
    ps.every(function (p, i) {
      return (
        Math.abs(
          p - CONFIG.sites[i].g / (CONFIG.sites[i].g + CONFIG.F),
        ) < 1e-12
      );
    }),
  );
  assert(
    "deterring every site is affordable: sum p* < k",
    ps.reduce(function (a, b) {
      return a + b;
    }, 0) < CONFIG.k,
  );

  // determinism
  const a = __simulate(42, { policy: "rotate" });
  const b = __simulate(42, { policy: "rotate" });
  assert("same seed, same transcript", JSON.stringify(a) === JSON.stringify(b));
  const c = __simulate(43, { policy: "rotate" });
  assert(
    "different seed, different transcript",
    JSON.stringify(a) !== JSON.stringify(c),
  );

  // EWMA direction
  const st = newGame(1);
  beginQuarter(st);
  placeAndResolve(st, [0, 1]);
  assert(
    "EWMA rises where inspected, decays where not",
    st.ewma[0] > CONFIG.ewmaPrior &&
      st.ewma[1] > CONFIG.ewmaPrior &&
      st.ewma[2] < CONFIG.ewmaPrior,
  );

  // entropy
  assert("empty history reads as max caution", entropyOf([], 5) === 1);
  const constant = [
    [3, 4],
    [3, 4],
    [3, 4],
    [3, 4],
    [3, 4],
  ];
  const spread = [
    [0, 1],
    [2, 3],
    [4, 0],
    [1, 2],
    [3, 4],
  ];
  assert(
    "constant placement scores low entropy, spread scores high",
    entropyOf(constant, 5) < 0.5 && entropyOf(spread, 5) > 0.9,
  );

  // announcement: a deterring vector deters, for any seed
  const det = [0.2, 0.25, 0.35, 0.5, 0.7];
  const evsOk = (function () {
    const s2 = newGame(7);
    for (let i = 0; i < CONFIG.manualQuarters; i++) {
      beginQuarter(s2);
      placeAndResolve(s2, [i % 5, (i + 1) % 5]);
    }
    const r = announce(s2, det);
    return (
      r.deterred &&
      r.evs.every(function (e) {
        return e <= 1e-9;
      })
    );
  })();
  assert(
    "announced vector above every p* deters (all EV at or below 0)",
    evsOk,
  );

  // announcement: leaving the top site uncovered invites it
  let weakHit = 0;
  const weakN = 40;
  for (let w = 0; w < weakN; w++) {
    const sw = newGame(100 + w);
    for (let i2 = 0; i2 < CONFIG.manualQuarters; i2++) {
      beginQuarter(sw);
      placeAndResolve(sw, [0, 1]);
    }
    announce(sw, [0.5, 0.5, 0.5, 0.5, 0]);
    const rq = autoQuarter(sw, {});
    if (rq.cheated && rq.site === 4) weakHit++;
  }
  assert(
    "a hole in the announced policy gets exploited at the exposed site",
    weakHit / weakN > 0.6,
  );

  // predictable play gets punished; the cheat lands off the covered pair
  let exploited = 0,
    offPair = true;
  const runs = 50;
  for (let s3 = 0; s3 < runs; s3++) {
    const t = __simulate(200 + s3, { policy: "greedy-pair" });
    const manualCheats = t.quarters.filter(function (r) {
      return r.mode === "manual" && r.cheated;
    });
    if (manualCheats.length > 0) exploited++;
    manualCheats.forEach(function (r) {
      if (r.site === 3 || r.site === 4) offPair = false;
    });
  }
  assert(
    "camping two sites gets exploited in most runs",
    exploited / runs > 0.8,
  );
  assert("the exploit lands on an uncovered site", offPair);

  // deterrence economics: cheating into sound coverage loses on average
  let net = 0;
  const nlong = 200;
  for (let s4 = 0; s4 < nlong; s4++) {
    const t2 = __simulate(400 + s4, { policy: "uniform" });
    t2.quarters.forEach(function (r) {
      if (r.mode !== "manual" || !r.cheated) return;
      net += r.caught ? -CONFIG.F : CONFIG.sites[r.site!].g;
    });
  }
  assert(
    "across many runs, gambling against uniform coverage nets the evader a loss",
    net < 0,
  );

  // tips
  const draws: Record<string, [number, number]> = {
    broker: [0, 0],
    insider: [0, 0],
  };
  const stT = newGame(9);
  for (let d = 0; d < 6000; d++) {
    const tip = drawTip(stT, { cheat: true, site: 2, caution: 0 });
    if (!tip) continue;
    draws[tip.tipster][0]++;
    if (tip.genuine) draws[tip.tipster][1]++;
  }
  const rb = draws.broker[1] / draws.broker[0],
    ri = draws.insider[1] / draws.insider[0];
  assert("broker tips run about 60 percent genuine", Math.abs(rb - 0.6) < 0.05);
  assert(
    "insider tips run about 70 percent genuine",
    Math.abs(ri - 0.7) < 0.05,
  );

  // truth lag
  const stL = newGame(5);
  beginQuarter(stL);
  const r1 = placeAndResolve(stL, [0, 1]);
  assert("quarter 1 reveals no prior truth", r1.revealedTruth === null);
  beginQuarter(stL);
  const r2 = placeAndResolve(stL, [2, 3]);
  assert(
    "quarter 2 delivers quarter 1 ground truth",
    !!r2.revealedTruth && r2.revealedTruth.q === 1,
  );

  // sweep rate
  let found = 0;
  const trials = 3000,
    rngS = mulberry32(77);
  for (let s5 = 0; s5 < trials; s5++) {
    if (rngS() < CONFIG.sweepChance) found++;
  }
  assert(
    "sweep odds sit at 40 percent",
    Math.abs(found / trials - CONFIG.sweepChance) < 0.03,
  );
  const covertRun = __simulate(31, { policy: "uniform", sweepFrom8: true });
  assert(
    "a deterring announcement spawns the covert project",
    covertRun.deterred && covertRun.covert.exists,
  );
  assert(
    "sweeping consumes a declared team",
    covertRun.quarters.some(function (r) {
      return r.sweep && r.placement.length === CONFIG.k - 1;
    }),
  );

  // role flip
  const q = flipPolicy();
  const qsum = q.reduce(function (x, y) {
    return x + y;
  }, 0);
  assert("flip policy spends exactly k teams", Math.abs(qsum - CONFIG.k) < 1e-9);
  assert(
    "flip policy clears every deterrence threshold",
    q.every(function (x, i) {
      return x > ps[i];
    }),
  );
  assert(
    "every cheat in the flip is EV-negative",
    CONFIG.sites.every(function (s, i) {
      return (1 - q[i]) * s.g - q[i] * CONFIG.F < 0;
    }),
  );
  const stF = newGame(3);
  stF.flip.policy = null;
  const fr = flipChoice(stF, "comply");
  assert("complying in the flip costs nothing", fr.delta === 0);

  // guards
  let threw = false;
  try {
    const stG = newGame(2);
    beginQuarter(stG);
    beginQuarter(stG);
  } catch {
    threw = true;
  }
  assert("double beginQuarter throws", threw);
  threw = false;
  try {
    const stG2 = newGame(2);
    beginQuarter(stG2);
    placeAndResolve(stG2, [1, 1]);
  } catch {
    threw = true;
  }
  assert("duplicate sites rejected", threw);
  threw = false;
  try {
    const stG3 = newGame(2);
    announce(stG3, [1, 1, 0, 0, 0.5]);
  } catch {
    threw = true;
  }
  assert("announcement must sum to k", threw);
  threw = false;
  try {
    const stG4 = newGame(2);
    announce(stG4, [0.96, 0.5, 0.24, 0.2, 0.1]);
  } catch {
    threw = true;
  }
  assert("slider cap enforced", threw);

  const pass = results.filter(function (r) {
    return r.pass;
  }).length;
  return { pass: pass, fail: results.length - pass, results: results };
}

export const IG = {
  CONFIG,
  pStar,
  entropyOf,
  mulberry32,
  newGame,
  beginQuarter,
  placeAndResolve,
  announce,
  autoQuarter,
  flipPolicy,
  flipChoice,
  sampleDistinct,
  __simulate,
  __runTests,
};
