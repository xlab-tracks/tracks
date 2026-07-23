"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestTransparencyGrade } from "@/app/actions/grading";
import {
  OpenRouterKeySettings,
  type OpenRouterKeyStatusView,
} from "@/components/exercises/openrouter-key-settings";
import { RubricTable } from "@/components/exercises/rubric-table";
import type { CriterionResult } from "@/lib/grader/parse";

interface GradeState {
  score: number;
  band: string;
  feedbackHtml: string;
  criteria: CriterionResult[];
}

/**
 * On-demand reasoning-transparency feedback for a submitted piece of writing.
 * Renders a "Get feedback" button; the grade (score /45, band, collapsible
 * full report) replaces it when it lands. Server hosts preload a previously
 * stored grade via the initial* props so it survives reloads.
 */
export function TransparencyFeedback({
  contentId,
  kind,
  initialScore,
  initialBand,
  initialFeedbackHtml,
  initialCriteria,
  keyStatus,
}: {
  contentId: string;
  kind: "exercise" | "assessment";
  initialScore?: number;
  initialBand?: string;
  initialFeedbackHtml?: string;
  /** Parsed per-criterion results of a stored grade (rubric table rows). */
  initialCriteria?: CriterionResult[];
  /**
   * Server-provided status of the user's own OpenRouter key (state + last4
   * only); omitted when key storage is unconfigured, which hides the key UI.
   */
  keyStatus?: OpenRouterKeyStatusView;
}) {
  const [grade, setGrade] = useState<GradeState | null>(() =>
    initialScore != null &&
    (initialFeedbackHtml || (initialCriteria?.length ?? 0) > 0)
      ? {
          score: initialScore,
          band: initialBand ?? "",
          feedbackHtml: initialFeedbackHtml ?? "",
          criteria: initialCriteria ?? [],
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = () =>
    startTransition(async () => {
      setError(null);
      try {
        const result = await requestTransparencyGrade(contentId, kind);
        if (result.ok) {
          setGrade(result);
          setOpen(true);
        } else {
          setError(result.error);
        }
      } catch {
        // The action can throw after the grade persisted server-side (e.g.
        // the response was lost) — surface a retryable error and re-render
        // the server components so a stored grade resurfaces via props
        // instead of being silently dropped.
        setError(
          "Something went wrong requesting feedback. If a grade completed, it will appear after this refresh — otherwise try again.",
        );
        router.refresh();
      }
    });

  return (
    <div className="border-border mt-4 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <p className="font-medium">Reasoning transparency</p>
          {grade ? (
            <p className="text-muted-foreground text-xs">
              <span className="text-foreground font-semibold tabular-nums">
                {grade.score}/45
              </span>
              {grade.band && <> — {grade.band}</>}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              LLM feedback on how transparently your submission reasons.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {grade && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Hide report" : "Show report"}
            </Button>
          )}
          <Button
            size="sm"
            variant={grade ? "outline" : "default"}
            disabled={pending}
            onClick={run}
          >
            {pending ? "Grading…" : grade ? "Re-grade" : "Get feedback"}
          </Button>
        </div>
      </div>
      {pending && (
        <p className="text-muted-foreground mt-2 text-xs">
          The grader reads your submission against the full rubric — this can
          take up to a minute.
        </p>
      )}
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
      {grade && open && (
        <div className="border-border mt-3 border-t pt-3">
          {grade.criteria.length > 0 && (
            <div className="mb-3">
              <RubricTable criteria={grade.criteria} />
            </div>
          )}
          <div
            className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: grade.feedbackHtml }}
          />
        </div>
      )}
      {keyStatus && <OpenRouterKeySettings initialStatus={keyStatus} />}
    </div>
  );
}
