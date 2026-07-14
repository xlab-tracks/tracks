"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Minus, Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TermText } from "@/components/verification/kit/term";
import {
  DEFAULT_SEED,
  FOOTER,
  META,
  NAV_LABELS,
  STAGE4,
  STAGE5_PARAGRAPHS,
  STAGE_DEFS,
  UNDER_THE_HOOD,
  vcoopNumsSentence,
  type StageNum,
  type StrategyMeta,
} from "@/lib/verification/data/evolution-of-verification";
import {
  simulate,
  STAGES,
  STRAT_KEYS,
  type Counts,
  type MatchOpts,
  type Mix,
  type SimResult,
  type StrategyKey,
} from "@/lib/verification/engines/evolution-of-verification";
import type { VerificationWidgetProps } from "../kit/types";

/* ---------- bold-markdown → React (only **…** is used in the copy) ---------- */
function Bold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="text-foreground font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/* ---------- SVG face (character token) ---------- */
function SvgFace({ k, px }: { k: StrategyKey; px: number }) {
  const m: StrategyMeta = META[k];
  const v = k === "vcopycat" || k === "vgrudger" || k === "vcooperator";
  const fill = m.hex;
  const stroke = "rgba(23,27,28,.35)";
  const eyeY = m.shape === "triangle" ? 24 : 18;
  const mouthY = eyeY + 8;
  const dark = k === "vcooperator" ? "#F4F5F1" : "#171B1C";
  return (
    <svg
      viewBox="0 0 40 40"
      width={px}
      height={px}
      role="img"
      aria-label={m.name}
    >
      {m.shape === "circle" && (
        <circle cx="20" cy="20" r="15" fill={fill} stroke={stroke} />
      )}
      {m.shape === "square" && (
        <rect x="6" y="6" width="28" height="28" rx="5" fill={fill} stroke={stroke} />
      )}
      {m.shape === "triangle" && (
        <polygon points="20,5 36,33 4,33" fill={fill} stroke={stroke} />
      )}
      {m.shape === "pentagon" && (
        <polygon points="20,4 36,16 30,35 10,35 4,16" fill={fill} stroke={stroke} />
      )}
      {m.shape === "diamond" && (
        <polygon points="20,4 36,20 20,36 4,20" fill={fill} stroke={stroke} />
      )}
      <circle cx="14.5" cy={eyeY} r="2.1" fill={dark} />
      <circle cx="25.5" cy={eyeY} r="2.1" fill={dark} />
      <path
        d={`M15 ${mouthY} q5 3 10 0`}
        stroke={dark}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      {v && (
        <g>
          <circle cx="33" cy="8" r="6.5" fill="#FFFFFF" stroke="#171B1C" strokeWidth="1.4" />
          <ellipse cx="33" cy="8" rx="3.6" ry="2.3" fill="none" stroke="#171B1C" strokeWidth="1.1" />
          <circle cx="33" cy="8" r="1.2" fill="#171B1C" />
        </g>
      )}
    </svg>
  );
}

/* ---------- stacked-area chart (share of population by generation) ---------- */
function ChartSVG({
  history,
  upTo,
  total,
  w,
  h,
}: {
  history: Counts[];
  upTo: number;
  total: number;
  w: number;
  h: number;
}) {
  const padL = 30,
    padB = 20,
    padT = 6,
    padR = 6;
  const iw = w - padL - padR,
    ih = h - padT - padB;
  const G = history.length - 1;
  const x = (g: number) => padL + iw * (g / G);
  const y = (val: number) => padT + ih * (1 - val / total);

  const paths: { d: string; hex: string }[] = [];
  let cumPrev = history.map(() => 0);
  STRAT_KEYS.forEach((k) => {
    const cum = history.map((c, g) => cumPrev[g] + (c[k] || 0));
    let d = "";
    for (let g = 0; g <= upTo; g++)
      d += (g ? "L" : "M") + x(g).toFixed(1) + " " + y(cum[g]).toFixed(1) + " ";
    for (let g = upTo; g >= 0; g--)
      d += "L" + x(g).toFixed(1) + " " + y(cumPrev[g]).toFixed(1) + " ";
    d += "Z";
    paths.push({ d, hex: META[k].hex });
    cumPrev = cum;
  });

  const ticks = [0, Math.round(G / 2), G];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label="Population composition by generation"
      className="block h-auto max-w-full"
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.hex} fillOpacity="0.9" />
      ))}
      <line x1={padL} y1={padT + ih} x2={padL + iw} y2={padT + ih} stroke="var(--border)" />
      <line x1={padL} y1={padT} x2={padL} y2={padT + ih} stroke="var(--border)" />
      {ticks.map((g) => (
        <text
          key={g}
          x={x(g)}
          y={padT + ih + 14}
          fontSize="10"
          fontFamily="ui-monospace,Menlo,monospace"
          fill="var(--muted-foreground)"
          textAnchor="middle"
        >
          {g}
        </text>
      ))}
      <text
        x={padL - 6}
        y={y(total) + 8}
        fontSize="10"
        fontFamily="ui-monospace,Menlo,monospace"
        fill="var(--muted-foreground)"
        textAnchor="end"
      >
        {total}
      </text>
      <text
        x={padL - 6}
        y={y(0) + 3}
        fontSize="10"
        fontFamily="ui-monospace,Menlo,monospace"
        fill="var(--muted-foreground)"
        textAnchor="end"
      >
        0
      </text>
    </svg>
  );
}

/* ---------- helpers ---------- */
function mixTotal(mix: Mix): number {
  return STRAT_KEYS.reduce((s, k) => s + (mix[k] || 0), 0);
}
function presentKeys(mix: Mix, history: Counts[]): StrategyKey[] {
  return STRAT_KEYS.filter(
    (k) => (mix[k] || 0) > 0 || history.some((c) => c[k] > 0),
  );
}

/* ---------- per-stage run state ---------- */
interface RunState {
  sim: SimResult;
  seed: number;
  total: number;
  present: StrategyKey[];
  mix: Mix;
  gen: number;
  running: boolean;
  done: boolean;
}

const GENERATIONS = 30;

interface S4State {
  noise: number; // percent, 0..20
  vCost: number;
  rounds: number;
  reliability: number;
  mix: Record<StrategyKey, number>;
}

const INITIAL_S4: S4State = {
  noise: 20,
  vCost: 0.2,
  rounds: 10,
  reliability: 1.0,
  mix: {
    cooperator: 3,
    defector: 5,
    copycat: 3,
    grudger: 3,
    random: 2,
    vcopycat: 5,
    vgrudger: 2,
    vcooperator: 2,
  },
};

/**
 * The Evolution of Verification — five unlock-in-order stages. Each stage gates
 * a 30-generation animated run behind an ungraded prediction; Stage 4 is a
 * free-play sandbox (sliders + population editor). Bridged: onComplete fires
 * once, when the learner reaches Stage 5 (the bridge). Client state only — the
 * seed defaults to 3 and can be changed for reproducible runs.
 */
export function EvolutionOfVerification({
  onComplete,
  initialCompleted,
}: VerificationWidgetProps) {
  const [stage, setStage] = useState<StageNum>(1);
  const [unlocked, setUnlocked] = useState<StageNum>(
    initialCompleted ? 5 : 1,
  );
  const [predicted, setPredicted] = useState<Partial<Record<StageNum, number>>>(
    {},
  );
  const [seed, setSeed] = useState<number>(DEFAULT_SEED);
  const [runs, setRuns] = useState<Partial<Record<StageNum, RunState>>>({});
  const [s4, setS4] = useState<S4State>(INITIAL_S4);
  const [hintOpen, setHintOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const firedComplete = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const running = Object.values(runs).some((r) => r?.running);

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  function gotoStage(n: number) {
    if (n < 1 || n > 5 || n > unlocked || running) return;
    setStage(n as StageNum);
    if (n === 5) reachStage5();
  }

  function reachStage5() {
    if (!firedComplete.current) {
      firedComplete.current = true;
      onComplete();
    }
  }

  function pickPrediction(n: StageNum, i: number) {
    if (running) return;
    setPredicted((p) => ({ ...p, [n]: i }));
  }

  function runStage(n: StageNum) {
    if (running) return;
    let mix: Mix, opts: MatchOpts;
    if (n === 4) {
      if (mixTotal(s4.mix) < 6) {
        announce(STAGE4.addPlayersFirst);
        return;
      }
      mix = { ...s4.mix };
      opts = {
        rounds: s4.rounds,
        noise: s4.noise / 100,
        vCost: s4.vCost,
        reliability: s4.reliability,
      };
    } else {
      const def = STAGES[n as 1 | 2 | 3];
      mix = def.mix;
      opts = def.opts;
    }
    const sim = simulate(mix, opts, seed, GENERATIONS);
    const total = mixTotal(mix);
    const present = presentKeys(mix, sim.history);

    if (timerRef.current) clearInterval(timerRef.current);

    const startRun = (gen: number, done: boolean) => {
      setRuns((r) => ({
        ...r,
        [n]: {
          sim,
          seed,
          total,
          present,
          mix,
          gen,
          running: !done,
          done,
        },
      }));
    };

    const finish = () => {
      startRun(GENERATIONS, true);
      setUnlocked((u) =>
        Math.max(u, Math.min(5, n + 1)) as StageNum,
      );
      announce("Run finished at generation 30.");
    };

    if (reduceMotion) {
      finish();
      return;
    }
    startRun(0, false);
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    timerRef.current = setInterval(() => {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const g = Math.min(GENERATIONS, Math.floor((now - start) / 150));
      if (g >= GENERATIONS) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
        return;
      }
      setRuns((r) => {
        const cur = r[n];
        if (!cur) return r;
        return { ...r, [n]: { ...cur, gen: g } };
      });
    }, 150);
  }

  const def = STAGE_DEFS[stage];
  const run = runs[stage];
  const predictionMade = predicted[stage] !== undefined;

  return (
    <div className="not-prose border-border bg-card shadow-soft my-6 overflow-hidden rounded-xl border">
      {/* stage nav */}
      <div
        role="tablist"
        aria-label="Stages"
        className="border-border/70 bg-muted/30 flex flex-wrap items-center gap-1.5 rounded-t-xl border-b px-5 py-2.5"
      >
        {NAV_LABELS.map((lab, i) => {
          const n = (i + 1) as StageNum;
          const locked = n > unlocked;
          const current = n === stage;
          return (
            <button
              key={lab}
              type="button"
              role="tab"
              aria-selected={current}
              disabled={locked || running}
              title={locked ? "Finish the previous stage to unlock" : undefined}
              onClick={() => gotoStage(n)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors",
                current
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
                (locked || running) &&
                  "cursor-not-allowed opacity-40 hover:bg-card",
              )}
            >
              {lab}
            </button>
          );
        })}
        <span className="text-muted-foreground ml-auto font-mono text-[10px]">
          keyboard: use the tabs
        </span>
      </div>

      {/* body */}
      <div className="p-5">
        <section aria-label={def.title} className="space-y-3">
          <h4 className="text-lg font-semibold tracking-tight">{def.title}</h4>
          {def.body.map((para, i) => (
            <p key={i} className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              <TermText text={para} />
            </p>
          ))}

          {stage === 5 ? (
            <Stage5 />
          ) : (
            <>
              {def.roster && <Roster keys={def.roster} />}
              {stage === 4 && (
                <S4Controls
                  s4={s4}
                  setS4={setS4}
                  disabled={running}
                  hintOpen={hintOpen}
                  setHintOpen={setHintOpen}
                />
              )}
              <Prediction
                stage={stage}
                predicted={predicted[stage]}
                disabled={running}
                onPick={(i) => pickPrediction(stage, i)}
              />
              <RunArea
                run={run}
                canRun={predictionMade && !running}
                reduceMotion={reduceMotion}
                onRun={() => runStage(stage)}
              />
              {run?.done && def.outcome && def.outcome.length > 0 && (
                <Outcome stage={stage} run={run} />
              )}
            </>
          )}
        </section>

        <UnderTheHood />

        {/* seed footer */}
        <div className="border-border/70 text-muted-foreground mt-6 border-t pt-4 text-xs">
          <p>
            {FOOTER.inspiredPre}
            <a
              href={FOOTER.inspiredHref}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {FOOTER.inspiredLink}
            </a>
            {FOOTER.inspiredPost}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label htmlFor="ev-seed" className="font-medium">
              <TermText text={`[[Seed|${FOOTER.seedTip}]]`} />
            </label>
            <input
              id="ev-seed"
              type="number"
              min={1}
              max={999999}
              step={1}
              value={seed}
              disabled={running}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setSeed(v >= 1 ? v : DEFAULT_SEED);
              }}
              className="border-border bg-card w-24 rounded-md border px-2 py-1 font-mono text-xs"
            />
            <span>{FOOTER.seedHint}</span>
          </div>
        </div>
      </div>

      <div ref={liveRef} aria-live="polite" className="sr-only" />
    </div>
  );
}

/* ---------- roster ---------- */
function Roster({ keys }: { keys: StrategyKey[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {keys.map((k) => (
        <div
          key={k}
          className="border-border bg-muted/30 flex max-w-xs items-center gap-2 rounded-lg border p-2 pr-3"
        >
          <SvgFace k={k} px={34} />
          <div>
            <div className="text-sm font-semibold">{META[k].name}</div>
            <div className="text-muted-foreground text-xs leading-tight">
              {META[k].bio}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- prediction ---------- */
function Prediction({
  stage,
  predicted,
  disabled,
  onPick,
}: {
  stage: StageNum;
  predicted: number | undefined;
  disabled: boolean;
  onPick: (i: number) => void;
}) {
  const def = STAGE_DEFS[stage];
  if (!def.predictQ || !def.predictOpts) return null;
  return (
    <div className="border-border bg-muted/20 rounded-lg border border-dashed p-4">
      <p className="text-sm font-semibold">Predict first: {def.predictQ}</p>
      <div
        role="group"
        aria-label={def.predictQ}
        className="mt-2.5 flex max-w-xl flex-col gap-2"
      >
        {def.predictOpts.map((o, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={predicted === i}
            disabled={disabled}
            onClick={() => onPick(i)}
            className={cn(
              "border-border bg-card rounded-md border px-3 py-2 text-left text-sm transition-colors",
              predicted === i
                ? "border-primary ring-primary/40 ring-1"
                : "hover:bg-muted",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <TermText text={o} />
          </button>
        ))}
      </div>
      <p className="text-muted-foreground mt-2.5 font-mono text-xs">
        {predicted !== undefined
          ? "Locked in. Run it and see."
          : "The run button unlocks once you commit."}
      </p>
    </div>
  );
}

/* ---------- run area ---------- */
function RunArea({
  run,
  canRun,
  reduceMotion,
  onRun,
}: {
  run: RunState | undefined;
  canRun: boolean;
  reduceMotion: boolean;
  onRun: () => void;
}) {
  const w = 600,
    h = 180;
  const gen = run?.gen ?? 0;
  const counts = run?.sim.history[gen];
  const avg = run
    ? run.sim.avgByGen[Math.min(gen, run.sim.avgByGen.length - 1)]
    : undefined;
  const present = run?.present ?? [];

  const genLabel = run
    ? run.done
      ? `Done: generation ${GENERATIONS} of ${GENERATIONS} (seed ${run.seed})`
      : `Generation ${gen} of ${GENERATIONS} (seed ${run.seed})`
    : "";

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onRun}
          disabled={!canRun}
          className="gap-2 font-mono text-xs tracking-[0.08em] uppercase"
        >
          <Play className="size-4" aria-hidden />
          {run?.done ? "Run again" : "Run 30 generations"}
        </Button>
        <span className="text-muted-foreground font-mono text-xs">
          {genLabel}
        </span>
        {reduceMotion && (
          <span className="text-muted-foreground text-xs italic">
            reduced motion: jumps to the final generation
          </span>
        )}
      </div>

      {run && counts && (
        <div className="mt-3 space-y-3">
          {/* agent grid */}
          <div
            aria-hidden
            className="grid max-w-md gap-1"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(30px, 1fr))",
            }}
          >
            {STRAT_KEYS.flatMap((k) =>
              Array.from({ length: counts[k] || 0 }).map((_, i) => (
                <SvgFace key={`${k}-${i}`} k={k} px={30} />
              )),
            )}
          </div>

          {/* legend */}
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs">
            {present.map((k) => (
              <span
                key={k}
                className="text-muted-foreground inline-flex items-center gap-1.5"
              >
                <span
                  className="inline-block size-3 rounded-sm border border-black/15"
                  style={{ background: META[k].hex }}
                />
                {META[k].name}
              </span>
            ))}
          </div>

          {/* chart */}
          <div className="overflow-x-auto">
            <ChartSVG
              history={run.sim.history}
              upTo={gen}
              total={run.total}
              w={w}
              h={h}
            />
          </div>

          {/* scores table */}
          {avg && (
            <table className="border-border font-mono text-xs [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5 [&_td]:text-right [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-0.5 [&_th]:text-left">
              <tbody>
                <tr>
                  <th>Character</th>
                  <td className="!text-right">avg points, last round robin</td>
                </tr>
                {present.map((k) =>
                  avg[k] === undefined ? null : (
                    <tr key={k}>
                      <th>{META[k].name}</th>
                      <td>{avg[k]!.toFixed(1)}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- outcome ---------- */
function Outcome({ stage, run }: { stage: StageNum; run: RunState }) {
  const def = STAGE_DEFS[stage];
  if (!def.outcome) return null;

  let calloutSuffix = "";
  if (stage === 3) {
    const a0 = run.sim.avgByGen[0];
    if (a0 && a0.cooperator !== undefined && a0.vcooperator !== undefined) {
      calloutSuffix = vcoopNumsSentence(a0.cooperator, a0.vcooperator);
    }
  }

  return (
    <div className="border-l-2 pl-3.5" style={{ borderColor: META.copycat.hex }}>
      <div className="space-y-2">
        {def.outcome.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed">
            <Bold text={para} />
          </p>
        ))}
        {def.callout && (
          <div className="border-primary/70 bg-muted/40 mt-2 rounded-r border-l-4 px-3.5 py-2.5 text-sm leading-relaxed">
            <Bold text={def.callout} />
            {calloutSuffix}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- stage 4 controls ---------- */
function S4Controls({
  s4,
  setS4,
  disabled,
  hintOpen,
  setHintOpen,
}: {
  s4: S4State;
  setS4: React.Dispatch<React.SetStateAction<S4State>>;
  disabled: boolean;
  hintOpen: boolean;
  setHintOpen: (v: boolean) => void;
}) {
  const total = mixTotal(s4.mix);

  function bump(k: StrategyKey, d: number) {
    if (disabled) return;
    setS4((s) => {
      const next = s.mix[k] + d;
      if (next < 0) return s;
      if (d > 0 && mixTotal(s.mix) >= 25) return s;
      return { ...s, mix: { ...s.mix, [k]: next } };
    });
  }

  const sliders: {
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    fmt: (v: number) => string;
    set: (v: number) => void;
  }[] = [
    {
      id: "noise",
      label: "Noise (misreading chance)",
      min: 0,
      max: 20,
      step: 1,
      value: s4.noise,
      fmt: (v) => `${v}%`,
      set: (v) => setS4((s) => ({ ...s, noise: v })),
    },
    {
      id: "vcost",
      label: "Verification cost per round",
      min: 0,
      max: 1,
      step: 0.01,
      value: s4.vCost,
      fmt: (v) => v.toFixed(2),
      set: (v) => setS4((s) => ({ ...s, vCost: v })),
    },
    {
      id: "rounds",
      label: "Match length (rounds)",
      min: 5,
      max: 30,
      step: 1,
      value: s4.rounds,
      fmt: (v) => String(v),
      set: (v) => setS4((s) => ({ ...s, rounds: v })),
    },
    {
      id: "reliability",
      label: "Verification reliability r (extension)",
      min: 0.5,
      max: 1,
      step: 0.01,
      value: s4.reliability,
      fmt: (v) => v.toFixed(2),
      set: (v) => setS4((s) => ({ ...s, reliability: v })),
    },
  ];

  return (
    <div className="space-y-4">
      {/* sliders */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sliders.map((sl) => (
          <div
            key={sl.id}
            className="border-border bg-muted/30 rounded-lg border p-3"
          >
            <label
              htmlFor={`ev-ctl-${sl.id}`}
              className="text-muted-foreground mb-2 block font-mono text-[11px] tracking-[0.06em] uppercase"
            >
              {sl.label}
            </label>
            <Slider
              id={`ev-ctl-${sl.id}`}
              min={sl.min}
              max={sl.max}
              step={sl.step}
              value={[sl.value]}
              disabled={disabled}
              onValueChange={(vals) => sl.set(vals[0])}
              aria-label={sl.label}
            />
            <span className="mt-1.5 block font-mono text-sm">
              {sl.fmt(sl.value)}
            </span>
          </div>
        ))}
      </div>

      {/* population editor */}
      <div className="border-border bg-muted/30 rounded-lg border p-3">
        <p className="text-muted-foreground mb-2 font-mono text-[11px] tracking-[0.14em] uppercase">
          {STAGE4.popEditorLabel}
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {STRAT_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-1.5 text-sm">
              <SvgFace k={k} px={22} />
              <span className="min-w-0 flex-1 truncate">{META[k].name}</span>
              <button
                type="button"
                aria-label={`One fewer ${META[k].name}`}
                disabled={disabled}
                onClick={() => bump(k, -1)}
                className="border-border bg-card hover:bg-muted flex size-6 items-center justify-center rounded border disabled:opacity-40"
              >
                <Minus className="size-3.5" aria-hidden />
              </button>
              <span className="w-6 text-center font-mono">{s4.mix[k]}</span>
              <button
                type="button"
                aria-label={`One more ${META[k].name}`}
                disabled={disabled}
                onClick={() => bump(k, 1)}
                className="border-border bg-card hover:bg-muted flex size-6 items-center justify-center rounded border disabled:opacity-40"
              >
                <Plus className="size-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Total: {total} of 25
          {total < 6 ? " (at least 6 players needed)" : ""}
        </p>
      </div>

      {/* challenge card */}
      <div className="border-border bg-muted/20 rounded-lg border p-4">
        <h5 className="text-base font-semibold">{STAGE4.challengeTitle}</h5>
        <p className="text-muted-foreground mt-1 text-sm">
          {STAGE4.challengeBody}
        </p>
        <button
          type="button"
          onClick={() => setHintOpen(!hintOpen)}
          className="border-border bg-card hover:bg-muted mt-2.5 rounded border px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase"
        >
          {hintOpen ? STAGE4.hintHide : STAGE4.hintShow}
        </button>
        {hintOpen && (
          <p className="border-border text-muted-foreground mt-2.5 border-t border-dashed pt-2.5 text-sm">
            {STAGE4.hint}
          </p>
        )}
      </div>

      {/* extension card */}
      <div className="border-border bg-muted/20 rounded-lg border p-4">
        <h5 className="text-base font-semibold">{STAGE4.extTitle}</h5>
        <p className="text-muted-foreground mt-1 text-sm">{STAGE4.extBody}</p>
      </div>
    </div>
  );
}

/* ---------- stage 5 ---------- */
function Stage5() {
  return (
    <div className="mt-1 max-w-2xl space-y-3">
      {STAGE5_PARAGRAPHS.map((p, i) =>
        p.bigIdea ? (
          <p
            key={i}
            className="border-primary/70 bg-muted/40 text-foreground mt-2 rounded-r border-l-4 px-3 py-2.5 text-sm leading-relaxed [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: p.html }}
          />
        ) : (
          <p
            key={i}
            className="text-muted-foreground text-sm leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: p.html }}
          />
        ),
      )}
    </div>
  );
}

/* ---------- under the hood ---------- */
function UnderTheHood() {
  return (
    <details className="border-border bg-card mt-6 rounded-lg border">
      <summary className="cursor-pointer px-4 py-3 font-mono text-xs tracking-[0.1em] uppercase select-none">
        {UNDER_THE_HOOD.summary}
      </summary>
      <div className="max-w-2xl space-y-3 px-4 pb-4">
        {UNDER_THE_HOOD.sections.map((sec, i) => (
          <div key={i} className="space-y-1.5">
            <h5 className="text-sm font-semibold">{sec.h}</h5>
            {sec.p.map((para, j) => (
              <p key={j} className="text-muted-foreground text-sm leading-relaxed">
                {para}
              </p>
            ))}
            {"table" in sec && sec.table && (
              <table className="mt-1 text-xs [&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2.5 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold">
                <tbody>
                  <tr>
                    {sec.table.head.map((cell, k) => (
                      <th key={k}>{cell}</th>
                    ))}
                  </tr>
                  {sec.table.rows.map((row, r) => (
                    <tr key={r}>
                      <th>{row[0]}</th>
                      {row.slice(1).map((cell, c) => (
                        <td key={c}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
