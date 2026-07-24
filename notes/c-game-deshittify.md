# Deshittify tracker — "Trusted monitoring as a game" (c-game)

Working list of everything wrong with the lesson at `src/content/lessons/c-game.mdx`
and its demos, plus resolution proposals where one exists.

**We are mapping problems first; solutions get worked out later.** Nothing here is
implemented unless its box is checked. Long proposals live in separate files and are
linked from their item.

Priority: **[high]** / **[med]** / **[low]**.
Items tagged **(MAYBE)** are flagged but not yet accepted — Arya is undecided whether
they're worth taking. Untagged items are accepted grievances.

---

## Global

- [ ] **G1 · Writing quality** [high]
  Most of the prose is poorly constructed, barely interpretable, and not very
  pedagogical. Full rewrite pass planned after the section-level issues are mapped.
  (The section redesigns — e.g. [the race redesign](./c-game-race-redesign.md) —
  double as samples of the target style.)

---

## §1 Same AUC, different safety — RELOCATED 2026-07-21

- [x] **M7 · Section relocated into the AI Control paper walkthrough** [high]
  Now lives in `papers.data.ts` at anchor b-0135 (§3.2.1), spliced after the
  intact original trio (operating-point, AUC-meaning, per-attempt — per-attempt
  was briefly moved after the insert, then restored 2026-07-21 at Arya's call):
  connective add (Arya's "You may be tempted…" paragraph) → staged exercise +
  monitor-tails demo → post-demo prose. No section heading transfers; the staged exercise and demo were
  retitled "Same number, different safety" (their old titles surfaced in the paper
  nav/demo frame — key agent judgment call, flagged for Arya). All learner-visible
  AUROC → AUC (13 strings, 6 files; code identifiers/comments/tests and verbatim
  arXiv artifacts untouched). In c-game.mdx the section is HIDDEN in an MDX comment
  (delete once confirmed) and the intro got a minimal bridge sentence.
  *Open:* `estimatedMinutes` rebalancing (c-game 92 / ai-control paper 94).
  M3 (shade unusable ROC region) and M4 (left-wall inset) still open — they now
  apply to the section's new home in the walkthrough.

### Pre-relocation items (historical)

- [x] **M1 · Color collision between panels** [high] — *implemented 2026-07-19 (navy=A, red=B via --chart-4/--chart-1; direct A/B labels on ROC; 3-entry legend), pending Arya review*
  The density panels use grey = Innocent, navy = Attacks (with a legend). The ROC
  panel reuses the *same two colors* to mean Monitor A (grey, `--chart-3`) vs
  Monitor B (navy, `--primary`), with no legend or labels — so the ROC reads as
  "innocent vs attacks."
  *Proposal:* color by monitor, consistently — give A and B their own hues, use them
  for the attack curve in each density panel **and** the ROC curves/dots; keep
  innocent as neutral grey everywhere. Add direct labels "A" and "B" next to the ROC
  curves (direct labeling beats a second legend).

- [x] **M2 · Per-panel y-scaling makes the identical innocent curve render differently** [high] — *implemented 2026-07-19 (shared static Y_MAX), pending Arya review*
  Each `DistPanel` normalizes its y-axis to its own tallest curve (lines 46–48).
  Monitor B's narrow attack density (sd 0.4) has a ~2.5× taller peak, so panel B's
  scale shrinks the (identical) innocent curve to less than half its panel-A height —
  the fixed reference curve looks different in a side-by-side comparison.
  *Proposal:* shared y-scale across both density panels; B's tall narrow spike then
  correctly reads as "same attack mass, compressed."

- [ ] **M3 · ROC's unusable region isn't shaded** [med]
  The lesson's core claim is "AUROC averages over thresholds the budget never lets
  you use," but the ROC plot doesn't show it.
  *Proposal:* grey out everything right of the FPR = 2% line, mirroring the shaded
  audit region in the density panels — the lesson's whole point rendered as one
  rectangle.
  *Arya's variant — staged reveal:* first show the plain ROC and ask the
  single-metric question; only after the second question (which asks what single
  number *does* predict safety) reveal the grey-out, so the shading lands as the
  answer rather than a spoiler.

- [x] **M5 · Predict-MC asked without showing any graph** [high] — *implemented 2026-07-20.*
  The old MC described the two monitors verbally ("A spreads / B compresses" — the
  density information smuggled in as words, leaking the mechanism) and its correct
  option encoded a magnitude no learner could derive from prose. New flow: a static
  ROC-only figure (`monitor-tails-roc`: both curves at fixed AUROC 0.92, direct A/B
  labels, "AUROC: A = B = 0.92" annotation; deliberately no densities, no dots, no
  2% line — the crossing equal-area curves defeat every naive heuristic without
  leaking the answer) → rewritten MC reasoning from the figure (new distractor: "it
  can't be determined from ROC curves alone") → the full demo as the reveal.

- [x] **M6 · §1 opener rebuilt as a three-stage staged question** [high] — *implemented 2026-07-20; supersedes M5's single-MC design (M5's figure component survives as the shared `RocPanel`).*
  New flow: priors paragraph (N = 5,000 · 2% budget · ~0.1% attack frequency) →
  `c-game-l2-tail-staged` (staged-questions type, stage-aware mini ROC figure
  `monitor-roc-mini`: A always locked at 0.92; B locked 0.92 in Stage 1, locked 0.97
  in Stage 2, free slider from Stage 3 — renderer now passes `activePartIndex` to
  figure widgets): Stage 1 same-AUROC (47% vs 9%), Stage 2 higher-AUROC-same-catch
  (0.97 vs 0.92 both ≈ 47% — model coincidence, no tuning), Stage 3 budget arithmetic
  (5 attacks vs 100 audits → FPR pinned ≈ 2%) + the metric question (absorbed the old
  `c-game-l2-tail-reflect`). Old `c-game-l2-tail-predict`/`-reflect` deleted.
  *Open micro-decisions:* (a) attack-frequency prior is 0.1%, not Arya's floated
  0.01% (0.01% → 0.5 expected attacks, degenerate arithmetic); (b) two `*…*` markers
  in staged reveals render as literal asterisks (renderer does math, not markdown
  emphasis) — drop them or `$\textit{…}$`.

- [ ] **M4 · Operating points crammed against the left wall** [low]
  The 2% line nearly touches the y-axis, so the A-vs-B gap at the operating point is
  hard to read. *Optional proposal:* zoomed inset of FPR ∈ [0, 0.1].

---

## §2 Safety over a deployment: the race — RELOCATED 2026-07-21 (with §3 Opportunities)

- [x] **R9 · Race + Opportunities relocated into the walkthrough as the §3.2 subsection "Probability of Safety over Deployment"** [high]
  Implemented per [c-race-relocation-draft.md](./c-race-relocation-draft.md): 17-op
  splice in `papers.data.ts` at anchor b-0131 (end of §3.2 body, before §3.2.1),
  presenting as first-class numbered subsection **3.2.1** (in body and "In this paper"
  nav; Redwood's Qualitative Analysis / Untrusted Justification display-shift to
  3.2.2/3.2.3 at render time, ids and text verbatim); prose renders as native paper
  body via the new `plain: true` add flag, not note boxes. Backend comments mark the
  cluster as XLab-authored. New pipeline mechanism (`op: "section"`) documented in
  AUTHORING.md. (Was briefly labeled "DEMO 2" — renamed, then promoted 2026-07-22.) 7 new exercises (`c-paper-l3-race-*`,
  `c-paper-l3-hump-*`), new pure-formula `race-paper` demo (table odds c=24/71,
  s=13/71, "Term A — ceiling" asymptote), existing `attack-rate` demo reused. Both
  c-game sections hidden in MDX comments (M7 pattern; no bridge sentence added —
  writing-pass seams flagged: c-game intro line 3, Subtlety opener line 85).
  *Open defects (all verbatim-preserved for the writing pass):* unfinished opening
  sentence ("…computing the complement of the red team"), "An broken attack", "a an
  attack", statement-phrased hinge prompt, "optiomal"/"indecisve" typos, lever-paragraph
  grammar. **Renderer bug worth its own fix:** the multiple-choice renderer
  (`choice-exercise.tsx`) does NOT typeset math — `c-paper-l3-hump-predict`'s prompt
  shows raw `\underbrace{…}` LaTeX on the page. Either add MathText to the MC renderer
  or rewrite that prompt in plain Unicode (as `race-predict` already is).

### Pre-relocation items (historical) — `src/components/demos/race-demo.tsx`

- [x] **R1 · Event factor uses a silent, visibly-wrong approximation** [high] — *implemented 2026-07-19 (exact forms in evaluateHomogeneous/evaluateGame + mdx equation + exercise text; calibration pins 15/15 incl. new k=1 identity test)*
  Term B ("any decisive event fires") is computed as `1 − e^(−k(w+c))` — the Poisson
  approximation of the exact `1 − (1−w−c)^k`, valid only when the per-attack decisive
  probability w+c is small. In this demo w+c = 0.577, so the plot is materially wrong
  at small k: at k=1 the true value is exactly w = 15.6% but the curve shows ~12%,
  contradicting the per-attack readout printed directly above it; at the default k=2
  it's 22.2% exact vs 18.5% plotted. The lesson never discloses the approximation,
  despite the intro's "the plots show the pathological truth" honesty promise.
  *Proposal:* use the exact form everywhere; details in
  [the race redesign](./c-game-race-redesign.md).

- [x] **R2 · Auto-scaled y-axis hides the race-odds ceiling** [high] — *implemented 2026-07-19 (fixed 0–100% axis + dashed "race odds — ceiling" asymptote)*
  As k → ∞, P(red wins) → w/(w+c) ≈ 27% — a hard ceiling no amount of attacking can
  beat, which is Term A's meaning made visible. The demo scales the y-axis to the
  plateau (`yMax = plateau × 1.05`), so the curve always fills the frame and the
  ceiling is invisible.
  *Proposal:* fix the y-axis at 0–100% and draw a dashed horizontal asymptote at
  w/(w+c), labeled "race odds — ceiling."

- [x] **R3 · Formula labels give away the interpretation exercise** [med] — *implemented 2026-07-19 (Term A/Term B in equation + demo readouts; names still coined in reveal prose so §3's reference resolves)*
  The underbrace labels on the displayed formula ("race odds", "any decisive event
  fires") answer the interpret-the-terms understanding check before it's asked.
  *Proposal:* strip the labels from the formula (bare Term A / Term B); rename the
  demo readout labels to Term A / Term B until the reveal prose names them.

- [x] **R4 · MC's correct option embeds its own justification** [med] — *implemented 2026-07-19 (bare "As often as possible")*
  "As often as possible — *with per-attack odds fixed, more attempts is strictly
  better*" argues for itself, so the predict moment does no work.
  *Proposal:* options as bare claims only.

- [ ] **R5 · (MAYBE) Per-attack odds are magic numbers** [med]
  *Status: maybe — Arya undecided.*
  The readout "caught 42.1% · working backdoor ships 15.6%" comes from the calibrated
  model at hardcoded subtlety σ = 0.4 and opportunity quality g = 0.5 — two levers
  the reader hasn't met yet (introduced two sections later). No explanation is given.
  *Proposal:* one provenance line: "c and w are frozen from the calibrated monitor;
  where they come from is the next two sections' business."

- [ ] **R6 · (MAYBE) k = 0 is dodged, not handled** [low]
  *Status: maybe — Arya undecided. Note: a half-implementation (min=0, showing a
  misleading "Term A 0%" readout at k=0) was found in the tree on 2026-07-19 and
  reverted to min=1; if taken, R6 needs the "—" rendering for Term A at k=0.*
  The slider min is 1 because at k = 0 the race-factor code path returns a degenerate
  0 and the readout would show a misleading "race odds 0%". But k = 0 is a meaningful
  endpoint (never attack → safety 100%) and a natural anchor for the plot.
  *Proposal:* allow k = 0 and render Term A as "—" when no decisive event is possible.

- [x] **R7 · Section pedagogy restructure** [high] — *found already implemented (uncommitted) in the working tree on 2026-07-19 by a parallel session, per the redesign doc: rules → hinge check → bare formula → terms check → MC → demo → reveal, with new exercises `c-game-l4-race-hinge` / `c-game-l4-race-terms`. Verified rendering + tests. **Open decision:** the old `c-game-l4-race-reflect` exercise entry is now orphaned in exercises.data.ts (embed removed from mdx, data entry remains) — keep or delete?*
  Reorder to: rules → hinge check (why the first decisive attack settles everything)
  → bare formula → generation check (interpret the terms yourself) → confirmation →
  MC predict → demo → reveal. Full draft with corrected term glosses:
  [c-game-race-redesign.md](./c-game-race-redesign.md).

- [x] **R8 · "Race" metaphor never cashed out** [low] — *resolved via the R7 prose
  ("every attack enters a race between red's wins and blue's catches…"). Entry was
  deleted from this tracker by the parallel session; restored here as a record.*

---

## Model (`src/lib/control-model`)

- [x] **MD1 · pSucc floor artifact removed + recalibration** [high] — *2026-07-22.*
  Old reliability `max(0.03, 0.75 − 1.2σ)` had a hard floor at σ=0.6 producing a fake
  interior MINIMUM and a rebound toward σ=1 in the subtlety demo (user: "graphs must be
  faithful and non-bullshit"). Now smooth power decay `0.75·(1−σ)^1.3` (new param
  `alpha=1.3`; `subtletyVis` 0.5→0.4; `q`/`attackSd`/`gamma`/betas untouched, so the
  staged AUC numbers 47/9/47.2 are unaffected). Pins all green with no test edits
  (upfront 11.8, TM 65.0, defer-10 81.2, defer-20 89.3); subtlety curve now has a single
  interior max σ*=0.27 (P 35.0%), monotone decline, P(σ=1)=0; attack-rate r*=0.19%
  stays in the "fraction of a percent" band the DEMO 2 prose asserts. Fixed the two
  learner-visible "recovers at the subtle extreme" claims (c-game subtlety reveal +
  `c-game-l6-subtlety-predict` explanation). **Finding for the defer cluster:** defer →
  subtler is directionally true but saturates at σ*≈0.54 — never "maximally subtle";
  `c-game-l7-defer-reflect` still says otherwise (fix at drafting time).

---

## Housekeeping (when §2 fixes land)

- [x] New/edited understanding checks need entries in `src/content/exercises.data.ts`.
      *(done — hinge/terms entries exist; see R7 note re: orphaned race-reflect entry)*
- [x] Stale comments to update: `race-demo.tsx` header block, `e^{-k(w+c)}` references
      (PLAN §4.5) in `src/lib/control-model/protocol.ts`. *(done 2026-07-19)*
- [x] `evaluateGame` formula swap → re-run calibration pins
      (`src/lib/control-model/control-model.test.ts`). *(15/15 pass, pins unchanged;
      suite now includes a k=1 identity test `pRedWin === wBar`)*

---

## Not yet reviewed

§4 Subtlety · §5 Best-response principle · §6 Defer to trusted · §7 Full dashboard —
grievances to be added as we go. (§3 Opportunities relocated with §2 — see R9. The
redistribution map: subtlety → after b-0140 in displayed §3.2.2, best-response → §3.3
(recommended as inserted subsection 3.3.1, zero renumbering) — **both drafts ready for
Arya's edits at [c-subtlety-relocation-draft.md](./c-subtlety-relocation-draft.md)**;
defer → §3.3; dashboard → §3.5 end. Draft against the Model spine in
c-race-relocation-draft.md.)

2026-07-23 (best-response check → two-stage): the upper-bound check is now a two-stage
sequence per Arya — stage 1 c-paper-l3-best-response-upper-bound (Arya's prompt/answer:
knows TM but not the budget → wrong priors play weaker strategies), stage 2 NEW
c-paper-l3-protocol-awareness (aware vs unaware, benefits/drawbacks; sample answer covers
tailoring/exploitation upside + the Ctrl-Z deterrence twist per Arya's sketch). Grammar
fixes to stage-1 prompt: "that blue team" → "that the blue team", "they were unaware" →
"was unaware" (agreement with "its"), comma before "what". Typecheck+468 tests green.

2026-07-23 (minimal best response): c-game best-response passage reduced per Arya (heading
already removed by Arya): one-sentence optimum statement → demo → new
c-paper-l3-best-response-upper-bound check (best response = upper bound for red without
exact priors). best-response demo: defer slider removed (d pinned to b, restore for the
§3.3 migration story), ring recolored white. predict/reflect exercises orphaned.
Typecheck+468 tests green.

2026-07-23 (levers end-of-draft sync + heading removal): hump analysis now sits BEFORE the
attack-rate demo (merged with the σ-fixed sentence); post-demo reveal deleted on both
surfaces (walkthrough 3.2.1 ends at the demo); c-game's `## Subtlety: visible versus
reliable` heading removed, so hump demo → "As aforementioned…" reads as one continuous
section. Typecheck+468 tests green.

2026-07-23 (subtlety exact-sync + Term B asymptote): c-game subtlety section now matches the
.md exactly — opener → two-stage Predict → Arya's short demo lead-in → demo → straight to
best response (four-paragraph reveal DELETED; lead-in's stray "_" fixed). Attack-rate demo:
terms panel got headroom with 100% drawn as a dashed labeled asymptote (Term B never touches
the panel edge), and both demos' Term B readout caps at ">99.9%" instead of a false
"100.0%". Typecheck+lint+468 tests green.

2026-07-23 (best-response sync): c-game's `## The best-response principle` replaced with the
subtlety draft's Cluster 2 — response-prediction MC c-paper-l3-best-response-predict (ring
migration, Unicode σ in explanation), best-response demo, equilibrium-artifact reveal
(65% at defaults, honest post-MD1), reflect c-paper-l3-best-response-reflect. Old
c-game-l3-* pair orphaned. Deviations flagged in the draft's Cluster 2 status (decision-
factor language, "earlier section" instead of "race cluster"). Walkthrough §3.3 docking
still pending. Typecheck+lint+468 tests green.

2026-07-23 (subtlety re-embed): the subtlety draft's two notes passes are LIVE in c-game —
one-sentence opener ("As aforementioned, the red team's other decision factor..."),
two-averages add deleted, predict now a two-stage sequence (realigned MC + new
c-paper-l3-sigma-terms-predict free response with NO sample answer, per "we'll show them
the graph and its analysis"), pragmatic reveal (mechanism → bands → terms, covers the
decreasing-effort mirror), subtlety demo chart title "Per-attack outcome probability, and
P(red wins)", registry description "second decision factor". Also synced same day:
cutoff-predict prompt dropped ", attacking more often" (levers draft note). Walkthrough
b-0140 subtlety splice STILL pending structural calls. Typecheck+lint+468 tests green.

2026-07-23 (Arya's writing pass re-embedded): levers-decomposition draft edits shipped to
both surfaces verbatim (grammar/spelling fixes only, all listed in the draft's status
header). Notables: "quality cutoff" renamed "opportunity cutoff" everywhere live (incl.
subtlety section); unified-model paragraph rewritten in Arya's voice; annotated Term A/B
formulas inlined in cutoff-predict prompt + reveal; subtlety-ways has NO sample answer
(sampleAnswer now optional schema-wide, renderers handle absence); hump-reflect REMOVED
from both surfaces (orphaned); walkthrough forward-pointer removed; calibrated-model
disclosure paragraph replaced by a one-line lead-in — FLAGGED: the idealization-honesty
note now exists nowhere. Typecheck+468 tests green.

2026-07-22 (decomposition IMPLEMENTED): the two-routes restructure is live on BOTH surfaces
per c-levers-decomposition-draft.md — c-game.mdx and the 3.2.1 cluster now carry Arya's
motivation verbatim (upfront-vs-TM sneakiness), the subtlety-ways free response, the
two-routes text, the unified $s(g,\sigma)$/$c(g,\sigma)$ averaging model, cutoff-predict
(free response, replaces the deleted hump-predict MC), the σ-held-fixed disclosure clause,
and the two-paragraph reveal. The c-game subtlety section was also synced to the subtlety
draft's current text (trimmed opener, new shared MC c-paper-l3-subtlety-predict with
Unicode-σ prompt, bands reveal); the walkthrough b-0140 subtlety splice is still pending
Arya's structural calls. Newly orphaned: c-game-l6-subtlety-predict. Typecheck+lint+468
tests green.

2026-07-22 (attack-rate demo decomp): attack-rate-demo.tsx rebuilt around the two-term
decomposition (renders in BOTH c-game and the walkthrough) — top panel Term A (red,
37%→28% pool dilution) and Term B (grey, saturates ~99% by 0.16% rate) as dashed curves
with direct labels; bottom panel P(red wins) on a tight axis; readout now mirrors the
subtlety demo (c / s / expected attempts k tier + KaTeX equation row s/(s+c) ×
1−(1−s−c)^k = P). Old rate/P/safety grid removed. Registry caption updated. Details in
c-levers-decomposition-draft.md flag 7. Typecheck+lint+468 tests green.

2026-07-22 (decomposition proposal): NEW draft
[c-levers-decomposition-draft.md](./c-levers-decomposition-draft.md) — restructures the
back half of "Probability of safety over deployment" (both surfaces) around Arya's frame:
opportunity = inherent zero-cost subtlety, σ = purchased subtlety paid in reliability
(verified against model math mu = muBase(1−0.4σ)−0.3g, pSucc g-free, and the paper's
M.7/M.8/M.9 sneakiness/rarity pipeline). Arya's text verbatim; two new free-response
exercises (subtlety-ways, cutoff-predict) replacing the hump-predict MC; subtlety-cluster
opener knock-on included. Awaiting Arya's edits/approval.

2026-07-22 (un-hide): per Arya, the walkthrough's 3.2.1 cluster was synced BACK into
c-game.mdx and un-hidden — the old hidden race + opportunities sections are replaced by one
live `## Probability of safety over deployment` section carrying the 3.2.1 content verbatim
(same `c-paper-l3-*` exercise ids, `race-paper`/`attack-rate` demos; the cluster's final
forward-pointer line dropped since the lesson's Subtlety opener plays that role). Lesson and
walkthrough now carry this content in parallel; only the AUC block stays hidden in c-game.
Consequences: `race` demo (race-demo.tsx) and the c-game-l4/l5 exercise definitions are now
fully orphaned (retire or keep decision pending); the hide-vs-sync question is reopened for
the upcoming subtlety/best-response implementations (flagged in the draft's flag 5s).

2026-07-22 (post-draft): subtlety demo rebuilt in place to show HOW σ moves P(red wins).
Final layout (Arya's pick from side-by-side mockups, then a space-fix pass): 2b full-width —
stacked-band partition of every attack attempt's fate (caught bottom / deployed-but-broken
middle / successfully-deployed pressed against the 100% ceiling; bands sum to exactly 100%)
over a full-width P(red wins) panel on its own tight axis; the side bar panel was tried and
removed (wasted space, duplicated the readout). Decomposition readout now renders the
formula in KaTeX (s/(s+c) × 1−(1−s−c)^k = P(red wins)) via MathText instead of "Term A/B".
"Successfully deployed" relabel; limiting best response at σ=1; reveal/MC/table rewritten
around the verified finding that Term B stays ≥98.9% along the envelope (subtlety acts
through Term A alone, s̄ = (1−c̄)·p_works). Details in the draft's flag 3/4/6.
Typecheck+lint+468 tests green.
