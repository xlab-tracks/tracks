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
      "The foundation for the track: Redwood Research's \"AI Control: Improving Safety Despite Intentional Subversion\" paper reproduced in full, then rebuilt as an interactive, calibrated demo you can play with.",
    order: 1,
    prerequisiteModuleIds: [],
    // Two concatenated readers: the reproduced paper, then the interactive
    // demo. Each stitches its lessons (defined below, but kept out of itemIds)
    // into one numbered page — see readers.data.ts.
    itemIds: ["c-reader-paper", "c-reader-demo"],
    estimatedMinutes: 190,
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
  // --- Control: "The control paper" (verbatim reproduction) ---
  {
    id: "c-paper-l1",
    slug: "abstract-and-introduction",
    moduleId: "c-intro",
    title: "Abstract & Introduction",
    contentRef: "c-paper-l1",
    estimatedMinutes: 8,
  },
  {
    id: "c-paper-l2",
    slug: "setting",
    moduleId: "c-intro",
    title: "Setting",
    contentRef: "c-paper-l2",
    estimatedMinutes: 15,
  },
  {
    id: "c-paper-l3",
    slug: "results-baselines-and-trusted-monitoring",
    moduleId: "c-intro",
    title: "Results I — Baselines & Trusted Monitoring",
    contentRef: "c-paper-l3",
    estimatedMinutes: 15,
  },
  {
    id: "c-paper-l4",
    slug: "results-defer-untrusted-monitoring-and-trusted-editing",
    moduleId: "c-intro",
    title: "Results II — Defer to Trusted, Untrusted Monitoring & Trusted Editing",
    contentRef: "c-paper-l4",
    estimatedMinutes: 20,
  },
  {
    id: "c-paper-l6",
    slug: "discussion",
    moduleId: "c-intro",
    title: "Discussion",
    contentRef: "c-paper-l6",
    estimatedMinutes: 12,
  },
  {
    id: "c-paper-l8",
    slug: "appendix-glossary",
    moduleId: "c-intro",
    title: "Glossary",
    contentRef: "c-paper-l8",
    estimatedMinutes: 6,
  },
  {
    id: "c-paper-l9",
    slug: "appendix-summary-statistics-justification",
    moduleId: "c-intro",
    title: "Justification of Summary Statistics Access",
    contentRef: "c-paper-l9",
    estimatedMinutes: 8,
  },
  {
    id: "c-paper-l10",
    slug: "appendix-black-box-protocol-assumption",
    moduleId: "c-intro",
    title: "The Black-Box Protocol Assumption",
    contentRef: "c-paper-l10",
    estimatedMinutes: 10,
  },
  // --- Control: "The demo" (interactive, model-backed) ---
  {
    id: "c-game-l1",
    slug: "why-a-good-monitor-still-misses",
    moduleId: "c-intro",
    title: "Why a good monitor still misses",
    contentRef: "c-game-l1",
    estimatedMinutes: 10,
  },
  {
    id: "c-game-l2",
    slug: "same-auroc-different-safety",
    moduleId: "c-intro",
    title: "Same AUROC, different safety",
    contentRef: "c-game-l2",
    estimatedMinutes: 12,
  },
  {
    id: "c-game-l4",
    slug: "safety-over-a-deployment-the-race",
    moduleId: "c-intro",
    title: "Safety over a deployment: the race",
    contentRef: "c-game-l4",
    estimatedMinutes: 12,
  },
  {
    id: "c-game-l5",
    slug: "opportunities-are-not-equal",
    moduleId: "c-intro",
    title: "Opportunities are not equal",
    contentRef: "c-game-l5",
    estimatedMinutes: 12,
  },
  {
    id: "c-game-l6",
    slug: "subtlety-visible-versus-reliable",
    moduleId: "c-intro",
    title: "Subtlety: visible versus reliable",
    contentRef: "c-game-l6",
    estimatedMinutes: 10,
  },
  {
    id: "c-game-l3",
    slug: "the-best-response-principle",
    moduleId: "c-intro",
    title: "The best-response principle",
    contentRef: "c-game-l3",
    estimatedMinutes: 12,
  },
  {
    id: "c-game-l7",
    slug: "defer-to-trusted-mechanistically",
    moduleId: "c-intro",
    title: "Defer to trusted, mechanistically",
    contentRef: "c-game-l7",
    estimatedMinutes: 12,
  },
  {
    id: "c-game-l8",
    slug: "the-whole-picture",
    moduleId: "c-intro",
    title: "The control game: the whole picture",
    contentRef: "c-game-l8",
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
