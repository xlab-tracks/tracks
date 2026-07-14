/**
 * Copy for the "Everything comes with a cost" widget — lifted verbatim from
 * public/verification/content/policy-cost.json (extracted from the authored
 * HTML). Do not re-author; this is human-written curriculum.
 */
export const POLICY_COST_COPY = {
  tagA: "Side A · The goal",
  labelA: "A policy you strongly believe in:",
  phA: "type it here…",
  chipLabel: "or borrow one:",
  chips: [
    "Universal healthcare",
    "School vouchers",
    "A carbon tax",
    "Banning phones in schools",
  ],
  privacy: "Nothing you type leaves this page.",
  flipBtn: "Flip the card",
  tagB: "Side B · The price",
  echoLabel: "Side A:",
  labelB: "One real cost or downside of enforcing it:",
  phB: "be honest — one is enough",
  stuck: "Stuck? Try a lens",
  lenses:
    "Who pays? · Who is constrained? · What does enforcing it require? · What happens to those who refuse?",
  backBtn: "← Back",
  faceBtn: "Face the tradeoff",
  bothTag: "Both sides of the card",
  goalTag: "The goal",
  priceTag: "The price",
  askQ: "Naming the price — how easy was it?",
  ease: {
    instant: "Almost instant",
    thought: "Took some thought",
    hard: "Genuinely hard",
  },
  branch: {
    instant:
      "The cost was there all along — it just isn’t the half we practice saying out loud.",
    thought:
      "Conviction keeps the goal in sharp focus and the price in the blur.",
    hard: "When a policy feels cost-free, its costs usually land on someone outside our view — or no one has looked yet.",
  },
  fullTag: "The full policy",
  fullTpl: { pre: "I support ", mid: " — at the cost of ", post: "." },
  again: "Try another policy",
} as const;

export type PolicyCostEase = keyof typeof POLICY_COST_COPY.ease;
