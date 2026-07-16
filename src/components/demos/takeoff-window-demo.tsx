"use client";

// Static redraw of the takeoff timeline from Clymer, "Planning for Extreme
// AI Risks" (2025) — capability phases along a timeline, with the Handoff
// band called out as the window in which control operates. Adapted with
// attribution; not a reproduction of the original image.

// Map a (fractional) year to an x coordinate.
const X0 = 24;
const X1 = 696;
const Y0 = 2024.4;
const Y1 = 2032.2;
const xOf = (year: number) => X0 + ((year - Y0) / (Y1 - Y0)) * (X1 - X0);

const BAR_Y = 138;
const BAR_H = 14;

// Phase bands (years are approximate, matching the original figure).
const PHASES = [
  { label: "Prep", from: Y0, to: 2027.2, color: "#a78bfa" },
  { label: "Handoff", from: 2027.2, to: 2028.4, color: "#60a5fa" },
  { label: "Possible Recovery", from: 2028.4, to: 2029.4, color: "#4ade80" },
  { label: "Obsolescence", from: 2029.4, to: Y1, color: "#fdba74" },
];

// Milestones with staggered label heights.
const MILESTONES: {
  year: number;
  lines: string[];
  ly: number;
  anchor?: "start" | "middle" | "end";
}[] = [
  { year: 2025.9, lines: ["3× AI software R&D"], ly: 96 },
  { year: 2026.3, lines: ["First dangerous AI"], ly: 66 },
  { year: 2027.2, lines: ["TEDAI (top human expert", "dominating AI)"], ly: 24 },
  { year: 2028.4, lines: ["Deference to TEDAI"], ly: 66 },
  { year: 2029.0, lines: ["Superdangerous AI"], ly: 96 },
  {
    year: 2031.9,
    lines: ["Irrecoverable catastrophe?", "Or end of acute risk period?"],
    ly: 24,
    anchor: "end",
  },
];

const YEAR_TICKS = [2025, 2027, 2029, 2031];

export function TakeoffWindowDemo() {
  return (
    <div className="space-y-2">
      <svg
        viewBox="0 0 720 236"
        className="w-full"
        role="img"
        aria-label="Takeoff timeline, 2025 to 2031: Prep, then Handoff — the window in which control operates — then Possible Recovery, then Obsolescence. Milestones: 3× AI software R&D, first dangerous AI, TEDAI, deference to TEDAI, superdangerous AI, and finally irrecoverable catastrophe or the end of the acute risk period."
      >
        <defs>
          <marker
            id="takeoff-tip"
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--muted-foreground)" />
          </marker>
        </defs>

        {/* Phase bands */}
        {PHASES.map((phase, i) => {
          const x = xOf(phase.from);
          const w = xOf(phase.to) - x;
          const isHandoff = phase.label === "Handoff";
          return (
            <g key={phase.label}>
              <rect
                x={x}
                y={BAR_Y}
                width={w}
                height={BAR_H}
                fill={phase.color}
                fillOpacity={0.55}
                stroke={isHandoff ? "var(--foreground)" : "none"}
                strokeWidth={isHandoff ? 1.25 : 0}
              />
              <text
                x={x + w / 2}
                y={BAR_Y + BAR_H + 18}
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
                fill={phase.color}
                style={{ filter: "saturate(1.4) brightness(0.82)" }}
              >
                {phase.label}
              </text>
              {isHandoff && (
                <text
                  x={x + w / 2}
                  y={BAR_Y + BAR_H + 32}
                  fontSize={9}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                >
                  control&apos;s window
                </text>
              )}
              {i > 0 && (
                <line
                  x1={x}
                  y1={BAR_Y - 2}
                  x2={x}
                  y2={BAR_Y + BAR_H + 2}
                  stroke="var(--card)"
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}
        {/* Arrowhead continuing right */}
        <path
          d={`M ${X1} ${BAR_Y - 4} L ${X1 + 14} ${BAR_Y + BAR_H / 2} L ${X1} ${BAR_Y + BAR_H + 4} z`}
          fill="#fdba74"
          fillOpacity={0.55}
        />

        {/* Milestones */}
        {MILESTONES.map((m) => {
          const x = xOf(m.year);
          const anchor = m.anchor ?? "middle";
          const lineBottom = m.ly + (m.lines.length - 1) * 12 + 4;
          return (
            <g key={m.lines[0]}>
              <text
                x={x}
                y={m.ly}
                fontSize={10}
                textAnchor={anchor}
                fill="var(--foreground)"
              >
                {m.lines.map((line, li) => (
                  <tspan key={line} x={x} dy={li === 0 ? 0 : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
              <line
                x1={x}
                y1={lineBottom}
                x2={x}
                y2={BAR_Y - 6}
                stroke="var(--muted-foreground)"
                strokeWidth={1.25}
                markerEnd="url(#takeoff-tip)"
              />
            </g>
          );
        })}

        {/* Year axis */}
        <line
          x1={X0}
          y1={212}
          x2={X1 + 14}
          y2={212}
          stroke="var(--border)"
          strokeWidth={1.25}
        />
        {YEAR_TICKS.map((year) => (
          <g key={year}>
            <line
              x1={xOf(year)}
              y1={208}
              x2={xOf(year)}
              y2={216}
              stroke="var(--muted-foreground)"
              strokeWidth={1.25}
            />
            <text
              x={xOf(year)}
              y={230}
              fontSize={10}
              textAnchor="middle"
              fill="var(--muted-foreground)"
            >
              {year}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-muted-foreground text-center text-xs">
        Adapted from{" "}
        <a
          href="https://www.lesswrong.com/posts/8vgi3fBWPFDLBBcAx/planning-for-extreme-ai-risks"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Clymer, “Planning for Extreme AI Risks” (2025)
        </a>
        .
      </p>
    </div>
  );
}
