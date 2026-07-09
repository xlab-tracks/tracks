"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gradeExercise } from "@/app/actions/exercises";
import type { GradeResult, PublicChoiceExercise } from "@/lib/content/exercise-view";
import { EXERCISE_TYPE_LABELS } from "@/lib/content/types";

export function ChoiceExerciseCard({
  exercise,
}: {
  exercise: PublicChoiceExercise;
}) {
  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {EXERCISE_TYPE_LABELS[exercise.type]}
      </p>
      <p className="font-medium">{exercise.prompt}</p>
      <ChoiceExerciseBody exercise={exercise} />
    </aside>
  );
}

/**
 * The interactive part of a choice exercise — options, grading, feedback — with
 * no card chrome or prompt, so it can be embedded inside a multi-part sequence.
 * `onGraded` fires the first time an answer is checked (used to unlock the next
 * step in a sequence).
 */
export function ChoiceExerciseBody({
  exercise,
  onGraded,
}: {
  exercise: PublicChoiceExercise;
  onGraded?: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [pending, startTransition] = useTransition();

  const locked = result != null || pending;

  const toggle = (optionId: string) => {
    if (locked) return;
    setSelected((prev) =>
      exercise.multiple
        ? prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
        : [optionId],
    );
  };

  const submit = () =>
    startTransition(async () => {
      setResult(await gradeExercise(exercise.id, selected));
      onGraded?.();
    });

  const reset = () => {
    setSelected([]);
    setResult(null);
  };

  const correctSet = new Set(result?.correctOptionIds ?? []);
  const graded = result != null;

  return (
    <>
      <ul className="mt-4 space-y-2">
        {exercise.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isCorrect = correctSet.has(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => toggle(option.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  !graded && isSelected && "border-foreground bg-muted",
                  !graded && !isSelected && "border-border hover:bg-muted",
                  graded && isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                  graded && !isCorrect && isSelected && "border-destructive/60 bg-destructive/10",
                  graded && !isCorrect && !isSelected && "border-border opacity-70",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center border",
                    exercise.multiple ? "rounded-[4px]" : "rounded-full",
                    isSelected && !graded && "border-foreground bg-foreground text-background",
                    graded && isCorrect && "border-emerald-600 bg-emerald-600 text-white",
                    graded && !isCorrect && isSelected && "border-destructive bg-destructive text-white",
                  )}
                >
                  {graded && isCorrect && <Check className="size-3" aria-hidden />}
                  {graded && !isCorrect && isSelected && <X className="size-3" aria-hidden />}
                </span>
                <span className={cn(exercise.monospaceOptions && "font-mono text-sm whitespace-pre-wrap")}>
                  {option.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {graded && (
        <div
          className={cn(
            "mt-4 rounded-lg p-3 text-sm",
            result.correct ? "bg-emerald-500/10 text-emerald-700" : "bg-muted",
          )}
        >
          <p className="font-medium">{result.correct ? "Correct" : "Not quite"}</p>
          {result.explanation && (
            <p className="text-muted-foreground mt-1">{result.explanation}</p>
          )}
        </div>
      )}

      <div className="mt-4">
        {!graded ? (
          <Button size="sm" onClick={submit} disabled={selected.length === 0 || pending}>
            {pending ? "Checking…" : "Check answer"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={reset}>
            Try again
          </Button>
        )}
      </div>
    </>
  );
}
