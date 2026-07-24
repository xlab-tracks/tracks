# Proposal — "Safety over a deployment: the race", relocated into the AI Control walkthrough

Status: **IMPLEMENTED 2026-07-21** as the subsection "Probability of Safety over
Deployment" inside §3.2 Trusted Monitoring (papers.data.ts, 17 ops at anchor b-0131,
marked in backend comments as XLab-authored, not Redwood's text; exercises
`c-paper-l3-race-*`/`-hump-*`; new `race-paper` demo; c-game copies hidden). This file
remains the content source of truth for the writing pass; grammar/spelling defects were
fixed 2026-07-21 in both the sources and this file.
Companion to the redistribution effort; successor in style to
[c-game-race-redesign.md](./c-game-race-redesign.md).

## How to edit this file

- Prose inside the blockquotes is the **verbatim learner-facing text** — edit freely.
- Lines in `**[BRACKETS]**` are structural markers (which content block, what type,
  splice position) — describe placement, not shown to the learner. Leave them unless
  you're changing structure.
- The "Implementation flags" and "Assumptions" sections are notes to the implementer,
  not content.

## Model spine (governs every cluster: race → opportunities → subtlety → best response → defer)

One formula runs the whole arc, and its form never changes:

$$P(\text{red wins}) = \underbrace{\frac{s}{s+c}}_{\text{Term A}} \cdot \underbrace{1-(1-s-c)^k}_{\text{Term B}}$$

Term A is always referred to by its description — "the probability that a decisive
attack attempt is successfully deployed," $P(\text{deployed} \mid \text{decisive})$ —
or simply as Term A; its $k \to \infty$ role keeps the name "the ceiling." The informal
"race odds" label is retired everywhere learner-facing, and no coined shorthand replaces
it. Use "attack attempt" (not bare "attempt") when spelling out the description.

The symbols $s$ (successfully deployed) and $c$ (caught) persist throughout. Exactly
**one reinterpretation** happens, once, in the opportunities cluster: from there on, $s$
and $c$ mean the **average** odds over the attempts the red team actually makes. This is
exact, not an approximation — each problem's opportunity is an i.i.d. draw and the red
team decides by threshold, so each attempt's odds are an i.i.d. draw from the pool above
the cutoff and the first-decisive-attempt derivation goes through with the averages
verbatim. No new notation downstream: later clusters only say *who moves the averages*.

| Cluster | What $s, c$ are | Lever | Effect |
|---|---|---|---|
| Race | constants from the table ($13/71$, $24/71$) | none (given) | only $k$ moves → monotone; ceiling ≈ 35% |
| Opportunities | pool averages; per-attempt odds depend on cover $g$, attack iff $g > g^*$ | red 1: cutoff $g^*$ | $g^*{\downarrow}$ → $k{\uparrow}$ (B↑) but $c{\uparrow}, s{\downarrow}$ (A↓) → hump |
| Subtlety | odds also depend on $\sigma$: subtler → $c{\downarrow}$ but $s{\downarrow}$ (backdoors break — the paper's 52%-fail figure). Reliability is smooth power decay $0.75(1-\sigma)^{1.3}$ (2026-07-22 fix: old piecewise floor produced a fake valley + rebound) | red 2: $\sigma$, one choice for all attempts | single interior optimum $\sigma^* \approx 0.27$; monotone decline after; $P(\sigma{=}1)=0$ |
| Best response | same functions; red picks $(g^*, \sigma)$ jointly | blue's $(b, d, q)$ shape the functions | safety $= 1 - \max$ Term A · Term B (the heatmap) |
| Defer | fourth per-attempt outcome (deferred = neutralized, game continues); $s{\downarrow}$ with $c$ untouched | blue: $d$ | formula form unchanged — defer drains Term A's numerator without spending audits |

Blend rules that follow:

- The averaging contract is installed once (opportunities cluster, just before its MC);
  everything later inherits it silently.
- The two red levers differ in kind, and prose must keep it straight: $g^*$ selects
  *which* attempts happen (pool composition, per-problem draws); $\sigma$ shifts the odds
  of *every* attempt (one policy choice).
- The race cluster's three-outcome taxonomy stays true for §3.2; the defer cluster
  explicitly grows it by one row and notes the formula survives.
- Best response's old "predict ≈62%" MC is dead — the race cluster reconstructs 62% up
  front. Re-aim its predict at *response* (which way does the ring move when a blue lever
  moves). The direction of explanation reverses: race showed the table's strategy ⇒ the
  number; best response shows the strategy *is* the argmax — the contingency table is an
  equilibrium artifact.
- Demos keep Term A / Term B labels throughout; the attack-rate demo should show the
  average odds and the sinking ceiling live.
- **Defer-cluster drafting constraint (post pSucc fix, 2026-07-22):** widening the defer
  band pushes the best-response subtlety up but it SATURATES interior (d 2%→20% moves
  σ* 0.28→0.54, attack rate ~flat, nowhere near σ=1). Say "subtler, but still interior" —
  the old c-game claim "pushes toward maximally subtle attacks" is false under the fixed
  model, and `c-game-l7-defer-reflect`'s sample answer still contains it (fix when that
  cluster is drafted).

## Assumptions (flag if wrong)

1. Splices in as a first-class **numbered subsection "3.2.1 Probability of Safety over
   Deployment"** (new `op: "section"` + `plain: true` adds — native paper body, no note
   boxes; Redwood's later §3.2 subsections display-shift to 3.2.2/3.2.3 at render time,
   ids/text verbatim), anchored **after the "Safety: The blue team win probability is
   62%" block**. Appears in the "In this paper" nav. Backend comments mark the whole
   cluster as XLab-authored. Mechanism documented in AUTHORING.md — reuse it for the
   subtlety / best-response / defer clusters.
2. The "opportunities are not equal" cluster follows this one contiguously, so the
   closing bridge points "just below" rather than at a paper section.
3. Every number here comes from the paper's own contingency table, so the
   calibrated-model disclosure note is **not** needed in this cluster — it moves to the
   opportunities cluster (first place the model is actually used).

## Design note

Skeleton: rules → hinge → formula → terms check → assumption note → **Stage 1** predict
(MC, "how often to attack per the model?") → demo → reconstruction reveal → **Stage 2**
(is the model's optimal strategy what the paper's red team did? cite evidence) → **Stage
3** (name the assumption behind the discrepancy). Stages 2–3 make the reader *derive* the
bridge into "opportunities are not equal" rather than read it; the old reveal bridge
paragraph is gone. Two deliberate departures from the c-game version:

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

> The paper reports that Trusted Monitoring achieves a blue team win probability of 62%. A protocol's safety is calculated as the blue team win probability against the red team's best strategy (the strategy that maximizes the probability of a red team win), but what actually is the best strategy for the red team in this protocol?

[Opening rewritten by Arya 2026-07-23 to avoid misleading: the old "how is this actually
computed?" implied the section recomputes the paper's 62%, but the paper's number is an
empirical simulation over executed red-team runs (importance sampling + 1/12 backdoor
downsampling), while this section reconstructs it from the contingency table through a
model. The new frame poses the section's real question: what is red's best strategy.
Grammar fixes applied: "the strategy the maximize" → "that maximizes"; final period →
question mark. Shipped to c-game.mdx + papers.data.ts same day.]

> Each of the red team's attack attempts can end in exactly one of three ways:
>
> - **Caught**: An attack (working or broken) is audited and *caught* by the blue team: Blue Team Wins. In the paper's setup, 24 of 71 attacks were audited (6 working, 18 broken).
> - **Successfully Deployed**: A working attack isn't audited and is *successfully deployed*: Red Team Wins. In the paper's setup, 13 of 71 attacks were working attacks that weren't audited.
> - **Failed**: A broken attack isn't audited: Neither Team Wins. In the paper's setup, 34 of 71 attacks were broken attacks that weren't audited.
>
> So a single attempt is **caught** with probability $c = 24/71 \approx 0.34$ and
> **successfully deployed** with probability $s = 13/71 \approx 0.18$; the rest of the
> time it **fails** harmlessly. An attempt is **decisive** when it is caught or
> successfully deployed — the two outcomes that end the game.

**[EXERCISE — understanding-check `c-paper-l3-race-hinge`]**

> **Prompt:** Why is the whole deployment settled by the first decisive attempt? And why do the failed attempts before it have no effect at all on the
> outcome?
>
> **Sample answer:** A caught attack and a successfully deployed one each end the game
> immediately, so nothing after the first decisive attempt is ever played. A failed
> attempt leaves the game in exactly the state it was in before, and thus nothing
> accumulates.

**[MARKDOWN ADD — continuation]**

> Let the red team make $k$ attack attempts, $s = P(\text{successful deployment})$ be the probability of a successful deployment, and $c = P(\text{caught})$ be the probability of an attack being caught. Then we can model the Red Team's probability of winning at least once as:
>
> $$
> P(\text{red wins}) = \underbrace{\frac{s}{s + c}}_{\text{Term A}} \cdot \underbrace{\left(1 - (1 - s - c)^k\right)}_{\text{Term B}}
> $$

**[EXERCISE — understanding-check `c-paper-l3-race-terms`]**

> **Prompt:** Before reading on, interpret the formula's two terms in your own words:
> what event is Term B, $1 - (1-s-c)^k$, the probability of? And Term A, $s/(s+c)$, is a
> conditional probability of what, given what?
>
> **Sample answer:** $(1-s-c)$ is the probability that an attack attempt fails or, equally, the probability that an attack attempt *isn't* decisive. Then $(1-s-c)^k$ is the probability that all $k$ attacks aren't decisive. Thus Term B is the probability that not all attempts are indecisive or, equally, the probability that at least one attempt is decisive. Term A is the conditional probability that an attack attempt ends with a successfully deployed attack, given that the attack attempt is decisive — $P(\text{deployed} \mid \text{decisive})$.

**[MARKDOWN ADD — continuation]**

> An important property of this model worth considering is that it assumes every attack has the same probability $c$ of being caught and the same
> probability $s$ of being successfully deployed: per-attempt odds are fixed, no matter how many attacks the red team makes or which problems it picks.

**[EXERCISE — multiple-choice `c-paper-l3-race-predict`] — Stage 1**

> **Prompt:** To maximize their probability of winning at least once over the deployment, how often should the red team attack given the above model?
>
> **Options:**
> - Once, at the single best moment
> - At an interior optimal rate, as under upfront auditing
> - As often as possible ✓
> - It makes no difference how often it attacks
>
> **Explanation:** With identical per-attempt odds, the win probability [s/(s+c)] × [1 −
> (1−s−c)^k] only rises with k: each extra attempt raises the chance that some decisive
> event fires without changing the odds of any single one.



**[DEMO — `race`, paper-odds variant]**

**[MARKDOWN ADD — reveal: reconstruction payoff]**

> With fixed odds the curve only climbs. Now finish the reconstruction: feed in the
> deployment the paper actually ran. Its red team submits a backdoor on about twenty of
> the 5,000 problems — and twenty attempts is already deep in the plateau, where Term B
> has all but saturated. So $P(\text{red wins})$ sits near its ceiling — the probability of a decisive attack attempt being successfully deployed,
> $s/(s+c) \approx 35\%$. That is a safety of roughly 65%: the paper's headline number,
> rebuilt from the contingency table and a single line of algebra. (The few points
> between 65% and the measured 62% are the paper's sampling correction and its
> shutdown-on-statistics rule — real, but not where the mechanism lives.)
>
> The number checks out. But the model implies more than a number — it implies a
> *strategy*. Put that prediction to the test.

**[EXERCISE — understanding-check `c-paper-l3-race-empirical`] — Stage 2**

> **Prompt:** Is the optimal strategy predicted by the model reflected in how the paper's red team actually behaved? Point to specific evidence in the
> paper's setup.
>
> **Sample answer:** No. The model says every extra attack only helps, so the red team
> should backdoor almost every problem. But the paper's red team attacked on just 71 of
> 1,500 problems — under 5% — and its policy was deliberate: it inserts a backdoor "only
> when there is a good opportunity to do so." The real red team held back hard, exactly
> where the fixed-odds model says it never should.

**[EXERCISE — understanding-check `c-paper-l3-race-discrepancy`] — Stage 3**

> **Prompt:** What about this model causes the discrepancy: why does the model predict constant
> attacking when the paper's red team attacks rarely?
>
> **Sample answer:** The assumption that every attack carries the same odds — the same
> catch probability $c$ and deployment probability $s$ — no matter how many attacks are
> made or which problems they target. Under fixed odds an extra attack is always as good
> as the first, so more is always better. But the attacks are not interchangeable: the
> red team can only attack more often by taking on problems where a backdoor has less
> natural cover, and those are easier for the monitor to catch. Once attacking more raises
> the catch probability, the odds are no longer fixed — and constant attacking stops being
> optimal.

---

## Implementation flags (not learner-facing)

1. **Demo variant.** The `race` demo takes literal odds c = 0.338, s = 0.183 instead of
   deriving them from the calibrated model — rename the demo's asymptote label from
   "race odds — ceiling" to "Term A — ceiling" (the "race odds" name is retired); the formula panel, ceiling asymptote, and
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
5. **Staged bridge spans the demo.** The three "stages" are not one contiguous widget:
   Stage 1 is the predict-MC (must precede the demo), then the demo + reconstruction
   reveal, then Stages 2–3 (two understanding-checks). Implement Stages 2–3 as a labeled
   sequence (e.g. "Model vs. reality") so they read as a unit. If you'd rather have all
   three back-to-back, the demo would have to move before Stage 1 (spoiling the predict)
   or after Stage 3 (anticlimactic) — the split is deliberate.

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

1. Splices in **immediately after the race cluster** — whose Stage 3 understanding-check
   already had the reader identify the fixed-odds assumption as the cause of the
   model-vs-empirics discrepancy, so this cluster opens by *confirming* that answer and
   mechanizing it, not by re-revealing it.
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
- **The hump MC is asked under the averaging contract.** Without it the question is
  malformed — once opportunities differ there is no single $s$ and $c$; each attempt has
  its own odds, and lowering the cutoff changes the *pool*, not any existing attempt
  (Arya's catch). The contract block precedes the MC and redefines $s, c$ as pool
  averages — the one-time notational investment the subtlety, best-response, and defer
  clusters all inherit (see Model spine). The lever paragraph's old conclusion sentence
  ("attacking more adds attempts with worse odds…") moved into the MC explanation so the
  prediction isn't answered one line before it's asked.

---

## The section

**[MARKDOWN ADD — label: "Opportunities are not equal"]**

> Attacking more only improves the red team's win probability if every attack is as good as the last, and the paper's red team knew that this wasn't the case. That is exactly why they attacked only "when there seems to be a good opportunity." For example, a problem with complex corner cases offers more "cover" and is thus a better opportunity for a backdoor than a one-line string echo, which offers almost no cover.
>
> Thus a better decision variable than attack frequency for controlling how many attack attempts the red team makes is a **quality cutoff**: the minimum opportunity level at which it is willing to attack. A high cutoff means attacking rarely, only when the opportunity is excellent (a low probability of getting caught). Conversely, decreasing the quality cutoff increases the attack rate at the cost of adding attack attempts with *worse* odds.

**[MARKDOWN ADD — the averaging contract]**

> With unequal opportunities there is no longer a single $s$ and $c$, as every attempt has its own odds set by properties of the problem itself. Write $g$ for how good an opportunity a problem offers, $s(g)$ and $c(g)$ for the odds of an attempt made on it, and $g^*$ for the red team's quality cutoff. Then $s$ and $c$ become the **average** odds across the attempts the red team actually makes:
>
> $$
> s = \mathbb{E}\!\left[\,s(g) \mid g > g^*\,\right] \qquad c = \mathbb{E}\!\left[\,c(g) \mid g > g^*\,\right]
> $$
>
> (Why the two-term formula survives with these: each problem's opportunity is an independent
> draw, and the red team decides by threshold. So each attempt's odds are an independent
> draw from the pool above the cutoff, and the first-decisive-attempt argument goes
> through with the averages, exactly.) From here on, read every $s$ and $c$ as average odds.

**[MARKDOWN ADD — continuation]**

> Now the arithmetic of the previous section changes. Predict how.

**[EXERCISE — multiple-choice with written understanding check in the same question `c-paper-l3-hump-predict`]** [Note: Claude fix this]

> **Prompt:** Suppose the red team lowers its quality cutoff, attacking more often. With
> $s$ and $c$ read as the average odds of its attempts, what happens to the two terms of
> $P(\text{red wins}) = \underbrace{s/(s+c)}_{\text{Term A}} \cdot \underbrace{1 - (1-s-c)^k}_{\text{Term B}}$ and why?
>
> **Options:**
> - Both terms rise
> - Term B rises; Term A stays fixed
> - Term B rises; Term A falls ✓
> - Both terms fall
>
> **Explanation:** The attempts a lower cutoff unlocks are, by construction, exactly the
> ones the old cutoff rejected — less cover, easier to catch. The attempts already above
> the bar are untouched; what changes is the *mix*. Mixing worse attempts into the pool
> moves the averages — $c$ up, $s$ down — so Term A, the probability that a decisive attack attempt is successfully deployed, falls. Term B still
> rises: more attempts always make it more likely that *something* decisive fires, and
> that half of the fixed-odds picture survives intact. The red team is now climbing
> toward a ceiling that sinks as it climbs. Which effect wins, the rising Term B or the
> sinking Term A, is exactly what the demo below shows.

**[MARKDOWN ADD — model disclosure, first use of the calibrated model]**

> The attack-rate demo below is the first that reaches past the contingency table. It
> runs a small calibrated model of this setup — the same $N = 5{,}000$ problems, the same
> $U$ and $T$ correctness rates, the same 2% audit budget — tuned so its headline numbers
> reproduce the paper's within a few points. It is an idealization, not a re-run of the
> experiment, but it is honest, and if you push a lever to a pathological value the plot
> shows the pathological truth.

**[DEMO — `attack-rate`]**

**[MARKDOWN ADD — reveal]**

> The curve is hump-shaped, and the two terms explain the two ends. At the left,
> attempts are so rare that the deployment usually ends before a successful one fires —
> Term B is tiny. At the right, attempts are frequent but increasingly drawn from
> poorly-covered problems, so the average catch rate climbs and Term A — the probability
> that a decisive attack attempt is successfully deployed — collapses. In between sits an interior optimum at a low but non-zero attack rate:
> roughly where the paper's red team operates, on a fraction of a percent of problems.
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
> problems, where the catch probability is higher; that drags $s/(s+c)$ — the probability that a decisive attack attempt is successfully deployed — down
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
> make each backdoor and the following text from the paper highlights why this is relevant.

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
