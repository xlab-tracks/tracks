"use client";

import { useState } from "react";

// Greenblatt's five caricatured futures (module 2, "Determining the
// usefulness") as a map: horizontal = the world state (how misaligned the
// models actually are), vertical = the epistemic state (how alarming it
// looks from the inside). Lurkville shares Easyland's "looks fine" row —
// the measured-vs-actual gap as an entire world. Dot positions restate the
// lesson's bullet descriptions; blurbs restate the lesson's own prose.
// Clicking a world opens its description in a popup anchored at the dot.

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
      "No scheming, but models are apparent-success seekers: no hidden goals, just trained habits that optimize for looking successful — overselling, downplaying failures, quietly skipping what's hard to check. Failures concentrate exactly where verification is expensive.",
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
      "Models are coherently scheming, and it shows: incriminating behavior, escape attempts, clear catches.",
  },
  {
    id: "lurkville",
    name: "Lurkville",
    x: 0.88,
    y: 0.1,
    blurb:
      "Models are coherently scheming and hiding it. No catches, no incidents. By definition it looks like Easyland from the inside — the measured-vs-actual gap as an entire world.",
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

/** Popup transform keeping the card over the plane: shift sideways near the
 * plane's edges, open below top-row dots and above bottom-row dots. */
function popupTransform(w: World): string {
  const tx = w.x < 0.2 ? "-15%" : w.x > 0.8 ? "-85%" : "-50%";
  const ty = w.y > 0.5 ? "18px" : "calc(-100% - 18px)";
  return `translate(${tx}, ${ty})`;
}

const EASYLAND = WORLDS[0];
const LURKVILLE = WORLDS[4];

export function FiveWorldsDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const world = WORLDS.find((w) => w.id === selected);

  return (
    <div className="space-y-2">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="The five worlds mapped by how misaligned the models actually are (horizontal) against how alarming it looks from the inside (vertical); Lurkville sits in the same looks-fine row as Easyland"
        >
          {/* Plane — clicking the background closes the popup */}
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
                aria-expanded={open}
                aria-label={`${w.name} — click for its description`}
                onClick={() => setSelected((s) => (s === w.id ? null : w.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected((s) => (s === w.id ? null : w.id));
                  }
                }}
                className="cursor-pointer outline-none"
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

        {/* Popup anchored at the selected dot */}
        {world && (
          <div
            className="border-border bg-card shadow-soft absolute z-10 w-60 rounded-lg border p-3"
            style={{
              left: `${(px(world.x) / W) * 100}%`,
              top: `${(py(world.y) / H) * 100}%`,
              transform: popupTransform(world),
            }}
          >
            <p className="text-sm font-medium">{world.name}</p>
            <p className="text-muted-foreground mt-1 text-xs">{world.blurb}</p>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        Click a world to read it. The horizontal axis is the world state
        itself; the vertical axis is what the epistemic state can see — which
        is why Lurkville and Easyland share a row.
      </p>
    </div>
  );
}
