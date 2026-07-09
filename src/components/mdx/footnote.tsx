import type { ReactNode } from "react";

/**
 * Inline footnote. Numbers itself via a CSS counter scoped to `.lesson-body`
 * (see globals.css), so no id/registration is needed per instance. On wide
 * viewports the note renders as a sidenote floated into the right margin,
 * aligned to its reference (LessWrong/Alignment Forum style); on narrower
 * viewports the marker is a checkbox/label toggle that expands the note
 * inline. Pure CSS — no client JS required.
 */
export function Footnote({ children }: { children: ReactNode }) {
  return (
    <span className="footnote not-prose">
      <label className="footnote-marker" aria-label="Footnote">
        <input type="checkbox" className="footnote-toggle" />
        <span className="footnote-content">{children}</span>
      </label>
    </span>
  );
}
