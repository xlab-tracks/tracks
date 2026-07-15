"use client";

import { useId, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Axis geometry in viewBox units. The arrival of transformative usefulness is
// fixed; the slider moves only the control frontier.
const VIEW_W = 560;
const VIEW_H = 190;
const AXIS_Y = 95;
const BAND_X0 = 40;
const BAND_X1 = 520;
const TU_X = 200;
const FRONTIER_MAX_X = 440;
const BAND_H = 12;

const REGION_STYLES = {
  neutral: { fill: "#e5e5e5", edge: "#a3a3a3", text: "#525252" },
  window: { fill: "#bbf7d0", edge: "#16a34a", text: "#15803d" },
  beyond: { fill: "#fee2e2", edge: "#ef4444", text: "#b91c1c" },
} as const;

/**
 * What time inside the window buys, taken from the reading itself: the
 * definition of transformative usefulness (substantially reducing risk from
 * subsequent AIs, "likely by speeding up R&D … by a large factor (perhaps
 * 30x)"), the Karnofsky activity list the authors endorse (safety research,
 * security, defense/hardening, detecting and obstructing misaligned AIs,
 * enforcing agreements), using AI labor to extend the delay itself, and
 * holding control "until they have an extremely solid argument for
 * alignment". Ordered by ambition; each unlocks as the window widens.
 */
const MILESTONES: { threshold: number; lead: string; text: string }[] = [
  {
    threshold: 12,
    lead: "Massively accelerate safety research.",
    text: "The point of these models: speed up safety R&D by a large factor (perhaps 30×), using safe systems to make still-more-powerful systems safe and to build ever-more-robust safety techniques.",
  },
  {
    threshold: 38,
    lead: "Harden the world.",
    text: "Find and patch security holes at scale, and deploy safe systems across the economy so any misaligned AIs have to compete with them for power and money.",
  },
  {
    threshold: 64,
    lead: "Police rogue AIs and extend the delay.",
    text: "Monitor for and obstruct misaligned-AI activity, help enforce agreements like \"no models past capability X without passing safety tests\": AI labor that itself buys more time before uncontrollable AI.",
  },
  {
    threshold: 88,
    lead: "Exit on our terms.",
    text: "Building wildly superintelligent AI could wait for decades while these models solve a host of problems, keeping control until there's an extremely solid argument for alignment.",
  },
];

/**
 * A horizontal curly brace spanning [x1, x2], arms at `y`, nub pointing away
 * from the axis (dir -1 = up, 1 = down).
 */
function bracePath(x1: number, x2: number, y: number, dir: 1 | -1): string {
  const d1 = 6 * dir;
  const d2 = 12 * dir;
  const r = Math.min(8, (x2 - x1) / 4);
  const mid = (x1 + x2) / 2;
  return [
    `M ${x1} ${y}`,
    `Q ${x1} ${y + d1} ${x1 + r} ${y + d1}`,
    `L ${mid - r} ${y + d1}`,
    `Q ${mid} ${y + d1} ${mid} ${y + d2}`,
    `Q ${mid} ${y + d1} ${mid + r} ${y + d1}`,
    `L ${x2 - r} ${y + d1}`,
    `Q ${x2} ${y + d1} ${x2} ${y}`,
  ].join(" ");
}

/**
 * The control timeline: a schematic ordering of possible model regimes, from
 * not-yet-transformatively-useful through the control window to
 * uncontrollable. The slider sets how much time we have with transformatively
 * useful, controllable models; widening it lights up what time inside the
 * window buys (per the reading). At the minimum the window disappears
 * entirely: a world in which models are already uncontrollable by the time
 * they are transformatively useful. Distances are deliberately qualitative:
 * an ordering of successive frontier systems, not calendar time.
 */
export function ControlTimeline() {
  const markerId = useId();
  const sliderId = useId();
  // 0–100 → frontier position; start moderate so both directions have news.
  const [width, setWidth] = useState(50);
  const frontierX = TU_X + (width / 100) * (FRONTIER_MAX_X - TU_X);
  const hasWindow = frontierX - TU_X > 1;

  return (
    <div className="border-border bg-card mt-2 rounded-lg border p-3">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="The control timeline: a schematic axis from now to the future with three regions — not yet transformatively useful, the control window, and uncontrollable. A slider adjusts how long models remain controllable after becoming transformatively useful."
        className="h-auto w-full"
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 8 8"
            refX={7}
            refY={4}
            markerWidth={7}
            markerHeight={7}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#a3a3a3" />
          </marker>
        </defs>

        {/* The thin double-ended axis. */}
        <line
          x1={16}
          y1={AXIS_Y}
          x2={544}
          y2={AXIS_Y}
          stroke="#a3a3a3"
          strokeWidth={1.5}
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />
        <text x={16} y={AXIS_Y - 18} fontSize={11} fontWeight={600} fill="#525252">
          Now
        </text>
        <text
          x={544}
          y={AXIS_Y - 18}
          fontSize={11}
          fontWeight={600}
          fill="#525252"
          textAnchor="end"
        >
          The future
        </text>

        {/* Region bands riding the axis. */}
        <rect
          x={BAND_X0}
          y={AXIS_Y - BAND_H / 2}
          width={TU_X - BAND_X0}
          height={BAND_H}
          rx={3}
          fill={REGION_STYLES.neutral.fill}
          stroke={REGION_STYLES.neutral.edge}
          strokeWidth={0.75}
        />
        {hasWindow && (
          <rect
            x={TU_X}
            y={AXIS_Y - BAND_H / 2}
            width={frontierX - TU_X}
            height={BAND_H}
            rx={3}
            fill={REGION_STYLES.window.fill}
            stroke={REGION_STYLES.window.edge}
            strokeWidth={0.75}
          />
        )}
        <rect
          x={frontierX}
          y={AXIS_Y - BAND_H / 2}
          width={BAND_X1 - frontierX}
          height={BAND_H}
          rx={3}
          fill={REGION_STYLES.beyond.fill}
          stroke={REGION_STYLES.beyond.edge}
          strokeWidth={0.75}
        />

        {/* Brace above the control window. */}
        {hasWindow && (
          <>
            <path
              d={bracePath(TU_X, frontierX, AXIS_Y - BAND_H / 2 - 4, -1)}
              fill="none"
              stroke={REGION_STYLES.window.edge}
              strokeWidth={1.25}
            />
            <text
              x={(TU_X + frontierX) / 2}
              y={AXIS_Y - BAND_H / 2 - 26}
              fontSize={11.5}
              fontWeight={600}
              fill={REGION_STYLES.window.text}
              textAnchor="middle"
            >
              Control window
            </text>
          </>
        )}

        {/* Braces beneath the outer regions. */}
        <path
          d={bracePath(BAND_X0, TU_X, AXIS_Y + BAND_H / 2 + 4, 1)}
          fill="none"
          stroke={REGION_STYLES.neutral.edge}
          strokeWidth={1.25}
        />
        <text
          x={(BAND_X0 + TU_X) / 2}
          y={AXIS_Y + BAND_H / 2 + 34}
          fontSize={11}
          fill={REGION_STYLES.neutral.text}
          textAnchor="middle"
        >
          <tspan x={(BAND_X0 + TU_X) / 2} dy={0}>
            Not yet
          </tspan>
          <tspan x={(BAND_X0 + TU_X) / 2} dy={13}>
            transformatively useful
          </tspan>
        </text>
        <path
          d={bracePath(frontierX, BAND_X1, AXIS_Y + BAND_H / 2 + 4, 1)}
          fill="none"
          stroke={REGION_STYLES.beyond.edge}
          strokeWidth={1.25}
        />
        <text
          x={(frontierX + BAND_X1) / 2}
          y={AXIS_Y + BAND_H / 2 + 40}
          fontSize={11}
          fontWeight={600}
          fill={REGION_STYLES.beyond.text}
          textAnchor="middle"
        >
          Uncontrollable
        </text>
      </svg>

      <div className="mt-2 px-1">
        <label
          htmlFor={sliderId}
          className="text-muted-foreground text-xs font-medium"
        >
          Time that we have transformatively useful, controllable models
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="accent-primary mt-1 block w-full"
        />

        {/* What the window buys — the reading's own argument, unlocked as the
            learner widens the window. */}
        <p className="text-muted-foreground mt-3 text-xs font-medium tracking-wide uppercase">
          What the window buys
        </p>
        {!hasWindow && (
          <p className="mt-1.5 text-sm font-medium" style={{ color: REGION_STYLES.beyond.text }}>
            No window: models are already uncontrollable by the time they’re
            transformatively useful, so control never gets the chance to pay
            off.
          </p>
        )}
        <ul className="mt-1.5 space-y-1.5">
          {MILESTONES.map((milestone) => {
            const lit = width >= milestone.threshold;
            return (
              <li
                key={milestone.lead}
                className={cn(
                  "flex items-start gap-2 text-sm transition-opacity duration-300",
                  lit ? "opacity-100" : "opacity-45",
                )}
              >
                {lit ? (
                  <CheckCircle2
                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className="text-muted-foreground mt-0.5 size-3.5 shrink-0 opacity-40"
                    aria-hidden
                  />
                )}
                <span className={cn(!lit && "text-muted-foreground")}>
                  <span className="font-medium">{milestone.lead}</span>{" "}
                  <span className="text-muted-foreground">{milestone.text}</span>
                </span>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground/80 mt-2.5 text-xs">
          Widths are qualitative: an ordering of successive frontier systems,
          not calendar time. The window’s width isn’t fixed in advance. It
          depends on how fast capabilities are pushed past transformative
          usefulness, and the reading argues we should hold off on building
          uncontrollable AI for as long as possible.
        </p>
      </div>
    </div>
  );
}
