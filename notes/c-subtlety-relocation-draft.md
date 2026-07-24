# Proposal — "Subtlety: visible versus reliable", relocated into the AI Control walkthrough

Status: **c-game SURFACE IN SYNC with this draft (2026-07-23, second re-embed).** Final
structure, live: one-sentence opener → two-stage Predict sequence (MC + free-response, no
sample answer) → Arya's short demo lead-in → demo → directly into the next section (NO
reveal; the old four-paragraph reveal is deleted). Demo chart title and registry
description also applied. One grammar fix at re-embed: stray "_" after
$p_{\text{works}}(\sigma)$ in the lead-in removed. 2026-07-23 addendum: the c-game
`## Subtlety: visible versus reliable` heading was REMOVED per Arya, so this content now
flows directly after the attack-rate demo inside the previous section. The WALKTHROUGH splice at
`b-0140` remains pending Arya's structural calls below (plain adds vs subsection; ordering
vs the recall card) — when it lands it references the same shared exercise id. Originally: third cluster in the
c-game → AI Control relocation, after the
race cluster (IMPLEMENTED 2026-07-21 as displayed §3.2.1 "Probability of Safety over
Deployment") and the opportunities cluster (drafted in
[c-race-relocation-draft.md](./c-race-relocation-draft.md), Cluster 2). This file is the
content source of truth for the writing pass; a later agent implements it verbatim.
Companion / successor in style to [c-race-relocation-draft.md](./c-race-relocation-draft.md),
whose **Model spine** governs this file (see below).

## How to edit this file

- Prose inside the blockquotes is the **verbatim learner-facing text** — edit freely.
- Lines in `**[BRACKETS]**` are structural markers (which content block, what type,
  splice position) — describe placement, not shown to the learner. Leave them unless
  you're changing structure.
- The "Implementation flags", "Assumptions", and "Open questions" sections are notes to
  the implementer, not content.
- **Round-trip (2026-07-22):** the section's blockquotes are LIVE in c-game.mdx (the MC in
  exercises.data.ts). Edit freely; a session re-embeds your edits into those files, and
  into the walkthrough splice at `b-0140` when that lands.

## Model spine (inherited — do not restate, do not contradict)

The governing spine lives in [c-race-relocation-draft.md](./c-race-relocation-draft.md)
("Model spine"). This cluster inherits it wholesale. The rows that bind subtlety:

- **Vocabulary.** Outcomes are Caught / Successfully Deployed / Failed. "decisive" = caught
  or successfully deployed. Term A / Term B. Term A is named only by its description, "the
  probability that a decisive attack attempt is successfully deployed,"
  $P(\text{deployed} \mid \text{decisive})$, or "the ceiling." Say "attack attempt," never
  bare "attempt," when spelling a description out. **"race odds" is retired — it must not
  appear**, and no coined shorthand replaces it.
- **The averaging contract is already installed** (opportunities cluster): $s$ and $c$ are
  the pool-**average** odds over the attempts the red team actually makes. Subtlety inherits
  this silently — no new notation, no re-derivation.
- **Subtlety's job (realigned to the levers decomposition, 2026-07-23).** $\sigma$ is the
  red team's **other decision factor**, obfuscation effort: the second route to subtlety,
  already NAMED and notated upstream by 3.2.1's two-routes text and unified model add
  ($s(g,\sigma)$, $c(g,\sigma)$). This cluster's job is to QUANTIFY it, not introduce it.
  It moves **both averages down** — $c$ down (subtler backdoors are harder to flag) and $s$
  down (subtler backdoors break; the paper's 52%-fail / 32%-no-exploit figures sit in the
  passage immediately above the walkthrough splice point, and on the c-game surface survive
  in the MC explanation). Same interior-optimum tension the opportunity cutoff produced,
  entered through a different door. **Language: "second lever" is retired for the red team —
  say "decision factor" (or "route to subtlety"); "lever" stays for the blue team.**
- **The two decision factors differ in kind** (prose must keep this straight): the
  opportunity cutoff $g^*$ selects *which* attack attempts happen (pool composition,
  per-problem draws); $\sigma$ shifts the odds of *every* attack attempt (one policy
  choice). Note 3.2.1's unified model add now states this too — this cluster may repeat it
  only lightly.
- **Model truth (post pSucc fix, 2026-07-22 — do not contradict).** Reliability is the
  smooth power decay $p_{\text{succ}}(\sigma) = 0.75\,(1-\sigma)^{1.3}$. The
  best-achievable-win-probability curve (max over attack rate at each $\sigma$) has a
  **single interior maximum at $\sigma^* \approx 0.27$, $P \approx 35\%$**, then declines
  **monotonically** to **$P(\sigma{=}1) = 0$ exactly**. **No valley, no rebound** — the old
  piecewise-linear reliability floor that produced a fake valley-then-rebound is gone.
- **Style.** No em dashes in newly drafted prose. Display math in `$$` fences on their own
  lines; inline math in `$…$`. Predict-before-reveal: the MC must not be answered by the
  sentence before it.

**Verified against the live model (tsx sweep replicating the `subtlety` demo's own
`bestAtSigma` envelope, `DEFAULT_LEVERS` with `b = d = 0.02`; re-verified 2026-07-22 after
the channel-curve demo update):**

| $\sigma$ | best $P(\text{red wins})$ | avg caught $\bar c$ | backdoor works $p_{\text{works}}$ | avg deployed $\bar s$ | deployed but broken |
|---|---|---|---|---|---|
| 0.00 (blatant) | 33.4% | 60% | 75% | 30% | 10% |
| 0.18 (demo default) | 34.8% | 52% | 58% | 28% | 20% |
| **0.26 (peak $\sigma^*$)** | **35.0%** | **48%** | **51%** | **26%** | **26%** |
| 0.50 | 33.2% | 38% | 31% | 19% | 43% |
| 0.75 | 24.1% | 28% | 12% | 9% | 63% |
| 0.90 | 11.3% | 23% | 4% | 3% | 74% |
| 1.00 (maximally subtle) | 0.0% | 20% | 0% | 0% | 80% |

At every $\sigma$ the three outcome columns sum to exactly 100% (caught + successfully
deployed + deployed-but-broken; at $b = d = 2\%$ the defer band has zero width, so these
three fates partition every attack attempt). "Deployed but broken" is
$\overline{\text{ship}} \times (1 - p_{\text{works}})$, rising monotonically 10% → 80%.

Peak at $\sigma^* \approx 0.261$ (rounds to 0.27), $P \approx 34.99\%$; monotone decline
after; exactly zero at $\sigma = 1$. **Term B stays ≥ 98.9% across the whole envelope**, so
subtlety's entire effect flows through Term A = $\bar s/(\bar s + \bar c)$, and at these
levers $\bar s = (1-\bar c)\, p_{\text{works}}$ holds exactly (at $b = d = 2\%$ the defer
band has zero width). The $\sigma = 1$ row shows the limiting best response (argmax just
below 1; at exactly 1 every cutoff gives $P = 0$), matching what the demo displays. Every
drafted claim below is consistent with this and with the demo's readouts.

---

## Assumptions (flag if wrong)

1. **Splice anchor: `b-0140`** — the paper's reason-2 paragraph, "Secondly, trusted
   monitoring forces the attacker to use much sneakier backdoors…", which carries the exact
   52%-fail / 32%-no-exploit numbers. This paragraph lives in Redwood's **§3.2.2 Qualitative
   Analysis** *as displayed* (id `ax-sec-qualitative-analysis`; it was §3.2.1 before the race
   cluster's `op:"section"` shifted every later §3.2 sibling up by one). `b-0140` is the last
   block of that subsection, so anything spliced after it hoists to the end of Qualitative
   Analysis, just before Redwood's "Extending Trusted Monitoring…" subsection (displayed
   §3.2.3). Reason 2 **is** the subtlety tradeoff, so this cluster opens by naming what the
   paragraph the reader just finished only gestured at.
2. **Ordering vs. the existing `c-paper-l3-recall-budget-burn` at the same anchor.** A
   `tap-reveal` recall card is already anchored after `b-0140` (papers.data.ts, "recall card
   on budget burn"). Edits at one anchor render in edits-array order. Recommended order:
   **subtlety cluster first (it directly elaborates reason 2), recall card after** — the
   budget-burn card is about the shutdown-on-statistics rule (loosely tied to reason 1), so
   it shouldn't interrupt the reason-2 → subtlety flow. Reversible: if you'd rather keep the
   quick-recall glued to the two-reasons paragraph, place the subtlety ops after it instead.
   Flagged for your call.
3. **Structural form is undecided** — its own numbered subsection (`op:"section"`) vs. plain
   in-section adds (`plain:true`) inside 3.2.2. Laid out in Open questions; recommendation
   there. The learner-facing prose below is identical either way; only the first marker and
   the nav/renumber consequences change.
4. **The averaging contract is live upstream — WITH $\sigma$ already inside (updated
   2026-07-23).** 3.2.1's unified model add installs $s(g,\sigma)$ and $c(g,\sigma)$ as
   pool averages and introduces $\sigma$ by name, so this cluster re-introduces nothing:
   the opener is one sentence and the two-averages add can lean on "in the language of the
   previous section" safely on both surfaces.
5. **Model-disclosure note — GONE EVERYWHERE (updated 2026-07-23).** The old assumption
   (disclosure lives in the opportunities cluster) is dead: Arya's decomposition writing
   pass replaced the calibrated-model disclosure paragraph with a one-line demo lead-in, so
   the "small calibrated model, idealization, not a re-run" note no longer exists on either
   surface (flagged in c-levers-decomposition-draft.md). If a disclosure is wanted at all,
   it must be re-added deliberately; this cluster's demo is a second consumer of the same
   model and would inherit whatever is decided.

## Design note

Skeleton (post-decomposition, 2026-07-23): **one-line pickup of the second route (named in
3.2.1) → the two averages both fall, the differ-in-kind contrast → predict (MC) → demo →
reveal (Term B pinned, the channel decomposition, why the peak sits where it does) →
forward pointer to the joint best response.** One MC, one demo, one reveal.

Two things the new structure changes vs. the original relocation plan:

- **The decision factor is introduced *upstream*, not here.** 3.2.1's two-routes text names
  obfuscation effort and its reliability cost, and its unified model add installs
  $s(g,\sigma)$/$c(g,\sigma)$. This cluster opens with a one-sentence pickup and goes
  straight to quantifying. In the walkthrough the reason-2 passage directly above still
  supplies the measured cost (52% fail tests, 32% no exploit); on the c-game surface those
  figures now appear only in the MC explanation.
- **The reveal is model-truth-corrected.** The pre-fix c-game reveal never claimed a rebound
  (it already said "drops all the way to zero"), so the adaptation is faithful, but the
  language is tightened to state the monotone-to-zero decline explicitly and to avoid any
  "valley"/"rebound" phrasing that the retired piecewise model could have suggested.

---

## The section

**[MARKDOWN ADD — opening (Arya's rewrite; LIVE in c-game). Picks up the second route named
in 3.2.1. Consequence: the paper's 52%/32% figures survive only in the walkthrough's
reason-2 passage above the splice; on the c-game surface they appear nowhere in this
section.]**

> As aforementioned, the red team's other decision factor is obfuscation effort. Every
> attack opportunity affords some inherent subtlety, and efforts to make an attack more
> subtle will come at the cost of the attack's deployment success probability.

**[EXERCISE — TWO-STAGE sequence `c-paper-l3-subtlety-predict` (per Arya 2026-07-23:
"multiple-choice, free response multiple-stage"). Stage 1 is the existing MC id with the
realigned language and a TRUNCATED explanation (Arya cut it to the two-effects sentence;
the reveal below carries the analysis). Stage 2 is a NEW free-response id (proposed:
`c-paper-l3-sigma-terms-predict`), the σ mirror of cutoff-predict, with NO sample answer
per Arya: the demo and the reveal below are its analysis (supported since sampleAnswer
went optional). At re-embed this renders as one gated card via `<ExerciseSequence
ids={[MC, free-response]} label="Predict" />` in c-game.mdx and a `kind: "sequence"` item
in the walkthrough op, same machinery as the race empirical/discrepancy pair. LIVE in
c-game + exercises.data.ts since 2026-07-23. MC renderer typesets neither math nor
markdown, so the stage-1 prompt stays Unicode σ, no bold; stage 2 is an
understanding-check, so its LaTeX formula renders.]**

> **Stage 1 (multiple-choice) — Prompt:** The red team's other decision factor is
> obfuscation effort σ. A more obfuscated backdoor reads as more normal code, so the
> monitor catches it less often, but it is also more likely to be simply broken. As σ rises
> from blatant to maximally subtle, the red team's best achievable win probability (picking
> its best opportunity cutoff at each effort level):
>
> **Options:**
> - Rises monotonically; more obfuscation is always better
> - Falls monotonically; any obfuscation only hurts
> - Rises to an interior peak, then falls ✓
> - Is unaffected by obfuscation effort
>
> **Explanation:** Two effects oppose each other. Making a backdoor subtler lowers the
> monitor's catch rate (the benefit) but also lowers the chance the backdoor actually
> works (the cost).
>
> **Stage 2 (free response, no sample answer; the demo and its analysis below are the
> reveal) — Prompt:** Suppose the red team decreases its obfuscation effort. With
> $s$ and $c$ read as the average odds of its attempts, what happens to each term of
> $P(\text{red wins}) = \underbrace{\frac{s}{s + c}}_{\text{Term A}} \cdot \underbrace{\left(1 - (1 - s - c)^k\right)}_{\text{Term B}}$,
> and to the red team's overall win probability?

**[MARKDOWN ADD — demo lead-in (Arya 2026-07-23; LIVE in c-game, replacing the deleted
reveal; stray "_" after the math removed at re-embed)]**

> Raising σ does two things to every attack attempt: it lowers the catch probability $c$,
> and it lowers the reliability of the attack (the probability the attack isn't broken)
> $p_{\text{works}}(\sigma)$. The following demo plots the per-attack outcome probability
> and $P(\text{red wins})$ as a function of $\sigma$.

**[DEMO — `subtlety`. Chart title change APPLIED: "Per-attack outcome probability, and
P(red wins)".]**

> Caption (registry `subtlety`, learner-visible): title "Subtlety: visible vs reliable";
> description "The red team's second decision factor. Subtler backdoors are harder for the
> monitor to flag but more likely to be broken, so the win probability has an interior
> optimum in subtlety." (Description realigned 2026-07-23, "second lever" → "second decision
> factor" — PENDING re-embed into registry.ts. The demo renders the 2b stacked-band layout
> with a separate P panel; see flag 3. The reveal below reads off the bands.)

**[No reveal — per Arya the section ends at the demo and goes directly to the next section
(the best-response cluster). LIVE in c-game: the old four-paragraph reveal is deleted.]**

---

## Implementation flags (not learner-facing)

1. **Splice mechanics.** Every op targets `{ anchor: "b-0140", snippet: "Secondly, trusted
   monitoring forces the attacker" }`. If plain in-section (recommended, see Open questions):
   the two opening adds and the reveal add carry `plain: true` (native paper body, matching
   the race cluster); the MC and demo go in `op:"activity"` items. If own subsection: prepend
   an `op:"section"` with a title (candidate: **"The Subtlety Lever"** or **"Subtlety:
   Visible versus Reliable"**) and keep the same adds as `plain:true`. Mark the whole op range
   as XLab-authored in backend comments (not Redwood's text), exactly as the race cluster is
   marked.
2. **Exercise id (updated 2026-07-23).** `c-paper-l3-subtlety-predict` is LIVE in
   exercises.data.ts and already referenced by c-game.mdx; the old `c-game-l6-subtlety-predict`
   definition is orphaned (with l4/l5). The realigned wording in the section above (decision
   factor / obfuscation effort / opportunity cutoff) is PENDING re-embed into that
   definition.
3. **Demo layout: 2b, full width (final, 2026-07-22 — DONE, live in subtlety-demo.tsx; the
   side bar panel from the first cut was removed the same day per Arya, "arrangement quite
   bad space wise" — bars duplicated the readout numbers and left dead space).** Two
   full-width panels in one SVG (viewBox 440×302, container `max-w-lg`):
   - **Stacked-band panel** (0–100% axis): the three outcome fates as translucent stacked
     areas in 2b order — caught (navy `--chart-4`) on the bottom, **deployed but broken**
     (grey `--chart-2`, = shipBar × (1 − p_works)) in the middle, successfully deployed (red
     `--chart-1`, code name `wBar`) pressed against the 100% ceiling, so its thickness reads
     against a flat edge and its collapse is the red boundary line meeting the ceiling. Two
     solid boundary lines: navy at c̄, red at c̄ + broken. Bands sum to exactly 100% at every
     σ (defer band width zero at b = d = 2%): a complete partition of every attack attempt's
     fate. Direct in-band labels replace the legend (the old HTML legend row is gone).
   - **P(red wins) panel** below, sharing the σ axis, on its own tight axis (0–38%) so the
     shallow hump and the collapse both read; "optimum" dot marks the peak; the slider marker
     line runs through both σ panels with dots on the two band boundaries and on P.
   **Readout renders the equation in KaTeX (per Arya):** the decomposition row's labels are
   now $s/(s+c)$ × $1-(1-s-c)^k$ = $P(\text{red wins})$ (slash form, not \frac, per Arya)
   via the shared `MathText` component instead of the words "Term A"/"Term B", and the input
   tier labels carry the symbols ($c$, $p_{\text{works}}$, $s$). The × and = operators sit
   on the values' baseline (flex items-end, same text-base size as the numbers, both bumped
   up from text-sm) so they read as part of the number row, not floating between columns. Note: the value under the event term is computed
   in the exact i.i.d. form $1-(1-r(s+c))^N$; the label shows the taught k-form packaging
   (they agree to display precision in this regime, both ≈ 100%).
   The readout label "Working backdoor ships" was renamed **"Successfully deployed"** (spine
   vocabulary). Endpoint handling: at σ = 1 every cutoff gives P = 0 and the argmax is
   degenerate, so `bestAtSigma` selects the **limiting best response** (argmax at σ = 0.995)
   and evaluates it at the true σ — the bands and the Term B readout stay continuous at the
   right edge (c̄ ends at 19.7%, Term B 99.9%).
   **Model finding the reveal is built on:** along the best-attack-rate envelope **Term B
   stays ≥ 98.9% across the whole σ range** — the red team always keeps a decisive event
   near-certain, so subtlety's entire effect flows through **Term A = s̄/(s̄+c̄) alone**, with
   $\bar s = (1-\bar c)\,p_{\text{works}}$ holding exactly at b = d = 2% (the defer band has
   zero width there). This is UNLIKE the opportunity-cutoff decision factor, where Term B
   genuinely moves.

4. **Reveal prose correction — RESOLVED in this draft (2026-07-22).** The reveal blockquote
   now states the honest route (Term B pinned; subtlety works purely through Term A) and makes
   the channel decomposition explicit with the $s = (1-c)\,p_{\text{works}}$ display equation.
   No pending correction; the old false "each lever trades Term B against Term A" closing is
   gone.
5. **c-game copy — RESOLVED as sync (2026-07-22).** c-game.mdx's `## Subtlety: visible
   versus reliable` IS the live sync of this cluster (shared `c-paper-l3-subtlety-predict`
   id, `subtlety` demo); only the AUC block remains hidden in c-game. The remaining decision
   is solely the WALKTHROUGH splice at `b-0140` (structure + ordering, Open questions
   below); when it lands, both surfaces carry the same text per the round-trip contract.
6. **Numbers in prose are rough and pinned to the live model (phrasing updated with the
   pragmatic reveal, 2026-07-23).** The reveal avoids quoting $\sigma^* = 0.27$ but leans on
   three rough figures, all verified 2026-07-22: caught band "flattens near 20%" ($\bar c$
   at $\sigma = 1$ is 19.7%), "a couple of percentage points over attacking blatantly"
   (peak gain is 1.6pp: 33.4% → 35.0%), and Term B "essentially 100%" (grid minimum 98.9%).
   Also load-bearing: "near blatant, $c$ falls faster than $s$" (0 → 0.26: $\bar c$ falls
   11.6pp, $\bar s$ falls 3.9pp) and "vanishes at σ = 1" ($s$ exactly 0 there). If the
   calibration is re-tuned, re-verify these against the table above.

## Open questions (subtlety cluster)

- **Own numbered subsection vs. plain adds inside 3.2.2 — the structural decision.**
  - *Option A — `op:"section"` (new numbered subsection).* Splices a real heading after
    `b-0140`, so subtlety becomes displayed **§3.2.3** and Redwood's "Extending Trusted
    Monitoring…" shifts **3.2.3 → 3.2.4** (its second display-shift; the race cluster already
    moved it once). Gets its own "In this paper" nav entry, parallel to the race cluster's
    3.2.1. Reads as a first-class unit rather than a tail on Qualitative Analysis.
    *Cost:* a second compounding render-time renumber of every later §3.2 sibling, more
    display-drift bookkeeping, and a heading that physically separates the expansion from the
    reason-2 paragraph it elaborates.
  - *Option B — `plain:true` adds inside 3.2.2 (recommended).* No heading, no renumber;
    Redwood's "Extending Trusted Monitoring…" stays at its current 3.2.3. The subtlety content
    sits directly under the reason-2 passage it expands, reading as the natural continuation of
    Qualitative Analysis (which is exactly what a qualitative deep-dive on reason 2 is). The
    cluster is small (one MC, one demo, one reveal), so it does not need the landmark weight of
    its own number.
  - **Recommendation: Option B.** The subtlety cluster is an elaboration of a paragraph that
    already lives inside Qualitative Analysis, so keeping it in-section preserves the
    hook → payoff adjacency and avoids a second renumber. Take Option A only if you value
    strict parallelism with the race cluster and a dedicated nav landmark over the renumber
    cost. **Your call — left undecided in the draft.**
- **Ordering vs. `c-paper-l3-recall-budget-burn`** (Assumption 2): subtlety-first is
  recommended; confirm or flip.
- ~~Is "second lever" still the right framing~~ — RESOLVED 2026-07-23: "second lever" is
  retired by the levers decomposition; the red team has two **decision factors** (routes to
  subtlety), named together in 3.2.1, so ordering no longer strains the language.

---
---

# Cluster 2 — The best-response principle

Status: **superseded on the c-game surface (2026-07-23 minimal rewrite); walkthrough §3.3
docking still pending — this cluster remains its proposal.** c-game now carries a MINIMAL
best-response passage instead (no heading, per Arya, drafted in-chat): one sentence stating
the optimum ("attack rarely, only on the very best opportunities (about 0.2% of problems),
with moderate obfuscation effort") → best-response demo (defer slider REMOVED, d pinned to
b; ring now white for contrast) → new understanding-check
`c-paper-l3-best-response-upper-bound` (no exact priors ⇒ red does at most as well; the
ring is an upper bound for red, safety a conservative lower bound for blue).
`c-paper-l3-best-response-predict` and `-reflect` are now orphaned; restore them and the
defer slider if/when the ring-migration story lands (here or in §3.3). The earlier sync
had replaced c-game.mdx's old section (whose
predict asked the retired guess-62% question and whose reveal claimed ≈62% at defaults,
contradicting the post-MD1 demo's 65%). New exercises `c-paper-l3-best-response-predict`
and `-reflect` are live in exercises.data.ts; the old `c-game-l3-*` pair is orphaned.
At-sync deviations, all minimal and flagged: (1) opening "The opportunities section
optimized one of the red team's levers" → "An earlier section optimized one of the red
team's decision factors" (c-game section names + "lever" retired for the red team);
(2) reveal "The race cluster took that table as given" → "An earlier section took that
table as given" (internal jargon removed from learner-facing text); (3) MC explanation's
$\sigma^*$ LaTeX → Unicode "σ* ≈ 0.28" / "≈ 0.54" (the MC renderer typesets no math).
Known minor redundancy: c-game's following `## Defer to trusted, mechanistically` section
re-introduces defer after this cluster's one-line preview; fine until that section's own
draft pass. Originally: capstone of the "reconstruct the paper's safety number" arc
(race → opportunities → subtlety → **best response**). Docks in **§3.3 Defer to Trusted**
for the walkthrough (recommended — see Assumptions).

## Assumptions (flag if wrong)

1. **Docking — Option A (recommended): §3.3 Defer to Trusted.** The heatmap carries **both**
   blue levers ($b$ audit budget and $d$ defer band), so it is only fully meaningful once the
   paper has introduced deferring. §3.3's own text does that concretely: block `b-0147` states
   the protocol in full ("Submit [U's] code if its suspiciousness is below a certain
   threshold; otherwise produce code using T and submit that. Audit the top 2% most suspicious
   code"). That is enough for the reader to make sense of the $d$ lever without the (not yet
   relocated) defer-mechanics cluster. Anchor near the end of §3.3 — after the defer results
   table (`b-0152`) and the "more general design pattern" paragraph (`b-0153`), or at
   `sectionEnd: ax-sec-defer-to-trusted`. **Bonus hook:** the paper's Appendix I, "Testing
   Higher Backdoor Frequency in Response to Defer to Trusted"
   (`ax-sec-testing-higher-backdoor-frequency-in-res`), is literally one step of a best
   response, and can be cited as the authors probing exactly this.
   **Option B:** dock directly after the subtlety cluster in displayed §3.2.2. *Pro:*
   conceptual continuity — both red levers were just established, so "now choose them jointly"
   is the natural next beat. *Con:* the heatmap's $d$ lever is inert/confusing until the reader
   has met deferring in §3.3, forcing either a forward reference or a lever the reader cannot
   yet interpret. **Recommend A.**
2. **Both red levers have interior optima and $s, c$ are pool averages** — all established by
   the opportunities and subtlety clusters. This cluster only has to combine them and let the
   blue levers reshape the surface.
3. **Numbers are post-MD1 (2026-07-22 pSucc fix).** The best-response readouts recalibrated:
   at $b = d = 2\%$ safety is now **≈ 65%** (was 62% pre-fix). The reveal states 65% and
   reconciles it with the paper's ~62% exactly as the race cluster does (the gap is the
   sampling correction and shutdown-on-statistics rule).

## Design note

Skeleton mirrors the c-game seed — opening → predict → heatmap demo → reveal → reflect — but
makes two deliberate departures the redistribution forces:

- **The old predict is dead and replaced, not ported.** `c-game-l3-best-response-predict`
  asked for the safety *value* ("roughly what is safety? ≈ 62%"). The race cluster now
  reconstructs that number up front, so re-asking it is a spoiler that tests recall. The new
  predict is a **response** question: widen a blue lever (the defer band) and predict how the
  best response *migrates*. It tests the single idea the cluster exists to teach — the
  adversary re-optimizes — and cannot be answered by remembering a number. Its distractors are
  calibrated to the corrected model (see the MC): "maximally subtle" is the beautiful-but-false
  lure (the model saturates interior at $\sigma^* \approx 0.54$), "attacks far more often" is
  false (the rate stays flat), and "it does not move" is the core misconception.
- **The reveal reverses the direction of explanation** (spine blend rule). The race cluster
  went strategy ⇒ number: it took the contingency table's strategy as given and derived the
  65%. This cluster goes the other way — the strategy *is* the argmax over (cutoff, subtlety),
  so the contingency table is an **equilibrium artifact**, not an input. That reversal is the
  payoff, and it is exactly why the predict is retargeted from value to response.

One MC, one demo, one reflect, matching the seed's shape.

---

## The section

**[MARKDOWN ADD — opening: from one lever at a time to the joint best response]**

> The opportunities section optimized one of the red team's levers, its opportunity cutoff,
> and the subtlety section optimized the other, each while holding the rest fixed. A real
> adversary does not move one dial at a time. A scheming model that wants to slip a backdoor
> past your protocol will choose its whole strategy, cutoff and subtlety together, to do
> whatever works best against the exact protocol it faces. So the only meaningful question
> about a protocol is this: against the red team's *best response*, how safe is it?
>
> That strategy is two numbers you have already met: the opportunity cutoff $g^*$, which sets
> how often the red team attacks, and the subtlety $\sigma$ of each backdoor. Each has an
> interior optimum on its own. Now the red team chooses them jointly, and every blue-team lever
> reshapes the surface it is optimizing over.

**[MARKDOWN ADD — the heatmap, then set up the response prediction]**

> The demo below plots the red team's win probability over that whole strategy plane: the
> opportunity cutoff along one axis, subtlety up the other, computed from the model. A ring
> marks the single strategy that maximizes it, the best response, and two readouts report the
> resulting safety and exactly what the red team does there. The control evaluation grades the
> protocol against that ring, wherever it happens to sit.
>
> The revealing part is what the ring does when *you* move. Deferring to trusted hands any
> solution whose suspicion lands in a band just below the audit threshold to the trusted model
> to rewrite, instead of shipping it, quietly neutralizing whatever sat in that band. Suppose
> you widen that defer band from a sliver to a fifth of all problems. Before you drag it,
> predict how the ring migrates.

**[EXERCISE — multiple-choice `c-paper-l3-best-response-predict`]**

> **Prompt:** You are running trusted monitoring at a 2% audit budget, and you widen the defer
> band from 2% to 20% of problems. On the best-response heatmap (opportunity cutoff on one
> axis, subtlety on the other), how does the ring, the red team's best strategy, move?
>
> **Options:**
> - Up the subtlety axis, all the way to the maximally subtle corner
> - Upward to a subtler but still interior optimum, with the attack rate barely changing ✓
> - Sideways: same subtlety, but the red team now attacks far more often
> - It does not move; the safety number already accounts for the red team's response
>
> **Explanation:** A wider defer band silently rewrites anything whose suspicion lands in it,
> so to still ship, the red team has to push each backdoor's suspicion lower, which means
> making it subtler. The ring climbs the subtlety axis. But only partway: subtler backdoors
> break more often, and past a point that reliability collapse costs the red team more than
> ducking the band saves it, so the best subtlety saturates at an interior value. In the model
> it rises from $\sigma^* \approx 0.28$ at a 2% band to only $\approx 0.54$ at a 20% band, never
> near the maximally subtle corner, while the attack rate stays about flat (roughly 0.2% to
> 0.3% of problems). What is certain is that the ring moves at all, and that is the whole point:
> the safety readout is computed against wherever it currently sits, so every blue-team change
> provokes a red-team re-optimization the number already reflects. Safety climbs from about 65%
> to about 89% precisely because the red team's best response got worse, not because any one
> fixed attack was blocked.

**[DEMO — `best-response`]**

**[MARKDOWN ADD — reveal: the contingency table is an equilibrium artifact]**

> Return the levers to the 2% default. The ring settles at a high opportunity cutoff, an attack
> rate near two tenths of a percent, and a subtlety around $0.28$, and the safety readout reads
> about 65%: the model's reconstruction of the paper's headline number.
>
> Now look at what that ring is. Attacking on roughly 0.2% of problems at that subtlety produces
> exactly the kind of run the paper's contingency table recorded: a handful of attack attempts,
> most Failed, a few Caught, a few Successfully Deployed. The race cluster took that table as
> given and derived the safety from it. The heatmap closes the loop. That table was never an
> arbitrary input. It is the footprint of this argmax, the maximizing pair the ring marks. The
> paper's red team attacked rarely and moderately subtly not by convention but because, against
> this protocol, that pair is the maximizing choice. The contingency table is an equilibrium
> artifact.
>
> And that is why a safety number means nothing on its own. Move any blue lever and the bright
> region shifts: the maximizing red strategy changes, the contingency table it would produce
> changes, and the safety changes with it. You are never grading against a stationary adversary.
> A protocol's safety is only ever safety against the best response, and reading one number
> honestly means reading it against an opponent that has already re-optimized for whatever you
> just did.

**[EXERCISE — understanding-check `c-paper-l3-best-response-reflect`]**

> **Prompt:** The heatmap's bright region, the red team's best strategy, moves whenever you
> change a blue lever. Explain why a protocol's safety must be measured against the red team's
> best response rather than against one fixed attack, and in what sense the paper's own
> contingency table is itself a product of that best response.
>
> **Sample answer:** A capable, scheming adversary adopts whatever strategy works best against
> the exact protocol it faces, so a safety number computed against one fixed attack only says
> how *that* attack fares, not how the attack the red team would actually choose fares. The
> control evaluation therefore grades every protocol against the maximizing red strategy, which
> is why the safety here is safety against the best response. Because that best response moves as
> the blue levers change, any single safety number is a snapshot against a responding opponent:
> tighten a budget or widen the defer band and the red team re-optimizes, and the number already
> reflects it. The paper's contingency table, a handful of attack attempts at a particular rate
> and subtlety, is not an arbitrary given either. It is the record of the red team playing its
> best response to this protocol, so the same table would look different against a different
> protocol. That is what it means to say the table, and the safety read off it, are artifacts of
> an equilibrium rather than fixed facts about the world.

---

## Implementation flags (not learner-facing)

1. **Docking / anchor.** Per Assumption 1, §3.3, near `sectionEnd: ax-sec-defer-to-trusted`
   (or a mid-section block anchor such as after `b-0153`). Note that `sectionEnd:
   ax-sec-defer-to-trusted` already hosts the "Quick recall" defer cards
   (`c-paper-l4-recall-defer-below-threshold`, `-recall-dynamic-routing`); edits at one anchor
   render in edits-array order, so decide whether the heatmap cluster precedes or follows them.
   Suggestion: anchor the cluster at a block near the end of §3.3's body (e.g. after `b-0153`)
   and leave the recall cards at `sectionEnd`, so the capstone is not buried behind flashcards.
2. **Structure.** §3.3 has **no native subsections** (the next heading is §3.4), so an
   `op:"section"` here creates "3.3.1" with **no renumbering of any Redwood heading** — much
   cheaper than the §3.2 inserts. See Open questions for the own-subsection vs plain-adds call.
3. **Exercise ids.** `c-paper-l3-best-response-predict` is a **fresh definition** (new response
   prompt, options, and explanation — not a rename of the value-question version) and
   `c-paper-l3-best-response-reflect` is **ported/adapted** from the c-game reflect (which is
   still good). The c-game ids `c-game-l3-best-response-predict` and `-reflect` are retired with
   the section.
4. **Demo caption + readouts.** The `best-response` registry entry (title "The red team's best
   response"; description "…heatmap, with the best response ringed. Move the blue audit and
   defer budgets and watch the best strategy migrate.") is spine-clean — no "race odds," it
   describes migration — and needs **no change**. One thing to know, not fix: the demo's "Safety
   (vs best response)" readout now shows **≈ 65%** at the $b = d = 2\%$ default (post-MD1),
   whereas the OLD c-game reveal prose asserted ≈ 62%. The new reveal states 65% and reconciles
   it with the paper's ~62% in prose (as the race cluster does). Do not edit the demo; the
   reconciliation is prose-side. Verified readouts at defaults: safety 65.0%, red attacks 0.19%
   of problems, best subtlety 0.28.
5. **c-game copy — hide OR sync, Arya's call.** Same decision as the subtlety cluster's
   flag 5 (see above): the old plan was to hide c-game.mdx's `## The best-response principle`
   section in an MDX comment at implementation time, but since 2026-07-22 the race +
   opportunities sections live in c-game as an un-hidden sync of the walkthrough's 3.2.1
   cluster, so the consistent alternative is to replace the c-game section with a live sync
   of this cluster's final text. Flagged, not decided.

## Open questions (best-response cluster)

- **Own numbered subsection vs. plain adds — the structural call (differs from the subtlety
  cluster).**
  - *Option A — `op:"section"` → "3.3.1 The Best-Response Principle".* **Free here:** §3.3 has
    no native children, so nothing renumbers (§3.4 keeps its number). Gives the methodology
    capstone a nav landmark and reads as a first-class subsection. Mild quibble: best response
    is a general principle, not specifically a defer sub-topic, so nesting it under "Defer to
    Trusted" is a slight taxonomic stretch (a general title softens this).
  - *Option B — `plain:true` adds* at the end of §3.3: appends the cluster without claiming it
    is a defer sub-topic; no new nav entry.
  - **Recommendation: Option A (own subsection 3.3.1).** Unlike the subtlety cluster — where
    `op:"section"` forced a *second* renumber and I recommended plain — here `op:"section"` is
    free, and a capstone earns a landmark. Take Option B only if the "is it really part of
    defer?" quibble outweighs the landmark. **Your call.**
- **Docking A vs B** (Assumption 1): recommend A (§3.3); leave to Arya.
- **Dependency on a defer-mechanics cluster.** My read: §3.3's native text (`b-0147`) introduces
  deferring well enough for the heatmap's $d$ lever, so this cluster does **not** require the
  relocated defer-mechanics cluster to precede it. If that defer cluster does land in §3.3 too,
  placing best-response after it is a nicety (the reader has seen the `defer` demo) but not a
  requirement. Confirm the read.
