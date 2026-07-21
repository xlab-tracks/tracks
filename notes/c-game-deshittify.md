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

## §2 Safety over a deployment: the race — `src/components/demos/race-demo.tsx`

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

§3 Opportunities are not equal · §4 Subtlety · §5 Best-response principle ·
§6 Defer to trusted · §7 Full dashboard — grievances to be added as we go.
