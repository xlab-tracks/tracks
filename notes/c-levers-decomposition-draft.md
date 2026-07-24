# Proposal — "Two routes to subtlety": restructuring the levers hand-off

Status: **IMPLEMENTED 2026-07-22** on both surfaces (c-game.mdx and the papers.data.ts
3.2.1 cluster), plus the c-game subtlety section synced from
c-subtlety-relocation-draft.md's current text (Arya's trimmed opener). At-implementation
deviations, all flagged:
- `c-paper-l3-subtlety-ways`: Arya's edited prompt used with one grammar fix ("does they" →
  "do they"). Arya had deleted the sample answer from this draft; the understanding-check
  schema requires one, so the earlier compact sample answer was restored (edit it in
  exercises.data.ts if you wanted it gone or different).
- `c-paper-l3-subtlety-predict` (new MC, shared id for both surfaces): prompt uses Unicode
  σ and no markdown bold, since the MC renderer typesets neither (the known defect).
  `c-paper-l3-hump-predict` deleted; `c-game-l6-subtlety-predict` now orphaned (with l4/l5).
- Walkthrough-only forward-pointer add rewritten in decomp language: "That covers the first
  route, selecting good opportunities. The second route, actively obfuscating each backdoor,
  is where the paper's own analysis goes next." (c-game needs no bridge; its subtlety
  section follows directly.)
- Reveal paragraph 3 dropped per the recommendation (hump-reflect now elicits the contrast).

**Second pass (Arya's writing edits, re-embedded 2026-07-23).** All changes shipped to both
surfaces. Grammar/spelling fixes applied (nothing else touched): "a opportunity cutoff" →
"an"; "$P(red wins)$" → "$P(\text{red wins})$"; "The works beacause" → "This works because";
"decides to attack through" → "decides whether to attack through"; "success and catch
probability are an independent draw" → "probabilities are independent draws"; "the first
decisive attack is successful attack is the expected... probability" → "the first decisive
attack attempt is a successful one is given by the expected... probabilities"; final period
added to the reveal. Bracket notes resolved: the annotated Term A/Term B expressions are
inlined verbatim in the cutoff-predict prompt and the reveal. Structural changes taken from
your edit: **quality cutoff renamed to opportunity cutoff everywhere live** (including the
c-game subtlety section and subtlety draft, for consistency); **subtlety-ways now has NO
sample answer** (sampleAnswer made optional in types.ts + both renderers, card shows no
reveal button); **hump-reflect removed from both surfaces** (definition kept, orphaned);
**walkthrough forward-pointer removed** (3.2.1 now ends at the reveal). **FLAGS — the
"anything wrong" pass found two things to know, neither blocking:** (1) your demo lead-in
replaced the calibrated-model disclosure paragraph, so the "small calibrated model,
idealization not a re-run" honesty note now exists NOWHERE on either surface (the subtlety
draft's Assumption 5 relied on it living here); if that was unintended, one sentence
restores it. (2) The reveal's closing clause now states why the red team attacks rarely,
which is what the removed hump-reflect asked the learner to derive — consistent with
removing it, just confirming the trade was deliberate.
**Third sync (2026-07-23):** the cutoff-predict prompt dropped ", attacking more often"
per Arya's note (it pre-answered the Term B half of the question) — shipped to
exercises.data.ts, which serves both surfaces.

**Fourth sync (2026-07-23, end-of-draft edit):** the hump analysis moved BEFORE the
attack-rate demo, merged with the σ-held-fixed sentence into one lead-in; the post-demo
reveal is gone, so the cluster ends at the demo on both surfaces. In c-game the
`## Subtlety: visible versus reliable` heading was also removed per Arya, so the section
flows continuously from the hump demo into the subtlety opener ("As aforementioned…").
Original proposal below, kept as the record.

Restructures the back half of "Probability of safety over
deployment" (everything after the race reconstruction's Understanding-check sequence) around
Arya's decomposition (2026-07-22): **opportunity is the inherent, zero-cost subtlety an
attack has; subtlety $\sigma$ is the red team spending effort to buy more, at the cost of
reliability.** One motivation now births both levers, and the subtlety cluster becomes the
natural continuation instead of a second cold open.

Applies to BOTH surfaces (kept in sync since the 2026-07-22 un-hide):
- `src/content/lessons/c-game.mdx`, the `## Probability of safety over deployment` section.
- `src/content/papers.data.ts`, the 3.2.1 cluster (ops at anchor `b-0131` after the
  "Understanding check" sequence op).

Inherits the **Model spine** in [c-race-relocation-draft.md](./c-race-relocation-draft.md)
(vocabulary, averaging contract, no em dashes, predict-before-reveal). Knock-ons for
[c-subtlety-relocation-draft.md](./c-subtlety-relocation-draft.md) are at the end.

## How to edit this file

- Prose inside the blockquotes is the **verbatim learner-facing text** — edit freely.
- Lines in `**[BRACKETS]**` are structural markers. Text marked **(Arya, verbatim)** is your
  wording, kept as written except the typo fixes listed in the flags.
- "Verdict", "Implementation flags", and "Open questions" are notes, not content.
- **Round-trip (post-implementation):** every blockquote below is the LIVE text exactly as
  shipped 2026-07-22 across c-game.mdx, papers.data.ts, and exercises.data.ts. Edit freely;
  say the word and a session re-embeds your edits into all three verbatim.

---

## Verdict on the framing (checked 2026-07-22)

**The concept is right, with one sharpening.** In the model both levers act on the same
latent quantity, the attack's suspicion mean:

$$
\mu(\sigma, g) = \mu_{\text{base}} \cdot (1 - 0.4\,\sigma) - 0.3\,g
\qquad\qquad
p_{\text{works}}(\sigma) = 0.75\,(1 - \sigma)^{1.3}
$$

$p_{\text{works}}$ contains **no $g$**: opportunity lowers suspicion and touches nothing
else about the attack. Subtlety lowers suspicion AND decays reliability. So per attack,
opportunity is exactly "inherent zero-cost subtlety" and $\sigma$ is exactly "purchased
subtlety paid in reliability." The sharpening: opportunity is not free *globally*, because
good opportunities are scarce ($g \sim \text{Beta}(2,5)$; the best response's cutoff admits
only ~0.2% of problems). The two routes pay in different currencies:

| Route | Buys | Currency | Bankrupts red via |
|---|---|---|---|
| Selection (raise $g^*$) | inherent subtlety | **frequency** (fewer attack attempts) | Term B → 0 at the rare extreme |
| Effort (raise $\sigma$) | manufactured subtlety | **reliability** ($p_{\text{works}}$ falls) | Term A → 0 at the subtle extreme |

That is why both levers produce interior optima, and it is the cleanest statement of the
whole section's structure.

**The paper lines up.** Receipts (all in the artifact, 2312.06942v5):
- Appendix M is literally this pipeline: M.7 implement the backdoor and "keep the program's
  issues subtle and … make the solution appear as normal as possible" (the effort route);
  **M.8 Sneakiness Rating** (GPT-4 rates "the likelihood of an observer noticing the issues,"
  negated); **M.9 Rarity Rating**; then submit only "if the sneakiness is sufficiently high
  and it seems like the backdoor will only rarely cause the program to be incorrect"
  (b-0531) — the selection route.
- §3.2's attack policy (b-0127/0129): backdoors "only injected when there is a good
  opportunity"; 71 proposals out of 1500 problems.
- b-0140 (reason 2): sneakier backdoors fail tests 52% of the time, yield no exploit 32% —
  the effort route's reliability tax, measured.
- b-0077: auditing "is in fact imperfect. But in this setting, auditing works very well
  overall" — supports the upfront-auditing sentence below ("close to perfect accuracy" is a
  fair gloss; in our model it is exactly perfect and independent of $\sigma$).

**One honest caveat (the only misalignment, an idealization rather than a conflict):** the
paper's "good opportunity" is a JOINT threshold on sneakiness AND rarity — in the paper,
good opportunities are both sneakier and likelier to work. Our model factors the bundle:
$g$ is pure visibility with zero reliability cost, and $\sigma$ carries the entire
reliability tax. Optional one-sentence disclosure drafted in the flags; recommended.

**Magnitude fine print** (fine to leave out of the prose): effort reaches ~3× deeper than
the best opportunity ($\sigma$ can remove up to 40% of the monitor's separation, ≈ 1.01
latent units; $\gamma g$ maxes at 0.3). Free subtlety is small and scarce; purchased
subtlety is bigger but taxed. Nothing in the drafted text contradicts this.

**Verified model claims used by the answers below** (existing sweeps, `b = d = 2\%`):
attack-rate curve is hump-shaped with an interior optimum around 0.2% of problems; lowering
$g^*$ raises the rate, raises average $c$, lowers average $s$; Term B rises toward 1 with
the rate; subtlety envelope peaks at $\sigma^* \approx 0.26$ and dies to exactly 0 at
$\sigma = 1$; P(deployed but broken) rises 10% → 80% over the $\sigma$ range.

---

## The section

Everything BEFORE this point in "Probability of safety over deployment" (contingency table →
formula → fixed-odds note → race predict + demo → 65%/62% reconstruction → Understanding
check sequence) is unchanged. The restructure replaces everything after it.

**[MARKDOWN — motivation. REPLACES the current "Attacking more only improves…" add AND the
"Thus a better decision variable…" add. (Arya, verbatim)]**

> Attacking more only improves the red team's win probability if every attack is as good as
> the last, and the paper's red team knew that this wasn't the case. Compared to upfront
> auditing, trusted monitoring forces the red team to use much *sneakier* attacks. Under
> upfront auditing only the first stretch of solutions is ever audited, and therefore the
> red team is not incentivized to obfuscate their backdoors, as human audited attacks are
> detected with close to perfect accuracy regardless of how sneaky the attack is. Under
> trusted monitoring every solution is scored for suspiciousness, and more obvious attacks
> are much more likely to get caught.
>
> Thus the red team's best strategy involves obfuscating their attacks to avoid being
> caught by the monitor.

**[EXERCISE — understanding-check `c-paper-l3-subtlety-ways` (LIVE in exercises.data.ts).
Shipped with one grammar fix ("does they" → "do they"). You had deleted the sample answer
here, but the understanding-check schema requires one, so the compact version below was
restored at implementation — edit or gut it freely.]**

> **Prompt:** The red team wants its attack attempts to draw less suspicion from the
> monitor. What decision factors do they have for making their attacks subtler? Name at
> least two, and think about what each one costs.

[NOTE: NO SAMPLE ANSWER HERE]

**[MARKDOWN — the two routes. (Arya, verbatim; typo fixes flagged)]**

> One way is to attack only "when there seems to be a good opportunity," selectively
> choosing attack opportunities where attacks are inherently more sneaky. For example, a
> problem with complex corner cases offers more inherent subtlety and is thus a better
> opportunity for a backdoor than a one-line string echo, which offers almost no inherent
> subtlety. The red team's selectivity is captured by an **opportunity cutoff**: the minimum
> opportunity level at which it is willing to attack. A high cutoff means attacking rarely,
> only when the opportunity is excellent (a low probability of getting caught). Conversely,
> decreasing the opportunity cutoff increases the attack rate at the cost of adding attack
> attempts with worse odds.
>
> Another way to do this is to actively work to obfuscate the attacks and make them more
> subtle, at the cost of making broken deployed attacks more probable.
>
> These are both decision factors the red team can control for their strategy.

**[MARKDOWN — the model with both incorporated (replaces the current averaging add; same
display equation, now carrying $\sigma$)]**

> In our model for $P(\text{red wins})$, there is no longer a single $s$ and $c$. Each
> attempt's odds are set by two things: the problem's inherent opportunity $g$, drawn
> problem by problem and selected through the opportunity cutoff $g^*$, and the obfuscation
> effort $\sigma$ from the red team to make the attack more subtle. Write $s(g, \sigma)$ and
> $c(g, \sigma)$ for the success and catch probability of an attempted attack on a problem
> of opportunity $g$ at effort $\sigma$. Then $s$ and $c$ become the **average** odds across
> the attempts the red team actually makes:
>
> $$
> s = \mathbb{E}\!\left[\,s(g, \sigma) \mid g > g^*\,\right] \qquad c = \mathbb{E}\!\left[\,c(g, \sigma) \mid g > g^*\,\right]
> $$
>
> This works because each problem's opportunity is an independent draw, and the red team
> decides whether to attack through the opportunity cutoff threshold. So each attempt's
> success and catch probabilities are independent draws from the pool of attacks above the
> cutoff. Thus the probability that the first decisive attack attempt is a successful one is
> given by the expected (average) success and catch probabilities. From here on, read every
> $s$ and $c$ as average odds.

**[EXERCISE — understanding-check `c-paper-l3-cutoff-predict` (LIVE in exercises.data.ts;
replaced the deleted multiple-choice `c-paper-l3-hump-predict`)]**

> **Prompt:** Suppose the red team lowers its opportunity cutoff. With
> $s$ and $c$ read as the average odds of its attempts, what happens to each term of
> $P(\text{red wins}) = \underbrace{\frac{s}{s + c}}_{\text{Term A}} \cdot \underbrace{\left(1 - (1 - s - c)^k\right)}_{\text{Term B}}$,
> and to the red team's overall win probability?
>
> **Sample answer:** Term B rises: more attack attempts make it more likely that some
> decisive attack attempt occurs. But the added attempts are drawn from worse opportunities,
> where backdoors are inherently more visible, so the average $c$ rises and the average $s$
> falls, and Term A, the probability that a decisive attack attempt is successfully
> deployed, drops. Near the rare end the Term B gain dominates and the win probability
> climbs; past some point the Term A decay takes over and it falls. The curve is
> hump-shaped, and the red team's best attack rate is low but non-zero.

**[MARKDOWN — demo lead-in (LIVE 2026-07-23: the hump analysis moved BEFORE the demo and
merged with the σ-held-fixed sentence, per Arya's end-of-draft edit). Note the
calibrated-model disclosure remains deleted; see the FLAG in the status header.]**

> At high opportunity cutoffs, attack attempts are so rare that the deployment usually ends
> before an attack attempt is decisive and Term B, $1 - (1 - s - c)^k$, is very small. At
> the lower opportunity cutoffs, attempts are very frequent but increasingly drawn from
> problems with poor inherent subtlety, so the average catch rate climbs and Term A,
> $s/(s+c)$, becomes smaller. In between sits an interior optimum at a low but non-zero
> attack rate, which is why the paper's red team attacks on only a small fraction of
> problems. In the following demo, obfuscation effort is held at a fixed level.

**[DEMO — `attack-rate`, ends the cluster: no post-demo reveal. In c-game the subtlety
content follows directly (its `## Subtlety: visible versus reliable` heading was also
removed 2026-07-23, so 3.2.1 material and subtlety read as one continuous section); in the
walkthrough the cluster ends here, before Redwood's Qualitative Analysis heading.]**

**[REMOVED earlier per Arya: the `c-paper-l3-hump-reflect` exercise (orphaned) and the
walkthrough-only forward-pointer add.]**

---

## Knock-on: the subtlety cluster's opener — SUPERSEDED at implementation

Arya's own trim of c-subtlety-relocation-draft.md shipped instead of the replacement that
was proposed here: the subtlety section now opens directly at "The paper measures what
sneakier costs…" (the moved motivation lives above in this restructure). The live subtlety
text — opener, two-averages add, MC, demo caption, reveal — has its source of truth in
**c-subtlety-relocation-draft.md's section blocks**; edit the subtlety writing there, and
the 3.2.1 writing here.

---

## Implementation flags (not learner-facing)

1. **Dual surface.** c-game.mdx: replace the section's text from "Attacking more only
   improves…" through the hump-reflect exercise with the blocks above (same `<Exercise/>` /
   `<Demo/>` embedding as the current port). papers.data.ts: same replacement expressed as
   ops — the two motivation adds, activity(subtlety-ways), the two-routes add, the unified
   model add, activity(cutoff-predict), the disclosure add, activity(demo attack-rate), the
   reveal add, activity(hump-reflect). All `plain: true`, all at `b-0131`, same
   XLab-authorship comment bracket.
2. **exercises.data.ts.** Add `c-paper-l3-subtlety-ways` and `c-paper-l3-cutoff-predict`
   (understanding-checks, prompts/answers verbatim above; LaTeX double-escaped in TS).
   RETIRE the `c-paper-l3-hump-predict` multiple-choice (delete the definition; it is
   referenced only by the two synced surfaces being edited). Side benefit: the raw-LaTeX-
   in-MC renderer defect no longer has an instance in this section. `c-paper-l3-hump-reflect`
   is referenced unchanged.
3. **Deviations from Arya's verbatim text** (all flagged, nothing silent):
   - "which offers almost inherent subtlety" → "which offers almost **no** inherent
     subtlety" (dropped word restored).
   - "One way is to Attack only" → lowercase "attack".
   - "sneaky. quality cutoff: the minimum…" had no subject; bridged as "The red team's
     selectivity is captured by a **quality cutoff**: the minimum…".
   - "more subtle at the cost of" → "more subtle, at the cost of" (comma only).
   - "the red-team can control" → "the red team can control" (house style).
   - Free-response prompt phrased per your bracket note; wording above is the proposal.
4. **Audit-accuracy footnote.** "detected with close to perfect accuracy regardless of how
   sneaky the attack is" — paper (b-0077): auditing "is in fact imperfect. But in this
   setting, auditing works very well overall." Our model makes the sentence exactly true
   (audited attack attempts are always caught, independent of $\sigma$). Kept verbatim as a
   fair gloss; soften to "very reliably" if you want letter-perfect paper alignment.
5. **Optional caveat sentence** (for the unified model add, after the parenthetical), if
   you want the paper's joint-threshold bundling disclosed: "In the paper's pipeline the
   two are bundled, its red team screened candidate backdoors for sneakiness and for how
   rarely they break at once; the model separates the axes so each can be studied alone."
   Recommended but optional.
6. **Prose accounting (what the restructure deletes):** the old "Attacking more…" +
   "cover"-example paragraph and the "Thus a better decision variable…" paragraph (both
   folded into your two-routes text), the hump-predict MC's averaging preamble add ("Now
   the arithmetic of the previous section changes. Predict how."), the reveal's third
   paragraph, and the subtlety cluster's standalone motivation (folded into the one-line
   opener above). Net: two exercises' worth of new free-response text in, roughly five
   paragraphs of prose out.
7. **Attack-rate demo rebuilt around the decomposition (DONE 2026-07-22, live in
   attack-rate-demo.tsx; per Arya, "update the demo using the decomp").** Same visual
   grammar as the subtlety demo: two full-width panels sharing the log-rate axis (viewBox
   440×316, `max-w-lg`). Top panel (0–100%): **Term A** (red `--chart-1`, dashed) and
   **Term B** (grey `--chart-2`, dashed) with direct labels riding the curves — Term B
   saturates to ~99% by a ~0.16% rate (k ≈ 8 expected attack attempts) while Term A drifts
   37% → 28% from pool dilution (verified sweep at the demo's fixed σ = 0.4). Bottom panel:
   P(red wins) on its tight axis with the optimum dot; slider marker runs through both
   panels with dots on A, B, and P. Readout mirrors the subtlety demo: input tier "Caught
   by monitor $c$ / Successfully deployed $s$ / Attack attempts $k$" (k = expected attempts,
   a new readout that makes Term B's saturation legible), then the KaTeX equation row
   $s/(s+c)$ × $1-(1-s-c)^k$ = $P(\text{red wins})$ (slash form, operators on the values'
   baseline). The old "Attack rate | P | Safety" grid is gone (rate lives in the slider
   readout; safety is the complement, dropped as in the subtlety demo). Same k-form-label /
   exact-N-form-value note as the subtlety demo. Registry caption updated to name the two
   terms. This directly rehearses the `c-paper-l3-cutoff-predict` sample answer: the
   learner watches Term B rise and Term A fall as they drag. No model changes; the sweep
   above is recorded in the header comment.
8. **Sweep re-verification at implementation:** the Term A/B-vs-rate sweep backing flag 7
   was run 2026-07-22 (gStar grid at σ = 0.4: A 36.7% → 28.4%, B 0 → 100% saturating by
   ~0.16%, peak P ≈ 34.5% near 0.2%); everything else is covered by the existing verified
   sweeps (see Verdict).

## Open questions (updated post-implementation)

- **Optional caveat sentence** (flag 5, the paper's joint sneakiness-and-rarity threshold
  vs the model's clean factoring): include or not — still open, NOT shipped.
- ~~Reveal paragraph 3 drop-or-keep~~ — DECIDED: dropped at implementation (hump-reflect
  now elicits the contrast).
- ~~subtlety-ways prompt wording~~ — RESOLVED: your edited prompt shipped (one grammar fix).
- ~~Subtlety-opener knock-on timing~~ — RESOLVED: your trim of the subtlety draft shipped
  with this restructure into c-game; the walkthrough b-0140 splice is still pending its own
  structural calls (see c-subtlety-relocation-draft.md).
