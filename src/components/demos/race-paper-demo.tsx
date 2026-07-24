"use client";

import { useMemo, useState } from "react";

// Paper-odds variant of the deployment race. Where <RaceDemo/> derives the
// per-attack odds from the calibrated control model, this one takes them
// literally from the paper's §3.2 contingency table: of 71 backdoor attempts,
// 24 were audited (caught) and 13 were working backdoors that shipped
// (successfully deployed). So c = 24/71 and s = 13/71, and P(red wins) over k
// attempts is the same two-term product, computed here in closed form (no
// control-model import):
//   [ s / (s + c) ] · [ 1 - (1 - s - c)^k ]
//   = P(deployed | decisive)  ·  (chance any decisive event fires).
// Term A is k-independent — the ceiling the curve climbs toward — and
// K_MAX = 20 coincides with the paper's actual regime (a backdoor on ~20 of
// its 5,000 problems is already deep in the plateau).

const C = 24 / 71; // caught, straight from the contingency table
const S = 13 / 71; // successfully deployed, straight from the contingency table
const K_MAX = 20;

const W = 340;
const H = 170;
const M = { top: 12, right: 14, bottom: 26, left: 34 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const TERM_A = S / (S + C); // ceiling: P(deployed | decisive)
const eventFactor = (k: number) => 1 - Math.pow(1 - S - C, k);
const pRedWin = (k: number) => TERM_A * eventFactor(k);

export function RacePaperDemo() {
  const [k, setK] = useState(2);

  const curve = useMemo(() => {
    const pts: { k: number; p: number }[] = [];
    for (let i = 0; i <= 120; i++) {
      const kk = (K_MAX * i) / 120;
      pts.push({ k: kk, p: pRedWin(kk) });
    }
    return pts;
  }, []);

  const xPx = (kk: number) => M.left + (kk / K_MAX) * PW;
  const yPx = (p: number) => M.top + PH - Math.min(1, p) * PH;
  const r1 = (x: number) => Number(x.toFixed(1));
  const line = curve.map((pt, i) => `${i === 0 ? "M" : "L"} ${r1(xPx(pt.k))} ${r1(yPx(pt.p))}`).join(" ");

  const p = pRedWin(k);
  const b = eventFactor(k);

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Number of attacks over the deployment (k)</span>
          <span className="font-medium tabular-nums">{Math.round(k)}</span>
        </label>
        <input
          type="range"
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
          <line x1={M.left} x2={M.left + PW} y1={r1(yPx(TERM_A))} y2={r1(yPx(TERM_A))} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.6} />
          <text x={M.left + PW - 4} y={r1(yPx(TERM_A)) - 4} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            Term A — ceiling
          </text>
          <path d={line} fill="none" stroke="var(--primary)" strokeWidth={1.5} />
          <line x1={r1(xPx(k))} x2={r1(xPx(k))} y1={M.top} y2={M.top + PH} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.5} />
          <circle cx={r1(xPx(k))} cy={r1(yPx(p))} r={3} fill="var(--primary)" stroke="var(--card)" strokeWidth={1} />
          <text x={M.left - 4} y={M.top + 8} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            100%
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

      {/* the two factors of P(red wins), read off the paper's table odds */}
      <div className="border-border bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
        <p className="text-muted-foreground text-center text-xs">
          {`From the table: caught ${(C * 100).toFixed(1)}% · successfully deployed ${(S * 100).toFixed(1)}%`}
        </p>
        <div className="flex items-center justify-center gap-2 text-center tabular-nums">
          <span>
            <span className="text-muted-foreground block text-xs">Term A</span>
            <span className="font-semibold">{(TERM_A * 100).toFixed(0)}%</span>
          </span>
          <span className="text-muted-foreground">×</span>
          <span>
            <span className="text-muted-foreground block text-xs">Term B</span>
            <span className="font-semibold">{(b * 100).toFixed(0)}%</span>
          </span>
          <span className="text-muted-foreground">=</span>
          <span>
            <span className="text-muted-foreground block text-xs">P(red wins)</span>
            <span className="font-semibold">{(p * 100).toFixed(0)}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
