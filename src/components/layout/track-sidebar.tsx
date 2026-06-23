"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, FileText, ListTree, Lock } from "lucide-react";
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
import type { TrackOutline } from "@/lib/content";
import { cn } from "@/lib/utils";

export interface TrackSidebarProps {
  outline: TrackOutline;
  /** Lesson IDs the current user has completed (drives checkmarks). */
  completedLessonIds?: string[];
  /** Module slugs gated by unmet prerequisites (drives lock icons). */
  lockedModuleSlugs?: string[];
}

function SidebarNav({
  outline,
  completedLessonIds = [],
  lockedModuleSlugs = [],
  onNavigate,
}: TrackSidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const base = `/tracks/${outline.track.slug}`;
  const segments = pathname.split("/").filter(Boolean);
  const activeModuleSlug = segments[2];
  const completed = new Set(completedLessonIds);
  const locked = new Set(lockedModuleSlugs);

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

  const itemClass = (active: boolean) =>
    cn(
      "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
      active
        ? "bg-primary/10 text-foreground font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-muted",
    );

  return (
    <div className="flex h-full flex-col">
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
        {outline.modules.map(({ module, lessons }) => {
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
                  {lessons.map((lesson) => {
                    const href = `${base}/${module.slug}/${lesson.slug}`;
                    const done = completed.has(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          className={itemClass(pathname === href)}
                        >
                          {done ? (
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
                          <span className="line-clamp-2">{lesson.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {module.assessmentId && (
                    <li>
                      <Link
                        href={assessmentHref}
                        onClick={onNavigate}
                        className={itemClass(pathname === assessmentHref)}
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
  );
}

export function TrackSidebar(props: TrackSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <aside className="border-border bg-card/40 sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r lg:block">
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
            <div className="h-full overflow-y-auto">
              <SidebarNav {...props} onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
