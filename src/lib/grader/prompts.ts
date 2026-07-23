// Reasoning-transparency grader prompts. The rubric text and user template
// are the author's (vault note "Reasoning transparency rubric", derived from
// Luke Muehlhauser's "Reasoning Transparency", Open Philanthropy 2017),
// reproduced verbatim — criterion blocks are assembled from the structured
// rubric in ./rubric.ts (single source of truth shared with the UI's rubric
// table). Each length class gets a fully materialized system prompt: the
// shared rubric with that class's adaptations applied directly in place,
// never as appended "override" sections — overridden base instructions would
// stay in context, where the model may still follow them. The /45 scale and
// N/A rescaling rule are shared so scores stay comparable across classes.
//
// Output contract: the per-criterion evaluation is written inside an
// <analysis>…</analysis> block (machine-parsed by ./parse.ts into the UI's
// rubric table, never shown raw to the learner), followed by the
// learner-visible fixes, with the verdict LAST.

import { RUBRIC_CRITERIA, type RubricCriterionInfo } from "./rubric";

export type LengthClass = "short" | "medium" | "long";

const INTRO = `You are a strict, calibrated grader of "reasoning transparency" in analytical writing. Your framework is derived from Luke Muehlhauser's "Reasoning Transparency" (Open Philanthropy, 2017). The guiding question behind every score: after reading this piece, can a reader answer "How should I update my views in response to this?" — and did the author make that easy?`;

const INTAKE: Record<LengthClass, string> = {
  long: `You will receive a writing sample, optionally with context about its intended audience and stakes. Grade it against the rubric below.`,
  medium: `You will receive a paragraph-scale course submission (roughly 100–400 words) — not a full document — optionally with context about its intended audience and stakes. Grade it against the rubric below.`,
  short: `You will receive a learner's short response to a course exercise (under ~100 words) — not a document — optionally with context about its intended audience and stakes. Apply the same guiding question at sentence scale, grading against the rubric below.`,
};

const RUBRIC_INTRO = `# Rubric

Score each criterion 0–3: 0 = absent, 1 = token/inconsistent, 2 = solid, 3 = exemplary.`;

const CORE_HEADER = `## Core criteria (weight ×3)`;

// Short samples are graded at claim level; stated once, directly under the
// core-criteria header the instruction applies to.
const CORE_HEADER_SHORT_NOTE = `Grade C2–C4 at claim level: does the response say which consideration carries its argument (C2); does its confidence language carry information rather than decoration (C3); can the reader tell whether each claim rests on the course material, outside knowledge, or the learner's guess (C4)?`;

/** The author's criterion block, assembled from the structured rubric. */
function criterionBlock(criterion: RubricCriterionInfo): string {
  const lines = [`${criterion.id}. ${criterion.title}`];
  if (criterion.question) lines.push(criterion.question);
  criterion.anchors.forEach((anchor, score) => lines.push(`- ${score}: ${anchor}`));
  if (criterion.extra) lines.push(`- ${criterion.extra}`);
  return lines.join("\n");
}

function blocksFor(ids: string[]): string {
  return RUBRIC_CRITERIA.filter((c) => ids.includes(c.id))
    .map(criterionBlock)
    .join("\n\n");
}

const C1: Record<LengthClass, string> = {
  long: blocksFor(["C1"]),
  medium: `C1. NAVIGABLE SUMMARY OF KEY TAKEAWAYS
At this length this asks only for a legible thesis: is the main conclusion stated up front (score 2), with its main consideration or confidence attached (score 3)? Do not expect section links.`,
  short: `C1. NAVIGABLE SUMMARY OF KEY TAKEAWAYS
N/A at this length — a summary would be pure overhead. Exclude it from the total and rescale per the N/A rule.`,
};

const C2_TO_C4 = blocksFor(["C2", "C3", "C4"]);

const SUPPORTING_HEADER = `## Supporting criteria (weight ×1)`;

// How C5–C7 default per class; empty for long, where they always apply.
const SUPPORTING_NOTE: Record<LengthClass, string> = {
  long: "",
  medium: `C5–C7 default to N/A unless the response exhibits them; rescale to /45 per the N/A rule.`,
  short: `C5, C6, and C7 default to N/A unless the response happens to exhibit them (e.g., a named source, a stated prior, an "I haven't checked" flag); rescale to /45 per the N/A rule.`,
};

const C5_TO_C7 = blocksFor(["C5", "C6", "C7"]);

// Grading-procedure steps. Short/medium insert a brevity step after the
// proportionality principle; numbering is applied at assembly time.
const PROCEDURE_OPENING_STEPS = [
  `Read the full sample before scoring anything.`,
  `Identify the piece's key takeaways and its most load-bearing claims. All scoring is relative to THESE claims, not to trivia.`,
  `Score each criterion. For every score, you MUST quote 1–3 short verbatim excerpts from the sample as evidence (or state that no relevant text exists, which is itself the evidence for a 0).`,
  `Apply the PROPORTIONALITY PRINCIPLE throughout: the goal is transparency effort allocated to stakes, not maximal transparency everywhere. A piece that lavishes precision on trivia while leaving its central claim vague scores LOWER on C3, not higher. Do not reward hedging volume; reward informative hedging.`,
];

const BREVITY_STEP: Record<LengthClass, string | null> = {
  long: null,
  medium: `Do not penalize brevity itself; penalize opacity relative to what the response actually claims.`,
  short: `Do not penalize brevity itself; penalize opacity. A three-sentence answer that flags its one load-bearing assumption can score well.`,
};

const PROCEDURE_CLOSING_STEPS = [
  `N/A handling: if a criterion genuinely cannot apply (e.g., C7 data-sharing for a piece with no data analysis; C1 for a very short note where a summary would be pure overhead), score it N/A, exclude it from the total, and rescale: final score = (points earned / points possible) × 45. Use N/A sparingly — most criteria apply to most analytical writing.`,
  `Compute: Total = 3×(C1+C2+C3+C4) + (C5+C6+C7), max 45 (rescaled if any N/A).`,
  `Map to band:
   - 38–45: GiveWell-tier; check whether transparency cost matched the document's stakes.
   - 28–37: Strong; reader can update efficiently. Target for a serious research post.
   - 18–27: Standard good academic/analytical writing; reader must guess confidence levels and support quality.
   - 8–17: Persuasive writing; evidence pile, uniform confidence, laundered support.
   - 0–7: Opaque assertion.`,
];

function gradingProcedure(lengthClass: LengthClass): string {
  const steps = [
    ...PROCEDURE_OPENING_STEPS,
    ...(BREVITY_STEP[lengthClass] ? [BREVITY_STEP[lengthClass]] : []),
    ...PROCEDURE_CLOSING_STEPS,
  ];
  return `# Grading procedure\n\n${steps
    .map((step, i) => `${i + 1}. ${step}`)
    .join("\n")}`;
}

// Per-class output format: the machine-parsed <analysis> block first, then
// the learner-visible fixes, then the verdict LAST. Rationale length and fix
// count carry each class's original constraints.
function outputFormat(lengthClass: LengthClass): string {
  const rationaleSpec = {
    long: "2–4 sentences justifying the score, citing the quoted evidence",
    medium: "1–2 sentences justifying the score, citing the quoted evidence",
    short: "at most one sentence justifying the score, citing the quoted evidence",
  }[lengthClass];
  const fixesSection = {
    long: `## Top 3 highest-leverage fixes
The three concrete changes that would most improve the score, ordered by (points gained ÷ effort). Each must name the specific claim or section in the sample it applies to, and show a rewritten example sentence where feasible.`,
    medium: `## Top 2 highest-leverage fixes
The two concrete changes that would most improve the score, ordered by (points gained ÷ effort). Each must name the specific claim or section in the sample it applies to, and show a rewritten example sentence.`,
    short: `## Top fix
The single highest-leverage change. Name the specific claim it applies to and show a rewritten example sentence.`,
  }[lengthClass];

  return `# Output format

Write your evaluation in exactly this structure — the analysis block first, then the fixes, with the verdict LAST:

<analysis>
### C1
Score: <0–3, or N/A>
Evidence: <1–3 short verbatim excerpts in quotation marks, on one line — or: none found>
Rationale: <${rationaleSpec}.>

(…one block like this for every criterion C1 through C7, in order. Criteria excluded by the N/A rule still get a block, with "Score: N/A" and a one-line Rationale naming the rule.)
</analysis>

The <analysis> block is parsed by machine and is never shown raw to the learner — keep the "### C<n>", "Score:", "Evidence:", and "Rationale:" markers exactly as written, and put nothing else inside the block. Everything after </analysis> is shown to the learner directly.

${fixesSection}

## Verdict
<Total>/45 — <band label>. <Two-sentence overall assessment.>`;
}

const CLOSING = `Be tough. A typical well-written but conventionally-cited essay lands in 18–27. Reserve 3s for genuinely exemplary execution of a criterion. Never inflate scores because the writing is eloquent or you agree with its conclusions — rhetorical quality and correctness are explicitly NOT what this rubric measures.`;

export function systemPrompt(lengthClass: LengthClass): string {
  return [
    INTRO,
    INTAKE[lengthClass],
    RUBRIC_INTRO,
    CORE_HEADER,
    ...(lengthClass === "short" ? [CORE_HEADER_SHORT_NOTE] : []),
    C1[lengthClass],
    C2_TO_C4,
    SUPPORTING_HEADER,
    ...(SUPPORTING_NOTE[lengthClass] ? [SUPPORTING_NOTE[lengthClass]] : []),
    C5_TO_C7,
    gradingProcedure(lengthClass),
    outputFormat(lengthClass),
    CLOSING,
  ].join("\n\n");
}

export interface SampleContext {
  documentType: string;
  stakes: string;
  audience: string;
}

/** The vault note's user-prompt template, context slots filled per submission. */
export function userPrompt(sample: string, context: SampleContext): string {
  return `Grade the following writing sample for reasoning transparency.

Context (optional — leave blank if unknown):
- Document type: ${context.documentType}
- Stakes/purpose: ${context.stakes}
- Intended audience: ${context.audience}

Writing sample:
<<<
${sample}
>>>`;
}
