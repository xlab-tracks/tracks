import { describe, expect, it } from "vitest";
import { CARDS } from "@/lib/verification/data/anatomy-drill";
import { applyDrop, resolveDrop } from "./anatomy-drill";

/**
 * The source page (public/verification/anatomy-drill.html) ships no __runTests
 * harness, so these pin the two pure decisions its `resolveDrop` / `handleDrop`
 * make — including the deliberate oddities ("lessons, not bugs"): a correct or
 * defensible tag AFTER a wrong attempt still records as a miss, and a second
 * wrong attempt auto-files and reveals.
 */

// Named specimens by their known organ for readable cases.
const ruleCard = CARDS[0]; // organ 1 (rule), wrong:{3}, generic
const evidNearCard = CARDS[1]; // organ 3 (evidence), near:{6}
const nullCard = CARDS[2]; // organ 0, wrong:{3,1}
const advNearCard = CARDS[10]; // organ 5 (adversary), near:{1}

describe("resolveDrop", () => {
  it("returns clean on an exact organ match", () => {
    expect(resolveDrop(ruleCard, 1)).toEqual({ kind: "clean" });
    expect(resolveDrop(nullCard, 0)).toEqual({ kind: "clean" });
  });

  it("returns a near tag for a defensible second-best bin", () => {
    const r = resolveDrop(evidNearCard, 6);
    expect(r.kind).toBe("near");
    expect(r.msg).toBe(evidNearCard.near![6]);
  });

  it("uses the tailored wrong message when one exists", () => {
    const r = resolveDrop(ruleCard, 3);
    expect(r.kind).toBe("bad");
    expect(r.msg).toBe(ruleCard.wrong![3]);
  });

  it("falls back to the generic message for an untailored wrong bin", () => {
    const r = resolveDrop(ruleCard, 5);
    expect(r.kind).toBe("bad");
    expect(r.msg).toBe(ruleCard.generic);
  });
});

describe("applyDrop", () => {
  it("clean on first attempt records a clean result", () => {
    const o = applyDrop(ruleCard, 1, 0);
    expect(o).toMatchObject({
      kind: "good",
      result: "clean",
      resolved: true,
      autoPlaced: false,
      attempts: 0,
    });
    expect(o.msg).toBe(ruleCard.ok);
  });

  it("near on first attempt records a near result and auto-places", () => {
    const o = applyDrop(evidNearCard, 6, 0);
    expect(o).toMatchObject({
      kind: "near",
      result: "near",
      resolved: true,
      autoPlaced: true,
    });
    expect(o.msg).toBe(evidNearCard.near![6]);
  });

  it("first wrong attempt is a non-resolving retry", () => {
    const o = applyDrop(ruleCard, 3, 0);
    expect(o).toMatchObject({
      kind: "retry",
      result: null,
      resolved: false,
      attempts: 1,
    });
    expect(o.msg).toBe(ruleCard.wrong![3]);
  });

  it("second wrong attempt reveals, auto-files, and records a miss", () => {
    const o = applyDrop(ruleCard, 5, 1);
    expect(o).toMatchObject({
      kind: "reveal",
      result: "miss",
      resolved: true,
      autoPlaced: true,
      attempts: 2,
    });
    expect(o.msg).toBe(ruleCard.generic);
  });

  it("clean AFTER a prior wrong attempt still records a miss (lesson, not bug)", () => {
    const o = applyDrop(ruleCard, 1, 1);
    expect(o).toMatchObject({ kind: "good-after", result: "miss" });
  });

  it("near AFTER a prior wrong attempt also records a miss", () => {
    const o = applyDrop(advNearCard, 1, 1);
    expect(o).toMatchObject({ kind: "near", result: "miss" });
  });
});
