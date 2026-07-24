"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  EXERCISE_TYPE_LABELS,
  type TapRevealRating,
} from "@/lib/content/types";
import type { PublicChoiceExercise } from "@/lib/content/exercise-view";
import { Paragraphs } from "./math-text";
import { TapRevealBody } from "./tap-reveal-exercise";
import { ChoiceExerciseBody } from "./choice-exercise";

export type SequencePart =
  | { kind: "understanding-check"; id: string; prompt: string; sampleAnswer?: string }
  | {
      kind: "tap-reveal";
      id: string;
      prompt: string;
      answer: string;
      /** Prior self-assessment from the learner's submission, if any. */
      initialRating: TapRevealRating | null;
    }
  | { kind: "choice"; id: string; prompt: string; exercise: PublicChoiceExercise };

/**
 * A multi-part exercise shown one part at a time. Each part is only reachable
 * after the previous one is completed: understanding checks by submitting an
 * answer (which reveals the sample), tap-reveals by rating yourself after the
 * reveal, and choice questions by checking an answer (auto-graded). The prompt
 * is rendered by the sequence; the part body is the type's interactive piece.
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
  const [ratings, setRatings] = useState<(TapRevealRating | null)[]>(() =>
    parts.map((p) => (p.kind === "tap-reveal" ? p.initialRating : null)),
  );
  const [submitted, setSubmitted] = useState<boolean[]>(() =>
    parts.map((p) => p.kind === "tap-reveal" && p.initialRating != null),
  );

  const total = parts.length;
  const part = parts[current];
  const isSubmitted = submitted[current];
  const isLast = current === total - 1;

  const setAnswer = (value: string) =>
    setAnswers((prev) => prev.map((a, i) => (i === current ? value : a)));

  const submit = () =>
    setSubmitted((prev) => prev.map((s, i) => (i === current ? true : s)));

  const rated = (rating: TapRevealRating) => {
    setRatings((prev) => prev.map((r, i) => (i === current ? rating : r)));
    submit();
  };

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

      {/* Step indicator — jump back to any already-unlocked part. (Not
          aria-hidden: it holds focusable buttons.) */}
      <div className="mb-4 flex items-center gap-1.5">
        {parts.map((p, i) => (
          <button
            key={p.id}
            type="button"
            disabled={!canReach(i)}
            aria-label={`Go to part ${i + 1} of ${total}`}
            aria-current={i === current ? "step" : undefined}
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

      {part.kind === "tap-reveal" ? (
        // Remounts per part (keyed by id) so reveal state never leaks between
        // parts; the tracked rating is fed back in as the initial state.
        <TapRevealBody
          key={part.id}
          exerciseId={part.id}
          answer={part.answer}
          initialRating={ratings[current]}
          onRated={rated}
        />
      ) : part.kind === "choice" ? (
        // Auto-graded; grading the answer marks the part submitted and unlocks Next.
        <ChoiceExerciseBody key={part.id} exercise={part.exercise} onGraded={submit} />
      ) : (
        <>
          <Textarea
            value={answers[current]}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={
              part.sampleAnswer
                ? "Write your answer, then submit to compare with the sample…"
                : "Write your answer, then submit…"
            }
            rows={4}
            className="mt-3 resize-y"
          />

          {isSubmitted && part.sampleAnswer && (
            <div className="bg-muted mt-3 space-y-2 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Sample answer
              </p>
              <Paragraphs text={part.sampleAnswer} className="text-muted-foreground" />
            </div>
          )}
        </>
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
          part.kind === "tap-reveal" ? (
            <span className="text-muted-foreground text-xs">
              Reveal and rate yourself to continue
            </span>
          ) : part.kind === "choice" ? (
            <span className="text-muted-foreground text-xs">
              Check your answer to continue
            </span>
          ) : (
            <Button size="sm" onClick={submit}>
              Submit
            </Button>
          )
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
