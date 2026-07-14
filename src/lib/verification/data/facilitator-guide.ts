/**
 * Facilitator Field Guide — data module.
 *
 * Verbatim port of `public/verification/facilitator-guide.html` and its
 * extracted popups (`public/verification/content/facilitator-guide.json`).
 * All pedagogical copy is human-authored; do not paraphrase or shorten.
 *
 * The source is a 12-"view" single-page guide: a home card grid plus 11
 * detail views (7 craft modules + 5 session plans — note module 06/07 share
 * numbering with a session-plans block). Views use internal state, not hash
 * routing. Two global toggles live in the source:
 *   - a context toggle (low / high AI-safety context) that swaps copy in the
 *     "Your role" module only;
 *   - a format toggle (in-person / Zoom) shared across the five session plans
 *     that swaps the "Prep" callout and some inline copy.
 * 99 popups open in a shared Dialog; bodies are the authored HTML lifted
 * verbatim (the leading <h3> is used as the dialog title).
 */

export const FG_HEADER = {
  lede: "Twelve small modules. 01–07 are craft — open the one you need, five minutes before any session or mid-crisis. 08–12 are ready-to-run session plans, one per track component, each with an in-person and a Zoom version. Any card marked with a + opens into detail.",
} as const;

export const FG_PRINCIPLES = [
  "People remember what they think about — not what they hear.",
  "Retrieval beats re-reading.",
  "Whoever does the talking does the learning.",
] as const;

export type FormatKey = "ip" | "zm";
export type ContextKey = "low" | "high";

export const FG_FORMAT_LABELS: Record<FormatKey, string> = {
  ip: "In the room",
  zm: "On Zoom",
};

/** Home grid — craft modules (01–07). */
export interface HomeCard {
  id: string; // target view id
  num: string;
  title: string;
  desc: string;
  meta: string;
}

export const FG_CRAFT_CARDS: HomeCard[] = [
  {
    id: "m-role",
    num: "01",
    title: "Your role",
    desc: "Leading the discussion with high AI-safety context — or almost none. Different traps, same job.",
    meta: "Toggle for your context level",
  },
  {
    id: "m-takes",
    num: "02",
    title: "Good takes vs. bad takes",
    desc: "Four quick tests, then practice calling real verification takes yourself.",
    meta: "Includes a self-check",
  },
  {
    id: "m-participation",
    num: "03",
    title: "Getting everyone talking",
    desc: "Six techniques that beat “anyone have thoughts?” — each with an async fallback.",
    meta: "6 techniques",
  },
  {
    id: "m-agency",
    num: "04",
    title: "Agency, not regurgitation",
    desc: "Never ask questions the reading already answers. What to ask instead.",
    meta: "6 moves",
  },
  {
    id: "m-convert",
    num: "05",
    title: "Async → sync converter",
    desc: "Turn the week's readings, threads, and quizzes into live segments — with timings.",
    meta: "6 recipes",
  },
  {
    id: "m-session",
    num: "06",
    title: "The 60-minute session",
    desc: "A ready-made skeleton: open, explore, close. Click each block for how to run it.",
    meta: "Copy this plan",
  },
  {
    id: "m-resources",
    num: "07",
    title: "Resources",
    desc: "A short, load-bearing list: facilitation craft, learning science, verification context.",
    meta: "12 links",
  },
];

export const FG_SESSION_CARDS: HomeCard[] = [
  {
    id: "m-intro",
    num: "08",
    title: "The introduction",
    desc: "“Why verification?” — chain retrieval, a two-team arms race played live, and the securitization argument out loud.",
    meta: "60 min · both formats",
  },
  {
    id: "m-game",
    num: "09",
    title: "The Verification Game, live",
    desc: "The solo timeline becomes “The Decade”: a six-round negotiation wargame for 10–15 players. The room walks its own path.",
    meta: "90–120 min wargame",
  },
  {
    id: "m-history",
    num: "10",
    title: "History & the state of the field",
    desc: "Timeline scramble, then the Precedent Draft: pitch a historical regime, survive cross-examination, loot the winners.",
    meta: "75 min · both formats",
  },
  {
    id: "m-matrix",
    num: "11",
    title: "The policy matrix, embodied",
    desc: "The effectiveness × feasibility plane goes on the floor, placements argue with each other — then the world starts moving.",
    meta: "70 min · both formats",
  },
  {
    id: "m-anatomy",
    num: "12",
    title: "Anatomy of a policy",
    desc: "Draft a pause treaty in eight sentences; the next team plays evading-state counsel and guts it. Implicit vs. explicit, felt.",
    meta: "70 min · both formats",
  },
];

export const FG_HOME_HINT_1 =
  "New facilitator? Do 01 → 02 → 06. That's enough for your first session.";
export const FG_HOME_SESSION_HEADING =
  "Session plans — one per track component";
export const FG_HOME_SESSION_NOTE =
  "Each plan assumes participants did the async material first; the live hour is for colliding, not covering. Toggle in-person / Zoom inside any plan — timings, prompts, and debriefs are shared.";
export const FG_HOME_HINT_2 =
  "Running a live cohort? Each plan lists what to prep, the run of show, discussion prompts, and what to send people home with.";

/** A clickable tile that opens a popup. */
export interface Tile {
  pop: string; // popup id
  title: string;
  desc: string;
  timing?: string; // the ".t" corner tag, e.g. "2 min · both"
}

/** A clickable lifecycle stage that opens a popup. */
export interface Stage {
  pop: string;
  num: string;
  title: string;
  desc: string;
  phase: "open" | "explore" | "close";
}

/** A callout paragraph — HTML lifted verbatim (may contain [term] buttons). */
export interface Callout {
  variant: "brown" | "blue";
  /** HTML body; term buttons are marked with data-pop and rendered as buttons. */
  html: string;
}

/** Resource list box. */
export interface ResBox {
  heading: string;
  items: { html: string }[];
}

export const PHASE_LABEL: Record<Stage["phase"], string> = {
  open: "Open",
  explore: "Explore",
  close: "Close",
};

/* ========================= 01 · YOUR ROLE ========================= */

export const ROLE_HEAD = {
  title: "Your role",
  lede: "You don't need to be a verification expert to facilitate well — but expertise changes what to watch out for. Pick your lane.",
  ctxLabelLow: "I'm newer to AI safety",
  ctxLabelHigh: "I have high context",
};

export const ROLE_CALLOUT_LOW: Callout = {
  variant: "blue",
  html: "<strong>Your job is process, not content.</strong> The group plus the readings contain the answers; your job is to make the group use them. Saying <em>“I don't know — let's check the reading”</em> models exactly the habit this track teaches.",
};

export const ROLE_TILES_LOW: Tile[] = [
  { pop: "p-bounce", title: "Bounce it back", desc: "You never have to adjudicate a claim yourself." },
  { pop: "p-chain", title: "Ask for the causal chain", desc: "Judge reasoning structure, not facts — no expertise needed." },
  { pop: "p-anchor", title: "Anchor to the reading", desc: "The text is your co-facilitator." },
  { pop: "p-park", title: "Park what you can't resolve", desc: "Unresolved ≠ failed. Flag it, follow up async." },
  { pop: "p-qmap", title: "Use the question map", desc: "A menu, not a script — pick 3–4 per session." },
  { pop: "p-structure", title: "Trust the structure", desc: "Stalled discussion needs a format change, not a smarter comment." },
];

export const ROLE_CALLOUT_HIGH: Callout = {
  variant: "brown",
  html: "<strong>Your expertise is a liability if unmanaged.</strong> Every time you weigh in, you shift the group's “neutral” toward you — and replace their thinking with yours. The traps below have names for a reason.",
};

export const ROLE_TILES_HIGH: Tile[] = [
  { pop: "p-airtime", title: "Cap your airtime at ~20%", desc: "More than a fifth of the session, and they generated less than they could have." },
  { pop: "p-advice", title: "Tame the Advice Monster", desc: "The reflex to answer instead of asking one more question." },
  { pop: "p-sharp", title: "Spend expertise on questions", desc: "Your context lets you ask sharper questions than a novice could." },
  { pop: "p-hat", title: "Wear the expert hat explicitly", desc: "When a correction matters: name the switch, make it, hand it back." },
  { pop: "p-whale", title: "W.H.A.L.E.", desc: "Ask one question, then actually hold the silence." },
  { pop: "p-breathe", title: "Let wrong-ish takes breathe", desc: "Correct only errors the discussion can't self-correct." },
];

export const ROLE_CALLOUT_SPINE: Callout = {
  variant: "blue",
  html: "<strong>Both lanes share one spine:</strong> open the topic wide, hold the group through disagreement, close with decisions — the <button data-pop=\"p-diamond\">Diamond of Participation</button>. The most common failure: rescuing the group from the <button data-pop=\"p-groan\">groan zone</button> the moment it gets uncomfortable.",
};

/* ========================= 02 · TAKES ========================= */

export const TAKES_HEAD = {
  title: "Good takes vs. bad takes",
  lede: "Weak takes in verification discussions are rarely factually wrong — they're <em>unengaged</em>: vibes about the topic instead of reasoning about the mechanism. You can spot that without expertise. Four tests.",
};

export const TAKES_TILES: Tile[] = [
  { pop: "p-t1", title: "T1 · Mechanism test", desc: "Does it engage how the proposal actually works?" },
  { pop: "p-t2", title: "T2 · Adversary test", desc: "Does it consider how a motivated violator adapts?" },
  { pop: "p-t3", title: "T3 · Falsifiability test", desc: "Could any evidence change this view?" },
  { pop: "p-t4", title: "T4 · Split test", desc: "Feasible ≠ achievable ≠ worth the cost. Which is it arguing?" },
];

export const TAKES_SORTER_HEAD = {
  heading: "You make the call",
  note: "Six real takes you'll hear in session. Strong or weak? Click your call — each verdict includes the facilitator move to use live.",
};

export type Verdict = "strong" | "weak";

/** One item in the 6-quote strong/weak sorter. `verdict` html includes the
 *  bold classification and the italic "Your move" span, lifted verbatim. */
export interface SorterItem {
  answer: Verdict;
  quote: string;
  /** verdict HTML — a <strong>…</strong> then prose then <span class="move">…</span>. */
  verdictHtml: string;
}

export const TAKES_SORTER: SorterItem[] = [
  {
    answer: "weak",
    quote:
      "“None of this matters — countries will just cheat. You can't verify anything in AI.”",
    verdictHtml:
      "<strong>Weak — unfalsifiable (fails T1, T3).</strong> Proves too much: the same argument applied to nuclear arms control, where verification regimes got built anyway. No specific failure point named. <span class=\"move\">Your move: “Which link fails — chip manufacturing, data-center audits, or usage reporting? Pick one and tell us how you'd beat it.”</span>",
  },
  {
    answer: "strong",
    quote:
      "“Fab-level chip tracking is plausible — there are only a handful of leading-edge fabs. But the scheme leaks at resale: the paper quietly assumes a chip registry that doesn't exist yet.”",
    verdictHtml:
      "<strong>Strong — engaged (passes T1, T2).</strong> Names the actual mechanism, locates a specific weak link, separates what exists from what's assumed. <span class=\"move\">Your move: amplify it. “Stay on that — how hard would that registry be to build? Who'd run it?”</span>",
  },
  {
    answer: "weak",
    quote: "“We should just do what the IAEA does for nukes.”",
    verdictHtml:
      "<strong>Weak — analogy on autopilot (fails T1).</strong> Model weights are copyable, movable, dual-use; fissile material is none of those. <span class=\"move\">Your move: “Name one way AI is disanalogous to fissile material. Does the IAEA approach survive it?”</span>",
  },
  {
    answer: "strong",
    quote:
      "“IAEA inspections assume the target is hard to move and hard to hide. Weights are neither — so you'd verify the training run instead: compute, energy, time. Those leave physical footprints.”",
    verdictHtml:
      "<strong>Strong — analogy stress-tested (passes T1, T2, T4).</strong> Uses the analogy to find the load-bearing assumption, then redirects to what <em>is</em> observable. <span class=\"move\">Your move: “So what does an ‘inspection’ of a training run look like? Sketch it.”</span>",
  },
  {
    answer: "weak",
    quote:
      "“This will never happen — the US and China can't agree on anything.”",
    verdictHtml:
      "<strong>Weak — conversation stopper (fails T4).</strong> Collapses political likelihood into technical feasibility, and ends discussion instead of advancing it. <span class=\"move\">Your move: “Separate the two: suppose the political will existed — does the mechanism work? We'll come back to the politics.”</span>",
  },
  {
    answer: "strong",
    quote:
      "“Verification isn't just policing — it lets a compliant state cheaply prove compliance. That changes whether states want to join at all.”",
    verdictHtml:
      "<strong>Strong — incentive-aware (passes T2, T4).</strong> Reasons about both sides' incentives; reframes feasibility as partly a function of the mechanism itself. <span class=\"move\">Your move: “Who loses under that logic? Steelman the state that refuses to join.”</span>",
  },
];

export const TAKES_CALLOUT: Callout = {
  variant: "brown",
  html: "<strong>You referee the process, not the verdict.</strong> When you can't judge a take on the merits: ask <em>“what would change your mind?”</em>, request the causal chain, or assign someone to <button data-pop=\"p-steelman\">steelman</button> the opposite view. Any of these upgrades a weak take without you ruling on it.",
};

/* ========================= 03 · PARTICIPATION ========================= */

export const PART_HEAD = {
  title: "Getting everyone talking",
  lede: "Whoever speaks first anchors the whole conversation. So never open a question to the fastest hand: give thinking time first, then widen who's heard. Click any technique — each includes its async fallback.",
};

export const PART_TILES: Tile[] = [
  { pop: "p-write", title: "Write before anyone speaks", desc: "60–90 seconds of silent writing kills the fastest-talker anchor.", timing: "2 min · both" },
  { pop: "p-1244", title: "1-2-4-All", desc: "Alone → pairs → fours → one idea each. Everyone speaks twice before the full group hears anything.", timing: "12 min · sync" },
  { pop: "p-wave", title: "Chat wave", desc: "Everyone types, nobody sends — then release all answers at once.", timing: "3 min · virtual" },
  { pop: "p-pppb", title: "Pose–Pause–Pounce–Bounce", desc: "Ask everyone, hold the silence, name someone, then bounce their answer onward.", timing: "ongoing · sync" },
  { pop: "p-warm", title: "Warm cold-calls", desc: "“In two minutes I'll ask you, Sam…” — accountability without ambush.", timing: "5 min · sync" },
  { pop: "p-checkin", title: "Check-ins & check-outs", desc: "Everyone speaks once in the first five minutes — speaking again gets far easier.", timing: "5 min · both" },
];

export const PART_CALLOUT: Callout = {
  variant: "blue",
  html: "<strong>Silence is a tool, not a failure.</strong> After you ask a question, count 10 seconds before rescuing it — and if you must speak, re-ask the question, don't answer it. Also do the <button data-pop=\"p-arithmetic\">meeting arithmetic</button>: 8 people × 3 minutes each is already 24 minutes.",
};

/* ========================= 04 · AGENCY ========================= */

export const AGENCY_HEAD = {
  title: "Agency, not regurgitation",
  lede: "Summarizing the reading correctly demonstrates storage. The track needs <em>transfer</em> — using verification concepts on problems the reading never covered. The lever: never ask questions the reading already answers.",
};

export const AGENCY_TILES: Tile[] = [
  { pop: "p-attack", title: "Swap “summarize” for “attack”", desc: "“What's the weakest assumption in the paper?” gets recall for free." },
  { pop: "p-seat", title: "Argue from a seat", desc: "Negotiator, inspector, evading state — argue the seat's incentives, not your own." },
  { pop: "p-design", title: "Design under constraint", desc: "“Ten minutes: sketch a regime, then tell us where it breaks first.”" },
  { pop: "p-wrong", title: "“What did the author get wrong?”", desc: "License disagreement with the syllabus — once, and the cohort changes." },
  { pop: "p-consequence", title: "The consequence question", desc: "“If we adopt this mechanism, what are we saying no to?”" },
  { pop: "p-commit", title: "Close with a commitment", desc: "“What will you go find out before next session?” Then actually collect it." },
];

export const AGENCY_CALLOUT: Callout = {
  variant: "brown",
  html: "<strong>Calibrate difficulty, not comfort.</strong> Tasks should sit just past what the group finds easy — <button data-pop=\"p-difficulty\">desirable difficulty</button>. Instant answers mean the question was recall in costume. A fully stalled room means shrink the question, not the ambition: “just the first step of the causal chain.”",
};

/* ========================= 05 · CONVERTER ========================= */

export const CONVERT_HEAD = {
  title: "Async → sync converter",
  lede: "The track's materials are written async-first. Each recipe turns one async element into a live segment with timings — assemble a session straight from the week's materials. The pattern behind all six: <strong>retrieve → collide → converge</strong>.",
};

export const CONVERT_TILES: Tile[] = [
  { pop: "p-c-reading", title: "Assigned reading", desc: "→ Cold-open retrieval: “one sentence, one weak link.”", timing: "8 min" },
  { pop: "p-c-thread", title: "Discussion-thread question", desc: "→ Simultaneous post-up, then put the two most-disagreeing answers in conversation.", timing: "8 min" },
  { pop: "p-c-reflect", title: "Written reflection prompt", desc: "→ 1-2-4-All: the same thinking, stress-tested twice before it surfaces.", timing: "12 min" },
  { pop: "p-c-quiz", title: "Comprehension quiz", desc: "→ Vote & defend: poll, argue, re-poll. Belief updating, made visible.", timing: "6 min" },
  { pop: "p-c-deep", title: "Optional deep-dives", desc: "→ Jigsaw: split the readings, teach back in trios. 3× coverage.", timing: "14 min" },
  { pop: "p-c-debate", title: "Written debate / memo", desc: "→ Live red team: violators attack the regime inspectors design.", timing: "13 min" },
];

export const CONVERT_CALLOUT: Callout = {
  variant: "blue",
  html: "<strong>Going the other way?</strong> Any sync activity converts back: “minutes” become “days,” the chat wave becomes hidden-until-deadline posts, breakout rooms become tagged sub-threads. The structure survives the medium. Mixed cohorts: run sync, then post the doc's open questions as the week's async thread — <button data-pop=\"p-spaced\">spaced practice</button> for free.",
};

/* ========================= 06 · SESSION SKELETON ========================= */

export const SESSION_HEAD = {
  title: "The 60-minute session",
  lede: "Open wide, hold the disagreement, close deliberately — the <button data-pop=\"p-diamond\">Diamond of Participation</button>. Click any block for how to run it. Paste prompts into chat as you say them; nobody remembers spoken instructions.",
};

export const SESSION_STAGES: Stage[] = [
  { pop: "p-s1", num: "0–5", title: "Check-in", desc: "One round, everyone speaks.", phase: "open" },
  { pop: "p-s2", num: "5–13", title: "Cold-open retrieval", desc: "“One sentence, one weak link.”", phase: "open" },
  { pop: "p-s3", num: "13–35", title: "Main discussion", desc: "2–3 questions from the map.", phase: "explore" },
  { pop: "p-s4", num: "35–50", title: "Structured activity", desc: "One converter recipe.", phase: "explore" },
  { pop: "p-s5", num: "50–57", title: "Converge", desc: "Settled, disputed, parked.", phase: "close" },
  { pop: "p-s6", num: "57–60", title: "Check-out", desc: "Most useful thing + one commitment.", phase: "close" },
];

export const SESSION_CALLOUT: Callout = {
  variant: "brown",
  html: "<strong>The middle is supposed to feel messy.</strong> Minutes 13–50 are the <button data-pop=\"p-groan\">groan zone</button> — your job is to keep the group in productive disagreement about five minutes longer than is comfortable, not to resolve it early.",
};

/* ========================= 07 · RESOURCES ========================= */

export const RESOURCES_HEAD = {
  title: "Resources",
  lede: "Short list, deliberately. Everything here earns its place.",
};

export const RESOURCES_BOXES: ResBox[] = [
  {
    heading: "Facilitation craft",
    items: [
      { html: "<a href=\"https://medium.com/@hannahpixels/12-top-takeaways-from-the-coaching-habit-e2ea3028ec34\" target=\"_blank\" rel=\"noopener\">12 takeaways from The Coaching Habit</a><small>The seven questions — AWE, Focus, Consequence — in a 5-minute read.</small>" },
      { html: "<a href=\"https://www.liberatingstructures.com/\" target=\"_blank\" rel=\"noopener\">Liberating Structures</a><small>33 open-source structures; start with <a href=\"https://www.liberatingstructures.com/1-1-2-4-all/\" target=\"_blank\" rel=\"noopener\">1-2-4-All</a>.</small>" },
      { html: "<a href=\"https://checkinsuccess.com/question-archive/\" target=\"_blank\" rel=\"noopener\">Check-in question archive</a><small>Hundreds of openers, searchable by tone and length.</small>" },
    ],
  },
  {
    heading: "Learning science",
    items: [
      { html: "<a href=\"https://www.pnas.org/doi/10.1073/pnas.1319030111\" target=\"_blank\" rel=\"noopener\">Freeman et al. 2014 (PNAS)</a><small>The 225-study meta-analysis: failure rates 55% higher under lecturing.</small>" },
      { html: "<a href=\"https://www.retrievalpractice.org/\" target=\"_blank\" rel=\"noopener\">RetrievalPractice.org</a><small>Practical guides to the generation effect and spaced practice.</small>" },
      { html: "<a href=\"https://www.hup.harvard.edu/books/9780674729018\" target=\"_blank\" rel=\"noopener\">Make It Stick</a><small>The book-length version of this guide's “why it works” notes.</small>" },
    ],
  },
  {
    heading: "Verification context",
    items: [
      { html: "<a href=\"https://cset.georgetown.edu/publication/ai-verification/\" target=\"_blank\" rel=\"noopener\">AI Verification (CSET)</a><small>Mechanism-by-mechanism survey — the best low-context primer.</small>" },
      { html: "<a href=\"https://arxiv.org/abs/2408.16074\" target=\"_blank\" rel=\"noopener\">Verification methods for international AI agreements</a><small>Ten concrete methods, adversary-tested.</small>" },
      { html: "<a href=\"https://arxiv.org/abs/2402.08797\" target=\"_blank\" rel=\"noopener\">Computing Power and the Governance of AI</a><small>Why compute is the thing treaties can actually see.</small>" },
    ],
  },
  {
    heading: "Your track materials",
    items: [
      { html: "<a href=\"https://the-verification-game.netlify.app\" target=\"_blank\" rel=\"noopener\">The Verification Game</a><small>Violator-vs-inspector exercise — pairs with the red-team recipe.</small>" },
      { html: "<a href=\"https://verification-intro.netlify.app\" target=\"_blank\" rel=\"noopener\">The Verification Problem</a><small>Scrolling intro — good pre-read for week one.</small>" },
      { html: "<a href=\"https://rainbow-puppy-79f680.netlify.app\" target=\"_blank\" rel=\"noopener\">IR Primer</a><small>International-relations background for low-context cohorts.</small>" },
    ],
  },
];

/* ========================= SESSION-PLAN VIEWS (08–12) ========================= */

/** A prep callout that differs by format. */
export interface FormatPrep {
  ip: string; // HTML for in-person
  zm: string; // HTML for Zoom
}

/** A session-plan view. */
export interface SessionPlan {
  id: string;
  title: string;
  lede: string; // HTML
  principles?: readonly string[]; // the "chips" row (matrix plan only)
  prep: FormatPrep;
  coreHeading?: string; // "The game core" (game plan)
  coreNote?: string;
  coreTiles?: Tile[];
  stages: Stage[];
  promptsHeading: string;
  promptsNote?: string;
  promptTiles: Tile[];
  sendHeading: string;
  sendBox: ResBox;
  seed: Callout; // "Seed the week's thread" callout
  nextId?: string; // next session-plan target
  nextLabel?: string;
}

export const SESSION_PLANS: SessionPlan[] = [
  {
    id: "m-intro",
    title: "Session plan · The introduction",
    lede: "Pairs with the opening video and <a href=\"https://verification-intro.netlify.app\" target=\"_blank\" rel=\"noopener\">The Verification Problem</a>. Participants arrive having watched and scrolled; the live hour makes the arms-race logic something they <em>felt</em> — and gives the skeptics room to push back out loud. 60 minutes.",
    prep: {
      ip: "<strong>Prep:</strong> one red and one black card (or two folded slips) per team for the Two Labs game · payoff matrix printed or projected · whiteboard for the shared risk track · envelopes for the baseline reflections (yes, literal sealed envelopes — they reappear at track's end).",
      zm: "<strong>Prep:</strong> a slide with the Two Labs payoff matrix and a visible risk track · two team breakout rooms · commitments arrive by direct message to you each round · a form for baseline reflections, resurfaced in the final week. At 12+ participants, a co-host to collect DMs helps.",
    },
    stages: [
      { pop: "p-in-s1", num: "0–5", title: "Check-in", desc: "“One word for how the intro left you.”", phase: "open" },
      { pop: "p-in-s2", num: "5–13", title: "Chain retrieval", desc: "Rebuild the three-step argument from memory.", phase: "open" },
      { pop: "p-in-s3", num: "13–28", title: "“Two Labs”", desc: "A four-round arms race, played for real points.", phase: "explore" },
      { pop: "p-in-s4", num: "28–47", title: "Discussion", desc: "Two or three prompts from below.", phase: "explore" },
      { pop: "p-in-s5", num: "47–55", title: "Converge + baseline", desc: "Settled / disputed / parked, then seal a prediction.", phase: "close" },
      { pop: "p-in-s6", num: "55–60", title: "Check-out", desc: "One claim you'll go stress-test this week.", phase: "close" },
    ],
    promptsHeading: "Discussion prompts",
    promptsNote:
      "Pick two or three based on what the game surfaced. Each opens with the follow-up move.",
    promptTiles: [
      { pop: "p-in-d1", title: "“Which link of the chain is weakest?”", desc: "Preference → coordination → verification. Make them commit to one." },
      { pop: "p-in-d2", title: "“Steelman the securitization skeptic”", desc: "The intro suspends normal politics. History has abused that move." },
      { pop: "p-in-d3", title: "“Where does the nuclear parallel break?”", desc: "Copyable weights vs. fissile material — name the worst disanalogy." },
      { pop: "p-in-d4", title: "“What would change your mind?”", desc: "Falsifiability, applied to the arms-race framing itself." },
    ],
    sendHeading: "After the session, send them to",
    sendBox: {
      heading: "Links",
      items: [
        { html: "<a href=\"https://verification-intro.netlify.app\" target=\"_blank\" rel=\"noopener\">The Verification Problem</a><small>Re-scroll it, then show a smart friend — note where the friend pushes back.</small>" },
        { html: "<a href=\"https://rainbow-puppy-79f680.netlify.app\" target=\"_blank\" rel=\"noopener\">IR Primer</a><small>For anyone who felt underwater during the treaty and state-behavior talk.</small>" },
        { html: "<a href=\"https://cset.georgetown.edu/publication/ai-verification/\" target=\"_blank\" rel=\"noopener\">AI Verification (CSET)</a><small>Skim the mechanism list now; the deep read comes with Module 2.</small>" },
      ],
    },
    seed: {
      variant: "brown",
      html: "<strong>Seed the week's thread:</strong> “Where did your friend push back on the intro's argument — and could you answer them?” Collect the best pushback at next session's check-in.",
    },
    nextId: "m-game",
    nextLabel: "Next: The Verification Game, live →",
  },
  {
    id: "m-game",
    title: "Session plan · The Verification Game, live",
    lede: "The solo timeline at <a href=\"https://the-verification-game.netlify.app\" target=\"_blank\" rel=\"noopener\">the-verification-game.netlify.app</a> becomes <strong>“The Decade”</strong>: 2026–2032 in six rounds, for 10–15 players. The room starts at the fork with no regime and ends up walking Path A, B, or C — by its own choices, replayed against the map in the debrief. 90–120 minutes; the one plan here that needs real prep.",
    prep: {
      ip: "<strong>Prep — the print kit:</strong> role cards · sealed directive envelopes · carbon-copy Program Sheets (public slip on top, truth beneath) · allocation screens · rumor deck (half true, half false, identical backs) · audit-chit bag · fill-in-the-blank treaty templates that get taped to the wall when signed · a big map board with the risk track · two timers. Room: one plenary table plus three corner “capitals.” Do one solo dry run of your Control checklist first — Control is the hard seat.",
      zm: "<strong>Prep — the no-code kit:</strong> main room is the plenary with the map on permanent screen share; persistent breakouts are the capitals plus an IVA office; bilaterals on request, capped at two concurrent (queueing for a side room is realistic diplomacy pressure). Everyone renames to their seat (<em>US · HoG</em>, <em>CN · NSA</em>). Allocations arrive by one Google Form per round; intel travels by direct message from you. Recruit a co-facilitator (“Vice-Control”) to run DMs while you run the plenary — solo Control on Zoom drowns.",
    },
    coreHeading: "The game core",
    coreNote:
      "Five pieces. Read all five before you run it; the information matrix is the whole point.",
    coreTiles: [
      { pop: "p-vg-seats", title: "Seats & delegations", desc: "Three capitals × three internal roles, an inspection agency, a press seat — and you as Control." },
      { pop: "p-vg-directives", title: "Secret directives", desc: "Nobody knows if they face a Hegemon or a Survivor. That uncertainty <em>is</em> the security dilemma." },
      { pop: "p-vg-loop", title: "The round loop", desc: "Intel → diplomacy → secret allocation → verification → resolution. ~12 minutes, six times." },
      { pop: "p-vg-matrix", title: "The information matrix", desc: "What anyone can see depends on the regime the players themselves built. Includes the ZK trick." },
      { pop: "p-vg-risk", title: "Risk & endings", desc: "A public risk track, warning shots, and a decade roll weighted by what the room built." },
    ],
    stages: [
      { pop: "p-vg-t1", num: "0:00", title: "Setup & briefing", desc: "Roles, directives, one-page rules.", phase: "open" },
      { pop: "p-vg-t2", num: "0:15", title: "Round 1 · 2026", desc: "Forced fog — no treaty may be signed.", phase: "open" },
      { pop: "p-vg-t3", num: "0:27", title: "Rounds 2–5", desc: "Treaties, audits, leaks, sanctions — as the room chooses.", phase: "explore" },
      { pop: "p-vg-t4", num: "1:15", title: "Round 6 + decade roll", desc: "Final allocations, then the public roll on the map.", phase: "explore" },
      { pop: "p-vg-t5", num: "1:30", title: "Debrief", desc: "Reveal everything, replay the path, name the lenses.", phase: "close" },
    ],
    promptsHeading: "Debrief prompts",
    promptsNote:
      "The debrief is where the game becomes the curriculum — protect the last 20 minutes ruthlessly.",
    promptTiles: [
      { pop: "p-vg-d1", title: "“When did you first assume the worst?”", desc: "And were you right? Attribution under fog, examined." },
      { pop: "p-vg-d2", title: "“What information would have changed round N?”", desc: "Converts frustration into the case for verification infrastructure." },
      { pop: "p-vg-d3", title: "“Who refused inspection — and why?”", desc: "Sovereignty, secrets, or cost. The Lab Directors will have opinions." },
      { pop: "p-vg-d4", title: "“Which lens were you running?”", desc: "Each delegation names its actual model of state behavior." },
    ],
    sendHeading: "After the session, send them to",
    sendBox: {
      heading: "Links",
      items: [
        { html: "<a href=\"https://the-verification-game.netlify.app\" target=\"_blank\" rel=\"noopener\">The Verification Game (solo)</a><small>Replay it and deliberately walk the two paths the room didn't.</small>" },
        { html: "<a href=\"https://arxiv.org/abs/2408.16074\" target=\"_blank\" rel=\"noopener\">Verification methods for international AI agreements</a><small>Match the game's mechanics to the paper's ten real methods.</small>" },
        { html: "<a href=\"https://rainbow-puppy-79f680.netlify.app\" target=\"_blank\" rel=\"noopener\">IR Primer</a><small>The lenses the debrief just made concrete.</small>" },
      ],
    },
    seed: {
      variant: "brown",
      html: "<strong>Seed the week's thread:</strong> each delegation posts a one-paragraph in-character memoir of its decade — what it feared, what it hid, what it would do differently. Read them aloud when the cohort next meets.",
    },
    nextId: "m-history",
    nextLabel: "Next: History & the state of the field →",
  },
  {
    id: "m-history",
    title: "Session plan · History & the state of the field",
    lede: "Pairs with the state-of-the-field explainer: nuclear safeguards, the BWC's missing teeth, and where AI verification actually stands. Live, fifty years of precedent becomes raw material — participants pitch, attack, and loot historical regimes to assemble one for AI. 75 minutes.",
    prep: {
      ip: "<strong>Prep:</strong> one printed regime brief per team (a single page each) · timeline event cards for the scramble · a wall plus sticky notes — it becomes the “franken-regime” board where looted components get posted.",
      zm: "<strong>Prep:</strong> a regime brief doc linked in each breakout room · the timeline scramble on one shared slide · a whiteboard or slide for the franken-regime · a poll for the loot vote. Pitches happen in plenary; prep happens in breakouts.",
    },
    stages: [
      { pop: "p-hx-s1", num: "0–5", title: "Check-in", desc: "“One verification regime you'd heard of before this track — even vaguely.”", phase: "open" },
      { pop: "p-hx-s2", num: "5–15", title: "Timeline scramble", desc: "Order the milestones before the reveal.", phase: "open" },
      { pop: "p-hx-s3", num: "15–50", title: "The Precedent Draft", desc: "Pitch, cross-examine, loot.", phase: "explore" },
      { pop: "p-hx-s4", num: "50–70", title: "Discussion", desc: "One or two prompts, then converge.", phase: "explore" },
      { pop: "p-hx-s5", num: "70–75", title: "Check-out", desc: "One component of the franken-regime you'd actually defend.", phase: "close" },
    ],
    promptsHeading: "Discussion prompts",
    promptTiles: [
      { pop: "p-hx-d1", title: "“Does the BWC comfort you or worry you?”", desc: "Fifty years, no verification protocol — and a covert Soviet program the whole time." },
      { pop: "p-hx-d2", title: "“What's AI's nearest physical handle?”", desc: "Every regime in history verified something physical. What's ours?" },
      { pop: "p-hx-d3", title: "“Solved, partial, or proposal?”", desc: "Sort today's AI verification stack honestly. Feeds Module 2." },
      { pop: "p-hx-d4", title: "“Where does an IAEA-for-AI fail first?”", desc: "Funding, access, staffing, politicization — the IAEA's own history answers." },
    ],
    sendHeading: "After the session, send them to",
    sendBox: {
      heading: "Links",
      items: [
        { html: "<a href=\"https://www.iaea.org/topics/safeguards-and-verification\" target=\"_blank\" rel=\"noopener\">IAEA safeguards &amp; verification</a><small>The real machinery behind the regime your team pitched (or attacked).</small>" },
        { html: "<a href=\"https://www.armscontrol.org/factsheets\" target=\"_blank\" rel=\"noopener\">Arms Control Association fact sheets</a><small>Pick the regime you drafted from and read what it actually says.</small>" },
        { html: "<a href=\"https://cset.georgetown.edu/publication/ai-verification/\" target=\"_blank\" rel=\"noopener\">AI Verification (CSET)</a><small>The state-of-the-field survey — now with fifty years of context.</small>" },
        { html: "<a href=\"https://arxiv.org/abs/2408.16074\" target=\"_blank\" rel=\"noopener\">Verification methods for international AI agreements</a><small>Which of the ten methods echo a precedent from today's session?</small>" },
      ],
    },
    seed: {
      variant: "brown",
      html: "<strong>Seed the week's thread:</strong> “Post the component your team looted for the franken-regime — and one way it fails for AI that it didn't fail for its original domain.”",
    },
    nextId: "m-matrix",
    nextLabel: "Next: The policy matrix, embodied →",
  },
  {
    id: "m-matrix",
    title: "Session plan · The policy matrix, embodied",
    lede: "Pairs with the effectiveness × feasibility sorting interactive. Async, each participant placed five policies on a plane alone; live, the plane goes on the floor (or the whiteboard), the placements argue with each other — and then the world starts moving. 70 minutes.",
    principles: [
      "Self-governance",
      "Domestic regulation",
      "Transparency coordination",
      "If/then conditional pause",
      "Full pause",
    ],
    prep: {
      ip: "<strong>Prep:</strong> masking-tape axes on the floor, big enough to stand on (effectiveness up, feasibility right) — or a wall grid · sticky notes in five colors, one color per policy · the four event cards printed. For the most contested policy, participants <em>are</em> the dots: stand where your placement is and argue from there.",
      zm: "<strong>Prep:</strong> a shared slide with the plane and a pre-made draggable dot per participant per policy (five colors) · a duplicate of the slide for each event round, so the “before” survives · the event cards as slides. Everyone drags simultaneously — the chat-wave rule applies: nobody moves until you say go.",
    },
    stages: [
      { pop: "p-mx-s1", num: "0–5", title: "Check-in", desc: "“Something from any domain that's perfectly feasible and useless.”", phase: "open" },
      { pop: "p-mx-s2", num: "5–12", title: "Own the axes", desc: "Define both axes in your own words before placing anything.", phase: "open" },
      { pop: "p-mx-s3", num: "12–30", title: "Place & argue", desc: "Silent placement, then the widest-spread policy goes on trial.", phase: "explore" },
      { pop: "p-mx-s4", num: "30–47", title: "The world moves", desc: "Four event cards; sixty seconds to re-place after each.", phase: "explore" },
      { pop: "p-mx-s5", num: "47–62", title: "Discussion", desc: "Two prompts, chosen by what moved.", phase: "explore" },
      { pop: "p-mx-s6", num: "62–70", title: "Converge + check-out", desc: "Which placement do you still disagree with?", phase: "close" },
    ],
    promptsHeading: "Discussion prompts",
    promptTiles: [
      { pop: "p-mx-d1", title: "“Which failure mode are we drifting toward?”", desc: "Feasible-but-ineffective theater, or effective-but-infeasible paper?" },
      { pop: "p-mx-d2", title: "“Does securitization break the frame?”", desc: "If ASI is existential, is tradeoff reasoning itself suspended?" },
      { pop: "p-mx-d3", title: "“Feasibility for whom?”", desc: "The axis silently assumes an actor. Redraw it and watch placements flip." },
      { pop: "p-mx-d4", title: "“What was your estimate really tracking?”", desc: "If one news event moved a policy three squares, was it ever about infrastructure?" },
    ],
    sendHeading: "After the session, send them to",
    sendBox: {
      heading: "Links",
      items: [
        { html: "The matrix interactive's answer key<small>Re-do the async sort after the session and compare against the room's final board.</small>" },
        { html: "<a href=\"https://arxiv.org/abs/2402.08797\" target=\"_blank\" rel=\"noopener\">Computing Power and the Governance of AI</a><small>Why compute is the operative threshold — the load-bearing feasibility fact.</small>" },
        { html: "The thresholds explainer (module 0.2.3)<small>Compute vs. capability thresholds: what a pause treaty actually measures.</small>" },
      ],
    },
    seed: {
      variant: "brown",
      html: "<strong>Seed the week's thread:</strong> post the photo (or screenshot) of the room's final matrix plus “one placement you still disagree with, and your best argument.” The disagreements are next week's warm-up.",
    },
    nextId: "m-anatomy",
    nextLabel: "Next: Anatomy of a policy →",
  },
  {
    id: "m-anatomy",
    title: "Session plan · Anatomy of a policy",
    lede: "Pairs with the drag-and-drop anatomy exercise — actor, agreement, purpose, result, and what treaties say out loud versus leave implicit. Live, the parts go back together: teams draft a pause treaty in eight sentences, then the next team takes it apart. 70 minutes.",
    prep: {
      ip: "<strong>Prep:</strong> printed skeleton templates — four labeled slots (ACTOR / AGREEMENT / PURPOSE / RESULT) plus one verification clause · red pens for the exploit phase · a whiteboard scorecard for the tribunal. Drafts physically rotate one table clockwise.",
      zm: "<strong>Prep:</strong> one Google Doc per breakout team with the template pre-pasted · exploit phase = teams open the <em>next</em> team's doc and file exploits as comments · tribunal in plenary, reading comments aloud · votes by reaction or poll.",
    },
    stages: [
      { pop: "p-an-s1", num: "0–5", title: "Check-in", desc: "“One clause from any treaty, contract, or ToS that stuck with you.”", phase: "open" },
      { pop: "p-an-s2", num: "5–20", title: "Draft", desc: "A pause treaty in eight sentences, max.", phase: "open" },
      { pop: "p-an-s3", num: "20–32", title: "Swap & exploit", desc: "You are now counsel to an evading state.", phase: "explore" },
      { pop: "p-an-s4", num: "32–47", title: "Tribunal", desc: "Exploit, rebuttal, verdict: holds or gutted.", phase: "explore" },
      { pop: "p-an-s5", num: "47–55", title: "Lens flip", desc: "Read your own draft as a realist, then an institutionalist.", phase: "explore" },
      { pop: "p-an-s6", num: "55–70", title: "Discussion + check-out", desc: "Why do real treaties leave the same things unsaid?", phase: "close" },
    ],
    promptsHeading: "Discussion prompts",
    promptTiles: [
      { pop: "p-an-d1", title: "“Everyone left enforcement implicit”", desc: "So do real treaties. Why — and who benefits from the silence?" },
      { pop: "p-an-d2", title: "“Which slot was hardest?”", desc: "Actor, agreement, purpose, or result — it predicts where real negotiations stall." },
      { pop: "p-an-d3", title: "“When is ambiguity a feature?”", desc: "Constructive ambiguity: vagueness that lets both sides sign." },
      { pop: "p-an-d4", title: "“What did the other lens see?”", desc: "Same eight sentences, two different treaties. Which reading felt truer?" },
    ],
    sendHeading: "After the session, send them to",
    sendBox: {
      heading: "Links",
      items: [
        { html: "The anatomy interactive (module 0.2.4)<small>Do it (or re-do it) after drafting — the answer key lands differently once you've been exploited.</small>" },
        { html: "<a href=\"https://rainbow-puppy-79f680.netlify.app\" target=\"_blank\" rel=\"noopener\">IR Primer</a><small>The realist and institutionalist lenses the flip just exercised.</small>" },
        { html: "<a href=\"https://www.armscontrol.org/factsheets\" target=\"_blank\" rel=\"noopener\">Arms Control Association fact sheets</a><small>Pick one real treaty and list three things it leaves implicit.</small>" },
      ],
    },
    seed: {
      variant: "brown",
      html: "<strong>Seed the week's thread:</strong> post your team's best exploit and whether the rebuttal held. Bonus: find the same loophole pattern in a real treaty's text.",
    },
  },
];

/**
 * All 99 popup bodies — HTML lifted verbatim from the source popstore
 * (identical to public/verification/content/facilitator-guide.json). Each body
 * opens with an <h3> heading (used as the Dialog title, then stripped from the
 * rendered body) followed by authored prose, quotes (<span class="say">),
 * medium tags (<span class="mt">), ordered/unordered lists, and links.
 */
export const FG_POPUPS: Record<string, string> = {
  "p-bounce":
    "<h3>Bounce it back to the group</h3>\n    <p>You never have to adjudicate a claim yourself — redirect it and let the group do the verification.</p>\n    <span class=\"say\">“Interesting — does anyone see it differently?” · “What would the author say to that?”</span>\n    <p>This isn't a dodge; it's the job. The group's collective knowledge nearly always exceeds any one member's, including yours.</p>",
  "p-chain":
    "<h3>Ask for the causal chain</h3>\n    <p>You can evaluate <strong>reasoning structure</strong> without expert knowledge. Ask people to walk through the steps; gaps become visible to everyone — including the speaker.</p>\n    <span class=\"say\">“Walk us from ‘chips are tracked’ to ‘the treaty holds.’ What are the steps in between?”</span>",
  "p-anchor":
    "<h3>Anchor to the reading</h3>\n    <p>The text is your co-facilitator. When a claim floats free of it, tether it.</p>\n    <span class=\"say\">“Which part of the reading supports that? Let's find it.”</span>\n    <p>Bonus: this trains the source-checking habit the verification track is literally about.</p>",
  "p-park":
    "<h3>Park what you can't resolve</h3>\n    <p>Keep a visible “parking lot” in the shared doc. Unresolved ≠ failed — flag it, then post an answer or source in the async channel after the session.</p>\n    <span class=\"say\">“Great question, and I don't want to guess. Parking it — I'll post what I find in the thread.”</span>",
  "p-qmap":
    "<h3>Use the question map</h3>\n    <p>The provided question map is a structured list of prompts per session, grouped by function — opening, probing, closing. Treat it as a <strong>menu, not a script</strong>: pick 3–4 questions live based on where the group is, and rephrase them to fit the conversation.</p>",
  "p-structure":
    "<h3>Trust the structure</h3>\n    <p>When discussion drifts or stalls, you don't need a smarter comment — you need a structure change: pairs, a timed write, a vote. Structure is a low-context facilitator's superpower, because it works regardless of content.</p>",
  "p-airtime":
    "<h3>Cap your airtime at ~20%</h3>\n    <p>If you spoke for more than a fifth of the session, participants generated less than they could have. Track it honestly — recording yourself once is humbling and useful.</p>\n    <p>The learning science is blunt: people remember what <em>they</em> think through, not what they hear. Your best insight, delivered as a monologue, mostly evaporates.</p>",
  "p-advice":
    "<h3>Tame the Advice Monster</h3>\n    <p>Michael Bungay Stanier's name for the reflex to jump in with answers instead of asking one more question. The fix is mechanical: ask a single question, then genuinely wait.</p>\n    <p>Related trap with a worse name: <strong>“facipulation”</strong> — steering the group toward a conclusion you decided on beforehand while performing neutrality. Groups detect it fast, and it permanently costs you trust.</p>\n    <p><a href=\"https://medium.com/@hannahpixels/12-top-takeaways-from-the-coaching-habit-e2ea3028ec34\" target=\"_blank\" rel=\"noopener\">The Coaching Habit takeaways →</a></p>",
  "p-sharp":
    "<h3>Spend expertise on questions</h3>\n    <p>Your context lets you ask sharper questions than a novice could — that's its highest-value use.</p>\n    <span class=\"say\">“This scheme assumes the compute threshold stays meaningful. What happens to it as algorithms get more efficient?”</span>\n    <p>A question like that transmits your expertise <em>and</em> makes the group do the thinking. Best of both.</p>",
  "p-hat":
    "<h3>Wear the expert hat explicitly</h3>\n    <p>When a factual correction genuinely matters, name the switch, make it briefly, then hand the reasoning back.</p>\n    <span class=\"say\">“Facilitator hat off for 30 seconds: the FLOP threshold in the reading is training compute, not inference. Hat back on — does that change anyone's argument?”</span>",
  "p-whale":
    "<h3>W.H.A.L.E.</h3>\n    <p><strong>W</strong>ait, <strong>H</strong>esitate, <strong>A</strong>sk again, <strong>L</strong>isten, then <strong>E</strong>xplain — a mnemonic to stop facilitators answering their own questions.</p>\n    <p>Don't stack three questions into one turn either. Ask one, then hold the silence — the awkward seconds are where the thinking happens.</p>\n    <p>Cheapest follow-up in the book: the AWE question — <em>“And what else?”</em> The first answer is rarely the best one.</p>",
  "p-breathe":
    "<h3>Let wrong-ish takes breathe</h3>\n    <p>If a flawed take is productive — it engages the mechanism and others can attack it — leave it alone. The group correcting it teaches more than you correcting it.</p>\n    <p>Correct only errors the discussion can't self-correct: a wrong number everyone is now building on, a misread definition.</p>",
  "p-diamond":
    "<h3>Diamond of Participation</h3>\n    <p>Discussions naturally <strong>open</strong> (diverge: many ideas), <strong>explore</strong> (emerge: disagreement, refinement), then <strong>close</strong> (converge: decisions, next steps).</p>\n    <p>Skipping any phase breaks the session — most commonly the middle, when facilitators rescue the group from discomfort. The 60-minute skeleton in module 06 is this diamond with timings.</p>",
  "p-groan":
    "<h3>The groan zone</h3>\n    <p>The frustrating middle stretch where ideas conflict and nothing feels resolved. It's where the actual thinking happens.</p>\n    <p>Your job is to hold the group there slightly <em>longer</em> than is comfortable — not rescue them from it. The payoff is ideas that address root causes instead of first impressions.</p>",
  "p-steelman":
    "<h3>Steelman</h3>\n    <p>Restating an opposing view in its strongest possible form before responding to it — the opposite of a strawman.</p>\n    <span class=\"say\">“Before we critique it, who can make the best case for it?”</span>",
  "p-arithmetic":
    "<h3>Meeting arithmetic</h3>\n    <p>People × minutes-each = time needed. Eight people sharing for three minutes is 24 minutes — before any discussion.</p>\n    <p>Naming the budget out loud (“90 seconds each”) lets the group self-regulate, so you don't have to cut anyone off.</p>",
  "p-difficulty":
    "<h3>Desirable difficulty</h3>\n    <p>Learning is strongest when a task sits just past comfortable — hard enough to require real effort, not so hard the learner disengages.</p>\n    <p>If every answer comes instantly, raise the bar. If the room fully stalls, shrink the question, not the ambition.</p>",
  "p-spaced":
    "<h3>Spaced practice</h3>\n    <p>Returning to material across multiple occasions builds far more durable memory than one intensive pass.</p>\n    <p>A sync session that seeds the week's async thread creates spacing automatically — the same ideas, retrieved again days later.</p>",
  "p-t1":
    "<h3>T1 · Mechanism test</h3>\n    <p>Does the take engage with how the proposal actually works — or would the sentence survive with the reading swapped for a different one?</p>\n    <p>“I don't trust this” fails. “The registry this assumes doesn't exist yet” passes. The test isn't agreement — it's contact with the mechanism.</p>",
  "p-t2":
    "<h3>T2 · Adversary test</h3>\n    <p>Verification is a game against an opponent, not a checklist. Does the take consider how a motivated violator adapts to the mechanism?</p>\n    <span class=\"say\">Upgrade question: “If you were the evading state, what's your first move against this scheme?”</span>",
  "p-t3":
    "<h3>T3 · Falsifiability test</h3>\n    <p>Could any evidence change this view? “States always cheat” and “this will obviously work” both fail — they're immune to data, so they can't be reasoned about.</p>\n    <span class=\"say\">Upgrade question: “What would change your mind?”</span>",
  "p-t4":
    "<h3>T4 · Split test</h3>\n    <p>Does it separate <strong>technically feasible</strong>, <strong>politically achievable</strong>, and <strong>worth the cost</strong>? Strong takes name which one they're arguing. Weak takes slide between them mid-sentence — usually from “politically hard” to “therefore technically pointless.”</p>\n    <span class=\"say\">Upgrade question: “Suppose the political will existed. Does the mechanism work?”</span>",
  "p-write":
    "<h3>Write before anyone speaks</h3>\n    <p>Pose the question, then 60–90 seconds of silent writing before any discussion. Kills the fastest-talker anchor and gives introverts a finished thought to share.</p>\n    <p><span class=\"mt\">Sync</span> — everyone writes in the shared doc simultaneously; you can see thinking land in real time.</p>\n    <p><span class=\"mt\">Async</span> — this is just… the async default. Which is why it converts so cleanly in both directions.</p>",
  "p-1244":
    "<h3>1-2-4-All</h3>\n    <ol>\n      <li><strong>1 min</strong> — think alone, in writing.</li>\n      <li><strong>2 min</strong> — pairs compare answers.</li>\n      <li><strong>4 min</strong> — fours look for where the pairs disagree.</li>\n      <li><strong>5 min</strong> — each four shares <em>one</em> idea that stood out (not a recap).</li>\n    </ol>\n    <p>Everyone speaks at least twice before anything hits the full group. The single best structure for quiet cohorts.</p>\n    <p><span class=\"mt\">Async</span> — post solo answers Monday → reply to one classmate Wednesday → facilitator synthesizes top threads Friday.</p>\n    <p><a href=\"https://www.liberatingstructures.com/1-1-2-4-all/\" target=\"_blank\" rel=\"noopener\">Full instructions at Liberating Structures →</a></p>",
  "p-wave":
    "<h3>Chat wave</h3>\n    <p>Everyone types an answer in chat but <strong>doesn't hit send</strong> until you say go. A flood of simultaneous, un-anchored answers — an instant read on where the group stands. Repeat 2–3 questions while momentum lasts.</p>\n    <p><span class=\"mt\">Async</span> — a form or poll with results hidden until the deadline.</p>",
  "p-pppb":
    "<h3>Pose – Pause – Pounce – Bounce</h3>\n    <ol>\n      <li><strong>Pose</strong> the question to everyone — not to a named person.</li>\n      <li><strong>Pause</strong> — a full 5–10 seconds. Longer than comfortable.</li>\n      <li><strong>Pounce</strong>: name someone. The pause means they've all been thinking.</li>\n      <li><strong>Bounce</strong> their answer onward: “Priya, what would you add to that?”</li>\n    </ol>\n    <p><span class=\"mt\">Async</span> — tag two people in the thread: “Sam, react to Jae's point above.”</p>",
  "p-warm":
    "<h3>Warm cold-calls</h3>\n    <p>Cold-calling with notice: <em>“In two minutes I'll ask you, Sam, which verification mechanism you'd fund first.”</em> All the accountability, none of the ambush. Rotate who gets warned across sessions.</p>\n    <p><span class=\"mt\">Async</span> — assign named respondents per question in the week's thread.</p>",
  "p-checkin":
    "<h3>Check-ins &amp; check-outs</h3>\n    <p>Open with a prompt everyone answers in one quick round — <em>“one word for how the reading left you.”</em> Everyone having spoken once makes speaking again far easier, and you get a temperature read on the group.</p>\n    <p>Close the same way: <em>“one thing you're taking with you.”</em></p>\n    <p><span class=\"mt\">Async</span> — an emoji-scale or one-liner check-in pinned at the top of the week's channel.</p>\n    <p><a href=\"https://checkinsuccess.com/question-archive/\" target=\"_blank\" rel=\"noopener\">Hundreds of prompts at Check-in Success →</a></p>",
  "p-attack":
    "<h3>Swap “summarize” for “attack”</h3>\n    <p>Replace <em>“Can someone recap the paper?”</em> with <em>“What's the weakest assumption in the paper?”</em></p>\n    <p>Recall happens anyway — you can't attack what you can't reconstruct — but the thinking is evaluative instead of reproductive. Same coverage, deeper processing.</p>",
  "p-seat":
    "<h3>Argue from a seat</h3>\n    <p>Assign roles: treaty negotiator, lab compliance officer, evading state, inspector. Each argues from their seat's incentives, not their own opinion.</p>\n    <p>Arguing a position you don't hold is the fastest route past received takes — and it makes the adversary test (T2) automatic.</p>\n    <p><span class=\"mt\">Async</span> — role-tagged thread: each person posts in-character; others reply in theirs.</p>",
  "p-design":
    "<h3>Design under constraint</h3>\n    <span class=\"say\">“Ten minutes, in pairs: sketch a verification regime for open-weight models. Then tell us where it breaks first.”</span>\n    <p>Producing something that <em>can fail</em> — and naming its own failure mode — is agency in miniature. The time pressure is a feature: it forces prioritization over polish.</p>\n    <p><span class=\"mt\">Async</span> — same task as a half-page memo; peers comment on where it breaks.</p>",
  "p-wrong":
    "<h3>“What did the author get wrong?”</h3>\n    <p>Ask it directly. The first time, the silence will be long — hold it.</p>\n    <p>Once one person disagrees with an assigned reading and survives, the cohort's relationship to the material changes permanently: from content to be absorbed into claims to be evaluated.</p>",
  "p-consequence":
    "<h3>The consequence question</h3>\n    <p>Borrowed from coaching: <em>“If we adopt this mechanism, what are we saying no to?”</em></p>\n    <p>Every verification regime spends something — political capital, privacy, compute overhead. Making trade-offs explicit forces participants to own a position instead of listing considerations.</p>",
  "p-commit":
    "<h3>Close with a commitment</h3>\n    <p>End on <em>“What's one thing you'll go find out before next session?”</em> — then actually open the next session by collecting the answers.</p>\n    <p>Learning that someone will ask about is learning that happens. It also hands you a pre-built check-in for next week.</p>",
  "p-c-reading":
    "<h3>Reading → cold-open retrieval</h3>\n    <p class=\"mt\">“One sentence, one weak link” · 8 min</p>\n    <ol>\n      <li><strong>3 min</strong> — silent write: the core mechanism in one sentence, plus its weakest link.</li>\n      <li><strong>2 min</strong> — chat wave or quick round: everyone posts theirs at once.</li>\n      <li><strong>3 min</strong> — read out the two most different answers; the gap between them is your opening discussion.</li>\n    </ol>\n    <p><strong>Why it works:</strong> retrieving beats re-reading (the generation effect) — and non-readers get a fighting chance to reconstruct from the wave instead of hiding.</p>",
  "p-c-thread":
    "<h3>Thread question → wave &amp; cluster</h3>\n    <p class=\"mt\">Simultaneous post-up · 8 min</p>\n    <ol>\n      <li><strong>90 s</strong> — everyone drafts their “comment” in chat or the doc. Nobody sends.</li>\n      <li><strong>30 s</strong> — release the wave; all answers land at once.</li>\n      <li><strong>6 min</strong> — name the two most-disagreeing answers and put their authors in conversation.</li>\n    </ol>\n    <p><strong>Why it works:</strong> simultaneity removes the first-speaker anchor; disagreement is the fuel a live session has that a thread doesn't.</p>",
  "p-c-reflect":
    "<h3>Reflection prompt → 1-2-4-All</h3>\n    <p class=\"mt\">Scale up the thinking · 12 min</p>\n    <ol>\n      <li><strong>1 min</strong> — think alone, in writing.</li>\n      <li><strong>2 min</strong> — pairs compare answers.</li>\n      <li><strong>4 min</strong> — fours look for where the pairs disagree.</li>\n      <li><strong>5 min</strong> — each four shares one idea that surprised them (not a recap).</li>\n    </ol>\n    <p><strong>Why it works:</strong> everyone speaks twice before the full group hears anything; ideas get stress-tested twice before they surface.</p>",
  "p-c-quiz":
    "<h3>Quiz → vote &amp; defend</h3>\n    <p class=\"mt\">Poll, argue, re-poll · 6 min</p>\n    <ol>\n      <li><strong>1 min</strong> — run the question as a live poll (or fingers 1–4).</li>\n      <li><strong>4 min</strong> — one volunteer per popular answer defends it.</li>\n      <li><strong>1 min</strong> — re-vote. Ask who moved, and what moved them.</li>\n    </ol>\n    <p><strong>Why it works:</strong> the re-vote makes belief updating visible and normal — the exact habit you want around verification claims.</p>",
  "p-c-deep":
    "<h3>Deep-dives → jigsaw</h3>\n    <p class=\"mt\">Split, prep, teach back · 14 min + pre-work</p>\n    <ol>\n      <li><strong>Pre</strong> — assign each participant <em>one</em> deep-dive before the session (e.g. hardware mechanisms / model evals / whistleblower provisions).</li>\n      <li><strong>5 min</strong> — same-reading groups agree on the mechanism and its weakest link.</li>\n      <li><strong>9 min</strong> — re-mix into trios of different readings; each teaches theirs in 3 minutes.</li>\n    </ol>\n    <p><strong>Why it works:</strong> explaining to a peer is deep processing plus accountability — and the cohort covers 3× the material.</p>",
  "p-c-debate":
    "<h3>Written debate → live red team</h3>\n    <p class=\"mt\">Violator vs. inspector · 13 min</p>\n    <ol>\n      <li><strong>2 min</strong> — split the room: half are the evading state, half design the verification regime.</li>\n      <li><strong>7 min</strong> — inspectors present their regime; violators attack it in rounds.</li>\n      <li><strong>4 min</strong> — debrief out of role: which attacks would the reading's proposal survive?</li>\n    </ol>\n    <p><strong>Why it works:</strong> adversarial thinking is the core skill of verification — and it's far more natural as a game than as an essay. Pairs well with <a href=\"https://the-verification-game.netlify.app\" target=\"_blank\" rel=\"noopener\">The Verification Game</a>.</p>",
  "p-s1":
    "<h3>0–5 · Check-in</h3>\n    <p>One round, everyone speaks: <em>“one word for how the reading left you.”</em></p>\n    <p>You've just guaranteed universal participation in the first five minutes and taken the group's temperature. If last week ended with commitments, collect them here.</p>",
  "p-s2":
    "<h3>5–13 · Cold-open retrieval</h3>\n    <p>“One sentence, one weak link” on the week's reading (full recipe in module 05).</p>\n    <p>The spread of answers sets the agenda — from here on you're facilitating <em>their</em> disagreements, not your script.</p>",
  "p-s3":
    "<h3>13–35 · Main discussion</h3>\n    <p>Work 2–3 questions from the question map, chosen to match what the cold-open surfaced. Run the four tests (module 02) on takes as they land.</p>\n    <p>This is the groan zone. Keep them in productive disagreement about five minutes longer than is comfortable.</p>",
  "p-s4":
    "<h3>35–50 · Structured activity</h3>\n    <p>One converter recipe: red team, jigsaw, or design-under-constraint.</p>\n    <p>Switching structure here resets energy — don't try to stretch open discussion to 40 minutes; it sags for everyone.</p>",
  "p-s5":
    "<h3>50–57 · Converge</h3>\n    <p>Synthesize in the shared doc: what did we settle, where do we still disagree, what's parked?</p>\n    <p>Unresolved disagreements become next week's async thread — that's spaced practice, not failure.</p>",
  "p-s6":
    "<h3>57–60 · Check-out + commitment</h3>\n    <p>The learning question — <em>“what was most useful to you today?”</em> — plus one commitment each: <em>“what will you go find out before next session?”</em></p>\n    <p>Collect the commitments at next week's check-in. The loop is the point.</p>",
  "p-in-s1":
    "<h3>0–5 · Check-in</h3>\n    <p><em>“One word for how the intro left you.”</em> Expect a spread from <em>terrified</em> to <em>skeptical</em> — name the spread out loud. It's not a problem; it's your agenda for minutes 28–47.</p>",
  "p-in-s2":
    "<h3>5–13 · Chain retrieval</h3>\n    <p>Silent write, 3 minutes — complete from memory:</p>\n    <span class=\"say\">“(1) Even if every state prefers not to build ASI, ______. (2) Even if they all sign an agreement, ______. (3) Therefore ______.”</span>\n    <p><span class=\"mt\">In person</span> — index cards; read the two most different versions aloud.</p>\n    <p><span class=\"mt\">On Zoom</span> — chat wave: everyone types, nobody sends, release together.</p>\n    <p>The gap between the strongest and shakiest reconstruction tells you exactly what the discussion must revisit.</p>",
  "p-in-s3":
    "<h3>13–28 · “Two Labs” — the arms race, played</h3>\n    <p>Split the room into two states. Four rounds; each round both teams secretly commit <strong>RACE</strong> or <strong>RESTRAIN</strong>.</p>\n    <ol>\n      <li><strong>Scoring:</strong> both restrain +2 / +2 · one races +3 racer, −1 restrainer · both race +1 / +1.</li>\n      <li><strong>The catch:</strong> every RACE played anywhere adds +1 to a public shared <strong>risk track</strong>. After round 4, roll a d12 (or draw a number 1–12): roll ≤ track = catastrophe, <em>everyone scores zero</em>.</li>\n      <li><strong>Rounds 1–2:</strong> silent. <strong>Before round 3:</strong> two minutes of open negotiation. <strong>Before round 4:</strong> offer them a signable one-line treaty — but commitments stay secret.</li>\n      <li><strong>Reveal</strong> all commitments round by round at the end.</li>\n    </ol>\n    <p><span class=\"mt\">In person</span> — teams huddle in corners; red card = race, black = restrain; simultaneous flip.</p>\n    <p><span class=\"mt\">On Zoom</span> — team huddles in two breakouts; a captain DMs you the commitment; reveal on the slide.</p>\n    <p>Debrief in one question: <em>“You signed. Why did — or didn't — you honor it, and what would have made the other side's signature believable?”</em> The word they reach for is the name of the track. Don't say it first.</p>",
  "p-in-s4":
    "<h3>28–47 · Discussion</h3>\n    <p>Two or three prompts from the tiles, chosen by what the game surfaced: if the treaty was betrayed, start with the chain; if it held, start with the securitization steelman (“was the fear even warranted?”).</p>\n    <p>Run the four take-tests (module 02) as takes land — the intro session is where discussion norms get set.</p>",
  "p-in-s5":
    "<h3>47–55 · Converge + baseline</h3>\n    <p>Settled / disputed / parked in the shared doc. Then the baseline reflection, solo, 4 minutes:</p>\n    <span class=\"say\">“What would an ideal anti-ASI policy look like? Answer in three sentences. You'll get this back at the end of the track.”</span>\n    <p><span class=\"mt\">In person</span> — sealed envelopes with names on them. Theatrical, and it works.</p>\n    <p><span class=\"mt\">On Zoom</span> — a form you re-send in the final week.</p>",
  "p-in-s6":
    "<h3>55–60 · Check-out</h3>\n    <p>One round: <em>“name one claim from the intro you'll go stress-test this week.”</em> Collect the results at next session's check-in — it pairs with the thread seed.</p>",
  "p-in-d1":
    "<h3>“Which link of the chain is weakest?”</h3>\n    <p>Preference → coordination → verification. Make each person commit to <em>one</em> link before anyone argues — a fist-of-five or chat wave works.</p>\n    <p><strong>Why it works:</strong> it forces engagement with the argument's structure instead of vibes about AI risk, and it maps the room's disagreement precisely.</p>\n    <p><strong>Follow-up move:</strong> <em>“What evidence would repair the link you picked?”</em></p>",
  "p-in-d2":
    "<h3>“Steelman the securitization skeptic”</h3>\n    <p>The intro argues that an existential threat suspends normal political balancing. History's counterexamples are real: threat inflation has justified wars and surveillance regimes before.</p>\n    <span class=\"say\">“Make the best case that we should NOT treat ASI as securitized. Who decides what counts as existential — and what does that power get used for?”</span>\n    <p><strong>Move:</strong> assign the steelman to a believer, not a skeptic — the believer learns more, and the skeptics hear their case made well.</p>",
  "p-in-d3":
    "<h3>“Where does the nuclear parallel break?”</h3>\n    <p>The intro leans on the nuclear precedent. Stress it: weights are copyable, movable, and dual-use; there is no fissile-material equivalent; the key actors are private firms, not states.</p>\n    <p><strong>Follow-up move:</strong> <em>“Name the disanalogy that worries you most for verification specifically — not for AI policy in general.”</em> That constraint keeps it from sprawling.</p>",
  "p-in-d4":
    "<h3>“What would change your mind?”</h3>\n    <p>Falsifiability (test T3), pointed at the framing itself: <em>“If the arms-race frame is right, what should we observe over the next 18 months? What observation would count against it?”</em></p>\n    <p><strong>Why it works:</strong> it models the epistemics the track teaches — the intro's own thesis is not exempt from the tests.</p>",
  "p-vg-seats":
    "<h3>Seats &amp; delegations (13 seats, scales 10–15)</h3>\n    <ul>\n      <li><strong>US, China, EU/Coalition delegations</strong> — each: Head of Gov't (answers the directive), National Security Advisor (controls espionage), Lab Director (scores on capability, <em>loses</em> points if tech secrets leak).</li>\n      <li><strong>IVA</strong> — Director + Inspector. Wins if the regime survives to 2032 with a caught-and-sanctioned violation, or zero violations.</li>\n      <li><strong>The Press</strong> — wins by publishing 3 stories that prove true; loses on a false accusation.</li>\n      <li><strong>Control</strong> — you: phases, rumor deck, detection draws, the risk track.</li>\n    </ul>\n    <p>The within-delegation tension is deliberate: the Lab Director is the natural anti-inspection voice in every capital, so incentive mapping happens <em>inside</em> delegations, not just between states.</p>\n    <p><strong>At 10:</strong> drop Press, 2-person delegations, 1-person IVA. <strong>At 15:</strong> add a fourth delegation (“Gulf sovereign-compute coalition”) or a second Press seat.</p>",
  "p-vg-directives":
    "<h3>Secret directives (drawn blind, one per delegation)</h3>\n    <ul>\n      <li><strong>HEGEMON</strong> — end 2032 with strictly more capability than every rival. Catastrophe = you lose too.</li>\n      <li><strong>SURVIVOR</strong> — end 2032 with global risk ≤ 4. Relative position irrelevant.</li>\n      <li><strong>DOMESTIC SIEGE</strong> — show capability growth every even round or lose office (score 0).</li>\n      <li><strong>NEVER AGAIN</strong> (optional) — a rival must be caught cheating, publicly, at least once.</li>\n    </ul>\n    <p>Nobody knows whether they face a Hegemon or a room full of Survivors — that uncertainty <em>is</em> the security dilemma. The debrief reveal (“you were all Survivors”) is reliably the loudest moment of the session.</p>",
  "p-vg-loop":
    "<h3>The round loop (~12 min, six rounds)</h3>\n    <ol>\n      <li><strong>INTEL (2 min)</strong> — Control distributes information per the current regime; Press may publish one story.</li>\n      <li><strong>DIPLOMACY (4 min)</strong> — plenary + private bilaterals; treaties drafted, signed, amended. Cheap talk is free.</li>\n      <li><strong>ALLOCATION (2 min, secret)</strong> — each delegation splits <strong>10 compute points</strong> across DEPLOY (visible capability, +risk) · COVERT (hidden, ++risk, sanctionable) · SAFETY (−risk) · VERIFY (funds the regime, raises detection) · ESPIONAGE (buy an intel peek or steal exposed secrets).</li>\n      <li><strong>VERIFICATION (2 min)</strong> — IVA targets inspections; Control resolves detection; sanctions per treaty text.</li>\n      <li><strong>RESOLUTION (2 min)</strong> — scores, risk track, catastrophe check, and “the year in one minute” read aloud.</li>\n    </ol>\n    <p>Phase timers are what keep this under two hours. Enforce them cheerfully and without mercy.</p>",
  "p-vg-matrix":
    "<h3>The information matrix (the whole point)</h3>\n    <p>What anyone can see depends on the regime the players themselves built:</p>\n    <ul>\n      <li><strong>No regime</strong> — rivals see your DEPLOY total plus rumor cards (Control mixes true and false 50/50).</li>\n      <li><strong>Self-report treaty</strong> — rivals see your <em>declaration</em>: you write anything you like.</li>\n      <li><strong>Inspected treaty</strong> — on an audit hit, your entire Program Sheet goes to the IVA table — where it sits, visible, stealable. Espionage or a leak event hands your tech secrets to a rival.</li>\n      <li><strong>+ ZK upgrade (3 VERIFY points)</strong> — the sheet goes to <em>Control only</em>, who issues a signed COMPLIANT / VIOLATION certificate. The sheet never travels.</li>\n    </ul>\n    <p>Detection tiers come from total VERIFY spending: tier 1 = 1 audit chit in 5, tier 2 = 2 in 5, tier 3 = 3 in 5. Only tier 3 actually deters a calculating cheater — the p* ≈ 60% threshold from the digital game, now purchasable.</p>\n    <p>The first inspection-leak (an NSA stealing the sheet from the IVA table) permanently changes how every delegation votes on audit intrusiveness. Let it happen; don't warn them.</p>",
  "p-vg-risk":
    "<h3>Risk &amp; endings</h3>\n    <p>Public risk track, 0–12. Each round: +1 per state whose DEPLOY+COVERT ≥ 6 · −1 per 2 SAFETY points anywhere · +2 the first time a violation is publicly revealed (the trust shock).</p>\n    <p>End of each round, roll 2d6: roll ≤ track = a <strong>warning shot</strong> event. A second trigger = <strong>uncontrolled ASI</strong> — game over, all directives void, everyone loses. Winner-shares-risk, enforced by rule.</p>\n    <p>If the room survives to 2032: run the <strong>decade roll</strong> from the digital game in public, on the map, with weights set by what the room actually built (no regime / paper / verified / verified+ZK). Then reveal scores.</p>",
  "p-vg-t1":
    "<h3>0:00–0:15 · Setup &amp; briefing</h3>\n    <p>Seating, role cards, delegations read their sealed directives, you brief the rules — one page, projected. Resist explaining the information matrix in full; they should discover what fog costs.</p>",
  "p-vg-t2":
    "<h3>0:15–0:27 · Round 1 (2026) — forced fog</h3>\n    <p>Rule: no treaty may be <em>signed</em> in round 1 — talks allowed. Everyone must feel Path A before they're allowed to fix it. Pure rumor-deck intel, no declarations, no audits.</p>\n    <p>If the room later collapses into a pure race, that's fine — it's Path A, and the debrief handles it.</p>",
  "p-vg-t3":
    "<h3>0:27–1:15 · Rounds 2–5 (2027–2030)</h3>\n    <p>Treaties, regimes, audits, leaks, sanctions — entirely as the room chooses. Your job: keep phases on the clock, resolve detection honestly, and mark the room's route on the map as it happens.</p>\n    <p><span class=\"mt\">On Zoom</span> — Vice-Control runs all DMs (rumors, audit results, leak rolls) while you run the plenary. Under non-ZK regimes, an audit screenshot also leaks to a rival NSA on a 1-in-3 roll.</p>",
  "p-vg-t4":
    "<h3>1:15–1:30 · Round 6 (2032) + decade roll</h3>\n    <p>Final allocations, then the public decade roll on the map board, weighted by what the room built. Then scores — but scores are the appetizer; the reveal happens in the debrief.</p>",
  "p-vg-t5":
    "<h3>1:30–2:00 · Debrief</h3>\n    <ol>\n      <li>Reveal all directives and Program Sheets round by round on the map: <em>which path did this room walk?</em></li>\n      <li>The three questions (see the debrief prompt tiles).</li>\n      <li>Replay the fork: load the digital game on the shared screen, click the group's path, read its ending card aloud.</li>\n      <li>Name the lenses: which model of state behavior did each delegation actually run on?</li>\n    </ol>",
  "p-vg-d1":
    "<h3>“When did you first assume the worst about a rival?”</h3>\n    <p>…and — now that the sheets are face-up — were you right?</p>\n    <p><strong>Why it works:</strong> everyone has a concrete moment to point to, and the answer is checkable against the revealed record. Attribution under fog stops being an abstraction.</p>",
  "p-vg-d2":
    "<h3>“What information would have changed your allocation in round N?”</h3>\n    <p>Pick the round where a delegation went covert or defected. Ask its Head of Gov't directly.</p>\n    <p><strong>Why it works:</strong> the answer is always a verification mechanism — a credible declaration, a trusted audit, a certificate. The frustration of the fog converts into a shopping list for Module 2.</p>",
  "p-vg-d3":
    "<h3>“Who refused inspection — and why?”</h3>\n    <p>Sovereignty, secrets, or cost? The Lab Directors — whose points bled on every leak — will answer differently than their Heads of Gov't.</p>\n    <p><strong>Follow-up:</strong> <em>“Would the ZK upgrade have changed your vote? What did it actually protect you from?”</em></p>",
  "p-vg-d4":
    "<h3>“Which lens were you running?”</h3>\n    <p>Realist (relative gains, worst-case assumptions) or institutionalist (absolute gains, institutions reduce uncertainty)? Ask each delegation to self-diagnose from its own record, not its self-image.</p>\n    <p><strong>Why it works:</strong> the IR primer's lenses stop being vocabulary and become descriptions of choices the room just made.</p>",
  "p-hx-s1":
    "<h3>0–5 · Check-in</h3>\n    <p><em>“One verification regime you'd heard of before this track — even vaguely.”</em> You'll get IAEA, maybe START; note who says “none” — the timeline scramble is calibrated for them.</p>",
  "p-hx-s2":
    "<h3>5–15 · Timeline scramble</h3>\n    <p>Eight milestones, unordered. The group sequences them before the reveal:</p>\n    <ul>\n      <li>IAEA founded · NPT enters into force · BWC signed (no verification protocol) · INF Treaty brings the first intrusive on-site inspections · UNSCOM inspections in Iraq · CWC/OPCW with challenge inspections · New START data exchanges · first compute-threshold rules for AI.</li>\n    </ul>\n    <p><span class=\"mt\">In person</span> — event cards physically ordered on the table by the group.</p>\n    <p><span class=\"mt\">On Zoom</span> — chat wave your ordering (e.g. “C-A-F-…”), then reveal the slide.</p>\n    <p>The point isn't dates. It's two surprises: intrusive on-site inspection is <em>younger than most participants' parents</em> (1987), and regimes accreted after shocks, not foresight. Ask: <em>“which position surprised you?”</em></p>",
  "p-hx-s3":
    "<h3>15–50 · The Precedent Draft</h3>\n    <ol>\n      <li><strong>Teams of 3–4</strong>; each inherits one regime card: IAEA safeguards · OPCW challenge inspections · the START family (satellites + data exchanges + on-site) · the BWC · Open Skies (fifth team).</li>\n      <li><strong>Prep, 10 min</strong> — build the case that your regime is the best single template for AI verification: what it verified, the physical or institutional property that made it work, and its most famous failure (own it before someone else uses it).</li>\n      <li><strong>Pitch, 3 min each</strong> — to the room-as-UN.</li>\n      <li><strong>Cross-examination</strong> — every other team gets one disanalogy attack: <em>“your regime depended on X; AI lacks X.”</em></li>\n      <li><strong>The loot vote</strong> — you may not vote for your own regime; vote for the one you'd steal components from. Then each team posts its most transferable component to the board: the room's <strong>franken-regime</strong> for AI.</li>\n    </ol>\n    <p><strong>The BWC team plays a different game:</strong> argue why an agreement with no verification survived fifty years anyway — norms, self-interest, taboo — and whether any of that transfers to AI.</p>",
  "p-hx-s4":
    "<h3>50–70 · Discussion + converge</h3>\n    <p>One or two prompts from the tiles — the BWC question almost always ignites if the BWC team pitched well. Close by reading the franken-regime aloud: <em>“this is the room's current best guess at an AI verification regime. What's missing?”</em> (The answer — the technical layer — is Module 2's job.)</p>",
  "p-hx-s5":
    "<h3>70–75 · Check-out</h3>\n    <p>One round: <em>“name the one franken-regime component you'd actually defend in front of a skeptic.”</em></p>",
  "p-hx-d1":
    "<h3>“Does the BWC comfort you or worry you?”</h3>\n    <p>Both facts are true: the convention survived fifty years without a verification protocol, <em>and</em> the Soviet Biopreparat program ran covertly under it for two decades at industrial scale.</p>\n    <p><strong>Move:</strong> split the room — half must argue comfort, half worry — then ask who was assigned against their actual view.</p>",
  "p-hx-d2":
    "<h3>“What's AI's nearest physical handle?”</h3>\n    <p>Every historical regime verified something physical: fissile material, chemical precursors, missile launchers. AI's candidates: leading-edge fabs, data centers, energy draw, chip inventories.</p>\n    <p><strong>Follow-up:</strong> <em>“Which candidate carries the most verification weight — and which is eroding fastest as algorithms get efficient?”</em></p>",
  "p-hx-d3":
    "<h3>“Solved, partial, or proposal?”</h3>\n    <p>Sort the current AI verification stack honestly: export controls and chip identity exist; compute metering and training-run attestation are largely paper designs. Have the group place each on the three-tier scale and defend placements.</p>\n    <p><strong>Why it works:</strong> it inoculates against both cynicism (“nothing works”) and hype (“the tech is ready”) — and it's the exact scaffold Module 2's mechanism cards use.</p>",
  "p-hx-d4":
    "<h3>“Where does an IAEA-for-AI fail first?”</h3>\n    <p>Funding, access, staffing, politicization? The IAEA's own history answers differently by decade — budget starvation in one era, state access games in another.</p>\n    <p><strong>Follow-up:</strong> <em>“Design the first year: what does the agency inspect in month one, with what staff, under what authority?”</em></p>",
  "p-mx-s1":
    "<h3>0–5 · Check-in</h3>\n    <p><em>“Name something from any domain that's perfectly feasible and completely useless.”</em> Funny answers welcome — it plants the session's frame (both axes matter) before anyone mentions AI.</p>",
  "p-mx-s2":
    "<h3>5–12 · Own the axes</h3>\n    <p>Silent write: define both axes in your own words. <strong>Effectiveness</strong> = how much the policy actually deters ASI development. <strong>Feasibility</strong> = political will <em>plus verification burden</em> — a policy nobody can verify isn't feasible no matter how popular.</p>\n    <p>Wave the definitions; flag the spread on feasibility — most disagreement about placements is secretly disagreement about this axis.</p>",
  "p-mx-s3":
    "<h3>12–30 · Place &amp; argue</h3>\n    <ol>\n      <li><strong>Silent placement first</strong> — all five policies, no talking. Kills the anchor.</li>\n      <li><strong>Find the widest spread</strong> — that policy goes on trial: the two most extreme placers defend for 60 seconds each.</li>\n      <li><strong>Moves are public and celebrated</strong> — after each argument, anyone may move their marker. Announce it straight: <em>“changed minds are the score here.”</em></li>\n    </ol>\n    <p><span class=\"mt\">In person</span> — for the most contested policy, participants <em>are</em> the dots: stand on the taped plane, argue from where you stand, walk when persuaded.</p>\n    <p><span class=\"mt\">On Zoom</span> — drag your dot on the shared slide; you narrate the drift as it happens.</p>",
  "p-mx-s4":
    "<h3>30–47 · The world moves (event cards)</h3>\n    <p>Deal four events one at a time; after each, 60 seconds to re-place, then one minute on what moved and why:</p>\n    <ol>\n      <li><strong>Warning shot</strong> — a mass-casualty AI-enabled incident, widely attributed; publics demand action.</li>\n      <li><strong>Caught red-handed</strong> — a major state is exposed running a covert frontier run under a self-report pledge.</li>\n      <li><strong>Efficiency leap</strong> — frontier capability now needs 10× less compute; thresholds wobble.</li>\n      <li><strong>Attestation ships</strong> — cheap privacy-preserving compute verification lands on all new accelerators.</li>\n    </ol>\n    <p>Close with the scoreboard question: <em>“which policy was robust across all four worlds, and which card moved the full pause the most?”</em> The punchline sits in card 4: verification infrastructure is the only event that moves feasibility <strong>without a body count</strong>. Let someone else say it.</p>",
  "p-mx-s5":
    "<h3>47–62 · Discussion</h3>\n    <p>Two prompts from the tiles, chosen by what the event rounds exposed — if placements swung wildly on cards 1–2, prompt 4 (“what was your estimate tracking?”) is the honest follow-up.</p>",
  "p-mx-s6":
    "<h3>62–70 · Converge + check-out</h3>\n    <p>Photograph or screenshot the final board — it's the week's thread seed. Check-out round: <em>“one placement on this board you still disagree with.”</em> Park the disagreements visibly; they're next session's warm-up.</p>",
  "p-mx-d1":
    "<h3>“Which failure mode are we drifting toward?”</h3>\n    <p>Feasible-but-ineffective (governance theater: pledges, summits, voluntary commitments) or effective-but-infeasible (paper regimes nobody will sign)?</p>\n    <p><strong>Move:</strong> demand evidence from the last 12 months, not vibes — <em>“name one real policy event that supports your answer.”</em></p>",
  "p-mx-d2":
    "<h3>“Does securitization break the frame?”</h3>\n    <p>The async module's teaching point: if you accept ASI as a securitized existential risk, normal tradeoff balancing is suspended and the spectrum should be read toward the full-pause end.</p>\n    <p><strong>Move:</strong> separate the premise from the inference — <em>“do you reject the securitization, the suspension of tradeoffs, or neither?”</em> Most disagreement lives in exactly one of the two.</p>",
  "p-mx-d3":
    "<h3>“Feasibility for whom?”</h3>\n    <p>The axis silently assumes an actor. Redraw the plane three times — the US alone, a US–China dyad, a broad coalition — and ask which placements flip.</p>\n    <p><strong>Why it works:</strong> it converts “feasibility” from a gut rating into a function with an argument, which is how the rest of the track uses it.</p>",
  "p-mx-d4":
    "<h3>“What was your estimate really tracking?”</h3>\n    <p>If a single hypothetical news event moved a policy three grid squares, the original placement wasn't tracking infrastructure — it was tracking mood.</p>\n    <p><strong>Follow-up:</strong> <em>“What's the component of feasibility that an event CAN'T move overnight?”</em> (Verification capacity — which is why card 4 was the quiet one.)</p>",
  "p-an-s1":
    "<h3>0–5 · Check-in</h3>\n    <p><em>“One clause from any treaty, contract, or terms-of-service that stuck with you.”</em> Low stakes, and it primes the session's real subject: text that binds.</p>",
  "p-an-s2":
    "<h3>5–20 · Draft</h3>\n    <p>Committees of 3–4 draft a pause treaty in <strong>eight sentences maximum</strong>, filling five slots:</p>\n    <ul>\n      <li><strong>ACTOR</strong> — who is bound: states? labs? cloud providers? subsidiaries?</li>\n      <li><strong>AGREEMENT</strong> — what exactly is committed: the threshold, the prohibited activities.</li>\n      <li><strong>PURPOSE</strong> — what the commitment is for.</li>\n      <li><strong>RESULT</strong> — what compliance produces; what a violation triggers.</li>\n      <li><strong>+ one verification clause</strong> — a reporting duty or an inspection right.</li>\n    </ul>\n    <p>The eight-sentence cap is the teacher: scarcity forces the committee to choose what goes unsaid — which is the whole lesson, though they don't know it yet.</p>",
  "p-an-s3":
    "<h3>20–32 · Swap &amp; exploit</h3>\n    <p>Drafts rotate one team over. Announce the flip:</p>\n    <span class=\"say\">“You are now counsel to an evading state. Your client will comply with the letter of this text and gut its purpose. File up to three exploits.”</span>\n    <p>Exploit categories: an undefined term · an unbound actor · a missing trigger · a scope gap (geographic, temporal, entity). Each exploit is written as: <em>“We will do X, which the text permits because Y.”</em></p>\n    <p><span class=\"mt\">On Zoom</span> — exploits filed as comments on the next team's doc; keep them short enough to read aloud.</p>",
  "p-an-s4":
    "<h3>32–47 · Tribunal</h3>\n    <p>Each exploit is read aloud; the drafting committee gets a 60-second rebuttal; the room votes <strong>HOLDS</strong> or <strong>GUTTED</strong>. A point per surviving clause, a point per gut.</p>\n    <p>Track on the board <em>which slot</em> the exploits clustered in. It's nearly always actor scope and undefined terms — the same places real treaties get lawyered. Name that out loud at the end.</p>",
  "p-an-s5":
    "<h3>47–55 · Lens flip</h3>\n    <p>Each team re-reads its own draft twice: <strong>realist</strong> — this text is power politics; who gains relative advantage, and where's the exit clause? <strong>institutionalist</strong> — this text builds an institution; what cooperation does it enable, what norms does it seed?</p>\n    <p>One sentence per lens per team, out loud. Same eight sentences, two different treaties — that's the async exercise's political-lenses tab, now lived.</p>",
  "p-an-s6":
    "<h3>55–70 · Discussion + check-out</h3>\n    <p>Open with the observation the tribunal just proved: every draft left the same things implicit. Then one or two prompt tiles. Check-out: <em>“one thing you'll now look for in any policy text you read.”</em></p>",
  "p-an-d1":
    "<h3>“Everyone left enforcement implicit”</h3>\n    <p>Did any committee write what actually happens after a violation is confirmed? Real treaties mostly don't either — enforcement and intelligence methods are the two great silences.</p>\n    <p><strong>Follow-up:</strong> <em>“Who benefits from that silence — the strong signatory, the weak one, or the drafters who needed a signature?”</em></p>",
  "p-an-d2":
    "<h3>“Which slot was hardest?”</h3>\n    <p>Actor, agreement, purpose, or result? The room's answer predicts where real negotiations stall — and it's usually ACTOR (do subsidiaries count? open-weight releases? academic labs?).</p>\n    <p><strong>Move:</strong> connect it forward — <em>“the actor slot is Module 1's entire subject. Hold your answer.”</em></p>",
  "p-an-d3":
    "<h3>“When is ambiguity a feature?”</h3>\n    <p>“Constructive ambiguity”: vagueness deliberately chosen so both sides can sign while reading the text differently.</p>\n    <p><strong>Move:</strong> <em>“Find one place in tonight's drafts where a vague term was load-bearing — where precision would have killed the deal at your own table.”</em> There's always one.</p>",
  "p-an-d4":
    "<h3>“What did the other lens see?”</h3>\n    <p>After the lens flip: <em>“which reading of your own draft felt truer — and what does that say about your priors, rather than about the text?”</em></p>\n    <p><strong>Why it works:</strong> it turns the IR lenses from labels into instruments, and it's a rare prompt where the honest answer is self-revealing without being personal.</p>",
};
