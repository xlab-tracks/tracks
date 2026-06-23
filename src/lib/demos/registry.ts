import type { DemoDefinition } from "./types";
import { SampleDemo, TradeoffDemo } from "@/components/demos/sample-demos";

// Central demo registry — the single integration point. Reference a demo by ID
// from MDX (<Demo id="…"/>), the gallery, standalone pages, or embeds.
export const demoRegistry: Record<string, DemoDefinition> = {
  "sample-demo": {
    id: "sample-demo",
    title: "Sample interactive demo",
    description: "Lorem ipsum — adjust the control and watch the output update.",
    component: SampleDemo,
    tags: ["placeholder"],
  },
  tradeoff: {
    id: "tradeoff",
    title: "Trade-off explorer",
    description: "Lorem ipsum — a placeholder two-lever trade-off.",
    component: TradeoffDemo,
    tags: ["placeholder"],
  },
};

export function getDemo(id: string): DemoDefinition | undefined {
  return demoRegistry[id];
}

export function listDemos(): DemoDefinition[] {
  return Object.values(demoRegistry);
}
