"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_LEVERS,
  type Levers,
  evaluateGame,
  pSucc,
} from "@/lib/control-model";
import { MathText } from "@/components/exercises/math-text";

// Stage 9b: the red team's second lever, subtlety. A subtler backdoor shifts its
// suspicion score down (harder for the monitor to flag) but is more likely to be
// simply broken (subtle logic errors are hard to engineer correctly), so it works
// with lower probability. Visibility falls as subtlety rises; reliability falls too.
//
// For each subtlety we let the red team pick its best attack rate (envelope over
// gStar). Along that envelope the best attack rate keeps a decisive event
// near-certain (Term B ≈ 100% throughout), so subtlety's whole effect flows
// through Term A = s̄/(s̄+c̄), with s̄ = shipBar·pSucc and the remaining mass
// deployed-but-broken = shipBar·(1−pSucc).
//
// Layout (Arya, 2026-07-22 — 2b, full width, no side bars): a stacked-area
// panel partitions every attack attempt's fate — caught (navy) on the bottom,
// deployed but broken (grey) in the middle, successfully deployed (red)
// pressed against the 100% ceiling, so its thickness reads against a flat
// edge and its collapse is the red boundary line meeting the ceiling. The
// three bands sum to exactly 100% at every sigma (the defer band has zero
// width at b = d = 2%). P(red wins) gets its own full-width panel below on a
// tight axis so the shallow hump and the collapse both read; both panels
// share the sigma axis and the slider marker. Direct in-band labels replace
// the legend, and the readout's decomposition row renders the taught
// two-term formula in KaTeX rather than the words "Term A"/"Term B".

/** Best response at a subtlety: the full evaluation at the argmax attack cutoff. */
function bestAtSigma(levers: Levers, sigma: number) {
  // At sigma = 1 reliability is exactly 0, so every cutoff gives P = 0 and the
  // argmax is degenerate. Select the strategy at (just below) that endpoint —
  // the limiting best response — and evaluate it at the true sigma, so the
  // bands and the Term B readout stay continuous at the right edge instead of
  // hopping to an arbitrary tie-broken pool.
  const sSel = Math.min(sigma, 0.995);
  let gStar = 0;
  let pBest = -1;
  for (let i = 0; i < 40; i++) {
    const gs = (i / 39) * 0.98;
    const p = evaluateGame(levers, { mode: "fixed", gStar: gs, sigma: sSel }).pRedWin;
    if (p > pBest) {
      pBest = p;
      gStar = gs;
    }
  }
  return { res: evaluateGame(levers, { mode: "fixed", gStar, sigma }), gStar };
}

const W = 440;
const H = 302;
const ML = 34; // left margin, y-axis labels
const PW1 = W - ML - 14; // both panels span the full width; shared sigma axis
const T1 = 12;
const PH1 = 150; // stacked outcome panel, 0–100%
const T2 = 180;
const PH2 = 104; // P(red wins) panel, tight axis

const CAUGHT = "var(--chart-4)"; // navy — the monitor's channel
const DEPLOYED = "var(--chart-1)"; // red — the red team's channel
const BROKEN = "var(--chart-2)"; // grey — deployed but broken (ships, then does nothing)

type Pt = { s: number; p: number; c: number; w: number; fb: number };

export function SubtletyDemo() {
  const [sigma, setSigma] = useState(0.18);

  const levers: Levers = useMemo(
    () => ({ ...DEFAULT_LEVERS, b: 0.02, d: 0.02, red: { mode: "best", gStar: 0, sigma: 0 } }),
    [],
  );

  const curve = useMemo(() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 100; i++) {
      const sg = i / 100;
      const { res } = bestAtSigma(levers, sg);
      pts.push({
        s: sg,
        p: res.pRedWin,
        c: res.agg.cBar,
        w: res.agg.wBar,
        fb: res.agg.shipBar * (1 - pSucc(sg)),
      });
    }
    return pts;
  }, [levers]);

  // One evaluation at the slider's subtlety: the bars, marker dots, readouts,
  // and the decomposition row all come from this same best-attack-rate response.
  const { res } = bestAtSigma(levers, sigma);
  const fbCur = res.agg.shipBar * (1 - pSucc(sigma));

  const peak = curve.reduce((a, b) => (b.p > a.p ? b : a));
  const yMaxP = Math.max(0.01, ...curve.map((pt) => pt.p)) * 1.08;
  const xPx = (s: number) => ML + s * PW1;
  const yTop = (v: number) => T1 + PH1 * (1 - v); // 0–100% outcome scale
  const yP = (p: number) => T2 + PH2 - Math.min(1, p / yMaxP) * PH2;
  const r1 = (x: number) => Number(x.toFixed(1));

  // Stacked bands (2b order): caught 0..c, broken c..c+fb, deployed c+fb..1.
  const linePath = (f: (pt: Pt) => number) =>
    curve.map((pt, i) => `${i === 0 ? "M" : "L"} ${r1(xPx(pt.s))} ${r1(yTop(f(pt)))}`).join(" ");
  const areaPath = (lo: (pt: Pt) => number, hi: (pt: Pt) => number) => {
    const fwd = curve.map((pt, i) => `${i === 0 ? "M" : "L"} ${r1(xPx(pt.s))} ${r1(yTop(hi(pt)))}`).join(" ");
    const back = [...curve]
      .reverse()
      .map((pt) => `L ${r1(xPx(pt.s))} ${r1(yTop(lo(pt)))}`)
      .join(" ");
    return `${fwd} ${back} Z`;
  };
  const pPath = curve.map((pt, i) => `${i === 0 ? "M" : "L"} ${r1(xPx(pt.s))} ${r1(yP(pt.p))}`).join(" ");
  const sX = r1(xPx(sigma));

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtlety of each backdoor</span>
          <span className="font-medium tabular-nums">{sigma.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={sigma * 1000}
          onChange={(e) => setSigma(Number(e.target.value) / 1000)}
          className="accent-primary w-full"
          aria-label="Subtlety"
        />
      </div>

      <div className="mx-auto w-full max-w-lg">
        <p className="text-muted-foreground mb-1 text-center text-xs font-medium">
          Per-attack outcome probability, and P(red wins)
        </p>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Stacked bands partitioning attack attempts into caught, deployed but broken, and successfully deployed versus subtlety, with three bars showing the split at the current subtlety and a lower panel showing the red team win probability"
        >
          {/* outcome-scale gridlines */}
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={ML} x2={ML + PW1} y1={r1(yTop(v))} y2={r1(yTop(v))} stroke="var(--border)" strokeWidth={1} opacity={0.5} />
              <text x={ML - 4} y={r1(yTop(v)) + 3} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
                {v === 0 ? "0" : `${v * 100}%`}
              </text>
            </g>
          ))}

          {/* stacked bands: caught / broken / deployed-at-the-ceiling */}
          <path d={areaPath(() => 0, (pt) => pt.c)} fill={CAUGHT} opacity={0.16} />
          <path d={areaPath((pt) => pt.c, (pt) => pt.c + pt.fb)} fill={BROKEN} opacity={0.14} />
          <path d={areaPath((pt) => pt.c + pt.fb, () => 1)} fill={DEPLOYED} opacity={0.18} />
          <path d={linePath((pt) => pt.c)} fill="none" stroke={CAUGHT} strokeWidth={1.5} />
          <path d={linePath((pt) => pt.c + pt.fb)} fill="none" stroke={DEPLOYED} strokeWidth={1.5} />
          <rect x={ML} y={T1} width={PW1} height={PH1} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />

          {/* direct band labels (no legend) */}
          <text x={r1(xPx(0.03))} y={r1(yTop(0.9))} fontSize={9} fill={DEPLOYED}>
            successfully deployed
          </text>
          <text x={r1(xPx(0.42))} y={r1(yTop(0.6))} fontSize={9} fill={BROKEN}>
            deployed but broken
          </text>
          <text x={r1(xPx(0.05))} y={r1(yTop(0.28))} fontSize={9} fill={CAUGHT}>
            caught
          </text>

          {/* P(red wins) panel — its own tight axis so the hump reads */}
          <rect x={ML} y={T2} width={PW1} height={PH2} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />
          <path d={pPath} fill="none" stroke="var(--primary)" strokeWidth={1.5} />
          <circle cx={r1(xPx(peak.s))} cy={r1(yP(peak.p))} r={2} fill="var(--muted-foreground)" opacity={0.8} />
          <text x={r1(xPx(peak.s)) + 5} y={r1(yP(peak.p)) - 4} fontSize={9} fill="var(--muted-foreground)">
            optimum
          </text>
          <text x={ML + 5} y={T2 + 11} fontSize={9} fill="var(--primary)" fontWeight={500}>
            P(red wins)
          </text>
          <text x={ML - 4} y={T2 + 8} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
            {(yMaxP * 100).toFixed(0)}%
          </text>
          <text x={ML - 4} y={T2 + PH2} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
            0
          </text>

          {/* slider marker through both sigma panels */}
          <line x1={sX} x2={sX} y1={T1} y2={T1 + PH1} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.5} />
          <line x1={sX} x2={sX} y1={T2} y2={T2 + PH2} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.5} />
          <circle cx={sX} cy={r1(yTop(res.agg.cBar))} r={2.5} fill={CAUGHT} />
          <circle cx={sX} cy={r1(yTop(res.agg.cBar + fbCur))} r={2.5} fill={DEPLOYED} />
          <circle cx={sX} cy={r1(yP(res.pRedWin))} r={3} fill="var(--primary)" stroke="var(--card)" strokeWidth={1} />

          <text x={ML} y={H - 4} fontSize={9} fill="var(--muted-foreground)">
            blatant
          </text>
          <text x={ML + PW1} y={H - 4} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
            subtle
          </text>
        </svg>
      </div>

      {/* The chain from subtlety to P(red wins), at this subtlety's best attack rate. */}
      <div className="border-border bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
        {/* Inputs tier: what subtlety trades, per attack. "Successfully deployed"
            is s̄ = slips past × reliability — the s of Term A. */}
        <p className="text-muted-foreground text-center text-xs">Per attack, at this subtlety&apos;s best attack rate:</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-muted-foreground text-xs">
              Caught by monitor <MathText text="$c$" />
            </p>
            <p className="font-semibold tabular-nums">{(res.agg.cBar * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              Backdoor reliability <MathText text="$p_{\text{works}}$" />
            </p>
            <p className="font-semibold tabular-nums">{(pSucc(sigma) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              Successfully deployed <MathText text="$s$" />
            </p>
            <p className="font-semibold tabular-nums">{(res.agg.wBar * 100).toFixed(1)}%</p>
          </div>
        </div>
        {/* Decomposition tier: the taught two-term formula, values from the model
            (the event term is computed in the exact i.i.d. form). Operators sit on
            the values' baseline (items-end + same text size), not the column
            centers, so × and = read as part of the number row. */}
        <div className="border-border/60 flex items-end justify-center gap-3 border-t pt-2 text-center tabular-nums">
          <span>
            <span className="text-muted-foreground block text-xs">
              <MathText text="$s/(s+c)$" />
            </span>
            <span className="text-base font-semibold">{(res.raceFactor * 100).toFixed(1)}%</span>
          </span>
          <span className="text-muted-foreground text-base">×</span>
          <span>
            <span className="text-muted-foreground block text-xs">
              <MathText text="$1-(1-s-c)^k$" />
            </span>
            {/* Asymptotic, never exactly 1: cap the display instead of showing a false 100.0%. */}
            <span className="text-base font-semibold">{res.eventFactor > 0.999 ? ">99.9%" : `${(res.eventFactor * 100).toFixed(1)}%`}</span>
          </span>
          <span className="text-muted-foreground text-base">=</span>
          <span>
            <span className="text-muted-foreground block text-xs">
              <MathText text="$P(\text{red wins})$" />
            </span>
            <span className="text-base font-semibold">{(res.pRedWin * 100).toFixed(1)}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
