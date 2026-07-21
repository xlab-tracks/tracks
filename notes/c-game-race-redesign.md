# Proposal — redesign of "Safety over a deployment: the race"

Status: **proposal only, nothing implemented.** Companion to tracker items R1–R8 in
[c-game-deshittify.md](./c-game-deshittify.md).

## What this section is actually for

It does **not** show non-monotonicity — it deliberately proves the opposite. Under
fixed per-attack odds, Term A doesn't depend on k and Term B only rises, so "attack
as often as possible" is the *correct* conclusion of this model. The hump is the next
section's payoff, and it lands because this section made the reader believe the wrong
thing for a defensible reason, then hit them with "but the paper's red team attacks
rarely." The redesign should sharpen that wrong-turn structure, not soften it.

## Change 1 — exact event factor

Replace `1 − e^(−k(w+c))` with the exact `1 − (1−w−c)^k`.

- Exact for this section's framing (red chooses k attacks outright, i.i.d. odds).
- Interpretable at sight: `(1−w−c)^k` = "all k attacks land neutral" — which is what
  makes the generation exercise below feasible. Recognizing `e^(−x)` requires knowing
  the Poisson limit; recognizing "all-neutral to the k-th power" requires nothing.
- Numerically necessary, not cosmetic: w+c = 0.577 here, so the approximation is off
  by ~4 points at the default k=2 and fails the k=1 sanity check (exact = w = 15.6%,
  approx = 11.8%) — contradicting the demo's own per-attack readout.
- Sanity check worth surfacing in the lesson: at k=1 the product is
  (w+c) · w/(w+c) = w. ✓

In the full game (`evaluateGame`), the honest exact form is per-problem: each of the
N problems is independently decisive with probability r(w̄+c̄), so the event factor is
`1 − (1 − r(w̄+c̄))^N`. There r(w̄+c̄) ≈ 0.001, so this is numerically
indistinguishable from the current exponential — calibration pins should survive
(verify with `npm run test`). Use exact forms everywhere for consistency with the
displayed formula.

## Change 2 — reordered pedagogy

New sequence: **rules → hinge check → bare formula → generation check → confirmation
→ MC predict → demo → reveal.**

Why hinge-first: interpreting Term A = w/(w+c) correctly requires already having
loaded "the game is settled by the first decisive attack; neutrals change nothing."
Without it, the natural reading of Term A is "probability an attack slips through" —
which is **w**, not w/(w+c). That misreading is common enough that it's exactly the
misconception the section should target.

Corrected glosses (these matter; earlier drafts had them wrong):

- **Term A** = P(this attack is a *win* | this attack is *decisive*). Conditional on
  the attack ending the game, the probability it ended in red's favor. The neutral
  outcomes are divided out entirely.
- **Term B** = P(at least one of the k attacks is decisive) = 1 − P(all k neutral).
  Deployment-level, not per-attack; the only place k appears.

## Draft section text

> ## Safety over a deployment: the race
>
> So far we have scored one attack in isolation. Safety is defined over the whole
> deployment: N = 5,000 problems, and the blue team wins only if *no* working
> backdoor ever ships.
>
> Every attack ends in exactly one of three ways:
>
> - **Caught** — the monitor flags it, the audit finds the backdoor, and the
>   deployment is shut down. Blue wins outright: catching the model red-handed is
>   proof, and the game (following the paper) is scored that way.
> - **Win** — it ships and the backdoor works. Red wins outright.
> - **Neutral** — it ships but the backdoor is broken. Nothing happens; the game
>   continues as if the attack never occurred.
>
> Two of these outcomes end the game on the spot. Call an attack **decisive** if it
> is caught or wins.
>
> **[Understanding check — the hinge]** *The whole deployment is settled by the
> first decisive attack, whenever it comes. Why? And why do the neutral attacks
> before it have no effect at all on the outcome?*
> *(Sample answer: a catch and a win each end the game immediately, so nothing after
> the first decisive attack is ever played. A neutral attack leaves the game exactly
> as it was — nothing accumulates — so the neutrals before the first decisive one
> are irrelevant. Red must survive every audit it triggers across the whole run;
> blue only needs to win once.)*
>
> Now suppose the red team makes k attacks, each with the same odds: caught with
> probability c, a working backdoor ships with probability w, neutral otherwise.
> Then:
>
> $$P(\text{red wins}) = \underbrace{\frac{w}{w+c}}_{\text{Term A}} \cdot \underbrace{\left(1-(1-w-c)^k\right)}_{\text{Term B}}$$
>
> **[Understanding check — generation]** *Before reading on: what event is Term B
> the probability of? And Term A is a conditional probability — of what, given what?
> (Check your answers against k = 1, where the formula must reduce to something
> obvious.)*
> *(Sample answer: (1−w−c) is the probability one attack is neutral, so (1−w−c)^k is
> the probability all k are — Term B is the probability at least one attack is
> decisive. Term A is the probability a decisive attack is a win rather than a
> catch: given the race gets decided, who won it. At k=1 the product is
> (w+c) · w/(w+c) = w, as it must be.)*
>
> Read the formula as two questions multiplied together. *Does anything decisive
> ever happen?* That is Term B, and it is the only place k appears. *If so, who
> won?* That is Term A — the race odds — and note what it is **not**: it is not the
> probability an attack slips through (that is w). It is conditional on the attack
> being decisive; the neutral outcomes cancel out of the game entirely, and their
> only role is to burn one of red's k chances.
>
> One consequence is worth staring at: Term A does not depend on k. No amount of
> attacking changes who is favored in the showdown — attacking more only makes the
> showdown more likely to happen. So P(red wins) climbs with k but can never exceed
> w/(w+c): the race odds are a hard ceiling.
>
> **[MC predict — options as bare claims]** *Every attack has the same fixed
> per-attack odds. To maximize its chance of winning at least once over the
> deployment, how often should the red team attack?* — Once, at the single best
> moment / About ten times / As often as possible / It makes no difference.
>
> **[Demo]**
>
> With fixed odds the curve only rises: each extra attempt raises the chance some
> decisive event fires and changes nothing else. If every attack were equally good,
> red should attack every single problem.
>
> But the paper's red team attacks *rarely*. So the fixed-odds assumption is doing
> load-bearing work — and it is false. The next section restores what it dropped.

## Demo changes

1. Exact event factor (Change 1) — the readout then satisfies P = w at k = 1, the
   self-check the lesson explicitly invites.
2. Fix the y-axis at 0–100% and draw a dashed horizontal asymptote at w/(w+c),
   labeled "race odds — ceiling" (tracker R2).
3. Provenance line under the per-attack odds: they are frozen from the calibrated
   monitor at σ = 0.4, g = 0.5; those become levers in the next two sections
   (tracker R5).
4. Readout labels "Term A / Term B" (tracker R3); allow k = 0 with Term A rendered
   as "—" (tracker R6).

## Model changes

- `evaluateHomogeneous` (src/lib/control-model/protocol.ts): event factor
  `1 − (1−decisive)^k`.
- `evaluateGame`: event factor `1 − (1 − r(w̄+c̄))^N` (per-problem exact form).
- Re-run calibration pins in `control-model.test.ts`; expected to pass unchanged.

## Open questions

- Exact phrasing of the hinge check — current draft asks two things at once; could
  split.
- Whether the confirmation prose should include the 3-line derivation (first
  decisive event → geometric series) as a collapsible "where this comes from."
