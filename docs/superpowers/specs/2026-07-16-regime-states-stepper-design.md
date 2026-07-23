# Regime-states stepper demo — design

**Date:** 2026-07-16 · **Branch:** `mod-2`

## Purpose

Upgrade the existing `regime-states` demo (module 2, "Determining the
usefulness", embedded at the top of the "The three states and the safety
budget" section of `c-regimes-l1.mdx`) from three hover-to-expand text cards
into a SlideStepper walkthrough that draws the whole section: the three
states **and** the safety-budget household picture (the will account, the
priced aisles, the basket, and the three budget generators), which today
exists only as prose. The source note's TODO was
`[demo: three-state diagram — hover to expand each state]`
(`Contorl Regimes True.md`, Reading 2); this keeps that hover intent and
extends the diagram to cover the budget half of the section.

Scope is deliberately tight because two other sessions are working on this
branch: rewrite `src/components/demos/regime-states-demo.tsx` in place
(demo id unchanged, so the MDX embed and registry wiring stay put) plus a
one-line registry retitle. No new files, no lesson MDX changes.

## Components

### `src/components/demos/regime-states-demo.tsx` (rewrite in place)

Follows the `additive-control` idiom: `SlideStepper` (existing, reused
unmodified) around one inline SVG scene (~520×300) rendered on every step;
layers fade via CSS transitions keyed off the step index so stepping
backward animates too. No chart libraries. Theme via existing Tailwind/
shadcn tokens (`border`, `muted`, `primary`, `card`).

All caption and label copy restates the lesson's own prose in
`c-regimes-l1.mdx` (no fabricated curriculum).

Steps:

1. **A regime, split in three.** Three boxes side by side — World /
   Epistemic / Resource — each with its question from the lesson's recap:
   *what is control actually worth here* / *what do we justifiably think
   it's worth* / *can we afford to act on what we think*.
2. **World state.** The World box highlights and its four item chips appear
   (what the model is actually like; how capable it is; how checkable
   research output is; what has happened so far). Caption: you never
   observe the world state directly.
3. **Epistemic state.** The Epistemic box highlights with its chips (the
   lab's confidence; interpretability findings; the track record;
   evaluation results). A dashed arrow from Epistemic toward World with a
   visible gap; caption carries the measured-vs-actual warning — an eval's
   score and whether control actually works can come apart.
4. **Resource state: the will account.** The Resource box expands downward
   into the household picture; a bank-account element labeled *political
   will — the only currency*. Caption: it fades over time and spikes after
   frightening incidents.
5. **The priced aisles.** Three aisle shelves appear with price tags naming
   who sets each price: usefulness tax (commercial pressure and public
   mood), compute (internal politics), delay (the race). Caption: the
   regime sets the prices, not the lab.
6. **The basket.** A shopping-cart element: deploying control means buying
   a particular basket — a lot of usefulness tax, some compute, very
   little delay. Caption: same plan, same basket — different price tags in
   different worlds.
7. **What refills the budget.** Three inbound arrows: incidents/evidence
   (refill the account), public buy-in (changes the prices), passed policy
   (locks a floor in place). Hands off to the "Budget or prices?" exercise
   sequence just below the section.

Interaction beyond the stepper chrome: on steps 1–3 the three state boxes
keep a light hover affordance (hovering highlights a box and its chips),
preserving the note's original hover-to-expand intent.

Seven steps is longer than the module's other steppers (2–4), accepted
deliberately: each step is one small reveal with a short caption, and
merging the budget steps would cram the section's centerpiece.

## Registry

`src/lib/demos/registry.ts`: retitle the existing `regime-states` entry from
"The three states" to "The three states and the safety budget". Id, tags
(`["control", "how-useful"]`), and component export name are unchanged.

## Error handling & testing

- Rendering errors are caught by `DemoFrame`'s existing error boundary;
  `SlideStepper` already clamps the step index and disables Back/Next at
  the ends; `DemoFrame`'s Reset remounts to step 0.
- Verify with `npm run typecheck`, `npm run test`, and a visual pass on the
  demo's gallery/standalone page and in the lesson under `npm run dev`.
  The site is light-only today; use theme tokens anyway.
- Coordination: fetch/rebase `mod-2` before committing and pushing (two
  other sessions are active on this branch).
