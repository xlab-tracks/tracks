# Briefing: the c-game deshittify tracker

We are improving ("deshittifying") the Tracks lesson **"Trusted monitoring as a
game"** — `src/content/lessons/c-game.mdx` and its demo components under
`src/components/demos/` (shared math in `src/lib/control-model/`).

All known problems live in one tracker: **`notes/c-game-deshittify.md`**. How to
read it:

- Each item is a **grievance** (a specific problem) with an ID — `G*` global,
  `M*` = §1 monitor-tails, `R*` = §2 race; later sections get their own letters.
- `[high] / [med] / [low]` is priority. The checkbox means **implemented**, not
  accepted — nothing is checked yet.
- **(MAYBE)** means Arya hasn't decided whether the item is worth taking. No tag =
  accepted grievance.
- Items may carry a short *Proposal:* sketch; long proposals live in sibling files
  in `notes/` and are linked (e.g. `c-game-race-redesign.md`).

Ground rules:

1. **We are mapping problems first; solutions come later.** Do not implement fixes
   unless Arya explicitly asks. Proposals are welcome; code changes are not.
2. When you find a new problem, add it to the tracker under its section with the
   next free ID, a priority, and (optionally) a *Proposal:* line.
3. If you touch the race-section math, know that its headline numbers are pinned by
   calibration tests in `src/lib/control-model/control-model.test.ts`.
