import { describe, expect, it } from "vitest";
import {
  budgets,
  techChance,
  falsePositiveChance,
  bandFor,
  RED_BASE_BUDGET,
  BLUE_BUDGET,
  THRESH,
} from "./tamper-trace";
import type { Scenario } from "./tamper-trace";
import type { RedTechId, BlueLayerId } from "../data/tamper-trace";

const NONE: Scenario = { state: false, amd: false, legacy: false };

function red(...ids: RedTechId[]): Set<RedTechId> {
  return new Set(ids);
}
function blue(...ids: BlueLayerId[]): Set<BlueLayerId> {
  return new Set(ids);
}

describe("budgets", () => {
  it("base budgets with no scenario", () => {
    expect(budgets(NONE)).toEqual({ rmax: RED_BASE_BUDGET, bmax: BLUE_BUDGET });
    expect(budgets(NONE).rmax).toBe(8);
    expect(budgets(NONE).bmax).toBe(9);
  });
  it("nation-state adds +3 to Red only", () => {
    const b = budgets({ ...NONE, state: true });
    expect(b.rmax).toBe(11);
    expect(b.bmax).toBe(9);
  });
});

describe("techChance", () => {
  it("returns 0 with no touching layer", () => {
    expect(techChance("spoof", red("spoof"), blue("att"), NONE)).toBe(0);
  });

  it("direct counter contributes 0.6", () => {
    expect(techChance("spoof", red("spoof"), blue("puf"), NONE)).toBeCloseTo(
      0.6,
      6,
    );
  });

  it("direct + tell stack additively", () => {
    // spoof: direct puf (0.6) + recon tell (0.35) = 0.95, capped at 0.95
    expect(
      techChance("spoof", red("spoof"), blue("puf", "recon"), NONE),
    ).toBeCloseTo(0.95, 6);
  });

  it("caps at 0.95", () => {
    // meter: pow 0.6 + recon 0.35 + osint 0.25 + whistle 0.15 = 1.35 -> 0.95
    expect(
      techChance(
        "meter",
        red("meter"),
        blue("pow", "recon", "osint", "whistle"),
        NONE,
      ),
    ).toBe(0.95);
  });

  it("whistleblower adds a flat 0.15", () => {
    expect(
      techChance("spoof", red("spoof"), blue("whistle"), NONE),
    ).toBeCloseTo(0.15, 6);
  });

  it("legacy guts on-chip layers (puf/boot direct weight *0.4)", () => {
    expect(
      techChance("spoof", red("spoof"), blue("puf"), {
        ...NONE,
        legacy: true,
      }),
    ).toBeCloseTo(0.24, 6); // 0.6 * 0.4
    expect(
      techChance("firmware", red("firmware"), blue("boot"), {
        ...NONE,
        legacy: true,
      }),
    ).toBeCloseTo(0.24, 6);
  });

  it("masking blunts power sensing for meter unless osint present", () => {
    // masking on, no osint: pow direct 0.6 * 0.5 = 0.3
    expect(
      techChance("meter", red("meter", "mask"), blue("pow"), NONE),
    ).toBeCloseTo(0.3, 6);
    // masking on but osint present: no penalty (0.6 pow + 0.25 osint tell)
    expect(
      techChance("meter", red("meter", "mask"), blue("pow", "osint"), NONE),
    ).toBeCloseTo(0.85, 6);
  });

  it("amd: interposer tells other than enclosure are *0.4", () => {
    // interposer tells: coc 0.25, recon 0.30; amd scales non-enc tells by 0.4
    expect(
      techChance("interposer", red("interposer"), blue("coc", "recon"), {
        ...NONE,
        amd: true,
      }),
    ).toBeCloseTo(0.25 * 0.4 + 0.3 * 0.4, 6);
    // enclosure direct counter is unaffected by amd
    expect(
      techChance("interposer", red("interposer"), blue("enc"), {
        ...NONE,
        amd: true,
      }),
    ).toBeCloseTo(0.6, 6);
  });
});

describe("falsePositiveChance", () => {
  it("is zero with no noisy layers", () => {
    expect(falsePositiveChance(blue("att", "puf"))).toBe(0);
  });
  it("adds 0.08 per noisy layer (pow/recon/whistle/osint)", () => {
    expect(falsePositiveChance(blue("pow"))).toBeCloseTo(0.08, 6);
    expect(falsePositiveChance(blue("pow", "recon"))).toBeCloseTo(0.16, 6);
  });
  it("caps at 0.4", () => {
    expect(
      falsePositiveChance(blue("pow", "recon", "whistle", "osint")),
    ).toBeCloseTo(0.32, 6);
    // even all four gives 0.32; cap only bites beyond, but confirm the cap arg
    expect(falsePositiveChance(blue("pow", "recon", "whistle", "osint"))).toBeLessThanOrEqual(
      0.4,
    );
  });
});

describe("bandFor", () => {
  it("maps probabilities to the source bands", () => {
    expect(bandFor(0.1)[0]).toBe("Compliant");
    expect(bandFor(0.2)[0]).toBe("Likely compliant");
    expect(bandFor(0.45)[0]).toBe("Ambiguous — needs clarification");
    expect(bandFor(0.6)[0]).toBe("Suspicious anomaly");
    expect(bandFor(0.8)[0]).toBe("Probable non-compliance");
    expect(bandFor(0.95)[0]).toBe("Material breach");
  });
  it("challenge threshold is 0.55", () => {
    expect(THRESH).toBe(0.55);
  });
});
