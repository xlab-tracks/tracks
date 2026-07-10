"use client";

import { useMemo, useState } from "react";

// The diffuse-to-concentrated frontier from "How can we solve diffuse threats
// like research sabotage with AI control?" (Hebbar, 2025), made manipulable.
//
// Sabotage strategies trade off the number of malign actions needed against how
// incriminating each action looks: derailing a research program with one action
// requires something blatant; spreading it over thousands of actions lets each
// one pass as an honest mistake. The schemer plays only the Pareto frontier of
// that trade-off. The deployer has three mitigations, each biting a different
// stretch of the frontier: incrimination (audits catch a malign action AND the
// action is egregious enough that catching it is decisive), training against
// flagged examples (works where malign actions are flaggable above the benign
// false-positive baseline and numerous enough to supply training signal), and
// untargeted online training (works wherever actions are numerous, regardless
// of subtlety). The learner should discover the post's two punchlines: no
// single mitigation covers the frontier, and with all three turned up the best
// response migrates to the extreme concentrated corner — so few actions that
// random review never sees one, which is the territory of the original control
// paper's blocking-and-auditing toolkit, not of these techniques.
//
// The model is an illustrative toy chosen to reproduce the post's qualitative
// regions — unlike src/lib/control-model it is NOT calibrated to any paper's
// numbers, and none of the constants below carry empirical meaning.

/** Per-action egregiousness along the Pareto frontier at x = log10(actions). */
function frontierE(x: number): number {
  return Math.pow(1 - x / XMAX, 0.65);
}

const XMAX = 4; // frontier spans 1 to 10^4 actions
const FLAG_BASELINE = 0.03; // benign false-positive rate of the suspicion flag
const K_TARGETED = 0.06;
const K_UNTARGETED = 0.0015;

function smoothstep(s: number): number {
  const c = Math.min(1, Math.max(0, s));
  return c * c * (3 - 2 * c);
}

/** Probability a flagging monitor puts an action in the reviewed top slice. */
function flagProb(e: number): number {
  return 1 - Math.pow(1 - FLAG_BASELINE, 1 + 30 * e * e * e);
}

export interface FrontierLevers {
  /** Fraction of actions randomly audited (0–0.1). */
  audit: number;
  /** Intensity of training against flagged examples (0–1). */
  targeted: number;
  /** Intensity of untargeted online training (0–1). */
  untargeted: number;
}

interface FrontierPoint {
  x: number;
  n: number;
  e: number;
  sInc: number;
  sTgt: number;
  sUnt: number;
  /** Probability the strategy survives all three mitigations. */
  v: number;
}

function evalStrategy(x: number, levers: FrontierLevers): FrontierPoint {
  const n = Math.pow(10, x);
  const e = frontierE(x);
  // Incrimination: some malign action must be audited, and the audited action
  // must be egregious enough that "honest mistake" stops being plausible.
  const sInc = (1 - Math.pow(1 - levers.audit, n)) * smoothstep((e - 0.45) / 0.4);
  // Targeted training: signal scales with malign actions flagged above the
  // benign baseline, discounted by label quality (how bad the action looks).
  const excess = Math.max(0, flagProb(e) - FLAG_BASELINE);
  const sTgt = 1 - Math.exp(-K_TARGETED * levers.targeted * n * excess * e);
  // Untargeted training: only the sample count matters — subtlety is no shield.
  const sUnt = 1 - Math.exp(-K_UNTARGETED * levers.untargeted * n);
  return { x, n, e, sInc, sTgt, sUnt, v: (1 - sInc) * (1 - sTgt) * (1 - sUnt) };
}

const STEPS = 96;

const COLORS = {
  inc: "var(--chart-1)",
  tgt: "var(--chart-4)",
  unt: "var(--chart-2)",
} as const;

function dominant(p: FrontierPoint): keyof typeof COLORS | null {
  const m = Math.max(p.sInc, p.sTgt, p.sUnt);
  if (m < 0.03) return null;
  return m === p.sInc ? "inc" : m === p.sTgt ? "tgt" : "unt";
}

// Frontier plane
const W = 340;
const H = 180;
const M = { top: 16, right: 14, bottom: 30, left: 38 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;
// Survival strip
const H2 = 110;
const M2 = { top: 10, right: 14, bottom: 22, left: 38 };
const PH2 = H2 - M2.top - M2.bottom;

const r1 = (v: number) => Number(v.toFixed(1));

function Slider({
  label,
  value,
  display,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{display}</span>
      </label>
      <input
        type="range"
        min={0}
        max={1000}
        step={1}
        value={value * 1000}
        onChange={(e) => onChange(Number(e.target.value) / 1000)}
        className="accent-primary w-full"
        aria-label={label}
      />
    </div>
  );
}

export function SabotageFrontierDemo() {
  const [audit, setAudit] = useState(0.02 / 0.1); // slider is 0–1 of the 10% max
  const [targeted, setTargeted] = useState(0.5);
  const [untargeted, setUntargeted] = useState(0.5);

  const levers: FrontierLevers = useMemo(
    () => ({ audit: audit * 0.1, targeted, untargeted }),
    [audit, targeted, untargeted],
  );

  const points = useMemo(() => {
    const pts: FrontierPoint[] = [];
    for (let i = 0; i <= STEPS; i++) pts.push(evalStrategy((i / STEPS) * XMAX, levers));
    return pts;
  }, [levers]);

  const best = points.reduce((a, b) => (b.v > a.v ? b : a));
  const bestDom = dominant(best);
  const suppressed = Math.max(best.sInc, best.sTgt, best.sUnt);

  const xPx = (x: number) => M.left + (x / XMAX) * PW;
  const yPx = (e: number) => M.top + (1 - e) * PH;
  const y2Px = (v: number) => M2.top + (1 - v) * PH2;

  const survivalLine = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${r1(xPx(p.x))} ${r1(y2Px(p.v))}`)
    .join(" ");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider
          label="Audit budget"
          value={audit}
          display={`${(levers.audit * 100).toFixed(1)}%`}
          onChange={setAudit}
        />
        <Slider
          label="Training on flagged actions"
          value={targeted}
          display={targeted.toFixed(2)}
          onChange={setTargeted}
        />
        <Slider
          label="Untargeted online training"
          value={untargeted}
          display={untargeted.toFixed(2)}
          onChange={setUntargeted}
        />
      </div>

      <div className="mx-auto w-full max-w-md">
        <p className="text-muted-foreground mb-1 text-center text-xs font-medium">
          The schemer&apos;s Pareto frontier, colored by the strongest mitigation
        </p>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Sabotage strategies on the actions-versus-egregiousness plane"
        >
          <rect x={M.left} y={M.top} width={PW} height={PH} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />
          {points.map((p) => {
            const dom = dominant(p);
            const strength = Math.max(p.sInc, p.sTgt, p.sUnt);
            return (
              <circle
                key={p.x}
                cx={r1(xPx(p.x))}
                cy={r1(yPx(p.e))}
                r={dom ? 2.4 : 1.6}
                fill={dom ? COLORS[dom] : "var(--muted-foreground)"}
                opacity={dom ? 0.25 + 0.75 * strength : 0.35}
              />
            );
          })}
          <g transform={`translate(${r1(xPx(best.x))} ${r1(yPx(best.e))})`}>
            <path
              d="M 0 -6 L 1.8 -1.8 L 6 0 L 1.8 1.8 L 0 6 L -1.8 1.8 L -6 0 L -1.8 -1.8 Z"
              fill="var(--primary)"
              stroke="var(--card)"
              strokeWidth={1}
            />
          </g>
          <text x={M.left + 4} y={M.top + 10} fontSize={8} fill="var(--muted-foreground)">
            concentrated: few actions, each blatant
          </text>
          <text x={M.left + PW - 4} y={M.top + PH - 5} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            diffuse: many actions, each innocuous
          </text>
          <text x={M.left - 6} y={M.top + 8} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            blatant
          </text>
          <text x={M.left - 6} y={M.top + PH} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            subtle
          </text>
          {[0, 1, 2, 3, 4].map((d) => (
            <text
              key={d}
              x={r1(xPx(d))}
              y={H - 16}
              fontSize={8}
              fill="var(--muted-foreground)"
              textAnchor="middle"
            >
              {Math.pow(10, d).toLocaleString()}
            </text>
          ))}
          <text x={M.left + PW / 2} y={H - 5} fontSize={8} fill="var(--muted-foreground)" textAnchor="middle">
            malign actions needed for catastrophe
          </text>
        </svg>
      </div>

      <div className="mx-auto w-full max-w-md">
        <p className="text-muted-foreground mb-1 text-center text-xs font-medium">
          Probability each frontier strategy survives all three mitigations
        </p>
        <svg viewBox={`0 0 ${W} ${H2}`} className="w-full" role="img" aria-label="Strategy survival along the frontier">
          <rect x={M2.left} y={M2.top} width={PW} height={PH2} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.5} />
          <path d={survivalLine} fill="none" stroke="var(--primary)" strokeWidth={1.5} />
          <circle cx={r1(xPx(best.x))} cy={r1(y2Px(best.v))} r={3} fill="var(--primary)" stroke="var(--card)" strokeWidth={1} />
          <text x={M2.left - 6} y={M2.top + 8} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            100%
          </text>
          <text x={M2.left - 6} y={M2.top + PH2} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            0
          </text>
          <text x={M2.left} y={H2 - 6} fontSize={8} fill="var(--muted-foreground)">
            concentrated
          </text>
          <text x={W - M2.right} y={H2 - 6} fontSize={8} fill="var(--muted-foreground)" textAnchor="end">
            diffuse
          </text>
        </svg>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.inc }} />
          incrimination
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.tgt }} />
          training on flagged actions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.unt }} />
          untargeted training
        </span>
      </div>

      <div className="border-border bg-muted/40 grid grid-cols-3 gap-3 rounded-lg border p-3 text-center text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Schemer&apos;s best response</p>
          <p className="font-semibold tabular-nums">
            {Math.round(best.n).toLocaleString()} action{Math.round(best.n) === 1 ? "" : "s"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Its survival probability</p>
          <p className="font-semibold tabular-nums">{(best.v * 100).toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Binding mitigation there</p>
          <p className="font-semibold">
            {suppressed < 0.05
              ? "none of these"
              : bestDom === "inc"
                ? "incrimination"
                : bestDom === "tgt"
                  ? "flagged training"
                  : "untargeted training"}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        When every lever is turned up, the surviving strategies crowd into the far
        concentrated corner — so few actions that random review never sees one.
        That region is not covered by these mitigations at all: it is the
        territory of the blocking-and-auditing techniques from the original
        control paper, which is why deployers need both toolkits at once.
      </p>
    </div>
  );
}
