/**
 * "The Verification Game" — data lifted verbatim from
 * public/verification/verification-timeline-game.html and
 * public/verification/content/verification-timeline-game.json.
 *
 * All strings are human-authored curriculum. Do not paraphrase, shorten,
 * translate, or invent. The interactive logic (matrix quiz, the fog, the two
 * slider labs, the inspector's dilemma, the regime roll, the endings) lives in
 * the widget; every string it displays is sourced from here.
 */

export type PathKey = "r" | "t" | "v";
export type FailKey = "fa" | "fb" | "fc" | "fd";
export type RegimeKey = "lean" | "swiss";
export type OutcomeKey = "ok" | FailKey;

export interface GameEvent {
  id: string;
  path: PathKey;
  year: string;
  title: string;
  sum: string;
  chip: string;
  body: string[];
  concept: string;
  game: string;
  echo: string;
  /** attaches the "fog" mini-game after this event */
  fog?: boolean;
  /** attaches a defector's-calculation slider lab after this event */
  lab?: { p: number; note: string };
  /** attaches the inspector's-dilemma slider lab after this event */
  inspector?: boolean;
}

export interface FailEvent {
  id: FailKey;
  path: "f";
  year: string;
  title: string;
  sum: string;
  chip: string;
  body: string[];
  concept: string;
  game: string;
  echo: string;
}

export const EVENTS: GameEvent[] = [
  {
    id: "a1",
    path: "r",
    year: "2027",
    title: "Compute nationalism",
    sum: "Export controls harden into blockades. Chip fabs become strategic assets; allies are pressured to pick sides.",
    chip: "Security dilemma",
    body: [
      "With no forum for restraint, each state secures its own supply chain: stockpiling accelerators, subsidizing domestic fabs, cutting rivals off from lithography and advanced packaging.",
      "Every one of these moves is defensively motivated. Every one of them is indistinguishable, from the outside, from preparation for a sprint.",
    ],
    concept: "The security dilemma",
    game: "When intentions are unobservable, defensive and offensive preparation look identical. Rivals must respond to capabilities, not stated intent — so purely defensive moves ratchet the spiral. This is the informational root of the whole problem: the game is bad because the players cannot see each other's moves.",
    echo: "Pre-1914 naval buildups: Britain and Germany each described their dreadnought programs as defensive. Neither could verify it, so both escalated.",
  },
  {
    id: "a2",
    path: "r",
    year: "2028",
    title: "The safety tax collapses",
    sum: "Labs under national-champion pressure cut evaluation time from months to days. Slowing down means losing.",
    chip: "Race to the bottom",
    body: [
      "Internally, every lab knows the testing is inadequate. But safety spending is now a competitive handicap: whoever pays it falls behind whoever doesn't.",
      "Governments that once demanded caution now demand speed. The externality is global; the payoff is local.",
    ],
    concept: "Race to the bottom",
    game: "Safety is a cost paid privately for a benefit shared globally — a public good. In a competition, any player who pays it unilaterally is outcompeted by one who doesn't, so the equilibrium level of safety spending falls toward zero. Only a mechanism that binds all players at once can hold the floor.",
    echo: "Environmental and labor standards under unrestricted trade competition — the canonical race-to-the-bottom, solved only by binding common floors.",
  },
  {
    id: "a3",
    path: "r",
    year: "2030",
    title: "The warning shot nobody heeds",
    sum: "An autonomous system self-exfiltrates during testing. Each state assumes rivals will exploit any pause it takes.",
    chip: "No credible commitment",
    body: [
      "The incident is contained, barely, and every intelligence service learns of it. For a week, capitals quietly discuss a joint pause.",
      "It dies on one question no one can answer: if we stop, how would we know they stopped? With no verification machinery in existence, a pause is an unenforceable promise — and unilateral pause is unilateral disarmament.",
    ],
    concept: "Commitment problem",
    game: "Both sides would benefit from mutual restraint, but neither can make its promise credible — there is no way to observe compliance and no penalty for breaking it. Absent credibility, the mutually preferred deal is unreachable even when both players want it. Wanting cooperation is not enough; you need the machinery.",
    echo: "The 1946 Baruch Plan for international control of atomic energy collapsed largely on inspection and enforcement — and the arms race followed.",
  },
  {
    id: "a4",
    path: "r",
    year: "2032",
    title: "Terminal sprint",
    sum: "Two states believe the other is weeks from a decisive system. Both remove the last human checkpoints.",
    chip: "Nash trap",
    body: [
      "In the final months the race is no longer about advantage but about denial: better that we get there first, whatever 'there' is.",
      "Deployment decisions migrate from cabinets to on-call engineers. The last safeguards are waived under a logic every player privately knows is mad — and publicly cannot escape.",
    ],
    concept: "Nash equilibrium ≠ good outcome",
    game: "A Nash equilibrium is a state where no player can improve by changing strategy alone — it says nothing about the outcome being good. Here every state plays its dominant strategy correctly and the collective result is catastrophic. The lesson of Path A: you cannot exhort your way out of bad structure. You have to change the game.",
    echo: "The Cuban Missile Crisis was the near-miss version: rational escalation logic marching capable, well-informed leaders toward an outcome none of them wanted.",
  },
  {
    id: "b1",
    path: "t",
    year: "2027",
    title: "The Geneva Compact",
    sum: "Fifteen states sign caps on frontier training runs. Inspections are dropped in negotiation — sovereignty concerns.",
    chip: "Cheap talk",
    body: [
      "The signing ceremony is genuinely hopeful. Markets calm, safety teams are rehired, editorials declare the race over.",
      "But the operative clause is self-reporting. Each state declares its own compliance, and no one can look inside anyone else's datacenters. The commitment costs nothing to make and nothing to break.",
    ],
    concept: "Cheap talk",
    game: "In game theory, communication that is costless and unverifiable cannot change equilibrium behavior when incentives conflict — words alone don't move payoffs. A signed cap without observability is the same matrix as no cap, plus a new risk: the illusion that the matrix changed.",
    echo: "The 1928 Kellogg–Briand Pact outlawed war itself — with no verification or enforcement. Signatories included every major belligerent of WWII.",
  },
  {
    id: "b2",
    path: "t",
    year: "2028",
    title: "Quiet defection",
    sum: "Two signatories route compute through covert facilities. Others suspect, but cannot distinguish rumor from fact.",
    chip: "Unobservable moves",
    body: [
      "The defectors don't think of themselves as villains. Each reasons: the others are surely cheating, so complying honestly would be naive — better to hedge.",
      "Intelligence services produce ambiguous evidence: unusual power draws, procurement anomalies. Nothing conclusive. Under ambiguity, every state's worst-case assumption hardens, and hedging spreads.",
    ],
    concept: "Payoff-identical to no treaty",
    game: "Without monitoring, comply-and-hope is strictly dominated for any state that values winning: cheating is invisible, so it carries the gain and none of the cost. The treaty changed the rhetoric but not one number in the payoff matrix — so it cannot change the behavior. Worse, honest players are now the suckers.",
    echo: "The Biological Weapons Convention (1972) has no verification protocol. The USSR signed it — and ran Biopreparat, a massive covert bioweapons program, for two more decades.",
    fog: true,
    lab: {
      p: 10,
      note: "You just felt the fog. Here is its arithmetic: with no inspections, detection probability sits near zero. Drag p and see what it would have taken.",
    },
  },
  {
    id: "b3",
    path: "t",
    year: "2029",
    title: "The satellite photos",
    sum: "A leak exposes a covert training cluster. The treaty dies in a weekend — and takes the idea of treaties with it.",
    chip: "Grim trigger",
    body: [
      "Commercial satellite imagery plus a defector's testimony make one covert site undeniable. The accused state alleges everyone else is doing the same — and no one can prove otherwise, which is precisely the problem.",
      "Compliant states feel betrayed; hedging states feel vindicated. Withdrawal cascades in days. The word 'treaty' is now politically radioactive in every capital.",
    ],
    concept: "Grim trigger — and the cost of one betrayal",
    game: "In repeated games, cooperation can be sustained by the threat of retaliation — but with no monitoring, the first defection detected is late, large, and read as systemic betrayal, triggering permanent reversion to defection ('grim trigger'). Verification keeps defections small and early, which is what keeps punishment proportionate and cooperation recoverable. This path had no such dampener.",
    echo: "The collapse of the INF Treaty (2019) followed years of unresolved compliance accusations — disputes the treaty's aging verification provisions could no longer adjudicate.",
  },
  {
    id: "b4",
    path: "t",
    year: "2031",
    title: "The race resumes — poisoned",
    sum: "Path B rejoins Path A, but a year behind on safety and with cooperation discredited for a generation.",
    chip: "Worse than never trying",
    body: [
      "Every dynamic of Path A now replays — compressed, angrier, and with a ready-made betrayal narrative that drowns out anyone proposing coordination.",
      "The states that complied honestly lost ground for nothing, and their publics remember it. When researchers propose a verified successor treaty in 2032, no legislature will touch it. The sprint proceeds to the same terminal node.",
    ],
    concept: "The convergence",
    game: "Path B's real lesson is about ordering: agreement without verification isn't a partial step toward the good equilibrium — it's a detour that ends at the bad one, minus the trust you spent on the way. The binding constraint was never willingness to sign. It was the ability to observe.",
    echo: "Interwar naval limitation: the unverifiable Washington/London treaty system decayed through covert violations, and its collapse discredited arms control on the eve of rearmament.",
  },
  {
    id: "c1",
    path: "v",
    year: "2027",
    title: "The verification breakthrough",
    sum: "Engineers make compliance observable: on-chip attestation, compute accounting, energy signatures, protected whistleblowers.",
    chip: "New information structure",
    body: [
      "A coalition of labs, standards bodies, and intelligence agencies builds the boring miracle: hardware that can prove what it ran without revealing model weights, power-grid analytics that flag covert clusters, and legal channels that make a single engineer's conscience a detection mechanism.",
      "None of it requires goodwill. It requires silicon, statistics, and law — and it turns 'are they complying?' from a guess into a measurement.",
    ],
    concept: "Information changes the game",
    game: "Everything in Paths A and B failed on one property: moves were unobservable. Verification technology changes the information structure — defection now generates evidence. In game-theoretic terms, it converts a simultaneous hidden-action game into something closer to an observed, repeated game, where entirely different equilibria become available.",
    echo: "Seismographs did this for nuclear testing: once explosions could be detected remotely, test-ban treaties became enforceable physics rather than promises.",
    lab: {
      p: 78,
      note: "This is what the breakthrough buys: the ability to move p at all. Drag it and watch the defector's math flip — then remember that every point of p has a price tag.",
    },
  },
  {
    id: "c2",
    path: "v",
    year: "2028",
    title: "The Vienna Protocol",
    sum: "The same caps as Geneva — plus inspections, chip audits, and automatic graduated sanctions. Signing means submitting to being seen.",
    chip: "Costly signal",
    body: [
      "The negotiation is uglier than Geneva's, because this treaty has teeth and everyone knows it. Accepting intrusive audits is expensive — in sovereignty, in secrecy, in pride.",
      "That expense is the point. A state planning to cheat gains nothing by joining and loses much; a state planning to comply loses little. Signature itself now separates the honest from the hedging.",
    ],
    concept: "Costly signaling & credible commitment",
    game: "A signal is informative only if it is expensive for a liar to fake. Submitting to verification is exactly such a signal — cheap for compliers, ruinous for cheaters — so the act of joining transmits real information. And with detection probability high, the expected value of defection goes negative: the prisoner's dilemma is transformed into an assurance game, where mutual restraint is a stable equilibrium.",
    echo: "The INF Treaty's inspectors inside missile plants: intrusiveness was the costly signal that made 'we have stopped' believable between superpowers.",
    inspector: true,
  },
  {
    id: "c3",
    path: "v",
    year: "2030",
    title: "A violation, caught early",
    sum: "A covert run is flagged by energy analytics at one-tenth treaty scale. Sanctions bite; the regime survives — because it caught it.",
    chip: "Tit-for-tat, with forgiveness",
    body: [
      "One signatory tests the fence: a modest unregistered training run, dispersed across facilities. Grid analytics flag it in six weeks; a challenge inspection confirms it.",
      "The response is the scripted, proportionate one — compute-import suspension, not treaty collapse. The violator pays, complies, and remains inside the regime. Paradoxically, the violation strengthens the system: every player just watched detection work.",
    ],
    concept: "Proportionate punishment sustains cooperation",
    game: "Repeated-game strategies like tit-for-tat sustain cooperation only if defection is detected early enough to punish proportionately, and forgiven once corrected. Verification is what keeps violations small and consequences calibrated — the difference between an immune response and an autoimmune collapse. Compare the satellite photos of Path B, where late detection detonated the entire regime.",
    echo: "IAEA safeguards findings have repeatedly triggered graduated responses — referrals, sanctions, renewed inspections — without collapsing the nonproliferation regime itself.",
  },
  {
    id: "c4",
    path: "v",
    year: "2032",
    title: "The managed ascent",
    sum: "Capabilities keep advancing — jointly gated. Safety research is pooled because no one fears it will be used against them.",
    chip: "Shadow of the future",
    body: [
      "This ending is not a halt and not a utopia. Frontier development continues under jointly ratcheted thresholds, with red-team results and interpretability tools shared through the Protocol's clearinghouse.",
      "Rivals still spy on each other. Nobody has grown virtuous. But every state expects the regime to exist next year, and the year after — and that expectation is the whole ballgame.",
    ],
    concept: "The long shadow of the future",
    game: "Cooperation in repeated games depends on how much players value future rounds — the 'shadow of the future.' Verification lengthens that shadow: because everyone expects the regime to persist, the future gains from staying inside it dominate any one-shot gain from breaking it. Trust was never the input. It is the output.",
    echo: "Fifty years of nonproliferation: rivals who trusted each other not at all, held in a stable regime by inspection, detection, and the shared expectation that it would still be there tomorrow.",
  },
];

export const FAILS: Record<FailKey, FailEvent> = {
  fa: {
    id: "fa",
    path: "f",
    year: "2029",
    title: "The false alarm",
    sum: "Grid analytics misread a civilian cluster as a covert run. The accusation goes public before the data is checked twice.",
    chip: "Decision under noise",
    body: [
      "The regime's sensors are new, the baselines are thin, and the analysts are under pressure to prove the system works. A flagged anomaly becomes a leaked briefing becomes a televised accusation.",
      "The accused state — innocent, this time — suspends all inspections in protest. Six months of confidence evaporate in a news cycle. When a real anomaly appears a year later, nobody believes the detector.",
    ],
    concept: "False positives kill regimes too",
    game: "A detector is a tradeoff curve, not a switch: push sensitivity up and false alarms come with it. Verification only deters if its signals are believed, and every wrong accusation spends credibility the regime cannot buy back. The information structure improved — but the decision layer stayed human, uncalibrated, and in a hurry.",
    echo: "In 1983, Soviet early-warning satellites reported five inbound US missiles — sunlight glinting off clouds. Stanislav Petrov's refusal to trust his own detector is the only reason the false positive stayed a footnote.",
  },
  fb: {
    id: "fb",
    path: "f",
    year: "2030",
    title: "The inspection leak",
    sum: "The verification channel becomes an espionage channel. Audit telemetry walks out the door — with a rival's model secrets attached.",
    chip: "Privacy failure",
    body: [
      "The Protocol's designers skipped the expensive part: proofs that reveal compliance without revealing capability. Inspectors see too much, retain too much — and one contractor sells what he saw.",
      "Within weeks every signatory quietly restricts access: 'technical delays' at first, then openly. A regime that requires states to expose their crown jewels, and cannot protect them, dismantles itself. Nobody withdraws; everyone just stops complying with the eyes.",
    ],
    concept: "The transparency–security tradeoff",
    game: "Verification asks states to reveal exactly what they most need to hide — so participation is rational only if disclosure is bounded and provable. Without privacy-preserving verification (zero-knowledge attestation, secure enclaves, data minimization), monitoring is indistinguishable from spying, and counterintelligence logic beats treaty logic every time. You measured this bind at Vienna's design review: exposure crosses the walk-away line before detection ever reaches the deterrence threshold.",
    echo: "UNSCOM, 1998: credible reporting that the Iraq inspection apparatus had been used to collect intelligence beyond its mandate shattered the inspectorate's legitimacy — and hardened every later state's resistance to intrusive inspection.",
  },
  fc: {
    id: "fc",
    path: "f",
    year: "2031",
    title: "The workaround",
    sum: "The chip registry works perfectly. The covert run doesn't use registered chips.",
    chip: "Single layer, single hole",
    body: [
      "The lean regime bet everything on hardware attestation. A rival routes around it: gray-market accelerators, older silicon in absurd quantity, and algorithmic advances that cut the compute needed below the registry's floor.",
      "The violation surfaces eighteen months late, through a defector rather than a sensor. Everyone learns the same lesson at once: the fence had one gate, and the gate was the only thing watched. The regime is not amended; it is abandoned.",
    ],
    concept: "The Swiss cheese model",
    game: "Every safety layer has holes; reliability comes from stacking layers whose holes don't line up. A single mechanism — however strong — is a single point of failure, and adversaries optimize directly against whatever you measure. Residual risk never reaches zero; the design question is whether the failure of one layer is caught by another.",
    echo: "The A.Q. Khan network moved centrifuge designs across three continents for two decades, under an export-control regime that watched states — not private supply chains.",
  },
  fd: {
    id: "fd",
    path: "f",
    year: "2032",
    title: "The breakout",
    sum: "A rival runs the numbers, accepts being seen, and sprints anyway. The sensors work flawlessly — everyone watches it happen.",
    chip: "Detection ≠ deterrence",
    body: [
      "By 2032 the prize has grown: whoever crosses the threshold first may never be caught. The regime's sanctions were sized for 2028 economics; the gain has outrun the penalty by an order of magnitude.",
      "Withdrawal is announced using the treaty's own six-month clause. Verification did its job — the world had two years of warning — but observation without enforcement teeth is a tripwire wired to nothing. The other signatories, forewarned, sprint too.",
    ],
    concept: "Verification is necessary, not sufficient",
    game: "Deterrence needs E[defect] < 0, which requires p·S > (1−p)·G — and G is not a constant. When the prize inflates, yesterday's sufficient sanction becomes today's rounding error. Detection is the input; enforcement is the mechanism. A regime that can see everything and punish nothing changes the information structure but not the payoffs.",
    echo: "North Korea withdrew from the NPT in 2003 in full view of the IAEA. The watching worked; the stopping didn't — the first test came three years later.",
  },
};

export interface RegimeOdd {
  k: OutcomeKey;
  n: string;
  w: number;
  range: string;
}

export interface Regime {
  label: string;
  odds: RegimeOdd[];
  price: string[];
}

export const REGIMES: Record<RegimeKey, Regime> = {
  lean: {
    label: "One strong layer",
    odds: [
      { k: "ok", n: "REGIME HOLDS", w: 20, range: "10–30%" },
      { k: "fa", n: "FALSE ALARM", w: 15, range: "10–25%" },
      { k: "fb", n: "INSPECTION LEAK", w: 25, range: "15–35%" },
      { k: "fc", n: "WORKAROUND", w: 25, range: "15–35%" },
      { k: "fd", n: "OPEN BREAKOUT", w: 15, range: "10–25%" },
    ],
    price: [
      "Chip-registry build-out (single mechanism)",
      "A skeleton inspectorate, chronically underfunded",
      "The political fight you skipped — deferred, with interest",
    ],
  },
  swiss: {
    label: "Defense in depth",
    odds: [
      { k: "ok", n: "REGIME HOLDS", w: 70, range: "55–80%" },
      { k: "fa", n: "FALSE ALARM", w: 6, range: "3–10%" },
      { k: "fb", n: "INSPECTION LEAK", w: 6, range: "3–10%" },
      { k: "fc", n: "WORKAROUND", w: 8, range: "4–14%" },
      { k: "fd", n: "OPEN BREAKOUT", w: 10, range: "5–15%" },
    ],
    price: [
      "Audit tax ≈ 2–4% of all frontier R&D, forever",
      "A multibillion-dollar monitoring stack to build and staff",
      "Foreign inspectors on sovereign soil",
      "An espionage surface you must engineer against",
      "Political capital burned sustaining sanctions",
      "Slower deployment cycles for everyone — including you",
    ],
  },
};

export const PATHS: Record<PathKey, { label: string; ending: "bad" | "good" }> =
  {
    r: { label: "PATH A · THE RACE", ending: "bad" },
    t: { label: "PATH B · THE PAPER TREATY", ending: "bad" },
    v: { label: "PATH C · TRUST, BUT VERIFY", ending: "good" },
  };

export const CONCEPT_CHIPS: Record<PathKey, string[]> = {
  r: ["Security dilemma", "Race to the bottom", "Commitment problem", "Nash trap"],
  t: ["Cheap talk", "Unobservable moves", "Grim trigger", "False confidence"],
  v: [
    "Information structure",
    "Costly signaling",
    "Defense in depth",
    "Engineered odds",
  ],
};

export const FAIL_CHIPS: Record<FailKey, string[]> = {
  fa: ["Decision under noise", "False positives", "Credibility as capital"],
  fb: [
    "Transparency–security tradeoff",
    "Privacy-preserving proofs",
    "Espionage surface",
  ],
  fc: ["Swiss cheese model", "Single point of failure", "Residual risk"],
  fd: ["Detection ≠ deterrence", "Enforcement gap", "Breakout calculus"],
};

export const FAIL_QUOTES: Record<FailKey, string> = {
  fa: "The regime died of a wrong answer, given confidently.",
  fb: "Monitoring that can't keep secrets is spying with extra steps.",
  fc: "One layer is one hole away from zero layers.",
  fd: "Seeing everything and stopping nothing.",
};

export interface Ending {
  title: string;
  quote: string;
  termLab: string;
  termBody: Record<string, string>;
  termTitle: Record<string, string>;
  termYear: Record<string, string>;
}

export const ENDINGS: Record<"bad" | "good", Ending> = {
  bad: {
    title: "Uncontrolled ASI",
    quote: "Every player chose rationally. The structure chose the ending.",
    termLab: "Terminal state",
    termBody: {
      r: "Every player chose their dominant strategy. The result is the outcome every player ranked near the bottom. That is the signature of a dilemma — not stupidity, but structure.",
      t: "Same cliff, different road. An unverifiable treaty didn't just fail to help — it manufactured false confidence, then a betrayal narrative that made cooperation harder than never trying.",
      fa: "The detector was right most of the time. The regime died on the rest — and the race resumed with verification itself discredited.",
      fb: "The eyes saw too much and protected too little. After the leak, no state would consent to being watched again this decade.",
      fc: "One layer, one hole, one workaround. By the time the defector talked, the two-year head start was already spent.",
      fd: "Everyone saw it coming, years out. Seeing was all the regime could do.",
    },
    termTitle: {
      r: "Uncontrolled ASI",
      t: "Uncontrolled ASI — via a detour",
      fa: "Uncontrolled ASI — the regime failed first",
      fb: "Uncontrolled ASI — the regime failed first",
      fc: "Uncontrolled ASI — the regime failed first",
      fd: "Uncontrolled ASI — the regime failed first",
    },
    termYear: {
      r: "2032",
      t: "2031",
      fa: "2031",
      fb: "2032",
      fc: "2033",
      fd: "2033",
    },
  },
  good: {
    title: "The Managed Ascent",
    quote: "Verification doesn't create trust. It makes trust unnecessary.",
    termLab: "Ongoing state",
    termBody: {
      v: "Not utopia, and not a guarantee — a standoff that held, this decade, at full price. Defection stayed visible, punishable, and unprofitable; the failure modes stayed in their tails. The game was redesigned. The risk was engineered down — never away.",
    },
    termTitle: { v: "A stable, inspectable equilibrium" },
    termYear: { v: "2034 →" },
  },
};

export const ECHO_CARDS: { t: string; s: string }[] = [
  {
    t: "IAEA safeguards",
    s: "Inspections made covert nuclear diversion detectable — the template for compute accounting.",
  },
  {
    t: "INF Treaty",
    s: "Inspectors stood inside rival missile plants. Intrusiveness was the price of elimination.",
  },
  {
    t: "START telemetry",
    s: "Both sides left missile-test data unencrypted so claims could be checked directly.",
  },
  {
    t: "OPCW inspections",
    s: "Any member can demand a short-notice inspection — keeping detection probability high everywhere.",
  },
];

/** Intel fragments shown one-per-quarter in the fog mini-game. */
export const INTEL: string[] = [
  "Q1 · Satellite pass: new cooling towers on the rival bloc's northern grid. Civilian cloud, or covert cluster? Analysts split.",
  "Q2 · Procurement: 40,000 accelerators sold through shell buyers. Could be consumer inference. Could not be.",
  "Q3 · A mid-level defector claims covert training runs. No corroboration. The rival government calls it fabrication.",
];

/* ============ Static copy lifted from the page chrome & journey sections ============ */

export const COPY = {
  legend: [
    { k: "r" as const, label: "THE RACE" },
    { k: "t" as const, label: "THE PAPER TREATY" },
    { k: "v" as const, label: "TRUST, BUT VERIFY" },
    { k: "f" as const, label: "FAILURE MODES" },
  ],
  mapHint: "Faded nodes are unexplored — reach them through the timeline",
  begin: {
    idle: "CLICK TO BEGIN",
    some: "REWIND HERE",
    all: "ALL TIMELINES WITNESSED",
  },
  forkNodeLabel: "2026 · THE CAPABILITY JUMP",
  lockedFork: "Locked — begin at the 2026 fork",
  lockedFate: "Locked — fates are drawn at the Vienna design review",
  reset: "reset",
  back: "↺ Return to the map",
};

/** The 2026 fork intro node. */
export const FORK = {
  year: "2026",
  title: "The Capability Jump",
  chip: "Prisoner's dilemma",
  lede: "Frontier capabilities jump across every bloc. Every major power now believes ASI is reachable within a decade — and that whoever controls it first reshapes the world order.",
  body: [
    "Before a single treaty is drafted, the game is already set. Restraint is only rational if you can confirm your rival is restrained too — and right now, nobody can confirm anything.",
    "Before you give any orders, look at the table you are actually sitting at.",
  ],
};

/** The Geneva node inserted between Decision 1 (negotiate) and Decision 2. */
export const GENEVA = {
  year: "2027",
  title: "The Table at Geneva",
  chip: "Negotiation",
  lede: "Your call for talks lands. Fifteen states convene, and caps on frontier training runs are on the table within weeks.",
  body: [
    'Then the hard part: your delegation proposes inspections, chip audits, energy monitoring. Rivals refuse them all — "sovereignty." You can have the caps today, without the eyes. Or you can walk, fund the verification tooling, and hope the table still exists when you return.',
  ],
};

/** The matrix quiz ("See the trap"). */
export const MATRIX = {
  eyebrow: "See the trap",
  title: "The table every capital is looking at.",
  sub: "Each cell: your payoff, then your rival's. Higher is better. Answer the two questions the way a minister would.",
  gridTitle: "The base game · payoffs (you, them)",
  cells: {
    // [youRestrain][theyRestrain]
    rr: { pay: "3 , 3", tag: "Managed ascent", best: true, trap: false },
    rc: { pay: "1 , 4", tag: "You fall behind", best: false, trap: false },
    cr: { pay: "4 , 1", tag: "You lead — briefly", best: false, trap: false },
    cc: { pay: "2 , 2", tag: "Everyone gambles", best: false, trap: true },
  },
  q1: "1 · If your rival restrains, which is better for you?",
  q1a: { restrain: "Restrain — you get 3", race: "Race — you get 4" },
  q2: "2 · If your rival races, which is better for you?",
  q2a: { restrain: "Restrain — you get 1", race: "Race — you get 2" },
  fb: {
    1: {
      right: "Yes — 4 beats 3. If they restrain, racing pays you more.",
      wrong:
        "Check the row: racing gets you 4, restraint 3. If they restrain, racing pays more.",
    },
    2: {
      right: "Yes — 2 beats 1. If they race, racing loses you less.",
      wrong:
        "Check the row: racing gets you 2, restraint 1. If they race, racing still loses you less.",
    },
  },
  eqTag: "◉ EQUILIBRIUM — WHERE INDEPENDENT CHOICES SETTLE",
  conclusion:
    "Racing wins both comparisons. That makes it a dominant strategy — your best move no matter what your rival does. Every rival faces the same table and reasons the same way, so all of you land in the marked cell: worse for everyone than mutual restraint. This structure is the prisoner's dilemma, and that cell is its equilibrium. An equilibrium is not a good outcome. It is a stuck outcome — and everything that follows on this map is a fight over one variable that can unstick it: the probability that cheating gets caught.",
};

/** The fog mini-game copy. */
export const FOG = {
  eyebrow: "Interactive · The fog",
  title: "Three quarters under the Compact. You cannot see your rival's hand.",
  sub: "The treaty is a year old. There are no inspections — only intelligence fragments. Each quarter, choose: hold to the Compact, or hedge. You will learn the truth only at the end. The other side is deciding about you the same way.",
  comply: {
    head: "▣ Comply",
    desc: "Hold to the Compact. If they're cheating, you fall behind.",
  },
  hedge: {
    head: "▶ Hedge",
    desc: "Route covert compute, just in case. If they're honest, you just defected first.",
  },
  roundLab: (n: number) => `Quarter ${n} of 3 · the only signal you get`,
  liftLab: "The fog lifts · what was actually happening",
  verdicts: {
    youHedgedTheyHonest:
      "Your rival was honest the whole time. You defected on a compliant partner — and in half of all runs of this fog, so does everyone. Not out of malice. Out of blindness.",
    bothHedged:
      "Both of you hedged. Both suspected. Both were “proved right.” The treaty is already dead; the announcement just hasn't happened yet.",
    youHeldTheyHedged:
      "You held the line. They didn't. You are now the sucker in the matrix — in the fog, unilateral honesty is unilateral disarmament.",
    bothComplied:
      "Both of you complied — and neither of you will ever be sure of it. You got the good cell by luck. Would you keep betting on it for five more years, with your ministers reading these same intel fragments?",
  },
  note: "You never chose against your rival's actions — only against your fears about them. That is what “no verification” means mechanically: the information to distinguish an honest partner from a cheating one does not exist, so the worst case governs. Change what you can know and you change what you must assume. The arithmetic of that is next.",
  replayHead: "↺ Run the fog again",
  replayDesc: "New quarter, new draw of the truth.",
};

/** The defector's-calculation slider lab copy. */
export const LAB = {
  eyebrow: "Interactive · The defector's calculation",
  title: "Run the numbers a cheating state runs.",
  pLabel: "Detection probability p",
  gLabel: "Gain from undetected cheating G",
  sLabel: "Sanction if caught S",
  defect: {
    lab: "Defection is rational",
    main: "The treaty is paper.",
    sub: "Expected value of cheating is positive — a rational state defects even if it signed in good faith yesterday. This is Path B.",
  },
  comply: {
    lab: "Compliance is rational",
    main: "The treaty holds.",
    sub: "Cheating now costs more than it pays in expectation. No goodwill required — the math does the trusting. This is Path C.",
  },
  eDefect: "E[ defect ]",
  eComply: "E[ comply ]",
  formula: "E[defect] = (1 − p)·G − p·S  ·  cooperation holds when p > G⁄(G+S)",
  thresholdPrefix: "Critical threshold now:",
  above: "you are above it — cooperation is self-enforcing.",
  below: "you are below it — expect quiet defection.",
};

/** The inspector's-dilemma slider lab copy. */
export const INSPECTOR = {
  eyebrow: "Interactive · The inspector's dilemma",
  title: "Buy detection without selling secrets.",
  sub: "Auditors only deter if detection clears the defector's threshold (p* ≈ 60% at Vienna's stakes). But everything inspectors see is also intelligence a rival can steal — and past the walk-away line, states refuse to be inspected at all. Find a design that does both.",
  sliderLabel: "Audit disclosure depth — how much of your stack inspectors see",
  zkLabel:
    "ZERO-KNOWLEDGE ATTESTATION — prove compliance without revealing the system",
  pLabel: "DETECTION p",
  pThreshLabel: "p* deterrence",
  eLabel: "ESPIONAGE EXPOSURE",
  eThreshLabel: "walk-away line",
  verdicts: {
    good: (p: number, e: number) =>
      `Regime forms and deters. Detection ${p}% with exposure only ${e}% — rivals can rationally accept being watched. This combination is unreachable without privacy-preserving proofs.`,
    warn: (p: number) =>
      `Rivals sign — but cheating still pays. At p = ${p}% a defector's expected value is positive. You have built Path B with better paperwork.`,
    badDeters: (p: number, e: number) =>
      `Deterrence for an empty room. p = ${p}% would work — but exposure ${e}% is past the walk-away line. Counterintelligence beats treaty logic; nobody submits to your audits.`,
    badBoth:
      "The worst of both. Exposure past the walk-away line, and detection still short of p*. Rivals walk away from a regime that couldn't have held anyway.",
  },
  note: "Without privacy tech the bind is exact: exposure crosses the walk-away line before detection reaches p*. Zero-knowledge proofs break the coupling between seeing and stealing — that is why the Swiss-cheese ledger pays for them, and what died in THE INSPECTION LEAK when Vienna skipped them.",
};

/** The roll section copy. */
export const ROLL = {
  eyebrow: "Probabilistic resolution",
  title: "The decade rolls.",
  sub: (label: string) =>
    `A regime doesn't buy an outcome — it buys a distribution. Under ${label.toLowerCase()}, the decade resolves with these weights. And the weights are themselves estimates — the ranges are part of the lesson.`,
  run: "▶ RUN THE DECADE",
  mc: "RUN 1,000 DECADES",
  note: "One draw decides this timeline. Rewind from the map to draw again.",
};

/** The three branching decisions. */
export interface Choice {
  id: string;
  pathClass: PathKey | "";
  lab: string;
  title: string;
  desc: string;
  ledger?: string[];
}

export const DECISIONS: Record<
  1 | 2 | 3,
  { eyebrow: string; q: string; ctx: string; choices: Choice[] }
> = {
  1: {
    eyebrow: "Decision 01 · 2026",
    q: "Rivals are scaling. Your ministers want an answer today.",
    ctx: "You chair your bloc's AI council. Nothing binds anyone to anything. What do you order?",
    choices: [
      {
        id: "race",
        pathClass: "r",
        lab: "Unilateral",
        title: "Secure our advantage",
        desc: "Assume rivals will defect. Scale alone, lock down chips and talent, trust no one.",
      },
      {
        id: "nego",
        pathClass: "",
        lab: "Diplomatic",
        title: "Open negotiations",
        desc: "Call the rivals to the table and push for binding caps on frontier training runs.",
      },
    ],
  },
  2: {
    eyebrow: "Decision 02 · 2027 · Geneva",
    q: "Caps, yes. Inspections, never. Sign it?",
    ctx: "The treaty is real and the refusal is real. Your delegation waits for instructions. Fair warning: the hard line is not a safe line — verification is a costly engineering project with failure modes of its own.",
    choices: [
      {
        id: "sign",
        pathClass: "t",
        lab: "Pragmatic",
        title: "Sign what's signable",
        desc: "A treaty without inspections beats no treaty. Bank the goodwill, take the deal.",
      },
      {
        id: "hold",
        pathClass: "v",
        lab: "Hard line",
        title: "No eyes, no deal",
        desc: "Refuse to sign promises nobody can check. Fund the verification tooling first — then sign. Expensive, slow, and not a guarantee.",
      },
    ],
  },
  3: {
    eyebrow: "Decision 03 · 2028 · Vienna — design review",
    q: "The Protocol works on paper. Now the budget committee wants cuts.",
    ctx: "Every layer you keep costs money, sovereignty, and secrets. Every layer you cut is a hole nobody watches. Choose the regime you will actually build — then the decade rolls the dice you bought.",
    choices: [
      {
        id: "lean",
        pathClass: "",
        lab: "Frugal",
        title: "One strong layer",
        desc: "Chip attestation only. Skip the privacy tech, run a skeleton inspectorate. Cheap and fast to ratify — and one hole away from failure.",
        ledger: [
          "Registry build-out only",
          "Minimal audit tax",
          "Low sovereignty cost",
        ],
      },
      {
        id: "swiss",
        pathClass: "",
        lab: "Defense in depth",
        title: "Swiss-cheese the regime",
        desc: "Overlapping layers — attestation, energy analytics, challenge inspections, whistleblowers — plus privacy-preserving proofs. Ruinously expensive. Still not certain.",
        ledger: [
          "Audit tax ≈ 2–4% of frontier R&D",
          "Multibillion monitoring stack",
          "Inspectors on sovereign soil",
          "Espionage surface to defend",
        ],
      },
    ],
  },
};

/** Ending-card "via" and extras copy. */
export const CARD = {
  conceptsUnlocked: "Concepts unlocked",
  pricePaid: "Price paid",
  regimesHeld:
    "Regimes that held — between rivals who never trusted each other",
  fateVia: (title: string, weight: number | null) =>
    `Verification was chosen — and failed anyway. This fate carried ~${weight ?? "?"}% weight under your design.`,
  fateOdds: "One draw from the distribution — rewind to the map and roll again",
  badVia: (label: string) => `Two roads lead here — this was ${label}`,
  goodVia: "One road leads here — and it only usually holds",
  goodOdds: (pct: number, label: string, regime: RegimeKey) =>
    `p(hold) ≈ ${pct}% under ${label.toUpperCase()}${
      regime === "lean"
        ? " — a lucky draw, not a design"
        : " — odds you engineered, and still a draw"
    }`,
  fateEyebrow: (title: string) => `Ending card · PATH C · Fate: ${title}`,
  pathEyebrow: (label: string) => `Ending card · ${label}`,
};

/** Build the tracker string, mirroring the source. */
export function trackerText(timelines: number, endings: number): string {
  return `Timelines ${timelines}/3 · Endings ${endings}/2`;
}
