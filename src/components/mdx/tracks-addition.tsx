import type { ReactNode } from "react";

export interface TracksAdditionProps {
  /** Short label shown above the content, e.g. "Interactive exercise". */
  label?: string;
  children: ReactNode;
}

/**
 * Brackets content Tracks added on top of a verbatim source reproduction
 * (interactive exercises, demos, editorial asides) so it's never mistaken
 * for the original author's text. Children keep normal prose styling —
 * only the label resets it, so mixed paragraphs/code/exercises inside
 * still get their usual spacing.
 */
export function TracksAddition({ label = "Tracks addition", children }: TracksAdditionProps) {
  return (
    <div className="border-border bg-muted/50 my-8 rounded-r-lg border-l-4 py-4 pr-4 pl-5">
      <p className="text-muted-foreground not-prose mb-3 text-xs font-semibold tracking-wide uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}
