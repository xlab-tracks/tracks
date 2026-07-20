// The reasoning-transparency rubric as data — single source of truth for the
// grader prompts (src/lib/grader/prompts.ts builds its criterion blocks from
// this) and for the UI's rubric table tooltips. All strings are the author's
// rubric text (vault note "Reasoning transparency rubric"), reproduced
// verbatim; `label` is the title re-cased for display only. Client-safe:
// no server deps.

export interface RubricCriterionInfo {
  id: "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7";
  /** ALL-CAPS title as it appears in the prompt. */
  title: string;
  /** Sentence-case display label (same words as `title`). */
  label: string;
  weight: 1 | 3;
  /** The criterion's guiding question; C5–C7 have none (anchors only). */
  question: string | null;
  /** Score anchors for 0, 1, 2, 3. */
  anchors: [string, string, string, string];
  /** Trailing rule line (ANTI-GAMING RULE / SIGNATURE TEST), if any. */
  extra?: string;
}

export const RUBRIC_CRITERIA: RubricCriterionInfo[] = [
  {
    id: "C1",
    title: "NAVIGABLE SUMMARY OF KEY TAKEAWAYS",
    label: "Navigable summary of key takeaways",
    weight: 3,
    question:
      "Does the piece open with a summary of its main conclusions, each linked or clearly pointed to the section that argues for it?",
    anchors: [
      "No summary; conclusions emerge only at the end or must be reconstructed.",
      "Summary exists but is vague, buried, or disconnected from the body; takeaways in the summary don't match the sections.",
      "Clear upfront summary of the actual conclusions; reader can jump to the elaboration of any takeaway.",
      "Summary states takeaways WITH confidence levels and the main consideration behind each; a reader could stop after the summary and be correctly (if shallowly) informed.",
    ],
  },
  {
    id: "C2",
    title: "PRIORITIZATION OF CONSIDERATIONS",
    label: "Prioritization of considerations",
    weight: 3,
    question:
      "Does the author say which arguments or evidence are doing the most work — early, and per-takeaway?",
    anchors: [
      "Evidence presented as an undifferentiated pile; reader can't tell what's load-bearing.",
      "Prioritization only implicit (inferable from ordering or space allocation, never stated).",
      "Explicitly identifies the most critical considerations for its key takeaways, early in the document or in each section.",
      "Additionally explains how diverse evidence was integrated (which kinds of evidence play which roles) and what would change the author's mind.",
    ],
  },
  {
    id: "C3",
    title: "CONFIDENCE CALIBRATION ON MAJOR CLAIMS",
    label: "Confidence calibration on major claims",
    weight: 3,
    question:
      "Are degrees of confidence expressed, with precision scaled to how load-bearing each claim is?",
    anchors: [
      "Uniform assertive prose; no distinction between near-certain and speculative claims.",
      'Decorative hedges ("may," "perhaps") that carry no information, or one blanket disclaimer covering everything.',
      'Major claims carry graded confidence language ("plausible," "likely," "very likely") used consistently; peripheral claims hedged proportionately less formally.',
      'Load-bearing claims get explicit probabilities or confidence intervals; meta-uncertainty flagged where relevant ("this estimate is unstable"); colloquial claims made precise in footnotes where it matters.',
    ],
    extra:
      "ANTI-GAMING RULE: numbers must come with their basis. Unexplained probabilities that merely perform rigor cap C3 at 2.",
  },
  {
    id: "C4",
    title: "IDENTIFICATION OF KIND OF SUPPORT",
    label: "Identification of kind of support",
    weight: 3,
    question:
      "For each substantive claim, can the reader tell what kind of backing it has — careful study review, skim, expert hearsay, intuition, unverified secondhand claim?",
    anchors: [
      "Claims unsupported, or uniformly cited in a way that launders weak support into apparent authority (bare citations to whole books/papers).",
      "Sources for some claims, but no differentiation between strong and weak support.",
      'Kinds of support signaled and honestly differentiated ("widely believed and seems likely," "supposedly — I haven\'t checked," "my guess, could be off by an order of magnitude"). Intuitions labeled as intuitions; assumptions as assumptions.',
      "Additionally, support for the KEY claims is explained in detail, and claims the author can't justify publicly are explicitly flagged rather than quietly asserted.",
    ],
    extra:
      'SIGNATURE TEST: does the piece contain at least one sentence a journal would never print but a truth-seeking reader loves ("Supposedly (I haven\'t checked)...", "these numbers are pulled from vague memories of conversations")? Presence is strong evidence for 2+.',
  },
  {
    id: "C5",
    title: "RESEARCH PROCESS DISCLOSURE",
    label: "Research process disclosure",
    weight: 1,
    question: null,
    anchors: [
      "No indication of how the analysis was produced.",
      'Generic gesture ("I reviewed the literature").',
      "Concrete process summary including shortcuts and time spent.",
      "Detailed enough to reveal likely blind spots — search strategy, selection criteria, what was skimmed vs. read, what wasn't checked.",
    ],
  },
  {
    id: "C6",
    title: "PRIOR AND BIAS DISCLOSURE",
    label: "Prior and bias disclosure",
    weight: 1,
    question: null,
    anchors: [
      "Conclusions presented as if reached neutrally when they weren't; relevant conflicts unmentioned.",
      "Boilerplate disclaimer only.",
      "States relevant priors, incentives, or conflicts.",
      "States priors AND tells the reader how to discount for them.",
    ],
  },
  {
    id: "C7",
    title: "VERIFIABILITY APPARATUS",
    label: "Verifiability apparatus",
    weight: 1,
    question: null,
    anchors: [
      "Claims not checkable without redoing the research.",
      "Citations point to whole works; data/calculations withheld.",
      "Pinpoint citations or direct quotes for important claims; underlying data or calculations available where they exist.",
      "Chain verifiable end-to-end: quotes, page numbers, shared data/code, archived sources, conversation summaries — or an explicit statement of why one of these isn't possible.",
    ],
  },
];

export function getRubricCriterion(
  id: string,
): RubricCriterionInfo | undefined {
  return RUBRIC_CRITERIA.find((c) => c.id === id);
}
