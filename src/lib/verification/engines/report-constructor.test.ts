import { describe, expect, it } from "vitest";
import {
  CARDS,
  CONFIG,
  NEEDS,
  READERS,
  evaluate,
  fitsOf,
  isTrap,
  threadTotal,
  type ThreadMap,
} from "./report-constructor";
import { TAGS, cardById, type ReaderId } from "../data/report-constructor";

/**
 * Ported from the standalone page's `__runTests` (public/verification/
 * report-constructor.html, ~line 1122). The DOM-driven assertions become direct
 * calls against the pure `evaluate()`; the data-integrity checks are preserved.
 */

function threadsFrom(entries: [string, ReaderId[]][]): ThreadMap {
  const m: ThreadMap = new Map();
  for (const [card, readers] of entries) {
    if (readers.length) m.set(card, new Set(readers));
  }
  return m;
}

describe("report-constructor data integrity", () => {
  it("15 notebook cards, 3 readers, 7 needs", () => {
    expect(CARDS.length).toBe(15);
    expect(READERS.length).toBe(3);
    expect(NEEDS.length).toBe(7);
  });

  it("every card has a verdict + note for every reader", () => {
    expect(
      CARDS.every((c) =>
        READERS.every(
          (r) =>
            c.fits[r.id] &&
            typeof c.fits[r.id].ok === "boolean" &&
            typeof c.fits[r.id].note === "string" &&
            c.fits[r.id].note.length > 0,
        ),
      ),
    ).toBe(true);
  });

  it("every need is coverable by fit cards", () => {
    expect(
      NEEDS.every(
        (n) =>
          n.cover.length > 0 &&
          n.cover.every(
            (id) => cardById[id] && cardById[id].fits[n.aud].ok,
          ),
      ),
    ).toBe(true);
  });

  it("four pure-trap cards exist (no fits anywhere)", () => {
    expect(CARDS.filter((c) => isTrap(c.id)).length).toBe(4);
  });

  it("every card tag is a known tag", () => {
    expect(CARDS.every((c) => TAGS[c.tag])).toBe(true);
  });
});

describe("report-constructor evaluate()", () => {
  it("perfect solution: all 7 needs met, 0 misfits, 0 dead, clean", () => {
    const sel = [
      "census",
      "crates",
      "claimrma",
      "power",
      "lockout",
      "method",
      "tip",
      "ledger",
    ];
    const threads = threadsFrom(
      sel.map((id) => [id, fitsOf(id)]),
    );
    const result = evaluate(sel, threads);
    expect(result.needsMet.size).toBe(7);
    expect(result.misfits).toBe(0);
    expect(result.dead.length).toBe(0);
    expect(result.clean).toBe(true);
    expect(threadTotal(sel, threads)).toBeGreaterThan(0);
  });

  it("bad path: 1 need met (cell anomaly via cooling), 3 misfits, courtesy dead", () => {
    const sel = ["launder", "editorial", "courtesy", "transistors", "cooling"];
    const threads = threadsFrom([
      ["launder", ["committee"]],
      ["editorial", ["authority"]],
      ["transistors", ["cell"]],
      ["cooling", ["cell"]],
    ]);
    const result = evaluate(sel, threads);
    expect(result.needsMet.size).toBe(1);
    expect(result.needsMet.has("i1")).toBe(true);
    expect(result.misfits).toBe(3);
    expect(result.dead.length).toBe(1);
    expect(result.dead[0]).toBe("courtesy");
  });

  it("two misfits on one desk is not yet buried; three flags it", () => {
    const sel2 = ["launder", "editorial", "courtesy", "census"];
    const not = evaluate(
      sel2,
      threadsFrom([
        ["launder", ["committee"]],
        ["editorial", ["committee"]],
        ["census", ["committee"]],
        ["courtesy", ["cell"]],
      ]),
    );
    expect(not.buried.length).toBe(0);

    const yes = evaluate(
      sel2,
      threadsFrom([
        ["launder", ["committee"]],
        ["editorial", ["committee"]],
        ["census", ["committee"]],
        ["courtesy", ["committee"]],
      ]),
    );
    expect(yes.buried.length).toBe(1);
    expect(yes.buried[0]).toBe("committee");
  });

  it("threads to unselected cards are ignored, and buriedAt config is 3", () => {
    expect(CONFIG.buriedAt).toBe(3);
    // census threaded but not in sel -> no need met, no verdicts
    const result = evaluate([], threadsFrom([["census", ["committee"]]]));
    expect(result.needsMet.size).toBe(0);
    expect(result.verdicts.length).toBe(0);
  });
});
