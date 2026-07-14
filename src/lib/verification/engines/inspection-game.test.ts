/**
 * Ported from the `__runTests` self-test suite in the source
 * public/verification/inspection-game.html (`<script id="ig-engine">`). Every
 * assertion is the same check as the original; expect all to pass. These pin
 * the engine's calibration (p*, EWMA direction, entropy, deterrence economics,
 * tip reliability, truth lag, sweep odds, role flip, and guards).
 */
import { describe, it, expect } from "vitest";
import {
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
  __simulate,
  __runTests,
} from "./inspection-game";

describe("inspection-game engine", () => {
  const ps = pStar();

  it("p* matches G/(G+F) per site", () => {
    expect(
      ps.every(
        (p, i) =>
          Math.abs(p - CONFIG.sites[i].g / (CONFIG.sites[i].g + CONFIG.F)) <
          1e-12,
      ),
    ).toBe(true);
  });

  it("deterring every site is affordable: sum p* < k", () => {
    expect(ps.reduce((a, b) => a + b, 0)).toBeLessThan(CONFIG.k);
  });

  it("same seed, same transcript", () => {
    const a = __simulate(42, { policy: "rotate" });
    const b = __simulate(42, { policy: "rotate" });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("different seed, different transcript", () => {
    const a = __simulate(42, { policy: "rotate" });
    const c = __simulate(43, { policy: "rotate" });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it("EWMA rises where inspected, decays where not", () => {
    const st = newGame(1);
    beginQuarter(st);
    placeAndResolve(st, [0, 1]);
    expect(st.ewma[0]).toBeGreaterThan(CONFIG.ewmaPrior);
    expect(st.ewma[1]).toBeGreaterThan(CONFIG.ewmaPrior);
    expect(st.ewma[2]).toBeLessThan(CONFIG.ewmaPrior);
  });

  it("empty history reads as max caution", () => {
    expect(entropyOf([], 5)).toBe(1);
  });

  it("constant placement scores low entropy, spread scores high", () => {
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
    expect(entropyOf(constant, 5)).toBeLessThan(0.5);
    expect(entropyOf(spread, 5)).toBeGreaterThan(0.9);
  });

  it("announced vector above every p* deters (all EV at or below 0)", () => {
    const det = [0.2, 0.25, 0.35, 0.5, 0.7];
    const s2 = newGame(7);
    for (let i = 0; i < CONFIG.manualQuarters; i++) {
      beginQuarter(s2);
      placeAndResolve(s2, [i % 5, (i + 1) % 5]);
    }
    const r = announce(s2, det);
    expect(r.deterred).toBe(true);
    expect(r.evs.every((e) => e <= 1e-9)).toBe(true);
  });

  it("a hole in the announced policy gets exploited at the exposed site", () => {
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
    expect(weakHit / weakN).toBeGreaterThan(0.6);
  });

  it("camping two sites gets exploited in most runs, and the exploit lands off the covered pair", () => {
    let exploited = 0,
      offPair = true;
    const runs = 50;
    for (let s3 = 0; s3 < runs; s3++) {
      const t = __simulate(200 + s3, { policy: "greedy-pair" });
      const manualCheats = t.quarters.filter(
        (r) => r.mode === "manual" && r.cheated,
      );
      if (manualCheats.length > 0) exploited++;
      manualCheats.forEach((r) => {
        if (r.site === 3 || r.site === 4) offPair = false;
      });
    }
    expect(exploited / runs).toBeGreaterThan(0.8);
    expect(offPair).toBe(true);
  });

  it("across many runs, gambling against uniform coverage nets the evader a loss", () => {
    let net = 0;
    const nlong = 200;
    for (let s4 = 0; s4 < nlong; s4++) {
      const t2 = __simulate(400 + s4, { policy: "uniform" });
      t2.quarters.forEach((r) => {
        if (r.mode !== "manual" || !r.cheated) return;
        net += r.caught ? -CONFIG.F : CONFIG.sites[r.site!].g;
      });
    }
    expect(net).toBeLessThan(0);
  });

  it("broker tips run about 60 percent genuine, insider about 70 percent", () => {
    // drawTip is module-private; exercise it through beginQuarter's tip draw is
    // not deterministic enough, so replicate the original's direct sampling by
    // running many manual quarters and reading the tip reliability field.
    const draws: Record<string, [number, number]> = {
      broker: [0, 0],
      insider: [0, 0],
    };
    // Reproduce the original loop exactly by re-seeding a game and pulling tips.
    // We can't call drawTip directly (private), so we drive many fresh games'
    // first quarters; each begin draws at most one tip.
    let pulled = 0;
    let g = 0;
    while (pulled < 6000 && g < 200000) {
      const st = newGame(9 + g);
      const res = beginQuarter(st);
      g++;
      if (!res.tip) continue;
      draws[res.tip.tipster][0]++;
      if (res.tip.genuine) draws[res.tip.tipster][1]++;
      pulled++;
    }
    const rb = draws.broker[1] / draws.broker[0];
    const ri = draws.insider[1] / draws.insider[0];
    expect(Math.abs(rb - 0.6)).toBeLessThan(0.05);
    expect(Math.abs(ri - 0.7)).toBeLessThan(0.05);
  });

  it("truth lag: quarter 1 reveals nothing, quarter 2 delivers quarter 1 truth", () => {
    const stL = newGame(5);
    beginQuarter(stL);
    const r1 = placeAndResolve(stL, [0, 1]);
    expect(r1.revealedTruth).toBeNull();
    beginQuarter(stL);
    const r2 = placeAndResolve(stL, [2, 3]);
    expect(r2.revealedTruth).not.toBeNull();
    expect(r2.revealedTruth!.q).toBe(1);
  });

  it("sweep odds sit at 40 percent", () => {
    let found = 0;
    const trials = 3000,
      rngS = mulberry32(77);
    for (let s5 = 0; s5 < trials; s5++) {
      if (rngS() < CONFIG.sweepChance) found++;
    }
    expect(Math.abs(found / trials - CONFIG.sweepChance)).toBeLessThan(0.03);
  });

  it("a deterring announcement spawns the covert project and sweeping consumes a declared team", () => {
    const covertRun = __simulate(31, { policy: "uniform", sweepFrom8: true });
    expect(covertRun.deterred).toBe(true);
    expect(covertRun.covert.exists).toBe(true);
    expect(
      covertRun.quarters.some(
        (r) => r.sweep && r.placement.length === CONFIG.k - 1,
      ),
    ).toBe(true);
  });

  it("flip policy spends exactly k teams, clears every threshold, is EV-negative", () => {
    const q = flipPolicy();
    const qsum = q.reduce((x, y) => x + y, 0);
    expect(Math.abs(qsum - CONFIG.k)).toBeLessThan(1e-9);
    expect(q.every((x, i) => x > ps[i])).toBe(true);
    expect(
      CONFIG.sites.every((s, i) => (1 - q[i]) * s.g - q[i] * CONFIG.F < 0),
    ).toBe(true);
  });

  it("complying in the flip costs nothing", () => {
    const stF = newGame(3);
    stF.flip.policy = null;
    const fr = flipChoice(stF, "comply");
    expect(fr.delta).toBe(0);
  });

  it("double beginQuarter throws", () => {
    const stG = newGame(2);
    beginQuarter(stG);
    expect(() => beginQuarter(stG)).toThrow();
  });

  it("duplicate sites rejected", () => {
    const stG2 = newGame(2);
    beginQuarter(stG2);
    expect(() => placeAndResolve(stG2, [1, 1])).toThrow();
  });

  it("announcement must sum to k", () => {
    const stG3 = newGame(2);
    expect(() => announce(stG3, [1, 1, 0, 0, 0.5])).toThrow();
  });

  it("slider cap enforced", () => {
    const stG4 = newGame(2);
    expect(() => announce(stG4, [0.96, 0.5, 0.24, 0.2, 0.1])).toThrow();
  });

  it("the full ported __runTests suite passes with zero failures", () => {
    const r = __runTests();
    expect(r.fail).toBe(0);
    expect(r.pass).toBe(r.results.length);
  });
});
