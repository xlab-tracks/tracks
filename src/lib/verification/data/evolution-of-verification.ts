/**
 * Copy + display data for "The Evolution of Verification" — lifted verbatim
 * from public/verification/evolution-of-verification.html (the authored
 * standalone page). Do not re-author, paraphrase, shorten, or translate: this
 * is human-written curriculum. Terms marked with [[…]] render dotted-underline
 * tooltips via the kit's TermText/Term; the tooltip text lives in TIPS.
 */
import type { StrategyKey } from "@/lib/verification/engines/evolution-of-verification";

/* ---------- strategy display data (META) ---------- */
export interface StrategyMeta {
  name: string;
  hex: string;
  shape: "circle" | "triangle" | "square" | "pentagon" | "diamond";
  bio: string;
}

export const META: Record<StrategyKey, StrategyMeta> = {
  cooperator: {
    name: "Cooperator",
    hex: "#56B4E9",
    shape: "circle",
    bio: "Always cooperates, no matter what it sees.",
  },
  defector: {
    name: "Defector",
    hex: "#D55E00",
    shape: "triangle",
    bio: "Always defects, no matter what it sees.",
  },
  copycat: {
    name: "Copycat",
    hex: "#009E73",
    shape: "square",
    bio: "Starts friendly, then repeats whatever it saw you do last round.",
  },
  grudger: {
    name: "Grudger",
    hex: "#E69F00",
    shape: "pentagon",
    bio: "Cooperates until it sees one defection. Then never again.",
  },
  random: {
    name: "Random",
    hex: "#CC79A7",
    shape: "diamond",
    bio: "Flips a coin every round.",
  },
  vcopycat: {
    name: "V-Copycat",
    hex: "#0072B2",
    shape: "square",
    bio: "A Copycat that pays to see your true moves.",
  },
  vgrudger: {
    name: "V-Grudger",
    hex: "#F0E442",
    shape: "pentagon",
    bio: "A Grudger that pays to see your true moves.",
  },
  vcooperator: {
    name: "V-Cooperator",
    hex: "#171B1C",
    shape: "circle",
    bio: "A Cooperator that pays to see, then ignores what it learns.",
  },
};

/* ---------- tooltip copy (TIP) ---------- */
export const TIPS = {
  r3: "Why 3? The payoff matrix: both cooperate and each earns 3. The full table is under the hood.",
  p1: "Why 1? Both defect and each scrapes 1. Better than being the lone sucker, worse than teamwork.",
  t5: "Why 5? The temptation payoff: defecting on a cooperator pays 5, the best single-round outcome.",
  s0: "Why 0? The sucker payoff: cooperate while they defect and you get nothing.",
  gen: "One generation: every pair plays a 10-round match, scores are summed, the 5 lowest totals are eliminated, and the 5 highest are copied.",
  recip: "Strategies that pay back what they see: Copycat and Grudger.",
  noise:
    "Noise flips the record, never the act. Points always follow what really happened; decisions follow what each player believes happened.",
  verifier:
    "A player whose record of the other side never flips. It sees true actions and pays a fee every round for the privilege.",
  rel: "Reliability r: the chance a verifier’s record is correct. At r = 1.0 it always sees the truth. Below that, even paid eyes can be fooled.",
} as const;

/* ---------- stage nav ---------- */
export const NAV_LABELS = [
  "1 The world you know",
  "2 The fog",
  "3 Paying to see",
  "4 Free play",
  "5 The bridge",
] as const;

/* ---------- stage definitions ----------
 * Body / outcome / callout copy is lifted verbatim from STAGE_DEFS in the
 * source. Inline [[term|tip]] markers replace the source's <span class="term">
 * so the kit renders identical tooltips. Stage 3's outcome ends with a callout
 * whose "vcoopnums" span is filled at runtime from the first generation's
 * average scores.
 */
export type StageNum = 1 | 2 | 3 | 4 | 5;

export interface PredictBlock {
  predictQ: string;
  predictOpts: string[];
}

export interface StageDefUI extends Partial<PredictBlock> {
  title: string;
  /** Body paragraphs, each may contain [[term|tip]] markers. */
  body: string[];
  roster?: StrategyKey[] | null;
  /** Outcome paragraphs, shown after the run finishes. */
  outcome?: string[];
  /** Stage 3 only: the highlighted V-Cooperator callout. */
  callout?: string;
}

export const STAGE_DEFS: Record<StageNum, StageDefUI> = {
  1: {
    title: "Stage 1. The world you know",
    body: [
      "A one-screen recap, then we move on. 25 players. Every pair plays a 10-round match. Each round, both secretly choose: cooperate or defect. Both cooperate: [[3 points each|Why 3? The payoff matrix: both cooperate and each earns 3. The full table is under the hood.]]. Both defect: [[1 each|Why 1? Both defect and each scrapes 1. Better than being the lone sucker, worse than teamwork.]]. If one defects on a cooperator, the defector takes [[5|Why 5? The temptation payoff: defecting on a cooperator pays 5, the best single-round outcome.]] and the cooperator gets [[0|Why 0? The sucker payoff: cooperate while they defect and you get nothing.]]. After everyone has played everyone, the 5 lowest scorers are eliminated and the 5 highest are copied. That is one [[generation|One generation: every pair plays a 10-round match, scores are summed, the 5 lowest totals are eliminated, and the 5 highest are copied.]]. We run 30.",
      "Information is perfect here. What everyone sees is exactly what everyone did.",
    ],
    roster: ["copycat", "cooperator", "defector", "grudger", "random"],
    predictQ:
      "Five characters, five of each. Who owns this world by generation 30?",
    predictOpts: [
      "Copycat and Grudger, the [[reciprocators|Strategies that pay back what they see: Copycat and Grudger.]]",
      "Defector",
      "Cooperator",
    ],
    outcome: [
      "**The reciprocators take the board.** Defectors feast on the Cooperators early, then starve once only retaliators are left. If you played the trust game, no surprises yet.",
      "One thing to hold on to: Copycat’s whole trick is information. It can only mirror what it sees. So what happens when what it sees stops being true?",
    ],
  },
  2: {
    title: "Stage 2. The fog",
    body: [
      "Same cast. Same values. One change: every round, each player has a 20 percent chance of [[misreading|Noise flips the record, never the act. Points always follow what really happened; decisions follow what each player believes happened.]] what the other side just did. The move itself does not change, and neither do the points. Only the player’s record of it flips.",
      "Think satellite photos, intercepted memos, rumor. The act is real. The report is noisy.",
    ],
    roster: null,
    predictQ: "What happens to the cooperators and reciprocators now?",
    predictOpts: [
      "They adapt; reciprocity still wins",
      "Misreadings cascade; defectors take over",
      "Roughly the same as Stage 1",
    ],
    outcome: [
      "**The fog eats the nice guys.** A Copycat misreads a loyal partner and retaliates. The partner, now facing a real defection, hits back. A Grudger writes off a friend over a defection that never happened. Round by round, the safest read of a noisy world is the cynical one, and Defector stops being punished for assuming the worst.",
      "**Nobody in this world changed their values. Only the information got worse.**",
    ],
  },
  3: {
    title: "Stage 3. Paying to see",
    body: [
      "Enter the [[verifiers|A player whose record of the other side never flips. It sees true actions and pays a fee every round for the privilege.]]. A verifier’s record never flips: it sees what the other player truly did. The price is 0.2 points every round, paid whether the news is good or bad. Three verifiers join the cast, same decision rules as their namesakes, better eyes. The fog stays at 20 percent.",
    ],
    roster: ["vcopycat", "vgrudger", "vcooperator"],
    predictQ:
      "Verification costs 0.2 a round in a 20 percent fog. Who comes out ahead?",
    predictOpts: [
      "The verifying reciprocators",
      "Defector still takes the board",
      "The verifiers sink under the fee",
    ],
    outcome: [
      "**The verifying reciprocators spread.** A V-Copycat never starts a phantom feud, so its partnerships hold and compound while fogged players burn points on revenge. Watch the early generations: the plain reciprocators often rally first, then the verifiers grind past them.",
      "**Nobody became nicer. They became harder to fool.**",
    ],
    callout:
      "**Watch V-Cooperator.** It pays for perfect information and then cooperates no matter what it sees. It buys the truth and never acts on it, so the fee is pure loss: it can never beat plain Cooperator, and it is usually among the first eliminated. Verification only has value when your response depends on what you learn. That is why verification and enforcement are different things: seeing a violation matters only if something changes because you saw it.",
  },
  4: {
    title: "Stage 4. Free play",
    body: [
      "All the levers are yours: noise, verification cost, match length, [[reliability|Reliability r: the chance a verifier’s record is correct. At r = 1.0 it always sees the truth. Below that, even paid eyes can be fooled.]], and the starting cast. Every run uses the seed at the bottom of the page, so any result you find can be replayed and shared.",
    ],
    predictQ:
      "Before you experiment, a bet: as the price of verification rises, where do the verifiers give up?",
    predictOpts: [
      "Around 0.1 per round",
      "Somewhere near 0.25",
      "Not until past 0.5",
    ],
    outcome: [],
  },
  5: {
    title: "Stage 5. The bridge",
    body: [],
  },
};

/* ---------- Stage 3 V-Cooperator callout suffix ----------
 * The source appends a sentence to the callout after a run, comparing the two
 * cooperators' first-generation average scores. Assembled at runtime.
 */
export function vcoopNumsSentence(
  cooperatorAvg: number,
  vcooperatorAvg: number,
): string {
  return (
    " In this run’s first generation, Cooperator averaged " +
    cooperatorAvg.toFixed(1) +
    " points and V-Cooperator " +
    vcooperatorAvg.toFixed(1) +
    ". Same choices every round; the gap is the price of eyes it never uses."
  );
}

/* ---------- Stage 4: challenge + extension cards ---------- */
export const STAGE4 = {
  challengeTitle: "The challenge",
  challengeBody:
    "At 20 percent noise, find the verification cost above which the verifiers go extinct. That number is this model’s answer to the question: how much is verification allowed to cost?",
  hintShow: "Show hint",
  hintHide: "Hide hint",
  hint: "The trap is comparing the cost to the 3 points of a good round. Compare it instead to the gap: how many points per round does a verifying reciprocator gain over a fogged one? The fee comes out of that gap, and the gap is much smaller than 3. When the fee is bigger than the gap, verification becomes a tax on the careful. One more thing: near the boundary, single runs flip. Try two or three seeds before you settle on a number.",
  extTitle: "Extension: unreliable eyes",
  extBody:
    "Real inspections are not perfect. Lower the reliability slider r below 1.0 and the verifier’s record is right only with probability r. How does imperfect verification change the extinction cost? Try r = 0.95, then r = 0.90, at a few prices. What does the answer say about cheap but sloppy monitoring?",
  popEditorLabel: "Starting cast (25 max)",
  addPlayersFirst: "Add players first: at least 6.",
} as const;

/* ---------- Stage 5 body (the bridge) ---------- */
export const STAGE5_PARAGRAPHS: { html: string; bigIdea?: boolean }[] = [
  { html: "The game is a toy. The levers are not." },
  {
    html: "<strong>Noise</strong> is ambiguity about what a rival actually did with their compute. Training runs do not announce themselves. From the outside, a data center looks the same whether the workload inside is permitted or prohibited. Every accusation and every denial happens in that fog.",
  },
  {
    html: "<strong>Verification</strong> is the machinery that makes compliance observable. In this track you will meet it as four layers: hardware (chip identity, remote attestation, compute metering), cloud (the providers who sit between customers and machines), intelligence (satellites, energy use, procurement trails), and human (inspectors, auditors, whistleblowers). The course calls verification the sensory apparatus of an enforcement system that has no police. V-Cooperator already showed you why the sensing alone is not enough: seeing matters only if something changes because you saw.",
  },
  {
    html: "<strong>Cost</strong> is money, intrusiveness, and secrecy risk. A fee of 0.2 points a round stands in for things states actually pay: inspection budgets, surrendered sovereignty, and exposure of what they most want to keep private.",
  },
  {
    html: "Two honest caveats before you carry this model anywhere. First, real verification is partial and gameable. It catches violations with some probability, misses things, and gets attacked directly by the people it watches. That is why real regimes layer several imperfect mechanisms, Swiss cheese style, rather than buying one perfect eye. Second, real adversaries are not five fixed characters. They invent new strategies precisely to beat whatever verification exists. In this game the cast never adapts. Outside, it always does.",
  },
  {
    html: "One last connection. In the game, the cost of verifying was points. In the real world, the binding cost is often what verification reveals: to be inspected is to risk your secrets. That is why the field works on proving compliance without exposing the secret itself, a problem this course calls the confidentiality crux.",
  },
  {
    bigIdea: true,
    html: "The trust game left you with: a little noise can kill cooperation among decent players. This one leaves you with: paying to see can bring it back, up to a price you can now estimate. Verification does not eliminate distrust. It makes distrust governable. When is the price worth paying? That question is the rest of this course.",
  },
];

/* ---------- "Under the hood" panel ---------- */
export const UNDER_THE_HOOD = {
  summary: "Under the hood: rules, numbers, and honesty",
  sections: [
    {
      h: "The payoff matrix",
      p: ["Each round both players secretly choose, then reveal. Points per round:"],
      table: {
        head: ["", "They cooperate", "They defect"],
        rows: [
          ["You cooperate", "you 3, they 3", "you 0, they 5"],
          ["You defect", "you 5, they 0", "you 1, they 1"],
        ],
      },
    },
    {
      h: "The noise model: misperception, not slipped hands",
      p: [
        "Every round, each player separately records what they think the other side did. With probability equal to the noise setting, that record flips, independently for each observer each round. The true action stands: payoffs are always computed from what really happened. Strategies decide using only their recorded history. So noise here never changes anyone's behavior directly. It changes what they believe happened, and their rules react to the belief. This is why verification can help at all: an act that really happened cannot be undone, but a wrong record can be corrected.",
      ],
    },
    {
      h: "The verify mechanic",
      p: [
        "A verifier's records never flip (at reliability 1.0). It perceives true actions. In exchange it pays the verification cost every round of every match it plays, regardless of outcome. Verification here is always-on, accurate, and priced per round. The free-play extension adds a reliability setting r: the verifier's record is correct with probability r, so r below 1.0 makes verification imperfect.",
      ],
    },
    {
      h: "The replication rule",
      p: [
        "25 players. Each generation, every pair plays one 10-round match (free play can change the length) and scores are summed. The 5 lowest totals are eliminated and the 5 highest are copied. Ties are broken by a seeded random draw. The elimination count stays 5 even if you shrink the population in free play, so tiny populations evolve violently.",
      ],
    },
    {
      h: "Calibration: what we checked, and what we changed",
      p: [
        "Before shipping, the engine was run headlessly for 20 seeds and 30 generations per stage. Pass rates against each stage's expected outcome: Stage 1, reciprocators hold a majority by generation 30 in 20 of 20 seeds. Stage 2, defectors reach at least half the population in 19 of 20. Stage 3, verifying reciprocators are the largest family in 19 of 20. Nothing on screen is scripted: the stages replay whatever the engine produces.",
        "Two parameters differ from the original design brief, and we changed them in the open. The brief asked for 10 percent noise in Stages 2 and 3. At 10 percent, with 10-round matches, misperception turned out to be too mild to break reciprocity (a single misread between two Copycats costs an alternating echo, not a collapse), and the measured value of true perception, about 0.13 points per round, was below the 0.2 price, so verifiers always lost money. Stages 2 and 3 therefore run at 20 percent noise, and Stage 3's cast swaps one Copycat for one V-Copycat. Payoffs were never touched and no seed is special-cased.",
        "The default seed is 3. Of seeds 1 through 20, 18 pass all three stage checks; seed 3 was picked among them because its runs are representative and easy to read (Stage 3 shows the plain reciprocators rallying before the verifiers overtake them). Any seed gives an honest run; type your own below.",
      ],
    },
    {
      h: "Known sensitivities",
      p: [
        "The corrosion threshold for noise sits between 15 and 20 percent: below roughly 15 percent, reciprocators usually survive the fog unaided. Outcomes are winner-take-all (one family usually sweeps), so near a boundary, such as verification cost 0.22 to 0.25, the same settings can succeed on one seed and fail on another. Longer matches favor verifiers but weaken the Stage 1 story. V-Cooperator never outperforms Cooperator at any positive cost: it pays for information its rule never uses.",
        "Every number on screen comes from these rules.",
      ],
    },
  ],
} as const;

export const FOOTER = {
  inspiredPre: "Inspired by Nicky Case's ",
  inspiredLink: "The Evolution of Trust",
  inspiredHref: "https://ncase.me/trust",
  inspiredPost:
    " (ncase.me/trust). Built for XLab Tracks · Verification, Existential Risk Laboratory, University of Chicago.",
  seedTip:
    "Same seed, same story: with identical settings, the whole run replays identically, charts included.",
  seedHint: "Applies to the next run. Share a seed to share a run.",
} as const;

export const DEFAULT_SEED = 3;
