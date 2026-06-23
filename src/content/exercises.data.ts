import type { Exercise } from "@/lib/content/types";

// Placeholder exercises (lorem ipsum). Structure is real so every exercise type
// renders and grades; copy is filler to be replaced with real content.
export const exercises: Exercise[] = [
  {
    id: "ex-mc-1",
    type: "multiple-choice",
    prompt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit — which option best describes the idea?",
    options: [
      { id: "a", label: "Lorem ipsum dolor sit amet" },
      { id: "b", label: "Consectetur adipiscing elit" },
      { id: "c", label: "Sed do eiusmod tempor incididunt" },
      { id: "d", label: "Ut labore et dolore magna" },
    ],
    correctOptionIds: ["b"],
    explanation:
      "Placeholder explanation: consectetur adipiscing elit is correct because lorem ipsum dolor sit amet.",
  },
  {
    id: "ex-ms-1",
    type: "multi-select",
    prompt: "Select all that apply. Lorem ipsum dolor sit amet consectetur?",
    options: [
      { id: "a", label: "Duis aute irure dolor" },
      { id: "b", label: "Excepteur sint occaecat" },
      { id: "c", label: "Cupidatat non proident" },
      { id: "d", label: "Sunt in culpa qui officia" },
    ],
    correctOptionIds: ["a", "c"],
    explanation:
      "Placeholder explanation: duis aute and cupidatat both apply; the others do not.",
  },
  {
    id: "ex-tf-1",
    type: "true-false",
    prompt: "True or false: lorem ipsum dolor sit amet consectetur adipiscing elit.",
    options: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    correctOptionIds: ["false"],
    explanation: "Placeholder explanation: the statement is false because sed do eiusmod.",
  },
  {
    id: "ex-uc-1",
    type: "understanding-check",
    prompt:
      "In your own words, explain lorem ipsum dolor sit amet. Then reveal a sample answer to compare.",
    sampleAnswer:
      "Sample answer (placeholder): lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: "ex-mc-2",
    type: "multiple-choice",
    prompt: "Lorem ipsum — pick the option that does not belong.",
    options: [
      { id: "a", label: "Tempor incididunt" },
      { id: "b", label: "Labore et dolore" },
      { id: "c", label: "Quis nostrud exercitation" },
      { id: "d", label: "Ullamco laboris nisi" },
    ],
    correctOptionIds: ["c"],
    explanation: "Placeholder explanation: quis nostrud exercitation is the odd one out.",
  },
  {
    id: "ex-wp-1",
    type: "writing-prompt",
    prompt:
      "Write a short response: lorem ipsum dolor sit amet, consectetur adipiscing elit. Aim for a clear, structured paragraph.",
    format: "free-form",
    minWords: 80,
    maxWords: 300,
    rubric: [
      { id: "clarity", label: "Clarity", description: "Lorem ipsum dolor sit amet." },
      { id: "structure", label: "Structure", description: "Consectetur adipiscing elit." },
      { id: "evidence", label: "Use of evidence", description: "Sed do eiusmod tempor." },
    ],
  },
  {
    id: "ex-mc-3",
    type: "multiple-choice",
    prompt: "Lorem ipsum dolor — which statement is most accurate?",
    options: [
      { id: "a", label: "Sed ut perspiciatis unde omnis" },
      { id: "b", label: "Iste natus error sit voluptatem" },
      { id: "c", label: "Accusantium doloremque laudantium" },
      { id: "d", label: "Totam rem aperiam eaque ipsa" },
    ],
    correctOptionIds: ["a"],
    explanation: "Placeholder explanation: sed ut perspiciatis is correct.",
  },
  {
    id: "ex-uc-2",
    type: "understanding-check",
    prompt:
      "Summarize the key trade-off discussed above in two sentences, then check the sample answer.",
    sampleAnswer:
      "Sample answer (placeholder): nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
  },
  {
    id: "ex-sa-1",
    type: "short-answer",
    prompt: "Briefly answer: lorem ipsum dolor sit amet consectetur?",
    format: "free-form",
    minWords: 30,
    maxWords: 150,
  },
];
