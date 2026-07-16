"use client";

import { SlideStepper, type SlideStep } from "./slide-stepper";

// Illustrates the additive property of control (module 2, "How useful is AI
// control?"): alignment interventions act on the model itself in an inner
// box; control's applied monitoring wraps around that box without modifying
// it, so it can be added or removed without touching the other agendas.

const STEPS: SlideStep[] = [
  {
    label: "Alignment interventions",
    caption:
      "Training interventions (RLHF, adversarial training) and classifiers or probes act on the model itself, trying to make it trustworthy.",
  },
  {
    label: "Control wraps around",
    caption:
      "Control's applied monitoring — trusted monitoring, auditing, defer-to-trusted, resampling — surrounds those methods without modifying them. Control is additive: it does not interfere with security, alignment, or verification interventions.",
  },
];

const W = 520;
const H = 260;

/** A rounded label chip drawn in SVG. */
function Chip({
  x,
  y,
  w,
  text,
  tone,
}: {
  x: number;
  y: number;
  w: number;
  text: string;
  tone: "inner" | "shell";
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={24}
        rx={12}
        className={
          tone === "inner"
            ? "fill-muted stroke-border"
            : "fill-primary/10 stroke-primary/40"
        }
        strokeWidth={1}
      />
      <text
        x={x + w / 2}
        y={y + 16}
        textAnchor="middle"
        className="fill-foreground text-[11px]"
      >
        {text}
      </text>
    </g>
  );
}

export function AdditiveControlDemo() {
  return (
    <SlideStepper steps={STEPS}>
      {(step) => {
        const shellVisible = step === 1;
        return (
          <div className="space-y-2">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              role="img"
              aria-label="Alignment interventions in an inner box; control's applied monitoring as a shell wrapped around it"
            >
              {/* Shell — control's applied monitoring */}
              <g
                className="transition-opacity duration-500"
                opacity={shellVisible ? 1 : 0}
              >
                <rect
                  x={16}
                  y={16}
                  width={W - 32}
                  height={H - 32}
                  rx={16}
                  className="fill-primary/5 stroke-primary"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
                <text
                  x={W / 2}
                  y={40}
                  textAnchor="middle"
                  className="fill-foreground text-[13px] font-semibold"
                >
                  Control — applied monitoring
                </text>
                <Chip x={36} y={H - 52} w={128} text="trusted monitoring" tone="shell" />
                <Chip x={172} y={H - 52} w={76} text="auditing" tone="shell" />
                <Chip x={256} y={H - 52} w={128} text="defer-to-trusted" tone="shell" />
                <Chip x={392} y={H - 52} w={92} text="resampling" tone="shell" />
              </g>

              {/* Inner box — alignment interventions; identical on every step */}
              <g>
                <rect
                  x={110}
                  y={64}
                  width={W - 220}
                  height={H - 148}
                  rx={12}
                  className="fill-card stroke-border"
                  strokeWidth={1.5}
                />
                <text
                  x={W / 2}
                  y={90}
                  textAnchor="middle"
                  className="fill-foreground text-[13px] font-semibold"
                >
                  Alignment interventions
                </text>
                <text
                  x={W / 2}
                  y={106}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  act on the model itself
                </text>
                <Chip x={126} y={124} w={140} text="training interventions" tone="inner" />
                <Chip x={274} y={124} w={120} text="classifiers / probes" tone="inner" />
              </g>
            </svg>
          </div>
        );
      }}
    </SlideStepper>
  );
}
