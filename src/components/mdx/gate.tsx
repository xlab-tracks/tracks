export interface GateProps {
  /** Exercise id whose submission unlocks the content below this marker. */
  by: string;
}

/**
 * Placeholder for the planned hard-gate marker: content below a <Gate by=…/>
 * will be withheld until the named exercise is submitted. Enforcement isn't
 * implemented yet — for now it renders a visible divider so gated drafts can
 * be previewed as authored.
 */
export function Gate({ by }: GateProps) {
  return (
    <div
      className="not-prose border-border text-muted-foreground my-8 flex items-center gap-3 text-xs tracking-wide uppercase"
      aria-hidden
    >
      <span className="border-border flex-1 border-t border-dashed" />
      gate: {by} (not enforced yet)
      <span className="border-border flex-1 border-t border-dashed" />
    </div>
  );
}
