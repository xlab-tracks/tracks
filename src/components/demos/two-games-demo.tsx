"use client";

// The two games (module 2, "Determining the usefulness") as a static
// anchor image: the inner game played inside the lab against the
// possibly-scheming model, nested in the outer game played out in the
// world — coupled by evidence flowing out and budget flowing back in.
// Deliberately previews the regime-loop demo without duplicating its
// circuit. Copy restates the lesson's own prose.

const W = 560;
const H = 300;

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
  tone: "inner" | "outer";
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

export function TwoGamesDemo() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="The inner game inside the lab nested in the outer game out in the world, coupled by evidence flowing out and budget flowing back in"
    >
      <defs>
        <marker
          id="tg-arrow"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 z" className="fill-primary" />
        </marker>
      </defs>

      {/* Outer game — out in the world */}
      <rect
        x={16}
        y={16}
        width={W - 32}
        height={H - 32}
        rx={16}
        className="fill-primary/5 stroke-primary/50"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      <text
        x={W / 2}
        y={42}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        The outer game — out in the world
      </text>
      <text
        x={W / 2}
        y={58}
        textAnchor="middle"
        className="fill-muted-foreground text-[10px]"
      >
        growing the resources available to spend
      </text>
      <Chip x={116} y={H - 52} w={96} text="leadership" tone="outer" />
      <Chip x={220} y={H - 52} w={96} text="the public" tone="outer" />
      <Chip x={324} y={H - 52} w={104} text="governments" tone="outer" />

      {/* Inner game — inside the lab */}
      <rect
        x={132}
        y={78}
        width={W - 264}
        height={124}
        rx={12}
        className="fill-card stroke-border"
        strokeWidth={1.5}
      />
      <text
        x={W / 2}
        y={102}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        The inner game — inside the lab
      </text>
      <text
        x={W / 2}
        y={118}
        textAnchor="middle"
        className="fill-muted-foreground text-[10px]"
      >
        vs. the possibly-scheming model
      </text>
      <Chip x={146} y={132} w={128} text="designing protocols" tone="inner" />
      <Chip x={282} y={132} w={128} text="extracting work" tone="inner" />
      <Chip x={180} y={164} w={198} text="catching bad behavior" tone="inner" />

      {/* Coupling: evidence out, budget back in */}
      <path
        d="M 428 140 C 480 140 496 180 490 236"
        fill="none"
        className="stroke-primary"
        strokeWidth={1.5}
        markerEnd="url(#tg-arrow)"
      />
      <text
        x={492}
        y={132}
        textAnchor="middle"
        className="fill-foreground text-[11px] font-medium"
      >
        evidence
      </text>
      <text
        x={492}
        y={146}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px]"
      >
        a caught schemer
      </text>

      <path
        d="M 70 236 C 64 180 80 140 132 140"
        fill="none"
        className="stroke-primary"
        strokeWidth={1.5}
        markerEnd="url(#tg-arrow)"
      />
      <text
        x={68}
        y={132}
        textAnchor="middle"
        className="fill-foreground text-[11px] font-medium"
      >
        budget
      </text>
      <text
        x={68}
        y={146}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px]"
      >
        safety spending
      </text>
    </svg>
  );
}
