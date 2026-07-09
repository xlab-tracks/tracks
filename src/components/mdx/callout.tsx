import type { ReactNode } from "react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutVariant = "note" | "tip" | "warning";

const VARIANTS: Record<
  CalloutVariant,
  { icon: typeof Info; className: string; iconClassName: string }
> = {
  note: {
    icon: Info,
    className: "border-border bg-muted/50",
    iconClassName: "text-muted-foreground",
  },
  tip: {
    icon: Lightbulb,
    className: "border-border bg-secondary/60",
    iconClassName: "text-foreground",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-amber-500/40 bg-amber-500/10",
    iconClassName: "text-amber-600",
  },
};

export interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

export function Callout({ variant = "note", title, children }: CalloutProps) {
  const { icon: Icon, className, iconClassName } = VARIANTS[variant];
  return (
    <div
      className={cn(
        "not-prose my-6 flex gap-3 rounded-xl border p-4 text-sm leading-relaxed",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconClassName)} aria-hidden />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-foreground/80 [&>p]:m-0">{children}</div>
      </div>
    </div>
  );
}
