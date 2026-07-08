"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EXERCISE_TYPE_LABELS } from "@/lib/content/types";
import { Paragraphs } from "./math-text";

export interface SequencePart {
  id: string;
  prompt: string;
  sampleAnswer: string;
}

/**
 * A multi-part exercise shown one part at a time. Each part is only reachable
 * after the previous one is submitted; submitting reveals the sample answer and
 * unlocks the "Next" step. Self-assessed, like a single understanding check —
 * so sample answers ship to the client (no answer key to protect).
 */
export function ExerciseSequenceCard({
  label = EXERCISE_TYPE_LABELS["understanding-check"],
  parts,
}: {
  label?: string;
  parts: SequencePart[];
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => parts.map(() => ""));
  const [submitted, setSubmitted] = useState<boolean[]>(() => parts.map(() => false));

  const total = parts.length;
  const part = parts[current];
  const isSubmitted = submitted[current];
  const isLast = current === total - 1;

  const setAnswer = (value: string) =>
    setAnswers((prev) => prev.map((a, i) => (i === current ? value : a)));

  const submit = () =>
    setSubmitted((prev) => prev.map((s, i) => (i === current ? true : s)));

  // A step is reachable once the one before it has been submitted.
  const canReach = (i: number) => i === 0 || submitted[i - 1];

  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <span className="text-muted-foreground text-xs tabular-nums">
          Part {current + 1} of {total}
        </span>
      </div>

      {/* Step indicator — jump back to any already-unlocked part */}
      <div className="mb-4 flex items-center gap-1.5" aria-hidden>
        {parts.map((p, i) => (
          <button
            key={p.id}
            type="button"
            disabled={!canReach(i)}
            onClick={() => canReach(i) && setCurrent(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i === current && "bg-foreground",
              i !== current && submitted[i] && "bg-foreground/40",
              i !== current && !submitted[i] && canReach(i) && "bg-muted-foreground/30",
              !canReach(i) && "bg-muted cursor-not-allowed",
            )}
          />
        ))}
      </div>

      <div className="space-y-2">
        <Paragraphs text={part.prompt} className="font-medium" />
      </div>

      <Textarea
        value={answers[current]}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer, then submit to compare with the sample…"
        rows={4}
        className="mt-3 resize-y"
      />

      {isSubmitted && (
        <div className="bg-muted mt-3 space-y-2 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Sample answer
          </p>
          <Paragraphs text={part.sampleAnswer} className="text-muted-foreground" />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back
        </Button>

        {!isSubmitted ? (
          <Button size="sm" onClick={submit}>
            Submit
          </Button>
        ) : isLast ? (
          <span className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
            <Check className="size-4 text-emerald-500" aria-hidden /> Complete
          </span>
        ) : (
          <Button size="sm" onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} className="gap-1">
            Next <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </aside>
  );
}
