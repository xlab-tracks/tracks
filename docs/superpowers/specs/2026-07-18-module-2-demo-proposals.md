# Module 2 — proposed demos & activities

**Date:** 2026-07-18 · **Branch:** `mod-2` · **Status:** P1–P3 built as
**gallery-only** demos (`p-unacceptable`, `will-account`, `two-levers` —
registry + components, no lesson MDX changes); embed placement and P4 remain
author decisions.

Every proposal below is grounded in existing prose of `c-contra-l1.mdx` /
`c-regimes-l1.mdx` (line references as of this date) — captions and labels
would restate those passages only; nothing new would be claimed. Embedding
any of these changes the lesson MDX, so none should ship without the
author's sign-off on placement.

## P1 · `p-unacceptable` — the decomposition sliders

**Anchor:** `c-contra-l1.mdx` §Modeling control (lines 27–40) and the
alternatives paragraph (line 66: alignment research "acting on
$P(\text{scheming})$ itself").

The lesson's displayed equation, made manipulable: two sliders —
$P(\text{scheming})$ and $P(\text{unacceptable}\mid\text{scheming})$ — over a
stacked bar of the two terms. The point the prose makes in words becomes
visible: **control squeezes the conditional; alignment squeezes
$P(\text{scheming})$**; either lever shrinks the same total. A toggle
labeled with the lesson's own framing ("control agenda" vs "alignment
research proper") highlights which slider each agenda moves.

- Embed: after the equation block (line ~33), before "Therefore, control
  mainly caters to…".
- Shape: small explorable (no stepper), one SVG bar + two sliders.
- Effort: small. Registry: `p-unacceptable`, tags `["control","how-useful"]`.

## P2 · `will-account` — the fading balance explorable

**Anchor:** `c-regimes-l1.mdx` §Resource state (lines 62–95) — the will
definitions (economic / political / social), "fade[s] over time without
constant reinforcement and spikes after concerning incidents" (line 74),
the three prices (delay / usefulness / compute, lines 76–86), and the three
budget generators with their differing effects (lines 88–95).

A small time-stepped simulation of the three will balances: bars for
economic / political / social will that decay each tick; buttons for the
three generators — *incident/evidence* (large social + political refill),
*public buy-in* (social refill + slows social fading), *passed policy*
(converts political will into a durable floor line that decay cannot cross,
with the lesson's catch shown verbatim as the caption). A "buy a control
deployment" button spends the priced basket so learners feel "cheap in one
regime and ruinous in another" (line 86) via a regime selector.

This extends `regime-states` (static picture) into the *dynamics* the prose
emphasizes but nothing currently visualizes.

- Embed: end of §Resource state (after line 95), before "Why the three
  states are not interchangeable".
- Shape: explorable with tick loop (Pause chrome like `regime-loop`).
- Effort: medium (the largest proposal). Registry: `will-account`.

## P3 · `two-levers` — better tech vs bigger budget

**Anchor:** `c-regimes-l1.mdx` §Techniques are the choice (lines 123–132):
"exactly two ways to get more safety: 1. Improve the techniques… any given
sacrifice of usefulness buys more safety than it used to. 2. Grow the
budget… you can afford bigger sacrifices," plus the closing attribution
("Technical safety research works on the first lever. Advocacy,
communication, and policy work on the second.")

A safety–usefulness curve with two buttons: **Improve the techniques**
bends the curve upward (same usefulness sacrifice → more safety);
**Grow the budget** extends how far along the curve you can afford to go
(the affordable region grows). Caption cycles the lesson's two sentences.
Ties visually into the module's related reading (efficient tradeoffs) and
the `c-efficient-tradeoffs` paper item.

- Embed: after line 130, before "The states are the input…".
- Shape: static-ish SVG + two buttons; no stepper.
- Effort: small-medium. Registry: `two-levers`.

## P4 · `evidence-ladder` — why a catch is the gold standard (activity)

**Anchor:** `c-regimes-l1.mdx` §The loop, line 149: an argument vs a staged
demo vs a real-deployment catch — "the transcript can be checked line by
line, even by hostile parties" and "staged research settings get dismissed
as roleplay or contrived setups".

Better as an **exercise** than a demo: a tap-reveal (existing type) with the
three evidence kinds as cards; each reveal restates the lesson's two
properties (line-by-line checkability; resistance to deflection) applied to
that rung. Sits naturally right before the Reflection Questions.

- Embed: after line 149, before §Reflection Questions.
- Shape: `tap-reveal` exercise in `exercises.data.ts` — no new component.
- Effort: small; authoring-only (needs the author to approve the card
  wording, since exercise copy is curriculum).

## Noted, not proposed

- **Eval-vs-reality decoupling** (lines 58–60): already visualized twice —
  `regime-states` step 3 draws the measured-vs-actual gap arrow, and
  `five-worlds`' vertical axis is exactly this distinction. A third
  treatment would be redundant.
- **Capability-stage index strip** (line 31): one sentence in the lesson;
  a demo would outweigh its anchor. Revisit if the capability-stage framing
  grows in later modules.
