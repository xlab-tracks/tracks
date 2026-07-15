import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Geometry. One panel is a 280×232 viewBox: a capability-vs-time plot (axes,
// two dashed thresholds, the capability curve, the green window band and
// generation dots), plus the 1-D shadow timeline projected beneath it.
// Both worlds share the plot frame, the start point, and the moment the curve
// crosses the transformatively-useful line, so every visible difference is a
// world-difference, not a chart-difference.
// ---------------------------------------------------------------------------

const PLOT_LEFT = 34;
const PLOT_RIGHT = 258;
const PLOT_TOP = 16;
const AXIS_Y = 180;
const CURVE_START_Y = 172;
const TU_Y = 136; // transformatively useful: same height in both panels

const COLORS = {
  useful: "#2563eb", // blue: usefulness threshold
  frontier: "#dc2626", // red: control frontier
  window: "#16a34a", // green: window and everything inside it
  windowFill: "#86efac",
  ink: "#404040", // capability curve
  muted: "#737373",
  track: "#e5e5e5",
};

/** Sample a capability function into an SVG path (screen y, so lower = more capable). */
function samplePath(
  fn: (x: number) => number,
  x0: number,
  x1: number,
  step: number,
): string {
  const parts: string[] = [];
  for (let x = x0; x <= x1 + 1e-9; x += step) {
    parts.push(`${parts.length === 0 ? "M" : "L"} ${x.toFixed(1)} ${fn(x).toFixed(1)}`);
  }
  return parts.join(" ");
}

// World A: a natural takeoff. y = start − a·(e^((x−x0)/σ) − 1): nearly flat
// early, then accelerating hard. Calibrated so the curve crosses TU (Δ36) at
// x = 92 and the high frontier (Δ126) at x ≈ 135 — a narrow window that four
// generations still fit inside.
const A_A = 11.03;
const A_SIGMA = 40;
const curveA = (x: number) =>
  CURVE_START_Y - A_A * (Math.exp((x - PLOT_LEFT) / A_SIGMA) - 1);

// World B: flattening through the window, then accelerating rapidly again
// past the frontier. A saturating base plus a late exponential:
// y = start − [L·(1 − e^(−(x−x0)/τ)) + b·(e^((x−x0)/σ) − 1)]; the second term
// is negligible inside the window and takes over beyond it. Calibrated so the
// curve crosses TU at the same x = 92 as World A and the nearby frontier
// (Δ60) at x ≈ 193 — a wide window in time that fits a single generation.
const B_L = 64;
const B_TAU = 70.5;
const B_B = 0.0038;
const B_SIGMA = 24;
const curveB = (x: number) =>
  CURVE_START_Y -
  (B_L * (1 - Math.exp(-(x - PLOT_LEFT) / B_TAU)) +
    B_B * (Math.exp((x - PLOT_LEFT) / B_SIGMA) - 1));

interface WorldSpec {
  tag: string;
  name: string;
  subline: string;
  frontierY: number;
  path: string;
  crossTU: number;
  crossFrontier: number;
  generations: {
    x: number;
    y: number;
    label: string;
    /** Past the frontier: drawn hollow. */
    hollow?: boolean;
    /** Before the window: drawn grayed out. */
    pre?: boolean;
  }[];
}

const WORLD_A: WorldSpec = {
  tag: "A",
  name: "Wide in capability, brief in time",
  subline: "more room · less time · 4 generations fit",
  frontierY: 46,
  path: samplePath(curveA, PLOT_LEFT, 142, 4),
  crossTU: 92,
  crossFrontier: 134.8,
  generations: [
    // An earlier generation, before the model is transformatively useful.
    { x: 64, y: curveA(64), label: "M0", pre: true },
    ...[98, 110, 121, 131].map((x, i) => ({ x, y: curveA(x), label: `M${i + 1}` })),
  ],
};

const WORLD_B: WorldSpec = {
  tag: "B",
  name: "Narrow in capability, long in time",
  subline: "less room · more time · 1 generation fits",
  frontierY: 112,
  path: samplePath(curveB, PLOT_LEFT, PLOT_RIGHT, 4),
  crossTU: 92,
  crossFrontier: 193,
  generations: [
    { x: 64, y: curveB(64), label: "M0", pre: true },
    { x: 130, y: curveB(130), label: "M1" },
    // The next generation lands exactly at the frontier: already past control.
    { x: 193, y: 112, label: "M2", hollow: true },
    // And the one after rides the renewed acceleration, well past it.
    { x: 242, y: curveB(242), label: "M3", hollow: true },
  ],
};

function Panel({ world, markerId }: { world: WorldSpec; markerId: string }) {
  return (
    <div className="min-w-[240px] flex-1 basis-[260px]">
      <div className="flex items-baseline gap-2">
        <span
          aria-hidden
          className="border-foreground/30 text-foreground inline-flex size-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold"
        >
          {world.tag}
        </span>
        <span className="text-sm font-semibold tracking-tight">{world.name}</span>
      </div>
      <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
        {world.subline}
      </p>

      <svg
        viewBox="0 0 280 232"
        role="img"
        aria-label={`World ${world.tag}: ${world.name}. ${world.subline}.`}
        className="mt-1 h-auto w-full"
      >
        {/* Control window: the stretch of time between the two thresholds. */}
        <rect
          x={world.crossTU}
          y={PLOT_TOP}
          width={world.crossFrontier - world.crossTU}
          height={AXIS_Y - PLOT_TOP}
          fill={COLORS.window}
          opacity={0.12}
        />

        {/* Axes. */}
        <line
          x1={PLOT_LEFT}
          y1={AXIS_Y + 6}
          x2={PLOT_LEFT}
          y2={PLOT_TOP - 2}
          stroke={COLORS.muted}
          strokeWidth={1.25}
          markerEnd={`url(#${markerId})`}
        />
        <line
          x1={PLOT_LEFT - 6}
          y1={AXIS_Y}
          x2={PLOT_RIGHT + 4}
          y2={AXIS_Y}
          stroke={COLORS.muted}
          strokeWidth={1.25}
          markerEnd={`url(#${markerId})`}
        />
        <text x={PLOT_LEFT} y={AXIS_Y + 13} fontSize={9} fill={COLORS.muted} textAnchor="middle">
          now
        </text>
        <text
          x={PLOT_RIGHT + 2}
          y={AXIS_Y + 13}
          fontSize={9}
          fill={COLORS.muted}
          textAnchor="end"
        >
          time
        </text>
        <text
          x={11}
          y={98}
          fontSize={9}
          fill={COLORS.muted}
          textAnchor="middle"
          transform="rotate(-90 11 98)"
        >
          capability
        </text>

        {/* Thresholds. */}
        <line
          x1={PLOT_LEFT}
          y1={TU_Y}
          x2={PLOT_RIGHT}
          y2={TU_Y}
          stroke={COLORS.useful}
          strokeWidth={1.25}
          strokeDasharray="5 4"
        />
        <line
          x1={PLOT_LEFT}
          y1={world.frontierY}
          x2={PLOT_RIGHT}
          y2={world.frontierY}
          stroke={COLORS.frontier}
          strokeWidth={1.25}
          strokeDasharray="5 4"
        />

        {/* Capability curve: draws in once on load, static under reduced motion. */}
        <path
          d={world.path}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={1.75}
          pathLength={1}
          className="two-worlds-curve"
        />

        {/* Generation dots: gray before the window, solid green inside it,
            hollow beyond the frontier. */}
        {world.generations.map((gen) => (
          <g key={gen.label}>
            <circle
              cx={gen.x}
              cy={gen.y}
              r={4}
              fill={gen.pre ? "#d4d4d4" : gen.hollow ? "#ffffff" : COLORS.window}
              stroke={gen.pre ? "#a3a3a3" : gen.hollow ? COLORS.window : "#15803d"}
              strokeWidth={gen.hollow ? 1.5 : 1}
            />
            <text
              x={gen.hollow ? gen.x + 7 : gen.x - 7}
              y={gen.hollow ? gen.y - 6 : gen.y - 5}
              fontSize={8.5}
              fontWeight={600}
              fill={gen.pre ? "#a3a3a3" : COLORS.muted}
              textAnchor={gen.hollow ? "start" : "end"}
            >
              {gen.label}
            </text>
          </g>
        ))}

        {/* Shadow timeline: the window projected onto the time axis — the 1-D
            bar from the earlier control timeline. */}
        <rect
          x={PLOT_LEFT}
          y={204}
          width={PLOT_RIGHT - PLOT_LEFT}
          height={8}
          rx={4}
          fill={COLORS.track}
        />
        <rect
          x={world.crossTU}
          y={204}
          width={world.crossFrontier - world.crossTU}
          height={8}
          rx={4}
          fill={COLORS.windowFill}
          stroke={COLORS.window}
          strokeWidth={0.75}
        />
        <text
          x={(PLOT_LEFT + PLOT_RIGHT) / 2}
          y={226}
          fontSize={8.5}
          fontStyle="italic"
          fill={COLORS.muted}
          textAnchor="middle"
        >
          window projected onto time
        </text>
      </svg>
    </div>
  );
}

function LegendSwatchLine({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 22 8" className="h-2 w-[22px] shrink-0" aria-hidden>
      <line x1={0} y1={4} x2={22} y2={4} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
    </svg>
  );
}

/**
 * Two worlds, two windows: a two-panel figure contrasting a window that is
 * wide in capability but brief in time (A) with one that is narrow in
 * capability but long in time (B). Identical axes and visual weight in both
 * panels; neither is styled as better. Persistent above both of the
 * exercise's questions.
 */
export function TwoWorldsFigure({ className }: { className?: string }) {
  // One shared marker id: the component renders once per exercise instance.
  const markerId = "two-worlds-arrow";
  return (
    <figure className={cn("border-border bg-card rounded-lg border p-4", className)}>
      <svg width={0} height={0} className="absolute" aria-hidden>
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 8 8"
            refX={6.5}
            refY={4}
            markerWidth={6}
            markerHeight={6}
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill={COLORS.muted} />
          </marker>
        </defs>
      </svg>

      <div className="flex flex-wrap gap-x-6 gap-y-4">
        <Panel world={WORLD_A} markerId={markerId} />
        <Panel world={WORLD_B} markerId={markerId} />
      </div>

      {/* Legend: the two thresholds, the window swatch, the generation dot. */}
      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1.5">
          <LegendSwatchLine color={COLORS.useful} />
          transformatively useful
        </span>
        <span className="flex items-center gap-1.5">
          <LegendSwatchLine color={COLORS.frontier} />
          control frontier: the capability level beyond which no affordable
          protocol retains the control property
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-3 w-4 shrink-0 rounded-[3px]"
            style={{ background: COLORS.windowFill, border: `1px solid ${COLORS.window}` }}
          />
          control window
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: COLORS.window }}
          />
          model generation
        </span>
      </div>

      <figcaption className="text-muted-foreground border-border mt-3 border-t pt-3 text-sm">
        <strong className="text-foreground">Same start, different futures.</strong>{" "}
        Both worlds cross the <em>transformatively useful</em> line at the same
        moment. In <strong>World A</strong> the control frontier sits far above
        — protocols scale across several model generations — but capabilities
        race there in little time. In <strong>World B</strong> the frontier is
        near, so only one generation stays controllable, yet the lab lingers
        inside the window for years. Read the lower timelines alone and A looks
        like the worse deal — but that flat &ldquo;window in time&rdquo; view
        hides that A packs four controllable generations into its sliver where
        B fits one. Time is only one of the window&rsquo;s dimensions.
      </figcaption>
    </figure>
  );
}
