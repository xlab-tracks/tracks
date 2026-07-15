"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type {
  ControlActor,
  ControlActorId,
  ControlFlowEdge,
  ControlFlowGraph,
  ControlFlowNode,
  ControlFlowSide,
} from "@/lib/content/types";

// Actor identity is carried by color AND letter (never color alone). The
// palette is fixed across all scenarios — the graph is a neutral picture of
// the workflow and must not verdict-code anything (see the exercise spec).
export const ACTOR_STYLES: Record<
  ControlActorId,
  { border: string; bg: string; text: string }
> = {
  u: { border: "#dc2626", bg: "#fef2f2", text: "#b91c1c" },
  uprime: { border: "#e11d48", bg: "#fff1f2", text: "#be123c" },
  t: { border: "#2c3e60", bg: "#eef2f8", text: "#233554" },
  h: { border: "#0f766e", bg: "#f0fdfa", text: "#0f766e" },
};

const NEUTRAL = { border: "#d4d4d4", bg: "#fafafa", text: "#525252" };
const EDGE_STROKE = "#a3a3a3";
const JUNCTION_R = 4;

/** HTML (non-SVG) actor letter badge, shared by the cast card and legend. */
export function ActorBadge({
  actor,
  letter,
  className,
}: {
  actor: ControlActorId;
  letter: string;
  className?: string;
}) {
  const style = ACTOR_STYLES[actor];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
        className,
      )}
      style={{
        borderColor: style.border,
        background: style.bg,
        color: style.text,
      }}
    >
      {letter}
    </span>
  );
}

interface NodeMetrics {
  w: number;
  h: number;
  rx: number;
}

function metricsOf(node: ControlFlowNode): NodeMetrics {
  switch (node.kind) {
    case "actor":
      return { w: 84, h: 52, rx: 12 };
    case "terminal":
      return { w: 92, h: 36, rx: 10 };
    case "compare":
      return { w: 82, h: 44, rx: 10 };
    case "junction":
      return { w: JUNCTION_R * 2, h: JUNCTION_R * 2, rx: JUNCTION_R };
  }
}

interface Point {
  x: number;
  y: number;
}

/** Point on the node boundary for a side, shifted along that side's axis. */
function anchor(node: ControlFlowNode, side: ControlFlowSide, offset = 0): Point {
  const { w, h } = metricsOf(node);
  switch (side) {
    case "left":
      return { x: node.x - w / 2, y: node.y + offset };
    case "right":
      return { x: node.x + w / 2, y: node.y + offset };
    case "top":
      return { x: node.x + offset, y: node.y - h / 2 };
    case "bottom":
      return { x: node.x + offset, y: node.y + h / 2 };
  }
}

/** Outward unit direction of a side (edge tangent leaving/entering a node). */
function outward(side: ControlFlowSide): Point {
  switch (side) {
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
    case "top":
      return { x: 0, y: -1 };
    case "bottom":
      return { x: 0, y: 1 };
  }
}

const LOOP_RISE = 92;

interface EdgeGeometry {
  d: string;
  p0: Point;
  c1: Point;
  c2: Point;
  p3: Point;
}

function edgeGeometry(
  edge: ControlFlowEdge,
  from: ControlFlowNode,
  to: ControlFlowNode,
): EdgeGeometry {
  const fromSide = edge.fromSide ?? "right";
  const toSide = edge.toSide ?? "left";
  const p0 = anchor(from, fromSide, edge.fromOffset);
  const p3 = anchor(to, toSide, edge.toOffset);

  let c1: Point;
  let c2: Point;
  if (edge.loop) {
    // Loop-back edge: bow outward past both anchors (the return arc).
    const dirA = outward(fromSide);
    const dirB = outward(toSide);
    c1 = { x: p0.x + dirA.x * LOOP_RISE, y: p0.y + dirA.y * LOOP_RISE };
    c2 = { x: p3.x + dirB.x * LOOP_RISE, y: p3.y + dirB.y * LOOP_RISE };
  } else {
    const dist = Math.hypot(p3.x - p0.x, p3.y - p0.y);
    const k = Math.min(90, Math.max(24, dist * 0.45));
    const dirA = outward(fromSide);
    const dirB = outward(toSide);
    c1 = { x: p0.x + dirA.x * k, y: p0.y + dirA.y * k };
    c2 = { x: p3.x + dirB.x * k, y: p3.y + dirB.y * k };
  }

  const d = `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p3.x} ${p3.y}`;
  return { d, p0, c1, c2, p3 };
}

function bezierPoint(g: EdgeGeometry, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * g.p0.x + b * g.c1.x + c * g.c2.x + d * g.p3.x,
    y: a * g.p0.y + b * g.c1.y + c * g.c2.y + d * g.p3.y,
  };
}

/** Rough text width at the graph's small font sizes (no DOM measurement). */
function estimateWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.56;
}

function EdgeChip({ at, line1, line2 }: { at: Point; line1: string; line2?: string }) {
  const fontSize = 9.5;
  const w =
    Math.max(estimateWidth(line1, fontSize), estimateWidth(line2 ?? "", fontSize)) + 16;
  const h = line2 ? 31 : 18;
  return (
    <g>
      <rect
        x={at.x - w / 2}
        y={at.y - h / 2}
        width={w}
        height={h}
        rx={9}
        fill="#ffffff"
        stroke="#e5e5e5"
      />
      {line2 ? (
        <>
          <text x={at.x} y={at.y - 3} textAnchor="middle" fontSize={fontSize} fill="#525252" fontWeight={500}>
            {line1}
          </text>
          <text x={at.x} y={at.y + 8.5} textAnchor="middle" fontSize={fontSize} fill="#525252" fontWeight={500}>
            {line2}
          </text>
        </>
      ) : (
        <text x={at.x} y={at.y + 3.2} textAnchor="middle" fontSize={fontSize} fill="#525252" fontWeight={500}>
          {line1}
        </text>
      )}
    </g>
  );
}

/** Bare condition label ("malicious", "else") with a halo for legibility. */
function CondLabel({ at, text }: { at: Point; text: string }) {
  return (
    <text
      x={at.x}
      y={at.y}
      textAnchor="middle"
      fontSize={9.5}
      fill="#737373"
      fontStyle="italic"
      stroke="#ffffff"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

function NodeShape({
  node,
  letter,
  tip,
}: {
  node: ControlFlowNode;
  /** Actor letter (U / U′ / T / H) drawn inside actor nodes. */
  letter?: string;
  /** One-line cast-card definition, restated as a hover tooltip. */
  tip?: string;
}) {
  const m = metricsOf(node);

  if (node.kind === "junction") {
    return <circle cx={node.x} cy={node.y} r={JUNCTION_R} fill={EDGE_STROKE} />;
  }

  const style = node.actor ? ACTOR_STYLES[node.actor] : NEUTRAL;

  if (node.kind === "terminal") {
    return (
      <g>
        <rect
          x={node.x - m.w / 2}
          y={node.y - m.h / 2}
          width={m.w}
          height={m.h}
          rx={m.rx}
          fill={NEUTRAL.bg}
          stroke={NEUTRAL.border}
          strokeWidth={1.25}
        />
        <text
          x={node.x}
          y={node.y + 3.5}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={NEUTRAL.text}
        >
          {node.label}
        </text>
      </g>
    );
  }

  if (node.kind === "compare") {
    // Label plus a ×3 stack glyph; outcomes ride the outgoing branches.
    const stackX = node.x - 14;
    const stackY = node.y + 4;
    return (
      <g>
        <rect
          x={node.x - m.w / 2}
          y={node.y - m.h / 2}
          width={m.w}
          height={m.h}
          rx={m.rx}
          fill={NEUTRAL.bg}
          stroke={NEUTRAL.border}
          strokeWidth={1.25}
        />
        <text
          x={node.x}
          y={node.y - 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={NEUTRAL.text}
        >
          {node.label}
        </text>
        {[0, 2.5, 5].map((offset) => (
          <rect
            key={offset}
            x={stackX + offset}
            y={stackY + offset * 0.8}
            width={9}
            height={7}
            rx={1.5}
            fill="#ffffff"
            stroke={NEUTRAL.text}
            strokeWidth={0.9}
          />
        ))}
        <text
          x={node.x + 8}
          y={node.y + 14}
          fontSize={9.5}
          fontWeight={600}
          fill={NEUTRAL.text}
        >
          ×3
        </text>
      </g>
    );
  }

  // Actor node: letter + role chip inside; optional note beneath.
  const roleW = node.role ? estimateWidth(node.role, 7.5) + 18 : 0;
  return (
    <g>
      {tip && <title>{tip}</title>}
      <rect
        x={node.x - m.w / 2}
        y={node.y - m.h / 2}
        width={m.w}
        height={m.h}
        rx={m.rx}
        fill={style.bg}
        stroke={style.border}
        strokeWidth={1.5}
      />
      <text
        x={node.x}
        y={node.y - 2}
        textAnchor="middle"
        fontSize={16}
        fontWeight={700}
        fill={style.text}
      >
        {node.label ?? letter}
      </text>
      {node.role && (
        <g>
          <rect
            x={node.x - roleW / 2}
            y={node.y + 5}
            width={roleW}
            height={13}
            rx={6.5}
            fill="#ffffff"
            stroke={style.border}
            strokeOpacity={0.45}
          />
          <text
            x={node.x}
            y={node.y + 14.5}
            textAnchor="middle"
            fontSize={7.5}
            fontWeight={600}
            letterSpacing={0.6}
            fill={style.text}
          >
            {node.role.toUpperCase()}
          </text>
        </g>
      )}
      {node.note && (
        <text
          x={node.x + (node.noteDx ?? 0)}
          y={node.y + m.h / 2 + 13}
          textAnchor="middle"
          fontSize={9}
          fill="#737373"
          stroke="#ffffff"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {node.note}
        </text>
      )}
    </g>
  );
}

/**
 * A neutral, left-to-right picture of one control-protocol workflow: rounded
 * actor nodes, dashed edges whose dashes drift in the flow direction (static
 * under prefers-reduced-motion — see globals.css), percentage chips on
 * splits, condition labels in place, and at most one loop-back edge. It never
 * reacts to submit/reveal — the same graph is on screen before and after.
 */
export function FlowGraph({
  graph,
  actors,
  label,
  className,
}: {
  graph: ControlFlowGraph;
  /** The cast — supplies each actor node's letter and tooltip definition. */
  actors: ControlActor[];
  /** Accessible description of the diagram. */
  label: string;
  className?: string;
}) {
  const markerId = useId();
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const actorById = new Map<ControlActorId, ControlActor>(
    actors.map((a) => [a.id, a]),
  );

  return (
    <svg
      viewBox={`0 0 ${graph.width} ${graph.height}`}
      role="img"
      aria-label={label}
      className={cn("h-auto w-full", className)}
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
          <path d="M 0 0 L 8 4 L 0 8 z" fill={EDGE_STROKE} />
        </marker>
      </defs>

      {graph.edges.map((edge, i) => {
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) return null;
        const g = edgeGeometry(edge, from, to);
        const labelAt = bezierPoint(g, edge.labelT ?? 0.5);
        const dx = edge.labelDx ?? 0;
        const dy = edge.labelDy ?? 0;
        return (
          <g key={`${edge.from}-${edge.to}-${i}`}>
            <path
              d={g.d}
              fill="none"
              stroke={EDGE_STROKE}
              strokeWidth={1.5}
              className="flow-graph-edge"
              markerEnd={to.kind === "junction" ? undefined : `url(#${markerId})`}
            />
            {edge.chip && (
              <EdgeChip
                at={{ x: labelAt.x + dx, y: labelAt.y + dy }}
                line1={edge.chip}
                line2={edge.chipLine2}
              />
            )}
            {edge.cond && (
              <CondLabel at={{ x: labelAt.x + dx, y: labelAt.y + dy }} text={edge.cond} />
            )}
          </g>
        );
      })}

      {graph.nodes.map((node) => {
        const actor = node.actor ? actorById.get(node.actor) : undefined;
        return (
          <NodeShape
            key={node.id}
            node={node}
            letter={actor?.letter}
            tip={
              actor && `${actor.letter} — ${actor.name}: ${actor.definition}`
            }
          />
        );
      })}
    </svg>
  );
}
