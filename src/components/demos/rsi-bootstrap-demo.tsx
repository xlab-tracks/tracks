"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/components/demos/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

// The bootstrapping "circle model" as a self-playing animation (5s per
// phase, looping; pausable, dots scrub and pause, reduced-motion starts
// paused on the finished diagram). Phase 0: Gen N
// alone, center stage, tagged as a TUAI. Step 1: it moves into the loop and
// runs its two jobs (alignment research, building the next generation) while
// the capability ladder initializes. Step 2: handoff — Gen N+1 takes over.
// Then the loop repeats up the ladder to superintelligence. Elements are
// invisible (opacity 0) until their step introduces them; they fade/slide in
// and stay. Purely illustrative — no model behind it.

const STEPS = [
  {
    caption:
      "Generation N is a transformatively useful AI (TUAI) that can help us align and build the following generation.",
  },
  {
    caption:
      "Gen N performs alignment research and helps build the next generation, Gen N+1.",
  },
  {
    caption:
      "Handoff: Gen N+1, which should be more capable and aligned by Gen N's research if the plan works, takes over as the builder.",
  },
  {
    caption:
      "Gen N+1 aligns and builds Gen N+2, which takes over alignment research and helps build the next generation.",
  },
  {
    caption:
      "The loop repeats until superintelligence is reached, which is called bootstrapping.",
  },
];

// Which cycle beats are highlighted at each step (research, build, hand off).
const BEATS_LIT: number[][] = [[], [0, 1], [2], [0, 1, 2], [0, 1, 2]];
// Who currently sits in the middle of the loop.
const BUILDER: string[] = ["Gen N", "Gen N", "Gen N+1", "Gen N+2", "Gen N+k"];
// How many ladder rungs are lit (bottom-up); unlit rungs are invisible.
const RUNGS = ["Gen N", "Gen N+1", "Gen N+2", "⋯", "Superintelligence"];
const RUNGS_LIT = [0, 1, 2, 3, 5];

const CX = 130;
const CY = 128;
const R = 82;
// Where the builder chip sits before the loop exists (center stage).
const STAGE_X = 280;

// A beat's arc segment on the circle: start/end angles in degrees
// (SVG angles, 0° = 3 o'clock, clockwise), with a gap between beats, plus
// the step that introduces it.
const BEAT_ARCS = [
  {
    from: 210,
    to: 320,
    lines: ["does alignment research"],
    lx: CX,
    ly: 26,
    anchor: "middle" as const,
    appearsAt: 1,
  },
  {
    from: 340,
    to: 80,
    lines: ["builds the next", "generation"],
    lx: 226,
    ly: 190,
    anchor: "start" as const,
    appearsAt: 1,
  },
  {
    from: 100,
    to: 190,
    lines: ["hands off"],
    lx: 42,
    ly: 224,
    anchor: "middle" as const,
    appearsAt: 2,
  },
];

function arcPath(from: number, to: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x = (deg: number) => CX + R * Math.cos(rad(deg));
  const y = (deg: number) => CY + R * Math.sin(rad(deg));
  const large = ((to - from + 360) % 360) > 180 ? 1 : 0;
  return `M ${x(from).toFixed(1)} ${y(from).toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x(to).toFixed(1)} ${y(to).toFixed(1)}`;
}

const PHASE_MS = 5000;

// Thin shell: the reduced-motion preference picks the animation's INITIAL
// state (reduced → paused on the finished diagram) instead of patching it
// after mount. While the preference is unknown (server HTML + hydration
// frame) we render the paused finished diagram; the key remounts the
// animation into the right initial state once the preference is known.
export function RsiBootstrapDemo() {
  const reduced = usePrefersReducedMotion();
  return (
    <RsiBootstrapAnimation
      key={String(reduced)}
      initialStep={reduced === false ? 0 : STEPS.length - 1}
      initialPlaying={reduced === false}
    />
  );
}

function RsiBootstrapAnimation({
  initialStep,
  initialPlaying,
}: {
  initialStep: number;
  initialPlaying: boolean;
}) {
  const [step, setStep] = useState(initialStep);
  const [playing, setPlaying] = useState(initialPlaying);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => setStep((s) => (s + 1) % STEPS.length),
      PHASE_MS,
    );
    return () => clearInterval(timer);
  }, [playing]);

  const litRungs = RUNGS_LIT[step];
  const loopVisible = step >= 1;
  const ladderVisible = step >= 2;

  return (
    <div className="space-y-4">
      <svg
        viewBox="0 0 560 260"
        className="w-full"
        role="img"
        aria-label="The bootstrapping loop: each generation does alignment research, builds the next generation, and hands off — climbing a capability ladder toward superintelligence."
      >
        <defs>
          <marker
            id="rsi-arrow"
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--primary)" />
          </marker>
        </defs>

        {/* --- The circle model (appears at step 1; centered until the
            ladder exists, then slides left) --- */}
        <g
          className="transition-all duration-700 ease-in-out motion-reduce:transition-none"
          opacity={loopVisible ? 1 : 0}
          style={{ transform: `translate(${ladderVisible ? 0 : STAGE_X - CX}px, 0px)` }}
        >
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1.5}
          />
          {BEAT_ARCS.map((arc, i) => {
            const introduced = step >= arc.appearsAt;
            const lit = BEATS_LIT[step].includes(i);
            return (
              <g
                key={arc.lines[0]}
                className="transition-opacity duration-500 motion-reduce:transition-none"
                opacity={introduced ? 1 : 0}
              >
                <path
                  d={arcPath(arc.from, arc.to)}
                  fill="none"
                  stroke={lit ? "var(--primary)" : "var(--muted-foreground)"}
                  strokeWidth={lit ? 3 : 1.5}
                  markerEnd={lit ? "url(#rsi-arrow)" : undefined}
                  className="transition-all duration-500 motion-reduce:transition-none"
                />
                <text
                  x={arc.lx}
                  y={arc.ly}
                  fontSize={10}
                  textAnchor={arc.anchor}
                  fill={lit ? "var(--primary)" : "var(--muted-foreground)"}
                  fontWeight={lit ? 600 : 400}
                  className="transition-all duration-500 motion-reduce:transition-none"
                >
                  {arc.lines.map((line, li) => (
                    <tspan key={line} x={arc.lx} dy={li === 0 ? 0 : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>

        {/* --- The builder chip: center stage, then into the loop --- */}
        <g
          className="transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{
            transform: `translate(${ladderVisible ? CX : STAGE_X}px, ${CY}px)`,
          }}
        >
          <rect
            x={-44}
            y={-16}
            width={88}
            height={32}
            rx={8}
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={1.5}
          />
          <text
            x={0}
            y={4}
            fontSize={12}
            fontWeight={600}
            textAnchor="middle"
            fill="var(--foreground)"
          >
            {BUILDER[step]}
          </text>
          <text
            x={0}
            y={30}
            fontSize={9}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            className="transition-opacity duration-500 motion-reduce:transition-none"
            opacity={step === 0 ? 1 : 0}
          >
            a transformatively useful AI (TUAI)
          </text>
        </g>

        {/* --- The capability ladder (initializes at step 2, alongside the
            first handoff) --- */}
        <g
          className="transition-opacity duration-500 motion-reduce:transition-none"
          opacity={ladderVisible ? 1 : 0}
        >
          {RUNGS.map((label, i) => {
            const y = 218 - i * 46;
            const lit = i < litRungs;
            const isTop = i === RUNGS.length - 1;
            return (
              <g
                key={label}
                className="transition-opacity duration-500 motion-reduce:transition-none"
                opacity={lit ? 1 : 0}
              >
                <rect
                  x={356}
                  y={y}
                  width={172}
                  height={34}
                  rx={8}
                  fill="var(--primary)"
                  fillOpacity={isTop ? 0.22 : 0.12}
                  stroke="var(--primary)"
                  strokeWidth={isTop ? 2 : 1.25}
                />
                <text
                  x={442}
                  y={y + 21}
                  fontSize={11}
                  fontWeight={600}
                  textAnchor="middle"
                  fill="var(--foreground)"
                >
                  {label}
                </text>
                {i > 0 && (
                  <line
                    x1={442}
                    y1={y + 44}
                    x2={442}
                    y2={y + 38}
                    stroke="var(--primary)"
                    strokeWidth={1}
                    markerEnd="url(#rsi-arrow)"
                  />
                )}
              </g>
            );
          })}
          {/* Loop → ladder: each lap climbs one rung */}
          <path
            d="M 224 128 C 280 128 300 128 348 128"
            fill="none"
            stroke={step >= 2 ? "var(--primary)" : "var(--muted-foreground)"}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            markerEnd="url(#rsi-arrow)"
            className="transition-all duration-500 motion-reduce:transition-none"
          />
        </g>
      </svg>

      <p
        key={step}
        className="text-muted-foreground mx-auto min-h-10 max-w-xl text-center text-sm"
        aria-live="polite"
      >
        {STEPS[step].caption}
      </p>

      <div className="flex items-center justify-center gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause animation" : "Play animation"}
          className="gap-1"
        >
          {playing ? (
            <>
              <Pause className="size-3.5" aria-hidden /> Pause
            </>
          ) : (
            <>
              <Play className="size-3.5" aria-hidden /> Play
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setStep((s) => (s - 1 + STEPS.length) % STEPS.length);
          }}
          aria-label="Previous phase"
          className="gap-1"
        >
          <ChevronLeft className="size-3.5" aria-hidden /> Back
        </Button>
        <div className="flex items-center gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep(i);
              }}
              className={cn(
                "size-2 rounded-full transition-colors motion-reduce:transition-none",
                i === step ? "bg-primary" : "bg-border hover:bg-muted-foreground/50",
              )}
              tabIndex={-1}
            />
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setStep((s) => (s + 1) % STEPS.length);
          }}
          aria-label="Next phase"
          className="gap-1"
        >
          Next <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
