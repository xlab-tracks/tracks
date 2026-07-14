"use client";

import { useMemo, useState } from "react";
import { DEFAULT_LEVERS, type Levers, evaluateHomogeneous } from "@/lib/control-model";

// Stage 8: safety over a whole deployment, assembled from per-attack odds.
// Each attack independently ends as CATCH (blue wins), WIN (red wins), or
// NEUTRAL. With per-attack odds fixed, P(red wins) factors into
//   [ wBar / (wBar + cBar) ]  ·  [ 1 - e^{-k (wBar + cBar)} ]
//   = (odds red wins a decisive event)  ·  (chance any decisive event fires).
// The race odds are fixed per attack; the event factor rises with k, so
// P(red wins) is monotone increasing in the number of attacks k — if every
// attack were equally good, the red team should spam. The next lesson breaks
// that assumption.
//
// K_MAX is small on purpose: with these per-attack odds a decisive event fires
// with p ≈ 0.58 per attack, so the curve is within 1% of its plateau by k ≈ 8 —
// a wider range renders as a step function against the left wall.

const SIGMA = 0.4; // fixed subtlety for this lesson (subtlety is the next lesson's lever)
const K_MAX = 20;

const W = 340;
const H = 170;
const M = { top: 12, right: 14, bottom: 26, left: 34 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

export function RaceDemo() {
  const [k, setK] = useState(2);

  const levers: Levers = useMemo(
    () => ({ ...DEFAULT_LEVERS, b: 0.02, d: 0.02, red: { mode: "fixed", gStar: 0.5, sigma: SIGMA } }),
    [],
  );

  const curve = useMemo(() => {
    const pts: { k: number; p: number }[] = [];
    for (let i = 0; i <= 120; i++) {
      const kk = (K_MAX * i) / 120;
      pts.push({ k: kk, p: evaluateHomogeneous(levers, SIGMA, kk).pRedWin });
    }
    return pts;
  }, [levers]);

  const res = useMemo(() => evaluateHomogeneous(levers, SIGMA, k), [levers, k]);
  const yMax = Math.max(0.01, curve[curve.length - 1].p) * 1.05;

  const xPx = (kk: number) => M.left + (kk / K_MAX) * PW;
  const yPx = (p: number) => M.top + PH - Math.min(1, p / yMax) * PH;
  const r1 = (x: number) => Number(x.toFixed(1));
  const line = curve.map((pt, i) => `${i === 0 ? "M" : "L"} ${r1(xPx(pt.k))} ${r1(yPx(pt.p))}`).join(" ");

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Number of attacks over the deployment (k)</span>
          <span className="font-medium tabular-nums">{Math.round(k)}</span>
        </label>
        <input
          type="range"
          // Start at 1: at k=0 there are no decisive problems, so the model
          // returns a degenerate raceFactor of 0, which would render a
          // misleading "race odds 0%" against this demo's k-independent lesson.
          min={1}
          max={K_MAX}
          step={1}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
          className="accent-primary w-full"
          aria-label="Number of attacks"
        />
      </div>

      <div className="mx-auto w-full max-w-md">
        <p className="text-muted-foreground mb-1 text-center text-xs font-medium">Red team win probability vs number of attacks</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Red win probability versus number of attacks">
          <rect x={M.left} y={M.top} width={PW} height={PH} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />
          <path d={line} fill="none" stroke="var(--primary)" strokeWidth={1.5} />
          <line x1={r1(xPx(k))} x2={r1(xPx(k))} y1={M.top} y2={M.top + PH} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.5} />
          <circle cx={r1(xPx(k))} cy={r1(yPx(res.pRedWin))} r={3} fill="var(--primary)" stroke="var(--card)" strokeWidth={1} />
          <text x={M.left - 4} y={M.top + 8} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            {(yMax * 100).toFixed(0)}%
          </text>
          <text x={M.left - 4} y={M.top + PH} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            0
          </text>
          <text x={M.left} y={H - 6} fontSize={8} fill="var(--muted-foreground)">
            0
          </text>
          <text x={W - M.right} y={H - 6} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            {K_MAX} attacks
          </text>
        </svg>
      </div>

      {/* the two factors of P(red wins) */}
      <div className="border-border bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
        <p className="text-muted-foreground text-center text-xs">
          Per attack: caught (blue wins) {(res.agg.cBar * 100).toFixed(1)}% · working backdoor ships (red wins){" "}
          {(res.agg.wBar * 100).toFixed(1)}%
        </p>
        <div className="flex items-center justify-center gap-2 text-center tabular-nums">
          <span>
            <span className="text-muted-foreground block text-xs">race odds</span>
            <span className="font-semibold">{(res.raceFactor * 100).toFixed(0)}%</span>
          </span>
          <span className="text-muted-foreground">×</span>
          <span>
            <span className="text-muted-foreground block text-xs">any decisive event</span>
            <span className="font-semibold">{(res.eventFactor * 100).toFixed(0)}%</span>
          </span>
          <span className="text-muted-foreground">=</span>
          <span>
            <span className="text-muted-foreground block text-xs">P(red wins)</span>
            <span className="font-semibold">{(res.pRedWin * 100).toFixed(0)}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
