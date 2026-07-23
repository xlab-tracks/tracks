# Will-account demo — internal model & tuning writeup

**Date:** 2026-07-18 · **Branch:** `mod-2` · **Status:** internal design
record for the `will-account` gallery demo. Not curriculum: nothing here is
shown to learners except through strings that restate `c-regimes-l1.mdx`
(anchors cited per string below).

## 1. The situation being simulated

The demo drops the learner into a deliberately **pessimistic regime**,
described in the module's own three-states language:

- **Resource state (what the demo shows):** the account opens low. The lab
  is mid-race, public attention is modest, and nothing is reinforcing any
  of the three wills. This is the "fade" default of mdx:74 with no slack.
- **World/epistemic backdrop (implied, never asserted on screen):** prices
  sit at the harsh end of mdx:86's "cheap in one regime and ruinous in
  another." The `rival lab three months behind` toggle is mdx:79's exact
  scenario; `scared public` is mdx:81's.
- **What "pessimistic" must NOT change:** the structural claims are the
  lesson's and stay fixed — incidents hit social will hardest, then
  political (mdx:91); buy-in raises social will and slows only the social
  fade (mdx:93); policy converts political will into a durable floor
  (mdx:95); control's basket is delay + usefulness + compute with the
  attributions of mdx:76-84. Pessimism lives **only in magnitudes**.

The intended play experience: a single control deployment is affordable on
day one and roughly empties the account; affording the next one requires
riding several evidence spikes in quick succession — i.e. the learner
personally enacts "the loop runs on evidence" (mdx:149) — and in a close
race delay is unbuyable at any achievable balance (mdx:79).

## 2. Timestep semantics

**One tick = one month**, rendered ~every second of real time and shown to
the learner as `Month N` plus a month-stamped feed. Rationale: the
lesson's dynamics are institutional (attention fading, policy passing,
race pressure) — monthly is the natural grain; per-day would imply news
cycles, per-year would make the fade invisible.

| Constant | Value | Meaning |
| --- | --- | --- |
| `TICK_MS` | 1000 | one simulated month per real second |
| `DECAY` | 1.5 pts/month | un-reinforced will loses ~18 pts/year |

Decay is **linear and uniform** across the three wills. The lesson ranks
refill sizes but never ranks decay rates, so differentiating them would be
editorializing beyond the text; linear (vs proportional) keeps the bars
falling at a legible constant speed. Both simplifications are deliberate.

## 3. Parameter derivations (all on a 0–100 scale)

**Starting balances — `economic 45 (v2, author-set) / political 36 / social 28`.**
Ordering rationale: profit-adjacent permission is the least scarce for a
frontier lab; standing political capital is thinner; ambient public
attention is thinnest and fades fastest in practice (it's the one the
lesson gives a dedicated slowing mechanic to). Level rationale: economic
must sit just above one basket (46 vs 28) so exactly one deployment is
affordable at open.

**Incident/evidence spike — `+9 econ / +16 pol / +26 soc`.**
Preserves mdx:91's ordering ("much larger impact on social will and a
large impact on political will"). Sized so a social spike burns off in
~17 months of fade (26/1.5) — dramatic but not durable, which is the
pessimistic reading of "spikes after concerning incidents" (mdx:74).
Economic +9 means re-affording a 28-point basket takes ~3 incidents ridden
faster than decay eats them.

**Public buy-in — `+10 soc / +2 pol`, social fade ×0.3 for 7 months.**
mdx:93: raises social will, slows its fading, "weaker effects on political
will." Seven months ≈ a campaign's attention half-life; the 0.3 factor
makes the slowdown visible against the 1.5 baseline without pausing decay.

**Passed policy — requires `pol ≥ 30`, spends `24`, floor = remainder.**
mdx:95: conversion, not refill. Pessimistic reading: passing costs almost
everything you have, and the floor you lock is low (open with 36 → floor
≈ 12 even if passed immediately). "Repeal is expensive" = the floor never
decays.

**The basket — `28 econ + 12 soc` base; close race `+20 econ`; scared
public `−4 econ / −6 soc`.**
Attributions per mdx:76-84 (delay → race-priced, primarily economic;
usefulness → economic and social; compute → internal politics, economic).
Close race pushes the economic price to 48 — above any balance reachable
without stacking multiple incidents — operationalizing "nearly unbuyable
at any level of will" (mdx:79). Scared-public discounts restate mdx:81;
the economic knock-on stays small because the lesson hedges it ("can
potentially").

**Feel targets (checked by live probes):**
1. Deploy #1 succeeds at open; deploy #2 immediately after is broke.
2. Three incidents inside ~4 months re-enable one deploy.
3. Close race: broke even from the opening balance.
4. Mashing generators cannot stall the monthly fade (interval armed on
   `playing` only).

## 4. News-feed copy pool

Feed entries are month-stamped one-liners. **Every string restates a cited
lesson line** — the feed adds a timeline, never new claims. No invented
lab names, model names, or dates.

| Event | Feed text | Anchor |
| --- | --- | --- |
| incident | "a scheming model caught in the act — evidence in hand" | mdx:19 |
| buy-in | "public buy-in: social will rises and its fading slows" | mdx:93 |
| policy | "policy passed — a durable floor locks in place" | mdx:95, mdx:146 |
| deploy | "the account buys a technique — a monitoring protocol for the lab's internal AI agents" | mdx:140 |
| broke | "the basket is unaffordable — prices are ruinous in this regime" | mdx:86 |
| race on | "the race prices delay nearly out of reach" | mdx:79 |
| scared on | "a scared public makes usefulness cheaper to buy" | mdx:81 |
| low-will (auto, first time a will crosses below 15) | "without constant reinforcement, will keeps fading" | mdx:74 |

Feed mechanics: entries append inside the same functional state update as
the event (pure w.r.t. `prev`, StrictMode-safe); the UI renders the last
five, newest first; the caption panel (aria-live) remains the announced
teaching text — the feed is the visual timeline.

## 5. v2 — game mode (deploy-before-2029)

v2 reframes the sim as a game: **deploy as much control as possible by the
end of 2029**, starting from the learner's current calendar month (the deadline
and calendar framing are author-directed game chrome, not lesson claims).
The teaching goal: the learner personally runs the loop of mdx:140-147.

**Emergent events replace buttons.** Three controls are removed:

- *Incident / evidence* button → catches are now **produced by deployed
  control**: each deployed measure has a per-month catch chance. Anchor is
  the loop's own step 2, "The schemer that would have quietly sabotaged
  research **may** now be caught" (mdx:142) — the "may" is the die roll.
  A catch spikes the balance exactly like the old incident button
  (mdx:91's ordering), because a catch IS the incident/evidence event
  (mdx:19, mdx:143-146).
- *scared public* checkbox → a catch opens a temporary **public-alarm
  window**: "Leadership and the public become alarmed" (mdx:146) during
  which "a scared public makes it cheaper" (mdx:81) — the basket's
  usefulness price drops for the window's duration.
- *rival lab three months behind* checkbox → the close race is now the
  **fixed backdrop** of the pessimistic regime (mdx:79 priced into the
  base basket rather than toggled).

**v2 mechanics and tuning.**

| Mechanic | Value | Rationale / anchor |
| --- | --- | --- |
| Clock | starts at the learner's current month; ends after Dec 2029 (author-set) | game chrome; "three months behind" (mdx:79) stays meaningful at monthly grain |
| Catch chance | 6%/month per deployed measure (author-set, down from 10%) | mdx:142's "may"; one early measure now expects ~2.5 catches over the 42-month horizon |
| Catch spike | +12 econ / +16 pol / +26 soc | mdx:91 ordering; econ raised from v1's +9 so the loop visibly funds the next deploy |
| Public-alarm window | 6 months; basket −4 econ / −6 soc | mdx:146 + mdx:81 (v1's scared-public discount, now emergent) |
| Basket (base) | 20 econ + 12 soc (author-set) | eased from v1's 28: two deploys are affordable up front (economic 45 covers 2×20; social 28 covers 2×12 with 4 to spare), the third needs the loop — and a catch's +12 econ covers most of a basket |
| Buy-in | costs 5 econ (author-set); +10 soc up front, ×0.3 social fade for 7 months, then +4 pol **when the campaign completes** | mdx:93 (political effect stays weaker than social); the price, cooldown, and at-completion timing are game mechanics, not lesson attributions |
| Policy | ≥30 pol, spends 24, floors political; disallowed if the spend would land below the existing floor; landing within 5 of the floor only nudges it +2 (author-set) | mdx:95; the floor is the **durable** part of the final score ("repeal is expensive"); the marginal-pass rule is game mechanics preventing under-floor dips and barely-clearing ratchets |
| Score | measures deployed + policy floor locked at deadline | the floor persisting past the deadline operationalizes "durable" |

**Feel targets (v2):** deploy #1 affordable at start; without catches the
account decays below any second deploy; each catch + its alarm window makes
one more deploy reachable; a skilled run lands ~3-4 measures by the
deadline; the close-race backdrop keeps every purchase painful.

**Costs are always visible** on the buttons themselves and in an info
panel (objective, clock, deployed measures + combined catch chance, current
prices, active effects, final tally). Randomness is rolled in the interval
callback and passed into the pure state updater.

## 6. Known simplifications

- Uniform linear decay (see §2). — legibility over realism.
- The public-alarm economic discount applies deterministically while the
  lesson hedges it ("can potentially", mdx:81); in v2 the hedge travels in
  CAPTIONS.catch — the caption shown when every alarm window opens.
- Incident spikes are instantaneous; the lesson doesn't specify onset.
- The policy floor applies to political will only; the lesson's floor is
  narrower than a full budget guarantee, and this is the closest visual.
