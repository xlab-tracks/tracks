"use client";

import { useMemo, useState } from "react";
import { DEFAULT_LEVERS, type Levers, evaluateGame, attackRate } from "@/lib/control-model";
import { MathText } from "@/components/exercises/math-text";

// Stage 9: opportunities are not equal. Problems vary in how cleanly a backdoor
// fits; the red team attacks only when the opportunity quality exceeds a cutoff
// gStar, giving an attack rate r = P(g > gStar). Marginal (lower-quality)
// attacks are more visible, so attacking more often lowers the per-attack odds.
// P(red wins) is therefore hump-shaped in the attack rate: rare attacks may
// never fire; frequent attacks are caught. The optimum is interior.
//
// Decomposition layout (Arya's two-routes frame, 2026-07-22): the chart shows
// WHERE the hump comes from, in the same visual grammar as the subtlety demo.
// Top panel (0–100%): the two terms as dashed curves — Term B (grey, the
// probability some decisive attack attempt occurs) saturates hard on the left
// (≈ 99% once the rate passes ~0.16%, about 8 expected attempts), while Term A
// (red, the probability a decisive attack attempt is successfully deployed)
// drifts down 37% → 28% as a lower cutoff dilutes the pool with more-visible
// opportunities. Bottom panel (tight axis): their product P(red wins), humped
// with an interior optimum around a 0.2% rate. The readout renders the taught
// formula in KaTeX with live values (the event term is computed in the exact
// i.i.d. form; the label shows the taught k-form packaging — they agree to
// display precision).
//
// The x-axis is LOG-scaled in the attack rate. With N = 5,000 problems the
// interior optimum sits at a tiny rate (~0.2%), so on a linear axis the whole
// rising side of the hump collapses into the left wall. The slider travels in
// the SAME log-rate space (thumb fraction == marker width fraction): the
// thumb picks a rate in [x-min, x-max], which is inverted back to the cutoff
// gStar (attackRate is monotone in gStar; bisected below) and the model is
// fed the cutoff exactly as before. Because the slider's range IS the plotted
// domain, the marker can never leave the plot. The domain is derived from the
// sweep, not hardcoded: x-min is the smallest swept rate whose win
// probability still reads as zero on screen (≤ 1% of the P-panel range) — so
// the curve is seen diving to the axis at the left edge (r → 0 ⇒ P → 0; log
// can't reach r = 0 itself) — and x-max is the largest swept rate (~100%).

const SIGMA = 0.4; // fixed subtlety here (the subtlety section varies it)

const W = 440;
const H = 316;
const ML = 34; // left margin, y-axis labels
const MR = 14;
const PW = W - ML - MR; // both panels span the full width; shared rate axis
const T1 = 12;
const PH1 = 150; // terms panel
const Y1MAX = 1.06; // terms-panel scale max: headroom above 100% so Term B reads
// as approaching a dashed asymptote instead of sitting on the panel border —
// technically 1 - (1 - s - c)^k < 1 always, and the readout caps at >99.9%.
const T2 = 180;
const PH2 = 104; // P(red wins) panel, tight axis

const TERM_A = "var(--chart-1)"; // red — the deployment share of decisive attempts
const TERM_B = "var(--chart-2)"; // grey — some decisive attempt occurs at all

// Candidate x-axis ticks (attack rates); rendered only when inside the domain.
// Labels are spelled out so float noise (0.1 * 100 = 10.000…2) never leaks in.
const TICKS: { r: number; label: string }[] = [
  { r: 0.00001, label: "0.001%" },
  { r: 0.0001, label: "0.01%" },
  { r: 0.001, label: "0.1%" },
  { r: 0.01, label: "1%" },
  { r: 0.1, label: "10%" },
];

/**
 * Invert attackRate: recover the cutoff gStar hitting a target rate.
 * attackRate is monotone decreasing in gStar (a tail sum over the cached
 * 256-node opportunity grid), so 40 bisection steps pin gStar to ~1e-12 —
 * the recovered rate matches the target up to the grid's own quantization.
 */
function cutoffForRate(target: number): number {
  let lo = 0; // attackRate(0) = 1
  let hi = 1; // attackRate(1) = 0
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (attackRate(mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Percent formatter that stays meaningful down to ~0.0005% rates. */
function fmtPct(r: number): string {
  const pct = r * 100;
  return `${pct >= 1 ? pct.toFixed(1) : pct.toPrecision(2)}%`;
}

/** Expected-attempts formatter: 0.3 → "0.3", 23.2 → "23", 3286 → "3,286". */
function fmtK(k: number): string {
  if (k >= 100) return Math.round(k).toLocaleString();
  if (k >= 10) return k.toFixed(0);
  return k.toFixed(1);
}

/**
 * Term B formatter: 1 - (1 - s - c)^k is asymptotic, never exactly 1, so the
 * readout says ">99.9%" instead of a false "100.0%" once it rounds there.
 */
function fmtTermB(v: number): string {
  return v > 0.999 ? ">99.9%" : `${(v * 100).toFixed(1)}%`;
}

type Pt = { r: number; p: number; a: number; b: number };

export function AttackRateDemo() {
  const levers: Levers = useMemo(
    () => ({ ...DEFAULT_LEVERS, b: 0.02, d: 0.02, red: { mode: "fixed", gStar: 0.5, sigma: SIGMA } }),
    [],
  );

  const curve = useMemo(() => {
    const pts: Pt[] = [];
    // gStar goes high -> low as i grows, so attack rate rises monotonically: the
    // list is already ascending in rate (no sort needed — sorting in place here
    // would be a memo-breaking mutation).
    for (let i = 0; i <= 120; i++) {
      const gs = 0.995 * (1 - i / 120);
      const res = evaluateGame(levers, { mode: "fixed", gStar: gs, sigma: SIGMA });
      pts.push({ r: attackRate(gs), p: res.pRedWin, a: res.raceFactor, b: res.eventFactor });
    }
    return pts;
  }, [levers]);

  const pMax = Math.max(...curve.map((pt) => pt.p));
  const peak = curve.reduce((x, y) => (y.p > x.p ? y : x));
  const yMaxP = Math.max(0.01, pMax) * 1.08;
  // Log-scale x domain (see header comment). p rises monotonically up to the
  // peak, so `find` picks the leftmost rate whose P still reads as zero on
  // screen (1% of the P-panel range) — the dive to the axis stays visible.
  const xMax = Math.max(...curve.map((pt) => pt.r));
  const xMin = curve.find((pt) => pt.r > 0 && pt.p >= yMaxP / 100)?.r ?? xMax / 1e6;
  const logSpan = Math.log(xMax / xMin);

  // Slider state is the thumb's fraction of the log-rate axis (0..1000), so
  // thumb fraction == marker width fraction by construction, and the slider's
  // range is exactly the plotted domain [x-min, x-max] — no clamping needed.
  // Initial position: the rate the old default cutoff gStar = 0.5 produced.
  const [sliderPos, setSliderPos] = useState(() =>
    Math.round((1000 * Math.log(attackRate(0.5) / xMin)) / logSpan),
  );
  const f = sliderPos / 1000;
  const targetRate = xMin * Math.exp(f * logSpan);
  const gStar = cutoffForRate(targetRate);
  const rate = attackRate(gStar); // the model's actual (grid-quantized) rate
  const res = evaluateGame(levers, { mode: "fixed", gStar, sigma: SIGMA });

  const xPx = (r: number) => ML + (Math.log(r / xMin) / logSpan) * PW; // in-domain r only
  const yTopPct = (v: number) => T1 + PH1 * (1 - v / Y1MAX); // terms scale, 100% below the top
  const yP = (p: number) => T2 + PH2 - Math.min(1, p / yMaxP) * PH2;
  const r1 = (x: number) => Number(x.toFixed(1));
  const markerX = r1(ML + f * PW); // exactly the thumb's fraction
  const drawn = curve.filter((pt) => pt.r >= xMin); // below x-min, P ~ 0: off-domain
  const termPath = (key: "a" | "b") =>
    drawn.map((pt, i) => `${i === 0 ? "M" : "L"} ${r1(xPx(pt.r))} ${r1(yTopPct(pt[key]))}`).join(" ");
  const pPath = drawn.map((pt, i) => `${i === 0 ? "M" : "L"} ${r1(xPx(pt.r))} ${r1(yP(pt.p))}`).join(" ");

  // Direct label anchors, computed from the data so they ride their curves.
  const bElbow = drawn.find((pt) => pt.b >= 0.7) ?? drawn[Math.floor(drawn.length / 3)];
  const aMid = drawn[Math.floor(drawn.length * 0.62)];

  // Round-rate intermediate ticks that fall inside the log domain (with edge
  // margin so labels don't crowd the qualitative end labels).
  const ticks = TICKS.filter((t) => {
    const ft = Math.log(t.r / xMin) / logSpan;
    return ft > 0.07 && ft < 0.93;
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Opportunity cutoff — attack only when quality &gt; this</span>
          <span className="font-medium tabular-nums">
            attack {fmtPct(rate)} of problems
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="accent-primary w-full"
          aria-label="Attack rate, set via the opportunity cutoff"
        />
      </div>

      <div className="mx-auto w-full max-w-lg">
        <p className="text-muted-foreground mb-1 text-center text-xs font-medium">
          The two terms, and their product, vs attack rate
        </p>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Term A and Term B versus attack rate on a log scale, with the red team win probability, their product, in a lower panel"
        >
          {/* terms-scale gridlines; 100% is a dashed asymptote, never reached */}
          {[0, 0.5].map((v) => (
            <g key={v}>
              <line x1={ML} x2={ML + PW} y1={r1(yTopPct(v))} y2={r1(yTopPct(v))} stroke="var(--border)" strokeWidth={1} opacity={0.5} />
              <text x={ML - 4} y={r1(yTopPct(v)) + 3} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
                {v === 0 ? "0" : `${v * 100}%`}
              </text>
            </g>
          ))}
          <line x1={ML} x2={ML + PW} y1={r1(yTopPct(1))} y2={r1(yTopPct(1))} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          <text x={ML - 4} y={r1(yTopPct(1)) + 3} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
            100%
          </text>
          <text x={ML + PW - 3} y={r1(yTopPct(1)) - 3} fontSize={8.5} fill="var(--muted-foreground)" textAnchor="end">
            asymptote
          </text>
          {/* log-axis gridlines through both panels; labels once at the bottom */}
          {ticks.map((t) => (
            <g key={t.label}>
              <line x1={r1(xPx(t.r))} x2={r1(xPx(t.r))} y1={T1} y2={T1 + PH1} stroke="var(--border)" strokeWidth={1} opacity={0.4} />
              <line x1={r1(xPx(t.r))} x2={r1(xPx(t.r))} y1={T2} y2={T2 + PH2} stroke="var(--border)" strokeWidth={1} opacity={0.4} />
              <text x={r1(xPx(t.r))} y={T2 + PH2 + 12} fontSize={9} fill="var(--muted-foreground)" textAnchor="middle">
                {t.label}
              </text>
            </g>
          ))}

          {/* terms panel */}
          <path d={termPath("b")} fill="none" stroke={TERM_B} strokeWidth={1.4} strokeDasharray="5 3" />
          <path d={termPath("a")} fill="none" stroke={TERM_A} strokeWidth={1.4} strokeDasharray="5 3" />
          <rect x={ML} y={T1} width={PW} height={PH1} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />
          <text x={r1(xPx(bElbow.r)) + 5} y={r1(yTopPct(0.7)) + 3} fontSize={9} fill={TERM_B}>
            Term B
          </text>
          <text x={r1(xPx(aMid.r))} y={r1(yTopPct(aMid.a)) - 6} fontSize={9} fill={TERM_A}>
            Term A
          </text>

          {/* P(red wins) panel — its own tight axis so the hump reads */}
          <rect x={ML} y={T2} width={PW} height={PH2} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />
          <path d={pPath} fill="none" stroke="var(--primary)" strokeWidth={1.5} />
          <circle cx={r1(xPx(peak.r))} cy={r1(yP(peak.p))} r={2} fill="var(--muted-foreground)" opacity={0.8} />
          <text x={r1(xPx(peak.r)) + 5} y={r1(yP(peak.p)) - 4} fontSize={9} fill="var(--muted-foreground)">
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

          {/* slider marker through both rate panels */}
          <line x1={markerX} x2={markerX} y1={T1} y2={T1 + PH1} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.5} />
          <line x1={markerX} x2={markerX} y1={T2} y2={T2 + PH2} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.5} />
          <circle cx={markerX} cy={r1(yTopPct(res.eventFactor))} r={2.5} fill={TERM_B} />
          <circle cx={markerX} cy={r1(yTopPct(res.raceFactor))} r={2.5} fill={TERM_A} />
          <circle cx={markerX} cy={r1(yP(res.pRedWin))} r={3} fill="var(--primary)" stroke="var(--card)" strokeWidth={1} />

          <text x={ML} y={H - 4} fontSize={9} fill="var(--muted-foreground)">
            attack rarely
          </text>
          <text x={W - MR} y={H - 4} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
            attack often
          </text>
        </svg>
      </div>

      {/* The chain from the cutoff to P(red wins), at the slider's attack rate. */}
      <div className="border-border bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
        {/* Inputs tier: the pool averages the cutoff sets, plus how many attempts it buys. */}
        <p className="text-muted-foreground text-center text-xs">Per attack attempt, averaged over the pool above the cutoff:</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-muted-foreground text-xs">
              Caught by monitor <MathText text="$c$" />
            </p>
            <p className="font-semibold tabular-nums">{(res.agg.cBar * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              Successfully deployed <MathText text="$s$" />
            </p>
            <p className="font-semibold tabular-nums">{(res.agg.wBar * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              Attack attempts <MathText text="$k$" />
            </p>
            <p className="font-semibold tabular-nums">{fmtK(res.agg.k)}</p>
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
            <span className="text-base font-semibold">{fmtTermB(res.eventFactor)}</span>
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
