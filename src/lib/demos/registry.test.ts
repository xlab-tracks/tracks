import { describe, expect, it } from "vitest";
import { getDemo } from "./registry";

describe("additive-control demo registration", () => {
  it("is registered with the fields the gallery needs", () => {
    const demo = getDemo("additive-control");
    expect(demo).toBeDefined();
    expect(demo?.id).toBe("additive-control");
    expect(demo?.title).toBe("Control is additive");
    expect(demo?.tags).toEqual(["control", "how-useful"]);
  });
});
