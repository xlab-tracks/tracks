"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  saveCommitConstructCommit,
  saveCommitConstructConstruct,
} from "@/app/actions/exercises";
import {
  EXERCISE_TYPE_LABELS,
  type CommitConstructExercise,
  type CommitConstructOption,
} from "@/lib/content/types";
import {
  CONTROL_SCENARIO_MAX_ANSWER_CHARS,
  isStorableText,
  type CommitConstructCommitEntry,
  type CommitConstructConstructEntry,
} from "@/lib/content/exercise-view";
import { Paragraphs } from "./math-text";

const validText = (value: string) => value.trim().length >= 1 && isStorableText(value);

/** A row of mutually exclusive selectable chips (the commit / confidence picks). */
function OptionChips({
  options,
  selected,
  disabled,
  onSelect,
  label,
}: {
  options: CommitConstructOption[];
  selected: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              isSelected
                ? "border-foreground bg-muted font-medium"
                : "border-border text-muted-foreground",
              !disabled && !isSelected && "hover:border-foreground/40 hover:text-foreground",
              disabled && !isSelected && "opacity-50",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A two-part exercise in the paper's understanding-check format. Part 1
 * (commit): pick a view, rate confidence, explain — submit opens the
 * course-correction reveal. Part 2 (construct): in one answer, name an
 * unacceptable outcome and build the strongest threat model for how the model
 * causes it, with guidance conditioned on the Part 1 choice and an initially
 * hidden hint — submit opens the worked example and comparison questions. No
 * right/wrong grading. Responses persist via the commit-construct actions — a
 * no-op for signed-out visitors.
 */
export function CommitConstructCard({
  exercise,
  initialCommit,
  initialConstruct,
  persist = false,
}: {
  exercise: CommitConstructExercise;
  initialCommit?: CommitConstructCommitEntry;
  initialConstruct?: CommitConstructConstructEntry;
  /** Signed-in only — signed-out visitors skip the (no-op) server round-trip. */
  persist?: boolean;
}) {
  const { commit, construct } = exercise;
  const total = 2;

  const [choice, setChoice] = useState<string | null>(initialCommit?.choice ?? null);
  const [confidence, setConfidence] = useState<string | null>(
    initialCommit?.confidence ?? null,
  );
  const [reasoning, setReasoning] = useState(initialCommit?.reasoning ?? "");
  const [threatModel, setThreatModel] = useState(initialConstruct?.threatModel ?? "");
  const [submitted, setSubmitted] = useState<[boolean, boolean]>([
    Boolean(initialCommit),
    Boolean(initialConstruct),
  ]);
  // Re-entering the reading restores position: resume on the first open step.
  const [current, setCurrent] = useState(() =>
    initialCommit && !initialConstruct ? 1 : 0,
  );
  const [hintOpen, setHintOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [focusReveal, setFocusReveal] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  const isSubmitted = submitted[current];
  const isLast = current === total - 1;
  const canReach = (i: number) => i === 0 || submitted[i - 1];

  useEffect(() => {
    if (focusReveal) {
      revealRef.current?.focus();
      // One-shot: clear the flag once the reveal has taken focus.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocusReveal(false);
    }
  }, [focusReveal]);

  const submitCommit = () =>
    startTransition(async () => {
      if (persist && choice && confidence) {
        await saveCommitConstructCommit(exercise.id, choice, confidence, reasoning);
      }
      setSubmitted(([, b]) => [true, b]);
      setFocusReveal(true);
    });

  const submitConstruct = () =>
    startTransition(async () => {
      if (persist) {
        await saveCommitConstructConstruct(exercise.id, threatModel);
      }
      setSubmitted(([a]) => [a, true]);
      setFocusReveal(true);
    });

  const canSubmit =
    current === 0
      ? choice !== null && confidence !== null && validText(reasoning)
      : validText(threatModel);

  const guidance =
    choice !== null ? construct.guidanceByChoice?.[choice] : undefined;

  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {EXERCISE_TYPE_LABELS["commit-construct"]}
        </p>
        <span className="text-muted-foreground text-xs tabular-nums">
          Part {current + 1} of {total}
        </span>
      </div>

      {/* Step indicator — jump back to any already-unlocked part. (Not
          aria-hidden: it holds focusable buttons.) */}
      <div className="mb-4 flex items-center gap-1.5">
        {[commit.partTitle, construct.partTitle].map((title, i) => (
          <button
            key={title}
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

      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {current === 0 ? commit.partTitle : construct.partTitle}
      </p>

      {current === 0 ? (
        <>
          <div className="mt-2 space-y-2">
            {commit.framing && <Paragraphs text={commit.framing} />}
            <Paragraphs text={commit.question} className="font-medium" />
            {commit.supposition && <Paragraphs text={commit.supposition} />}
            {commit.instruction && (
              <Paragraphs
                text={commit.instruction}
                className="text-muted-foreground text-sm"
              />
            )}
          </div>

          <div className="mt-3">
            <OptionChips
              options={commit.options}
              selected={choice}
              disabled={pending || isSubmitted}
              onSelect={setChoice}
              label={commit.question}
            />
          </div>

          <p className="mt-4 text-sm font-medium">{commit.confidencePrompt}</p>
          <div className="mt-2">
            <OptionChips
              options={commit.confidenceOptions}
              selected={confidence}
              disabled={pending || isSubmitted}
              onSelect={setConfidence}
              label={commit.confidencePrompt}
            />
          </div>

          <Textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Explain your reasoning…"
            rows={4}
            maxLength={CONTROL_SCENARIO_MAX_ANSWER_CHARS}
            disabled={pending || isSubmitted}
            className="mt-3 resize-y"
          />

          {isSubmitted && (
            <div
              ref={revealRef}
              tabIndex={-1}
              className="control-reveal-in bg-muted mt-3 space-y-2 rounded-lg p-3 text-sm focus:outline-none"
            >
              <Paragraphs text={commit.reveal} className="text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-2 space-y-2">
            <Paragraphs text={construct.threatPrompt} className="font-medium" />
            {construct.constraint && (
              <Paragraphs
                text={construct.constraint}
                className="text-muted-foreground text-sm"
              />
            )}
            {guidance && (
              <p className="border-primary/60 border-l-2 pl-3 text-sm italic">
                {guidance}
              </p>
            )}
          </div>
          <Textarea
            value={threatModel}
            onChange={(e) => setThreatModel(e.target.value)}
            placeholder="Construct the threat model…"
            rows={6}
            maxLength={CONTROL_SCENARIO_MAX_ANSWER_CHARS}
            disabled={pending || isSubmitted}
            className="mt-2 resize-y"
          />

          {construct.hint && !isSubmitted && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHintOpen((v) => !v)}
              >
                {hintOpen ? "Hide hint" : "Show hint"}
              </Button>
              {hintOpen && (
                <div className="bg-muted mt-2 space-y-2 rounded-lg p-3 text-sm">
                  <Paragraphs text={construct.hint} className="text-muted-foreground" />
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
              <p className="font-medium">{construct.revealLead}</p>
              <Paragraphs text={construct.reveal} className="text-muted-foreground" />
              <div className="border-border border-t pt-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Your threat model
                </p>
                <blockquote className="border-border mt-1.5 border-l-2 pl-3 whitespace-pre-wrap">
                  {threatModel}
                </blockquote>
              </div>
              <p className="font-medium">{construct.compareIntro}</p>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                {construct.compareQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              {construct.closing && (
                <Paragraphs text={construct.closing} className="text-muted-foreground" />
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0 || pending}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back
        </Button>

        {!isSubmitted ? (
          <Button
            size="sm"
            disabled={pending || !canSubmit}
            onClick={current === 0 ? submitCommit : submitConstruct}
          >
            {pending ? "Saving…" : "Submit"}
          </Button>
        ) : isLast ? (
          <span className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
            <Check className="size-4 text-emerald-500" aria-hidden /> Complete
          </span>
        ) : (
          <Button
            size="sm"
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            className="gap-1"
          >
            Next <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </aside>
  );
}
