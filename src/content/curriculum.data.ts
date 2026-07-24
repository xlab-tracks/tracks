import type { Lesson, Module, Track } from "@/lib/content/types";

// Control and Governance are intentionally empty for now — just an intro blurb,
// ready for real curriculum. The "Example" track is a fully-built demo of every
// feature (the content types, each exercise type, papers with inline activities,
// an end-of-module assessment, and a cross-module prerequisite). Replace lorem
// with real content; see AUTHORING.md.

export const tracks: Track[] = [
  {
    id: "control",
    slug: "control",
    title: "AI Control",
    shortTitle: "Control",
    description:
      "Hands-on technical track on controlling and evaluating AI systems. The introductory module works through Redwood Research's \"AI Control: Improving Safety Despite Intentional Subversion\" paper and then rebuilds its trusted-monitoring result as an interactive, model-backed demo.",
    kind: "technical",
    moduleIds: ["c-intro", "c-mod2", "c-areas", "c-mod4", "c-mod5", "c-lowstakes"],
    prerequisiteEnforcement: "hard",
  },
  {
    id: "governance",
    slug: "governance",
    title: "AI Governance & Policy",
    shortTitle: "Governance",
    description:
      "content coming soon",
    kind: "governance",
    moduleIds: [],
    prerequisiteEnforcement: "soft",
  },
  {
    id: "verification",
    slug: "verification",
    title: "Verification",
    shortTitle: "Verification",
    description:
      "Interactive modules, primers, and exercises on verifying international AI agreements — from why the problem matters, to the compute supply chain, to the game theory that makes verification the hinge of any deal.",
    kind: "governance",
    moduleIds: [
      "v-foundations",
      "v-primers",
      "v-supply-chain",
      "v-games",
      "v-facilitator",
    ],
    prerequisiteEnforcement: "soft",
  },
  {
    id: "example",
    slug: "example",
    title: "Example Track",
    shortTitle: "Example",
    description:
      "A demo track showing every feature in one place — the content types, each exercise type, an inline paper with embedded activities, an end-of-module assessment, and a cross-module prerequisite.",
    kind: "example",
    moduleIds: ["ex-content", "ex-assess"],
    prerequisiteEnforcement: "soft",
    estimatedHours: 1,
  },
];

export const modules: Module[] = [
  {
    id: "c-intro",
    slug: "introduction",
    trackId: "control",
    title: "Introduction, overview, and threat modeling",
    summary:
      "The foundation for the track: Redwood Research's \"AI Control: Improving Safety Despite Intentional Subversion\" paper rendered in full with guided exercises woven in, then rebuilt as an interactive, calibrated demo you can play with.",
    order: 1,
    prerequisiteModuleIds: [],
    // Opens with Redwood's "case for control" motivation, then the AI Control
    // paper and the trusted-monitoring demo lesson, then four Redwood readings
    // rendered in full through the paper reader — the "case for control" post
    // carries the module's guided exercises woven into the reading. Reading
    // order: motivation, the paper, the demo, catching scheming AIs, and the
    // two threat-modeling posts (the safety–usefulness tradeoff model now
    // lives in module 2). All
    // readings are reproduced (arXiv/LessWrong/Substack artifacts) with
    // permission.
    itemIds: [
      "c-case-for-control",
      "c-paper-ai-control",
      "c-game",
      "c-catching-red-handed",
      "c-threats-l1",
      "c-threats-l2",
    ],
    estimatedMinutes: 377,
  },
  {
    // Human-authored curriculum (from the course author's "contra control"
    // and "control regimes" notes): the case against control evaluated
    // argument by argument, then the regime model — three states, a safety
    // budget, and the loop — for deciding when control is worth buying. The
    // argue-reveal exercise carries the critic/defender exchange; the
    // Author-TODO callouts in the lessons mark planned figures/demos/exercises.
    id: "c-mod2",
    slug: "how-useful-is-ai-control",
    trackId: "control",
    title: "How useful is AI control?",
    summary:
      "The strongest arguments against AI control — deferred alignment research, slop, the superintelligence ceiling, moral hazard — illustrated one at a time, evaluated, and weighed against the additive alternatives; then the regime model: three states, a safety budget, and the loop that says when control is worth buying; and finally where control sits among Plans A through D, the plan landscape different levels of political will make available.",
    order: 2,
    prerequisiteModuleIds: ["c-intro"],
    itemIds: [
      "c-contra-l1",
      "c-efficient-tradeoffs",
      "c-regimes-l1",
      "c-plans-abcd",
      "c-regimes-l2",
    ],
  },
  {
    id: "c-areas",
    slug: "areas-of-control-work",
    trackId: "control",
    title: "Areas of control work",
    summary:
      "Ryan Greenblatt's survey of the areas of control research and implementation that seem most promising, reproduced verbatim from the Redwood Research blog.",
    order: 3,
    prerequisiteModuleIds: ["c-intro", "c-mod2"],
    itemIds: ["c-areas-l1"],
    estimatedMinutes: 40,
  },
  {
    // Placeholder — see c-mod2.
    id: "c-mod4",
    slug: "module-4",
    trackId: "control",
    title: "Coming soon",
    summary: "Content for this module is in development.",
    order: 4,
    prerequisiteModuleIds: ["c-intro", "c-mod2", "c-areas"],
    itemIds: [],
  },
  {
    // Placeholder — see c-mod2.
    id: "c-mod5",
    slug: "module-5",
    trackId: "control",
    title: "Coming soon",
    summary: "Content for this module is in development.",
    order: 5,
    prerequisiteModuleIds: ["c-intro", "c-mod2", "c-areas", "c-mod4"],
    itemIds: [],
  },
  {
    id: "c-lowstakes",
    slug: "low-stakes-control",
    trackId: "control",
    title: "Low-stakes control: sabotage, sandbagging, and elicitation",
    summary:
      "The low-stakes regime, where catastrophe requires many weakly-incriminating actions: Hebbar's ControlConf talk, Redwood's methods for non-concentrated failures and analysis of sandbagging and exploration hacking, Carlsmith's \"no sandbagging on checkable tasks\" hypothesis, and four papers spanning adaptive deployment, capability elicitation, and sabotage evaluation.",
    order: 6,
    // Empty placeholder modules count as complete, so only the built modules
    // actually gate; listing every ancestor keeps the chain correct as the
    // placeholders fill in.
    prerequisiteModuleIds: ["c-intro", "c-mod2", "c-areas", "c-mod4", "c-mod5"],
    itemIds: [
      "c-lowstakes-l1",
      "c-lowstakes-l2",
      "c-paper-adaptive-deployment",
      "c-lowstakes-l3",
      "c-lowstakes-l4",
      "c-paper-plm-guided",
      "c-paper-password-locked",
      "c-paper-exploration-hacking",
      "c-paper-sabotage-evals",
      "c-paper-auditing-sabotage-bench",
    ],
    estimatedMinutes: 309,
  },
  // --- Verification: each item is a self-contained HTML interactive from
  // public/verification/, embedded via <VerificationExercise/>. Module
  // grouping and every title/blurb mirror the site's own nav.js manifest. ---
  {
    id: "v-foundations",
    slug: "foundations",
    trackId: "verification",
    title: "Foundations",
    summary:
      "Why verification matters and what an agreement is made of: what the people building frontier AI say about superintelligence, a field map of the verification problem space, and a pause agreement scoped, priced, dissected, drilled, and re-read as a cast list.",
    order: 1,
    prerequisiteModuleIds: [],
    itemIds: [
      "v-what-do-they-say",
      "v-verification-landscape",
      "v-policy-scoping",
      "v-policy-cost",
      "v-dissection-table",
      "v-anatomy-drill",
      "v-protocol-actors",
    ],
  },
  {
    id: "v-primers",
    slug: "primers",
    trackId: "verification",
    title: "Primers & Pre-work",
    summary:
      "The background the exercises lean on: the game theory behind verification, how states actually behave, and two labs — one where a verification slider flips a Prisoner's Dilemma into an Assurance Game, one where priced verifiers fight for survival in an evolutionary tournament.",
    order: 2,
    prerequisiteModuleIds: [],
    itemIds: [
      "v-game-theory-primer",
      "v-ir-primer",
      "v-change-the-game",
      "v-evolution-of-verification",
    ],
  },
  {
    id: "v-supply-chain",
    slug: "supply-chain",
    trackId: "verification",
    title: "Supply Chain",
    summary:
      "The world map of AI compute — who makes what, where it flows, and where verification can grab hold, with a look inside the chip itself — then an inspector's notebook and the three desks that will each act on a different piece of it.",
    order: 3,
    prerequisiteModuleIds: [],
    itemIds: ["v-interactive-map", "v-report-constructor"],
  },
  {
    id: "v-games",
    slug: "games",
    trackId: "verification",
    title: "Exercises & Games",
    summary:
      "Adversarial play: tamper with the hardware and trace the evidence, price deterrence with two inspection teams across five sites, and build a verification regime while the decade 2026–2034 keeps moving.",
    order: 4,
    prerequisiteModuleIds: [],
    itemIds: [
      "v-tamper-trace",
      "v-inspection-game",
      "v-verification-timeline-game",
    ],
  },
  {
    id: "v-facilitator",
    slug: "facilitator",
    trackId: "verification",
    title: "Facilitator",
    summary:
      "Run the room, don't run the lecture — session plans, timing, and lenses for teaching the track.",
    order: 5,
    prerequisiteModuleIds: [],
    itemIds: ["v-facilitator-guide"],
  },
  {
    id: "ex-content",
    slug: "content-types",
    trackId: "example",
    title: "Content types",
    summary:
      "Text, video, callouts, an interactive demo, exercises, and inline readings (an arXiv paper, a Substack post, and a LessWrong post).",
    order: 1,
    prerequisiteModuleIds: [],
    itemIds: [
      "ex-content-l1",
      "ex-paper-attention",
      "ex-paper-substack",
      "ex-paper-lesswrong",
      "ex-content-l2",
    ],
    furtherReadingTopics: ["alignment", "interpretability"],
    estimatedMinutes: 70,
  },
  {
    id: "ex-assess",
    slug: "assessment-and-prerequisites",
    trackId: "example",
    title: "Assessment & prerequisites",
    summary:
      "This module requires the first one (a soft prerequisite) and ends with a written assessment.",
    order: 2,
    prerequisiteModuleIds: ["ex-content"],
    itemIds: ["ex-assess-l1", "ex-paper-anti-scheming"],
    assessmentId: "ex-assessment",
    furtherReadingTopics: ["governance"],
    estimatedMinutes: 40,
  },
];

export const lessons: Lesson[] = [
  // --- Verification: one lesson per interactive; contentRef === id; the MDX
  // body is the page's authored blurb plus <VerificationExercise/> (the
  // protocol-actors blurb is lightly adapted: the site's copy says "Module 0",
  // which is the Foundations module here). ---
  {
    id: "v-what-do-they-say",
    slug: "what-do-they-say",
    moduleId: "v-foundations",
    title: "Why Are We Concerned About Superintelligence?",
    contentRef: "v-what-do-they-say",
  },
  {
    id: "v-verification-landscape",
    slug: "verification-landscape",
    moduleId: "v-foundations",
    title: "The Verification Landscape",
    contentRef: "v-verification-landscape",
  },
  {
    id: "v-policy-scoping",
    slug: "policy-scoping",
    moduleId: "v-foundations",
    title: "Scoping an Anti-ASI Policy",
    contentRef: "v-policy-scoping",
  },
  {
    id: "v-policy-cost",
    slug: "policy-cost",
    moduleId: "v-foundations",
    title: "Everything Comes With a Cost",
    contentRef: "v-policy-cost",
  },
  {
    id: "v-dissection-table",
    slug: "dissection-table",
    moduleId: "v-foundations",
    title: "The Dissection Table",
    contentRef: "v-dissection-table",
  },
  {
    id: "v-anatomy-drill",
    slug: "anatomy-drill",
    moduleId: "v-foundations",
    title: "The Anatomy Drill",
    contentRef: "v-anatomy-drill",
  },
  {
    id: "v-protocol-actors",
    slug: "protocol-actors",
    moduleId: "v-foundations",
    title: "Who's in the Treaty?",
    contentRef: "v-protocol-actors",
  },
  {
    id: "v-game-theory-primer",
    slug: "game-theory-primer",
    moduleId: "v-primers",
    title: "Game Theory for Verification",
    contentRef: "v-game-theory-primer",
  },
  {
    id: "v-ir-primer",
    slug: "ir-primer",
    moduleId: "v-primers",
    title: "IR for People Who Build Things",
    contentRef: "v-ir-primer",
  },
  {
    id: "v-change-the-game",
    slug: "change-the-game",
    moduleId: "v-primers",
    title: "Change the Game: The Race Dilemma Lab",
    contentRef: "v-change-the-game",
  },
  {
    id: "v-evolution-of-verification",
    slug: "evolution-of-verification",
    moduleId: "v-primers",
    title: "The Evolution of Verification",
    contentRef: "v-evolution-of-verification",
  },
  {
    id: "v-interactive-map",
    slug: "interactive-map",
    moduleId: "v-supply-chain",
    title: "The Compute Supply Chain",
    contentRef: "v-interactive-map",
  },
  {
    id: "v-report-constructor",
    slug: "report-constructor",
    moduleId: "v-supply-chain",
    title: "One Inspection, Three Readers",
    contentRef: "v-report-constructor",
  },
  {
    id: "v-tamper-trace",
    slug: "tamper-trace",
    moduleId: "v-games",
    title: "Tamper & Trace",
    contentRef: "v-tamper-trace",
  },
  {
    id: "v-inspection-game",
    slug: "inspection-game",
    moduleId: "v-games",
    title: "The Inspection Game",
    contentRef: "v-inspection-game",
  },
  {
    id: "v-verification-timeline-game",
    slug: "verification-timeline-game",
    moduleId: "v-games",
    title: "The Verification Game",
    contentRef: "v-verification-timeline-game",
  },
  {
    id: "v-facilitator-guide",
    slug: "facilitator-guide",
    moduleId: "v-facilitator",
    title: "Facilitator Field Guide",
    contentRef: "v-facilitator-guide",
  },
  // --- Control: the trusted-monitoring demo, one multi-section lesson (its
  // ## sections give it a paper-style section nav in the sidebar). ---
  {
    id: "c-game",
    slug: "trusted-monitoring-as-a-game",
    moduleId: "c-intro",
    title: "Trusted monitoring as a game",
    contentRef: "c-game",
    estimatedMinutes: 92,
  },
  // --- Control, module 2 (how useful is AI control?): the case against
  // control, from the course author's notes; embeds the
  // contra-control-argue-reveal exercise. ---
  {
    id: "c-contra-l1",
    slug: "how-useful-is-ai-control",
    moduleId: "c-mod2",
    title: "How useful is AI control?",
    contentRef: "c-contra-l1",
  },
  {
    id: "c-regimes-l1",
    slug: "determining-the-usefulness",
    moduleId: "c-mod2",
    title: "Determining the usefulness",
    contentRef: "c-regimes-l1",
  },
  {
    id: "c-regimes-l2",
    slug: "running-the-model",
    moduleId: "c-mod2",
    title: "Running the model",
    contentRef: "c-regimes-l2",
  },
  // --- Control: every reproduced reading in module 1 (with permission from
  // Redwood Research) now renders through the paper reader as a Paper item in
  // papers.data.ts — the "case for control" post, the safety–usefulness
  // tradeoff model, "catching AIs red-handed", and the two threat-modeling
  // posts (prioritizing threats; diffuse threats / research sabotage). Their
  // guided exercises are spliced back into the reading via Paper.edits. ---
  // --- Control, module 6 (low-stakes control): a talk plus three readings
  // (the Redwood posts reproduced verbatim with permission; the Carlsmith
  // post reproduced verbatim from LessWrong) ---
  {
    id: "c-lowstakes-l1",
    slug: "low-stakes-control-talk",
    moduleId: "c-lowstakes",
    title: "Low-stakes control (ControlConf talk)",
    contentRef: "c-lowstakes-l1",
    estimatedMinutes: 30,
  },
  {
    id: "c-lowstakes-l2",
    slug: "handling-non-concentrated-failures",
    moduleId: "c-lowstakes",
    title: "Notes on handling non-concentrated failures with AI control",
    contentRef: "c-lowstakes-l2",
    estimatedMinutes: 26,
  },
  {
    id: "c-lowstakes-l3",
    slug: "misalignment-and-strategic-underperformance",
    moduleId: "c-lowstakes",
    title:
      "Misalignment and strategic underperformance: an analysis of sandbagging and exploration hacking",
    contentRef: "c-lowstakes-l3",
    estimatedMinutes: 24,
  },
  {
    id: "c-lowstakes-l4",
    slug: "no-sandbagging-on-checkable-tasks",
    moduleId: "c-lowstakes",
    title: "The “no sandbagging on checkable tasks” hypothesis",
    contentRef: "c-lowstakes-l4",
    estimatedMinutes: 19,
  },
  // Lessons embedded inside the guided password-locked-models paper
  // (c-paper-plm-guided) via Paper.edits activity insertions. Deliberately
  // NOT in the module's itemIds — they render only inside the paper.
  {
    id: "c-plm-ins-elicitation",
    slug: "fine-tuning-based-elicitation",
    moduleId: "c-lowstakes",
    title: "Fine-tuning-based elicitation",
    contentRef: "c-plm-ins-elicitation",
    estimatedMinutes: 5,
  },
  {
    id: "c-plm-ins-setups",
    slug: "classes-of-experimental-setups",
    moduleId: "c-lowstakes",
    title: "Classes of experimental setups",
    contentRef: "c-plm-ins-setups",
    estimatedMinutes: 4,
  },
  {
    id: "c-plm-ins-setups-analysis",
    slug: "comparing-the-classes",
    moduleId: "c-lowstakes",
    title: "Comparing the classes",
    contentRef: "c-plm-ins-setups-analysis",
    estimatedMinutes: 4,
  },
  {
    id: "c-plm-ins-toy",
    slug: "an-initial-experiment",
    moduleId: "c-lowstakes",
    title: "An initial experiment",
    contentRef: "c-plm-ins-toy",
    estimatedMinutes: 5,
  },
  {
    id: "c-plm-ins-toy-results",
    slug: "hypotheses-confounds-and-results",
    moduleId: "c-lowstakes",
    title: "Hypotheses, confounds, and the small experiment's results",
    contentRef: "c-plm-ins-toy-results",
    estimatedMinutes: 5,
  },
  // --- Control: areas of control work (reproduced verbatim with permission
  // from Redwood Research) ---
  {
    id: "c-areas-l1",
    slug: "an-overview-of-areas-of-control-work",
    moduleId: "c-areas",
    title: "An overview of areas of control work",
    contentRef: "c-areas-l1",
    estimatedMinutes: 40,
  },
  {
    id: "ex-content-l1",
    slug: "text-video-callouts",
    moduleId: "ex-content",
    title: "Text, video & callouts",
    contentRef: "ex-content-l1",
    estimatedMinutes: 8,
  },
  {
    id: "ex-content-l2",
    slug: "demos-and-exercises",
    moduleId: "ex-content",
    title: "Demos & exercises",
    contentRef: "ex-content-l2",
    estimatedMinutes: 10,
  },
  {
    id: "ex-assess-l1",
    slug: "putting-it-together",
    moduleId: "ex-assess",
    title: "Putting it together",
    contentRef: "ex-assess-l1",
    estimatedMinutes: 7,
  },
  // Inline-only: rendered inside the "ex-paper-attention" paper via its
  // insertions. Deliberately NOT in any module's itemIds — no standalone page.
  {
    id: "ex-paper-note-l1",
    slug: "reading-guide",
    moduleId: "ex-content",
    title: "Reading guide",
    contentRef: "ex-paper-note-l1",
    estimatedMinutes: 4,
  },
];
