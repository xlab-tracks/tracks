"use client";

import { useState } from "react";
import { SlideStepper, type SlideStep } from "./slide-stepper";

// The regime model's three states and the safety budget (module 2,
// "Determining the usefulness"). The diagram builds across seven steps:
// the world state alone (center stage, larger), then the epistemic state
// beside it, then the resource state completing the row — then the resource
// state grows a tree down to the household picture (the will account, the
// priced aisles, the basket, and what refills the budget), drawn in a
// shopping theme. Content restates the lesson's own prose.

const STEPS: SlideStep[] = [
  {
    label: "World state",
    caption:
      "A regime can be split into three parts that behave very differently. The first is the world state: the facts on the ground, both known and unknown.",
  },
  {
    label: "Epistemic state",
    caption:
      "Our picture of the world state. The epistemic state isn't necessarily a subset of the world state. For example, a control evaluation's score is an imperfect measurement, and whether control actually works against the actual model is a different thing entirely. A high safety score from a poor evaluation can lead to a mismatch between the epistemic and world states.",
  },
  {
    label: "Resource state",
    caption:
      "The third part is the safety budget: can we afford to act on what we think?",
  },
  {
    label: "The will account",
    caption:
      "There exists one account: political will, a developer's willingness to concede safety-relevant actions up to some cost threshold. It is held by the lab and you can move it only indirectly. It fades without reinforcement and spikes after concerning incidents.",
  },
  {
    label: "The priced aisles",
    caption:
      "Delay is priced by the intensity of the race to AGI. Usefulness costs the developer by leading to a slower, less useful system, but control helps make systems more useful so it partially offsets its own tax. Compute is also governed by internal politics: pulling it from capabilities means spending will to overcome the slowing of development.",
  },
  {
    label: "The basket",
    caption:
      "Deploying control means buying a particular basket: a lot of usefulness tax, some compute, very little delay, but your basket can have different price tags in different worlds.",
  },
  {
    label: "What refills the budget",
    caption:
      "Three things generate budget, and they work differently: incidents and evidence refill the account, hardest right after something goes wrong; public buy-in raises it and slows its fading; passed policy converts will into a durable floor (repeal is expensive).",
  },
];

const W = 520;
const H = 376;

type StateId = "world" | "epistemic" | "resource";

interface StateBox {
  id: StateId;
  title: string;
  question: [string, string];
  items: string[];
  /** The step that introduces the box. */
  appearsAt: number;
  /** Per-phase transform [step 0, step 1, step 2, steps ≥3]. */
  layout: [
    { tx: number; ty: number; s: number },
    { tx: number; ty: number; s: number },
    { tx: number; ty: number; s: number },
    { tx: number; ty: number; s: number },
  ];
}

const BOX_W = 156;
const BOX_H = 150;

const BOXES: StateBox[] = [
  {
    id: "world",
    title: "World state",
    question: ["What is control actually", "worth here?"],
    items: [
      "what the model is like",
      "how capable it is",
      "how checkable research is",
      "what has happened so far",
    ],
    appearsAt: 0,
    layout: [
      { tx: 155, ty: 20, s: 1.35 },
      { tx: 72, ty: 34, s: 1.12 },
      { tx: 16, ty: 34, s: 1 },
      { tx: 16, ty: 34, s: 1 },
    ],
  },
  {
    id: "epistemic",
    title: "Epistemic state",
    question: ["What do we justifiably", "think it's worth?"],
    items: [
      "confidence in alignment",
      "interpretability findings",
      "the track record",
      "evaluation results",
    ],
    appearsAt: 1,
    layout: [
      { tx: 285, ty: 34, s: 1 },
      { tx: 285, ty: 34, s: 1 },
      { tx: 182, ty: 34, s: 1 },
      { tx: 182, ty: 34, s: 1 },
    ],
  },
  {
    id: "resource",
    title: "Resource state",
    question: ["Can we afford to act", "on what we think?"],
    items: [
      "political will — the account",
      "price: usefulness tax",
      "price: compute",
      "price: delay",
    ],
    appearsAt: 2,
    layout: [
      { tx: 348, ty: 34, s: 1 },
      { tx: 348, ty: 34, s: 1 },
      { tx: 348, ty: 34, s: 1 },
      // Budget focus: the other states clear out; resource takes the center.
      { tx: 182, ty: 34, s: 1 },
    ],
  },
];

// Which box a step opens by default; hover/tap can override on steps 0–2.
const STEP_DEFAULT: (StateId | null)[] = ["world", "epistemic", "resource"];

// Shopping palette: one hue per aisle, reused by the basket's bars. Each
// price tag notes on a second line that the price is paid from political will.
const AISLES = [
  {
    text: "usefulness tax",
    will: "spent from political will",
    shelf: "fill-amber-500/15 stroke-amber-500",
    tag: "fill-amber-500",
  },
  {
    text: "compute · internal politics",
    will: "spent from political will",
    shelf: "fill-sky-500/15 stroke-sky-500",
    tag: "fill-sky-500",
  },
  {
    text: "delay · the race",
    will: "spent from political will",
    shelf: "fill-rose-500/15 stroke-rose-500",
    tag: "fill-rose-500",
  },
] as const;

const BASKET_BARS = [
  { label: "tax", width: 52, bar: "fill-amber-500" },
  { label: "compute", width: 24, bar: "fill-sky-500" },
  { label: "delay", width: 6, bar: "fill-rose-500" },
] as const;

/** One aisle shelf with its price tag and will attribution. */
function Aisle({
  y,
  text,
  will,
  shelf,
  tag,
}: {
  y: number;
  text: string;
  will: string;
  shelf: string;
  tag: string;
}) {
  return (
    <g>
      <rect
        x={200}
        y={y}
        width={180}
        height={24}
        rx={6}
        className={shelf}
        strokeWidth={1.25}
      />
      <circle cx={211} cy={y + 12} r={7} className={tag} />
      <text
        x={211}
        y={y + 15.5}
        textAnchor="middle"
        className="fill-white text-[9px] font-bold"
      >
        $
      </text>
      <text
        x={296}
        y={y + 10.5}
        textAnchor="middle"
        className="fill-foreground text-[9px]"
      >
        {text}
      </text>
      <text
        x={296}
        y={y + 20}
        textAnchor="middle"
        className="fill-muted-foreground text-[8px]"
      >
        {will}
      </text>
    </g>
  );
}

/** An upward arrow with a label beneath it (the budget generators). All
 * three point at the will account — the lesson has every generator refill
 * the balance — so the tip x can differ from the label x. */
function InArrow({
  x,
  toX,
  toY,
  label,
}: {
  x: number;
  toX?: number;
  toY: number;
  label: string;
}) {
  return (
    <g>
      <line
        x1={x}
        y1={344}
        x2={toX ?? x}
        y2={toY}
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth={1.5}
        markerEnd="url(#rs-refill)"
      />
      <text
        x={x}
        y={360}
        textAnchor="middle"
        className="fill-emerald-700 text-[9px] dark:fill-emerald-400"
      >
        {label}
      </text>
    </g>
  );
}

// The tree from the resource state down to the household picture: a trunk
// from the box's bottom, branching to each target as its step arrives.
const TRUNK_X = 260; // center of the resource box once it holds the stage
const TRUNK_TOP = 184;
const BRANCHES = [
  { toX: 100, appearsAt: 3 }, // the account
  { toX: 290, appearsAt: 4 }, // the aisles
  { toX: 452, appearsAt: 5 }, // the basket
] as const;

// A peek remembers which step it was made on: entries from another step are
// ignored, so stepping resets the selection without an effect or a remount
// (which would cut the boxes' transform transitions short).
type Peek = { step: number; id: StateId } | null;

export function RegimeStatesDemo() {
  const [hovered, setHovered] = useState<Peek>(null);
  const [pinned, setPinned] = useState<Peek>(null);

  return (
    <SlideStepper steps={STEPS}>
      {(step) => {
        const phase = Math.min(step, 3) as 0 | 1 | 2 | 3;
        // From the household step (STEPS index 3, "The will account") on, the
        // picture is the focus and the resource box stays open; before that, a
        // tapped pin wins,
        // then hover, then the step's default.
        const peeked =
          (pinned?.step === step ? pinned.id : null) ??
          (hovered?.step === step ? hovered.id : null);
        const active: StateId | null =
          step >= 3 ? "resource" : (peeked ?? STEP_DEFAULT[step]);
        const bankVisible = step >= 3;
        const aislesVisible = step >= 4;
        const basketVisible = step >= 5;
        const refillsVisible = step >= 6;
        return (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="The three regime states — world, epistemic, resource — introduced one at a time, with the resource state branching into the safety budget: the will account, the priced aisles, the basket, and what refills the budget"
          >
            <defs>
              <marker
                id="rs-arrow"
                viewBox="0 0 8 8"
                refX="6"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L8,4 L0,8 z" className="fill-muted-foreground" />
              </marker>
              <marker
                id="rs-refill"
                viewBox="0 0 8 8"
                refX="6"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M0,0 L8,4 L0,8 z"
                  className="fill-emerald-600 dark:fill-emerald-400"
                />
              </marker>
            </defs>

            {/* The three state boxes */}
            {BOXES.map((box) => {
              const open = active === box.id;
              const visible =
                step >= box.appearsAt && (step < 3 || box.id === "resource");
              const { tx, ty, s } = box.layout[phase];
              return (
                <g
                  key={box.id}
                  onMouseEnter={() => setHovered({ step, id: box.id })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() =>
                    setPinned((p) =>
                      p?.step === step && p.id === box.id
                        ? null
                        : { step, id: box.id },
                    )
                  }
                  className="cursor-pointer transition-all duration-700 ease-in-out motion-reduce:transition-none"
                  opacity={visible ? 1 : 0}
                  style={{
                    transform: `translate(${tx}px, ${ty}px) scale(${s})`,
                    pointerEvents: visible ? undefined : "none",
                  }}
                >
                  <rect
                    width={BOX_W}
                    height={BOX_H}
                    rx={12}
                    className={`transition-colors duration-300 ${
                      open
                        ? "fill-primary/5 stroke-primary"
                        : "fill-card stroke-border"
                    }`}
                    strokeWidth={1.5}
                  />
                  <text
                    x={BOX_W / 2}
                    y={24}
                    textAnchor="middle"
                    className="fill-foreground text-[12px] font-semibold"
                  >
                    {box.title}
                  </text>
                  <text
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] italic"
                  >
                    <tspan x={BOX_W / 2} y={42}>
                      {box.question[0]}
                    </tspan>
                    <tspan x={BOX_W / 2} y={55}>
                      {box.question[1]}
                    </tspan>
                  </text>
                  {/* Unselected boxes keep their items readable but dimmed —
                      the open box's full-strength list + primary border carry
                      the selection. */}
                  <g
                    className="transition-opacity duration-300"
                    opacity={open ? 1 : 0.45}
                  >
                    {box.items.map((item, i) => (
                      <text
                        key={item}
                        x={12}
                        y={80 + i * 17}
                        className="fill-muted-foreground text-[10px]"
                      >
                        – {item}
                      </text>
                    ))}
                  </g>
                </g>
              );
            })}

            {/* Measured-vs-actual gap: epistemic points at world */}
            <g
              className="transition-opacity duration-500"
              opacity={step === 1 ? 1 : 0}
            >
              <path
                d="M 363 30 Q 264 2 172 26"
                fill="none"
                className="stroke-muted-foreground"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                markerEnd="url(#rs-arrow)"
              />
              <text
                x={268}
                y={12}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                measured ≠ actual
              </text>
            </g>

            {/* The tree from the resource state to the household picture */}
            {BRANCHES.map(({ toX, appearsAt }) => (
              <path
                key={toX}
                d={`M ${TRUNK_X} ${TRUNK_TOP} C ${TRUNK_X} 194, ${toX} 186, ${toX} 216`}
                fill="none"
                className="stroke-muted-foreground transition-opacity duration-500"
                opacity={step >= appearsAt ? 0.8 : 0}
                strokeWidth={1.5}
                markerEnd="url(#rs-arrow)"
              />
            ))}

            {/* Household picture — the safety budget, shopping-themed */}
            <g
              className="transition-opacity duration-500"
              opacity={bankVisible ? 1 : 0}
            >
              <text
                x={100}
                y={228}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                the account
              </text>
              <rect
                x={20}
                y={234}
                width={160}
                height={76}
                rx={10}
                className="fill-emerald-500/10 stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth={1.5}
              />
              <text
                x={100}
                y={268}
                textAnchor="middle"
                className="fill-foreground text-[12px] font-semibold"
              >
                Political will
              </text>
              <text
                x={100}
                y={284}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                staff · public · government
              </text>
            </g>

            <g
              className="transition-opacity duration-500"
              opacity={aislesVisible ? 1 : 0}
            >
              <text
                x={290}
                y={228}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                the aisles — the regime sets prices
              </text>
              {AISLES.map((aisle, i) => (
                <Aisle
                  key={aisle.text}
                  y={234 + i * 28}
                  text={aisle.text}
                  will={aisle.will}
                  shelf={aisle.shelf}
                  tag={aisle.tag}
                />
              ))}
            </g>

            <g
              className="transition-opacity duration-500"
              opacity={basketVisible ? 1 : 0}
            >
              <text
                x={452}
                y={228}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                the basket — a technique
              </text>
              <rect
                x={400}
                y={234}
                width={104}
                height={76}
                rx={10}
                className="fill-violet-500/10 stroke-violet-600 dark:stroke-violet-400"
                strokeWidth={1.5}
              />
              <text
                x={452}
                y={250}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                control&apos;s basket
              </text>
              {BASKET_BARS.map(({ label, width, bar }, i) => (
                <g key={label}>
                  <text
                    x={408}
                    y={267 + i * 14}
                    className="fill-muted-foreground text-[9px]"
                  >
                    {label}
                  </text>
                  <rect
                    x={448}
                    y={260 + i * 14}
                    width={width}
                    height={7}
                    rx={2}
                    className={bar}
                  />
                </g>
              ))}
            </g>

            {/* What refills the budget */}
            <g
              className="transition-opacity duration-500"
              opacity={refillsVisible ? 1 : 0}
            >
              <line
                x1={20}
                y1={318}
                x2={180}
                y2={318}
                className="stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <InArrow x={60} toY={326} label="incidents & evidence" />
              <InArrow x={140} toX={110} toY={324} label="public buy-in" />
              <InArrow x={210} toX={165} toY={324} label="passed policy" />
            </g>
          </svg>
        );
      }}
    </SlideStepper>
  );
}
