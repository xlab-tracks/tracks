"use client";

import { useState } from "react";

// The lesson's two levers (module 2, "Determining the usefulness",
// §Techniques are the choice, not a state): exactly two ways to get more
// safety — improve the techniques, so any given sacrifice of usefulness
// buys more safety than it used to (the curve bends upward), or grow the
// budget, so you can afford bigger sacrifices (the affordable region
// extends). All caption copy restates c-regimes-l1.mdx lines 125-130.

const W = 520;
const H = 280;
const M = { left: 46, right: 16, top: 16, bottom: 40 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;


const CAPTIONS = {
  start:
    "Two sliders, two levers — the only two ways to get more safety. The dot marks the safety you actually reach: the best point you can afford on the current curve.",
  tech: "Improve the techniques: better safety technology means any given sacrifice of usefulness buys more safety than it used to. Technical safety research works on this lever.",
  budget:
    "Grow the budget: more will, or lower prices, means you can afford bigger sacrifices. Advocacy, communication, and policy work on this lever.",
} as const;

// Diminishing-returns curve: safety = scale · (1 − e^(−k·sacrifice)).
// Tech level raises k (steeper early gains); the shapes are illustrative —
// the lesson's claim is only the direction each lever moves things.
// Both levers are continuous sliders (0–100).
function safetyAt(sacrifice: number, techLevel: number): number {
  const k = 2.2 + (techLevel / 100) * 4.2;
  return 1 - Math.exp(-k * sacrifice);
}

export function TwoLeversDemo() {
  const [techLevel, setTechLevel] = useState(0);
  const [budgetLevel, setBudgetLevel] = useState(0);
  const [caption, setCaption] = useState<keyof typeof CAPTIONS>("start");

  const affordable = 0.25 + (budgetLevel / 100) * 0.66; // fraction of x affordable
  const xPx = (frac: number) => M.left + frac * PW;
  const yPx = (safety: number) => M.top + PH - safety * PH * 0.92;

  const points: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const frac = i / 60;
    points.push(
      `${i === 0 ? "M" : "L"} ${xPx(frac).toFixed(1)} ${yPx(safetyAt(frac, techLevel)).toFixed(1)}`,
    );
  }
  const reachedX = Math.min(affordable, 1);
  const reachedY = safetyAt(reachedX, techLevel);

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Safety versus usefulness sacrificed: improving techniques bends the curve upward; growing the budget extends how far along it you can afford to go"
      >
        {/* Affordable region */}
        <rect
          x={M.left}
          y={M.top}
          width={reachedX * PW}
          height={PH}
          className="fill-primary/5 transition-all duration-300 ease-out motion-reduce:transition-none"
        />
        <line
          x1={xPx(reachedX)}
          x2={xPx(reachedX)}
          y1={M.top}
          y2={M.top + PH}
          className="stroke-primary/50 transition-all duration-300 ease-out motion-reduce:transition-none"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <text
          x={xPx(reachedX) - 4}
          y={M.top + 12}
          textAnchor="end"
          className="fill-muted-foreground text-[10px]"
        >
          affordable
        </text>

        {/* Axes */}
        <line
          x1={M.left}
          y1={M.top + PH}
          x2={M.left + PW}
          y2={M.top + PH}
          className="stroke-border"
          strokeWidth={1}
        />
        <line
          x1={M.left}
          y1={M.top}
          x2={M.left}
          y2={M.top + PH}
          className="stroke-border"
          strokeWidth={1}
        />
        <text
          x={M.left + PW / 2}
          y={H - 12}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
        >
          usefulness sacrificed →
        </text>
        <text
          x={16}
          y={M.top + PH / 2}
          textAnchor="middle"
          transform={`rotate(-90 16 ${M.top + PH / 2})`}
          className="fill-muted-foreground text-[11px]"
        >
          safety gained →
        </text>

        {/* The technique curve and the reached point */}
        <path
          d={points.join(" ")}
          fill="none"
          className="stroke-primary transition-all duration-300 ease-out motion-reduce:transition-none"
          strokeWidth={2}
        />
        <circle
          cx={xPx(reachedX)}
          cy={yPx(reachedY)}
          r={5}
          className="fill-primary stroke-card transition-all duration-300 ease-out motion-reduce:transition-none"
          strokeWidth={1.5}
        />
      </svg>

      <div className="space-y-3">
        <div>
          <label className="flex items-center justify-between text-sm">
            <span
              className={
                caption === "tech" ? "font-medium" : "text-muted-foreground"
              }
            >
              Improve the techniques
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={techLevel}
            onChange={(e) => {
              setTechLevel(Number(e.target.value));
              setCaption("tech");
            }}
            className="accent-primary w-full"
            aria-label="Improve the techniques"
          />
        </div>
        <div>
          <label className="flex items-center justify-between text-sm">
            <span
              className={
                caption === "budget" ? "font-medium" : "text-muted-foreground"
              }
            >
              Grow the budget
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={budgetLevel}
            onChange={(e) => {
              setBudgetLevel(Number(e.target.value));
              setCaption("budget");
            }}
            className="accent-primary w-full"
            aria-label="Grow the budget"
          />
        </div>
      </div>

      <p aria-live="polite" className="text-muted-foreground min-h-14 text-sm">
        {CAPTIONS[caption]}
      </p>
    </div>
  );
}
