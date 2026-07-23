# Adopt Shlegeris's "political will" throughout Module 2 §3

**Date:** 2026-07-20
**Scope:** `c-regimes-l1` ("Determining the usefulness") only — the lesson body,
the `will-account` demo, and the `regime-states` demo embedded in it. The
`c-efficient-tradeoffs` paper, `c-regimes-l2`, `c-contra-l1`, and
`exercises.data.ts` are **out of scope and untouched**.

## Problem

Module 2 uses "political will" in two incompatible senses. The Shlegeris
reading (`c-efficient-tradeoffs`, anchors b-0013 / b-0014 / b-0029–31) defines
it as a developer's willingness to concede safety-relevant actions up to some
cost threshold measured against *the developer's own* objectives — a single
spendable budget you influence only indirectly. `c-regimes-l1` instead splits
the safety budget into three co-equal "wills" — **economic**, **political**,
**social** — where "political will" means only a legislature's willingness to
pass laws. A learner meets Shlegeris's sense in the reading, then a lesson that
silently redefines the term two items later.

## Decision

Adopt the Shlegeris sense as the single account. **Remove the
economic/social/political distinction entirely** (option A: the labels
disappear as terms; only "political will" is named). Economic, social, and
legislative pressure survive only as *routes* into the one account, described
in prose, not as named branches.

The resource-state section becomes **demo-less**: the `will-account` demo was
built to simulate the three-bar model and loses its conceptual basis, so it is
deleted rather than reworked. The section still has `regime-states` (earlier in
the lesson), `two-levers` (`:134`), and `regime-loop` (`:140`).

## Changes

### 1. `src/content/lessons/c-regimes-l1.mdx` — rewrite `:64-97`

Replace the three-will definition list and the will-account embed with a single
political-will definition drawn from Shlegeris's wording. Approved copy:

> We analyze the safety budget through the currency of **political will** — in
> the sense the previous reading gave it. A developer that doesn't fully share
> your priorities is still willing to concede safety-relevant actions up to some
> cost threshold, measured against *the developer's own* objectives; that
> willingness is the account you spend from. It is held by the lab, not by you —
> you move it only indirectly — and it fades without reinforcement while spiking
> after concerning incidents. Pressure reaches that account through several
> routes: internal pushback from staff, public backing, and binding external
> rules, and a project's C-suite, the public, and the government each respond to
> different ones. For now we operationalize the budget by asking what political
> will buys and what refills it.
>
> Deploying a control-based safety intervention spends political will on:
>
> - **Delay** — How long you can delay is priced by the race to AGI. With a
>   rival lab three months behind, delay is nearly unbuyable at any level of will.
> - **Usefulness** — Whether the developer will accept a less useful, slower
>   system. A scared public makes this cheaper by lowering demand for the product.
>   - Note that control's main payoff is also denominated in usefulness — you give
>     up some usefulness to make the rest trustworthy — so control partially
>     offsets its own tax.
> - **Compute** — We focus on internal compute, governed by internal politics.
>   Compute is finite, so pulling it from capabilities research spends will to
>   overcome the slowing of development.
>
> Note that delay, usefulness, and compute can be cheap in one regime and
> ruinous in another.
>
> Political will is not fixed — it is generated, and the sources work differently:
>
> - **Incidents and evidence** — Concerning incidents and accumulating evidence
>   refill the account, and refill it hardest right after something goes wrong.
> - **Public buy-in** — Public support raises the account and slows its fading,
>   though its pull on a developer is weaker and more indirect.
> - **Passed policy** — Passed policy converts will into a durable floor, because
>   repeal is expensive. Note that what gets written into regulation tends to be
>   easy to explain and verify politically, which is not necessarily optimal policy.

The `<Demo id="will-account" />` line (`:97`) is removed.

Net-new prose is limited to the opening definition (~2 sentences). Delay /
usefulness / compute and the three refill sources keep their structure and
claims; only the "economic/social/political will" attributions come out. The
"willpower" coinage (`:64`) is dropped in favour of naming the account
"political will".

### 2. Delete the `will-account` demo

- `src/components/demos/will-account-demo.tsx` — delete (534 lines).
- `src/lib/demos/registry.ts:21` — drop the `WillAccountDemo` import.
- `src/lib/demos/registry.ts:185-191` — drop the `"will-account"` registry
  entry (also removes it from the `/demos` gallery and the `/demos/[id]/embed`
  route).
- `src/components/demos/regime-states-demo.tsx:280` — the stale
  `// From the will-account step on…` comment: reword to drop the reference (the
  step it names still exists; only the cross-demo name goes).

`docs/superpowers/specs/2026-07-18-will-account-model.md` and the two other
dated spec files that mention the demo are left as historical record, per the
repo convention that specs capture intent even after the code changes.

### 3. `src/components/demos/regime-states-demo.tsx` — restate captions/labels

Demo caption/label copy must restate the lesson prose (CLAUDE.md, Demos §), so
these move with the lesson:

- `:33` (STEP "The will account" caption) — drop "in economic, political, and
  social spheres"; the account is political will, held by the lab, fading /
  spiking as before.
- `:38` ("The priced aisles" caption) — remove the three per-price will
  attributions ("primarily economic will", "economic and social will", "the
  economic will to overcome…"); keep the priced-by-the-regime point and the
  control-offsets-its-own-tax note.
- `:48` ("What refills the budget" caption) — "incidents and evidence refill all
  three wills, with the biggest impact on social will; public buy-in raises
  social will…" → the three sources refill the one account, hardest right after
  an incident; public buy-in raises it and slows its fading; passed policy sets a
  durable floor.
- `:142` / `:148` / `:154` (AISLES `will` second-line on each price tag) — the
  field's purpose was to show a *different* will-type per aisle, which no longer
  exists. Set all three to "spent from political will" (reinforces the single
  account). The `will` field and its SVG second line stay; only the strings
  change.

### 4. `src/lib/demos/registry.ts:189` — regime-states description

"…shows how economic, political, and social will interact & are affected by the
real world." → describe the single political-will account and the real-world
events that move it. (Line 149's regime-states description does not mention the
three wills — left as-is.)

## Out of scope / deliberately not done

- **No glossary entry.** "political will" is rendered as markdown bold, not a
  `<Term>`, to keep the change inside §3 and avoid touching the global
  `glossary.json`. Can be added later if the author wants the hover-card.
- **No replacement demo** for the vacated `:97` slot.
- `exercises.data.ts:887` ("very low political will (no meaningful pause is on
  the table)") is already correct under the Shlegeris sense — untouched.

## Verification

- `npm run test` — `registry.test.ts` only covers `additive-control`, so
  deleting `will-account` does not break it; `content.test.ts` and
  `glossary.test.ts` must still pass (no `<Term>`/gloss added, so no new
  references to resolve).
- `npm run typecheck` — catches the dropped import / registry entry if any
  reference is missed.
- `rg 'will-account|WillAccount'` over `src/` returns nothing after the change.
- `rg -i 'economic will|social will'` over `c-regimes-l1.mdx` and
  `regime-states-demo.tsx` returns nothing.
