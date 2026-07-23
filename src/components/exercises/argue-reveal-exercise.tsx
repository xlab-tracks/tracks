"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  saveArgueRevealConstruction,
  saveArgueRevealItem,
} from "@/app/actions/exercises";
import {
  ARGUE_REVEAL_RATINGS,
  ARGUE_REVEAL_RATING_LABELS,
  EXERCISE_TYPE_LABELS,
  type ArgueRevealExercise,
  type ArgueRevealRating,
} from "@/lib/content/types";
import {
  argueRevealBounds,
  isStorableText,
  type ArgueRevealConstructionEntry,
  type ArgueRevealItemEntry,
} from "@/lib/content/exercise-view";
import { Paragraphs } from "./math-text";

interface RoundState {
  chips: string[];
  response: string;
  submitted: boolean;
  toolboxOpened: boolean;
}

interface ItemState {
  rounds: RoundState[];
  rating: ArgueRevealRating | null;
  note: string;
}

function CharCount({ len, min, max }: { len: number; min: number; max: number }) {
  return (
    <p
      className={cn(
        "mt-1 text-right font-mono text-xs",
        len >= min ? "text-emerald-700" : "text-muted-foreground",
      )}
    >
      {len} / {max}
      {len < min && ` · min ${min}`}
    </p>
  );
}

function RatingSegment({
  value,
  disabled,
  label,
  onSelect,
}: {
  value: ArgueRevealRating | null;
  disabled: boolean;
  label: string;
  onSelect: (rating: ArgueRevealRating) => void;
}) {
  return (
    <span
      role="group"
      aria-label={label}
      className="border-border inline-flex overflow-hidden rounded-md border"
    >
      {ARGUE_REVEAL_RATINGS.map((rating) => (
        <button
          key={rating}
          type="button"
          aria-pressed={value === rating}
          disabled={disabled}
          onClick={() => onSelect(rating)}
          className={cn(
            "border-border px-3 py-1.5 text-sm transition-colors not-first:border-l disabled:opacity-60",
            value === rating
              ? "bg-foreground text-background"
              : "hover:enabled:bg-muted",
          )}
        >
          {ARGUE_REVEAL_RATING_LABELS[rating]}
        </button>
      ))}
    </span>
  );
}

/**
 * The full argue-reveal flow in one card, demo-style progressive scroll:
 * intro → one section per criticism (a response gated by a
 * minimum length; submitting reveals the defenders' reply; multi-round items
 * repeat with the critic's pushback; then a self-rating + optional note) →
 * a construction step (attack surface + argument/best response/residual) →
 * summary with copyable JSON. Completed items and the construction persist
 * via server actions — skipped entirely for signed-out visitors.
 */
export function ArgueRevealExerciseCard({
  exercise,
  initialItems,
  initialConstruction,
  initialCompletedAt,
  persist = false,
  scoringSlot,
}: {
  exercise: ArgueRevealExercise;
  initialItems?: Record<string, ArgueRevealItemEntry>;
  initialConstruction?: ArgueRevealConstructionEntry;
  /** When the learner previously submitted everything (ISO timestamp). */
  initialCompletedAt?: string;
  /** Signed-in only — signed-out visitors skip the (no-op) server round-trip. */
  persist?: boolean;
  /** Server-rendered scoring panel shown on the summary step. */
  scoringSlot?: ReactNode;
}) {
  const bounds = argueRevealBounds(exercise);
  const constructionStep = exercise.items.length + 1;
  const doneStep = exercise.items.length + 2;

  const [items, setItems] = useState<ItemState[]>(() =>
    exercise.items.map((item) => {
      const saved = initialItems?.[item.id];
      return {
        // Per-round, so a round authored AFTER the learner saved this item
        // hydrates unsubmitted (answerable) instead of locked-and-empty.
        rounds: item.rounds.map((_, k) => ({
          chips: saved?.rounds?.[k]?.chips ?? [],
          response: saved?.rounds?.[k]?.response ?? "",
          submitted: Boolean(saved?.rounds?.[k]),
          toolboxOpened: saved?.rounds?.[k]?.toolboxOpened ?? false,
        })),
        rating: saved?.rating ?? null,
        note: saved?.note ?? "",
      };
    }),
  );
  const [construction, setConstruction] = useState(() => ({
    attackSurface: initialConstruction?.attackSurface ?? null,
    argument: initialConstruction?.argument ?? "",
    bestResponse: initialConstruction?.bestResponse ?? "",
    residual: initialConstruction?.residual ?? "",
  }));
  // Resume at the FIRST unsaved item (not a count — a lost write or rejected
  // save can leave a gap, and resuming past it would strand that item), else
  // at the construction step or the summary. The first criticism shows
  // immediately — there is no separate "Begin" step.
  const [step, setStep] = useState(() => {
    const firstUnsaved = exercise.items.findIndex((i) => !initialItems?.[i.id]);
    if (firstUnsaved === -1) {
      return initialConstruction ? doneStep : constructionStep;
    }
    return firstUnsaved + 1;
  });
  const [completedAt, setCompletedAt] = useState<string | null>(
    initialCompletedAt ?? null,
  );
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (step < 1) return;
    const target = sectionRefs.current[step];
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView?.({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }, [step]);

  const setRound = (
    itemIndex: number,
    roundIndex: number,
    patch: Partial<RoundState>,
  ) =>
    setItems((prev) =>
      prev.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              rounds: item.rounds.map((round, k) =>
                k === roundIndex ? { ...round, ...patch } : round,
              ),
            }
          : item,
      ),
    );

  const setItem = (itemIndex: number, patch: Partial<ItemState>) =>
    setItems((prev) =>
      prev.map((item, i) => (i === itemIndex ? { ...item, ...patch } : item)),
    );

  const finishItem = (itemIndex: number) =>
    startTransition(async () => {
      const state = items[itemIndex];
      if (persist && (state.rating || !exercise.postRevealPrompt)) {
        await saveArgueRevealItem(
          exercise.id,
          exercise.items[itemIndex].id,
          state.rounds.map(({ chips, response, toolboxOpened }) => ({
            chips,
            response,
            toolboxOpened,
          })),
          state.rating,
          state.note,
        );
      }
      setStep(itemIndex + 2);
    });

  const finishConstruction = () =>
    startTransition(async () => {
      if (persist && construction.attackSurface) {
        await saveArgueRevealConstruction(exercise.id, {
          attackSurface: construction.attackSurface,
          argument: construction.argument,
          bestResponse: construction.bestResponse,
          residual: construction.residual,
        });
      }
      setCompletedAt(new Date().toISOString());
      setStep(doneStep);
    });

  const copyResults = async () => {
    const results = {
      exercise: exercise.id,
      completedAt,
      items: exercise.items.map((item, c) => ({
        id: item.id,
        label: item.label,
        rounds: items[c].rounds.map((round) => ({
          chipsSelected: exercise.concepts
            .filter((concept) => round.chips.includes(concept.id))
            .map((concept) => concept.id),
          response: round.response,
          toolboxOpened: round.toolboxOpened,
        })),
        postReveal: {
          rating: items[c].rating,
          note: items[c].note.trim() ? items[c].note : null,
        },
      })),
      construction,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — leave the label unchanged rather than
      // claiming a copy happened.
    }
  };

  const progress =
    step >= doneStep
      ? " · Summary"
      : step === constructionStep
        ? " · Construction"
        : step >= 1
          ? ` · Argument ${step} of ${exercise.items.length}`
          : "";

  // Mirror the server sanitizer (trimmed minimums + storable text) so a
  // gated advance can never be silently rejected server-side.
  const meetsMin = (value: string, min: number) =>
    value.trim().length >= min && isStorableText(value);

  const constructionValid =
    construction.attackSurface !== null &&
    meetsMin(construction.argument, bounds.responseMinChars) &&
    meetsMin(construction.bestResponse, bounds.responseMinChars) &&
    meetsMin(construction.residual, bounds.residualMinChars);

  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
        {exercise.numberLabel ?? EXERCISE_TYPE_LABELS["argue-reveal"]}
        {progress}
      </p>

      <h3 className="text-lg font-semibold tracking-tight">{exercise.title}</h3>
      <Paragraphs text={exercise.prompt} className="mt-2 text-sm" />
      {exercise.guidance && (
        <Paragraphs
          text={exercise.guidance}
          className="text-muted-foreground mt-2 text-sm"
        />
      )}
      {exercise.items.map((item, c) => {
        if (step < c + 1) return null;
        const state = items[c];
        const active = step === c + 1;
        const allRoundsSubmitted = state.rounds.every((r) => r.submitted);
        return (
          <section
            key={item.id}
            ref={(el) => {
              sectionRefs.current[c + 1] = el;
            }}
            className="border-border mt-6 scroll-mt-20 border-t pt-5"
          >
            {item.rounds.map((round, k) => {
              const roundState = state.rounds[k];
              if (k > 0 && !state.rounds[k - 1].submitted) return null;
              return (
                <div key={k} className={cn("flex flex-col", k > 0 && "mt-5")}>
                  {/* Critic — left, red. */}
                  <div className="max-w-[88%] self-start">
                    <p className="text-xs font-medium tracking-wide text-red-700 uppercase dark:text-red-400">
                      {k === 0 ? "The critic argues:" : "The critic pushes back:"}
                    </p>
                    <div className="mt-1.5 rounded-2xl rounded-tl-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
                      {round.critique}
                    </div>
                  </div>

                  {/* You — right, blue. */}
                  <div className="mt-4 w-full max-w-[88%] self-end">
                    <p className="text-right text-xs font-medium tracking-wide text-blue-700 uppercase dark:text-blue-400">
                      Your counterargument
                    </p>
                    {roundState.submitted ? (
                      <div className="mt-1.5 rounded-2xl rounded-tr-sm border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm">
                        {roundState.response}
                      </div>
                    ) : (
                      <div className="mt-1.5 rounded-2xl rounded-tr-sm border border-blue-500/30 bg-blue-500/10 p-3">
                        <Textarea
                          aria-label={
                            k === 0
                              ? "Your response"
                              : "Your response to the pushback"
                          }
                          placeholder={`Your response, in 2–3 sentences.`}
                          value={roundState.response}
                          disabled={pending}
                          maxLength={bounds.responseMaxChars}
                          rows={4}
                          onChange={(e) =>
                            setRound(c, k, { response: e.target.value })
                          }
                          className="bg-background resize-y"
                        />
                        <CharCount
                          len={roundState.response.trim().length}
                          min={bounds.responseMinChars}
                          max={bounds.responseMaxChars}
                        />
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            disabled={
                              !meetsMin(
                                roundState.response,
                                bounds.responseMinChars,
                              ) || pending
                            }
                            onClick={() => setRound(c, k, { submitted: true })}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Revealed defender response — right, neutral. */}
                  {roundState.submitted && (
                    <div className="mt-4 max-w-[88%] self-end">
                      <p className="text-muted-foreground text-right text-xs">
                        {exercise.revealFraming}
                      </p>
                      <div className="bg-muted mt-1.5 rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
                        {round.reveal}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {allRoundsSubmitted && (
              <div className="mt-4">
                {exercise.postRevealPrompt && (
                  <>
                    <p className="text-sm font-medium">
                      {exercise.postRevealPrompt}
                    </p>
                    <div className="mt-2">
                      <RatingSegment
                        value={state.rating}
                        disabled={!active || pending}
                        label={exercise.postRevealPrompt}
                        onSelect={(rating) => setItem(c, { rating })}
                      />
                    </div>
                    <Input
                      type="text"
                      aria-label="Why? (optional, one line)"
                      placeholder="Why? (optional, one line)"
                      maxLength={bounds.noteMaxChars}
                      value={state.note}
                      disabled={!active || pending}
                      onChange={(e) => setItem(c, { note: e.target.value })}
                      className="mt-2"
                    />
                  </>
                )}
                {active && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      disabled={
                        (!!exercise.postRevealPrompt && !state.rating) ||
                        !isStorableText(state.note) ||
                        pending
                      }
                      onClick={() => finishItem(c)}
                    >
                      {pending ? "Saving…" : "Next"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {step >= constructionStep && (
        <section
          ref={(el) => {
            sectionRefs.current[constructionStep] = el;
          }}
          className="border-border mt-6 scroll-mt-20 border-t pt-5"
        >
          <h4 className="font-semibold">Now build your own.</h4>
          <Paragraphs
            text={exercise.construction.intro}
            className="text-muted-foreground mt-1.5 text-sm"
          />

          <p className="text-muted-foreground mt-4 mb-1.5 text-xs font-medium tracking-wide uppercase">
            Step 1 — attack surface
          </p>
          <div className="space-y-1.5">
            {exercise.construction.surfaces.map((surface) => {
              const on = construction.attackSurface === surface.id;
              return (
                <button
                  key={surface.id}
                  type="button"
                  aria-pressed={on}
                  disabled={step >= doneStep || pending}
                  onClick={() =>
                    setConstruction((prev) => ({
                      ...prev,
                      attackSurface: surface.id,
                    }))
                  }
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:opacity-60",
                    on
                      ? "border-foreground bg-muted"
                      : "border-border hover:enabled:bg-muted",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full border",
                      on ? "border-foreground bg-foreground" : "border-border",
                    )}
                  />
                  {surface.text}
                </button>
              );
            })}
          </div>

          <p className="text-muted-foreground mt-4 mb-1.5 text-xs font-medium tracking-wide uppercase">
            Step 2
          </p>
          {(
            [
              {
                key: "argument" as const,
                label: "Your argument",
                sublabel: null,
                placeholder: "2–3 sentences.",
                min: bounds.responseMinChars,
                max: bounds.responseMaxChars,
                rows: 4,
              },
              {
                key: "bestResponse" as const,
                label: "The best response you can give it",
                sublabel: null,
                placeholder: "2–3 sentences.",
                min: bounds.responseMinChars,
                max: bounds.responseMaxChars,
                rows: 4,
              },
              {
                key: "residual" as const,
                label: "The residual",
                sublabel: "One sentence: what does that response not resolve?",
                placeholder: undefined,
                min: bounds.residualMinChars,
                max: bounds.residualMaxChars,
                rows: 2,
              },
            ]
          ).map((field) => (
            <div key={field.key} className="mt-3">
              <label
                htmlFor={`${exercise.id}-${field.key}`}
                className="block text-sm font-medium"
              >
                {field.label}
              </label>
              {field.sublabel && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {field.sublabel}
                </p>
              )}
              <Textarea
                id={`${exercise.id}-${field.key}`}
                placeholder={field.placeholder}
                value={construction[field.key]}
                disabled={step >= doneStep || pending}
                maxLength={field.max}
                rows={field.rows}
                onChange={(e) =>
                  setConstruction((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="mt-1.5 resize-y"
              />
              <CharCount
                len={construction[field.key].trim().length}
                min={field.min}
                max={field.max}
              />
            </div>
          ))}

          {step === constructionStep && (
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                disabled={!constructionValid || pending}
                onClick={finishConstruction}
              >
                {pending ? "Saving…" : "Finish"}
              </Button>
            </div>
          )}
        </section>
      )}

      {step >= doneStep && (
        <section
          ref={(el) => {
            sectionRefs.current[doneStep] = el;
          }}
          className="border-border mt-6 scroll-mt-20 border-t pt-5"
        >
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Summary
          </p>
          <div className="border-border divide-border divide-y rounded-lg border">
            {exercise.items.map((item, c) => (
              <div key={item.id} className="space-y-1.5 p-3 text-sm">
                <h5 className="font-medium">{item.title}</h5>
                {items[c].rounds.map((round, k) => (
                  <p key={k} className="text-muted-foreground">
                    {item.rounds.length > 1 && (
                      <span className="text-foreground mr-1.5 text-xs font-medium">
                        Round {k + 1}
                      </span>
                    )}
                    {round.response}
                  </p>
                ))}
                {(items[c].rating || items[c].note.trim()) && (
                  <p className="text-muted-foreground">
                    <span className="text-foreground mr-1.5 text-xs font-medium">
                      Post-reveal
                    </span>
                    {items[c].rating &&
                      ARGUE_REVEAL_RATING_LABELS[items[c].rating]}
                    {items[c].note.trim() ? ` — ${items[c].note}` : ""}
                  </p>
                )}
              </div>
            ))}
            <div className="space-y-1.5 p-3 text-sm">
              <h5 className="font-medium">Construction</h5>
              <p className="text-muted-foreground">
                <span className="text-foreground mr-1.5 text-xs font-medium">
                  Attack surface
                </span>
                {
                  exercise.construction.surfaces.find(
                    (s) => s.id === construction.attackSurface,
                  )?.text
                }
              </p>
              <p className="text-muted-foreground">
                <span className="text-foreground mr-1.5 text-xs font-medium">
                  Your argument
                </span>
                {construction.argument}
              </p>
              <p className="text-muted-foreground">
                <span className="text-foreground mr-1.5 text-xs font-medium">
                  Best response
                </span>
                {construction.bestResponse}
              </p>
              <p className="text-muted-foreground">
                <span className="text-foreground mr-1.5 text-xs font-medium">
                  Residual
                </span>
                {construction.residual}
              </p>
            </div>
          </div>

          {scoringSlot ?? (
            <div className="bg-muted mt-4 rounded-lg p-4">
              <p className="text-sm font-medium">Scoring</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Sign in to get automated feedback on your reasoning.
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="outline" onClick={copyResults}>
              {copied ? "Copied ✓" : "Copy results (JSON)"}
            </Button>
          </div>
        </section>
      )}
    </aside>
  );
}
