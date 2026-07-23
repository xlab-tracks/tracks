import glossaryData from "@/content/glossary.json";

// The glossary is a hand-authored JSON registry (src/content/glossary.json) —
// the single source behind <Term/> in lesson MDX and `gloss` paper edits.
// Definitions are curriculum copy: human-authored (or lorem placeholders),
// never generated. Validated by src/lib/content/glossary.test.ts.

export interface GlossaryTermSource {
  label: string;
  url?: string;
}

export interface GlossaryTerm {
  /** Stable kebab-case id — referenced by <Term id/> and paper gloss edits. */
  id: string;
  /** Display name, shown as the card title. */
  term: string;
  /** Definition copy; supports `$…$` math (rendered via MathText). */
  definition: string;
  /** Alternate surface forms that resolve to this entry (case-insensitive). */
  aliases?: string[];
  /** Ids of related entries, shown as a "Related" line on the card. */
  seeAlso?: string[];
  /** Optional attribution rendered as the card's footer line. */
  source?: GlossaryTermSource;
  /**
   * Opt this entry into lesson auto-glossing: the rehype-auto-gloss plugin
   * wraps the first running-text occurrence of the term (or an alias) per
   * lesson in `<Term/>`. Reserve for unambiguous jargon — common words stay
   * manual-`<Term>`-only. Lessons opt out via the registry's top-level
   * `autoGlossExclude` list (verbatim-reproduced lessons).
   */
  autoGloss?: boolean;
}

export const glossaryTerms: GlossaryTerm[] = glossaryData.terms;

const byId = new Map(glossaryTerms.map((t) => [t.id, t]));
const bySurface = new Map<string, GlossaryTerm>();
for (const term of glossaryTerms) {
  for (const surface of [term.term, ...(term.aliases ?? [])]) {
    bySurface.set(normalizeSurface(surface), term);
  }
}

function normalizeSurface(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  return byId.get(id);
}

/** Resolve by id first, then by display name or alias (case-insensitive). */
export function resolveGlossaryTerm(ref: string): GlossaryTerm | undefined {
  return byId.get(ref) ?? bySurface.get(normalizeSurface(ref));
}

/**
 * Display names for a term's seeAlso ids. Unknown ids are dropped here —
 * the glossary test rejects them before they can ship.
 */
export function getRelatedTermNames(term: GlossaryTerm): string[] {
  return (term.seeAlso ?? []).flatMap((id) => {
    const related = byId.get(id);
    return related ? [related.term] : [];
  });
}
