import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LessonRef } from "@/lib/content";
import { cn } from "@/lib/utils";

function hrefFor(ref: LessonRef) {
  return `/tracks/${ref.trackSlug}/${ref.moduleSlug}/${ref.lessonSlug}`;
}

export function LessonNav({
  prev,
  next,
}: {
  prev: LessonRef | null;
  next: LessonRef | null;
}) {
  return (
    <div className="border-border mt-10 grid grid-cols-2 gap-3 border-t pt-6">
      {prev ? (
        <Link
          href={hrefFor(prev)}
          className="border-border hover:bg-muted group flex flex-col gap-1 rounded-xl border p-4 transition-colors"
        >
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <ArrowLeft className="size-3.5" aria-hidden /> Previous
          </span>
          <span className="font-medium">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={hrefFor(next)}
          className={cn(
            "border-border hover:bg-muted group flex flex-col gap-1 rounded-xl border p-4 text-right transition-colors",
          )}
        >
          <span className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
            Next <ArrowRight className="size-3.5" aria-hidden />
          </span>
          <span className="font-medium">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
