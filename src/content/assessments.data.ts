import type { Assessment } from "@/lib/content/types";

// Placeholder end-of-module assessments, one per module. Each uses a real
// deliverable format and section scaffold; copy is lorem ipsum.
export const assessments: Assessment[] = [
  {
    id: "as-c1",
    moduleId: "c-intro",
    title: "Research summary",
    format: "research-summary",
    prompt:
      "Summarize a (placeholder) paper. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    minWords: 300,
    maxWords: 700,
    sections: [
      { id: "question", label: "Research question", placeholder: "What does the work ask?" },
      { id: "method", label: "Method", placeholder: "How is it studied?" },
      { id: "findings", label: "Findings", placeholder: "What was found?" },
      { id: "limitations", label: "Limitations", placeholder: "What are the caveats?" },
    ],
    rubric: [
      { id: "accuracy", label: "Accuracy", description: "Lorem ipsum dolor sit amet." },
      { id: "synthesis", label: "Synthesis", description: "Consectetur adipiscing elit." },
      { id: "critique", label: "Critical insight", description: "Sed do eiusmod tempor." },
    ],
  },
  {
    id: "as-c2",
    moduleId: "c-threat-modeling",
    title: "Technical essay",
    format: "essay",
    prompt:
      "Argue a position: lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.",
    minWords: 500,
    maxWords: 1000,
    sections: [
      { id: "thesis", label: "Thesis", placeholder: "State your claim…" },
      { id: "analysis", label: "Analysis", placeholder: "Make your case…" },
      { id: "conclusion", label: "Conclusion", placeholder: "Wrap up…" },
    ],
    rubric: [
      { id: "rigor", label: "Technical rigor", description: "Lorem ipsum dolor sit amet." },
      { id: "clarity", label: "Clarity", description: "Consectetur adipiscing elit." },
      { id: "originality", label: "Originality", description: "Sed do eiusmod tempor." },
    ],
  },
  {
    id: "as-g1",
    moduleId: "g-intro",
    title: "Policy memo",
    format: "policy-memo",
    prompt:
      "Draft a policy memo to a decision-maker. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    minWords: 400,
    maxWords: 900,
    sections: [
      { id: "to", label: "To", placeholder: "Recipient" },
      { id: "from", label: "From", placeholder: "Your name / office" },
      { id: "re", label: "Re", placeholder: "Subject line" },
      { id: "summary", label: "Executive summary", guidance: "The ask in 2–3 sentences." },
      { id: "background", label: "Background", guidance: "Context the reader needs." },
      { id: "recommendation", label: "Recommendation", guidance: "Specific, actionable advice." },
    ],
    rubric: [
      { id: "bluf", label: "Bottom line up front", description: "Lorem ipsum dolor sit amet." },
      { id: "feasibility", label: "Feasibility", description: "Consectetur adipiscing elit." },
      { id: "concision", label: "Concision", description: "Sed do eiusmod tempor." },
    ],
  },
  {
    id: "as-g2",
    moduleId: "g-instruments",
    title: "Bill draft",
    format: "bill-draft",
    prompt:
      "Draft model legislative text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    minWords: 350,
    maxWords: 1200,
    sections: [
      { id: "title", label: "Short title", placeholder: "This Act may be cited as…" },
      { id: "findings", label: "Findings", guidance: "The legislature finds that…" },
      { id: "definitions", label: "Definitions", guidance: "Define key terms used below." },
      { id: "provisions", label: "Operative provisions", guidance: "The substantive requirements." },
    ],
    rubric: [
      { id: "precision", label: "Legal precision", description: "Lorem ipsum dolor sit amet." },
      { id: "enforceability", label: "Enforceability", description: "Consectetur adipiscing." },
      { id: "scope", label: "Appropriate scope", description: "Sed do eiusmod tempor." },
    ],
  },
];
