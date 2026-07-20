import type { ReactNode } from "react";
import {
  getRelatedTermNames,
  resolveGlossaryTerm,
} from "@/lib/content/glossary";
import { MathText } from "@/components/exercises/math-text";
import { GlossaryTermTrigger } from "@/components/glossary/term-trigger";

/**
 * Inline glossary term for lesson MDX: `<Term>example term</Term>` resolves
 * by its text (display name or alias, case-insensitive);
 * `<Term id="another-term">the prose form</Term>` pins the entry when the
 * prose differs; `<Term id="example-term" />` renders the entry's display
 * name. Renders a dotted-underline trigger with the shared glossary hover
 * card (hover-intent on desktop, tap on touch). The definition is looked up
 * and math-rendered server-side — only finished nodes reach the client.
 *
 * An unresolvable ref renders its text unstyled (plus a dev-only inline
 * marker); the glossary test fails CI naming the lesson file.
 */
export function Term({ id, children }: { id?: string; children?: ReactNode }) {
  const ref = id ?? (typeof children === "string" ? children : undefined);
  const entry = ref ? resolveGlossaryTerm(ref) : undefined;

  if (!entry) {
    return (
      <>
        {children}
        {process.env.NODE_ENV !== "production" && (
          <span className="text-destructive align-super text-xs">
            {" "}
            [unknown term{ref ? `: ${ref}` : ""}]
          </span>
        )}
      </>
    );
  }

  return (
    <GlossaryTermTrigger
      card={{
        term: entry.term,
        definition: <MathText text={entry.definition} />,
        related: getRelatedTermNames(entry),
        source: entry.source,
      }}
    >
      {children ?? entry.term}
    </GlossaryTermTrigger>
  );
}
