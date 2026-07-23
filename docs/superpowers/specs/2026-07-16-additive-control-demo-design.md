# Additive-control stepper demo — design

**Date:** 2026-07-16 · **Branch:** `mod-2`

## Purpose

Implement the author TODO in the module-2 draft ("How useful is AI control?",
`contra control true.md`, "Weighing control against alternatives"):

> [image illustrating additive property, as in the alignment methods regarding
> training interventions and classifiers are in one box, and surrounding this
> box is applied monitoring methods]

as a zybooks-style step-through demo: the diagram builds up across three steps
and ends with a non-interference toggle. Scope is the demo component plus its
registry entry only — no lesson MDX or curriculum changes (module-2 content
lands separately).

## Components

### `src/components/demos/slide-stepper.tsx` (new, reusable)

`"use client"` chrome for slide-style demos; knows nothing about any diagram.

```tsx
interface SlideStepperProps {
  steps: { label: string; caption: ReactNode }[];
  children: (step: number) => ReactNode; // renders the diagram for a step
}
```

- State: a single step index (starts at 0).
- Layout: diagram area on top (`children(step)`), caption panel below with a
  fixed min-height (no frame jump between steps), footer with Back button,
  clickable step dots, Next button.
- Left/Right arrow keys change steps when the stepper has focus.
- Reset: none of its own — `DemoFrame`'s Reset button remounts children,
  returning the stepper to step 0.
- Second consumer already identified: the RSI N→N+1 "circle model" stepper
  (other author TODO in the same note).

### `src/components/demos/additive-control-demo.tsx` (new)

One inline SVG scene rendered on every step; layers fade/slide via CSS
transitions keyed off the step index, so stepping backward animates too.
No chart libraries (matches existing demos). Theme via existing Tailwind/
shadcn tokens (`border`, `muted`, `primary`, `card`) for light/dark support.

Steps:

1. **The inner box.** Rounded rect labeled "Alignment interventions — act on
   the model itself" containing two chips: *training interventions*
   (RLHF, adversarial training) and *classifiers / probes*. Caption: these
   methods try to make the model itself trustworthy.
2. **The shell wraps around.** A surrounding rounded rect labeled "Control —
   applied monitoring" with chips on the shell band: *trusted monitoring*,
   *auditing*, *defer-to-trusted*, *resampling*. Inner box visually unchanged.
   Caption (from the note): control is additive — it does not interfere with
   security, alignment, or verification interventions.
3. **Non-interference toggle.** Same scene plus a "monitoring shell: on/off"
   switch; toggling fades the shell while the inner box stays pixel-identical.
   Caption: additive means control can be added or removed without touching
   the other agendas — though additive does not necessitate high-value; its
   share of resources should track how much risk one expects from scheming.

All caption copy is adapted from the human-authored note (no fabricated
curriculum).

## Registry

`src/lib/demos/registry.ts`: id `additive-control`, title "Control is
additive", one-line description, tags `["control", "how-useful"]`. The demo is
then viewable in the gallery and standalone page, and embeddable later from
the module-2 lesson MDX via `<Demo id="additive-control" />`.

## Error handling & testing

- Rendering errors are caught by `DemoFrame`'s existing error boundary.
- Stepper clamps the index to `[0, steps.length - 1]`; Back on step 0 and
  Next on the last step are disabled.
- Verify with `npm run typecheck`, `npm run test` (content-integrity suite
  picks up the registry entry), and a visual pass on the demo's gallery/
  standalone page under `npm run dev`, in both themes.
