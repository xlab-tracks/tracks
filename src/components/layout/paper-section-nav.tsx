"use client";

import Link from "next/link";
import { CheckCircle2, Circle, PencilLine } from "lucide-react";
import type { PaperNavItem } from "@/lib/papers/paper-nav";
import { cn } from "@/lib/utils";
import { useScrollSpy } from "./use-scroll-spy";

/** Row styling shared with the module items in TrackSidebar. */
export function navItemClass(active: boolean) {
  return cn(
    "flex items-start gap-2 rounded-md border-l-2 px-2 py-1.5 text-sm transition-colors",
    active
      ? "border-destructive bg-destructive/5 text-foreground font-medium"
      : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
  );
}

function anchorOf(item: PaperNavItem): string {
  return item.kind === "section" ? item.id : item.anchorId;
}

/**
 * The in-paper section tree nested under the active paper's sidebar row:
 * anchor links for every section (and inserted activity), with the current
 * section highlighted by scroll position.
 */
export function PaperSectionNav({
  items,
  pathname,
  completedContentIds,
  onNavigate,
}: {
  items: PaperNavItem[];
  pathname: string;
  completedContentIds: Set<string>;
  onNavigate?: () => void;
}) {
  const activeId = useScrollSpy(items.map(anchorOf));

  return (
    <ul className="border-border/70 mt-0.5 mb-1 ml-4 space-y-0.5 border-l pl-1.5">
      {items.map((item) => {
        const anchor = anchorOf(item);
        return (
          <li key={anchor}>
            <Link
              href={`${pathname}#${anchor}`}
              onClick={onNavigate}
              className={cn(
                navItemClass(anchor === activeId),
                "py-1 text-[13px] leading-snug",
              )}
              style={{ paddingLeft: `${8 + (item.level - 2) * 12}px` }}
            >
              {item.kind === "section" ? (
                <>
                  {item.number && (
                    <span className="text-muted-foreground mt-px shrink-0 font-mono text-[11px]">
                      {item.number}
                    </span>
                  )}
                  <span className="line-clamp-2">{item.title}</span>
                </>
              ) : item.kind === "inserted-lesson" ? (
                <>
                  {completedContentIds.has(item.lessonId) ? (
                    <CheckCircle2
                      className="text-foreground mt-0.5 size-3.5 shrink-0"
                      aria-hidden
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 size-3.5 shrink-0 opacity-30"
                      aria-hidden
                    />
                  )}
                  <span className="line-clamp-2">{item.title}</span>
                </>
              ) : (
                <>
                  <PencilLine className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-2">{item.title}</span>
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
