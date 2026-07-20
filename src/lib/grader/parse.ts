// Extracts the machine-usable pieces from the grader's report: the total /45
// and band label (parseVerdict), and the per-criterion entries from the
// <analysis> block (parseGraderReport) — that block is never shown raw to
// the learner; the UI renders it as a rubric table. The raw report persists
// unmodified on Submission.feedback; parsing happens at read time, so old
// stored reports without an <analysis> block degrade to criteria: [] with
// the whole report visible. Parsing is deliberately drift-tolerant (bolded
// field labels, duplicate or unclosed <analysis> blocks, "Not applicable")
// and fails open: when nothing recognizable parses, the learner sees the
// full report rather than losing feedback.

export interface ParsedVerdict {
  /** Total score out of 45 (may be fractional after N/A rescaling). */
  score: number;
  /** Band label from the verdict line, e.g. "Strong" — may be empty. */
  band: string;
}

const VERDICT_RE = /(\d+(?:\.\d+)?)\s*\/\s*45\s*(?:—|–|-)?\s*([^.\n]*)/u;

// Tolerates "## Verdict", "### Verdict", "**Verdict**", "Verdict:".
const VERDICT_HEADING_RE = /(?:^|\n)\s*(?:#{1,4}\s*|\*\*\s*)?Verdict\b/iu;

export function parseVerdict(markdown: string): ParsedVerdict | null {
  // Prefer the text after the last Verdict heading. With no usable heading,
  // fall back to the LAST "/45" in the report, not the first: the verdict is
  // the final section, and earlier "/45"s occur legitimately in the analysis
  // (the rescaling rule) and in fix text ("would take you from 9/45 to…").
  const sections = markdown.split(VERDICT_HEADING_RE);
  const tail = sections.length > 1 ? sections[sections.length - 1] : null;
  let match: RegExpMatchArray | null = tail?.match(VERDICT_RE) ?? null;
  if (!match) {
    const all = [...markdown.matchAll(new RegExp(VERDICT_RE.source, "gu"))];
    match = all.length > 0 ? all[all.length - 1] : null;
  }
  if (!match) return null;
  const score = Number(match[1]);
  if (!Number.isFinite(score) || score < 0 || score > 45) return null;
  return { score, band: (match[2] ?? "").trim() };
}

export interface CriterionResult {
  /** "C1" … "C7". */
  id: string;
  /** 0–3, or null when the grader scored the criterion N/A. */
  score: number | null;
  /** Verbatim excerpt line, or null when absent / "none found". */
  evidence: string | null;
  rationale: string;
}

export interface ParsedGraderReport {
  /** Per-criterion entries from the <analysis> block(s), in rubric order. */
  criteria: CriterionResult[];
  /** The report with the <analysis> block removed — safe to show as-is. */
  visibleMarkdown: string;
}

interface BlockRange {
  start: number;
  end: number;
  inner: string;
}

// Every <analysis> block in the report. A block normally ends at
// </analysis>; an unclosed one (the model forgot the tag but kept writing
// sections) ends at the next top-level "## " heading, or end of input.
function analysisBlocks(markdown: string): BlockRange[] {
  const blocks: BlockRange[] = [];
  const openRe = /<analysis>/giu;
  let open: RegExpExecArray | null;
  while ((open = openRe.exec(markdown)) !== null) {
    const innerStart = open.index + open[0].length;
    const closeIdx = markdown.toLowerCase().indexOf("</analysis>", innerStart);
    let end: number;
    let inner: string;
    if (closeIdx !== -1) {
      end = closeIdx + "</analysis>".length;
      inner = markdown.slice(innerStart, closeIdx);
    } else {
      const heading = markdown.slice(innerStart).match(/\n(?=##\s)/u);
      end = heading ? innerStart + heading.index! + 1 : markdown.length;
      inner = markdown.slice(innerStart, end);
    }
    blocks.push({ start: open.index, end, inner });
    openRe.lastIndex = end;
  }
  return blocks;
}

// A field runs from its label to the next field label or the end of the
// criterion block; Rationale may span multiple lines. Labels tolerate
// case drift and "**bold**" wrappers. The end-of-block alternative is
// (?![\s\S]) — true end of input — because with the m flag a plain $
// matches every line end and would truncate multi-line fields.
function fieldValue(block: string, field: string): string | null {
  const re = new RegExp(
    `^\\*{0,2}${field}\\*{0,2}\\s*:[ \\t]*([\\s\\S]*?)` +
      `(?=^\\*{0,2}(?:Score|Evidence|Rationale)\\*{0,2}\\s*:|(?![\\s\\S]))`,
    "miu",
  );
  const match = block.match(re);
  const value = match?.[1]?.trim();
  return value ? value : null;
}

/**
 * Splits a grader report into the learner-visible markdown and the parsed
 * per-criterion results. Fails open on grader drift: with no <analysis>
 * block, or one whose entries don't parse at all, the report is returned
 * untouched (criteria: []) so the UI shows the full markdown — feedback is
 * never silently discarded (also the path for reports stored before this
 * format existed).
 */
export function parseGraderReport(markdown: string): ParsedGraderReport {
  const blocks = analysisBlocks(markdown);
  if (blocks.length === 0) return { criteria: [], visibleMarkdown: markdown };

  const seen = new Set<string>();
  const criteria: CriterionResult[] = [];
  for (const block of blocks) {
    for (const chunk of block.inner.split(/^#{2,4}\s+/mu).slice(1)) {
      const id = chunk.match(/^\*{0,2}(C[1-7])\b/u)?.[1];
      if (!id || seen.has(id)) continue;
      const scoreRaw = fieldValue(chunk, "Score")?.replace(/^[*_`\s]+/u, "");
      const rationale = fieldValue(chunk, "Rationale");
      // A chunk with neither a recognizable score nor N/A is grader drift —
      // skip it rather than render a bogus row.
      const scoreMatch = scoreRaw?.match(/^([0-3])\b/u);
      const isNa =
        scoreRaw != null && /^(?:n\/?a|not applicable)\b/iu.test(scoreRaw);
      if (!scoreMatch && !isNa) continue;
      const evidenceRaw = fieldValue(chunk, "Evidence");
      seen.add(id);
      criteria.push({
        id,
        score: scoreMatch ? Number(scoreMatch[1]) : null,
        evidence:
          evidenceRaw && !/^none found\b/iu.test(evidenceRaw)
            ? evidenceRaw
            : null,
        rationale: rationale ?? "",
      });
    }
  }

  // Nothing parseable inside the tag(s): keep the whole report visible
  // rather than stripping the only copy of the per-criterion feedback.
  if (criteria.length === 0) return { criteria: [], visibleMarkdown: markdown };

  criteria.sort((a, b) => a.id.localeCompare(b.id));

  let visibleMarkdown = markdown;
  for (const block of [...blocks].reverse()) {
    visibleMarkdown =
      visibleMarkdown.slice(0, block.start) + visibleMarkdown.slice(block.end);
  }
  visibleMarkdown = visibleMarkdown.replace(/\n{3,}/gu, "\n\n").trim();
  return { criteria, visibleMarkdown };
}
