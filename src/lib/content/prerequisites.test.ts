import { describe, it, expect } from "vitest";
import {
  enforcementLocks,
  isAccessLocked,
  PREREQUISITES_ENFORCED,
} from "@/lib/content/prerequisites";

describe("enforcementLocks", () => {
  it("never locks soft tracks", () => {
    expect(enforcementLocks("soft", [false, false])).toBe(false);
    expect(enforcementLocks("soft", [])).toBe(false);
  });

  it("locks hard tracks with an incomplete prerequisite", () => {
    expect(enforcementLocks("hard", [true, false])).toBe(true);
    expect(enforcementLocks("hard", [false])).toBe(true);
  });

  it("unlocks hard tracks when all prerequisites are complete", () => {
    expect(enforcementLocks("hard", [true, true])).toBe(false);
    expect(enforcementLocks("hard", [])).toBe(false);
  });
});

describe("isAccessLocked", () => {
  // Written flag-agnostically so this suite stays green whichever way the
  // PREREQUISITES_ENFORCED kill-switch is set.
  it("matches the rule while enforced, and never locks while disabled", () => {
    expect(isAccessLocked("hard", [true, false])).toBe(PREREQUISITES_ENFORCED);
    expect(isAccessLocked("hard", [false])).toBe(PREREQUISITES_ENFORCED);
    expect(isAccessLocked("hard", [true, true])).toBe(false);
    expect(isAccessLocked("soft", [false])).toBe(false);
  });
});
