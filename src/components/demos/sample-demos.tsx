"use client";

import { useState } from "react";

// Placeholder interactive demos. Self-contained (React only) so they can be
// embedded anywhere. Replace with real AI-safety demos.

export function SampleDemo() {
  const [value, setValue] = useState(40);
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Parameter</span>
        <span className="font-medium tabular-nums">{value}</span>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="accent-foreground w-full"
        aria-label="Parameter"
      />
      <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
        <div
          className="bg-foreground h-full rounded-full transition-[width]"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-muted-foreground text-sm">
        Lorem ipsum output scales with the parameter: {(value * 1.5).toFixed(1)}.
      </p>
    </div>
  );
}

export function TradeoffDemo() {
  const [a, setA] = useState(60);
  const [b, setB] = useState(50);
  const score = Math.round((a * 0.6 + (100 - b) * 0.4) * 10) / 10;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Lever A" value={a} onChange={setA} />
        <Slider label="Lever B" value={b} onChange={setB} />
      </div>
      <div className="border-border rounded-lg border p-3 text-sm">
        <span className="text-muted-foreground">Placeholder score: </span>
        <span className="font-semibold tabular-nums">{score}</span>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-foreground w-full"
        aria-label={label}
      />
    </div>
  );
}
