import { describe, it, expect } from "vitest";
import { isAccessLocked } from "@/lib/content/prerequisites";

describe("isAccessLocked", () => {
  it("never locks soft tracks", () => {
    expect(isAccessLocked("soft", [false, false])).toBe(false);
    expect(isAccessLocked("soft", [])).toBe(false);
  });

  it("locks hard tracks with an incomplete prerequisite", () => {
    expect(isAccessLocked("hard", [true, false])).toBe(true);
    expect(isAccessLocked("hard", [false])).toBe(true);
  });

  it("unlocks hard tracks when all prerequisites are complete", () => {
    expect(isAccessLocked("hard", [true, true])).toBe(false);
    expect(isAccessLocked("hard", [])).toBe(false);
  });
});
