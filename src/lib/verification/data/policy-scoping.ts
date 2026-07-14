/**
 * Data for the "Scoping an Anti-ASI Policy" widget — POLICIES, EXC_ANSWERS, and
 * AXIS_TIPS lifted verbatim from public/verification/policy-scoping.html (and its
 * extracted content JSON), plus the surrounding header/rail copy from the same
 * authored source. Do NOT re-author any of this — it is human-authored curriculum.
 *
 * Grid cells are keyed f0..f2 (feasibility low→high) × e0..e2 (effectiveness
 * low→high). Every policy carries a 9-entry verdict table (right / close / wrong)
 * plus a hover feedback string per cell. Note the deliberate oddity: two chips
 * share the cell f2e0 (self-governance and domestic regulation both grade
 * "right" there) — cells can hold multiple chips. That is a lesson, not a bug.
 */

export type Verdict = "right" | "close" | "wrong";

export interface PolicyCell {
  v: Verdict;
  t: string;
}

export interface Policy {
  id: string;
  name: string;
  short: string;
  /** Okabe-Ito colour token (raw hex) used for the chip/ghost dot. */
  colorRaw: string;
  def: string;
  keyWhy: string;
  /** Answer-key ghost position, fractions of the plane (x = feasibility axis, y from top). */
  ghost: { x: number; y: number };
  cells: Record<string, PolicyCell>;
}

export const POLICIES: Policy[] = [
  {
    id: "sg",
    name: "Self-governance",
    short: "Self-gov",
    colorRaw: "#56B4E9",
    def: "Voluntary lab commitments — the status quo. Safety frameworks, published policies, promises. No one outside the lab enforces anything.",
    keyWhy:
      "The status quo: costs nothing, binds no one. Most feasible, least effective — race dynamics dominate.",
    ghost: { x: 0.905, y: 0.945 },
    cells: {
      f2e0: {
        v: "right",
        t: "Right. It’s the status quo — already happening, costs nothing, requires no one’s agreement. And race dynamics run straight over it: a voluntary commitment binds only the willing.",
      },
      f1e0: {
        v: "close",
        t: "Right about the weakness, but too pessimistic about ease. Self-governance is the one bucket that requires nothing — no statute, no treaty. It defines the feasibility ceiling.",
      },
      f0e0: {
        v: "wrong",
        t: "This corner is the worst of both, and self-governance at least wins on ease: it’s already the status quo. Nothing that requires zero agreement belongs at low feasibility.",
      },
      f2e1: {
        v: "close",
        t: "Half right — nothing is more feasible. But medium effectiveness overrates voluntary commitments: when the race heats up, a promise with no enforcement is the first thing to go.",
      },
      f1e1: {
        v: "wrong",
        t: "Neither axis fits. Voluntary commitments are maximally feasible (they already exist) and minimally effective (race dynamics dominate). Far corner, bottom right.",
      },
      f0e1: {
        v: "wrong",
        t: "Backwards on feasibility — nothing is easier than the status quo — and generous on effectiveness. This bucket anchors the bottom-right corner.",
      },
      f2e2: {
        v: "wrong",
        t: "The corner every policymaker wishes existed. If voluntary commitments actually deterred ASI development, there would be no verification problem to study.",
      },
      f1e2: {
        v: "wrong",
        t: "Highly effective self-governance would mean labs restraining themselves against their own race incentives — the exact thing the arms-race logic says doesn’t happen.",
      },
      f0e2: {
        v: "wrong",
        t: "This is the full pause’s corner — hard to get, strong if you get it. Self-governance is its mirror image: trivially easy, and nearly toothless.",
      },
    },
  },
  {
    id: "dr",
    name: "Domestic regulation",
    short: "Domestic reg.",
    colorRaw: "#0072B2",
    def: "Each state licenses and audits its own developers. Binding at home; silent about the race abroad.",
    keyWhy:
      "One legislature, real teeth at home — but the international race is untouched. A shade less feasible and a shade more effective than self-governance; same cell of the plane.",
    ghost: { x: 0.76, y: 0.875 },
    cells: {
      f2e0: {
        v: "right",
        t: "Right. One legislature, no treaty — still the easy lane. Licenses and audits add real teeth at home, but the international race doesn’t notice one country’s rules.",
      },
      f1e0: {
        v: "close",
        t: "Defensible — passing binding legislation is harder than the status quo. But next to anything requiring international agreement, domestic regulation is still high-feasibility.",
      },
      f2e1: {
        v: "close",
        t: "The teeth are real, but they only bite at home. Effectiveness here is measured against a global race — and rivals abroad are untouched by your licenses.",
      },
      f0e0: {
        v: "wrong",
        t: "Too pessimistic on ease: states license and audit industries all the time, no diplomacy required. What domestic regulation lacks is reach, not achievability.",
      },
      f1e1: {
        v: "wrong",
        t: "A double misread. It’s more feasible than this (one legislature acting alone) and less effective (the race simply continues offshore).",
      },
      f0e1: {
        v: "wrong",
        t: "Feasibility is the axis domestic regulation scores well on — it needs no other country’s consent. The problem is effect: national rules, international race.",
      },
      f2e2: {
        v: "wrong",
        t: "If a single state’s rules could deter ASI development globally, coordination would be unnecessary. The whole verification problem exists because they can’t.",
      },
      f1e2: {
        v: "wrong",
        t: "High effectiveness would require the race to respect borders. It doesn’t — development shifts to wherever the rules aren’t.",
      },
      f0e2: {
        v: "wrong",
        t: "That’s where binding international measures live. Domestic regulation is the opposite trade: easy to get, weak against a global race.",
      },
    },
  },
  {
    id: "tc",
    name: "Transparency coordination",
    short: "Transparency",
    colorRaw: "#009E73",
    def: "International chip tracking, incident reporting, and export controls. Builds shared visibility without directly restricting development.",
    keyWhy:
      "Watching without restricting: middle cost, middle force — and the visibility layer every stronger policy depends on.",
    ghost: { x: 0.5, y: 0.5 },
    cells: {
      f1e1: {
        v: "right",
        t: "Right. Chip tracking, incident reporting, export controls: shared visibility without directly restricting anyone. Harder than domestic action, easier than a halt — and the foundation the stronger buckets stand on.",
      },
      f1e0: {
        v: "close",
        t: "Understandable — transparency alone stops nothing. But visibility changes the game: you can’t verify, deter, or trigger anything you can’t see. That earns it the middle of the effectiveness band.",
      },
      f0e1: {
        v: "close",
        t: "Right band, wrong read on cost. Coordination is hard, but transparency asks states only to watch and report — not to stop. A much easier ask than any pause.",
      },
      f2e0: {
        v: "wrong",
        t: "That’s the self-governance corner. Transparency coordination needs many governments moving together — harder than it looks — and delivers more than it seems: visibility is what everything stronger runs on.",
      },
      f2e1: {
        v: "wrong",
        t: "Fragments exist today — export controls, some reporting. But a working international tracking regime is a genuine diplomatic lift, not the easy lane.",
      },
      f0e0: {
        v: "wrong",
        t: "If it were this bad a deal, no one would bother — yet chip tracking and export controls are exactly where real-world policy is moving. Middle of both axes.",
      },
      f2e2: {
        v: "wrong",
        t: "The empty corner. If shared visibility were this cheap and this strong, the problem would already be solved. Transparency is a middle move: real value, real cost.",
      },
      f1e2: {
        v: "wrong",
        t: "Transparency doesn’t restrict development — it only watches. High effectiveness belongs to the buckets that can actually stop a run.",
      },
      f0e2: {
        v: "wrong",
        t: "That’s pause territory. Transparency is deliberately weaker: it builds the shared visibility a pause would need, without asking anyone to stop.",
      },
    },
  },
  {
    id: "cp",
    name: "Conditional (if/then) pause",
    short: "If/then pause",
    colorRaw: "#CC79A7",
    def: "An if/then commitment: development halts when pre-agreed trigger conditions are met — capability thresholds, eval results, incidents.",
    keyWhy:
      "Trades a sliver of a pause’s force for a large gain in signability. Its whole value lives in the trigger design.",
    ghost: { x: 0.42, y: 0.24 },
    cells: {
      f1e2: {
        v: "right",
        t: "Right. Tying the halt to pre-agreed triggers buys feasibility — states can sign before the pain starts — while keeping most of a pause’s deterrent force. The catch: everything rides on trigger design.",
      },
      f0e2: {
        v: "close",
        t: "Nearly. But the entire point of the if/then structure is to be easier to sign than an immediate halt — commitment now, cost later. It sits to the feasible side of the full pause.",
      },
      f1e1: {
        v: "close",
        t: "Fair skepticism — triggers can be gamed, thresholds can creep, and a pause you never trigger stops nothing. But designed well, it carries most of a full pause’s force.",
      },
      f2e0: {
        v: "wrong",
        t: "Wrong end of both axes. A conditional pause is still a binding international commitment to halt — that’s neither cheap nor weak.",
      },
      f1e0: {
        v: "wrong",
        t: "Low effectiveness sells it short: the halt is real, just deferred behind triggers. If the triggers are honest, the deterrent is nearly a full pause’s.",
      },
      f0e0: {
        v: "wrong",
        t: "Hard to get, yes — but not weak. If it were both, nobody would propose it. The conditional structure exists precisely to trade a little strength for a lot of feasibility.",
      },
      f2e1: {
        v: "wrong",
        t: "Signing away your right to develop — even conditionally — is a serious ask between rivals. That’s not the high-feasibility lane.",
      },
      f2e2: {
        v: "wrong",
        t: "The corner that doesn’t exist. If a binding conditional halt were easy to get, the full-pause debate would be over.",
      },
      f0e1: {
        v: "wrong",
        t: "This underrates both what it does (a real halt, once triggered) and how it’s built (triggers exist to make signing easier, not harder).",
      },
    },
  },
  {
    id: "fp",
    name: "Full pause",
    short: "Full pause",
    colorRaw: "#D55E00",
    def: "A binding international halt, or hard cap, on frontier development.",
    keyWhy:
      "The strongest instrument and the hardest to get — and, under securitization, the design target: mechanisms that can verify a halt can support everything weaker.",
    ghost: { x: 0.13, y: 0.13 },
    cells: {
      f0e2: {
        v: "right",
        t: "Right. A binding international halt is the strongest instrument on the board and the hardest to get — every state must agree to stop, and trust that rivals actually stopped. Which is exactly why verification exists.",
      },
      f1e2: {
        v: "close",
        t: "Right on strength, generous on ease. Asking every major power to halt frontier development now is the single hardest sell in international politics. It anchors the far end.",
      },
      f0e1: {
        v: "wrong",
        t: "If you could actually get it, a binding halt is as effective as policy gets — that’s the entire reason anyone entertains so infeasible an idea.",
      },
      f0e0: {
        v: "wrong",
        t: "Hard to get and useless? Then no one would propose it. The full pause matters precisely because it’s the one bucket that actually stops the race.",
      },
      f1e1: {
        v: "wrong",
        t: "This is the middle bucket’s home — transparency coordination. A full pause is an extreme on both axes: maximum effect, minimum feasibility.",
      },
      f1e0: {
        v: "wrong",
        t: "Backwards. A full pause is the ceiling on effectiveness, not the floor — its weakness is that you can’t get it, not that it wouldn’t work.",
      },
      f2e0: {
        v: "wrong",
        t: "You’ve placed the strongest, hardest bucket where the weakest, easiest one lives. Swap it with self-governance and the frontier snaps into place.",
      },
      f2e1: {
        v: "wrong",
        t: "There is nothing high-feasibility about asking every state to halt. This is the bucket that demands the most trust, the most verification, the most politics.",
      },
      f2e2: {
        v: "wrong",
        t: "The empty corner — strong and easy is the policy that doesn’t exist. If it did, this track would be one module long.",
      },
    },
  },
];

/** Closing MCQ answers — verbatim. `t` contains authored <b> emphasis markup. */
export const EXC_ANSWERS: Record<string, { ok: boolean; t: string }> = {
  fp: {
    ok: true,
    t: "<b>Right — the full pause.</b> Mechanisms strong enough to verify a halt — chip registries, compute metering, inspection rights — can support every weaker bucket. The reverse is not true. So under the securitized framing you design verification for the pause, whatever gets signed first.",
  },
  cp: {
    ok: false,
    t: "Close in spirit — an if/then pause may be what you can actually get signed. But you <b>design</b> for the full pause: anything strong enough to verify a halt can serve a conditional one, and not vice versa.",
  },
  tc: {
    ok: false,
    t: "Transparency is the scaffolding, not the target. Under a securitized framing you build the mechanism set that could support a halt — transparency is what it stands on along the way.",
  },
  dr: {
    ok: false,
    t: "Securitization is precisely the move past ordinary domestic politics. A domestic design target leaves the existential problem — the international race — unsolved.",
  },
  sg: {
    ok: false,
    t: "If you truly accept the existential framing, “trust me” is the one answer ruled out from the start. Verification exists to replace it with “check me.”",
  },
};

/** Axis / corner / securitization hover copy — verbatim. */
export const AXIS_TIPS = {
  y: "How much the policy actually deters ASI development — measured against the global race, not against one country’s labs.",
  x: "How gettable the policy is under current infrastructure (the verification burden it implies) and the current political climate.",
  tr: "High effectiveness at high feasibility is the policy everyone would already have adopted. Nothing lives here.",
  bl: "Costly to get and weak once you have it. If a bucket seems to belong here, one of your axis readings is off.",
  sec: "Securitization: treating an issue as an existential security matter, lifting it out of normal political balancing — because nothing can be traded against survival. A strong move with a history of abuse, which is why the threat model must be argued, not stipulated.",
} as const;

/** Header / rail copy lifted verbatim from the authored HTML. */
export const POLICY_SCOPING_COPY = {
  hint: "Drag each bucket onto the plane, then check. Hover anything — chips, corners, axes — for the reasoning.",
  trayLabel: "The five policy buckets — drag onto the plane",

  stats: [
    { n: "5", l: "buckets, from voluntary commitments to a binding halt" },
    { n: "2", l: "axes every scoping decision trades between" },
    { n: "1", l: "exception that suspends ordinary balancing" },
  ],

  exerciseLabel: "Exercise",
  checkBtn: "Check placements",
  revealBtn: "Reveal answer key",
  resetBtn: "Reset",

  resultsLabel: "Reasoning, bucket by bucket",

  yTitle: "Effectiveness",
  ySub: "at deterring ASI development",
  xTitle: "Feasibility",
  xSub: "— verification burden + political climate",
  caption:
    "Always think about policy in terms of tradeoffs — price them, don’t pick favorites.",
  cornerTR: "the empty corner",
  cornerBL: "worst of both",
  frontierLabel: "the feasibility–effectiveness frontier",
  cascadeLine1: "strong enough for a pause",
  cascadeLine2: "supports everything weaker ↘",

  excLabel: "The one exception",
  excLead: {
    pre: "Ordinary balancing weighs effectiveness against feasibility. ",
    sec: "Securitization",
    mid: " breaks the scale: if ASI development is an existential threat, nothing can be traded against survival. Accept that framing, and one bucket becomes the ",
    bold: "design target for verification mechanisms",
    post: ". Which?",
  },

  closingNext: "Next — who would have to agree? Module 1: The Compute Supply Chain →",

  foot: "Framework from the Governance Tracks outline, §0.2 Policy Scoping (July 2026). Reference thresholds students should recognize: EU AI Act Art. 51 presumes systemic risk above 10²⁵ training FLOP; the rescinded EO 14110 used 10²⁶ as its reporting trigger. The corners of this plane are anchored by the outline; the middle band is genuinely contestable — the written justification exercise exists precisely to argue it.",
} as const;

/** feasibility index (from cell key f#) → word */
export const FEAS_WORDS = ["low", "medium", "high"] as const;
/** effectiveness index (from cell key e#) → word */
export const EFFECT_WORDS = ["low", "medium", "high"] as const;

/** Human-readable label for a cell key like "f2e0". */
export function cellLabel(key: string | null): string {
  if (!key) return "the tray";
  const f = Number(key[1]);
  const e = Number(key[3]);
  return `${FEAS_WORDS[f]} feasibility, ${EFFECT_WORDS[e]} effectiveness`;
}

/** Verdict → short status word used in results + announcements. */
export function verdictLabel(v: Verdict): string {
  return v === "right" ? "on the frontier" : v === "close" ? "close" : "off";
}
