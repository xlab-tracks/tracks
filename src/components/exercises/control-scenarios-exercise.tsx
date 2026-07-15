"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveControlScenario } from "@/app/actions/exercises";
import {
  EXERCISE_TYPE_LABELS,
  type ControlScenariosExercise,
} from "@/lib/content/types";
import {
  CONTROL_SCENARIO_MAX_ANSWER_CHARS,
  isStorableText,
  type ControlScenarioEntry,
} from "@/lib/content/exercise-view";
import { ActorBadge, FlowGraph } from "./flow-graph";
import { Paragraphs } from "./math-text";

/**
 * The full control-scenarios flow in one card: a definitions card (the cast),
 * then one scenario at a time — setup text, outcome line, and a neutral flow
 * graph on the left; a pre-commit freeform answer on the right, replaced by
 * the reveal (setup name → ideal explanation → the learner's own reasoning)
 * on submit. Forward only via Submit → Next; back navigation to submitted
 * scenarios is read-only. No verdicts, no grading — the payoff is the
 * self-comparison. Answers persist via `saveControlScenario` as they're
 * submitted — a no-op for signed-out visitors, who can still work through it.
 */
export function ControlScenariosCard({
  exercise,
  initialScenarios,
  persist = false,
}: {
  exercise: ControlScenariosExercise;
  initialScenarios?: Record<string, ControlScenarioEntry>;
  /** Signed-in only — signed-out visitors skip the (no-op) server round-trip. */
  persist?: boolean;
}) {
  const scenarios = exercise.scenarios;
  const count = scenarios.length;
  const castActors = exercise.actors.filter((a) => !a.hidden);

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      scenarios.map((s) => [s.id, initialScenarios?.[s.id]?.answer ?? ""]),
    ),
  );
  const [submitted, setSubmitted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      scenarios.map((s) => [s.id, Boolean(initialScenarios?.[s.id])]),
    ),
  );
  // "cast" is both the opening definitions card and the block's closed face
  // after S5's Continue. Re-entering the reading restores position: jump to
  // the first unanswered scenario when a previous session left some done.
  const [view, setView] = useState<"cast" | number>(() => {
    const done = scenarios.filter((s) => initialScenarios?.[s.id]).length;
    return done > 0 && done < count
      ? scenarios.findIndex((s) => !initialScenarios?.[s.id])
      : "cast";
  });
  const [pending, startTransition] = useTransition();
  const [focusReveal, setFocusReveal] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  const firstUnsubmitted = scenarios.findIndex((s) => !submitted[s.id]);
  const doneCount = scenarios.filter((s) => submitted[s.id]).length;
  const allDone = doneCount === count;

  // The reveal takes over the answer column and holds focus until Next.
  useEffect(() => {
    if (focusReveal) {
      revealRef.current?.focus();
      // One-shot: clear the flag once the reveal has taken focus.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocusReveal(false);
    }
  }, [focusReveal]);

  const submit = (index: number) => {
    const scenario = scenarios[index];
    startTransition(async () => {
      if (persist) {
        await saveControlScenario(exercise.id, scenario.id, answers[scenario.id]);
      }
      setSubmitted((prev) => ({ ...prev, [scenario.id]: true }));
      setFocusReveal(true);
    });
  };

  // Step indicator in the paper's understanding-check format — jump back to
  // any submitted scenario (read-only there). (Not aria-hidden: it holds
  // focusable buttons.)
  const stepBar = (
    <div className="mt-3 mb-4 flex items-center gap-1.5">
      {scenarios.map((s, i) => {
        const done = submitted[s.id];
        const reachable = done || i === firstUnsubmitted;
        return (
          <button
            key={s.id}
            type="button"
            disabled={!reachable || pending}
            aria-label={`Go to scenario ${i + 1} of ${count}${done ? " (submitted)" : ""}`}
            aria-current={view === i ? "step" : undefined}
            onClick={() => reachable && setView(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              view === i && "bg-foreground",
              view !== i && done && "bg-foreground/40",
              view !== i && !done && reachable && "bg-muted-foreground/30",
              !reachable && "bg-muted cursor-not-allowed",
            )}
          />
        );
      })}
    </div>
  );

  let body: React.ReactNode;
  if (view === "cast") {
    body = (
      <>
        <Paragraphs text={exercise.prompt} className="text-sm" />
        <ul className="border-border divide-border mt-4 divide-y rounded-lg border">
          {castActors.map((actor) => (
            <li key={actor.id} className="flex items-start gap-3 px-3 py-2.5">
              <ActorBadge actor={actor.id} letter={actor.letter} className="mt-0.5" />
              <p className="text-sm">
                <span className="font-semibold">
                  {actor.letter} — {actor.name}.
                </span>{" "}
                <span className="text-muted-foreground">{actor.definition}</span>
              </p>
            </li>
          ))}
        </ul>
        <div className="border-primary/60 mt-4 border-l-2 pl-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            The question, every time
          </p>
          <p className="mt-1 text-sm font-medium">{exercise.question}</p>
        </div>
        {allDone ? (
          <p className="text-muted-foreground mt-4 text-sm">
            You&apos;ve run all five scenarios. Use the step bar above to
            revisit any setup and its reveal.
          </p>
        ) : (
          <Button
            size="sm"
            className="mt-4"
            onClick={() => setView(firstUnsubmitted === -1 ? 0 : firstUnsubmitted)}
          >
            {doneCount > 0 ? "Continue" : "Begin"}
          </Button>
        )}
      </>
    );
  } else {
    const index = view;
    const scenario = scenarios[index];
    const isSubmitted = submitted[scenario.id];
    const answer = answers[scenario.id];
    const answerId = `${exercise.id}-${scenario.id}-answer`;

    body = (
      <div className="@container">
        <div className="@2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] grid gap-x-6 gap-y-5">
          {/* Scenario: title, card text, outcome line, graph, slim legend. */}
          <div>
            <h4 className="text-base font-semibold tracking-tight">
              {scenario.displayTitle}
            </h4>
            <Paragraphs text={scenario.card} className="mt-2 text-sm" />
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="border-destructive/40 bg-destructive/5 text-destructive rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase">
                Unacceptable outcome
              </span>
              <span className="text-sm font-medium">{scenario.outcome}</span>
            </p>
            <FlowGraph
              graph={scenario.graph}
              actors={exercise.actors}
              label={`Workflow diagram: ${scenario.displayTitle}`}
              className="mt-4"
            />
            <div className="border-border text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs">
              {castActors.map((actor) => (
                <span key={actor.id} className="flex items-center gap-1.5">
                  <ActorBadge
                    actor={actor.id}
                    letter={actor.letter}
                    className="size-5 text-[10px]"
                  />
                  {actor.legend}
                </span>
              ))}
            </div>
          </div>

          {/* Answer column; the reveal takes it over on submit. */}
          <div className="flex flex-col">
            {isSubmitted ? (
              <>
                <div
                  ref={revealRef}
                  tabIndex={-1}
                  className="control-reveal-in bg-muted/50 border-border rounded-lg border p-4 focus:outline-none"
                >
                  <p className="text-sm font-semibold">{scenario.revealName}</p>
                  <Paragraphs
                    text={scenario.reveal}
                    className="text-muted-foreground mt-2 text-sm"
                  />
                  <div className="border-border mt-4 border-t pt-3">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Your reasoning
                    </p>
                    <blockquote className="border-border mt-1.5 border-l-2 pl-3 text-sm whitespace-pre-wrap">
                      {answer}
                    </blockquote>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="mt-3 gap-1 self-end"
                  onClick={() =>
                    setView(index === count - 1 ? "cast" : index + 1)
                  }
                >
                  {index === count - 1 ? "Continue" : "Next"}{" "}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Button>
              </>
            ) : (
              <>
                <label htmlFor={answerId} className="text-sm font-medium">
                  {exercise.question}
                </label>
                <Textarea
                  id={answerId}
                  value={answer}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAnswers((prev) => ({ ...prev, [scenario.id]: value }));
                  }}
                  placeholder={exercise.placeholder}
                  rows={8}
                  maxLength={CONTROL_SCENARIO_MAX_ANSWER_CHARS}
                  disabled={pending}
                  className={cn("mt-2 flex-1 resize-y", pending && "opacity-60")}
                />
                <Button
                  size="sm"
                  className="mt-3 self-end"
                  disabled={
                    pending ||
                    answer.trim().length < 1 ||
                    // Mirror the server sanitizer so a submit can never be
                    // silently rejected server-side.
                    !isStorableText(answer)
                  }
                  onClick={() => submit(index)}
                >
                  {pending ? "Saving…" : "Submit"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-5">
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setView(index === 0 ? "cast" : index - 1)}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {EXERCISE_TYPE_LABELS["control-scenarios"]}
        </p>
        {typeof view === "number" && (
          <span className="text-muted-foreground text-xs tabular-nums">
            Scenario {view + 1} of {count}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{exercise.title}</h3>
      {stepBar}
      {body}
    </aside>
  );
}
