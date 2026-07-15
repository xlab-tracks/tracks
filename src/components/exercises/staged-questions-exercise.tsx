"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveStagedQuestion } from "@/app/actions/exercises";
import {
  EXERCISE_TYPE_LABELS,
  type StagedQuestion,
  type StagedQuestionsExercise,
} from "@/lib/content/types";
import {
  CONTROL_SCENARIO_MAX_ANSWER_CHARS,
  isStorableText,
  type StagedQuestionEntry,
} from "@/lib/content/exercise-view";
import { ControlTimeline } from "./control-timeline";
import { TwoWorldsFigure } from "./two-worlds-figure";
import { Paragraphs } from "./math-text";

/** Interactive widgets a reveal can end with, by registry key. */
const REVEAL_WIDGETS: Record<
  NonNullable<StagedQuestion["revealWidget"]>,
  React.ComponentType
> = {
  "control-timeline": ControlTimeline,
};

/** Persistent figures rendered above every part, by registry key. */
const FIGURE_WIDGETS: Record<
  NonNullable<StagedQuestionsExercise["figureWidget"]>,
  React.ComponentType<{ className?: string }>
> = {
  "two-worlds": TwoWorldsFigure,
};

/** The forward pointer, with its named reading rendered as a link. */
function ForwardPointer({ question }: { question: StagedQuestion }) {
  const { forward, forwardLinkText, forwardHref } = question;
  if (!forward) return null;
  let body: React.ReactNode = forward;
  if (forwardLinkText && forwardHref && forward.includes(forwardLinkText)) {
    const [before, after] = forward.split(forwardLinkText);
    body = (
      <>
        {before}
        <Link
          href={forwardHref}
          className="text-destructive font-medium underline underline-offset-4"
        >
          {forwardLinkText}
        </Link>
        {after}
      </>
    );
  }
  return <p className="text-muted-foreground italic">{body}</p>;
}

/**
 * Free-text reasoning prompts with staged reveals, presented one part at a
 * time in the paper's understanding-check format: "Part X of Y" counter,
 * segmented step bar, Submit → reveal (a one-line acknowledgement of what a
 * good answer contains, then the substance, then an optional forward
 * pointer), ghost Back / Next footer, ✓ Complete at the end. No right/wrong
 * grading — these are reasoning prompts. Answers persist via
 * `saveStagedQuestion` — a no-op for signed-out visitors, who can still work
 * through it.
 */
export function StagedQuestionsCard({
  exercise,
  initialQuestions,
  persist = false,
}: {
  exercise: StagedQuestionsExercise;
  initialQuestions?: Record<string, StagedQuestionEntry>;
  /** Signed-in only — signed-out visitors skip the (no-op) server round-trip. */
  persist?: boolean;
}) {
  // Flattened questions, each with its part's title for the step header.
  const steps = exercise.parts.flatMap((part) =>
    part.questions.map((question) => ({ partTitle: part.title, question })),
  );
  const total = steps.length;

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      steps.map(({ question }) => [
        question.id,
        initialQuestions?.[question.id]?.answer ?? "",
      ]),
    ),
  );
  const [submitted, setSubmitted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      steps.map(({ question }) => [
        question.id,
        Boolean(initialQuestions?.[question.id]),
      ]),
    ),
  );
  // Re-entering the reading restores position: start on the first unanswered
  // question (or the last one, when everything is already answered).
  const [current, setCurrent] = useState(() => {
    const first = steps.findIndex(({ question }) => !initialQuestions?.[question.id]);
    return first === -1 ? total - 1 : first;
  });
  const [pending, startTransition] = useTransition();
  const [focusReveal, setFocusReveal] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  const { partTitle, question } = steps[current];
  const Figure = exercise.figureWidget
    ? FIGURE_WIDGETS[exercise.figureWidget]
    : null;
  const answer = answers[question.id];
  const isSubmitted = submitted[question.id];
  const isLast = current === total - 1;

  // A step is reachable once the one before it has been submitted.
  const canReach = (i: number) => i === 0 || submitted[steps[i - 1].question.id];

  // Moving between steps closes any open hint (each question has its own).
  const goTo = (i: number) => {
    setCurrent(Math.min(total - 1, Math.max(0, i)));
    setHintOpen(false);
  };

  useEffect(() => {
    if (focusReveal) {
      revealRef.current?.focus();
      // One-shot: clear the flag once the reveal has taken focus.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocusReveal(false);
    }
  }, [focusReveal]);

  const submit = () => {
    startTransition(async () => {
      if (persist) {
        await saveStagedQuestion(exercise.id, question.id, answers[question.id]);
      }
      setSubmitted((prev) => ({ ...prev, [question.id]: true }));
      setFocusReveal(true);
    });
  };

  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {EXERCISE_TYPE_LABELS["staged-questions"]}
        </p>
        {total > 1 && (
          <span className="text-muted-foreground text-xs tabular-nums">
            Part {current + 1} of {total}
          </span>
        )}
      </div>

      {/* Step indicator — jump back to any already-unlocked part. A single
          question needs no steps. (Not aria-hidden: it holds focusable
          buttons.) */}
      {total > 1 && (
        <div className="mb-4 flex items-center gap-1.5">
          {steps.map(({ question: q }, i) => (
            <button
              key={q.id}
              type="button"
              disabled={!canReach(i)}
              aria-label={`Go to part ${i + 1} of ${total}`}
              aria-current={i === current ? "step" : undefined}
              onClick={() => canReach(i) && goTo(i)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i === current && "bg-foreground",
                i !== current && submitted[q.id] && "bg-foreground/40",
                i !== current && !submitted[q.id] && canReach(i) && "bg-muted-foreground/30",
                !canReach(i) && "bg-muted cursor-not-allowed",
              )}
            />
          ))}
        </div>
      )}

      {/* Persistent figure: the shared picture every part reasons about. */}
      {Figure && <Figure className="mb-4" />}

      {total > 1 && (
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {partTitle}
        </p>
      )}
      <div className="mt-2 space-y-2">
        {question.framing && <Paragraphs text={question.framing} />}
        <Paragraphs text={question.question} className="font-medium" />
        {question.instruction && (
          <Paragraphs text={question.instruction} className="text-muted-foreground text-sm" />
        )}
      </div>

      <Textarea
        value={answer}
        onChange={(e) => {
          const value = e.target.value;
          setAnswers((prev) => ({ ...prev, [question.id]: value }));
        }}
        placeholder={exercise.placeholder}
        rows={4}
        maxLength={CONTROL_SCENARIO_MAX_ANSWER_CHARS}
        disabled={pending || isSubmitted}
        className="mt-3 resize-y"
      />

      {question.hint && !isSubmitted && (
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => setHintOpen((v) => !v)}>
            {hintOpen ? "Hide hint" : "Show hint"}
          </Button>
          {hintOpen && (
            <div className="bg-muted mt-2 space-y-2 rounded-lg p-3 text-sm">
              <Paragraphs text={question.hint} className="text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {isSubmitted && (
        <div
          ref={revealRef}
          tabIndex={-1}
          className="control-reveal-in bg-muted mt-3 space-y-2 rounded-lg p-3 text-sm focus:outline-none"
        >
          {question.acknowledgement && (
            <p className="font-medium">{question.acknowledgement}</p>
          )}
          <Paragraphs text={question.reveal} className="text-muted-foreground" />
          {question.examplesIntro && (
            <p className="text-muted-foreground">{question.examplesIntro}</p>
          )}
          {question.examples && (
            <ul className="space-y-2">
              {question.examples.map((example) => (
                <li key={example.label}>
                  <span className="font-semibold">{example.label}:</span>{" "}
                  <span className="text-muted-foreground">{example.text}</span>
                </li>
              ))}
            </ul>
          )}
          <ForwardPointer question={question} />
          {question.revealWidget &&
            (() => {
              const Widget = REVEAL_WIDGETS[question.revealWidget];
              return <Widget />;
            })()}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => goTo(current - 1)}
          disabled={current === 0 || pending}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back
        </Button>

        {!isSubmitted ? (
          <Button
            size="sm"
            disabled={
              pending ||
              answer.trim().length < 1 ||
              // Mirror the server sanitizer so a submit can never be
              // silently rejected server-side.
              !isStorableText(answer)
            }
            onClick={submit}
          >
            {pending ? "Saving…" : "Submit"}
          </Button>
        ) : isLast ? (
          <span className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
            <Check className="size-4 text-emerald-500" aria-hidden /> Complete
          </span>
        ) : (
          <Button size="sm" onClick={() => goTo(current + 1)} className="gap-1">
            Next <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </aside>
  );
}
