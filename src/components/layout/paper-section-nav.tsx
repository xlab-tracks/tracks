"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, PencilLine, Play } from "lucide-react";
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
 * The in-paper section tree, docked as the "In this paper" panel at the
 * bottom of the sidebar: anchor links for every section (and inserted
 * activity), with the current section highlighted by scroll position.
 * Rendered as a flex child of the panel — it takes the panel's remaining
 * height and scrolls internally.
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
  const listRef = useRef<HTMLUListElement>(null);

  // Follow the reader: long papers cap this pane's height (it scrolls on its
  // own), so keep the active row centered inside it. Scroll the pane's
  // scrollTop directly — scrollIntoView could also scroll the document and
  // fight the user's reading position.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !activeId) return;
    const row = list.querySelector<HTMLElement>(
      `[data-spy-anchor="${CSS.escape(activeId)}"]`,
    );
    if (!row) return;
    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top < listRect.top || rowRect.bottom > listRect.bottom) {
      list.scrollTop +=
        rowRect.top - listRect.top - list.clientHeight / 2 + row.clientHeight / 2;
    }
  }, [activeId]);

  return (
    <ul
      ref={listRef}
      className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 pb-3"
    >
      {items.map((item) => {
        const anchor = anchorOf(item);
        return (
          <li key={anchor} data-spy-anchor={anchor}>
            <Link
              href={`${pathname}#${anchor}`}
              onClick={onNavigate}
              aria-current={anchor === activeId ? "location" : undefined}
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
              ) : item.kind === "inserted-demo" ? (
                <>
                  <Play className="mt-0.5 size-3.5 shrink-0" aria-hidden />
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
