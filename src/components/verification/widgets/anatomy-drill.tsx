"use client";

import { useState } from "react";
import { ArrowRight, Check, CircleAlert, RotateCcw, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CARDS,
  COPY,
  JUDGMENT,
  NULLBIN,
  ORGANS,
  PROTOCOL,
  organOf,
  type Card,
} from "@/lib/verification/data/anatomy-drill";
import {
  applyDrop,
  type CardResult,
  type FeedbackKind,
} from "@/lib/verification/engines/anatomy-drill";
import { DragProvider, Draggable, DropZone } from "../kit/drag";
import type { VerificationWidgetProps } from "../kit/types";

type Phase = "intro" | "drill" | "feedback" | "summary";

interface FeedbackState {
  kind: FeedbackKind;
  msg: string;
  autoPlaced: boolean;
}

// Feedback-tier -> semantic accent, ALWAYS paired with an icon + text label.
// clean = comply (green), near = exaggerate (amber), miss = defect (vermillion).
const TIER_ACCENT: Record<
  CardResult,
  { dot: string; text: string; border: string; label: string }
> = {
  clean: {
    dot: "bg-comply",
    text: "text-comply",
    border: "border-l-comply",
    label: "clean",
  },
  near: {
    dot: "bg-exaggerate",
    text: "text-exaggerate",
    border: "border-l-exaggerate",
    label: "defensible",
  },
  miss: {
    dot: "bg-defect",
    text: "text-defect",
    border: "border-l-defect",
    label: "miss",
  },
};

function feedbackTier(kind: FeedbackKind): CardResult {
  if (kind === "good") return "clean";
  if (kind === "near") return "near";
  return "miss"; // good-after, retry, reveal
}

const FEEDBACK_HEAD: Record<FeedbackKind, string> = {
  good: "Correct",
  "good-after": "Correct (second read)",
  near: "Defensible — here is the sharper tag",
  retry: "Not this organ — look again",
  reveal: "Filed for you",
};

/** Small categorical organ swatch — decorative colour always paired with the numbered name. */
function OrganDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

/**
 * The Anatomy Drill — sort 13 short agreement excerpts into the seven "organs"
 * of a verifiable agreement (plus a null "no organ" bin). Feedback tiers: a
 * clean organ match, a defensible near-tag (auto-placed, amber), a retry on the
 * first wrong drop, and a reveal that auto-files + shows the answer on the
 * second. Ends with a graded summary and an ungraded negotiating-priority pick.
 * Bridged: `onComplete()` fires once, when the drill reaches the summary.
 */
export function AnatomyDrill({ onComplete }: VerificationWidgetProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [results, setResults] = useState<(CardResult | undefined)[]>([]);
  const [fb, setFb] = useState<FeedbackState | null>(null);
  const [completed, setCompleted] = useState(false);
  const [judgment, setJudgment] = useState<number | null>(null);

  const card: Card | undefined = CARDS[idx];

  function finishToSummary() {
    setPhase("summary");
    if (!completed) {
      setCompleted(true);
      onComplete();
    }
  }

  function handleDrop(binN: number) {
    if (!card) return;
    const outcome = applyDrop(card, binN, attempts);
    setAttempts(outcome.attempts);
    setFb({ kind: outcome.kind, msg: outcome.msg, autoPlaced: outcome.autoPlaced });
    setPhase("feedback");
    if (outcome.result) {
      setResults((prev) => {
        const next = [...prev];
        next[idx] = outcome.result!;
        return next;
      });
    }
  }

  function nextCard() {
    // A retry keeps the same specimen in play.
    if (fb && fb.kind === "retry") {
      setPhase("drill");
      setFb(null);
      return;
    }
    const nextIdx = idx + 1;
    setFb(null);
    setAttempts(0);
    if (nextIdx >= CARDS.length) {
      setIdx(nextIdx);
      finishToSummary();
    } else {
      setIdx(nextIdx);
      setPhase("drill");
    }
  }

  function restart() {
    setPhase("intro");
    setIdx(0);
    setAttempts(0);
    setResults([]);
    setFb(null);
    setJudgment(null);
  }

  // Single drop handler for the whole widget: judgment chips in the summary,
  // organ bins during the drill.
  function onDrop(itemId: string, zoneId: string) {
    if (itemId.startsWith("judge-") && zoneId === "judge-slot") {
      const n = Number(itemId.slice("judge-".length));
      setJudgment(n);
      return;
    }
    if (itemId === "specimen" && zoneId.startsWith("bin-")) {
      handleDrop(Number(zoneId.slice("bin-".length)));
    }
  }

  return (
    <div className="not-prose my-6">
      <DragProvider
        onDrop={onDrop}
        className="border-border bg-card shadow-soft overflow-hidden rounded-xl border p-5"
      >
        {phase === "intro" ? (
          <Intro onBegin={() => setPhase("drill")} />
        ) : phase === "summary" ? (
          <Summary
            results={results}
            judgment={judgment}
            onPickJudgment={setJudgment}
            onRestart={restart}
          />
        ) : (
          <Drill
            idx={idx}
            card={card!}
            results={results}
            phase={phase}
            fb={fb}
            onNext={nextCard}
          />
        )}
      </DragProvider>
    </div>
  );
}

// ---------------------------------------------------------------- intro

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ul className="divide-border/60 divide-y text-sm">
        {ORGANS.map((o) => (
          <li key={o.key} className="flex items-baseline gap-2.5 py-1.5">
            <span className="mt-1.5">
              <OrganDot color={o.c} />
            </span>
            <span>
              <span className="font-semibold">
                {o.n}. {o.name}.
              </span>{" "}
              <span className="text-muted-foreground">{o.line}</span>
            </span>
          </li>
        ))}
        <li className="flex items-baseline gap-2.5 py-1.5">
          <span className="mt-1.5">
            <OrganDot color={NULLBIN.c} />
          </span>
          <span>
            <span className="font-semibold">No organ.</span>{" "}
            <span className="text-muted-foreground">{NULLBIN.d}</span>
          </span>
        </li>
      </ul>
      <p className="text-muted-foreground text-xs leading-relaxed">
        {COPY.introNote}
      </p>
      <Button onClick={onBegin} className="gap-2">
        {COPY.begin} <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- drill

function Drill({
  idx,
  card,
  results,
  phase,
  fb,
  onNext,
}: {
  idx: number;
  card: Card;
  results: (CardResult | undefined)[];
  phase: Phase;
  fb: FeedbackState | null;
  onNext: () => void;
}) {
  const inFeedback = phase === "feedback";
  const isRetry = inFeedback && fb?.kind === "retry";
  // The specimen card stays interactive during a retry; it's replaced by a
  // "filed under" confirmation once resolved.
  const showLiveSpecimen = !inFeedback || isRetry;
  const showFiled = inFeedback && fb?.kind !== "retry";
  const showBins = !showFiled; // bins hidden once the card is filed
  const filedOrgan = organOf(card.organ);

  const tier = fb ? feedbackTier(fb.kind) : null;
  const accent = tier ? TIER_ACCENT[tier] : null;

  return (
    <div className="space-y-4">
      {/* progress */}
      <div className="flex items-center gap-1.5">
        {CARDS.map((_, i) => {
          const r = i < idx ? results[i] : undefined;
          const done = i < idx && r;
          return (
            <span
              key={i}
              aria-hidden
              className={cn(
                "h-1.5 w-4 rounded-full",
                i === idx
                  ? "bg-foreground"
                  : done
                    ? TIER_ACCENT[r].dot
                    : "bg-muted",
              )}
            />
          );
        })}
        <span className="text-muted-foreground ml-auto text-xs">
          Specimen {idx + 1} of {CARDS.length}
        </span>
      </div>

      {/* live specimen (draggable) */}
      {showLiveSpecimen && (
        <div className="mx-auto max-w-2xl">
          <Draggable
            id="specimen"
            label={`Specimen ${idx + 1}: ${card.text.slice(0, 90)}…`}
            className={cn(
              "border-border bg-card shadow-soft rounded-xl border p-5",
              isRetry && "border-defect/50 motion-safe:animate-pulse",
            )}
            armedClassName="ring-primary ring-2"
          >
            <div className="text-muted-foreground mb-2 flex justify-between font-mono text-[10px] tracking-[0.14em] uppercase">
              <span>Specimen {idx + 1}</span>
              <span>source hidden</span>
            </div>
            <p className="text-foreground text-[17px] leading-relaxed">
              “{card.text}”
            </p>
          </Draggable>
          <p className="text-muted-foreground mt-2 text-center text-xs italic">
            Drag to a bin, click the card to arm it, or focus it and press Enter
            — then choose an organ.
          </p>
        </div>
      )}

      {/* filed confirmation (after resolution) */}
      {showFiled && (
        <div
          className="border-border bg-card shadow-soft mx-auto max-w-2xl rounded-xl border border-l-4 p-4"
          style={{ borderLeftColor: filedOrgan.c }}
        >
          <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase">
            <OrganDot color={filedOrgan.c} />
            Specimen {idx + 1} — filed under: {filedOrgan.name}
          </div>
          <p className="text-foreground/90 text-sm leading-relaxed">
            “{card.text}”
          </p>
        </div>
      )}

      {/* bins */}
      {showBins && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ORGANS.map((o) => (
            <Bin key={o.key} organ={o} />
          ))}
          <Bin organ={NULLBIN} full />
        </div>
      )}

      {/* feedback */}
      {inFeedback && fb && accent && (
        <div className="mx-auto max-w-2xl">
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "border-border bg-card rounded-lg border border-l-4 p-4 text-sm leading-relaxed",
              accent.border,
            )}
          >
            <div
              className={cn(
                "mb-1.5 flex items-center gap-1.5 font-semibold tracking-wide uppercase",
                accent.text,
              )}
              style={{ fontSize: "11px", letterSpacing: "0.08em" }}
            >
              <FeedbackIcon kind={fb.kind} />
              {FEEDBACK_HEAD[fb.kind]}
            </div>
            {fb.kind === "reveal" ? (
              <div className="space-y-2">
                <p>{fb.msg}</p>
                <p>
                  <span className="font-semibold">
                    Where it belongs: {filedOrgan.name}.
                  </span>{" "}
                  {card.ok}
                </p>
              </div>
            ) : (
              <p>{fb.msg}</p>
            )}
            {fb.kind !== "retry" && (
              <p className="border-border text-muted-foreground mt-2.5 border-t border-dashed pt-2 text-xs italic">
                Source: {card.source}
              </p>
            )}
          </div>
          {fb.kind === "retry" ? (
            <Button variant="outline" onClick={onNext} className="mt-4">
              Try again
            </Button>
          ) : (
            <Button onClick={onNext} className="mt-4 gap-2">
              {idx === CARDS.length - 1 ? "Finish" : "Next specimen"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackIcon({ kind }: { kind: FeedbackKind }) {
  if (kind === "good" || kind === "good-after")
    return <Check className="size-3.5" aria-hidden />;
  if (kind === "near") return <Scale className="size-3.5" aria-hidden />;
  return <CircleAlert className="size-3.5" aria-hidden />;
}

function Bin({
  organ,
  full = false,
}: {
  organ: (typeof ORGANS)[number] | typeof NULLBIN;
  full?: boolean;
}) {
  return (
    <DropZone
      id={`bin-${organ.n}`}
      label={`${organ.n}. ${organ.name}. ${organ.d}`}
      className={cn(
        "border-border hover:border-foreground/40 hover:bg-muted/50 min-h-[86px] rounded-lg border border-dashed p-2.5 transition-colors",
        full && "col-span-2 flex min-h-[56px] items-center gap-3 sm:col-span-4",
      )}
      overClassName="border-primary border-solid ring-2 ring-primary"
      armedClassName="border-primary/60 border-solid ring-2 ring-primary/60"
    >
      <div className="flex items-center gap-1.5 text-[13px] font-semibold">
        <OrganDot color={organ.c} />
        {organ.n}. {organ.name}
      </div>
      <div className="text-muted-foreground mt-1 text-[11px] leading-snug">
        {organ.d}
      </div>
    </DropZone>
  );
}

// ---------------------------------------------------------------- summary

function Summary({
  results,
  judgment,
  onPickJudgment,
  onRestart,
}: {
  results: (CardResult | undefined)[];
  judgment: number | null;
  onPickJudgment: (n: number) => void;
  onRestart: () => void;
}) {
  const clean = results.filter((r) => r === "clean").length;
  const near = results.filter((r) => r === "near").length;
  const miss = results.filter((r) => r === "miss").length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h4 className="text-lg font-semibold tracking-tight">
        {COPY.resultsHead}
      </h4>

      <div className="grid grid-cols-3 gap-3">
        <ScoreCard n={clean} label={COPY.scoreClean} tier="clean" />
        <ScoreCard n={near} label={COPY.scoreNear} tier="near" />
        <ScoreCard n={miss} label={COPY.scoreMiss} tier="miss" />
      </div>

      <p className="text-sm">{COPY.summaryLead}</p>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {COPY.tableHead.map((h) => (
                <th
                  key={h}
                  className="border-border text-muted-foreground border-b px-3 py-2 text-left font-mono text-[10px] tracking-[0.09em] uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COPY.tableRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="border-border border-b px-3 py-2 align-top"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        className="border-l-primary bg-muted/40 rounded-r-lg border-l-4 px-4 py-3 text-sm leading-relaxed"
        style={{ fontStyle: "normal" }}
      >
        {COPY.punch}
      </p>

      {/* one last drag — ungraded judgment */}
      <div className="space-y-3">
        <p className="text-sm">
          <span className="font-semibold">One last drag.</span>{" "}
          {COPY.judgmentLead.replace("One last drag. ", "")}
        </p>
        <div className="flex flex-wrap gap-2">
          {ORGANS.map((o) => (
            <Draggable
              key={o.key}
              id={`judge-${o.n}`}
              label={`${o.n}. ${o.name}`}
              className={cn(
                "border-border hover:bg-muted flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                judgment === o.n && "border-primary ring-primary/50 ring-1",
              )}
              armedClassName="ring-primary ring-2"
            >
              <span
                role="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => onPickJudgment(o.n)}
                className="flex items-center gap-1.5"
              >
                <OrganDot color={o.c} />
                {o.n}. {o.name}
              </span>
            </Draggable>
          ))}
        </div>

        <DropZone
          id="judge-slot"
          label="Your top negotiating priority"
          className={cn(
            "border-border flex min-h-[60px] items-center justify-center rounded-lg border-2 border-dashed px-4 text-sm transition-colors",
            judgment
              ? "text-foreground font-semibold"
              : "text-muted-foreground",
          )}
          overClassName="border-primary border-solid ring-2 ring-primary"
          armedClassName="border-primary/60 border-solid"
        >
          {judgment ? organOf(judgment).name : COPY.judgmentSlotEmpty}
        </DropZone>

        {judgment && (
          <div
            className="border-border border-l-primary rounded-lg border border-l-4 bg-card p-4 text-sm leading-relaxed"
            aria-live="polite"
          >
            <p>
              <span className="font-semibold">{organOf(judgment).name}.</span>{" "}
              {JUDGMENT[judgment]}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {COPY.judgmentNoRight}
            </p>
          </div>
        )}
      </div>

      {judgment && (
        <>
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold">Where this goes next:</span>{" "}
            {COPY.whereNext.replace("Where this goes next: ", "")}
          </p>
          <Button variant="outline" onClick={onRestart} className="gap-2">
            <RotateCcw className="size-4" aria-hidden /> {COPY.restart}
          </Button>
        </>
      )}

      {/* full protocol text */}
      <div className="border-border bg-card mt-2 rounded-lg border p-5">
        <h5 className="font-mono text-[12px] font-semibold tracking-[0.08em] uppercase">
          {COPY.protocolHead}
        </h5>
        <p className="text-muted-foreground mt-1 mb-4 text-xs leading-relaxed">
          {COPY.protocolNote}
        </p>
        <div className="space-y-3">
          {PROTOCOL.map((a) => (
            <div key={a.id}>
              <div className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
                {a.id}
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed">
                {a.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  n,
  label,
  tier,
}: {
  n: number;
  label: string;
  tier: CardResult;
}) {
  const accent = TIER_ACCENT[tier];
  return (
    <div className="border-border bg-muted/30 rounded-lg border p-3 text-center">
      <div className={cn("text-2xl font-bold", accent.text)}>{n}</div>
      <div className="text-muted-foreground text-[11px]">{label}</div>
    </div>
  );
}
