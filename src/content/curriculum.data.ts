import type { Lesson, Module, Track } from "@/lib/content/types";

// Placeholder curriculum: 2 tracks for now — Control (technical) and Governance.
// ~2 modules each, ~1–2 lessons per module. Real curriculum replaces the copy;
// the structure exercises prerequisites (including a cross-track link),
// capstone modes, and assessments.

export const tracks: Track[] = [
  {
    id: "control",
    slug: "control",
    title: "AI Control",
    shortTitle: "Control",
    description:
      "Hands-on technical track on controlling and evaluating AI systems. Lorem ipsum dolor sit amet, consectetur adipiscing elit, building toward a capstone in the final module.",
    kind: "technical",
    moduleIds: ["c-intro", "c-threat-modeling"],
    capstoneMode: "final-only",
    hasCapstone: true,
    prerequisiteEnforcement: "hard",
    estimatedHours: 20,
  },
  {
    id: "governance",
    slug: "governance",
    title: "AI Governance & Policy",
    shortTitle: "Governance",
    description:
      "Policy-oriented track with real writing deliverables. Lorem ipsum dolor sit amet — a capstone that builds progressively across modules.",
    kind: "governance",
    moduleIds: ["g-intro", "g-instruments"],
    capstoneMode: "progressive",
    hasCapstone: true,
    prerequisiteEnforcement: "soft",
    estimatedHours: 18,
  },
];

export const modules: Module[] = [
  // --- Control (technical) ---
  {
    id: "c-intro",
    slug: "intro",
    trackId: "control",
    title: "Intro to AI Control",
    summary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    order: 1,
    prerequisiteModuleIds: [],
    lessonIds: ["c-intro-l1", "c-intro-l2"],
    assessmentId: "as-c1",
    furtherReadingTopics: ["alignment", "interpretability"],
    estimatedMinutes: 75,
  },
  {
    id: "c-threat-modeling",
    slug: "threat-modeling-and-robustness",
    trackId: "control",
    title: "Threat Modeling & Robustness",
    summary:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip. Core threat-modeling content that also gates into Governance.",
    order: 2,
    prerequisiteModuleIds: ["c-intro"],
    lessonIds: ["c-threat-modeling-l1"],
    assessmentId: "as-c2",
    furtherReadingTopics: ["threat-modeling", "robustness"],
    estimatedMinutes: 60,
  },
  // --- Governance ---
  {
    id: "g-intro",
    slug: "intro",
    trackId: "governance",
    title: "Intro to AI Governance",
    summary:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque.",
    order: 1,
    prerequisiteModuleIds: [],
    lessonIds: ["g-intro-l1", "g-intro-l2"],
    assessmentId: "as-g1",
    furtherReadingTopics: ["governance", "policy"],
    estimatedMinutes: 70,
    capstoneCheckpoint: {
      id: "cp-g1",
      title: "Capstone: frame your policy question",
      prompt:
        "Lorem ipsum dolor sit amet: define the policy question your capstone will address and why it matters.",
    },
  },
  {
    id: "g-instruments",
    slug: "policy-instruments",
    trackId: "governance",
    title: "Policy Instruments",
    summary:
      "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur.",
    order: 2,
    // Cross-track prerequisite: Governance learners must complete the Control
    // track's threat-modeling module first — demonstrates shared core content.
    prerequisiteModuleIds: ["g-intro", "c-threat-modeling"],
    lessonIds: ["g-instruments-l1"],
    assessmentId: "as-g2",
    furtherReadingTopics: ["policy", "governance"],
    estimatedMinutes: 55,
    capstoneCheckpoint: {
      id: "cp-g2",
      title: "Capstone: choose an instrument",
      prompt:
        "Consectetur adipiscing elit: select the policy instrument(s) your proposal will use and justify the choice.",
    },
  },
];

export const lessons: Lesson[] = [
  // Control / Intro
  {
    id: "c-intro-l1",
    slug: "introduction",
    moduleId: "c-intro",
    title: "The control landscape",
    order: 1,
    contentRef: "c-intro-l1",
    estimatedMinutes: 14,
  },
  {
    id: "c-intro-l2",
    slug: "key-ideas",
    moduleId: "c-intro",
    title: "Core control ideas",
    order: 2,
    contentRef: "c-intro-l2",
    estimatedMinutes: 16,
  },
  // Control / Threat Modeling & Robustness
  {
    id: "c-threat-modeling-l1",
    slug: "introduction",
    moduleId: "c-threat-modeling",
    title: "Thinking in threats",
    order: 1,
    contentRef: "c-threat-modeling-l1",
    estimatedMinutes: 13,
  },
  // Governance / Intro
  {
    id: "g-intro-l1",
    slug: "introduction",
    moduleId: "g-intro",
    title: "Why govern AI?",
    order: 1,
    contentRef: "g-intro-l1",
    estimatedMinutes: 12,
  },
  {
    id: "g-intro-l2",
    slug: "key-ideas",
    moduleId: "g-intro",
    title: "Actors & levers",
    order: 2,
    contentRef: "g-intro-l2",
    estimatedMinutes: 15,
  },
  // Governance / Policy Instruments
  {
    id: "g-instruments-l1",
    slug: "introduction",
    moduleId: "g-instruments",
    title: "A toolkit of instruments",
    order: 1,
    contentRef: "g-instruments-l1",
    estimatedMinutes: 11,
  },
];
