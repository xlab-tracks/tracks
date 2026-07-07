import type { DemoDefinition } from "./types";
import { SliderDemo, TradeoffDemo } from "@/components/demos/example-demos";
import { AuditTradeoffDemo } from "@/components/demos/audit-tradeoff-demo";

// Central demo registry — the single integration point. Reference a demo by ID
// from MDX (<Demo id="…"/>), the gallery, standalone pages, or embeds.
export const demoRegistry: Record<string, DemoDefinition> = {
  "parameter-slider": {
    id: "parameter-slider",
    title: "Parameter slider",
    description: "Example demo — drag the slider and the output updates live.",
    component: SliderDemo,
    tags: ["example"],
  },
  tradeoff: {
    id: "tradeoff",
    title: "Trade-off explorer",
    description: "Example demo — balance two levers and watch the score change.",
    component: TradeoffDemo,
    tags: ["example"],
  },
  "audit-tradeoff": {
    id: "audit-tradeoff",
    title: "Upfront auditing: the audit/attack-rate tradeoff",
    description:
      "Drag the auditing proportion and watch the red team's optimal attack rate, expected backdoor attempts, and the blue team's win probability update live — reproducing Figure 3.",
    component: AuditTradeoffDemo,
    tags: ["control", "ai-control-paper"],
  },
};

export function getDemo(id: string): DemoDefinition | undefined {
  return demoRegistry[id];
}

export function listDemos(): DemoDefinition[] {
  return Object.values(demoRegistry);
}
