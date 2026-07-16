# Additive-Control Stepper Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A zybooks-style step-through demo ("additive-control") showing that AI control is additive — alignment interventions sit in an inner box, control's applied monitoring wraps around them, and toggling the shell leaves the inner box untouched — plus a reusable `SlideStepper` chrome component.

**Architecture:** Two new client components under `src/components/demos/`: `slide-stepper.tsx` (generic slide chrome: step state, Back/Next, clickable dots, caption panel, arrow keys) and `additive-control-demo.tsx` (one inline SVG scene whose layers fade in per step, with an on/off shell toggle on the last step). The demo registers in `src/lib/demos/registry.ts`, which makes it render on `/demos` (gallery), `/demos/additive-control`, and via `<Demo id="additive-control"/>` in MDX later. `DemoFrame` (applied by `DemoById`) provides the titled frame, error boundary, and Reset (remount).

**Tech Stack:** Next.js 16 / React 19, Tailwind v4 tokens, lucide-react icons, shadcn `Button`, Vitest (node env — registry test only; components are verified by typecheck + visual pass).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-16-additive-control-demo-design.md`.
- Work on the `mod-2` branch.
- No lesson MDX or `curriculum.data.ts` changes — demo + registry only.
- No new dependencies, no chart libraries; hand-rolled inline SVG like the other demos.
- Demo components are self-contained `"use client"` files with no app-internal deps (see `src/lib/demos/types.ts`).
- Do NOT wrap the demo in `DemoFrame` — `DemoById` does that.
- Vitest runs in `environment: "node"` and only picks up `src/**/*.test.ts` — do not add component/DOM tests or new test infra.
- Caption copy below is adapted from the author's own note (`contra control true.md`); do not invent additional curriculum claims.
- After edits run `npm run typecheck` (repo rule).

---

### Task 1: `SlideStepper` reusable chrome

**Files:**
- Create: `src/components/demos/slide-stepper.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`, `ChevronLeft`/`ChevronRight` from `lucide-react`.
- Produces: `SlideStepper` component and `SlideStep` type, used by Task 2:
  - `interface SlideStep { label: string; caption: ReactNode }`
  - `function SlideStepper(props: { steps: SlideStep[]; children: (step: number) => ReactNode }): ReactNode`
  - `children(step)` renders the diagram for the current 0-based step; index is always clamped to `[0, steps.length - 1]`.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SlideStep {
  /** Short name shown above the caption and on the dot's tooltip. */
  label: string;
  caption: ReactNode;
}

export interface SlideStepperProps {
  steps: SlideStep[];
  /** Renders the diagram for the current step (0-based). */
  children: (step: number) => ReactNode;
}

/**
 * Zybooks-style slide chrome: a diagram area, a caption panel, and
 * Back / dots / Next navigation. Owns only the step index — the diagram
 * is supplied per-step by the render-prop child. Left/Right arrow keys
 * navigate while the stepper has focus. DemoFrame's Reset remounts the
 * subtree, which returns the stepper to step 0.
 */
export function SlideStepper({ steps, children }: SlideStepperProps) {
  const [step, setStep] = useState(0);
  const last = steps.length - 1;
  const go = (next: number) => setStep(Math.max(0, Math.min(last, next)));

  return (
    <div
      className="focus-visible:ring-ring space-y-3 rounded-md outline-none focus-visible:ring-2"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(step + 1);
        if (e.key === "ArrowLeft") go(step - 1);
      }}
    >
      <div>{children(step)}</div>
      <div className="min-h-20 text-sm">
        <p className="font-medium">
          {step + 1}. {steps[step].label}
        </p>
        <div className="text-muted-foreground mt-1">{steps[step].caption}</div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="size-3.5" aria-hidden /> Back
        </Button>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-label={`Step ${i + 1}: ${s.label}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => go(i)}
              className={`size-2.5 rounded-full transition-colors ${
                i === step ? "bg-primary" : "bg-border hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(step + 1)}
          disabled={step === last}
          className="gap-1"
        >
          Next <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/demos/slide-stepper.tsx
git commit -m "Add SlideStepper: reusable zybooks-style slide chrome for demos"
```

---

### Task 2: `AdditiveControlDemo` component

**Files:**
- Create: `src/components/demos/additive-control-demo.tsx`

**Interfaces:**
- Consumes: `SlideStepper`, `SlideStep` from `./slide-stepper` (Task 1); `Button` from `@/components/ui/button`.
- Produces: `export function AdditiveControlDemo(): ReactNode` — a no-props client component, registered by Task 3.

Behavior spec:
- Three steps. One SVG scene rendered on every step; the shell layer fades via CSS `transition-opacity` keyed off visibility, so stepping back animates too.
- Step 1 (index 0): only the inner box (alignment interventions + two chips).
- Step 2 (index 1): shell (control's applied monitoring + four chips) fades in around the unchanged inner box.
- Step 3 (index 2): same scene plus a "Monitoring shell: on/off" toggle button; toggling fades the shell while the inner box stays pixel-identical. Shell visibility: `step === 1 || (step === 2 && shellOn)`.
- Colors via Tailwind tokens only (`fill-card`, `stroke-border`, `fill-primary/5`, `stroke-primary`, `fill-foreground`, `fill-muted-foreground`, `fill-muted`, `text-*`), so light/dark both work.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  {
    label: "Additive, not entangled",
    caption:
      "Toggle the shell: the inner interventions are untouched either way. But additive does not necessitate high-value — control's share of resources should track how much of the risk you expect to come from scheming rather than slop.",
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
  const [shellOn, setShellOn] = useState(true);

  return (
    <SlideStepper steps={STEPS}>
      {(step) => {
        const shellVisible = step === 1 || (step === 2 && shellOn);
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

            {step === 2 && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-muted-foreground text-xs">
                  Monitoring shell:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShellOn((v) => !v)}
                  aria-pressed={shellOn}
                >
                  {shellOn ? "On" : "Off"}
                </Button>
              </div>
            )}
          </div>
        );
      }}
    </SlideStepper>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/demos/additive-control-demo.tsx
git commit -m "Add AdditiveControlDemo: additive-property-of-control slide diagram"
```

---

### Task 3: Register the demo (TDD)

**Files:**
- Test: `src/lib/demos/registry.test.ts` (create)
- Modify: `src/lib/demos/registry.ts` (import block at top; add entry before the closing `};` of `demoRegistry`)

**Interfaces:**
- Consumes: `AdditiveControlDemo` from `@/components/demos/additive-control-demo` (Task 2); `getDemo` from `./registry`.
- Produces: registry id `"additive-control"` — used by `/demos`, `/demos/additive-control`, and future `<Demo id="additive-control"/>` MDX embeds.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/demos/registry.test.ts
import { describe, expect, it } from "vitest";
import { getDemo } from "./registry";

describe("additive-control demo registration", () => {
  it("is registered with the fields the gallery needs", () => {
    const demo = getDemo("additive-control");
    expect(demo).toBeDefined();
    expect(demo?.id).toBe("additive-control");
    expect(demo?.title).toBe("Control is additive");
    expect(demo?.description).toMatch(/additive/i);
    expect(demo?.tags).toEqual(["control", "how-useful"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/demos/registry.test.ts`
Expected: FAIL — `expect(demo).toBeDefined()` fails (`getDemo` returns `undefined`).

- [ ] **Step 3: Add the registry entry**

In `src/lib/demos/registry.ts`, append to the import block:

```ts
import { AdditiveControlDemo } from "@/components/demos/additive-control-demo";
```

and add as the last entry of `demoRegistry` (after `"sabotage-frontier"`):

```ts
  "additive-control": {
    id: "additive-control",
    title: "Control is additive",
    description:
      "Step through the additive property of control: alignment interventions act on the model in an inner box, control's applied monitoring wraps around them, and toggling the shell leaves the inner box untouched.",
    component: AdditiveControlDemo,
    tags: ["control", "how-useful"],
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/demos/registry.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm run test && npm run typecheck`
Expected: all tests pass (content-integrity suite included); typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/demos/registry.ts src/lib/demos/registry.test.ts
git commit -m "Register additive-control demo"
```

---

### Task 4: Visual verification

**Files:** none (verification only).

**Interfaces:**
- Consumes: the registered `additive-control` demo (Task 3); routes `src/app/demos/` (gallery) and `src/app/demos/[demoId]/` (standalone).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background). Public demo pages need no `.env` values.
Expected: server ready on http://localhost:3000.

- [ ] **Step 2: Verify the standalone page**

Open http://localhost:3000/demos/additive-control and check:
- Step 1 shows only the inner box with its two chips; Back is disabled.
- Next → step 2: shell fades in around the unchanged inner box; four shell chips readable, no overlaps.
- Next → step 3: toggle appears; Off fades the shell out, inner box does not move; On restores it. Next is disabled.
- Dots jump directly between steps; Left/Right arrows work after clicking the stepper; DemoFrame's Reset returns to step 1.
- Repeat the pass in dark mode (theme toggle) — all text readable, shell/inner contrast holds.

- [ ] **Step 3: Verify the gallery**

Open http://localhost:3000/demos and check the "Control is additive" card appears (tags `control`, `how-useful`) and links to the standalone page.

- [ ] **Step 4: Fix anything found, re-run checks, commit fixes**

If visual issues require code changes: fix, `npm run typecheck && npm run test`, then

```bash
git add -A src/components/demos src/lib/demos
git commit -m "Polish additive-control demo layout"
```

(Skip the commit if nothing needed fixing.)

---

## Plan Self-Review

- **Spec coverage:** stepper chrome (Task 1), 3-step SVG demo + toggle + copy (Task 2), registry entry with exact id/title/tags (Task 3), typecheck/test/visual-both-themes verification (Tasks 3–4). No lesson/curriculum changes anywhere. ✓
- **Placeholders:** none — every code step contains the full code. ✓
- **Type consistency:** `SlideStep`/`SlideStepper` names match between Tasks 1–2; `AdditiveControlDemo` name matches between Tasks 2–3. ✓
