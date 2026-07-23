# Five-worlds map + two-games diagram — design

**Date:** 2026-07-16 · **Branch:** `mod-2`

## Purpose

Two new diagrams for module 2's "Determining the usefulness" lesson
(`c-regimes-l1.mdx`), filling the two remaining diagram-shaped sections
after the `regime-states` and `regime-loop` steppers:

1. **`five-worlds`** — Greenblatt's five caricatured futures, currently a
   bullet list, drawn as a map whose axes are the lesson's own two core
   dimensions (world state vs. epistemic state). The payoff is spatial:
   Lurkville sits in the same "looks fine" row as Easyland.
2. **`two-games`** — the inner-game/outer-game coupling ("the most
   important idea in this module"), which currently has no picture. A
   static anchor image that previews the loop without duplicating the
   `regime-loop` circuit.

All copy restates the lesson's prose; the map's dot positions are
qualitative restatements of the five bullets, no invented quantities.

## Components

### `src/components/demos/five-worlds-demo.tsx` (new)

One static SVG plane (~560×330) plus a fixed-height HTML caption panel
below (no stepper). Axes, both schematic and unitless:

- Horizontal (world state): "how misaligned the models actually are",
  from *actually fine* to *coherently scheming*.
- Vertical (epistemic state): "how alarming it looks from the inside",
  from *looks fine* to *looks alarming*.

Dots, placed per the lesson's descriptions: Easyland bottom-left;
Slopolis low-middle; Hackistan center; Schemeria top-right; Lurkville
bottom-right — the same row as Easyland, joined by a dashed band labeled
"indistinguishable from the inside".

Interaction: hover or tap a dot to select it; the caption panel shows
that world's name and its one-line blurb (restated from the bullets).
Default caption invites exploring and explains the axes. Theme tokens
(`card`, `border`, `muted`, `primary`) throughout.

Embed: in `c-regimes-l1.mdx`, after the five-worlds bullet list, before
the "Notice the five differ…" paragraph.

### `src/components/demos/two-games-demo.tsx` (new)

Fully static SVG (~560×300), no interaction, no state. An outer rounded
box ("The outer game — out in the world"; chips: leadership, the public,
governments) contains an inner rounded box ("The inner game — inside the
lab"; chips: designing protocols, extracting work, catching bad behavior,
the possibly-scheming model). Two curved arrows cross the boundary:
"evidence" flowing out (a caught schemer) and "budget" flowing back in
(authorized safety spending).

Embed: in `c-regimes-l1.mdx`, after the coupling paragraph ("The two
games are coupled…"), before the quick-recall `ExerciseSequence`.

## Registry

`src/lib/demos/registry.ts`: two new entries — `five-worlds` ("The five
worlds"), `two-games` ("The two games") — both tagged
`["control", "how-useful"]`.

## Error handling & testing

- `DemoFrame`'s error boundary catches render errors; `five-worlds`
  selection state is a single nullable id (Reset remounts to null);
  `two-games` has no state.
- First MDX edit of this workstream: two other sessions are active on
  `mod-2`, so `git pull --rebase` immediately before pushing.
- Verify with `npm run typecheck`, `npm run lint`, `npm run test`, and an
  SSR smoke pass on the lesson page and both `/demos/<id>` pages under
  `npm run dev` (needs stub `WORKOS_*` env vars).
