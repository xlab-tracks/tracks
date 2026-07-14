/**
 * "The Anatomy Drill — Parts of a (Pause) Agreement" — content lifted verbatim
 * from public/verification/anatomy-drill.html (and its extracted content JSON
 * public/verification/content/anatomy-drill.json). Do NOT re-author: every
 * organ description, card text, source line, and feedback string below is
 * human-written curriculum, copied exactly.
 */

/** A single agreement "organ" — one of the seven parts, plus the null bin (n=0). */
export interface Organ {
  n: number;
  key: string;
  name: string;
  /** Short description shown on the bin. */
  d: string;
  /** Decorative categorical colour from the source (inline style; always paired with the numbered name). */
  c: string;
  /** One-line characterization shown in the intro list (organs only). */
  line?: string;
}

export const ORGANS: Organ[] = [
  {
    n: 1,
    key: "rule",
    name: "The rule",
    d: "Definitions, thresholds, scope, duration",
    c: "#8a6d3b",
    line: "What exactly is prohibited, for whom, above what line, for how long. Rules live in their definitions.",
  },
  {
    n: 2,
    key: "claims",
    name: "The claims",
    d: "What parties must be able to prove — declared & undeclared",
    c: "#3b6e8a",
    line: "Everything declared is compliant, and nothing undeclared exists. Every mechanism serves one branch.",
  },
  {
    n: 3,
    key: "evid",
    name: "The evidence",
    d: "Access, inspections, monitoring, timeliness",
    c: "#3b8a5a",
    line: "How anyone would know. Judge it by access and by speed against the breakout clock.",
  },
  {
    n: 4,
    key: "conf",
    name: "The confidentiality bargain",
    d: "What the verifier must NOT see",
    c: "#7a5a8a",
    line: "What stays secret, and the machinery that makes intrusion acceptable. No one signs without it.",
  },
  {
    n: 5,
    key: "adv",
    name: "The adversary",
    d: "The threat model provisions are written against",
    c: "#a04b3f",
    line: "Reconstructed from clauses that only make sense as answers to a specific evasion.",
  },
  {
    n: 6,
    key: "inst",
    name: "The institution & consequences",
    d: "Who verifies, who judges, what follows, exit",
    c: "#4f5d8a",
    line: "Findings, consequences, withdrawal. 'Shall' versus 'may' is the whole organ in two verbs.",
  },
  {
    n: 7,
    key: "gap",
    name: "The gap",
    d: "Verified proxy vs. actual goal; decay; review",
    c: "#8a3b62",
    line: "Compute is not capability, parties are not the world. Good agreements chase their own proxy.",
  },
];

export const NULLBIN: Organ = {
  n: 0,
  key: "none",
  name: "No organ",
  d: "Advocacy: sounds load-bearing, binds no one. The tell is 'should' with no bound actor and no procedure.",
  c: "#9a958a",
};

/** Resolve an organ by its number (0 = the null bin). */
export function organOf(n: number): Organ {
  return n === 0 ? NULLBIN : ORGANS[n - 1];
}

/**
 * Each card: text, source (revealed after placement), organ (0 = no organ),
 *  ok: feedback on correct placement,
 *  near: {organN: feedback} — accepted as defensible, auto-moved, amber,
 *  wrong: {organN: tailored feedback} — rejected with targeted teaching,
 *  generic: fallback wrong-drop feedback.
 */
export interface Card {
  organ: number;
  text: string;
  source: string;
  ok: string;
  near?: Record<number, string>;
  wrong?: Record<number, string>;
  generic: string;
}

export const CARDS: Card[] = [
  {
    organ: 1,
    text: "New training runs using more than 10²⁴ computational operations (FLOP) are prohibited. Runs between 10²² and 10²⁴ FLOP require monitoring.",
    source:
      "MIRI Technical Governance Team, example international agreement, 2025 (paraphrased; thresholds per the November 2025 release).",
    ok: "A rule you can violate is a rule you can verify: a named activity, a measurable unit, a bright line. Notice the two-tier structure. The monitored band below the ceiling exists so that anyone playing games near the line is already inside the monitored zone when they do it.",
    wrong: {
      3: "The word 'monitoring' is doing rule work here: it defines which runs fall under which obligation. HOW monitoring happens (access, instruments, notice periods) would be the evidence organ. This clause is the line itself.",
    },
    generic:
      "Ask what this text does: it draws a measurable line around an activity. That is the rule organ.",
  },
  {
    organ: 3,
    text: "Each Party shall have the right to conduct eighteen short-notice, on-site inspections of the other Party's declared facilities each year.",
    source:
      "New START inspection regime, 2011–2026 (paraphrased). Inspections stopped in 2020 and never resumed; the treaty expired February 5, 2026, years after its verification had already died.",
    ok: "Access, a quota, and a timeliness property ('short-notice'). This is what the evidence organ looks like when it has actually been negotiated: who may enter, how often, and on what clock.",
    near: {
      6: "Defensible: inspections are run by institutional machinery, and the full protocol names it. But the operative function of this clause is generating evidence: access rights with a timeliness property. Tag clauses by what they do, not by who appears in them. Moved to the evidence.",
    },
    generic:
      "Rights of access, on a clock. The function is producing evidence about compliance.",
  },
  {
    organ: 0,
    text: "This pause should be public and verifiable, and include all key actors.",
    source:
      "FLI Open Letter, “Pause Giant AI Experiments,” March 2023 (verbatim). More than 30,000 signatures.",
    ok: "'Verifiable' with no verifier, no access, no procedure, no bound actor. This sentence demands the evidence organ; it does not contain one. The letter moved the political window, which is advocacy's job. The failure would be citing it as if it were an agreement, and that failure happens in print constantly.",
    wrong: {
      3: "Compare this to the New START card: eighteen inspections, short notice, declared facilities. That was evidence. This is a wish for evidence. Who verifies? What may they see? On what timeline? The sentence does not say. Demanding evidence and specifying evidence are different acts.",
      1: "There is no rule here either: no threshold, no defined activity, no bound party, no term. 'Pause' gestures at a rule the way 'verifiable' gestures at a regime. The silhouette of anatomy, none of the organs.",
    },
    generic:
      "Read for the tell: 'should,' with no bound actor and no procedure. Sounds load-bearing, binds no one.",
  },
  {
    organ: 2,
    text: "Assurance requires establishing two things: that declared facilities are running only permitted workloads, and that no undeclared facilities or chip stockpiles exist.",
    source:
      "The declared/undeclared decomposition, standard across the verification literature (paraphrase; see the RAND six-layers working paper, 2025).",
    ok: "The claims organ: what each party must be able to prove, split into its two branches. Sort every provision you read by which branch it serves, and you will find texts dense with monitoring language that leave one branch entirely empty.",
    wrong: {
      3: "One level up. Evidence is how you would establish these things: inspections, attestation, satellite imagery. This clause states what must be established. Claims first; evidence gets judged against them.",
    },
    generic:
      "This text names what must be proven, not how. That is the claims organ.",
  },
  {
    organ: 4,
    text: "Inspectors shall not access, copy, or transmit model parameters, training data, or source code. Verification shall proceed through managed-access procedures and hardware attestation of workload properties.",
    source:
      "Reykjavik Protocol, Article VI, amended teaching text (fictional; the design problem it answers is entirely real).",
    ok: "The confidentiality bargain: what verification must never see, plus the machinery (managed access, attestation) that makes intrusion acceptable anyway. No lab and no state signs without this organ, and it is the technically hardest one to build.",
    wrong: {
      3: "Understandable: it describes how inspection proceeds. But its function is protective. The evidence organ opens doors; this organ decides which doors stay shut, and makes the open ones tolerable to the inspected. That trade is what gets signatures.",
    },
    generic:
      "Ask whose interest this clause protects: the inspected party's secrets. That is the bargain that buys consent to verification.",
  },
  {
    organ: 3,
    text: "Each State Party has the right to request an on-site challenge inspection of any facility or location in the territory or in any other place under the jurisdiction or control of any other State Party … and to have this inspection conducted anywhere without delay.",
    source:
      "Chemical Weapons Convention, Article IX(8) (verbatim, condensed). Entered into force 1997. No state has ever invoked it.",
    ok: "The strongest access language ever negotiated: any facility, anywhere, without delay, no right of refusal. And it has never been used in 28 years, through repeated public accusations of noncompliance. The evidence organ's hardest lesson: access on paper still carries a political activation cost the text cannot see.",
    near: {
      6: "Defensible: the full article routes through the Director-General and Executive Council, which is institutional machinery. But this paragraph's operative content is access: any facility, anywhere, without delay. Moved to the evidence, where its function lives.",
    },
    generic:
      "A right of access, at maximum strength. Evidence organ, with an institutional frame around it.",
  },
  {
    organ: 6,
    text: "Upon a finding of non-compliance, Parties shall suspend the violating Party's access to covered chips and cloud compute, and the matter shall be referred to the Security Council.",
    source:
      "Reykjavik Protocol, Article VIII, amended teaching text (fictional). The weak original read: the Council “may recommend measures to restore compliance.”",
    ok: "Institution and consequences: a finding procedure and an automatic, specified response. Now compare the original version in the source line below. 'Shall suspend' versus 'may recommend' is one verb apart and a whole organ apart. Most real regimes carry the weak verb, and it is where they go to die.",
    wrong: {
      5: "It responds to a violator, but the adversary organ is the threat model that provisions are designed against, before anything happens. This clause is about after: what follows a finding. Consequences are the institution's teeth.",
    },
    generic:
      "Follow the sequence: finding, then consequence, then referral. This is the institutional organ doing its job.",
  },
  {
    organ: 6,
    text: "A Party may withdraw upon ninety days' notice if it decides that extraordinary events related to the subject matter of this Protocol have jeopardized its supreme interests.",
    source:
      "Standard withdrawal language, modeled on NPT Article X — the clause North Korea invoked in 2003.",
    ok: "Exit is part of the institution organ, and it is always read against a clock. If withdrawal takes ninety days and a covert sprint to the prohibited capability takes sixty, the exit clause is a hole through every other organ. Always read the exit at the speed of the breakout it permits.",
    wrong: {
      1: "It has a rule's grammar, but its subject is the agreement itself, not the prohibited activity. Clauses about how bindingness ends belong to the institution organ. The question they raise is not 'what is banned' but 'what is this ban worth in a crisis.'",
    },
    generic:
      "This governs how the agreement's grip ends. Institutional organ: exit is one of its parts.",
  },
  {
    organ: 0,
    text: "We call for a prohibition on the development of superintelligence, not lifted before there is (1) broad scientific consensus that it will be done safely and controllably, and (2) strong public buy-in.",
    source:
      "Statement on Superintelligence, 2025 (verbatim). Over 100,000 signatures within months, including Nobel laureates and two of the three “godfathers” of deep learning.",
    ok: "It has a rule's silhouette: a prohibition, even a lifting condition. But no party is bound, nothing is defined, and no institution exists to judge 'consensus' or run the lifting. It is a demand that a rule exist. As advocacy it may be doing exactly its job; prohibitions get demanded into existence before they get drafted. Just never cite it as if the drafting had happened.",
    wrong: {
      1: "Check what a rule needs: a bound actor ('no State Party shall…'), a measurable line (10²⁴ FLOP), a scope, a term. 'Superintelligence,' by whose measure? Prohibited by whom, on whom? A prohibition-shaped silhouette with none of the anatomy.",
      7: "Sharp instinct: the lifting condition does gesture at review machinery, which is gap-organ work in a real agreement. But there is no institution to run that review and no rule to lift. A condition attached to a nonexistent rule is still advocacy.",
    },
    generic:
      "Apply the tell: who is bound, to what line, judged by whom? No answer, no organ.",
  },
  {
    organ: 1,
    text: "The fine-tuning, continued development, or adaptation of models trained before entry into force shall not constitute a covered training run.",
    source:
      "Reykjavik Protocol, Article I(3) (fictional). Grandfather clauses like it appear throughout real regimes; they are how agreements buy signatures and lose meaning.",
    ok: "Definitions are the rule organ's fine print, and this one has a highway through it: 'continued development' of a pre-existing model is exempt with no compute limit at all. When you stress-test agreements, definitional clauses fail before inspection clauses do. This clause returns in the stress test, where you will be on the other side of it.",
    near: {
      5: "Good instinct, and nearly right: this clause is exactly where an adversary goes first. But the clause itself is a definition, part of the rule organ. The adversary organ is provisions written against evasions. This is not the defense; it is the evasion's front door, left open in the definitions. Moved to the rule.",
    },
    generic:
      "It carves the boundary of the defined term. Definitions belong to the rule, and this one is load-bearing in the worst way.",
  },
  {
    organ: 5,
    text: "Because a covert program could evade facility-level monitoring by spreading training across many small sites, unmonitored chip holdings anywhere are capped at the equivalent of 16 H100 chips — roughly $500,000 of hardware.",
    source:
      "MIRI TGT example agreement, 2025 (paraphrased, including the report's stated rationale and 2025 cost figure).",
    ok: "The adversary organ made visible: a named evasion path, and a provision priced against it. Most agreements never write their threat model down; you reconstruct it from clauses like this one. An agreement with no reconstructible threat model was drafted against no adversary.",
    near: {
      1: "Defensible: the cap is a threshold, and thresholds are rule furniture. But read the first half of the sentence. The provision exists as an answer to a specific evasion, and it tells you so. When a clause only makes sense against a particular cheat, the adversary is the organ doing the talking. Moved.",
    },
    generic:
      "Read the 'because.' This clause is an answer to a named evasion, which is the adversary organ speaking.",
  },
  {
    organ: 7,
    text: "Recognizing that training compute is an imperfect proxy for model capability, the thresholds in Article I shall be reviewed annually and may be lowered by a two-thirds vote of the Conference of Parties.",
    source:
      "Composite review-clause language (fictional drafting; the proxy problem it answers is conceded by regulators and researchers alike).",
    ok: "The gap organ: the agreement admitting that what it measures (FLOP) is not what it is for (capability), and building machinery to chase its own decaying proxy. Note the voting rule, two-thirds rather than consensus. A consensus rule here lets one party freeze the threshold while algorithms quietly erode it to nothing.",
    near: {
      1: "Defensible: it amends the rule, so it touches organ one. But its function is managing the distance between the measured proxy and the actual goal. That distance is the gap, and this clause is its maintenance schedule. Moved.",
    },
    generic:
      "'Imperfect proxy' is the giveaway: this clause manages the space between what is verified and what is wanted. That space is the gap.",
  },
  {
    organ: 0,
    text: "AI labs and independent experts should use this pause to jointly develop and implement a set of shared safety protocols for advanced AI design and development that are rigorously audited and overseen by independent outside experts.",
    source: "FLI Open Letter, March 2023 (verbatim).",
    ok: "Every noun of the evidence and institution organs appears (protocols, audits, independent experts) and none is bound to anything. This is the promissory-note pattern, and real agreements carry it too: the BWC's verification protocol stayed 'to be negotiated' from 1975 until the effort collapsed in 2001, and the ban has run on trust ever since. A deferred organ is an absent organ until the day it is drafted.",
    wrong: {
      3: "The vocabulary of evidence is all here: audits, oversight, outside experts. Now ask the two binding questions. Who is bound? ('Labs and experts should' binds no one.) What procedure exists? (None; it is to be developed, jointly, later.) Vocabulary is not anatomy.",
      6: "It names overseers, which smells institutional. But no institution is created, empowered, funded, or given a decision rule. 'Overseen by independent outside experts' is a job posting, not an organ.",
    },
    generic:
      "Run the tell: 'should,' unbound actors, procedures deferred to future joint work. Advocacy.",
  },
];

/** Ungraded closing "one last drag" — negotiating-priority verdicts, keyed by organ number. */
export const JUDGMENT: Record<number, string> = {
  1: "A defensible first pick: definitions fail before inspectors do, and every later organ inherits the rule's precision. The negotiator's caution: definitional fights are where talks stall longest, and a perfect rule with a weak evidence organ is how you get a ban that runs on trust.",
  2: "The analyst's pick. Getting the declared/undeclared decomposition written into the text disciplines everything downstream, because every mechanism must then name the branch it serves. Almost no real treaty makes it explicit, which is why so many have one branch standing empty.",
  3: "The obvious pick, and the one that eats the whole negotiation, because access is precisely what states resist. The CWC's record applies: the strongest access clause ever drafted has waited 28 years for someone willing to pay the political price of invoking it.",
  4: "The professional's pick. Acceptability runs through this organ: managed access and attestation are what let a rival say yes to intrusion, and the RAND authors are blunt that much of this machinery needs years of R&D. Whoever builds it first sets the terms everyone else signs.",
  5: "The red-teamer's pick. An agreement drafted against no adversary collapses on first contact, and such agreements show themselves in unpriced carve-outs. Push to get the threat model in writing; you will be told it is impolitic. It was impolitic in 1972 as well, and the BWC shows the bill.",
  6: "The realist's pick. Findings without automatic consequences produced most of arms control's dead letters; 'may recommend measures' is the genre's epitaph. The caution: automatic consequences are also exactly what makes states hesitate to sign. This organ prices the deal.",
  7: "The forecaster's pick. Compute is a decaying proxy, so an agreement without review machinery is accurate on signing day and a little more wrong every day after. The quiet problem is the voting rule: review that can be vetoed is a freeze with extra steps.",
};

export interface ProtocolArticle {
  id: string;
  text: string;
}

export const PROTOCOL: ProtocolArticle[] = [
  {
    id: "Preamble",
    text: "The States Parties to this Protocol, recognizing that certain applications of advanced artificial intelligence may pose risks to international security, have agreed as follows:",
  },
  {
    id: "Article I — Definitions",
    text: "(1) “Covered training run” means the training of a single general-purpose artificial intelligence model using more than 10²⁶ computational operations. (2) “Covered facility” means any installation with power capacity exceeding 10 megawatts operated for the purpose of artificial intelligence computation. (3) The fine-tuning, continued development, or adaptation of models trained before entry into force of this Protocol shall not constitute a covered training run.",
  },
  {
    id: "Article II — Core obligation",
    text: "No State Party shall conduct, authorize, or knowingly permit within its jurisdiction any covered training run for a period of five years from entry into force.",
  },
  {
    id: "Article III — Declarations",
    text: "(1) Each State Party shall, within 180 days, declare all covered facilities and all holdings of applicable high-performance computing hardware exceeding one thousand units, as specified in Annex A. (2) Declarations shall be updated annually.",
  },
  {
    id: "Article IV — Monitoring",
    text: "Declared covered facilities shall install power metering and workload verification instruments approved by the Technical Secretariat, where technically and commercially feasible.",
  },
  {
    id: "Article V — Inspections",
    text: "(1) The Technical Secretariat may conduct routine inspections of declared facilities upon fourteen days’ notice. (2) Any State Party may request a challenge inspection of any facility of another State Party; such inspection shall proceed upon approval by a two-thirds majority of the Executive Council.",
  },
  {
    id: "Article VI — Confidentiality",
    text: "Inspectors shall not access, copy, or transmit model parameters, training data, or source code. Managed access procedures shall be specified in Annex B, to be concluded by the Executive Council no later than two years after entry into force.",
  },
  {
    id: "Article VII — Non-parties",
    text: "States Parties shall not export applicable high-performance computing hardware to non-parties, except as licensed for verified civilian purposes.",
  },
  {
    id: "Article VIII — Non-compliance",
    text: "Upon a finding of non-compliance by the Executive Council, the Council may recommend measures to restore compliance, and may refer the matter to the United Nations Security Council.",
  },
  {
    id: "Article IX — Withdrawal",
    text: "A State Party may withdraw from this Protocol upon ninety days’ notice if it decides that extraordinary events related to the subject matter of this Protocol have jeopardized its supreme interests.",
  },
  {
    id: "Article X — Review and amendment",
    text: "The thresholds and definitions in Article I may be amended by consensus of all States Parties at a Review Conference, the first of which shall convene three years after entry into force.",
  },
];

/** Static intro copy (from the intro card + header). */
export const COPY = {
  introNote:
    "Sources are hidden until you place each card. Read the text, not the letterhead. Where a tag is arguable, a defensible second-best answer is accepted and discussed, because expert readers disagree about these too. Drag with mouse or touch, or click a card and then click a bin.",
  begin: "Begin",
  resultsHead: "Results",
  scoreClean: "clean first reads",
  scoreNear: "defensible near-tags",
  scoreMiss: "needed a second look",
  summaryLead:
    "Now look at what you just built, sorted by where each specimen came from:",
  tableHead: ["Source", "Organs it supplied", "Status in the world"] as const,
  tableRows: [
    [
      "Chemical Weapons Convention, New START",
      "The evidence (twice, at full negotiated strength)",
      "One never invoked in 28 years; the other expired in February 2026, verification first.",
    ],
    [
      "MIRI TGT example agreement (2025)",
      "The rule, the adversary",
      "Fully drafted anatomy. Zero signatures; its own authors say the political will does not yet exist.",
    ],
    [
      "FLI Open Letter, Statement on Superintelligence",
      "Nothing but the No-organ bin",
      "Over 130,000 signatures between them.",
    ],
    [
      "The Reykjavik Protocol (fiction)",
      "Everything else",
      "Fictional; written for this course. Full text below.",
    ],
  ] as const,
  punch:
    "In AI today, the texts with anatomy have no signatures, and the texts with signatures have no anatomy. Neither fact is an insult to either kind of text. The distance between them is the current state of AI governance.",
  judgmentLead:
    "One last drag. You are staffing the delegation that will negotiate a real training pause. Resources are finite. Drag the organ you would put at the top of the negotiating agenda:",
  judgmentSlotEmpty: "Drop your priority here (or click a chip)",
  judgmentNoRight:
    "There is no single right answer here. Bring yours to your cohort session and defend it.",
  whereNext:
    "Where this goes next: the full dissection applies these seven tags to a real proposed agreement, clause by clause, and the stress test asks you to defeat what you tagged.",
  restart: "Restart drill",
  protocolHead: "The Reykjavik Protocol — full text",
  protocolNote:
    "The fictional agreement several specimens were drawn from. Two specimens used strengthened versions of Articles VI and VIII; the original text appears here. You will work with this document again in the dissection and the stress test.",
} as const;

// ---------- pure drop resolution (used by the widget and its tests) ----------

export type DropKind = "clean" | "near" | "bad";

export interface DropResult {
  kind: DropKind;
  msg?: string;
}

/**
 * Pure drop resolution, copied from the source `resolveDrop`:
 *  - exact organ match  -> clean
 *  - a defensible `near` tag for this bin -> near (auto-placed, amber)
 *  - otherwise -> bad, with the tailored `wrong` message or the generic fallback.
 */
export function resolveDrop(card: Card, binN: number): DropResult {
  if (binN === card.organ) return { kind: "clean" };
  if (card.near && card.near[binN] !== undefined)
    return { kind: "near", msg: card.near[binN] };
  const msg =
    card.wrong && card.wrong[binN] !== undefined
      ? card.wrong[binN]
      : card.generic;
  return { kind: "bad", msg };
}
