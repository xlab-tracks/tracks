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
    moduleIds: ["c-intro", "c-mod2", "c-areas"],
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
      "The foundation for the track: Redwood Research's \"AI Control: Improving Safety Despite Intentional Subversion\" paper rendered in full with guided exercises woven in, then rebuilt as an interactive, calibrated demo you can play with.",
    order: 1,
    prerequisiteModuleIds: [],
    // The paper item, then the demo lessons merged into one multi-section
    // lesson (its section order preserves the designed reading order — "best
    // response" deliberately comes after the sections that introduce its
    // levers), then the two threat-modeling readings (both build on the
    // paper, so they come last).
    itemIds: ["c-paper-ai-control", "c-game", "c-threats-l1", "c-threats-l2"],
    estimatedMinutes: 242,
  },
  {
    // Placeholder — content for this module is not written yet. Rename the
    // id/slug/title when the real curriculum lands (module ids are not
    // persisted anywhere, so renaming is safe).
    id: "c-mod2",
    slug: "module-2",
    trackId: "control",
    title: "Coming soon",
    summary: "Content for this module is in development.",
    order: 2,
    prerequisiteModuleIds: ["c-intro"],
    itemIds: [],
  },
  {
    id: "c-areas",
    slug: "areas-of-control-work",
    trackId: "control",
    title: "Areas of control work",
    summary:
      "Ryan Greenblatt's survey of the areas of control research and implementation that seem most promising, reproduced verbatim from the Redwood Research blog.",
    order: 3,
    // c-mod2 is empty for now, so it counts as complete and only c-intro
    // actually gates; listing both keeps the chain correct once c-mod2 gets
    // content.
    prerequisiteModuleIds: ["c-intro", "c-mod2"],
    itemIds: ["c-areas-l1"],
    estimatedMinutes: 40,
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
