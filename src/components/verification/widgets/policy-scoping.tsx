"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DragProvider, Draggable, DropZone } from "../kit/drag";
import type { VerificationWidgetProps } from "../kit/types";
import {
  AXIS_TIPS,
  cellLabel,
  EXC_ANSWERS,
  POLICIES,
  POLICY_SCOPING_COPY as C,
  type Policy,
  type Verdict,
  verdictLabel,
} from "@/lib/verification/data/policy-scoping";

/* Grid geometry.
   Columns left→right: feasibility low→high  (f0, f1, f2).
   Rows    top→bottom: effectiveness high→low (e2, e1, e0). */
const FEAS_KEYS = ["f0", "f1", "f2"] as const;
const EFFECT_ROWS = ["e2", "e1", "e0"] as const; // top→bottom
const ROW_LABELS = ["High", "Med", "Low"] as const;
const COL_LABELS = ["Low", "Med", "High"] as const;

const VERDICT_ACCENT: Record<Verdict, string> = {
  right: "border-comply",
  close: "border-exaggerate",
  wrong: "border-defect",
};
const VERDICT_TEXT: Record<Verdict, string> = {
  right: "text-comply",
  close: "text-exaggerate",
  wrong: "text-defect",
};
const VERDICT_LEFT: Record<Verdict, string> = {
  right: "border-l-comply",
  close: "border-l-exaggerate",
  wrong: "border-l-defect",
};

interface Placement {
  cell: string | null;
  verdict: Verdict | null;
}

/** Small coloured dot for a policy bucket. */
function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-2.5 flex-none rounded-full"
      style={{ background: color }}
    />
  );
}

/**
 * "Scoping an Anti-ASI Policy" — drag five policy buckets onto a 3×3
 * feasibility × effectiveness plane, check placements against a 45-entry verdict
 * table, reveal the answer-key frontier + ghost placements, then answer a
 * retry-until-correct exception question that unlocks the closing. Bridged:
 * onComplete() fires once, when the exception question is answered correctly.
 *
 * Oddity preserved from the source: two buckets (self-governance, domestic
 * regulation) both grade "right" in cell f2e0 — cells hold multiple chips.
 */
export function PolicyScoping({ onComplete }: VerificationWidgetProps) {
  const [placements, setPlacements] = useState<Record<string, Placement>>(() =>
    Object.fromEntries(POLICIES.map((p) => [p.id, { cell: null, verdict: null }])),
  );
  const [checkedOnce, setCheckedOnce] = useState(false);
  const [keyOn, setKeyOn] = useState(false);
  const [excPicked, setExcPicked] = useState<string | null>(null);
  const [excDone, setExcDone] = useState(false);
  const completedRef = useRef(false);
  const liveRef = useRef<HTMLDivElement>(null);

  function say(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  const placedCount = POLICIES.filter((p) => placements[p.id].cell).length;
  const allPlaced = placedCount === 5;
  const verdicts = POLICIES.map((p) => placements[p.id].verdict);
  const anyVerdict = verdicts.some(Boolean);
  const allVerdicts = verdicts.every(Boolean);
  const rightCount = verdicts.filter((v) => v === "right").length;
  const closeCount = verdicts.filter((v) => v === "close").length;
  const allRight = allVerdicts && rightCount === 5;
  const excUnlocked = allRight || keyOn;

  // policyId -> chip for each cell (cells can hold multiple).
  const byCell = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of POLICIES) {
      const cell = placements[p.id].cell;
      if (cell) (map[cell] ??= []).push(p.id);
    }
    return map;
  }, [placements]);

  function handleDrop(itemId: string, zoneId: string) {
    setPlacements((prev) => {
      if (prev[itemId].cell === zoneId) return prev;
      return { ...prev, [itemId]: { cell: zoneId, verdict: null } };
    });
    const p = POLICIES.find((q) => q.id === itemId)!;
    say(`${p.name} placed at ${cellLabel(zoneId)}.`);
  }

  function check() {
    setCheckedOnce(true);
    let right = 0;
    setPlacements((prev) => {
      const next: Record<string, Placement> = { ...prev };
      for (const p of POLICIES) {
        const cell = prev[p.id].cell;
        if (!cell) continue;
        const combo = p.cells[cell];
        next[p.id] = { cell, verdict: combo.v };
        if (combo.v === "right") right++;
      }
      return next;
    });
    say(
      `Checked. ${right} of 5 on the frontier.` +
        (right === 5
          ? " All correct — the one-exception question is now available."
          : " Adjust placements and check again."),
    );
    if (right === 5) reveal();
  }

  function reveal() {
    setKeyOn(true);
    say(
      "Answer key revealed. " +
        POLICIES.map((p) => `${p.name}: ${p.keyWhy}`).join(" "),
    );
  }

  function reset() {
    setPlacements(
      Object.fromEntries(
        POLICIES.map((p) => [p.id, { cell: null, verdict: null }]),
      ),
    );
    setCheckedOnce(false);
    setKeyOn(false);
    setExcPicked(null);
    setExcDone(false);
    say("Reset. All five buckets returned to the tray.");
  }

  function pickException(id: string) {
    if (excDone) return;
    const a = EXC_ANSWERS[id];
    setExcPicked(id);
    if (a.ok) {
      setExcDone(true);
      if (!keyOn) reveal();
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      say("Correct. Exercise complete.");
    } else {
      say("Not quite. Try again.");
    }
  }

  return (
    <div className="not-prose my-6">
      <DragProvider onDrop={handleDrop}>
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          {/* ---------- left: tray + plane ---------- */}
          <div className="min-w-0">
            <p className="text-muted-foreground border-border bg-muted/40 mb-4 rounded-lg border px-3 py-2 text-xs">
              {C.hint}
            </p>

            {/* tray */}
            <div className="border-border mb-5 rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-[0.15em] uppercase">
                {C.trayLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {POLICIES.map((p) =>
                  placements[p.id].cell ? (
                    <div
                      key={p.id}
                      aria-hidden
                      className="border-border/60 text-muted-foreground/50 flex h-8 items-center rounded-full border border-dashed px-3 text-xs"
                    >
                      {p.name}
                    </div>
                  ) : (
                    <ChipTip key={p.id} policy={p} placement={placements[p.id]}>
                      <Draggable
                        id={p.id}
                        label={p.name}
                        className="border-border bg-card shadow-soft flex h-8 items-center gap-2 rounded-full border pr-3 pl-2.5 text-xs font-semibold"
                      >
                        <Dot color={p.colorRaw} />
                        {p.name}
                      </Draggable>
                    </ChipTip>
                  ),
                )}
              </div>
            </div>

            {/* plane: y-axis label + grid + x-axis label */}
            <div className="flex gap-2">
              {/* y axis */}
              <div className="flex flex-none items-center">
                <AxisTip tip={AXIS_TIPS.y}>
                  <span
                    className="text-foreground/70 [writing-mode:vertical-rl] rotate-180 cursor-help text-xs font-semibold whitespace-nowrap"
                    tabIndex={0}
                  >
                    {C.yTitle}{" "}
                    <span className="text-muted-foreground font-normal">
                      {C.ySub}
                    </span>{" "}
                    →
                  </span>
                </AxisTip>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex">
                  {/* row labels */}
                  <div className="flex w-9 flex-none flex-col">
                    {ROW_LABELS.map((rl) => (
                      <div
                        key={rl}
                        className="text-muted-foreground flex flex-1 items-center justify-end pr-1.5 font-mono text-[10px] tracking-[0.06em] uppercase"
                      >
                        {rl}
                      </div>
                    ))}
                  </div>

                  {/* grid */}
                  <div className="border-border bg-card relative min-w-0 flex-1 overflow-hidden rounded-lg border">
                    {keyOn && <FrontierOverlay />}
                    <div className="relative z-[5] grid grid-cols-3 grid-rows-3">
                      {EFFECT_ROWS.map((eKey) =>
                        FEAS_KEYS.map((fKey) => {
                          const cellKey = `${fKey}${eKey}`;
                          const ids = byCell[cellKey] ?? [];
                          const isCorner =
                            cellKey === "f2e2" || cellKey === "f0e0";
                          return (
                            <DropZone
                              key={cellKey}
                              id={cellKey}
                              label={cellLabel(cellKey)}
                              className={cn(
                                "relative flex min-h-[5.5rem] flex-col gap-1.5 p-2",
                                "[&:not(:nth-child(3n))]:border-r [&:nth-child(-n+6)]:border-b",
                                "border-border/60",
                                isCorner && "bg-muted/40",
                              )}
                              overClassName="ring-primary ring-2 z-10"
                              armedClassName="ring-primary/50 ring-2 z-10"
                            >
                              {cellKey === "f2e2" && (
                                <CornerNote
                                  className="right-2 top-1.5"
                                  label={C.cornerTR}
                                  tip={AXIS_TIPS.tr}
                                />
                              )}
                              {cellKey === "f0e0" && (
                                <CornerNote
                                  className="left-2 bottom-1.5"
                                  label={C.cornerBL}
                                  tip={AXIS_TIPS.bl}
                                />
                              )}
                              {ids.map((id) => {
                                const p = POLICIES.find((q) => q.id === id)!;
                                const pl = placements[id];
                                return (
                                  <ChipTip key={id} policy={p} placement={pl}>
                                    <Draggable
                                      id={id}
                                      label={p.name}
                                      className={cn(
                                        "border-border bg-card shadow-soft z-10 flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-2 text-[11px] leading-tight font-semibold",
                                        pl.verdict &&
                                          VERDICT_ACCENT[pl.verdict],
                                      )}
                                    >
                                      {pl.verdict && (
                                        <VerdictBadge verdict={pl.verdict} />
                                      )}
                                      <Dot color={p.colorRaw} />
                                      <span className="truncate">{p.short}</span>
                                    </Draggable>
                                  </ChipTip>
                                );
                              })}
                            </DropZone>
                          );
                        }),
                      )}
                    </div>

                    {/* ghost answer-key placements */}
                    {keyOn &&
                      POLICIES.map((p) => (
                        <GhostTip key={p.id} policy={p} />
                      ))}
                  </div>
                </div>

                {/* col labels */}
                <div className="ml-9 flex">
                  {COL_LABELS.map((cl) => (
                    <div
                      key={cl}
                      className="text-muted-foreground flex-1 pt-1.5 text-center font-mono text-[10px] tracking-[0.06em] uppercase"
                    >
                      {cl}
                    </div>
                  ))}
                </div>
                <div className="ml-9 pt-1 text-center">
                  <AxisTip tip={AXIS_TIPS.x}>
                    <span
                      className="text-foreground/70 cursor-help text-xs font-semibold"
                      tabIndex={0}
                    >
                      {C.xTitle}{" "}
                      <span className="text-muted-foreground font-normal">
                        {C.xSub}
                      </span>{" "}
                      →
                    </span>
                  </AxisTip>
                </div>
                <p className="text-muted-foreground ml-9 pt-1.5 text-center text-[11px] italic">
                  {C.caption}
                </p>
              </div>
            </div>
          </div>

          {/* ---------- right: rail ---------- */}
          <aside className="flex min-w-0 flex-col gap-4">
            {/* stats */}
            <div className="border-border flex flex-col gap-1.5 border-y py-3">
              {C.stats.map((s) => (
                <div key={s.n} className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold">{s.n}</span>
                  <span className="text-muted-foreground text-xs">{s.l}</span>
                </div>
              ))}
            </div>

            {/* controls */}
            <div>
              <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-[0.15em] uppercase">
                {C.exerciseLabel}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={check} disabled={!allPlaced}>
                  {C.checkBtn}
                </Button>
                <Button
                  variant="outline"
                  onClick={reveal}
                  disabled={!checkedOnce || keyOn}
                >
                  {C.revealBtn}
                </Button>
                <Button variant="ghost" onClick={reset} className="gap-2">
                  <RotateCcw className="size-4" aria-hidden /> {C.resetBtn}
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                  {allVerdicts ? (
                    allRight ? (
                      <span className="text-foreground font-semibold">
                        5 of 5 on the frontier.
                      </span>
                    ) : (
                      <>
                        <span className="text-foreground font-semibold">
                          {rightCount}
                        </span>{" "}
                        on the frontier ·{" "}
                        <span className="text-foreground font-semibold">
                          {closeCount}
                        </span>{" "}
                        close ·{" "}
                        <span className="text-foreground font-semibold">
                          {5 - rightCount - closeCount}
                        </span>{" "}
                        off — drag and re-check
                      </>
                    )
                  ) : allPlaced ? (
                    "All placed — check when ready"
                  ) : (
                    `${placedCount} of 5 placed`
                  )}
                </p>
              </div>
            </div>

            {/* results */}
            {anyVerdict && (
              <div className="flex flex-col gap-1.5">
                <p className="text-muted-foreground font-mono text-[10px] tracking-[0.15em] uppercase">
                  {C.resultsLabel}
                </p>
                {POLICIES.map((p) => {
                  const pl = placements[p.id];
                  if (!pl.verdict)
                    return (
                      <div
                        key={p.id}
                        className="border-border bg-muted/30 rounded-lg border border-l-[3px] p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Dot color={p.colorRaw} />
                          <span className="text-xs font-semibold">
                            {p.name}
                          </span>
                          <span className="text-muted-foreground ml-auto font-mono text-[9px] tracking-[0.1em] uppercase">
                            moved — recheck
                          </span>
                        </div>
                      </div>
                    );
                  const combo = p.cells[pl.cell!];
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "border-border bg-muted/30 rounded-lg border border-l-[3px] p-2",
                        VERDICT_LEFT[pl.verdict],
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Dot color={p.colorRaw} />
                        <span className="text-xs font-semibold">{p.name}</span>
                        <span
                          className={cn(
                            "ml-auto font-mono text-[9px] tracking-[0.1em] uppercase",
                            VERDICT_TEXT[pl.verdict],
                          )}
                        >
                          {verdictLabel(pl.verdict)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
                        {combo.t}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* exception panel */}
            {excUnlocked && (
              <div className="border-border bg-muted/30 rounded-lg border p-3">
                <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-[0.15em] uppercase">
                  {C.excLabel}
                </p>
                <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                  {C.excLead.pre}
                  <AxisTip tip={AXIS_TIPS.sec}>
                    <span
                      tabIndex={0}
                      className="decoration-muted-foreground/60 text-foreground cursor-help font-medium underline decoration-dotted underline-offset-2"
                    >
                      {C.excLead.sec}
                    </span>
                  </AxisTip>
                  {C.excLead.mid}
                  <b className="text-foreground">{C.excLead.bold}</b>
                  {C.excLead.post}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[...POLICIES].reverse().map((p) => {
                    const isPicked = excPicked === p.id;
                    const ok = EXC_ANSWERS[p.id].ok;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={excDone && !(isPicked && ok)}
                        onClick={() => pickException(p.id)}
                        className={cn(
                          "border-border flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-2 text-[11px] font-semibold transition-colors",
                          "hover:border-foreground/40 disabled:opacity-50",
                          isPicked && ok && "border-comply text-comply",
                          isPicked && !ok && "border-defect text-defect",
                        )}
                      >
                        <Dot color={p.colorRaw} />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
                {excPicked && (
                  <p
                    className="border-border text-muted-foreground mt-2.5 border-t pt-2.5 text-xs leading-relaxed [&_b]:text-foreground [&_b]:font-semibold"
                    aria-live="polite"
                    dangerouslySetInnerHTML={{ __html: EXC_ANSWERS[excPicked].t }}
                  />
                )}
              </div>
            )}

            {/* closing */}
            {excDone && (
              <div className="border-primary bg-card rounded-lg border p-3">
                <p className="text-primary flex items-center gap-1 text-xs font-semibold">
                  <Check className="size-3.5" aria-hidden />
                  {C.closingNext}
                </p>
              </div>
            )}

            <p className="border-border text-muted-foreground border-t pt-3 text-[10px] leading-relaxed">
              {C.foot}
            </p>
          </aside>
        </div>
      </DragProvider>

      <div ref={liveRef} aria-live="polite" className="sr-only" />
    </div>
  );
}

/* ---------- overlay: frontier + cascade, drawn from ghost fractions ---------- */
function FrontierOverlay() {
  // order matches the source: fp, cp, tc, dr, sg (strong→weak)
  const order = ["fp", "cp", "tc", "dr", "sg"];
  const pts = order.map((id) => {
    const p = POLICIES.find((q) => q.id === id)!;
    return [p.ghost.x * 100, p.ghost.y * 100] as [number, number];
  });
  // Catmull-Rom → cubic-bezier smoothing (verbatim from source drawOverlay).
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  const [tcx, tcy] = pts[2];
  const [drx, dry] = pts[3];
  const midX = (tcx + drx) / 2 + 3;
  const midY = (tcy + dry) / 2 + 5;
  const ang = (Math.atan2(dry - tcy, drx - tcx) * 180) / Math.PI;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[6] size-full"
    >
      <path
        d={d}
        fill="none"
        className="stroke-muted-foreground/60"
        strokeWidth={0.5}
        strokeDasharray="1.6 1.9"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={midX}
        y={midY}
        textAnchor="middle"
        transform={`rotate(${ang.toFixed(1)} ${midX} ${midY})`}
        className="fill-muted-foreground font-mono"
        style={{ fontSize: 2.6 }}
      >
        {C.frontierLabel}
      </text>
    </svg>
  );
}

/* ---------- ghost answer-key marker ---------- */
function GhostTip({ policy }: { policy: Policy }) {
  const isTarget = policy.id === "fp";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute z-[7] flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-dashed bg-card/90 px-2 py-0.5 text-[10px] whitespace-nowrap",
            "text-muted-foreground hover:text-foreground cursor-help",
            isTarget
              ? "border-defect border-solid ring-4 ring-defect/15"
              : "border-muted-foreground",
          )}
          style={{
            left: `${policy.ghost.x * 100}%`,
            top: `${policy.ghost.y * 100}%`,
          }}
        >
          <Dot color={policy.colorRaw} />
          {policy.short}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-pretty">
        <span className="font-semibold">{policy.name} — why here.</span>{" "}
        {policy.keyWhy}
      </TooltipContent>
    </Tooltip>
  );
}

/* ---------- chip tooltip (def, or verdict feedback once checked) ---------- */
function ChipTip({
  policy,
  placement,
  children,
}: {
  policy: Policy;
  placement: Placement;
  children: React.ReactNode;
}) {
  const combo =
    placement.verdict && placement.cell ? policy.cells[placement.cell] : null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-pretty">
        <span className="flex items-center gap-1.5 font-semibold">
          <Dot color={policy.colorRaw} />
          {policy.name}
        </span>
        {combo ? (
          <span className="mt-1 block">
            <span
              className={cn(
                "block font-mono text-[10px] tracking-[0.1em] uppercase",
                VERDICT_TEXT[combo.v],
              )}
            >
              {verdictLabel(combo.v)}
            </span>
            {combo.t}
          </span>
        ) : (
          <span className="mt-1 block">{policy.def}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/* ---------- axis / corner / securitization tooltip wrapper ---------- */
function AxisTip({
  tip,
  children,
}: {
  tip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-pretty">{tip}</TooltipContent>
    </Tooltip>
  );
}

function CornerNote({
  className,
  label,
  tip,
}: {
  className?: string;
  label: string;
  tip: string;
}) {
  return (
    <AxisTip tip={tip}>
      <span
        tabIndex={0}
        className={cn(
          "text-muted-foreground/60 hover:text-muted-foreground absolute z-[8] cursor-help font-mono text-[9px] tracking-[0.05em] select-none",
          className,
        )}
      >
        {label}
      </span>
    </AxisTip>
  );
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  if (verdict === "right")
    return <Check className={cn("size-3", VERDICT_TEXT.right)} aria-hidden />;
  if (verdict === "wrong")
    return <X className={cn("size-3", VERDICT_TEXT.wrong)} aria-hidden />;
  return (
    <ArrowRight
      className={cn("size-3 rotate-45", VERDICT_TEXT.close)}
      aria-hidden
    />
  );
}
