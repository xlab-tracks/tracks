"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRubricCriterion } from "@/lib/grader/rubric";
import type { CriterionResult } from "@/lib/grader/parse";
import { cn } from "@/lib/utils";

/**
 * Renders the parsed <analysis> block of a grader report as a rubric table:
 * one row per criterion with its score, weight, and the grader's rationale.
 * Hovering (or focusing) a criterion name shows what the criterion is and
 * its 0–3 score anchors, sourced from the same structured rubric the prompt
 * is built from (src/lib/grader/rubric.ts).
 */
export function RubricTable({ criteria }: { criteria: CriterionResult[] }) {
  if (criteria.length === 0) return null;
  return (
    <div className="divide-border divide-y">
      {criteria.map((row) => {
        const info = getRubricCriterion(row.id);
        if (!info) return null;
        const na = row.score == null;
        return (
          <div key={row.id} className="py-2 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="decoration-muted-foreground/60 cursor-help text-left text-sm font-medium underline decoration-dotted underline-offset-4"
                  >
                    {info.label}
                  </button>
                </TooltipTrigger>
                {/* The base TooltipContent is a one-line inline-flex pill;
                    the inner div owns the layout so the criterion info always
                    stacks vertically regardless of how classes merge. */}
                <TooltipContent
                  side="top"
                  align="start"
                  collisionPadding={12}
                  className="max-w-[min(34rem,calc(100vw-2rem))] px-3.5 py-2.5"
                >
                  <div className="flex flex-col items-start gap-1.5 text-left">
                    <p className="font-semibold">
                      {info.id} · {info.label} (weight ×{info.weight})
                    </p>
                    {info.question && <p>{info.question}</p>}
                    <ul className="space-y-0.5">
                      {info.anchors.map((anchor, score) => (
                        <li key={score}>
                          <span className="font-semibold">{score}:</span>{" "}
                          {anchor}
                        </li>
                      ))}
                    </ul>
                    {info.extra && <p>{info.extra}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  na ? "text-muted-foreground" : "font-semibold",
                )}
              >
                {na ? (
                  <>
                    N/A
                    <span className="ml-1.5 text-xs font-normal">
                      excluded — total rescaled to /45
                    </span>
                  </>
                ) : (
                  <>
                    {row.score}/3
                    <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                      ×{info.weight} = {row.score! * info.weight}
                    </span>
                  </>
                )}
              </span>
            </div>
            {row.rationale && (
              <p className="text-muted-foreground mt-1 text-xs">
                {row.rationale}
              </p>
            )}
            {row.evidence && (
              <p className="text-muted-foreground/80 mt-1 text-xs italic">
                {row.evidence}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
