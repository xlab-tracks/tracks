"use client";

import { useMemo, useState } from "react";
import {
  muBase,
  scoreDensity,
  squash,
  zAudit,
  tprAtFprUnequal,
  aurocUnequal,
} from "@/lib/control-model";

// Stage 7b: two monitors with the SAME AUROC but different attack-score spread.
// Monitor A spreads attacks widely (sd = 1); Monitor B compresses them into a
// mid-suspicion band (sd = 0.4). Same ranking quality overall, but under a 2%
// audit budget B's attacks barely reach the tail where audits happen — so B
// catches far fewer. AUROC alone hides a large safety difference.

const B_SD = 0.4; // monitor B's compressed attack spread
const FPR = 0.02; // audit budget
const AUDIT_X = squash(zAudit(FPR)); // 2% threshold on the displayed 0–10 axis

// One encoding across the whole demo: grey = innocent (both density panels),
// navy = everything Monitor A (its attack curve, ROC curve/dot, labels, stats),
// red = everything Monitor B. The ROC deliberately reuses the monitor hues so
// it can't be misread as innocent-vs-attacks.
const INNOCENT = "var(--chart-5)"; // neutral grey
const MONITOR_A = "var(--chart-4)"; // navy
const MONITOR_B = "var(--chart-1)"; // red

const W = 300;
const H = 150;
const M = { top: 10, right: 12, bottom: 22, left: 12 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

// ONE shared y-scale for both density panels: scale to the tallest curve across
// BOTH monitors (a normal's peak is 1/(sd·√2π)) plus headroom. The panels show
// the identical innocent N(0,1) curve, so per-panel scaling would render it at
// different heights side by side; sharing the max keeps it pixel-identical and
// nothing clips (B's narrow attack peak is the tallest curve).
const peakDensity = (sd: number) => 1 / (sd * Math.sqrt(2 * Math.PI));
const Y_MAX = Math.max(0.45, peakDensity(1), peakDensity(B_SD)) * 1.05;

function densityPath(mu: number, sd: number, yMax: number): string {
  const { s, f } = scoreDensity(mu, 200, sd);
  const xPx = (x: number) => M.left + (x / 10) * PW;
  const yPx = (y: number) => M.top + PH - Math.min(1, y / yMax) * PH;
  const segs: string[] = [];
  for (let i = 0; i < s.length; i++) {
    segs.push(`${i === 0 ? "M" : "L"} ${xPx(s[i]).toFixed(1)} ${yPx(f[i]).toFixed(1)}`);
  }
  return segs.join(" ");
}

function DistPanel({
  name,
  subtitle,
  attackMu,
  attackSd,
  accent,
  yMax,
  tpr,
}: {
  name: string;
  subtitle: string;
  attackMu: number;
  attackSd: number;
  accent: string;
  yMax: number;
  tpr: number;
}) {
  const xPx = (x: number) => M.left + (x / 10) * PW;
  const innocent = densityPath(0, 1, yMax);
  const attack = densityPath(attackMu, attackSd, yMax);
  const thX = xPx(AUDIT_X);

  return (
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-1 text-center text-xs font-medium">
        <span style={{ color: accent }}>{name}</span> &mdash; {subtitle}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${name} suspicion distributions`}>
        <rect x={thX} y={M.top} width={W - M.right - thX} height={PH} fill="var(--muted-foreground)" opacity={0.06} />
        <line x1={M.left} x2={W - M.right} y1={M.top + PH} y2={M.top + PH} stroke="var(--border)" strokeWidth={1} />
        <path d={innocent} fill="none" stroke={INNOCENT} strokeWidth={2} />
        <path d={attack} fill="none" stroke={accent} strokeWidth={2} />
        <line x1={thX} x2={thX} y1={M.top} y2={M.top + PH} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="3 3" />
        <text x={thX - 3} y={M.top + 8} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
          audit 2%
        </text>
        <text x={M.left + PW / 2} y={H - 5} fontSize={8} fill="var(--muted-foreground)" textAnchor="middle">
          more suspicious &rarr;
        </text>
      </svg>
      <p className="mt-1 text-center text-sm">
        <span className="text-muted-foreground">caught @ 2%: </span>
        <span className="font-semibold tabular-nums" style={{ color: accent }}>
          {(tpr * 100).toFixed(0)}%
        </span>
      </p>
    </div>
  );
}

function RocPanel({ muA, muB }: { muA: number; muB: number }) {
  const xPx = (fpr: number) => M.left + fpr * PW;
  const yPx = (tpr: number) => M.top + PH - tpr * PH;
  const curve = (mu: number, sd: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const fpr = i / 120;
      pts.push(`${i === 0 ? "M" : "L"} ${xPx(fpr).toFixed(1)} ${yPx(tprAtFprUnequal(mu, sd, Math.max(1e-4, Math.min(1 - 1e-4, fpr)))).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  // Direct "A"/"B" labels sit just right of each operating dot — the FPR = 2%
  // line is where the two curves are furthest apart at every AUROC setting.
  // Clamp inside the plot (at low AUROC, B's dot pins to the bottom corner);
  // the card-colored halo keeps a glyph readable if a line passes behind it.
  const dotX = xPx(FPR);
  const dotAY = yPx(tprAtFprUnequal(muA, 1, FPR));
  const dotBY = yPx(tprAtFprUnequal(muB, B_SD, FPR));
  const labelAY = Math.min(dotAY + 3, M.top + PH - 3);
  const labelBY = Math.min(dotBY + 3, M.top + PH - 3);
  const labelHalo = {
    stroke: "var(--card)",
    strokeWidth: 3,
    strokeLinejoin: "round",
    paintOrder: "stroke",
  } as const;
  return (
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-1 text-center text-xs font-medium">ROC (identical area)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="ROC curves for monitor A and B">
        <rect x={M.left} y={M.top} width={PW} height={PH} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />
        <line x1={xPx(0)} y1={yPx(0)} x2={xPx(1)} y2={yPx(1)} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.4} />
        {/* FPR = 2% line */}
        <line x1={xPx(FPR)} x2={xPx(FPR)} y1={M.top} y2={M.top + PH} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.6} />
        <path d={curve(muA, 1)} fill="none" stroke={MONITOR_A} strokeWidth={1.25} />
        <path d={curve(muB, B_SD)} fill="none" stroke={MONITOR_B} strokeWidth={1.25} />
        <circle cx={dotX} cy={dotAY} r={2.5} fill={MONITOR_A} stroke="var(--card)" strokeWidth={1} />
        <circle cx={dotX} cy={dotBY} r={2.5} fill={MONITOR_B} stroke="var(--card)" strokeWidth={1} />
        <text x={dotX + 7} y={labelAY} fontSize={9} fontWeight={600} fill={MONITOR_A} {...labelHalo}>
          A
        </text>
        <text x={dotX + 7} y={labelBY} fontSize={9} fontWeight={600} fill={MONITOR_B} {...labelHalo}>
          B
        </text>
        <text x={M.left + 3} y={H - 5} fontSize={8} fill="var(--muted-foreground)">
          FPR &rarr;
        </text>
      </svg>
    </div>
  );
}

export function MonitorTailsDemo() {
  const [q, setQ] = useState(0.92); // AUROC, shared by both monitors

  const { muA, muB, tprA, tprB } = useMemo(() => {
    const muA = muBase(q, 1);
    const muB = muBase(q, B_SD);
    return {
      muA,
      muB,
      tprA: tprAtFprUnequal(muA, 1, FPR),
      tprB: tprAtFprUnequal(muB, B_SD, FPR),
    };
  }, [q]);

  const aucA = aurocUnequal(muA, 1);
  const aucB = aurocUnequal(muB, B_SD);

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Shared monitor quality (AUC)</span>
          <span className="font-medium tabular-nums">{q.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={800}
          max={980}
          step={1}
          value={q * 1000}
          onChange={(e) => setQ(Number(e.target.value) / 1000)}
          className="accent-primary w-full"
          aria-label="Shared monitor quality"
        />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: INNOCENT }} /> Innocent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: MONITOR_A }} /> Attacks (Monitor A)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: MONITOR_B }} /> Attacks (Monitor B)
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <DistPanel name="Monitor A" subtitle="attacks spread wide" attackMu={muA} attackSd={1} accent={MONITOR_A} yMax={Y_MAX} tpr={tprA} />
        <DistPanel name="Monitor B" subtitle="attacks compressed" attackMu={muB} attackSd={B_SD} accent={MONITOR_B} yMax={Y_MAX} tpr={tprB} />
      </div>

      <RocPanel muA={muA} muB={muB} />

      <div className="border-border bg-muted/40 grid grid-cols-3 gap-3 rounded-lg border p-3 text-center text-sm">
        <div>
          <p className="text-muted-foreground text-xs">AUC (both)</p>
          <p className="font-semibold tabular-nums">
            {aucA.toFixed(2)} = {aucB.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">A caught @ 2%</p>
          <p className="font-semibold tabular-nums" style={{ color: MONITOR_A }}>
            {(tprA * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">B caught @ 2%</p>
          <p className="font-semibold tabular-nums" style={{ color: MONITOR_B }}>
            {(tprB * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
