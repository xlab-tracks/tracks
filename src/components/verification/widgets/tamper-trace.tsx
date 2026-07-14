"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Dices, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  RED_TECHS,
  HONEST,
  BLUE_LAYERS,
  MATRIX,
  TAMPER_TRACE_COPY as C,
  DEBRIEF,
  type RedTechId,
  type BlueLayerId,
} from "@/lib/verification/data/tamper-trace";
import {
  budgets,
  techChance,
  falsePositiveChance,
  bandFor,
  THRESH,
  type Scenario,
} from "@/lib/verification/engines/tamper-trace";
import type { VerificationWidgetProps } from "../kit/types";

type Phase = "red" | "blue" | "resolve";

// Map the engine's CSS-var band colors onto app tokens (bands use good/warn/bad).
const BAND_COLOR: Record<string, string> = {
  "var(--good)": "text-comply",
  "var(--warn)": "text-exaggerate",
  "var(--bad)": "text-defect",
};

interface TechRow {
  name: string;
  hit: boolean;
  p: number;
  via: string;
}

interface Resolution {
  honest: boolean;
  fired: boolean;
  caughtAny: boolean;
  redEmpty: boolean;
  maxEvidence: number;
  band: string;
  bandColor: string;
  verdict: string;
  verdictTone: "comply" | "defect" | "blue" | "muted";
  confline: string;
  rows: TechRow[];
  debrief: string;
}

function redCost(id: RedTechId): number {
  return RED_TECHS.find((t) => t.id === id)!.cost;
}
function blueCost(id: BlueLayerId): number {
  return BLUE_LAYERS.find((l) => l.id === id)!.cost;
}

/**
 * "Tamper & Trace" — a two-player, pass-the-screen Red/Blue exercise on
 * hardware-verification defeats and detection. Red buys tamper techniques under
 * a budget; Blue builds a detection stack blind; resolution rolls dice against
 * per-technique detection *probabilities* (the model lives in
 * engines/tamper-trace.ts). Bridged: reaching a resolved verdict records
 * progress via onComplete.
 */
export function TamperTrace({ onComplete }: VerificationWidgetProps) {
  const [scenario, setScenario] = useState<Scenario>({
    state: false,
    amd: false,
    legacy: false,
  });
  const [phase, setPhase] = useState<Phase>("red");
  const [redSet, setRedSet] = useState<Set<RedTechId>>(new Set());
  const [blueSet, setBlueSet] = useState<Set<BlueLayerId>>(new Set());
  const [honest, setHonest] = useState(false);
  const [result, setResult] = useState<Resolution | null>(null);

  const { rmax, bmax } = budgets(scenario);
  const rSpent = useMemo(
    () => [...redSet].reduce((c, id) => c + redCost(id), 0),
    [redSet],
  );
  const bSpent = useMemo(
    () => [...blueSet].reduce((c, id) => c + blueCost(id), 0),
    [blueSet],
  );

  function toggleScenario(key: keyof Scenario) {
    setScenario((s) => ({ ...s, [key]: !s[key] }));
  }

  function toggleTech(id: RedTechId) {
    if (honest) return;
    setRedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (rSpent + redCost(id) > rmax) return prev;
        next.add(id);
      }
      return next;
    });
  }

  function toggleHonest() {
    setHonest((h) => {
      const next = !h;
      if (next) setRedSet(new Set());
      return next;
    });
  }

  function toggleLayer(id: BlueLayerId) {
    setBlueSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (bSpent + blueCost(id) > bmax) return prev;
        next.add(id);
      }
      return next;
    });
  }

  function detectionPath(id: RedTechId): string {
    const m = MATRIX[id];
    const parts: string[] = [];
    if (blueSet.has(m.direct))
      parts.push(
        "direct counter (" + BLUE_LAYERS.find((l) => l.id === m.direct)!.name + ")",
      );
    for (const layer of Object.keys(m.tells) as BlueLayerId[])
      if (blueSet.has(layer))
        parts.push("tell via " + BLUE_LAYERS.find((l) => l.id === layer)!.name);
    if (blueSet.has("whistle")) parts.push("insider chance");
    if (parts.length === 0) return "Blue bought no layer that touches this attack";
    return parts.join(" + ");
  }

  function buildDebrief(caught: boolean, isHonest: boolean, fired: boolean): string {
    if (isHonest) {
      return fired ? DEBRIEF.honestFired.debrief : DEBRIEF.honestClear.debrief;
    }
    if (caught) {
      const direct = [...redSet].some((id) => blueSet.has(MATRIX[id].direct));
      const tellOnly = [...redSet].some(
        (id) =>
          !blueSet.has(MATRIX[id].direct) &&
          (blueSet.has("recon") ||
            blueSet.has("whistle") ||
            (Object.keys(MATRIX[id].tells) as BlueLayerId[]).some((l) =>
              blueSet.has(l),
            )),
      );
      return tellOnly && !direct ? DEBRIEF.swissCheese : DEBRIEF.directLanded;
    }
    return DEBRIEF.redThrough;
  }

  function resolve() {
    // Honest branch: single false-positive roll.
    if (honest) {
      const fp = falsePositiveChance(blueSet);
      const fpRoll = Math.random();
      const fired = fpRoll < fp;
      const maxEvidence = fired ? 0.7 : 0.1;
      const [band, col] = bandFor(maxEvidence);
      const branch = fired ? DEBRIEF.honestFired : DEBRIEF.honestClear;
      setResult({
        honest: true,
        fired,
        caughtAny: false,
        redEmpty: false,
        maxEvidence,
        band,
        bandColor: BAND_COLOR[col] ?? "text-muted-foreground",
        verdict: branch.verdict,
        verdictTone: fired ? "defect" : "comply",
        confline: `Red stayed honest. Blue’s noisy-layer false-alarm risk was ${Math.round(
          fp * 100,
        )}% · rolled ${Math.round(fpRoll * 100)}.`,
        rows: [
          {
            name: DEBRIEF.rowLabelHonest,
            hit: fired,
            p: -1,
            via: branch.rowLabel,
          },
        ],
        debrief: buildDebrief(false, true, fired),
      });
      setPhase("resolve");
      onComplete();
      return;
    }

    if (redSet.size === 0) {
      setResult({
        honest: false,
        fired: false,
        caughtAny: false,
        redEmpty: true,
        maxEvidence: 0,
        band: "—",
        bandColor: "text-muted-foreground",
        verdict: DEBRIEF.redEmpty,
        verdictTone: "muted",
        confline: "",
        rows: [],
        debrief: "",
      });
      setPhase("resolve");
      return;
    }

    let maxEvidence = 0;
    let caughtAny = false;
    const rows: TechRow[] = [];
    redSet.forEach((id) => {
      const t = RED_TECHS.find((x) => x.id === id)!;
      const p = techChance(id, redSet, blueSet, scenario);
      const hit = Math.random() < p;
      if (hit) caughtAny = true;
      if (p > maxEvidence) maxEvidence = p;
      rows.push({ name: t.name, hit, p, via: detectionPath(id) });
    });

    const [band, col] = bandFor(maxEvidence);
    setResult({
      honest: false,
      fired: false,
      caughtAny,
      redEmpty: false,
      maxEvidence,
      band,
      bandColor: BAND_COLOR[col] ?? "text-muted-foreground",
      verdict: caughtAny ? DEBRIEF.caughtVerdict : DEBRIEF.missedVerdict,
      verdictTone: caughtAny ? "blue" : "defect",
      confline: `Peak evidence reached ${Math.round(
        maxEvidence * 100,
      )} · challenge-inspection threshold is ${Math.round(
        THRESH * 100,
      )}. Percentages are detection probabilities — verification yields confidence, not certainty.`,
      rows,
      debrief: buildDebrief(caughtAny, false, false),
    });
    setPhase("resolve");
    onComplete();
  }

  function newRound() {
    setRedSet(new Set());
    setBlueSet(new Set());
    setHonest(false);
    setResult(null);
    setPhase("red");
  }

  function fullReset() {
    setScenario({ state: false, amd: false, legacy: false });
    newRound();
  }

  const verdictTone: Record<Resolution["verdictTone"], string> = {
    comply: "text-comply",
    defect: "text-defect",
    blue: "text-primary",
    muted: "text-muted-foreground",
  };

  return (
    <div className="not-prose my-6">
      <div>
        {/* Scenario toggles */}
        <div className="border-border bg-muted/30 mb-5 rounded-lg border p-3">
          <p className="text-muted-foreground mb-2 font-mono text-[11px] tracking-[0.14em] uppercase">
            {C.scenarioLabel}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {(["state", "amd", "legacy"] as const).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <Switch
                  id={`tt-${key}`}
                  checked={scenario[key]}
                  onCheckedChange={() => toggleScenario(key)}
                />
                <Label
                  htmlFor={`tt-${key}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {C.toggles[key].label}{" "}
                  <span className="text-muted-foreground text-xs">
                    {C.toggles[key].note}
                  </span>
                </Label>
              </div>
            ))}
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={fullReset}
                className="gap-2"
              >
                <RotateCcw className="size-4" aria-hidden /> {C.reset}
              </Button>
            </div>
          </div>
        </div>

        {/* PHASE 1: RED */}
        {phase === "red" && (
          <section aria-labelledby="tt-red-head">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.08em] uppercase">
              {C.redStep}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <h4
                id="tt-red-head"
                className="text-defect flex items-center gap-2 text-lg font-semibold"
              >
                <ShieldAlert className="size-5" aria-hidden /> {C.redTitle}
              </h4>
              <BudgetPill spent={rSpent} max={rmax} tone="defect" />
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{C.redHint}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {RED_TECHS.map((t) => {
                const sel = redSet.has(t.id);
                const wouldOver = !sel && rSpent + t.cost > rmax;
                const disabled = wouldOver || honest;
                return (
                  <SelectCard
                    key={t.id}
                    selected={sel}
                    disabled={disabled}
                    tone="defect"
                    onClick={() => toggleTech(t.id)}
                    name={t.name}
                    cost={`${t.cost} pt`}
                    desc={t.desc}
                    tell={t.tell}
                    footer={`Defeats: ${t.defeats}`}
                  />
                );
              })}
              <div className="sm:col-span-2">
                <SelectCard
                  selected={honest}
                  disabled={false}
                  tone="hide"
                  onClick={toggleHonest}
                  name={HONEST.name}
                  cost="0 pt"
                  desc={HONEST.desc}
                  tell={HONEST.tell}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => setPhase("blue")}
                disabled={rSpent > rmax}
                className="gap-2"
              >
                {C.lockRed} <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </section>
        )}

        {/* PHASE 2: BLUE */}
        {phase === "blue" && (
          <section aria-labelledby="tt-blue-head">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.08em] uppercase">
              {C.blueStep}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <h4
                id="tt-blue-head"
                className="text-primary flex items-center gap-2 text-lg font-semibold"
              >
                <ShieldCheck className="size-5" aria-hidden /> {C.blueTitle}
              </h4>
              <BudgetPill spent={bSpent} max={bmax} tone="primary" />
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{C.blueHint}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {BLUE_LAYERS.map((l) => {
                const sel = blueSet.has(l.id);
                const wouldOver = !sel && bSpent + l.cost > bmax;
                return (
                  <SelectCard
                    key={l.id}
                    selected={sel}
                    disabled={wouldOver}
                    tone="primary"
                    onClick={() => toggleLayer(l.id)}
                    name={l.name}
                    cost={`${l.cost} pt`}
                    desc={l.desc}
                    footer={`Catches: ${l.catches}`}
                  />
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="ghost"
                onClick={() => setPhase("red")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" aria-hidden /> {C.backRed}
              </Button>
              <Button
                onClick={resolve}
                disabled={bSpent > bmax || blueSet.size === 0}
                className="gap-2"
              >
                {C.resolve} <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </section>
        )}

        {/* PHASE 3: RESOLVE */}
        {phase === "resolve" && result && (
          <section aria-labelledby="tt-resolve-head" aria-live="polite">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.08em] uppercase">
              {C.resolveStep}
            </p>
            <h4
              id="tt-resolve-head"
              className={cn("mt-1 text-lg font-semibold", verdictTone[result.verdictTone])}
            >
              {result.verdict}
            </h4>

            {!result.redEmpty && (
              <>
                {/* Meter */}
                <div className="mt-3">
                  <div className="bg-muted relative h-6 overflow-hidden rounded-md">
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        background:
                          "linear-gradient(90deg, color-mix(in srgb, var(--comply) 25%, transparent), color-mix(in srgb, var(--exaggerate) 25%, transparent), color-mix(in srgb, var(--defect) 25%, transparent))",
                      }}
                      aria-hidden
                    />
                    <div
                      className="bg-foreground absolute -top-1 -bottom-1 w-[3px] transition-[left] duration-500 motion-reduce:transition-none"
                      style={{ left: `${result.maxEvidence * 100}%` }}
                      aria-hidden
                    />
                  </div>
                  <div className="text-muted-foreground mt-1 flex justify-between font-mono text-[10px]">
                    {C.bands.map((b) => (
                      <span key={b}>{b}</span>
                    ))}
                  </div>
                  <p className={cn("mt-2 text-sm font-semibold", result.bandColor)}>
                    {result.band}
                  </p>
                </div>

                {result.confline && (
                  <p
                    className="text-muted-foreground mt-2 text-sm [&_b]:text-foreground [&_b]:font-semibold"
                    // confline is authored curriculum with inline <b>/<i> emphasis
                    dangerouslySetInnerHTML={{ __html: result.confline }}
                  />
                )}

                {/* Breakdown */}
                <div className="mt-4">
                  {result.rows.map((row, i) => (
                    <div
                      key={i}
                      className="border-border grid grid-cols-[1fr_auto] items-center gap-3 border-t py-2.5"
                    >
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {row.p < 0
                            ? row.via
                            : row.hit
                              ? "Detected — " + row.via
                              : "Slipped through — " + row.via}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 font-mono text-sm font-semibold",
                          row.hit
                            ? "bg-comply/15 text-comply"
                            : "bg-defect/15 text-defect",
                        )}
                      >
                        {row.p < 0
                          ? row.hit
                            ? DEBRIEF.honestFired.rowPct
                            : DEBRIEF.honestClear.rowPct
                          : `${Math.round(row.p * 100)}% ${row.hit ? "· CAUGHT" : "· missed"}`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Debrief callout */}
                {result.debrief && (
                  <div className="border-primary/50 bg-muted/40 mt-4 rounded-lg border-l-4 p-4 text-sm">
                    <p>{result.debrief}</p>
                    <p className="text-muted-foreground mt-3 font-mono text-[11px] tracking-[0.08em]">
                      {C.debriefTail}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!result.redEmpty && (
                <Button variant="ghost" onClick={resolve} className="gap-2">
                  <Dices className="size-4" aria-hidden /> {C.reroll}
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setPhase("blue")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" aria-hidden /> {C.editBlue}
              </Button>
              <Button onClick={newRound}>{C.again}</Button>
            </div>
          </section>
        )}

        {/* Facilitator notes */}
        <details className="border-border bg-muted/20 mt-6 rounded-lg border px-4">
          <summary className="text-primary cursor-pointer py-3 text-sm font-semibold select-none">
            {C.facilitatorSummary}
          </summary>
          <ul className="mb-3 space-y-2.5 pl-4">
            {C.facilitatorNotes.map((n, i) => (
              <li key={i} className="list-disc text-sm">
                <span className="font-semibold">{n.lead}</span> {n.body}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

function BudgetPill({
  spent,
  max,
  tone,
}: {
  spent: number;
  max: number;
  tone: "defect" | "primary";
}) {
  const over = spent > max;
  return (
    <span
      className={cn(
        "border-border bg-card rounded-full border px-3 py-1 font-mono text-xs",
        over && "border-defect text-defect",
      )}
    >
      Budget:{" "}
      <b className={cn("text-sm", !over && tone === "defect" && "text-defect", !over && tone === "primary" && "text-primary")}>
        {spent}
      </b>{" "}
      / {max}
    </span>
  );
}

function SelectCard({
  selected,
  disabled,
  tone,
  onClick,
  name,
  cost,
  desc,
  tell,
  footer,
}: {
  selected: boolean;
  disabled: boolean;
  tone: "defect" | "primary" | "hide";
  onClick: () => void;
  name: string;
  cost: string;
  desc: string;
  tell?: string;
  footer?: string;
}) {
  const ring =
    tone === "defect"
      ? "border-defect ring-defect"
      : tone === "primary"
        ? "border-primary ring-primary"
        : "border-hide ring-hide";
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border-border bg-card w-full rounded-lg border p-3 text-left transition-colors",
        "hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
        selected && cn(ring, "ring-1"),
        disabled && "cursor-not-allowed opacity-45 hover:border-border",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{name}</span>
        <span className="text-muted-foreground shrink-0 font-mono text-xs">
          {cost}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{desc}</p>
      {tell && (
        <p className="text-muted-foreground mt-1.5 text-[11px] italic">{tell}</p>
      )}
      {footer && (
        <p className="text-muted-foreground mt-1.5 text-[11px]">{footer}</p>
      )}
    </button>
  );
}
