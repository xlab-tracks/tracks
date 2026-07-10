"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CheckCircle2, Circle, FileText, ListTree, Lock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ModuleItem, TrackOutline } from "@/lib/content";
import type { PaperNavItem } from "@/lib/papers/paper-nav";
import { cn } from "@/lib/utils";
import { navItemClass, PaperSectionNav } from "./paper-section-nav";

export interface TrackSidebarProps {
  outline: TrackOutline;
  /** Content IDs the current user has completed — lessons, papers, and papers' inserted lessons (drives checkmarks). */
  completedContentIds?: string[];
  /** Module slugs gated by unmet prerequisites (drives lock icons). */
  lockedModuleSlugs?: string[];
  /** Per-paper section navigation (keyed by paper id), docked below the module nav on paper pages. */
  paperNavs?: Record<string, PaperNavItem[]>;
}

/**
 * The paper or reader the current page shows, with its section nav — drives the
 * docked section panel (the same UI for both; only the label differs). Resolved
 * from props (the outline carries the full objects), never from content
 * accessors: this is a client component.
 */
function activeSectionNavOf(
  { outline, paperNavs = {} }: TrackSidebarProps,
  pathname: string,
): { nav: PaperNavItem[]; label: string } | null {
  const base = `/tracks/${outline.track.slug}`;
  for (const { module, items } of outline.modules) {
    for (const item of items) {
      if (item.kind === "lesson") continue;
      const id = item.kind === "paper" ? item.paper.id : item.reader.id;
      const slug = item.kind === "paper" ? item.paper.slug : item.reader.slug;
      if (pathname !== `${base}/${module.slug}/${slug}`) continue;
      const nav = paperNavs[id];
      if (!nav || nav.length === 0) return null;
      return { nav, label: item.kind === "paper" ? "In this paper" : "In this reader" };
    }
  }
  return null;
}

function SidebarNav({
  outline,
  completedContentIds = [],
  lockedModuleSlugs = [],
  paperNavs = {},
  onNavigate,
}: TrackSidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const base = `/tracks/${outline.track.slug}`;
  const segments = pathname.split("/").filter(Boolean);
  const activeModuleSlug = segments[2];
  const completed = new Set(completedContentIds);
  const locked = new Set(lockedModuleSlugs);
  const activeSectionNav = activeSectionNavOf(
    { outline, completedContentIds, lockedModuleSlugs, paperNavs },
    pathname,
  );

  const [open, setOpen] = useState<string[]>(() =>
    activeModuleSlug
      ? [activeModuleSlug]
      : outline.modules[0]
        ? [outline.modules[0].module.slug]
        : [],
  );
  useEffect(() => {
    if (activeModuleSlug) {
      setOpen((prev) =>
        prev.includes(activeModuleSlug) ? prev : [...prev, activeModuleSlug],
      );
    }
  }, [activeModuleSlug]);

  return (
    <div className="flex h-full flex-col">
      {/* Module navigation — scrolls on its own so the paper panel below
          keeps its share of the viewport regardless of how long this gets. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-3 py-4">
          <p className="text-muted-foreground px-2 text-xs font-medium tracking-wide uppercase">
            {outline.track.shortTitle ?? "Track"}
          </p>
          <Link
            href={base}
            onClick={onNavigate}
            className={cn(
              "hover:bg-muted mt-1 block rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors",
              pathname === base && "bg-muted",
            )}
          >
            {outline.track.title}
          </Link>
        </div>
        <Accordion
          type="multiple"
          value={open}
          onValueChange={setOpen}
          className="px-2 pb-10"
        >
          {outline.modules.map(({ module, items }) => {
            const isLocked = locked.has(module.slug);
            const assessmentHref = `${base}/${module.slug}/assessment`;
            return (
              <AccordionItem key={module.id} value={module.slug} className="border-none">
                <AccordionTrigger className="hover:bg-muted [&[data-state=open]]:bg-muted/50 rounded-lg px-2 py-2 text-sm hover:no-underline">
                  <span className="flex items-center gap-2 text-left">
                    {isLocked && (
                      <Lock
                        className="text-muted-foreground size-3.5 shrink-0"
                        aria-hidden
                      />
                    )}
                    <span className="line-clamp-2">
                      {module.order}. {module.title}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <ul className="border-border/70 ml-3 space-y-0.5 border-l pl-2">
                    {items.map((item) => (
                      <SidebarItemRow
                        key={itemKey(item)}
                        item={item}
                        href={`${base}/${module.slug}/${itemSlug(item)}`}
                        pathname={pathname}
                        completed={completed}
                        onNavigate={onNavigate}
                      />
                    ))}
                    {module.assessmentId && (
                      <li>
                        <Link
                          href={assessmentHref}
                          onClick={onNavigate}
                          className={navItemClass(pathname === assessmentHref)}
                        >
                          <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          <span>Assessment</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Docked section navigation for the paper being read: always visible
          on paper pages, with its own scroll + scroll-spy follow. */}
      {activeSectionNav && (
        <div className="border-border bg-card/60 flex max-h-[55%] shrink-0 flex-col border-t">
          <p className="text-muted-foreground shrink-0 truncate px-4 pt-3 pb-1.5 text-xs font-medium tracking-wide uppercase">
            {activeSectionNav.label}
          </p>
          <PaperSectionNav
            items={activeSectionNav.nav}
            pathname={pathname}
            completedContentIds={completed}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
}

function itemKey(item: ModuleItem): string {
  if (item.kind === "lesson") return item.lesson.id;
  if (item.kind === "reader") return item.reader.id;
  return item.paper.id;
}
function itemSlug(item: ModuleItem): string {
  if (item.kind === "lesson") return item.lesson.slug;
  if (item.kind === "reader") return item.reader.slug;
  return item.paper.slug;
}
function itemTitle(item: ModuleItem): string {
  if (item.kind === "lesson") return item.lesson.title;
  if (item.kind === "reader") return item.reader.title;
  return item.paper.title;
}
/**
 * An item is "done" only when all its progress units are — for a paper that
 * includes its inserted lessons, matching module/track totals. (Computed from
 * props: importing the content accessors would pull the graph client-side.)
 */
function itemDone(item: ModuleItem, completed: Set<string>): boolean {
  if (item.kind === "lesson") return completed.has(item.lesson.id);
  if (item.kind === "reader") return completed.has(item.reader.id);
  if (!completed.has(item.paper.id)) return false;
  return (item.paper.edits ?? []).every(
    (edit) =>
      edit.op !== "activity" ||
      edit.items.every(
        (inserted) => inserted.kind !== "lesson" || completed.has(inserted.id),
      ),
  );
}

function SidebarItemRow({
  item,
  href,
  pathname,
  completed,
  onNavigate,
}: {
  item: ModuleItem;
  href: string;
  pathname: string;
  completed: Set<string>;
  onNavigate?: () => void;
}) {
  const done = itemDone(item, completed);
  const active = pathname === href;
  return (
    <li>
      <Link href={href} onClick={onNavigate} className={navItemClass(active)}>
        {done ? (
          <CheckCircle2
            className="text-foreground mt-0.5 size-3.5 shrink-0"
            aria-hidden
          />
        ) : (
          <Circle className="mt-0.5 size-3.5 shrink-0 opacity-30" aria-hidden />
        )}
        <span className="line-clamp-2">{itemTitle(item)}</span>
        {item.kind === "paper" && (
          <FileText
            className="text-muted-foreground mt-0.5 ml-auto size-3 shrink-0"
            aria-hidden
          />
        )}
        {item.kind === "reader" && (
          <BookOpen
            className="text-muted-foreground mt-0.5 ml-auto size-3 shrink-0"
            aria-hidden
          />
        )}
      </Link>
    </li>
  );
}

export function TrackSidebar(props: TrackSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  // Section titles need more room than lesson titles — widen the bar while
  // the paper/reader section panel is docked.
  const paperExpanded = activeSectionNavOf(props, pathname) !== null;
  return (
    <>
      <aside
        className={cn(
          "border-border bg-card/40 sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden border-r transition-[width] duration-300 lg:block",
          paperExpanded ? "w-96" : "w-72",
        )}
      >
        <SidebarNav {...props} />
      </aside>

      <div className="bg-background/80 sticky top-14 z-30 border-b px-4 py-2 backdrop-blur lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ListTree className="size-4" aria-hidden /> Contents
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{props.outline.track.title} contents</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-hidden">
              <SidebarNav {...props} onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
