"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { DEFAULT_LEVERS, type Levers, bestResponse, attackRate } from "@/lib/control-model";

// Stage 10: the red team plays a best response. Its strategy is two numbers —
// how selective to be about opportunities (attack rate) and how subtle to make
// each backdoor (sigma). The heatmap is P(red wins) over that strategy plane;
// the ring marks the argmax the control evaluation grades against. Moving the
// audit budget recomputes everything live, so the red team's best strategy
// visibly migrates — you are never grading against a fixed adversary.
//
// Defer is OFF for now (per Arya 2026-07-23): d is pinned to b, a zero-width
// band, and the defer slider is removed — c-game hasn't introduced deferring at
// this point. Restore the second slider when the walkthrough §3.3 docking (or a
// later c-game defer section) needs the ring-migration story.

const W = 300;
const H = 240;
const M = { top: 12, right: 14, bottom: 30, left: 34 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

// Render a subsampled view of the best-response grid (kept light for smooth drags).
const COL_STRIDE = 2;
const ROW_STRIDE = 2;

export function BestResponseDemo() {
  const [b, setB] = useState(0.02);

  // The slider tracks urgently; the heatmap's best-response search (~20-80ms)
  // recomputes against the deferred value so drags stay smooth.
  const bSlow = useDeferredValue(b);

  const levers: Levers = useMemo(
    () => ({ ...DEFAULT_LEVERS, b: bSlow, d: bSlow, red: { mode: "best", gStar: 0, sigma: 0 } }),
    [bSlow],
  );

  const br = useMemo(() => bestResponse(levers), [levers]);
  const { gStars, sigmas, pRedWin } = br.grid;
  const gridMax = Math.max(1e-9, br.result.pRedWin);

  // Round every rendered number: transcendental math (Math.exp/log in the model)
  // is not bit-identical between the server's V8 and the browser's V8, and raw
  // floats in SVG attributes would otherwise trip a hydration mismatch.
  const r1 = (x: number) => Number(x.toFixed(1));
  // Subsampled render grid that tiles the plot area exactly (no overshoot).
  const nCols = Math.floor((gStars.length - 1) / COL_STRIDE) + 1;
  const nRows = Math.floor((sigmas.length - 1) / ROW_STRIDE) + 1;
  const cw = PW / nCols;
  const ch = PH / nRows;
  const clampX = (x: number) => Math.min(M.left + PW - 4, Math.max(M.left + 4, x));
  const clampY = (y: number) => Math.min(M.top + PH - 4, Math.max(M.top + 4, y));

  const safety = 1 - br.result.pRedWin;
  const rate = attackRate(br.red.gStar);
  const lastGStar = gStars[gStars.length - 1] || 1;

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Audit budget (b)</span>
          <span className="font-medium tabular-nums">{(b * 100).toFixed(1)}%</span>
        </label>
        <input
          type="range"
          min={5}
          max={80}
          step={1}
          value={b * 1000}
          onChange={(e) => setB(Number(e.target.value) / 1000)}
          className="accent-primary w-full"
          aria-label="Audit budget"
        />
      </div>

      <div className="mx-auto w-full max-w-sm">
        <p className="text-muted-foreground mb-1 text-center text-xs font-medium">
          Red team win probability over its strategy
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Red-team best-response heatmap">
          {/* heatmap cells — exact tiling of the plot area, so they line up with the frame */}
          {Array.from({ length: nRows }, (_, rr) =>
            Array.from({ length: nCols }, (_, rc) => {
              const i = Math.min(rc * COL_STRIDE, gStars.length - 1);
              const j = Math.min(rr * ROW_STRIDE, sigmas.length - 1);
              const xL = r1(M.left + rc * cw);
              const xR = r1(M.left + (rc + 1) * cw);
              const yT = r1(M.top + PH - (rr + 1) * ch);
              const yB = r1(M.top + PH - rr * ch);
              return (
                <rect
                  key={`${rr}-${rc}`}
                  x={xL}
                  y={yT}
                  width={xR - xL}
                  height={yB - yT}
                  fill="var(--primary)"
                  opacity={Number(Math.min(1, (pRedWin[j][i] / gridMax) * 0.95).toFixed(3))}
                />
              );
            }),
          )}
          {/* frame */}
          <rect x={M.left} y={M.top} width={PW} height={PH} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.6} />
          {/* best-response marker (clamped just inside the frame so it stays fully
              visible at the corners); white so it reads against the navy heatmap */}
          <circle
            cx={r1(clampX(M.left + (br.red.gStar / lastGStar) * PW))}
            cy={r1(clampY(M.top + PH - br.red.sigma * PH))}
            r={4.5}
            fill="none"
            stroke="#fff"
            strokeWidth={2}
          />
          {/* axis labels */}
          <text x={M.left} y={H - 16} fontSize={8} fill="var(--muted-foreground)">
            attack often
          </text>
          <text x={W - M.right} y={H - 16} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            attack rarely
          </text>
          <text x={M.left + PW / 2} y={H - 5} fontSize={8} fill="var(--muted-foreground)" textAnchor="middle">
            opportunity cutoff g* &rarr;
          </text>
          <text
            x={11}
            y={M.top + PH / 2}
            fontSize={8}
            fill="var(--muted-foreground)"
            textAnchor="middle"
            transform={`rotate(-90 11 ${M.top + PH / 2})`}
          >
            subtlety &rarr;
          </text>
        </svg>
        <p className="text-muted-foreground mt-1 text-center text-xs">
          Brighter = higher red win. The ring is the red team&rsquo;s best response.
        </p>
      </div>

      <div className="border-border bg-muted/40 grid grid-cols-3 gap-3 rounded-lg border p-3 text-center text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Safety (vs best response)</p>
          <p className="font-semibold tabular-nums">{(safety * 100).toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Red attacks</p>
          <p className="font-semibold tabular-nums">{(rate * 100).toFixed(1)}% of problems</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Best subtlety</p>
          <p className="font-semibold tabular-nums">{br.red.sigma.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
