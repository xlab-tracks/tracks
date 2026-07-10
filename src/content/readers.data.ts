import type { Reader } from "@/lib/content/types";

// Readers concatenate an ordered set of lessons into one long, numbered page,
// with a markdown-derived section tree that feeds the same sidebar panel papers
// use. The lessons listed here are the same Lesson entries defined in
// curriculum.data.ts; they are deliberately NOT in any module's itemIds, so
// they have no standalone page and render only inside the reader.
//
// After editing a reader (or any lesson it includes) run:
//   npm run readers:build
// which regenerates src/content/readers/<id>.mdx and readers/tocs.generated.ts.
// content.test.ts fails if the committed output is stale.

export const readers: Reader[] = [
  {
    id: "c-reader-demo",
    slug: "trusted-monitoring-demo",
    moduleId: "c-intro",
    title: "Trusted Monitoring Demo and Exercises",
    lessonIds: [
      "c-game-l1",
      "c-game-l2",
      "c-game-l4",
      "c-game-l5",
      "c-game-l6",
      "c-game-l3",
      "c-game-l7",
      "c-game-l8",
    ],
    estimatedMinutes: 95,
  },
];
