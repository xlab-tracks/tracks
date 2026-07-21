"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveAllocationScenario } from "@/app/actions/exercises";
import {
  ALLOCATION_DEFAULT_STEP,
  EXERCISE_TYPE_LABELS,
  type AllocationExercise,
} from "@/lib/content/types";
import {
  ALLOCATION_MAX_REASONING_CHARS,
  isStorableText,
  type AllocationScenarioEntry,
} from "@/lib/content/exercise-view";
import { MathText, Paragraphs } from "./math-text";

/**
 * Fixed-order categorical palette, one entry per agenda index — never cycled
 * (the two live allocation exercises share the same 7-agenda menu, so colors
 * follow the agenda across exercises). Order is deliberate: adjacent hues
 * alternate lightness so neighboring donut slices stay separable under CVD
 * (palette validated light-mode against the white card surface).
 */
const AGENDA_COLORS = [
  "#2563eb", // blue
  "#f59e0b", // amber
  "#047857", // emerald
  "#d946ef", // fuchsia
  "#0891b2", // cyan
  "#ef4444", // red
  "#7e22ce", // purple
];

const agendaColor = (index: number) => AGENDA_COLORS[index % AGENDA_COLORS.length];

// Values are step-multiples accumulated by ± clicks; rounding to 3 decimals
// absorbs float drift for any sensible step without misrendering e.g. 0.25.
const formatPeople = (value: number) => String(Math.round(value * 1000) / 1000);

/** Share of the total budget, as a percent string ("35%", "12.5%"). */
const formatShare = (value: number, total: number) =>
  `${String(Math.round((value / total) * 1000) / 10)}%`;

/**
 * Live donut of the current allocation. Purely presentational — the stepper
 * rows beside it are the legend and the accessible reading of the same data,
 * so the SVG is aria-hidden. Slices get a 2px card-colored outline as the
 * gap between neighbors; the unallocated remainder renders as a muted ring.
 */
function AllocationDonut({
  values,
  total,
}: {
  values: number[];
  total: number;
}) {
  const R = 56;
  const r = 30;
  const C = 64; // center
  const allocated = values.reduce((sum, v) => sum + v, 0);

  const point = (radius: number, frac: number) => {
    const angle = 2 * Math.PI * frac - Math.PI / 2; // 12 o'clock start
    return `${C + radius * Math.cos(angle)} ${C + radius * Math.sin(angle)}`;
  };
  const wedge = (from: number, to: number) => {
    const large = to - from > 0.5 ? 1 : 0;
    return [
      `M ${point(R, from)}`,
      `A ${R} ${R} 0 ${large} 1 ${point(R, to)}`,
      `L ${point(r, to)}`,
      `A ${r} ${r} 0 ${large} 0 ${point(r, from)}`,
      "Z",
    ].join(" ");
  };

  const slices: { key: number; from: number; to: number; color: string }[] = [];
  let cursor = 0;
  values.forEach((v, j) => {
    if (v > 0) {
      slices.push({
        key: j,
        from: cursor / total,
        to: (cursor + v) / total,
        color: agendaColor(j),
      });
      cursor += v;
    }
  });

  return (
    <svg viewBox="0 0 128 128" className="size-36 shrink-0" aria-hidden>
      {/* Unallocated remainder / empty state: a muted ring underneath. */}
      <circle
        cx={C}
        cy={C}
        r={(R + r) / 2}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={R - r}
      />
      {slices.map((s) =>
        s.to - s.from >= 0.9999 ? (
          // A lone full-budget slice: the arc path degenerates, so draw the
          // whole ring directly.
          <circle
            key={s.key}
            cx={C}
            cy={C}
            r={(R + r) / 2}
            fill="none"
            stroke={s.color}
            strokeWidth={R - r}
          />
        ) : (
          <path
            key={s.key}
            d={wedge(s.from, s.to)}
            fill={s.color}
            stroke="var(--card)"
            strokeWidth={2}
          />
        ),
      )}
      <text
        x={C}
        y={C - 2}
        textAnchor="middle"
        className="fill-foreground font-mono text-[15px] font-semibold tabular-nums"
      >
        {formatShare(allocated, total)}
      </text>
      <text
        x={C}
        y={C + 12}
        textAnchor="middle"
        className="fill-muted-foreground text-[8px]"
      >
        allocated
      </text>
    </svg>
  );
}

/**
 * Prompt text with light structure: newline-separated lines; runs of lines
 * starting with "- " render as a bulleted list, everything else as
 * paragraphs. Math renders per line.
 */
function PromptText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const blocks: { bullets: boolean; lines: string[] }[] = [];
  for (const line of lines) {
    const bullet = line.startsWith("- ");
    const last = blocks[blocks.length - 1];
    if (last && last.bullets === bullet) last.lines.push(line);
    else blocks.push({ bullets: bullet, lines: [line] });
  }
  return (
    <>
      {blocks.map((block, i) =>
        block.bullets ? (
          <ul key={i} className={cn("mt-2 list-disc space-y-1 pl-4", className)}>
            {block.lines.map((line, j) => (
              <li key={j}>
                <MathText text={line.slice(2)} />
              </li>
            ))}
          </ul>
        ) : (
          block.lines.map((line, j) => (
            <p key={`${i}-${j}`} className={cn("mt-2 first:mt-0", className)}>
              <MathText text={line} />
            </p>
          ))
        ),
      )}
    </>
  );
}

/** Numeric percent (no sign) for the editable field: 4.5/10 → "45". */
const shareNumber = (value: number, total: number) =>
  String(Math.round((value / total) * 1000) / 10);

function Stepper({
  label,
  value,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  /** Also the whole budget — the displayed percentage is value / max. */
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  // Draft holds the field's text while the learner is typing; null means
  // "mirror the committed value". Committing parses, clamps to 0–100%, and
  // snaps to the step grid so typed values land where ± clicks would.
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null) {
      const parsed = Number.parseFloat(draft.replace("%", "").trim());
      if (Number.isFinite(parsed)) {
        const effort = (Math.min(100, Math.max(0, parsed)) / 100) * max;
        onChange(Math.min(max, Math.round(effort / step) * step));
      }
      setDraft(null);
    }
  };
  const buttonClass =
    "text-foreground hover:enabled:bg-muted disabled:text-muted-foreground/40 h-8 w-8 text-base leading-none";
  return (
    <span
      role="group"
      aria-label={label}
      className="border-border bg-background inline-flex items-stretch overflow-hidden rounded-md border"
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={disabled || value <= 0}
        onClick={() => onChange(Math.max(0, value - step))}
        className={buttonClass}
      >
        −
      </button>
      <span className="border-border text-foreground flex items-center border-x pr-2 font-mono text-sm font-semibold tabular-nums">
        <input
          type="text"
          inputMode="decimal"
          aria-label={`${label} — percent of the budget`}
          value={draft ?? shareNumber(value, max)}
          disabled={disabled}
          onFocus={(e) => {
            setDraft(shareNumber(value, max));
            e.currentTarget.select();
          }}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            else if (e.key === "Escape") {
              setDraft(null);
              e.currentTarget.blur();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setDraft(null);
              onChange(Math.min(max, value + step));
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setDraft(null);
              onChange(Math.max(0, value - step));
            }
          }}
          className="w-10 bg-transparent text-right outline-none"
        />
        <span aria-hidden>%</span>
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
        className={buttonClass}
      >
        +
      </button>
    </span>
  );
}

/**
 * The full allocation flow in one card: an intro (title, prompt, agendas),
 * one step per scenario (steppers + total counter + reasoning, gated before
 * advancing), and a summary (table, stacked bars, copyable JSON). Scenarios
 * persist via `saveAllocationScenario` as they're completed — a no-op for
 * signed-out visitors, who can still work through the exercise.
 */
export function AllocationExerciseCard({
  exercise,
  initialScenarios,
  initialCompletedAt,
  persist = false,
}: {
  exercise: AllocationExercise;
  initialScenarios?: Record<string, AllocationScenarioEntry>;
  /** When the learner previously submitted every scenario (ISO timestamp). */
  initialCompletedAt?: string;
  /** Signed-in only — signed-out visitors skip the (no-op) server round-trip. */
  persist?: boolean;
}) {
  const step = exercise.step ?? ALLOCATION_DEFAULT_STEP;
  const minChars = exercise.minReasoningChars ?? 0;
  const scenarioCount = exercise.scenarios.length;
  const hasFullSubmission = exercise.scenarios.every(
    (s) => initialScenarios?.[s.id],
  );

  // "intro" | "summary" | index of the scenario being edited.
  const [view, setView] = useState<"intro" | "summary" | number>("intro");
  const [allocations, setAllocations] = useState<number[][]>(() =>
    exercise.scenarios.map((s) =>
      exercise.agendas.map(
        (a) => initialScenarios?.[s.id]?.allocation?.[a.id] ?? 0,
      ),
    ),
  );
  const [reasonings, setReasonings] = useState<string[]>(() =>
    exercise.scenarios.map((s) => initialScenarios?.[s.id]?.reasoning ?? ""),
  );
  // Advancing into a not-yet-visited scenario copies the previous allocation
  // as its starting point (so the "was N" ghosts start at ±0).
  const [visited, setVisited] = useState<boolean[]>(() =>
    exercise.scenarios.map(
      (s, i) => i === 0 || Boolean(initialScenarios?.[s.id]),
    ),
  );
  const [completedAt, setCompletedAt] = useState<string | null>(
    initialCompletedAt ?? null,
  );
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const setValue = (scenarioIndex: number, agendaIndex: number, value: number) =>
    setAllocations((prev) =>
      prev.map((row, i) =>
        i === scenarioIndex
          ? row.map((v, j) => (j === agendaIndex ? value : v))
          : row,
      ),
    );

  const allocationRecord = (scenarioIndex: number) =>
    Object.fromEntries(
      exercise.agendas.map((a, j) => [a.id, allocations[scenarioIndex][j]]),
    );

  const goNext = (index: number) =>
    startTransition(async () => {
      if (persist) {
        await saveAllocationScenario(
          exercise.id,
          exercise.scenarios[index].id,
          allocationRecord(index),
          reasonings[index],
        );
      }
      if (index === scenarioCount - 1) {
        setCompletedAt(new Date().toISOString());
        setView("summary");
        return;
      }
      setAllocations((prev) =>
        visited[index + 1]
          ? prev
          : prev.map((row, i) => (i === index + 1 ? [...prev[index]] : row)),
      );
      setVisited((prev) => prev.map((v, i) => (i === index + 1 ? true : v)));
      setView(index + 1);
    });

  const copyResults = async () => {
    const results = {
      exercise: exercise.id,
      completedAt,
      scenarios: exercise.scenarios.map((s, i) => ({
        id: s.id,
        title: s.title,
        allocation: allocationRecord(i),
        reasoning: reasonings[i],
      })),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — leave the
      // button label unchanged rather than claiming a copy happened.
    }
  };

  // Back-navigation can leave a scenario mid-edit; only offer the summary
  // while every scenario still holds a complete, valid state.
  const allScenariosValid = exercise.scenarios.every((s, i) => {
    const total = allocations[i].reduce((sum, v) => sum + v, 0);
    return (
      Math.abs(total - exercise.totalPeople) < 1e-9 &&
      reasonings[i].trim().length >= minChars
    );
  });

  let body: React.ReactNode;
  if (view === "intro") {
    body = (
      <>
        <h3 className="text-lg font-semibold tracking-tight">{exercise.title}</h3>
        <div className="mt-2">
          <PromptText text={exercise.prompt} className="text-sm" />
        </div>
        <p className="text-muted-foreground mt-4 mb-1.5 text-xs font-medium tracking-wide uppercase">
          Agendas
        </p>
        <ul className="border-border divide-border divide-y rounded-lg border">
          {exercise.agendas.map((agenda, j) => (
            <li
              key={agenda.id}
              className="flex items-center gap-2.5 px-3 py-2 text-sm"
            >
              <span
                aria-hidden
                className="inline-block size-2.5 shrink-0 rounded-[3px]"
                style={{ background: agendaColor(j) }}
              />
              {agenda.label}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => setView(0)}>
            Begin
          </Button>
          {(hasFullSubmission || completedAt != null) && allScenariosValid && (
            <Button size="sm" variant="outline" onClick={() => setView("summary")}>
              View summary
            </Button>
          )}
        </div>
      </>
    );
  } else if (view === "summary") {
    body = (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="text-muted-foreground py-2 pr-2 text-left text-xs font-medium tracking-wide uppercase">
                  Agenda
                </th>
                {exercise.scenarios.map((s, i) => (
                  <th
                    key={s.id}
                    className="text-muted-foreground px-2 py-2 text-right text-xs font-medium tracking-wide uppercase"
                  >
                    Scenario {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exercise.agendas.map((agenda, j) => (
                <tr key={agenda.id} className="border-border border-b last:border-b-0">
                  <td className="py-2 pr-2">
                    <span
                      aria-hidden
                      className="mr-2 inline-block size-2.5 rounded-[3px] align-baseline"
                      style={{ background: agendaColor(j) }}
                    />
                    {agenda.label}
                  </td>
                  {exercise.scenarios.map((s, i) => (
                    <td
                      key={s.id}
                      className="px-2 py-2 text-right font-mono tabular-nums"
                    >
                      {formatShare(allocations[i][j], exercise.totalPeople)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 space-y-1.5">
          {exercise.scenarios.map((scenario, i) => (
            <div key={scenario.id} className="flex items-center gap-3">
              <span className="text-muted-foreground w-20 shrink-0 font-mono text-xs">
                Scenario {i + 1}
              </span>
              <div className="border-border flex h-3 flex-1 overflow-hidden rounded-sm border">
                {exercise.agendas.map((agenda, j) =>
                  allocations[i][j] > 0 ? (
                    <span
                      key={agenda.id}
                      title={`${agenda.label}: ${formatShare(allocations[i][j], exercise.totalPeople)}`}
                      style={{
                        width: `${(allocations[i][j] / exercise.totalPeople) * 100}%`,
                        background: agendaColor(j),
                      }}
                    />
                  ) : null,
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted mt-5 rounded-lg p-4">
          <p className="text-sm font-medium">Scoring</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Automated feedback on your reasoning is coming soon.
          </p>
          <Button size="sm" variant="outline" disabled className="mt-3">
            Submit for scoring
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setView(scenarioCount - 1)}
          >
            Back
          </Button>
          <Button size="sm" variant="outline" onClick={copyResults}>
            {copied ? "Copied ✓" : "Copy results (JSON)"}
          </Button>
        </div>
      </>
    );
  } else {
    const index = view;
    const scenario = exercise.scenarios[index];
    const row = allocations[index];
    const total = row.reduce((sum, v) => sum + v, 0);
    const exact = Math.abs(total - exercise.totalPeople) < 1e-9;
    const over = total > exercise.totalPeople + 1e-9;
    const chars = reasonings[index].trim().length;
    const reasonId = `${exercise.id}-reasoning-${index}`;

    body = (
      <>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="font-medium">{scenario.title}</p>
          {/* Newline-separated descriptions render as a bulleted list, with a
              leading "Label:" prefix (if any) bolded per line; single-line
              descriptions stay prose. */}
          {scenario.description.includes("\n") ? (
            <ul className="text-muted-foreground mt-1.5 list-disc space-y-1 pl-4 text-sm">
              {scenario.description.split("\n").map((line, i) => {
                const colon = line.indexOf(": ");
                return (
                  <li key={i}>
                    {colon > 0 ? (
                      <>
                        <span className="text-foreground font-medium">
                          {line.slice(0, colon)}:
                        </span>{" "}
                        <MathText text={line.slice(colon + 2)} />
                      </>
                    ) : (
                      <MathText text={line} />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Paragraphs
              text={scenario.description}
              className="text-muted-foreground mt-1.5 text-sm"
            />
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-x-5 gap-y-3 sm:flex-row sm:items-start">
          <AllocationDonut values={row} total={exercise.totalPeople} />
          <ul className="border-border divide-border min-w-0 flex-1 divide-y self-stretch rounded-lg border">
            {exercise.agendas.map((agenda, j) => {
              const previous = index > 0 ? allocations[index - 1][j] : null;
              const delta = previous === null ? 0 : row[j] - previous;
              return (
                <li
                  key={agenda.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2.5"
                >
                  <span
                    aria-hidden
                    className="inline-block size-2.5 shrink-0 rounded-[3px]"
                    style={{ background: agendaColor(j) }}
                  />
                  <span className="min-w-0 flex-1 text-sm">{agenda.label}</span>
                  {previous !== null && (
                    <span className="text-muted-foreground font-mono text-xs whitespace-nowrap tabular-nums">
                      was {formatShare(previous, exercise.totalPeople)}
                      {delta !== 0 && (
                        <span className="border-border ml-1.5 rounded-full border px-1.5">
                          {delta > 0 ? "+" : "−"}
                          {formatShare(Math.abs(delta), exercise.totalPeople)}
                        </span>
                      )}
                    </span>
                  )}
                  <Stepper
                    label={agenda.label}
                    value={row[j]}
                    max={exercise.totalPeople}
                    step={step}
                    disabled={pending}
                    onChange={(value) => setValue(index, j, value)}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        <p
          aria-live="polite"
          className={cn(
            "mt-2 font-mono text-sm font-medium tabular-nums",
            exact
              ? "text-emerald-700"
              : over
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          {exact ? "✓ " : ""}
          {formatShare(total, exercise.totalPeople)} of {formatPeople(exercise.totalPeople)}{" "}
          researchers&rsquo; effort allocated
        </p>

        <label htmlFor={reasonId} className="mt-4 block text-sm font-medium">
          {index === 0
            ? "Explain your allocation."
            : "Explain your allocation — in particular, what changed (or didn't) from the previous scenario, and why."}
        </label>
        <Textarea
          id={reasonId}
          value={reasonings[index]}
          onChange={(e) => {
            const value = e.target.value;
            setReasonings((prev) =>
              prev.map((r, i) => (i === index ? value : r)),
            );
          }}
          rows={5}
          maxLength={ALLOCATION_MAX_REASONING_CHARS}
          disabled={pending}
          className="mt-2 resize-y"
        />
        {minChars > 0 && (
          <p
            className={cn(
              "mt-1 text-right font-mono text-xs",
              chars >= minChars ? "text-emerald-700" : "text-muted-foreground",
            )}
          >
            {chars} / {minChars}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setView(index === 0 ? "intro" : index - 1)}
          >
            Back
          </Button>
          <Button
            size="sm"
            disabled={
              !exact ||
              chars < minChars ||
              // Mirror the server sanitizer so a gated advance can never be
              // silently rejected server-side.
              !isStorableText(reasonings[index]) ||
              pending
            }
            onClick={() => goNext(index)}
          >
            {pending
              ? "Saving…"
              : index === scenarioCount - 1
                ? "Finish"
                : "Next scenario"}
          </Button>
        </div>
      </>
    );
  }

  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
        {EXERCISE_TYPE_LABELS.allocation}
        {typeof view === "number" &&
          ` · Scenario ${view + 1} of ${scenarioCount}`}
        {view === "summary" && " · Summary"}
      </p>
      {body}
    </aside>
  );
}
