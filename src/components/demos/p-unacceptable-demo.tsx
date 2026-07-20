"use client";

import { useState } from "react";

// The lesson's decomposition made manipulable (module 2, "How useful is AI
// control?", §Modeling control): P(unacceptable) splits into a scheming and
// a non-scheming route. Control's lever is the conditional
// P(unacceptable | scheming); alignment research proper acts on P(scheming)
// itself. All copy restates c-contra-l1.mdx (equation block and the
// alternatives paragraph); the slider defaults are illustrative UI state,
// not curriculum claims.

const W = 520;
const BAR_H = 34;
const BAR_Y = 8;

interface Lever {
  key: "pScheming" | "pGivenScheming" | "pGivenNot";
  label: string;
  // Which agenda the lesson says acts on this quantity.
  agenda: string;
}

const LEVERS: Lever[] = [
  {
    key: "pScheming",
    label: "P(scheming)",
    agenda:
      "Alignment research proper acts here — if it can make early AI trustworthy, it removes the need to control it.",
  },
  {
    key: "pGivenScheming",
    label: "P(unacceptable | scheming)",
    agenda:
      "Minimizing this conditional is the control agenda — unacceptable meaning catastrophic and irreversible.",
  },
  {
    key: "pGivenNot",
    label: "P(unacceptable | ¬scheming)",
    agenda:
      "Control mainly caters to threat models involving schemers — this non-scheming term is largely outside control's mechanism.",
  },
];

export function PUnacceptableDemo() {
  const [values, setValues] = useState({
    pScheming: 0.3,
    pGivenScheming: 0.5,
    pGivenNot: 0.05,
  });
  const [focused, setFocused] = useState<Lever["key"]>("pGivenScheming");

  const schemingTerm = values.pGivenScheming * values.pScheming;
  const notTerm = values.pGivenNot * (1 - values.pScheming);
  const total = schemingTerm + notTerm;

  // Bar segments scale to the full [0, 1] probability range so shrinking a
  // term visibly shrinks the bar rather than renormalizing.
  const schemingW = schemingTerm * (W - 2);
  const notW = notTerm * (W - 2);
  const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

  return (
    <div className="space-y-4">
      <p className="text-center text-sm">
        P(unacceptable) = P(unacceptable | scheming) · P(scheming) +
        P(unacceptable | ¬scheming) · P(¬scheming)
      </p>

      <svg
        viewBox={`0 0 ${W} ${BAR_Y + BAR_H + 26}`}
        className="w-full"
        role="img"
        aria-label="P(unacceptable) as a stacked bar of its scheming and non-scheming terms"
      >
        {/* Segments clip to the rounded track so the corners stay clean at
            every slider extreme. */}
        <defs>
          <clipPath id="p-unacceptable-track">
            <rect x={1} y={BAR_Y} width={W - 2} height={BAR_H} rx={6} />
          </clipPath>
        </defs>
        <rect
          x={1}
          y={BAR_Y}
          width={W - 2}
          height={BAR_H}
          rx={6}
          className="fill-muted/40 stroke-border"
          strokeWidth={1}
        />
        <g clipPath="url(#p-unacceptable-track)">
          <rect
            x={1}
            y={BAR_Y}
            width={Math.max(schemingW, 0)}
            height={BAR_H}
            className="fill-amber-500/70 transition-all duration-300 motion-reduce:transition-none"
          />
          <rect
            x={1 + schemingW}
            y={BAR_Y}
            width={Math.max(notW, 0)}
            height={BAR_H}
            className="fill-sky-500/70 transition-all duration-300 motion-reduce:transition-none"
          />
        </g>
        <text
          x={W / 2}
          y={BAR_Y + BAR_H + 18}
          textAnchor="middle"
          className="fill-foreground text-[13px] font-semibold"
        >
          P(unacceptable) = {pct(total)}
        </text>
      </svg>

      <div className="text-muted-foreground flex justify-center gap-4 text-xs">
        <span>
          <span className="mr-1 inline-block size-2.5 rounded-sm bg-amber-500/70" />
          scheming route {pct(schemingTerm)}
        </span>
        <span>
          <span className="mr-1 inline-block size-2.5 rounded-sm bg-sky-500/70" />
          non-scheming route {pct(notTerm)}
        </span>
      </div>

      <div className="space-y-3">
        {LEVERS.map((lever) => (
          <div key={lever.key}>
            <label className="flex items-center justify-between text-sm">
              <span
                className={
                  focused === lever.key ? "font-medium" : "text-muted-foreground"
                }
              >
                {lever.label}
              </span>
              <span className="font-medium tabular-nums">
                {pct(values[lever.key])}
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={values[lever.key] * 100}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [lever.key]: Number(e.target.value) / 100,
                }))
              }
              onPointerDown={() => setFocused(lever.key)}
              onFocus={() => setFocused(lever.key)}
              className="accent-primary w-full"
              aria-label={lever.label}
            />
          </div>
        ))}
      </div>

      <p aria-live="polite" className="text-muted-foreground min-h-10 text-sm">
        {LEVERS.find((lever) => lever.key === focused)?.agenda}
      </p>
    </div>
  );
}
