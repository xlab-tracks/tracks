export interface PaperTextProps {
  children: React.ReactNode;
  /** Optional label override; defaults to "from the paper". */
  label?: string;
}

/**
 * Verbatim excerpt from the paper a lesson discusses. Renders as normal
 * prose — same typography as the surrounding text — with a thin left rule
 * and a tiny label as the only provenance markers, so excerpts can be woven
 * into the lesson without quote styling or introductory framing.
 */
export function PaperText({ children, label = "from the paper" }: PaperTextProps) {
  return (
    <figure className="border-border my-6 ml-0 border-l-2 pl-4">
      <figcaption className="text-muted-foreground mb-2 text-[10px] font-medium tracking-widest uppercase select-none">
        {label}
      </figcaption>
      {children}
    </figure>
  );
}
