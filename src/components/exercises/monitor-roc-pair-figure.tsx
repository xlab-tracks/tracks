"use client";

import { useState } from "react";
import { muBase, tprAtFprUnequal } from "@/lib/control-model";
import { cn } from "@/lib/utils";

// Stage-aware mini ROC figure for "Same AUROC, different safety". One panel,
// two monitors:
//   Monitor A — always locked at AUROC 0.92 (sd 1, navy). No control, ever.
//   Monitor B — sd 0.4, red. Stage 1: locked 0.92. Stage 2: locked 0.97.
//     Stage 3+: learner-draggable via a slider (starts where stage 2 left it).
// The same RocPanel drives the standalone MonitorTailsRocDemo, so that demo and
// this figure share one drawing routine and stay pixel-identical.

const MONITOR_A = "var(--chart-4)"; // navy — same encoding as monitor-tails-demo.tsx
const MONITOR_B = "var(--chart-1)"; // red

const W = 340;
const H = 190;
const M = { top: 12, right: 14, bottom: 26, left: 14 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;
const xPx = (fpr: number) => M.left + fpr * PW;
const yPx = (tpr: number) => M.top + PH - tpr * PH;

function curvePath(mu: number, sd: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const fpr = Math.max(1e-4, Math.min(1 - 1e-4, i / 120));
    pts.push(
      `${i === 0 ? "M" : "L"} ${xPx(fpr).toFixed(1)} ${yPx(tprAtFprUnequal(mu, sd, fpr)).toFixed(1)}`,
    );
  }
  return pts.join(" ");
}

// Card-colored halo keeps a glyph legible if a curve passes behind it — the same
// technique monitor-tails-demo.tsx uses for its ROC labels.
const labelHalo = {
  paintOrder: "stroke",
  stroke: "var(--card)",
  strokeWidth: 3,
} as const;

/** One monitor's ROC curve and its direct label. */
export interface RocCurveSpec {
  /** AUROC calibration quality q and attack-score spread sd. */
  q: number;
  sd: number;
  /** Stroke color. */
  color: string;
  /** Glyph text ("A" or "B"). */
  label: string;
  /** FPR at which to anchor the label — must sit on this curve, clear of the other. */
  labelFpr: number;
  /** Label baseline offset from the curve, in viewBox px (negative = above). */
  labelDy: number;
}

/**
 * A single ROC panel: frame, dashed chance diagonal, the two monitors' curves,
 * and a direct bold label on each. No operating-point dots, no 2% line, no
 * densities. The one drawing routine behind both the standalone
 * `MonitorTailsRocDemo` and the stage-aware `MonitorRocMiniFigure`.
 */
export function RocPanel({
  monitors,
  ariaLabel,
}: {
  monitors: readonly [RocCurveSpec, RocCurveSpec];
  ariaLabel: string;
}) {
  const specs = monitors.map((m) => ({ ...m, mu: muBase(m.q, m.sd) }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel}>
      {/* frame */}
      <rect
        x={M.left}
        y={M.top}
        width={PW}
        height={PH}
        fill="none"
        stroke="var(--border)"
        strokeWidth={1}
        opacity={0.5}
      />
      {/* chance diagonal */}
      <line
        x1={xPx(0)}
        y1={yPx(0)}
        x2={xPx(1)}
        y2={yPx(1)}
        stroke="var(--muted-foreground)"
        strokeWidth={1}
        strokeDasharray="3 3"
        strokeOpacity={0.4}
      />
      {/* ROC curves — navy A, red B */}
      {specs.map((m) => (
        <path key={m.label} d={curvePath(m.mu, m.sd)} fill="none" stroke={m.color} strokeWidth={1.5} />
      ))}
      {/* direct labels, each on its own curve where the other curve is clear */}
      {specs.map((m) => (
        <text
          key={m.label}
          x={xPx(m.labelFpr)}
          y={yPx(tprAtFprUnequal(m.mu, m.sd, m.labelFpr)) + m.labelDy}
          fontSize={10}
          fontWeight={700}
          fill={m.color}
          style={labelHalo}
        >
          {m.label}
        </text>
      ))}
      {/* x-axis label */}
      <text x={M.left + 3} y={H - 6} fontSize={8} fill="var(--muted-foreground)">
        FPR &rarr;
      </text>
    </svg>
  );
}

/** Prop contract for a persistent staged-exercise figure widget. */
interface FigureWidgetProps {
  className?: string;
  /** Index of the part currently being presented (0-based). */
  activePartIndex?: number;
}

// Both labels move continuously (or not at all) as Monitor B's AUROC sweeps —
// no per-render argmax, no dy sign-flips.
//   Monitor A is fixed (q 0.92, sd 1): its label is fully static — one constant
//     FPR + one constant dy, no dependence on B. B's curve may graze it once at
//     the crossing qB; the card-colored halo keeps the glyph legible there.
//   Monitor B rides a CONSTANT target TPR height: bLabelFpr finds the (unique)
//     FPR where B's curve reaches that height, so the label glides horizontally
//     at a fixed y and slides left as qB rises.
const SD_A = 1;
const SD_B = 0.4;
const A_LABEL_FPR = 0.045;
const A_LABEL_DY = -6;
const B_LABEL_TPR = 0.55; // constant height B's label rides (in the 0.55–0.70 band)
const B_LABEL_DY = 11;

/**
 * FPR at which Monitor B's curve reaches the constant target TPR `B_LABEL_TPR`.
 * tprAtFprUnequal is strictly increasing in fpr, so this root is unique; a
 * monotonic bisection over fpr ∈ [0.005, 0.8] makes B's label position a smooth,
 * continuous function of qB (no jumps, no argmax scan). Pinning the label to a
 * fixed TPR height keeps its y constant, so it glides purely horizontally.
 */
function bLabelFpr(muB: number): number {
  let lo = 0.005;
  let hi = 0.8;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (tprAtFprUnequal(muB, SD_B, mid) < B_LABEL_TPR) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Persistent figure above the "Same number, different safety" staged exercise:
 * one ROC panel whose Monitor B tracks the active stage — locked at AUROC 0.92
 * (stage 1) and 0.97 (stage 2), then learner-draggable from stage 3 on.
 */
export function MonitorRocMiniFigure({ className, activePartIndex = 0 }: FigureWidgetProps) {
  // Slider state initialises at 0.97 — where stage 2 left Monitor B.
  const [qBMilli, setQBMilli] = useState(970);
  const locked = activePartIndex <= 1;
  const qB =
    activePartIndex === 0 ? 0.92 : activePartIndex === 1 ? 0.97 : qBMilli / 1000;
  const sliderValue =
    activePartIndex === 0 ? 920 : activePartIndex === 1 ? 970 : qBMilli;

  const muB = muBase(qB, SD_B);
  const bLabelFprValue = bLabelFpr(muB);
  const showEqual = Math.round(qB * 1000) === 920;

  return (
    <figure className={cn("border-border bg-card rounded-lg border p-4", className)}>
      <div className="mx-auto w-full max-w-2xl">
        <RocPanel
          monitors={[
            {
              q: 0.92,
              sd: SD_A,
              color: MONITOR_A,
              label: "A",
              labelFpr: A_LABEL_FPR,
              labelDy: A_LABEL_DY,
            },
            {
              q: qB,
              sd: SD_B,
              color: MONITOR_B,
              label: "B",
              labelFpr: bLabelFprValue,
              labelDy: B_LABEL_DY,
            },
          ]}
          ariaLabel={`ROC curves: monitor A at AUC 0.92 and monitor B at AUC ${qB.toFixed(2)}.`}
        />
        <p className="text-muted-foreground mt-1 text-center text-sm">
          AUC:{" "}
          <span className="font-semibold tabular-nums">
            {showEqual ? "A = B = 0.92" : `A = 0.92 · B = ${qB.toFixed(2)}`}
          </span>
        </p>

        <div className="mt-3">
          {locked ? (
            <div className="flex items-center justify-between gap-3">
              <input
                type="range"
                min={800}
                max={980}
                step={1}
                value={sliderValue}
                readOnly
                disabled
                aria-label="Monitor B quality (locked for this stage)"
                className="accent-primary w-full opacity-60"
              />
              <span className="text-muted-foreground shrink-0 text-xs">
                locked for this stage
              </span>
            </div>
          ) : (
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monitor B quality (AUC)</span>
                <span className="font-medium tabular-nums">{qB.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={800}
                max={980}
                step={1}
                value={sliderValue}
                onChange={(e) => setQBMilli(Number(e.target.value))}
                aria-label="Monitor B quality (AUC)"
                className="accent-primary w-full"
              />
            </label>
          )}
        </div>
      </div>
    </figure>
  );
}

export { MONITOR_A, MONITOR_B };
