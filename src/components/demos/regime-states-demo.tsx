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
      "A regime — the bundle of conditions that determines whether control is worth it — splits into three parts that behave very differently. The first is the world state: the facts on the ground, whether or not anyone knows them. You never observe it directly.",
  },
  {
    label: "Epistemic state",
    caption:
      "Our picture of the world state. The two can come apart: a control evaluation's score is a measurement, and whether control actually works against the actual model is a different thing entirely. A high safety score from a poor evaluation is a reassuring epistemic state pointing at a world state it doesn't match.",
  },
  {
    label: "Resource state",
    caption:
      "The third part is the safety budget — can we afford to act on what we think? It has more structure than the word “budget” suggests: picture a household. Hover or tap any box to peek inside.",
  },
  {
    label: "The will account",
    caption:
      "One bank account: political will — the authorization to do costly safety things. Not money; permission and backing. It is the only currency. It fades over time if nothing reinforces it, and it spikes after frightening incidents.",
  },
  {
    label: "The priced aisles",
    caption:
      "The things you can spend will on, each with a price tag — and the regime sets the prices, not the lab. The usefulness tax is priced by commercial pressure and public mood, compute by internal politics, delay by the race.",
  },
  {
    label: "The basket",
    caption:
      "Your shopping cart is a safety technique. Deploying control means buying a particular basket: a lot of usefulness tax, some compute, very little delay. Same plan, same basket — different price tags in different worlds.",
  },
  {
    label: "What refills the budget",
    caption:
      "Three things generate budget, and they work differently: incidents and evidence refill the account directly; public buy-in changes the prices; passed policy spends will once and locks a durable floor in place.",
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
  /** Per-phase transform [step 0, step 1, steps ≥2] → translate + scale. */
  layout: [
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
    ],
  },
];

// Which box a step opens by default; hover/tap can override on steps 0–2.
const STEP_DEFAULT: (StateId | null)[] = ["world", "epistemic", "resource"];

// Shopping palette: one hue per aisle, reused by the basket's bars.
const AISLES = [
  {
    text: "usefulness tax · public mood",
    shelf: "fill-amber-500/15 stroke-amber-500",
    tag: "fill-amber-500",
  },
  {
    text: "compute · internal politics",
    shelf: "fill-sky-500/15 stroke-sky-500",
    tag: "fill-sky-500",
  },
  {
    text: "delay · the race",
    shelf: "fill-rose-500/15 stroke-rose-500",
    tag: "fill-rose-500",
  },
] as const;

const BASKET_BARS = [
  { label: "tax", width: 52, bar: "fill-amber-500" },
  { label: "compute", width: 24, bar: "fill-sky-500" },
  { label: "delay", width: 6, bar: "fill-rose-500" },
] as const;

/** One aisle shelf with its price tag. */
function Aisle({
  y,
  text,
  shelf,
  tag,
}: {
  y: number;
  text: string;
  shelf: string;
  tag: string;
}) {
  return (
    <g>
      <rect
        x={200}
        y={y}
        width={180}
        height={22}
        rx={6}
        className={shelf}
        strokeWidth={1.25}
      />
      <circle cx={211} cy={y + 11} r={7} className={tag} />
      <text
        x={211}
        y={y + 14.5}
        textAnchor="middle"
        className="fill-white text-[9px] font-bold"
      >
        $
      </text>
      <text
        x={296}
        y={y + 15}
        textAnchor="middle"
        className="fill-foreground text-[10px]"
      >
        {text}
      </text>
    </g>
  );
}

/** An upward arrow with a label beneath it (the budget generators). */
function InArrow({ x, toY, label }: { x: number; toY: number; label: string }) {
  return (
    <g>
      <line
        x1={x}
        y1={344}
        x2={x}
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
const TRUNK_X = 426;
const TRUNK_TOP = 184;
const BRANCHES = [
  { toX: 100, appearsAt: 3 }, // the account
  { toX: 290, appearsAt: 4 }, // the aisles
  { toX: 452, appearsAt: 5 }, // the basket
] as const;

export function RegimeStatesDemo() {
  const [hovered, setHovered] = useState<StateId | null>(null);

  return (
    <SlideStepper steps={STEPS}>
      {(step) => {
        const phase = Math.min(step, 2) as 0 | 1 | 2;
        // From the will-account step on, the household picture is the focus
        // and the resource box stays open; before that, hover wins.
        const active: StateId | null =
          step >= 3 ? "resource" : (hovered ?? STEP_DEFAULT[step]);
        const bankVisible = step >= 3;
        const aislesVisible = step >= 4;
        const basketVisible = step >= 5;
        const refillsVisible = step >= 6;
        return (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="The three regime states — world, epistemic, resource — introduced one at a time, with the resource state branching into the safety budget: the political-will account, the priced aisles, the basket, and what refills the budget"
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
              const visible = step >= box.appearsAt;
              const { tx, ty, s } = box.layout[phase];
              return (
                <g
                  key={box.id}
                  onMouseEnter={() => setHovered(box.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() =>
                    setHovered((h) => (h === box.id ? null : box.id))
                  }
                  className="cursor-pointer transition-all duration-700 ease-in-out motion-reduce:transition-none"
                  opacity={visible ? 1 : 0}
                  style={{
                    transform: `translate(${tx}px, ${ty}px) scale(${s})`,
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
                  <g
                    className="transition-opacity duration-300"
                    opacity={open ? 1 : 0}
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
                d={`M ${TRUNK_X} ${TRUNK_TOP} C ${TRUNK_X} 194, ${toX} 186, ${toX} 196`}
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
                y={208}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                the account
              </text>
              <rect
                x={20}
                y={214}
                width={160}
                height={76}
                rx={10}
                className="fill-emerald-500/10 stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth={1.5}
              />
              <circle
                cx={46}
                cy={252}
                r={11}
                className="fill-emerald-500/25 stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth={1.25}
              />
              <text
                x={46}
                y={256.5}
                textAnchor="middle"
                className="fill-emerald-700 text-[11px] font-bold dark:fill-emerald-400"
              >
                ¤
              </text>
              <text
                x={112}
                y={248}
                textAnchor="middle"
                className="fill-foreground text-[12px] font-semibold"
              >
                Political will
              </text>
              <text
                x={112}
                y={264}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                the only currency
              </text>
            </g>

            <g
              className="transition-opacity duration-500"
              opacity={aislesVisible ? 1 : 0}
            >
              <text
                x={290}
                y={208}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                the aisles — the regime sets prices
              </text>
              {AISLES.map((aisle, i) => (
                <Aisle
                  key={aisle.text}
                  y={214 + i * 28}
                  text={aisle.text}
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
                y={208}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                the basket — a technique
              </text>
              <rect
                x={400}
                y={214}
                width={104}
                height={76}
                rx={10}
                className="fill-violet-500/10 stroke-violet-600 dark:stroke-violet-400"
                strokeWidth={1.5}
              />
              <text
                x={452}
                y={230}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                control&apos;s basket
              </text>
              {BASKET_BARS.map(({ label, width, bar }, i) => (
                <g key={label}>
                  <text
                    x={408}
                    y={247 + i * 14}
                    className="fill-muted-foreground text-[9px]"
                  >
                    {label}
                  </text>
                  <rect
                    x={448}
                    y={240 + i * 14}
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
                y1={298}
                x2={180}
                y2={298}
                className="stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <InArrow x={60} toY={306} label="incidents & evidence" />
              <InArrow x={150} toY={304} label="passed policy" />
              <InArrow x={290} toY={298} label="public buy-in" />
            </g>
          </svg>
        );
      }}
    </SlideStepper>
  );
}
