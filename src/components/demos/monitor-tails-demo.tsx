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

const INNOCENT = "var(--chart-5)"; // slate
const ATTACK = "var(--primary)"; // ember

const W = 300;
const H = 150;
const M = { top: 10, right: 12, bottom: 22, left: 12 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

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

function DistPanel({ title, attackMu, attackSd, tpr }: { title: string; attackMu: number; attackSd: number; tpr: number }) {
  // Scale the y-axis to the taller of the two curves (a normal's peak is
  // 1/(sd·√2π)) plus headroom, so a narrow attack density (small sd) doesn't
  // clip flat against a hardcoded ceiling.
  const peak = (sd: number) => 1 / (sd * Math.sqrt(2 * Math.PI));
  const yMax = Math.max(0.45, peak(1), peak(attackSd)) * 1.05;
  const xPx = (x: number) => M.left + (x / 10) * PW;
  const innocent = densityPath(0, 1, yMax);
  const attack = densityPath(attackMu, attackSd, yMax);
  const thX = xPx(AUDIT_X);

  return (
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-1 text-center text-xs font-medium">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${title} suspicion distributions`}>
        <rect x={thX} y={M.top} width={W - M.right - thX} height={PH} fill="var(--muted-foreground)" opacity={0.06} />
        <line x1={M.left} x2={W - M.right} y1={M.top + PH} y2={M.top + PH} stroke="var(--border)" strokeWidth={1} />
        <path d={innocent} fill="none" stroke={INNOCENT} strokeWidth={2} />
        <path d={attack} fill="none" stroke={ATTACK} strokeWidth={2} />
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
        <span className="font-semibold tabular-nums">{(tpr * 100).toFixed(0)}%</span>
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
  return (
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-1 text-center text-xs font-medium">ROC (identical area)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="ROC curves for monitor A and B">
        <rect x={M.left} y={M.top} width={PW} height={PH} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />
        <line x1={xPx(0)} y1={yPx(0)} x2={xPx(1)} y2={yPx(1)} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.4} />
        {/* FPR = 2% line */}
        <line x1={xPx(FPR)} x2={xPx(FPR)} y1={M.top} y2={M.top + PH} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.6} />
        <path d={curve(muA, 1)} fill="none" stroke="var(--chart-3)" strokeWidth={1.25} />
        <path d={curve(muB, B_SD)} fill="none" stroke={ATTACK} strokeWidth={1.25} />
        <circle cx={xPx(FPR)} cy={yPx(tprAtFprUnequal(muA, 1, FPR))} r={2.5} fill="var(--chart-3)" stroke="var(--card)" strokeWidth={1} />
        <circle cx={xPx(FPR)} cy={yPx(tprAtFprUnequal(muB, B_SD, FPR))} r={2.5} fill={ATTACK} stroke="var(--card)" strokeWidth={1} />
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
          <span className="text-muted-foreground">Shared monitor quality (AUROC)</span>
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

      <div className="text-muted-foreground flex items-center justify-center gap-5 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: INNOCENT }} /> Innocent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: ATTACK }} /> Attacks
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <DistPanel title="Monitor A — attacks spread wide" attackMu={muA} attackSd={1} tpr={tprA} />
        <DistPanel title="Monitor B — attacks compressed" attackMu={muB} attackSd={B_SD} tpr={tprB} />
      </div>

      <RocPanel muA={muA} muB={muB} />

      <div className="border-border bg-muted/40 grid grid-cols-3 gap-3 rounded-lg border p-3 text-center text-sm">
        <div>
          <p className="text-muted-foreground text-xs">AUROC (both)</p>
          <p className="font-semibold tabular-nums">
            {aucA.toFixed(2)} = {aucB.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">A caught @ 2%</p>
          <p className="font-semibold tabular-nums">{(tprA * 100).toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">B caught @ 2%</p>
          <p className="font-semibold tabular-nums">{(tprB * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}
