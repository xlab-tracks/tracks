import { describe, expect, it } from "vitest";
import {
  CONFIG,
  basePayoffs,
  classify,
  effPayoffs,
  equilibria,
  type LabState,
  pacMove,
  repeatMultiplier,
  repeatedVerdict,
} from "./change-the-game";

/**
 * Port of the source page's __runTests harness
 * (public/verification/change-the-game.html, lines ~643-737). Demonstrates the
 * five-round personalities, the QA classification anchors, tie handling, and
 * repeated-play monotonicity.
 */

const lab = (o: Partial<LabState>): LabState =>
  Object.assign(
    { v: 75, c: 25, share: false, agreement: true, p: 0, F: 40, delta: 0 },
    o,
  );

describe("personalities", () => {
  it("cautious: restrains, then races forever after betrayal", () => {
    const mem = { betrayed: false };
    const seq: string[] = [];
    (["race", "restrain", "restrain"] as const).forEach((you) => {
      seq.push(pacMove("cautious", mem, { p: 0 }));
      mem.betrayed = mem.betrayed || you === "race";
    });
    expect(seq.join()).toBe("restrain,race,race");
  });

  it("cautious: restrains every round if never betrayed", () => {
    const mem = { betrayed: false };
    const seq: string[] = [];
    for (let i = 0; i < 5; i++) seq.push(pacMove("cautious", mem, { p: 0 }));
    expect(seq.every((m) => m === "restrain")).toBe(true);
  });

  it("opportunist: races when it expects no one is watching (p=0)", () => {
    expect(pacMove("opportunist", {}, { p: 0 })).toBe("race");
  });

  it("opportunist: restrains when it expects to be caught (p=0.7)", () => {
    expect(pacMove("opportunist", {}, { p: 0.7 })).toBe("restrain");
  });

  it("mirror: plays your previous move", () => {
    expect(pacMove("mirror", {}, { lastYou: "race" })).toBe("race");
    expect(pacMove("mirror", {}, { lastYou: "restrain" })).toBe("restrain");
  });

  it("mirror: defaults to restrain with no history", () => {
    expect(pacMove("mirror", {}, { lastYou: null })).toBe(CONFIG.mirrorDefault);
  });
});

describe("classification anchors (QA checklist)", () => {
  const famOf = (o: Partial<LabState>) => classify(effPayoffs(lab(o))).fam;

  it("QA: baseline is Prisoner's Dilemma", () => {
    expect(famOf({})).toBe("pd");
  });

  it("QA: p=0.7, F=40 at baseline is Assurance Game", () => {
    expect(famOf({ p: 0.7 })).toBe("assurance");
  });

  it("hawk preset at p=0 is Prisoner's Dilemma", () => {
    expect(famOf(CONFIG.presets.hawk)).toBe("pd");
  });

  it("dove preset at p=0 is Harmony", () => {
    expect(famOf(CONFIG.presets.dove)).toBe("harmony");
  });

  it("high v + high c, no sharing is Chicken", () => {
    expect(famOf({ v: 90, c: 85 })).toBe("chicken");
  });

  it("agreement off ignores p and F", () => {
    expect(
      JSON.stringify(effPayoffs(lab({ agreement: false, p: 0.9, F: 100 }))),
    ).toBe(
      JSON.stringify(
        Object.assign({}, basePayoffs(lab({})), { transformed: false }),
      ),
    );
  });
});

describe("tie handling", () => {
  it("tie T=R flags knife edge (nearest family shown)", () => {
    const r = classify({ R: 40, T: 40, S: -60, P: -12.5 });
    expect(r.knife).toBe(true);
    expect(r.fam).toBe("pd");
  });

  it("tie P=S flags knife edge", () => {
    const r = classify({ R: 40, T: 65, S: -12.5, P: -12.5 });
    expect(r.knife).toBe(true);
    expect(r.fam).toBe("pd");
  });

  it("tie highlights both boundary equilibria", () => {
    const e = { R: 40, T: 40, S: -60, P: -12.5 };
    expect(equilibria(e).length).toBeGreaterThanOrEqual(2);
  });
});

describe("repeated play", () => {
  const costOf = (delta: number, p: number, RP: number) =>
    repeatMultiplier(delta, p) * RP;

  it("future cost non-decreasing in delta", () => {
    let ok = true;
    for (const p of [0, 0.25, 0.6, 1]) {
      let prev = -Infinity;
      for (let d = 0; d <= 0.951; d += 0.05) {
        const c0 = costOf(Math.min(d, 0.95), p, 52.5);
        if (c0 < prev - 1e-9) ok = false;
        prev = c0;
      }
    }
    expect(ok).toBe(true);
  });

  it("future cost non-decreasing in p", () => {
    let ok = true;
    for (const d of [0, 0.3, 0.7, 0.95]) {
      let prev = -Infinity;
      for (let p = 0; p <= 1.001; p += 0.05) {
        const c0 = costOf(d, Math.min(p, 1), 52.5);
        if (c0 < prev - 1e-9) ok = false;
        prev = c0;
      }
    }
    expect(ok).toBe(true);
  });

  it("future cost non-decreasing in (R - P)", () => {
    let ok = true;
    let prev = -Infinity;
    for (let RP = 0; RP <= 120; RP += 10) {
      const c0 = costOf(0.6, 0.5, RP);
      if (c0 < prev - 1e-9) ok = false;
      prev = c0;
    }
    expect(ok).toBe(true);
  });

  it("p=0: cooperation never sustainable for any delta < 0.95 at defaults", () => {
    let allNo = true;
    for (let d = 0; d < 0.95; d += 0.05) {
      const e = effPayoffs(lab({}));
      if (repeatedVerdict(e, d, 0).sustainable) allNo = false;
    }
    expect(allNo).toBe(true);
  });
});
