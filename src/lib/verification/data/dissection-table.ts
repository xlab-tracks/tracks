/**
 * Data for "The Dissection Table — Anatomy of a (Pause) Agreement" widget —
 * lifted verbatim from public/verification/dissection-table.html and
 * public/verification/content/dissection-table.json (the authored HTML).
 * Do not re-author, paraphrase, shorten, or translate; this is human-written
 * curriculum. The planted oddities (e.g. a flaw clause with zero organs) are
 * intentional "lessons not bugs" and are preserved exactly.
 */

export interface Organ {
  n: number;
  name: string;
  d: string;
  /** Okabe-Ito-adjacent accent key used by the widget for the semantic dot. */
  c: string;
}

export interface Clause {
  id: string;
  flaw: boolean;
  organs: number[];
  text: string;
  annotation: string;
}

export interface DissectionDocument {
  title: string;
  intro: string;
  missingOrgans: number[];
  modelAnswer: string;
  clauses: Clause[];
}

export const ORGANS: Organ[] = [
  {
    n: 1,
    name: "The rule",
    d: "Definitions, scope, thresholds, duration",
    c: "var(--o1)",
  },
  {
    n: 2,
    name: "The claims",
    d: "What parties must prove: declared-compliant / no-undeclared",
    c: "var(--o2)",
  },
  {
    n: 3,
    name: "The evidence",
    d: "Access, inspections, monitoring, timeliness",
    c: "var(--o3)",
  },
  {
    n: 4,
    name: "The confidentiality bargain",
    d: "What the verifier must not see; managed access",
    c: "var(--o4)",
  },
  {
    n: 5,
    name: "The adversary",
    d: "Threat model; the cheapest evasion priced in",
    c: "var(--o5)",
  },
  {
    n: 6,
    name: "The institution & consequences",
    d: "Who verifies, who judges, what happens, exit",
    c: "var(--o6)",
  },
  {
    n: 7,
    name: "The gap",
    d: "Verified proxy vs. actual goal; non-parties; decay",
    c: "var(--o7)",
  },
];

export const DOCUMENTS: Record<string, DissectionDocument> = {
  fli: {
    title: "Warm-up: the 2023 FLI Open Letter (operative excerpts)",
    intro:
      "Published March 22, 2023, signed by more than 30,000 people. Read each excerpt and tag the organs you find. Be strict. A demand for an organ is not the organ.",
    missingOrgans: [2, 3, 4, 5, 6, 7],
    modelAnswer:
      "Organ 3, the evidence, is the absence that matters most. The letter demands a pause that is “public and verifiable” and offers no verifier, no access, and no evidence for the claim it wants the world to accept. Organ 5 is the runner-up: there is no adversary anywhere in the text, so the letter cannot ask what a lab that quietly kept training would do. None of this makes the letter a failure. It is advocacy, it moved the political window, and advocacy is how agreements get demanded into existence. The failure would be reading it as an agreement.",
    clauses: [
      {
        id: "Excerpt 1",
        flaw: true,
        organs: [1],
        text: "“…we call on all AI labs to immediately pause for at least 6 months the training of AI systems more powerful than GPT-4.”",
        annotation:
          "The closest thing to a rule in the letter: an addressee (all AI labs), a duration (6 months), an activity (training). But the threshold is “more powerful than GPT-4,” a comparator no one can measure, attached to a system whose own training compute was not public. Compare how the MIRI TGT agreement and the EU AI Act both retreat to FLOP counts precisely because “powerful” is unverifiable. The planted lesson: a rule is only as strong as its most measurable word.",
      },
      {
        id: "Excerpt 2",
        flaw: true,
        organs: [],
        text: "“This pause should be public and verifiable, and include all key actors.”",
        annotation:
          "The most important sentence in the letter, and it contains no organ at all. “Verifiable” appears with no verifier, no evidence, no access rights, and no procedure. This single adjective is carrying the entire technical program that the rest of this track studies. If you tagged organ 3 here, that is the exact reflex this exercise exists to retrain: demanding evidence and specifying evidence are different acts.",
      },
      {
        id: "Excerpt 3",
        flaw: false,
        organs: [],
        text: "“If such a pause cannot be enacted quickly, governments should step in and institute a moratorium.”",
        annotation:
          "The letter’s closest approach to organ 6: it names a category of actors (governments) who should act. But a category is not an institution. No jurisdiction, no procedure, no consequence for a lab that declines. Notice the letter itself concedes here that voluntary compliance may fail, which is an implicit, unpriced adversary model.",
      },
      {
        id: "Excerpt 4",
        flaw: false,
        organs: [],
        text: "“AI labs and independent experts should use this pause to jointly develop and implement a set of shared safety protocols… rigorously audited and overseen by independent outside experts.”",
        annotation:
          "A gesture toward evidence (audits, outside experts), deferred to future joint work. Structurally this is a promissory note, the same move as a treaty annex “to be concluded.” Keep this shape in mind; you will meet it again in the Reykjavik Protocol’s Article VI, where it is load-bearing.",
      },
      {
        id: "Excerpt 5",
        flaw: false,
        organs: [],
        text: "“These [governance systems] should at a minimum include… oversight and tracking of highly capable AI systems and large pools of computational capability…”",
        annotation:
          "This half-sentence is the embryo of the entire compute-governance agenda: tracking large pools of computational capability. Everything in this track’s mechanism modules is an attempt to make these words operational. As drafted here, it is a wish. The distance between this sentence and the CWC’s two-hundred-page verification annex is the distance this module measures.",
      },
    ],
  },
  reykjavik: {
    title: "The Reykjavik Protocol on the Limitation of Large-Scale AI Training",
    intro:
      "A fictional agreement written for this exercise: good-faith, professionally drafted, and flawed the way real agreements are flawed. Nine planted weaknesses, each modeled on a documented feature of a real regime. Tag organs, flag weaknesses, and note your reasoning. One organ is missing from the entire document. Find it.",
    missingOrgans: [5],
    modelAnswer:
      "Organ 5, the adversary, is absent from the whole document, and that absence explains nearly every planted flaw. No article reads as if a drafter asked “what does the cheater do next?” That is why the definitional carve-out in Article I(3) survives, why fourteen days’ notice seemed acceptable, why the challenge inspection got a green-light vote, and why withdrawal takes ninety days under a pause whose whole function is buying time. An agreement drafted without an adversary is a description of good behavior, not a constraint on bad behavior.",
    clauses: [
      {
        id: "Article I(1)",
        flaw: true,
        organs: [1],
        text: "“Covered training run” means the training of a single general-purpose artificial intelligence model using more than 10²⁶ computational operations.",
        annotation:
          "PLANTED FLAW. Two words do fatal work. “Single” invites splitting one effort across checkpoints, ensembles, or distillation so no run crosses the line. “General-purpose” invites classification games (our model is a coding specialist). Definitional battles like this consumed years of missile-treaty diplomacy. The repair direction, which the MIRI TGT agreement takes, is cumulative compute toward a model lineage, with a monitoring threshold set far below the ceiling so gaming the definition still lands you inside the monitored band.",
      },
      {
        id: "Article I(2)",
        flaw: true,
        organs: [1],
        text: "“Covered facility” means any installation with power capacity exceeding 10 megawatts operated for the purpose of artificial intelligence computation.",
        annotation:
          "PLANTED FLAW (paired with Article III). The 10 MW floor defines the undeclared branch’s blind spot: any evasion distributed across sub-10 MW sites is invisible to the declaration regime by construction. Compare the MIRI agreement’s far harsher line: unmonitored holdings capped at the equivalent of 16 H100 chips. The gulf between “16 accelerators” and “10 megawatts” is where the no-undeclared-use claim lives or dies. Also note “operated for the purpose of,” a self-declared intent test.",
      },
      {
        id: "Article I(3)",
        flaw: true,
        organs: [1],
        text: "The fine-tuning, continued development, or adaptation of models trained before entry into force of this Protocol shall not constitute a covered training run.",
        annotation:
          "PLANTED FLAW, the worst in the document. A grandfather clause with no compute limit on the exempted activity: “continued development” of a pre-Protocol model can absorb unlimited compute without ever constituting a covered run. Grandfathering is how regimes buy signatures and lose meaning. If you play BREAKOUT, this clause is the highway you will probably drive down.",
      },
      {
        id: "Article II",
        flaw: false,
        organs: [1, 2],
        text: "No State Party shall conduct, authorize, or knowingly permit within its jurisdiction any covered training run for a period of five years from entry into force.",
        annotation:
          "Sound, as far as it goes. This article creates the claims every party must be able to make: nothing we declared crossed the line, and nothing undeclared exists. “Knowingly permit within its jurisdiction” is a real hook that reaches private actors, subsidiaries, and rented compute. Its five-year term is defensible; read it again, though, after you read Article IX’s ninety-day exit.",
      },
      {
        id: "Article III",
        flaw: false,
        organs: [2, 3],
        text: "Each State Party shall, within 180 days, declare all covered facilities and all holdings of applicable high-performance computing hardware exceeding one thousand units… Declarations shall be updated annually.",
        annotation:
          "Sound skeleton: declarations are the baseline every declared-branch verification hangs from, the same move as New START’s data exchanges and IAEA declarations. Two soft spots worth noting even in a sound article: the 1,000-unit floor (pairs with the I(2) flaw), and annual updates in a domain where a training run takes weeks.",
      },
      {
        id: "Article IV",
        flaw: true,
        organs: [3],
        text: "Declared covered facilities shall install power metering and workload verification instruments approved by the Technical Secretariat, where technically and commercially feasible.",
        annotation:
          "PLANTED FLAW: “where technically and commercially feasible” lets the monitored party adjudicate its own monitoring. Feasibility hatches of this shape are a classic softener in compliance regimes. The honest version of this article would say the instruments do not all exist yet, which is true (the RAND six-layers report is explicit that most verification hardware needs years of R&D), and would create the R&D obligation and interim measures instead of an escape valve.",
      },
      {
        id: "Article V(1)",
        flaw: true,
        organs: [3],
        text: "The Technical Secretariat may conduct routine inspections of declared facilities upon fourteen days’ notice.",
        annotation:
          "PLANTED FLAW. Fourteen days sanitizes almost anything digital: workloads migrate in minutes, logs can be rebuilt, chips can be physically relocated. Notice periods are the most fought-over numbers in arms control for a reason. New START ran short-notice inspections; the IAEA Additional Protocol’s complementary access runs on 24 hours. Ask what evidence survives fourteen days in a data center, and you have organ 3’s timeliness test.",
      },
      {
        id: "Article V(2)",
        flaw: true,
        organs: [3, 6],
        text: "Any State Party may request a challenge inspection of any facility of another State Party; such inspection shall proceed upon approval by a two-thirds majority of the Executive Council.",
        annotation:
          "PLANTED FLAW, the strongest single patch available. This is a green-light design: inspection happens only if a supermajority votes yes, which makes every challenge a diplomatic showdown before it begins. The CTBT’s on-site inspections work this way; none has ever been approved. The CWC inverted it: a challenge inspection proceeds unless three quarters of the Council votes to block it within 12 hours. Even the CWC’s red-light version has never been invoked in 28 years, which tells you how politically expensive accusation is. A green-light version is dead on arrival.",
      },
      {
        id: "Article VI",
        flaw: true,
        organs: [4],
        text: "Inspectors shall not access, copy, or transmit model parameters, training data, or source code. Managed access procedures shall be specified in Annex B, to be concluded by the Executive Council no later than two years after entry into force.",
        annotation:
          "PLANTED FLAW. The first sentence is right, and necessary: no state or lab accepts verification that exposes the model. But the second sentence defers the entire confidentiality bargain to an annex that does not exist. The precedent is exact: the BWC’s verification protocol stayed “to be negotiated” from 1975 until the effort collapsed in 2001, partly because the confidentiality bargain for biology could not be struck. An agreement whose organ 4 is a promissory note has an organ 3 no party will honor in practice.",
      },
      {
        id: "Article VII",
        flaw: false,
        organs: [1, 7],
        text: "States Parties shall not export applicable high-performance computing hardware to non-parties, except as licensed for verified civilian purposes.",
        annotation:
          "Sound in intent: this is the article that acknowledges the gap between binding parties and the actual goal, which is preventing dangerous training anywhere. It projects the rule outward through the supply chain, the same lever as today’s export-control regime. Open questions a sharp reader will still flag: existing stocks already outside, smuggling, and who verifies “verified civilian purposes.”",
      },
      {
        id: "Article VIII",
        flaw: true,
        organs: [6],
        text: "Upon a finding of non-compliance by the Executive Council, the Council may recommend measures to restore compliance, and may refer the matter to the United Nations Security Council.",
        annotation:
          "PLANTED FLAW: “may recommend measures” is the modal weakness of nearly every regime. Verification and enforcement are different organs; this article proves a violation can be found and then guarantees nothing follows. Trace a hypothetical violation through this text: detection (Articles IV–V, if they worked), finding (Council vote), then… a recommendation. The hand-off to hope happens here.",
      },
      {
        id: "Article IX",
        flaw: true,
        organs: [6],
        text: "A State Party may withdraw from this Protocol upon ninety days’ notice if it decides that extraordinary events related to the subject matter of this Protocol have jeopardized its supreme interests.",
        annotation:
          "PLANTED FLAW, and the subtlest. The language is standard (it is nearly verbatim NPT Article X, the clause North Korea used in 2003). The flaw is contextual: read against a pause whose entire function is buying time, a ninety-day exit means a party can withdraw, sprint, and present the fait accompli the Protocol existed to prevent. Always read the exit clause at the speed of the breakout it permits.",
      },
      {
        id: "Article X",
        flaw: false,
        organs: [1, 7],
        text: "The thresholds and definitions in Article I may be amended by consensus of all States Parties at a Review Conference, the first of which shall convene three years after entry into force.",
        annotation:
          "Mostly sound, and the existence of review machinery is an anti-flaw: it is the Protocol’s only acknowledgment that compute thresholds are decaying proxies as algorithms improve. But look closely at “by consensus of all States Parties.” One party can freeze the threshold forever. If you flagged this article anyway, take the bonus: consensus amendment rules are how regimes calcify while the world moves.",
      },
    ],
  },
};

export const DISSECTION_COPY = {
  selectClause: "Select a clause",
  selectHint:
    "Work top to bottom. You cannot see the instructor layer for a clause until you commit your own read of it.",
  taggingHint:
    "Which organs does this clause implement (not merely demand)? Flag it if you suspect a weakness, and say why. Commit locks your read and reveals the instructor layer.",
  notePlaceholder:
    "Your note: what does this clause assume, and what would an adversary do with it?",
  flagLabel: "Flag as suspected weakness",
  commitClause: "Commit this clause",
  committedStatus: "✓ committed",
  clickToTag: "click to tag",
  instructorLayer: "Instructor layer",
  noOrgansAgreed: "No organs — agreed",
  flawHit: "⚑ Planted flaw — you caught it.",
  flawMiss:
    "⚑ Planted flaw — you missed it. Read the annotation below and note what tipped the instructor read.",
  flawFalsePositive:
    "⚐ Not a planted flaw. Suspicion is free but findings are not; check the annotation for why this clause is (mostly) sound.",
  viewSummary: "View summary: organ coverage map & flaw score →",
  summaryHeading: "Summary — ",
  coverageIntro:
    "Organ coverage across the whole document (instructor layer). The theater test is anatomy by absence: what is missing matters more than what is present.",
  present: "PRESENT",
  absent: "ABSENT",
  flawsFlaggedLabel: "planted flaws flagged",
  falsePositivesLabel: "false positives (sound clauses flagged)",
  flawsYouMissed: "Flaws you missed:",
  finalQuestion: "Final question",
  finalPrompt:
    "Which absent organ matters most, and why? Write your answer before revealing the model answer.",
  finalPlaceholder: "Your answer…",
  revealModel: "Reveal model answer",
  modelLabel: "Model answer.",
  backToDocument: "← Back to document",
} as const;
