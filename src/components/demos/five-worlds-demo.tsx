"use client";

import { useState } from "react";

// Greenblatt's five caricatured futures (module 2, "Determining the
// usefulness") as a map: horizontal = the world state (how misaligned the
// models actually are), vertical = the epistemic state (how alarming it
// looks from the inside). Lurkville shares Easyland's "looks fine" row.
// Dot positions restate the lesson's bullet descriptions; blurbs restate
// the lesson's own prose. Hovering or tapping a world shows its
// description in the fixed caption panel below the plane (per the spec —
// every caption shares one grid cell, so the panel holds the height of
// the tallest and nothing can clip inside the overflow-hidden DemoFrame).

interface World {
  id: string;
  name: string;
  /** Plane coordinates in [0, 1]: x = actual misalignment, y = how alarming it looks. */
  x: number;
  y: number;
  blurb: string;
}

const WORLDS: World[] = [
  {
    id: "easyland",
    name: "Easyland",
    x: 0.12,
    y: 0.1,
    blurb:
      "Alignment generalizes fine. Models are what they appear to be.",
  },
  {
    id: "slopolis",
    name: "Slopolis",
    x: 0.42,
    y: 0.22,
    blurb:
      "No scheming, but models are apparent-success seekers: no hidden goals, just trained habits that optimize for looking successful — overselling, downplaying failures, quietly skipping what's hard to check.",
  },
  {
    id: "hackistan",
    name: "Hackistan",
    x: 0.6,
    y: 0.5,
    blurb:
      "Models cheat and reward-hack constantly. The cheating is detectable with effort, but mundane: no dramatic incidents, just endless gaming.",
  },
  {
    id: "schemeria",
    name: "Schemeria",
    x: 0.88,
    y: 0.88,
    blurb:
      "Models are coherently scheming, and we can detect it: incriminating behavior, escape attempts, red-handed catches.",
  },
  {
    id: "lurkville",
    name: "Lurkville",
    x: 0.88,
    y: 0.1,
    blurb:
      "Models are coherently scheming and we cannot detect it. No catches, no incidents. From the inside it looks similar to Easyland.",
  },
];

const W = 560;
const H = 330;
// Plane bounds inside the SVG (y grows downward in SVG, so invert).
const PLANE = { left: 64, right: 540, top: 28, bottom: 284 };

function px(x: number): number {
  return PLANE.left + x * (PLANE.right - PLANE.left);
}
function py(y: number): number {
  return PLANE.bottom - y * (PLANE.bottom - PLANE.top);
}

const EASYLAND = WORLDS[0];
const LURKVILLE = WORLDS[4];

export function FiveWorldsDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const world = WORLDS.find((w) => w.id === selected);

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="group"
        aria-label="The five worlds mapped by how misaligned the models actually are (horizontal) against how alarming it looks from the inside (vertical); Lurkville sits in the same looks-fine row as Easyland"
      >
        {/* Plane — clicking the background clears the selection */}
        <rect
          x={PLANE.left}
          y={PLANE.top}
          width={PLANE.right - PLANE.left}
          height={PLANE.bottom - PLANE.top}
          rx={10}
          className="fill-card stroke-border"
          strokeWidth={1.5}
          onClick={() => setSelected(null)}
        />

        {/* Axis labels */}
        <text
          x={(PLANE.left + PLANE.right) / 2}
          y={H - 14}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          misalignment level →
        </text>
        <text
          x={PLANE.left + 6}
          y={PLANE.bottom - 8}
          className="fill-muted-foreground text-[9px]"
        >
          actually fine
        </text>
        <text
          x={PLANE.right - 6}
          y={PLANE.bottom - 8}
          textAnchor="end"
          className="fill-muted-foreground text-[9px]"
        >
          coherently scheming
        </text>
        <text
          transform={`translate(16 ${(PLANE.top + PLANE.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          alarm →
        </text>
        <text
          transform={`translate(16 ${PLANE.bottom - 2}) rotate(-90)`}
          className="fill-muted-foreground text-[9px]"
        >
          looks fine
        </text>
        <text
          transform={`translate(16 ${PLANE.top + 2}) rotate(-90)`}
          textAnchor="end"
          className="fill-muted-foreground text-[9px]"
        >
          looks alarming
        </text>

        {/* The looks-fine row Easyland and Lurkville share */}
        <line
          x1={px(EASYLAND.x) + 14}
          y1={py(EASYLAND.y)}
          x2={px(LURKVILLE.x) - 14}
          y2={py(LURKVILLE.y)}
          className="stroke-muted-foreground"
          strokeWidth={1}
          strokeDasharray="5 4"
        />
        <text
          x={(px(EASYLAND.x) + px(LURKVILLE.x)) / 2}
          y={py(EASYLAND.y) - 8}
          textAnchor="middle"
          className="fill-muted-foreground text-[9px] italic"
        >
          indistinguishable from the inside
        </text>

        {/* Worlds */}
        {WORLDS.map((w) => {
          const open = selected === w.id;
          return (
            <g
              key={w.id}
              role="button"
              tabIndex={0}
              aria-pressed={open}
              aria-label={`${w.name} — show its description`}
              onMouseEnter={() => setSelected(w.id)}
              onFocus={() => setSelected(w.id)}
              onClick={() => setSelected(w.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(w.id);
                }
              }}
              className="cursor-pointer outline-none focus-visible:[&>circle]:stroke-ring focus-visible:[&>circle]:stroke-2"
            >
              <circle
                cx={px(w.x)}
                cy={py(w.y)}
                r={open ? 9 : 7}
                className={`transition-all duration-200 ${
                  open
                    ? "fill-primary stroke-primary"
                    : "fill-primary/25 stroke-primary/70"
                }`}
                strokeWidth={1.5}
              />
              <text
                x={px(w.x)}
                y={py(w.y) + (w.y > 0.7 ? 26 : -14)}
                textAnchor="middle"
                className={`text-[11px] font-semibold transition-colors ${
                  open ? "fill-foreground" : "fill-muted-foreground"
                }`}
              >
                {w.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Caption panel — the default caption and all five world captions
          share one grid cell, so the panel always keeps the height of the
          tallest one (no layout jump, no clipping). */}
      <div
        className="border-border bg-card grid rounded-lg border p-3"
        aria-live="polite"
      >
        <p
          className={`text-muted-foreground col-start-1 row-start-1 text-sm ${
            world ? "invisible" : ""
          }`}
        >
          Hover or tap a world to read it. The horizontal axis is the world
          state itself; the vertical axis is what the epistemic state can
          see — which is why Lurkville and Easyland share a row.
        </p>
        {WORLDS.map((w) => (
          <div
            key={w.id}
            className={`col-start-1 row-start-1 ${
              world?.id === w.id ? "" : "invisible"
            }`}
          >
            <p className="text-sm font-medium">{w.name}</p>
            <p className="text-muted-foreground mt-1 text-xs">{w.blurb}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
