import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { demoRegistry, getDemo, listDemos } from "./registry";

describe("demo registry", () => {
  it("every registered demo has a component and the metadata the gallery needs", () => {
    const demos = listDemos();
    expect(demos.length).toBeGreaterThan(0);
    for (const [key, demo] of Object.entries(demoRegistry)) {
      expect(demo.id, `registry key "${key}" holds id "${demo.id}"`).toBe(key);
      expect(demo.component, `${key}: missing component`).toBeTypeOf(
        "function",
      );
      expect(demo.title.trim(), `${key}: empty title`).not.toBe("");
      // Optional in the type, but the gallery reads both — require them.
      expect(demo.description?.trim(), `${key}: empty description`).toBeTruthy();
      expect(demo.tags?.length, `${key}: no tags`).toBeGreaterThan(0);
    }
  });

  it("getDemo resolves registered ids and rejects unknown ones", () => {
    for (const demo of listDemos()) {
      expect(getDemo(demo.id)).toBe(demo);
    }
    expect(getDemo("not-a-demo")).toBeUndefined();
  });

  // Resolution tripwire for lesson embeds (same spirit as glossary.test.ts's
  // <Term> scan): every <Demo id="…"/> in lesson MDX must name a registered
  // demo, and the id must be a quoted literal so this scan can see it.
  it("every <Demo> in lesson MDX resolves to a registered demo", () => {
    const lessonsDir = join(process.cwd(), "src/content/lessons");
    let embeds = 0;
    for (const file of readdirSync(lessonsDir)) {
      if (!file.endsWith(".mdx")) continue;
      const body = readFileSync(join(lessonsDir, file), "utf8");
      for (const match of body.matchAll(/<Demo\b([^>]*)>/g)) {
        const attrs = match[1];
        const idMatch =
          /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})/.exec(
            attrs,
          );
        const id = idMatch?.[1] ?? idMatch?.[2] ?? idMatch?.[3];
        expect(
          id,
          `${file}: <Demo> id must be a quoted literal (got \`${attrs.trim()}\`)`,
        ).toBeTruthy();
        embeds++;
        expect(
          getDemo(id!),
          `${file}: unknown demo id "${id}"`,
        ).toBeDefined();
      }
    }
    // The scan itself must be finding embeds — if the tag syntax drifts,
    // fail loudly instead of passing on an empty match set.
    expect(embeds).toBeGreaterThan(0);
  });
});
