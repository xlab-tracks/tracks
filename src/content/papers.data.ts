import type { Paper } from "@/lib/content/types";

// Example papers for the demo track. Paper titles/metadata are factual (they
// come from the arXiv artifact); all inserted lesson/exercise copy stays
// placeholder-level. See AUTHORING.md for the authoring workflow, including
// how to discover insertion sectionIds (`npm run arxiv:build -- --toc <id>`).
export const papers: Paper[] = [
  {
    id: "ex-paper-attention",
    slug: "attention-paper",
    moduleId: "ex-content",
    title: "Attention Is All You Need",
    source: { kind: "arxiv", arxivId: "1706.03762v7" },
    estimatedMinutes: 45,
    insertions: [
      {
        sectionId: "ax-sec-scaled-dot-product-attention",
        items: [{ kind: "exercise", id: "multiple-choice" }],
      },
      {
        sectionId: "ax-sec-conclusion",
        items: [
          { kind: "lesson", id: "ex-paper-note-l1" },
          { kind: "exercise", id: "understanding-check" },
        ],
      },
    ],
  },
  {
    // A plain paper with no insertions — just the inline reading.
    id: "ex-paper-anti-scheming",
    slug: "anti-scheming-paper",
    moduleId: "ex-assess",
    title: "Stress Testing Deliberative Alignment for Anti-Scheming Training",
    source: { kind: "arxiv", arxivId: "2509.15541v1" },
    estimatedMinutes: 30,
  },
];
