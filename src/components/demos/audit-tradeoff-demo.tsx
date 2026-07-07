"use client";

import { useMemo, useState } from "react";

// Mirrors the closed-form derivation in the "Optimal audit tradeoff" exercise
// (src/content/exercises.data.ts, id c-paper-l3-optimal-audit-tradeoff):
// the red team attempts an obvious backdoor with probability p on each of N
// problems; the blue team audits the first A = αN of them; only an attempt on
// an already-correct solution (rate CORRECTNESS, per the paper's own 53%
// figure) can become a genuine backdoor, but any attempt, successful or not,
// is caught if it lands in the audited window.
const N = 5000; // the paper's actual scenario size
const CORRECTNESS = 0.53; // GPT-4's own solve rate — the paper's stated figure
const ALPHA_MIN = 0.001;
const ALPHA_MAX = 0.8;

/** p* ≈ ln(1 + c(1-α)/α) / (c(1-α)N) — the rare-event-approximation optimum. */
function optimalP(alpha: number): number {
  const oneMinusAlpha = 1 - alpha;
  const ratio = (CORRECTNESS * oneMinusAlpha) / alpha;
  const denom = CORRECTNESS * oneMinusAlpha * N;
  return Math.log(1 + ratio) / denom;
}

/** Exact blue-team win probability at attack rate p (not approximated). */
function blueWinProbability(alpha: number, p: number): number {
  const A = alpha * N;
  const B = (1 - alpha) * N;
  const redWin = Math.pow(1 - p, A) * (1 - Math.pow(1 - CORRECTNESS * p, B));
  return 1 - redWin;
}

interface Point {
  alpha: number;
  value: number;
}

function buildCurve(fn: (alpha: number) => number, steps = 120): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const alpha = ALPHA_MIN + ((ALPHA_MAX - ALPHA_MIN) * i) / steps;
    points.push({ alpha, value: fn(alpha) });
  }
  return points;
}

const WIDTH = 320;
const HEIGHT = 180;
const MARGIN = { top: 10, right: 14, bottom: 24, left: 34 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

function xForAlpha(alpha: number): number {
  return MARGIN.left + ((alpha - ALPHA_MIN) / (ALPHA_MAX - ALPHA_MIN)) * PLOT_W;
}

function LineChart({
  title,
  points,
  currentAlpha,
  currentValue,
  formatValue,
  formatAxis,
  maxValue,
}: {
  title: string;
  points: Point[];
  currentAlpha: number;
  /** Exact value at currentAlpha — computed by the caller, not read off `points`,
   * so the marker and label never disagree with the discretized curve's nearest
   * sample (the curve is steep enough near small α that they otherwise diverge). */
  currentValue: number;
  formatValue: (v: number) => string;
  /** Compact form for the y-axis extremes (no decimals — margin is tight). */
  formatAxis: (v: number) => string;
  maxValue: number;
}) {
  const yFor = (value: number) => MARGIN.top + PLOT_H - (value / maxValue) * PLOT_H;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xForAlpha(p.alpha).toFixed(2)} ${yFor(p.value).toFixed(2)}`)
    .join(" ");

  const markerX = xForAlpha(currentAlpha);
  const markerY = yFor(currentValue);

  return (
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-1 text-center text-xs font-medium">{title}</p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={title}>
        {/* Recessive gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={MARGIN.top + PLOT_H * (1 - t)}
            y2={MARGIN.top + PLOT_H * (1 - t)}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
        {/* Crosshair at the current α */}
        <line
          x1={markerX}
          x2={markerX}
          y1={MARGIN.top}
          y2={MARGIN.top + PLOT_H}
          stroke="var(--muted-foreground)"
          strokeWidth={1}
          strokeOpacity={0.4}
        />
        {/* The curve */}
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Current-point marker, with a surface-color ring */}
        <circle cx={markerX} cy={markerY} r={6} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
        {/* Y-axis min/max labels */}
        <text x={MARGIN.left - 4} y={MARGIN.top + 8} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
          {formatAxis(maxValue)}
        </text>
        <text x={MARGIN.left - 4} y={MARGIN.top + PLOT_H} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
          {formatAxis(0)}
        </text>
        {/* X-axis labels */}
        <text x={MARGIN.left} y={HEIGHT - 6} fontSize={9} fill="var(--muted-foreground)">
          {(ALPHA_MIN * 100).toFixed(1)}%
        </text>
        <text x={WIDTH - MARGIN.right} y={HEIGHT - 6} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
          {(ALPHA_MAX * 100).toFixed(0)}%
        </text>
      </svg>
      <p className="mt-1 text-center text-sm font-semibold tabular-nums">{formatValue(currentValue)}</p>
    </div>
  );
}

export function AuditTradeoffDemo() {
  const [alpha, setAlpha] = useState(0.02); // matches the paper's own headline case

  const p = useMemo(() => optimalP(alpha), [alpha]);
  const expectedAttempts = p * N;
  const blueWin = blueWinProbability(alpha, p);

  const winCurve = useMemo(() => buildCurve((a) => blueWinProbability(a, optimalP(a))), []);
  const attemptsCurve = useMemo(() => buildCurve((a) => optimalP(a) * N), []);
  // Headroom above the curve's own peak (near α = ALPHA_MIN) so it never clips.
  const attemptsMax = useMemo(
    () => Math.max(...attemptsCurve.map((pt) => pt.value)) * 1.08,
    [attemptsCurve],
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Auditing proportion (α)</span>
          <span className="font-medium tabular-nums">{(alpha * 100).toFixed(2)}%</span>
        </label>
        <input
          type="range"
          min={ALPHA_MIN * 1000}
          max={ALPHA_MAX * 1000}
          step={0.5}
          value={alpha * 1000}
          onChange={(e) => setAlpha(Number(e.target.value) / 1000)}
          className="accent-primary w-full"
          aria-label="Auditing proportion"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <LineChart
          title="Blue team win probability"
          points={winCurve}
          currentAlpha={alpha}
          currentValue={blueWin}
          formatValue={(v) => `${(v * 100).toFixed(1)}%`}
          formatAxis={(v) => `${Math.round(v * 100)}%`}
          maxValue={1}
        />
        <LineChart
          title="Optimal expected backdoor attempts"
          points={attemptsCurve}
          currentAlpha={alpha}
          currentValue={expectedAttempts}
          formatValue={(v) => v.toFixed(1)}
          formatAxis={(v) => v.toFixed(0)}
          maxValue={attemptsMax}
        />
      </div>

      <div className="border-border bg-muted/40 grid grid-cols-3 gap-3 rounded-lg border p-3 text-center text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Optimal p*</p>
          <p className="font-semibold tabular-nums">{(p * 100).toFixed(3)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Expected attempts</p>
          <p className="font-semibold tabular-nums">{expectedAttempts.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Blue team wins</p>
          <p className="font-semibold tabular-nums">{(blueWin * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
