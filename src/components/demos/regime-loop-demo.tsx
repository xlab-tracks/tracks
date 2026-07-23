"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/components/demos/use-prefers-reduced-motion";

// The regime model's loop (module 2, "Determining the usefulness") as a
// self-playing animation: the resource state alone, then it buys a
// technique, then the technique's effect on the world stacks vertically,
// then the epistemic state completes the diamond and the cycle closes —
// advancing on a timer and looping. Nodes glide between layouts; each
// layout's arrows cross-fade in place. Captions restate the lesson's five
// numbered loop steps, after an unnumbered setup phase. Pausable; clicking
// a dot scrubs and pauses; users with reduced motion start paused on the
// finished diagram.

const PHASE_MS = 5000;

interface Phase {
  label: string;
  caption: string;
}

const STEPS: Phase[] = [
  {
    label: "Setup — the resource state",
    caption:
      "Everything starts at the resource state — the safety budget: the political-will account, and the prices the regime sets.",
  },
  {
    label: "It buys a technique",
    caption:
      "The resource state buys a technique — say, a monitoring protocol for the lab's internal AI agents.",
  },
  {
    label: "The technique changes the facts",
    caption:
      "The schemer that would have quietly sabotaged research may now be caught. The world state updates based on this catch — what has happened with the model so far is part of the world state.",
  },
  {
    label: "The catch updates what we know",
    caption:
      "There is now clearer proof that the model has schemed against the user.",
  },
  {
    label: "The evidence feeds the budget",
    caption:
      "Leadership and the public become alarmed, refilling political will & potentially leading to regulation passing, locking a floor in place.",
  },
  {
    label: "Around again, one stage up",
    caption:
      "The bigger budget helps buy better techniques for the next, more dangerous capability stage. That spending funds the next round of the inner game.",
  },
];

const W = 560;
const H = 300;
const NODE_W = 128;
const NODE_H = 34;

// Per-step center positions for each node, tracing the choreography:
// centered alone → horizontal pair → vertical stack → diamond.
const POS: Record<string, [number, number][]> = {
  resource: [
    [280, 150],
    [160, 150],
    [280, 54],
    [280, 40],
    [280, 40],
    [280, 40],
  ],
  technique: [
    [400, 150],
    [400, 150],
    [280, 150],
    [470, 150],
    [470, 150],
    [470, 150],
  ],
  world: [
    [280, 246],
    [280, 246],
    [280, 246],
    [280, 260],
    [280, 260],
    [280, 260],
  ],
  epistemic: [
    [90, 150],
    [90, 150],
    [90, 150],
    [90, 150],
    [90, 150],
    [90, 150],
  ],
};

const LABELS: Record<string, string> = {
  resource: "Resource state",
  technique: "Technique",
  world: "World state",
  epistemic: "Epistemic state",
};

// The step at which each node first appears.
const APPEARS: Record<string, number> = {
  resource: 0,
  technique: 1,
  world: 2,
  epistemic: 3,
};

// Which nodes are highlighted at each step.
const LIT: string[][] = [
  ["resource"],
  ["resource", "technique"],
  ["technique", "world"],
  ["world", "epistemic"],
  ["epistemic", "resource"],
  ["resource", "technique", "world", "epistemic"],
];

/** Straight diamond edge between two node centers, inset so arrows sit clear. */
function edgePath(from: [number, number], to: [number, number]): string {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const inset = 78;
  const x1 = from[0] + ux * inset;
  const y1 = from[1] + uy * inset * 0.55;
  const x2 = to[0] - ux * inset;
  const y2 = to[1] - uy * inset * 0.55;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

const DIAMOND: Record<string, [number, number]> = {
  resource: [280, 40],
  technique: [470, 150],
  world: [280, 260],
  epistemic: [90, 150],
};

// Diamond edges in loop order; edge i lights at step i+1 (step 5 lights all).
const DIAMOND_EDGES = [
  { from: "resource", to: "technique", lines: ["buys"], lx: 412, ly: 78 },
  {
    from: "technique",
    to: "world",
    lines: ["changes the facts"],
    lx: 430,
    ly: 218,
  },
  { from: "world", to: "epistemic", lines: ["updates"], lx: 144, ly: 218 },
  {
    from: "epistemic",
    to: "resource",
    lines: ["refills", "political will"],
    lx: 120,
    ly: 74,
  },
];

function Arrow({
  d,
  lit,
  visible,
}: {
  d: string;
  lit: boolean;
  visible: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={lit ? "var(--primary)" : "var(--muted-foreground)"}
      strokeOpacity={visible ? (lit ? 1 : 0.45) : 0}
      strokeWidth={lit ? 2.5 : 1.5}
      markerEnd={
        visible
          ? lit
            ? "url(#loop-arrow)"
            : "url(#loop-arrow-dim)"
          : undefined
      }
      className="transition-all duration-500 motion-reduce:transition-none"
    />
  );
}

function EdgeLabel({
  x,
  y,
  lines,
  lit,
  visible,
}: {
  x: number;
  y: number;
  lines: string[];
  lit: boolean;
  visible: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={10}
      textAnchor="middle"
      fill={lit ? "var(--primary)" : "var(--muted-foreground)"}
      opacity={visible ? 1 : 0}
      fontWeight={lit ? 600 : 400}
      className="transition-all duration-500 motion-reduce:transition-none"
    >
      {lines.map((line, li) => (
        <tspan key={line} x={x} dy={li === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

// Thin shell: reads the reduced-motion preference and picks the initial
// state (reduced → paused on the finished diagram) instead of patching it
// after mount. While the preference is unknown (server HTML + hydration
// frame) we render the paused finished diagram; the key remounts the
// animation into the right initial state once the preference is known.
export function RegimeLoopDemo() {
  const reduced = usePrefersReducedMotion();
  return (
    <RegimeLoopAnimation
      key={String(reduced)}
      initialStep={reduced === false ? 0 : STEPS.length - 1}
      initialPlaying={reduced === false}
    />
  );
}

function RegimeLoopAnimation({
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

  const litNodes = new Set(LIT[step]);
  return (
    <div className="space-y-3">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="The loop: the resource state buys a technique, the technique changes the world state, the catch updates the epistemic state, and the evidence refills the resource state."
          >
            <defs>
              <marker
                id="loop-arrow"
                viewBox="0 0 8 8"
                refX="6"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--primary)" />
              </marker>
              <marker
                id="loop-arrow-dim"
                viewBox="0 0 8 8"
                refX="6"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--muted-foreground)" />
              </marker>
            </defs>

            {/* Step 1 — horizontal pair: resource → technique, "buys" */}
            <Arrow
              d="M 232 150 L 328 150"
              lit={step === 1}
              visible={step === 1}
            />
            <EdgeLabel
              x={280}
              y={136}
              lines={["buys"]}
              lit={step === 1}
              visible={step === 1}
            />

            {/* Step 2 — vertical stack: resource → technique → world */}
            <Arrow
              d="M 280 77 L 280 127"
              lit={false}
              visible={step === 2}
            />
            <EdgeLabel
              x={298}
              y={106}
              lines={["buys"]}
              lit={false}
              visible={step === 2}
            />
            <Arrow
              d="M 280 173 L 280 223"
              lit={step === 2}
              visible={step === 2}
            />
            <EdgeLabel
              x={330}
              y={202}
              lines={["changes the facts"]}
              lit={step === 2}
              visible={step === 2}
            />

            {/* Steps 3+ — the diamond */}
            {DIAMOND_EDGES.map((edge, i) => {
              const visible = step >= 3;
              const lit = step === 5 || (visible && step - 1 === i);
              return (
                <g key={edge.lines[0]}>
                  <Arrow
                    d={edgePath(DIAMOND[edge.from], DIAMOND[edge.to])}
                    lit={lit}
                    visible={visible}
                  />
                  <EdgeLabel
                    x={edge.lx}
                    y={edge.ly}
                    lines={edge.lines}
                    lit={lit}
                    visible={visible}
                  />
                </g>
              );
            })}

            {/* The nodes glide between layouts */}
            {Object.keys(POS).map((id) => {
              const [x, y] = POS[id][step];
              const visible = step >= APPEARS[id];
              const lit = litNodes.has(id);
              return (
                <g
                  key={id}
                  className="transition-all duration-700 ease-in-out motion-reduce:transition-none"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  opacity={visible ? 1 : 0}
                >
                  <rect
                    x={-NODE_W / 2}
                    y={-NODE_H / 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill="var(--card)"
                    stroke={lit && visible ? "var(--primary)" : "var(--border)"}
                    strokeWidth={lit && visible ? 2 : 1.5}
                    className="transition-all duration-500 motion-reduce:transition-none"
                  />
                  <text
                    x={0}
                    y={4}
                    fontSize={12}
                    fontWeight={600}
                    textAnchor="middle"
                    fill="var(--foreground)"
                  >
                    {LABELS[id]}
                  </text>
                </g>
              );
            })}
          </svg>

      <div className="min-h-16 text-sm" aria-live="polite">
        {/* Phase 0 is setup; phases 1-5 carry the lesson's step numbers. */}
        <p className="font-medium">
          {step === 0 ? STEPS[step].label : `${step}. ${STEPS[step].label}`}
        </p>
        <p className="text-muted-foreground mt-1">{STEPS[step].caption}</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
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
          variant="outline"
          size="sm"
          onClick={() => {
            setPlaying(false);
            setStep((s) => (s - 1 + STEPS.length) % STEPS.length);
          }}
          aria-label="Previous phase"
          className="gap-1"
        >
          <ChevronLeft className="size-3.5" aria-hidden /> Back
        </Button>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-label={i === 0 ? s.label : `Step ${i}: ${s.label}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => {
                setPlaying(false);
                setStep(i);
              }}
              className={`size-2.5 rounded-full transition-colors ${
                i === step
                  ? "bg-primary"
                  : "bg-border hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
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
