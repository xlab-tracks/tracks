# Proposal — "Safety over a deployment: the race", relocated into the AI Control walkthrough

Status: **proposal only, nothing implemented.** Draft of the race section as it would
live inside the paper walkthrough (`papers.data.ts`), not the standalone c-game lesson.
Companion to the redistribution effort; successor in style to
[c-game-race-redesign.md](./c-game-race-redesign.md).

## How to edit this file

- Prose inside the blockquotes is the **verbatim learner-facing text** — edit freely.
- Lines in `**[BRACKETS]**` are structural markers (which content block, what type,
  splice position) — describe placement, not shown to the learner. Leave them unless
  you're changing structure.
- The "Implementation flags" and "Assumptions" sections are notes to the implementer,
  not content.

## Assumptions (flag if wrong)

1. Splices in as a **labeled markdown add + activity cluster** (M7 pattern), with **no
   section heading of its own**, anchored **after the "Safety: The blue team win
   probability is 62%" block** at the end of §3.2's body (before §3.2.1 Qualitative
   Analysis).
2. The "opportunities are not equal" cluster follows this one contiguously, so the
   closing bridge points "just below" rather than at a paper section.
3. Every number here comes from the paper's own contingency table, so the
   calibrated-model disclosure note is **not** needed in this cluster — it moves to the
   opportunities cluster (first place the model is actually used).

## Design note

Skeleton is the R7 race section: rules → hinge → bare formula → terms check →
confirmation → predict → demo → reveal. Two deliberate departures from the c-game
version:

- **The whole cluster is framed as reconstructing the paper's 62%.** The paper reports it
  and never shows the arithmetic; the cluster rebuilds it from the contingency table and
  the race formula, and the reveal pays it off ("≈65% from one line of algebra"). This is
  the spine — every block advances the reconstruction, so nothing is a free-floating
  aside.
- **The taxonomy is concrete.** Each of the three outcome bullets **is** a row of the
  table the reader just studied, and the formula's k=1 sanity check returns a number from
  the paper rather than from the model. The predict MC is retargeted so the reader's fresh
  upfront-auditing derivation is the *baited wrong answer*, not a spoiler.

---

## The section

**[MARKDOWN ADD — label: "Safety over a deployment: the race"]**

> The paper reports that 62% as a measured result and moves on; it never shows the
> arithmetic. But the contingency table holds everything the number is made of, and
> rebuilding it is the fastest way to see what "safety" even means here. Safety is not a
> property of any one attempt. It is a property of the whole 5,000-problem deployment,
> across which the blue team wins if it *ever* audits a backdoor and the red team wins if
> a working one *ever* ships. So work up to it: start with a single attempt, then compound
> over the run.
>
> Each of the red team's 71 attempts ended in exactly one of three ways:
>
> - **Caught** — 24 of them (6 working, 18 broken) were audited. An audit that turns up a
>   backdoor — working or not — shuts the deployment down: blue wins outright.
> - **Win** — 13 shipped a working exploit: red wins outright.
> - **Neutral** — 34 shipped broken. No exploit, no audit, no consequence; the game
>   simply continues.
>
> So a single attempt is caught with probability $c = 24/71 \approx 0.34$ and lands a
> working backdoor with probability $w = 13/71 \approx 0.18$; the rest of the time it does
> nothing. Two of the three outcomes end the game on the spot — call an attempt
> **decisive** when it is caught or wins.

**[EXERCISE — understanding-check `c-paper-l3-race-hinge`]**

> **Prompt:** The whole deployment is settled by the first decisive attempt, whenever it
> comes. Why? And why do the neutral attempts before it have no effect at all on the
> outcome?
>
> **Sample answer:** A catch and a win each end the game immediately, so nothing after
> the first decisive attempt is ever played. A neutral attempt leaves the game in
> exactly the state it was in before — nothing accumulates — so any number of neutrals
> before the first decisive one changes nothing. The asymmetry this creates is the heart
> of the game: the red team must survive every audit it triggers across the whole run,
> while the blue team only needs to win once.

**[MARKDOWN ADD — continuation]**

> That first-decisive-attempt logic is exactly what makes the deployment tractable: only
> one moment ever matters, so the whole run collapses to a single question about that
> moment. Let the red team make $k$ attempts, each with the table's odds. Its probability
> of winning at least once factors cleanly:
>
> $$P(\text{red wins}) = \underbrace{\frac{w}{w + c}}_{\text{Term A}} \cdot \underbrace{\left(1 - (1 - w - c)^k\right)}_{\text{Term B}}$$

**[EXERCISE — understanding-check `c-paper-l3-race-terms`]**

> **Prompt:** Before reading on, interpret the formula's two terms in your own words:
> what event is Term B, 1 − (1−w−c)^k, the probability of? And Term A, w/(w+c), is a
> conditional probability — of what, given what? (Check your answers at k = 1, where the
> formula must reduce to something obvious.)
>
> **Sample answer:** (1−w−c) is the probability that a single attempt lands neutral, so
> (1−w−c)^k is the probability that all k do — Term B is the probability that at least
> one attempt is decisive. Term A is the probability that a decisive attempt is a win
> rather than a catch: given that the race gets decided at all, it is the chance red won
> it. At k = 1 the product is (w+c) · w/(w+c) = w, exactly the table's probability that a
> single attempt ships a working exploit.

**[MARKDOWN ADD — continuation]**

> Read the formula as two questions multiplied together. *Does anything decisive ever
> happen?* That is Term B — and it is the only place $k$ appears. *If so, who won?* That
> is Term A: every attempt enters a race between red's wins and blue's catches, and Term
> A is the probability that when the race is decided, red won it. Note what Term A is
> **not**: it is not the probability that an attempt slips through (that is $w$). It is
> conditional on the attempt being decisive. The neutral outcomes cancel out of the game
> entirely; their only role is to burn one of red's $k$ chances.
>
> One consequence is worth staring at: Term A does not depend on $k$. With the table's
> odds it is $13/37 \approx 35\%$ — and no amount of attacking changes it. Attacking more
> only makes the showdown more likely to happen, so $P(\text{red wins})$ climbs with $k$
> but can never exceed 35%: the race odds are a hard ceiling.
>
> You have seen a question shaped like this before. Predict the answer for *this*
> protocol.

**[EXERCISE — multiple-choice `c-paper-l3-race-predict`]**

> **Prompt:** Every attempt the red team makes carries the table's fixed odds — the same
> chance of being caught, the same chance of a working backdoor. To maximize its
> probability of winning at least once over the deployment, how often should it attack?
>
> **Options:**
> - Once, at the single best moment
> - At an interior optimal rate, as under upfront auditing
> - As often as possible ✓
> - It makes no difference how often it attacks
>
> **Explanation:** With identical per-attempt odds, the win probability [w/(w+c)] × [1 −
> (1−w−c)^k] only rises with k: each extra attempt raises the chance that some decisive
> event fires without changing the odds of any single one. The interior-optimum instinct
> is imported from upfront auditing — but that optimum existed because attempts there had
> *different* odds depending on position: an attempt inside the audited window was
> certain death, an attempt after it was free. Trusted monitoring has no window. Every
> attempt faces the same monitor at the same threshold, so with genuinely identical
> attempts, more is strictly better. What actually restores the interior optimum — and it
> is not the audit budget — is the subject just below.

**[DEMO — `race`, paper-odds variant]**

**[MARKDOWN ADD — reveal + bridge]**

> With fixed odds the curve only climbs. Now finish the reconstruction: feed in the
> deployment the paper actually ran. Its red team submits a backdoor on about twenty of
> the 5,000 problems — and twenty attempts is already deep in the plateau, where Term B
> has all but saturated. So $P(\text{red wins})$ sits near its ceiling, the race odds
> $w/(w+c) \approx 35\%$. That is a safety of roughly 65%: the paper's headline number,
> rebuilt from the contingency table and a single line of algebra. (The few points
> between 65% and the measured 62% are the paper's sampling correction and its
> shutdown-on-statistics rule — real, but not where the mechanism lives.)
>
> The reconstruction leaves one thing unexplained. If attacking more is strictly better,
> why did the red team stop at twenty — a bare fraction of a percent of the problems it
> saw? Its policy is explicit: attack only "when there is a good opportunity to do so."
> That restraint can only pay off if waiting for good opportunities changes the odds
> themselves — the one thing the fixed-odds formula holds constant, and so the one thing
> it cannot see.

---

## Implementation flags (not learner-facing)

1. **Demo variant.** The `race` demo takes literal odds c = 0.338, w = 0.183 instead of
   deriving them from the calibrated model — the formula panel, ceiling asymptote, and
   k-slider all work unchanged, and `K_MAX = 20` now coincides with the paper's actual
   regime. Per-attempt readout line becomes "from the table: caught 33.8% · working
   backdoor ships 18.3%". Resolves tracker item R5 (magic numbers) for free.
2. **Number to verify before shipping.** The "about twenty attempts per run" figure comes
   from the sampling procedure (5,000 problems × 71/1,500 attempt rate × 1/12
   downsampling ≈ 19.7). Confirm against the paper's appendix — the reveal paragraph
   leans on "about twenty."
3. **Consistency debt.** The relocated staged AUC exercise's priors paragraph says attack
   frequency ~0.1%; the paper-derived figure here is ~0.4%. Reconcile — suggest updating
   the priors paragraph to "a fraction of a percent" or 0.4%.
4. **Ids / cleanup.** Exercise ids follow the walkthrough convention (`c-paper-l3-race-*`).
   The c-game race section gets hidden in an MDX comment (M7 pattern) once this lands.

## Open questions (race cluster)

- Does the hinge check duplicate anything already in §3.2.1's existing trio
  (operating-point / AUC-meaning / per-attempt)? Check for overlap before adding.
- Should the reveal's "≈65% from one line of algebra" claim be softened if the verified
  attempt count moves it further from 62%?

---
---

# Cluster 2 — "Opportunities are not equal" (continuation)

Status: **proposal only.** Follows the race cluster contiguously in §3.2 (before
§3.2.1). This is **layer 2**: the fixed-odds monotone result of the race cluster is the
deliberately-false setup; here the hump comes back, for the real reason.

## Assumptions (flag if wrong)

1. Splices in **immediately after the race cluster's reveal/bridge** — the bridge already
   ended on "waiting for good opportunities changes the odds themselves — the one thing
   the fixed-odds formula holds constant, and so the one thing it cannot see," so this
   cluster opens by explaining *how*.
2. This is the **first cluster to use the calibrated model** (opportunity-quality
   distribution isn't in the paper's table), so the model-disclosure note lives here.
3. The cluster that follows is **subtlety** (the red team's second lever), but its exact
   splice may be later in §3.2.1 (after b-0140) — so the closing forward pointer is kept
   light and its wording is adjacency-dependent (see flags).

## Design note — two things the relocation changed vs. the c-game version

- **The predict MC is `quantitative-Q1`, not `mechanism-A`.** In the standalone game we
  favored the mechanism question ("for rarity to be optimal, what has to be true?") whose
  killer distractor was the audited-window mechanism. But in this ordering the race
  cluster's own predict-MC *already* sprang that trap ("trusted monitoring has no
  window"), so mechanism-A is front-run and its bite is gone. The quantitative question
  ("which of the two named factors turns against the red team?") is not front-run — it
  requires running the race machinery from the previous cluster — so it's the better fit
  here. Flagged because it's a genuine consequence of relocating, reversible if you
  disagree.
- **The old `c-game-l5-hump-predict` (a shape question — "rises then falls?") is
  dropped.** Shape recall is exactly what the upfront-auditing prior spoils; the
  quantitative question can't be answered by remembering a curve.

---

## The section

**[MARKDOWN ADD — label: "Opportunities are not equal"]**

> The fixed-odds picture treated every attempt as interchangeable. The red team's own
> policy already told you they are not: it injects a backdoor only "when there is a good
> opportunity to do so." Problems differ in how cleanly a backdoor fits. A geometry
> problem with fiddly corner cases offers natural cover for an off-by-one; a one-line
> string echo offers none.
>
> So the red team's real lever is not "how many attempts" but a **quality cutoff**:
> attack only when the opportunity is at least this good. A high cutoff means it attacks
> rarely, on the best-covered problems; a low cutoff means it attacks often, dipping into
> worse ones. Here is the hinge: the marginal opportunity — the worst one it is currently
> willing to take — is always less covered than the ones above it. So attacking more
> often does not just add attempts at the same odds; it adds attempts with *worse* odds,
> on backdoors the monitor is more likely to flag.

**[MARKDOWN ADD — model disclosure, first use of the calibrated model]**

> The attack-rate demo below is the first that reaches past the contingency table. It
> runs a small calibrated model of this setup — the same $N = 5{,}000$ problems, the same
> $U$ and $T$ correctness rates, the same 2% audit budget — tuned so its headline numbers
> reproduce the paper's within a few points. It is an idealization, not a re-run of the
> experiment; but it is honest, and if you push a lever to a pathological value the plot
> shows the pathological truth.

**[MARKDOWN ADD — continuation]**

> That changes the arithmetic of the previous section. Predict how.

**[EXERCISE — multiple-choice `c-paper-l3-hump-predict`]**

> **Prompt:** Lowering the quality cutoff lets the red team attack more often, on problems
> with less cover. In $P(\text{red wins}) = \text{Term A} \cdot \text{Term B}$, which
> factor moves against the red team?
>
> **Options:**
> - Term B — more attempts make a decisive event less likely
> - Neither — only the attempt count k rises
> - Both factors fall
> - Term A — the race odds fall ✓
>
> **Explanation:** Term B — the chance any decisive event fires — still rises with more
> attempts; that part is unchanged. What changes is Term A. Each marginal attempt is on a
> worse-covered problem, so its catch probability c is higher, and a higher c pulls the
> race odds w/(w+c) down. The red team is now climbing toward a ceiling that sinks as it
> climbs. Whether the rising Term B or the sinking Term A wins out is exactly what the
> demo shows.

**[DEMO — `attack-rate`]**

**[MARKDOWN ADD — reveal]**

> The curve is hump-shaped, and the two factors explain the two ends. At the left,
> attempts are so rare that the deployment usually ends before a successful one fires —
> Term B is tiny. At the right, attempts are frequent but forced onto poorly-covered
> problems, so the catch rate climbs and the race odds — Term A — collapse. In between
> sits an interior optimum at a low but non-zero attack rate: roughly where the paper's
> red team operates, on a fraction of a percent of problems.
>
> This is the answer to a question the paper raises but does not dwell on: why does the
> red team attack so rarely? Not out of caution. Rarity is opportunity selection under
> the shadow of the catch rule. One caught attempt ends everything, so each attempt has
> to be worth the risk — and only the best-covered problems are.
>
> Notice what this does and does not share with upfront auditing. There, too, attacking
> more eventually hurt — but for a different reason: the audited prefix was a positional
> death zone. Here there is no prefix and no window; the monitor treats every problem
> alike. The interior optimum comes back only because the red team's own selectivity
> makes its attempts differ from one another. Same shape, different mechanism — with
> genuinely identical attempts there is no hump at all, and more is strictly better.

**[EXERCISE — understanding-check `c-paper-l3-hump-reflect`]**

> **Prompt:** The paper's red team attacks on only a small fraction of problems. Explain
> why this rarity is a deliberate optimization rather than caution — and why the same
> "attack rarely" conclusion arises under both upfront auditing and trusted monitoring
> even though the two protocols work completely differently.
>
> **Sample answer:** Attacking more often forces the red team onto worse-covered
> problems, where the catch probability is higher; that drags the race odds w/(w+c) down
> faster than the extra attempts raise the chance of firing, so past a low rate the win
> probability falls. The optimum is therefore interior, at a low but non-zero rate — a
> calculation, not timidity. The common thread with upfront auditing is heterogeneity in
> the per-attempt odds: attempts are not interchangeable. Under upfront auditing the
> heterogeneity is positional (an attempt in the audited prefix is doomed, one after it
> is free); under trusted monitoring it is opportunity quality (well- vs poorly-covered
> problems), and it is created by the red team's own cutoff rather than by the protocol.
> With genuinely identical attempts — the fixed-odds idealization — there is no hump
> under trusted monitoring at all. Rarity is always a symptom of attempts differing from
> one another, never of caution.

**[MARKDOWN ADD — forward pointer (adjacency-dependent; see flags)]**

> Opportunity quality is one of the red team's two levers. The other is how *subtle* to
> make each backdoor — and the paper already hinted at its cost when it noted that
> sneakier backdoors fail their own test cases more than half the time.

---

## Implementation flags (not learner-facing)

1. **Model disclosure placement.** This is the note that used to open the c-game lesson
   ("every number comes from a small calibrated model…"). It has to appear at the first
   model-driven demo; if the race demo is switched to paper-odds (race cluster flag 1),
   this really is the first, so the note belongs here. If any earlier relocated cluster
   ends up using the model, move it earlier instead.
2. **Attack-rate demo.** Unchanged from current `attack-rate` — it already drives off the
   calibrated model. No paper-odds variant needed (opportunity quality isn't in the
   table). Confirm the demo's own default readout ("attack rate ≈ X%, safety ≈ Y%") is
   consistent with the "fraction of a percent" language in the reveal.
3. **Subtlety forward pointer.** The last markdown add assumes subtlety is the next thing
   the reader hits. If subtlety docks later (after b-0140 in §3.2.1, per the redistribution
   map), either move this pointer to sit just before subtlety or soften it to "You'll meet
   the second lever, subtlety, shortly."
4. **Ids / cleanup.** `c-paper-l3-hump-*`. The c-game "Opportunities are not equal"
   section gets hidden in an MDX comment (M7 pattern) once this lands. `c-game-l5-hump-predict`
   (shape question) is retired, not ported.

## Open questions (opportunities cluster)

- Keep `mechanism-A` anywhere? One option: use it as the race cluster's predict-MC
  instead of the "how often should it attack" question, and let quantitative-Q1 open
  opportunities. That would move the audited-window trap one step later and un-front-run
  it. Worth weighing when both clusters are drafted side by side.
- The reveal leans on "a fraction of a percent"; if you want the exact 0.4% here, confirm
  it matches the demo's rendered default so prose and widget agree.
