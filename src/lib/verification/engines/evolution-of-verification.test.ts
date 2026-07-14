import { describe, expect, it } from "vitest";
import { runTests } from "./evolution-of-verification";

/**
 * Ports the engine's inline `runTests` harness (the same checks surfaced by
 * `?debug=1` on the original standalone page) into Vitest. Each named check
 * from the engine becomes its own assertion so a regression names itself.
 */
describe("evolution-of-verification engine", () => {
  const results = runTests();

  it("emits every calibration/unit check", () => {
    expect(results.length).toBeGreaterThan(0);
  });

  for (const r of runTests()) {
    it(r.name, () => {
      expect(r.pass).toBe(true);
    });
  }
});
