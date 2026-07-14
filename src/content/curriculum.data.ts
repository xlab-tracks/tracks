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
    moduleIds: ["c-intro"],
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
    // The paper item, then the demo lessons merged into one multi-section
    // lesson (its section order preserves the designed reading order — "best
    // response" deliberately comes after the sections that introduce its
    // levers).
    itemIds: ["c-paper-ai-control", "c-game"],
    estimatedMinutes: 215,
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
      "Text, video, callouts, an interactive demo, exercises, and an inline paper.",
    order: 1,
    prerequisiteModuleIds: [],
    itemIds: ["ex-content-l1", "ex-paper-attention", "ex-content-l2"],
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
  // --- Control: threat-modeling readings (reproduced verbatim with
  // permission from Redwood Research) ---
  {
    id: "c-threats-l1",
    slug: "prioritizing-threats-for-ai-control",
    moduleId: "c-intro",
    title: "Prioritizing threats for AI control",
    contentRef: "c-threats-l1",
    estimatedMinutes: 15,
  },
  {
    id: "c-threats-l2",
    slug: "diffuse-threats-research-sabotage",
    moduleId: "c-intro",
    title:
      "How can we solve diffuse threats like research sabotage with AI control?",
    contentRef: "c-threats-l2",
    estimatedMinutes: 12,
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
