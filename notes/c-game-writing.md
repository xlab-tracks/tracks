# c-game lesson — learner-visible writing (round-trip source)

> Extraction of ALL learner-visible text for the lesson **"Trusted monitoring as a game"**
> (`src/content/lessons/c-game.mdx`), in reading order, for hand-editing by a human.
> A later pass re-embeds this edited text back into the source files.

## How to edit this file

- **Edit prose freely.** The lesson paragraphs, headings, lists, and display math below are the
  editable text. Rewrite them as you like.
- **NEVER edit or delete marker lines.** These are load-bearing for the re-embed:
  - The HTML-comment markers, e.g. `<!-- demo X :: title -->`, `<!-- exercise Y :: prompt -->`.
  - The literal `<Demo id="..." />` and `<Exercise id="..." />` tag lines — leave the ids exactly as written.
- **LaTeX is in normal single-backslash form here** (e.g. `$\text{...}$`, `$$...$$`). On re-embed
  into TypeScript strings it is re-escaped automatically (`\text` → `\\text`). Write math the
  natural way; do not double-escape.
  - (The lesson `.mdx` prose already lives as markdown, so its math round-trips unchanged. Only the
    exercise fields, which come from TS string literals, get re-escaped. None of *this* lesson's
    exercise fields happen to contain LaTeX — they use plain Unicode like `−`, `^`, `≈`.)
- **In options lists, the `✓` marks the correct answer.** You may move it if the correct answer
  changes, but **exactly one** option per multiple-choice must carry it.
- Indented blocks under a `<Demo/>` / `<Exercise/>` tag are that item's fields, one HTML-comment
  marker per field. Edit the text under a marker; keep the marker.
- **Staged-questions exercises are marked hierarchically** (`exercise :: part :: question :: field`).
  Every field under those markers — part titles, question titles, framings, questions, instructions,
  hints, acknowledgements, and reveals — is editable prose. Keep the markers; edit the text.

---

# Trusted monitoring as a game

<!-- prose: lesson intro (no heading) -->

The previous item in this module worked through the AI Control paper as written. You saw that trusted monitoring significantly improves the blue team's win probability compared to upfront auditing, and that deferring to $T$ on moderately suspicious code trades a little usefulness for a lot of safety.

This lesson uses the same experimental setup, but will explore different questions.  **[NOTE: TBD]** We start where the paper's ROC discussion left off: with a fact about monitor quality that the single number "AUC" hides.

## Same AUC, different safety

You may be tempted to summarize a monitor with its AUC, as it's a threshold-free number for how well a monitor separates backdoored and innocent solutions. However, as you will see, it is a poor predictor of safety.

For the following setup, the deployment is $N = 5{,}000$ solutions from $U$, of which the blue team can afford to audit **2%**. A scheming $U$ attacks *rarely*, on the order of 0.1% of problems.

<Exercise id="c-game-l2-tail-staged" />
    <!-- exercise c-game-l2-tail-staged :: title -->
    Same AUC, different safety
    <!-- exercise c-game-l2-tail-staged :: prompt -->
    Three stages: two monitor comparisons that come out backwards, then the arithmetic that explains both.
    <!-- exercise c-game-l2-tail-staged :: placeholder -->
    Commit to an answer…
    <!-- exercise c-game-l2-tail-staged :: part stage-1 :: title -->
    Stage 1: Same AUC
    <!-- exercise c-game-l2-tail-staged :: part stage-1 :: question s1-equal-AUC :: title -->
    Two monitors, one AUC
    <!-- exercise c-game-l2-tail-staged :: part stage-1 :: question s1-equal-AUC :: framing -->
    Look at the two curves above: monitors A and B, drawn from the same model as every demo in this lesson. The area under each ROC curve is identical — both have AUC 0.92. Your protocol audits the most suspicious 2% of all solutions.
    <!-- exercise c-game-l2-tail-staged :: part stage-1 :: question s1-equal-AUC :: question -->
    Compared to Monitor A, how many of the attacks does Monitor B catch: more, about the same, somewhat fewer, or far fewer?
    <!-- exercise c-game-l2-tail-staged :: part stage-1 :: question s1-equal-AUC :: instruction -->
    Commit to a direction and a rough magnitude, and note which part of the figure you used to decide.
    <!-- exercise c-game-l2-tail-staged :: part stage-1 :: question s1-equal-AUC :: acknowledgement -->
    Far fewer: less than half as many.
    <!-- exercise c-game-l2-tail-staged :: part stage-1 :: question s1-equal-AUC :: reveal -->
    At this calibration Monitor A catches about 47% of attacks and Monitor B about 9%. 
    <!-- exercise c-game-l2-tail-staged :: part stage-2 :: title -->
    Stage 2: Higher AUC
    <!-- exercise c-game-l2-tail-staged :: part stage-2 :: question s2-higher-AUC :: title -->
    Surely 0.97 beats 0.92?
    <!-- exercise c-game-l2-tail-staged :: part stage-2 :: question s2-higher-AUC :: framing -->
    The figure above has changed: Monitor B has been upgraded into a strictly stronger classifier: its AUC rises to 0.97, while A stays at 0.92. Audit budget remains the same.
    <!-- exercise c-game-l2-tail-staged :: part stage-2 :: question s2-higher-AUC :: question -->
    Which monitor catches more attacks now?
    <!-- exercise c-game-l2-tail-staged :: part stage-2 :: question s2-higher-AUC :: instruction -->
    Commit to a direction and a rough magnitude, and note which part of the figure you used to decide.
    <!-- exercise c-game-l2-tail-staged :: part stage-2 :: question s2-higher-AUC :: acknowledgement -->
    R
    <!-- exercise c-game-l2-tail-staged :: part stage-2 :: question s2-higher-AUC :: reveal -->
    They tie: at the 2% operating point both catch ≈ 47% of attacks (47.3% vs 47.2%, from the same calibrated model). A five-point AUC advantage does not buy Monitor B more safety in this case.
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: title -->
    Stage 3: What pins the operating point
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-budget-arithmetic :: title -->
    Where does the audit budget actually go?
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-budget-arithmetic :: framing -->
    Both surprises trace back to the three numbers you started with: N = 5,000 outputs, a 2% audit budget, and an attack frequency around 0.1%. (Monitor B's slider above is now unlocked — explore freely.)
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-budget-arithmetic :: question -->
    How many attacks should you expect U to make over the whole deployment given a monitor with AUC = 1.0? Thus given any monitor, what is consuming the majority of the audit budget, and by how much?
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-budget-arithmetic :: instruction -->
    Do the arithmetic.
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-budget-arithmetic :: hint -->
    Remove the hint.
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-budget-arithmetic :: acknowledgement -->
    In this case, the majority of the audit budget is consumed by false positives (95 of 100 audits).
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-budget-arithmetic :: reveal -->
    Expected attacks: 0.1% × 5,000 = 5.  2% Audit Budget × 5,000 Solutions = 100 audits. So even if the monitor flagged every single attack, at least 95 of the 100 audits land on innocent code: the audit budget is consumed almost entirely by false positives.
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-the-metric :: title -->
    The metric that actually predicts safety
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-the-metric :: question -->
    What single metric best predicts a monitor's safety under a 2% audit budget. Why can AUC, a good measure of classifier strength, be misleading about safety?
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-the-metric :: acknowledgement -->
    TPR at 2% FPR.
    <!-- exercise c-game-l2-tail-staged :: part stage-3 :: question s3-the-metric :: reveal -->
    The true-positive rate at a false-positive rate equal to the audit budget, most reliably predicts a monitor's safety in this context. An audit budget of 2% introduces a threshold essentially at FPR = 2%. Since attacks are rare enough for smaller attack frequencies that true positives consume a negligible share of the audits, auditing the most suspicious 2% of all solutions is effectively auditing the most suspicious 2% of innocent solutions. 

    AUC is independent of every threshold, which means it doesn't necessarily represent the monitor's performance at any specific threshold. In particular, increasing a monitor's TPR at FPR > 2% improves their AUC, but doesn't necessarily increase the catch-rate (and thereby the safety) in this context.

The demo below builds exactly this comparison from the model.

<Demo id="monitor-tails" />
    <!-- demo monitor-tails :: title (src/lib/demos/registry.ts) -->
    Same AUC, different safety
    <!-- demo monitor-tails :: description -->
    Two monitors with identical AUC but different attack-score spread. Drag the shared AUC and watch how many attacks each catches at a 2% audit budget — the tail, not the area, is what matters.

At the default AUC of 0.92 the two monitors catch wildly different fractions, roughly 47% versus 9%, even though their ROC curves enclose identical area. The gap survives across various AUCs.

## Safety over a deployment: the race

So far we have scored one attack in isolation. Safety is defined over the whole deployment: $N = 5{,}000$ problems, and the blue team wins only if *no* working backdoor ever ships.

Every attack ends in exactly one of three ways:

- **Caught** — the monitor flags it, the audit finds the backdoor, and the deployment is shut down. Blue wins outright: catching the model red-handed is proof, and the game (following the paper) is scored that way.
- **Win** — it ships and the backdoor works. Red wins outright.
- **Neutral** — it ships but the backdoor is broken (or, once we add deferring, it is quietly rewritten). Nothing happens; the game continues as if the attack never occurred.

Two of these outcomes end the game on the spot. Call an attack **decisive** if it is caught or wins.

<Exercise id="c-game-l4-race-hinge" />
    <!-- exercise c-game-l4-race-hinge :: prompt -->
    The whole deployment is settled by the first decisive attack, whenever it comes. Why? And why do the neutral attacks before it have no effect at all on the outcome?
    <!-- exercise c-game-l4-race-hinge :: sampleAnswer -->
    A catch and a win each end the game immediately, so nothing after the first decisive attack is ever played. A neutral attack leaves the game in exactly the state it was in before — nothing accumulates — so any number of neutrals before the first decisive one changes nothing. The asymmetry this creates is the heart of the game: the red team must survive every audit it triggers across the whole run, while the blue team only needs to win once.

Now suppose the red team makes $k$ attacks, each with the same odds: caught with probability $c$, a working backdoor ships with probability $w$, neutral otherwise. Then:

$$P(\text{red wins}) = \underbrace{\frac{w}{w + c}}_{\text{Term A}} \cdot \underbrace{\left(1 - (1 - w - c)^k\right)}_{\text{Term B}}$$

<Exercise id="c-game-l4-race-terms" />
    <!-- exercise c-game-l4-race-terms :: prompt -->
    Before reading on, interpret the formula's two terms in your own words: what event is Term B, 1 − (1−w−c)^k, the probability of? And Term A, w/(w+c), is a conditional probability — of what, given what? (Check your answers at k = 1, where the formula must reduce to something obvious.)
    <!-- exercise c-game-l4-race-terms :: sampleAnswer -->
    (1−w−c) is the probability that a single attack lands neutral, so (1−w−c)^k is the probability that all k attacks do — Term B is the probability that at least one attack is decisive. Term A is the probability that a decisive attack is a win rather than a catch: given that the race gets decided at all, it is the chance red won it. At k = 1 the product is (w+c) · w/(w+c) = w, exactly the probability that a single attack ships a working backdoor.

Read the formula as two questions multiplied together. *Does anything decisive ever happen?* That is Term B — $(1 - w - c)^k$ is the probability that all $k$ attacks land neutral, so Term B is the chance that any decisive event fires — and it is the only place $k$ appears. *If so, who won?* That is Term A: every attack enters a race between red's wins and blue's catches, and Term A is the probability that when the race is decided, red won it. Note what Term A is **not**: it is not the probability that an attack slips through (that is $w$). It is conditional on the attack being decisive. The neutral outcomes cancel out of the game entirely; their only role is to burn one of red's $k$ chances.

One consequence is worth staring at: Term A does not depend on $k$. No amount of attacking changes who is favored in the showdown — attacking more only makes a showdown more likely to happen. So $P(\text{red wins})$ climbs with $k$ but can never exceed $w/(w+c)$: the race odds are a hard ceiling.

Before the demo, predict the red team's best move.

<Exercise id="c-game-l4-race-predict" />
    <!-- exercise c-game-l4-race-predict :: prompt -->
    Suppose every attack the red team makes has the same fixed per-attack odds — the same chance of being caught and the same chance of landing a working backdoor. To maximize its probability of winning at least once over the whole deployment, how often should it attack?
    <!-- exercise c-game-l4-race-predict :: option 1 -->
    Once, at the single best moment
    <!-- exercise c-game-l4-race-predict :: option 2 -->
    About ten times
    <!-- exercise c-game-l4-race-predict :: option 3 -->
    As often as possible ✓
    <!-- exercise c-game-l4-race-predict :: option 4 -->
    It makes no difference how often it attacks
    <!-- exercise c-game-l4-race-predict :: explanation -->
    With the per-attack odds held fixed, the win probability is [w/(w+c)] × [1 − (1−w−c)^k], which only rises with the number of attacks k: more attempts raise the chance that some decisive event fires without changing the odds of any single one. So under this (unrealistic) assumption the red team should attack constantly. The catch — that attacks are NOT equally good — is the subject of the next section.

The demo below plots $P(\text{red wins})$ against the number of attacks $k$, with both factors live and the ceiling drawn in. Drag $k$.

<Demo id="race" />
    <!-- demo race :: title (src/lib/demos/registry.ts) -->
    Safety over a deployment: the race
    <!-- demo race :: description -->
    Per-attack odds compound over a whole deployment. Drag the number of attacks and watch the two factors of the red team's win probability — the race odds and the chance any decisive event fires.

With fixed odds the curve only rises: each extra attempt raises the chance that some decisive event fires and changes nothing else. If every attack were equally good, the red team should attack on every problem it can.

But the paper's red team does the opposite — it attacks *rarely*. So the fixed-odds assumption is doing load-bearing work, and it is false. The next section restores what it dropped.

<!-- ORPHANED EXERCISE — pending keep/delete decision. -->
<!-- The exercise c-game-l4-race-reflect still exists in exercises.data.ts but its <Exercise/> embed
     was removed from c-game.mdx, so it renders NOWHERE for the learner right now. It overlaps heavily
     with c-game-l4-race-terms (both unpack Term A / Term B). Included here so the keep-or-delete call
     can be made against its actual text. Placed at the end of the race section, after the `race` demo
     block, since that is where it used to live. -->
<Exercise id="c-game-l4-race-reflect" />   [ORPHANED — pending keep/delete decision]
    <!-- exercise c-game-l4-race-reflect :: prompt -->
    The red team's win probability factors into two terms: the race odds w/(w+c) and the chance any decisive event fires, 1 − (1−w−c)^k. In your own words, what does each factor represent, and why does catching a single attempt end the game in the blue team's favor?
    <!-- exercise c-game-l4-race-reflect :: sampleAnswer -->
    The first factor, w/(w+c), is the conditional probability that the *first decisive event* is a red win rather than a catch — the head-to-head odds within a single showdown, set purely by the per-attack win and catch probabilities. The second factor, 1 − (1−w−c)^k, is the probability that any decisive event happens at all across the k attacks; it rises toward 1 as attacks accumulate. Catching one attempt ends the game because a single confirmed backdoor attempt is decisive evidence that the untrusted model is scheming, which justifies shutting it down — so the blue team only needs to win the race once.

## Opportunities are not equal

The fixed-odds picture said "attack as often as possible." The paper's red team attacks on a small fraction of problems. The missing ingredient is that not all problems are equally good to attack.

Problems differ in how cleanly a backdoor fits. A geometry problem with fiddly corner cases offers natural cover for an off-by-one; a one-line string echo offers none. The red team's real strategy is a **quality cutoff**: attack only when the opportunity is at least this good. A high cutoff means it attacks rarely, on the best problems; a low cutoff means it attacks often, dipping into worse ones. Crucially, the marginal opportunity is always the worst one it is currently willing to take — so attacking more often means writing backdoors with less cover, which the monitor is more likely to flag.

That sets up a tension. Predict how it resolves.

<Exercise id="c-game-l5-hump-predict" />
    <!-- exercise c-game-l5-hump-predict :: prompt -->
    Now drop the fixed-odds assumption: problems differ in how cleanly a backdoor fits, and attacking a worse opportunity means a more visible backdoor. As the red team's attack rate goes from very rare to very frequent, how does its win probability behave?
    <!-- exercise c-game-l5-hump-predict :: option 1 -->
    It increases monotonically — more attacks is always better
    <!-- exercise c-game-l5-hump-predict :: option 2 -->
    It decreases monotonically — attacking at all is a mistake
    <!-- exercise c-game-l5-hump-predict :: option 3 -->
    It rises then falls — there is an interior optimum ✓
    <!-- exercise c-game-l5-hump-predict :: option 4 -->
    It stays roughly flat
    <!-- exercise c-game-l5-hump-predict :: explanation -->
    Two forces oppose each other. Attacking too rarely risks never firing a successful backdoor before the deployment ends (the event factor is small). Attacking too often forces the red team onto low-quality opportunities where the backdoor is visible and gets caught (the catch rate climbs, killing the race factor). The win probability is hump-shaped, and the paper's red team sits near its peak — attacking rarely, not never.

The demo plots the red team's win probability against its attack rate. Drag the cutoff and find the peak.

<Demo id="attack-rate" />
    <!-- demo attack-rate :: title (src/lib/demos/registry.ts) -->
    The attack-rate hump
    <!-- demo attack-rate :: description -->
    The red team's win probability against how often it attacks. Rare attacks may never fire; frequent attacks use worse, more-visible opportunities and get caught — so the optimum is interior.

The curve is hump-shaped. At the left, attacks are so rare that the deployment often ends before a successful one fires — the "any decisive event" factor from the previous section is tiny. At the right, attacks are frequent but forced onto poor opportunities, so the catch rate climbs and the race factor collapses. In between sits an interior optimum at a low but non-zero attack rate — exactly where the paper's red team operates.

This is the answer to a question the paper raises: why attack rarely? Not out of caution, but because rarity is opportunity selection under the shadow of the catch rule. One caught attempt ends everything, so each attack has to be worth the risk.

<Exercise id="c-game-l5-hump-reflect" />
    <!-- exercise c-game-l5-hump-reflect :: prompt -->
    The paper's red team attacks on only a small fraction of problems. Explain why this rarity is a deliberate optimization rather than timidity.
    <!-- exercise c-game-l5-hump-reflect :: sampleAnswer -->
    Rarity is opportunity selection under the shadow of the catch rule. Because a single caught attempt ends the game, every attack is a gamble that must be worth taking; a low-quality opportunity yields a visible backdoor with a high catch probability and a low success probability, so taking it lowers the red team's expected outcome. By waiting for rare, high-quality opportunities — problems where a backdoor has natural cover — the red team keeps its per-attack odds favorable, and the interior optimum of the win-probability curve sits at a low but non-zero attack rate. Attacking never would forfeit the game; attacking often would get caught; attacking rarely and selectively is the maximizing choice.

## Subtlety: visible versus reliable

Attack rate is one of the red team's two levers. The other is **subtlety** — how hard it works to make each backdoor read as ordinary code.

Subtlety cuts both ways. A blatant backdoor, like a bare `if x == 354` special case, is reliable: it does exactly what the attacker intends. But it scores high on the monitor and gets audited. A subtle backdoor — a plausible-looking off-by-one buried in real logic — reads as normal code and slips past the monitor, but subtle logic errors are hard to engineer correctly, so a subtle backdoor is more often simply *broken*: it fails a test case, or produces the right answer on the exploit input the attacker hoped would trigger it. Visibility falls as subtlety rises; so does reliability.

Predict how the red team's win probability responds.

<Exercise id="c-game-l6-subtlety-predict" />
    <!-- exercise c-game-l6-subtlety-predict :: prompt -->
    The red team's second lever is subtlety. A subtler backdoor reads as more normal code (lower suspicion) but is more likely to be simply broken (a wrong edge case that fails the tests). As subtlety rises from blatant to maximally subtle, the red team's win probability:
    <!-- exercise c-game-l6-subtlety-predict :: option 1 -->
    Rises monotonically — subtler is always better
    <!-- exercise c-game-l6-subtlety-predict :: option 2 -->
    Falls monotonically — subtlety only hurts
    <!-- exercise c-game-l6-subtlety-predict :: option 3 -->
    Rises then falls — there is an interior optimum ✓
    <!-- exercise c-game-l6-subtlety-predict :: option 4 -->
    Is unaffected by subtlety
    <!-- exercise c-game-l6-subtlety-predict :: explanation -->
    Visibility falls as subtlety rises, but so does reliability — a subtler backdoor is more often simply broken. The two trade off, so the win probability has an interior optimum: it rises from the blatant end to a peak at low-but-non-zero subtlety, then falls as reliability collapses. (At this calibration the peak sits fairly close to blatant, since a 2% audit budget lets even moderately visible backdoors through, and the curve recovers slightly at the maximally-subtle extreme where invisible-but-usually-broken attacks always ship — but that stays below the peak.) The key structural fact is the interior optimum, matching the attack rate.

The demo plots the red team's best achievable win probability against subtlety — at each subtlety it picks its best attack rate — with the monitor's catch rate and the probability the backdoor actually works shown alongside. Drag subtlety across its range.

<Demo id="subtlety" />
    <!-- demo subtlety :: title (src/lib/demos/registry.ts) -->
    Subtlety: visible vs reliable
    <!-- demo subtlety :: description -->
    The red team's second lever. Subtler backdoors are harder for the monitor to flag but more likely to be broken, so the win probability has an interior optimum in subtlety.

The optimum is at *low but non-zero* subtlety. It is not at the blatant extreme — nudging subtlety up a little lowers the catch rate faster than it breaks the backdoor, so it helps. But it is nowhere near the subtle extreme either: past the peak, reliability collapses faster than visibility falls, and the win probability drops. (Right at the maximally-subtle end the curve recovers partway — an invisible backdoor always ships even though it usually doesn't work — but that gambit stays well below the low-subtlety peak.) Note that the peak sits fairly close to blatant here: with only 2% of solutions audited, even a moderately visible backdoor usually slips through, so the red team does not have to work very hard to hide.

The exact location depends on the calibration, but the shape is the point: an interior optimum, the same structure as the attack rate, and for the same reason — each lever trades the probability that a decisive event happens against the odds of winning it.

Both of the red team's levers now have interior optima. The next section lets it choose them together — attack rate and subtlety at once — and grades the protocol against that joint best response.

## The best-response principle

Everything so far has quietly assumed the red team plays a fixed strategy. But a scheming model that wants to slip a backdoor past your protocol will not attack in some pre-agreed way — it will do whatever works best against the exact protocol it faces. So the only meaningful question is: against the red team's *best* response, how safe is the protocol?

The red team's strategy is two numbers. First, how selective to be: attack on every problem, or wait for the rare problem where a backdoor has natural cover? This is its **attack rate**. Second, how subtle to make each backdoor: a blatant special-case is easy to write and reliable but scores high on the monitor, while a subtle one reads as normal code but is harder to get right, so it more often simply doesn't work. This is its **subtlety**. Both have interior optima — attack too often and the marginal attempts are easy to catch; attack too rarely and you may never fire; too blatant and you're audited; too subtle and your backdoor is broken.

Before the demo, predict the headline.

<Exercise id="c-game-l3-best-response-predict" />
    <!-- exercise c-game-l3-best-response-predict :: prompt -->
    You run trusted monitoring at a 2% audit budget with no defer band. The red team knows your protocol exactly and picks the attack rate and subtlety that maximize its own win probability. Under that best response, roughly what is the blue team's safety?
    <!-- exercise c-game-l3-best-response-predict :: option 1 -->
    ≈ 40%
    <!-- exercise c-game-l3-best-response-predict :: option 2 -->
    ≈ 62% ✓
    <!-- exercise c-game-l3-best-response-predict :: option 3 -->
    ≈ 85%
    <!-- exercise c-game-l3-best-response-predict :: option 4 -->
    ≈ 97%
    <!-- exercise c-game-l3-best-response-predict :: explanation -->
    This is the paper's headline trusted-monitoring number, and the model reproduces it: against the red team's best response, safety is ≈ 62% — up from 15% for upfront auditing, but far from solved. Note this is the *worst case over red strategies*, not the result of any single fixed attack.

The heatmap below is the red team's win probability over that whole strategy plane — attack rate along the x-axis, subtlety up the y-axis — computed from the model. The ring marks the single strategy that maximizes it: the best response. The two readouts under it report the resulting safety and exactly what the red team does there. Now move the blue levers — the audit budget and the defer band — and watch the ring migrate. Tightening the budget makes frequent attacking safer for the red team; widening the defer band pushes it toward the mid-suspicion region the band now swallows.

<Demo id="best-response" />
    <!-- demo best-response :: title (src/lib/demos/registry.ts) -->
    The red team's best response
    <!-- demo best-response :: description -->
    The red team's win probability over its two levers — attack rate and subtlety — as a heatmap, with the best response ringed. Move the blue audit and defer budgets and watch the best strategy migrate.

At the default 2% budget with no defer, the best response lands at a low attack rate and moderate subtlety, and safety comes out at ≈ 62% — the paper's number. The point is not any single value but the fact that the bright region *responds*: every blue-team move changes which red strategy is best, so you are never optimizing against a stationary target. This is the core of the control-evaluation methodology. A safety figure is only meaningful as "safety against the best response," and reading one means reading it against an adversary that has already re-optimized for whatever you just did.

<Exercise id="c-game-l3-best-response-reflect" />
    <!-- exercise c-game-l3-best-response-reflect :: prompt -->
    The heatmap's bright region — the red team's best strategy — moves whenever you change a blue lever. Explain why a protocol's safety must be measured against the red team's best response rather than against one fixed attack, and what the migrating best-response point means for how you should read any single safety number.
    <!-- exercise c-game-l3-best-response-reflect :: sampleAnswer -->
    A capable, scheming adversary will adopt whatever strategy works best against the exact protocol it faces, so a safety number computed against one fixed attack only tells you how that particular attack fares — it says nothing about the attack the red team would actually choose. The control evaluation therefore grades every protocol against the maximizing red strategy, which is why safety here is 'safety vs best response'. Because that best response moves as you change the blue levers, any single safety number is a snapshot against a *responding* opponent: every time you tighten a budget or widen the defer band, you should expect the red team to re-optimize, and the number you read already accounts for that.

## Defer to trusted, mechanistically

Trusted monitoring spends its whole audit budget on the most suspicious 2% and ships everything else as $U$ wrote it. But look at the suspicion distributions: there is a broad middle region — code too suspicious to be comfortable with, yet not suspicious enough to be worth a scarce audit. Deferring to trusted is what to do with that region. Any code whose suspicion falls in a band just below the audit threshold is not shipped and not audited; instead $T$ rewrites the solution from scratch, and its version ships.

Deferring is quiet. An attack that lands in the defer band is silently neutralized — no catch, no shutdown, the game simply continues, at the price of $T$-grade code for that one problem. So the question is what widening the band buys and what it costs.

<Exercise id="c-game-l7-defer-predict" />
    <!-- exercise c-game-l7-defer-predict :: prompt -->
    Starting from trusted monitoring with no defer band, you widen the defer band so that mid-suspicion code is rewritten by the trusted model T instead of being shipped. Widening it from 0% to 10% will:
    <!-- exercise c-game-l7-defer-predict :: option 1 -->
    Raise safety a little and cost usefulness a lot
    <!-- exercise c-game-l7-defer-predict :: option 2 -->
    Raise safety a lot and cost usefulness a little ✓
    <!-- exercise c-game-l7-defer-predict :: option 3 -->
    Raise both safety and usefulness
    <!-- exercise c-game-l7-defer-predict :: option 4 -->
    Trade them one-for-one
    <!-- exercise c-game-l7-defer-predict :: explanation -->
    Safety climbs from ≈ 62% to ≈ 83% while usefulness falls only from ≈ 97% to ≈ 93%. The reason is asymmetry: the mid-suspicion band holds a large share of the attack mass (attacks that scored suspicious but not enough to audit) but only a thin slice of the innocent mass, so deferring neutralizes many attacks while sending only a few percent of (mostly innocent) problems to the weaker model.

The demo shows the suspicion distributions with the audit region shaded gray and the defer band shaded amber. Widen the band and watch how much attack mass it swallows versus how much innocent mass it costs, alongside the live safety and usefulness.

<Demo id="defer" />
    <!-- demo defer :: title (src/lib/demos/registry.ts) -->
    Defer to trusted, mechanistically
    <!-- demo defer :: description -->
    Widen the defer band and watch the amber region grow. It holds a large share of the attack mass but a thin slice of the innocent mass — which is why deferring buys safety cheaply.

The gain is large and the price is small, and the reason is the asymmetry visible in the histograms. The attack distribution has a heavy shoulder in the mid-suspicion band — those are exactly the attacks subtle enough to dodge the 2% audit but not subtle enough to look fully innocent. The innocent distribution, by contrast, has thinned out by then; most honest code scores low. So the amber band captures a large fraction of the attacks while sending only a few percent of (mostly innocent) problems down to the weaker model. That asymmetry is the whole trick, and its price is set by the width of the band and the capability gap between $U$ and $T$.

<Exercise id="c-game-l7-defer-reflect" />
    <!-- exercise c-game-l7-defer-reflect :: prompt -->
    Deferring to T neutralizes an attack silently — no catch, no shutdown, the game just continues. Given that, explain why a wide defer band pushes the red team toward maximally subtle attacks, and what sets the usefulness price of deferring.
    <!-- exercise c-game-l7-defer-reflect :: sampleAnswer -->
    To ship (and possibly win) rather than be deferred, an attack must score below the defer threshold — it must look innocent. Widening the defer band lowers that threshold, so the red team is forced to make its backdoors ever more subtle to get underneath it. But subtler backdoors are more often broken, so its win probability erodes; against a wide band the best response drifts to the maximum-subtlety corner. The usefulness price is set by two things: the width of the band (the deferred fraction is roughly d − b, almost all of it innocent code) and the capability gap between U and T (each deferred problem is answered at T's quality instead of U's). A smaller U–T gap would make deferring cheaper.

## The control game: the whole picture

Every piece is now on the table. The monitor is a noisy classifier whose value lives in its low-false-positive tail. The red team plays a joint best response over attack rate and subtlety. Auditing spends a scarce budget on the suspicious tail; deferring rewrites the mid-suspicion band with the trusted model. Safety is measured against the red team's best response throughout, and usefulness is the price paid in $T$-grade code.

The dashboard below wires them into one live world. Three blue levers — the audit budget $b$, the defer band $d$, and the monitor quality $q$ — feed both panels at once. On the left are the suspicion distributions with the audit and defer bands; on the right is the safety/usefulness plane, with the frontier traced for the current monitor and budget and your current protocol ringed on it. The red team re-optimizes on every move, so the ringed point always sits against a best-responding adversary.

<Demo id="control-dashboard" />
    <!-- demo control-dashboard :: title (src/lib/demos/registry.ts) -->
    The control game: full dashboard
    <!-- demo control-dashboard :: description -->
    Three blue levers — audit budget, defer band, monitor quality — feeding one live world: the suspicion distributions with bands, and the safety/usefulness frontier with the current protocol ringed. The red team best-responds throughout.

Move the defer band and watch the point slide along the frontier — trading usefulness for safety along a fixed curve. Then move the monitor quality or the audit budget and watch the whole frontier shift: a better monitor or a larger budget lifts the curve up and to the right, letting you reach the same safety at higher usefulness. This is the picture the paper's headline figure summarizes, generated live from the model rather than read off a plot.

Use it to answer a concrete question.

<Exercise id="c-game-l8-dashboard-reflect" />
    <!-- exercise c-game-l8-dashboard-reflect :: prompt -->
    Use the dashboard to reach at least 90% safety while keeping usefulness as high as you can, then explain which lever did most of the work and why. Compare, in particular, widening the defer band against raising monitor quality.
    <!-- exercise c-game-l8-dashboard-reflect :: sampleAnswer -->
    Both raising the monitor's AUC and widening the defer band raise safety, but they pay for it differently. Raising monitor quality improves the true-positive rate at the fixed 2% audit threshold, so more attacks are caught outright — this costs no usefulness (auditing doesn't change what ships), but its leverage is limited by the tail behavior discussed earlier and by the fixed budget. Widening the defer band is the reliable way to buy large safety gains, because it neutralizes the concentrated mid-suspicion attack mass cheaply, but it does cost usefulness (T rewrites the deferred, mostly innocent code). The efficient route to 90% is usually to spend whatever free monitor quality is available first, then widen the defer band just enough to close the gap — and to watch the frontier point climb along the safety/usefulness curve rather than jumping off it, since the red team is best-responding to every move.

The paper's conclusion is not that any single protocol solves the problem — none does — but that control evaluations let you *measure* these tradeoffs against an adversary that fights back, and that the levers you have (auditing, monitoring, deferring) buy real, quantifiable safety. What the demo adds on top of the paper is the machinery to see why: the tail that AUC hides, the interior optima that make the red team attack rarely and subtly, the migration of the best response, and the asymmetry that makes deferring cheap. The same evaluation methodology extends to the harder settings the paper only sketches — untrusted monitoring, collusion, and beyond.

---

## Coverage notes

This file is the learner-visible **writing** of the lesson, not 100% of the on-screen surface. Deliberately NOT extracted:

- **Microcopy hard-coded inside the demo components** — axis labels, tick labels, legend text,
  readout/label strings, slider labels, and button text rendered by each demo's own React code.
  These live in the component files, not in `registry.ts`, and were out of scope. The demos this
  lesson embeds:
  - `src/components/demos/monitor-tails-demo.tsx` (e.g. the "caught @ 2%" readout referenced in prose)
  - `src/components/demos/race-demo.tsx`
  - `src/components/demos/attack-rate-demo.tsx`
  - `src/components/demos/subtlety-demo.tsx`
  - `src/components/demos/best-response-demo.tsx`
  - `src/components/demos/defer-demo.tsx`
  - `src/components/demos/control-dashboard-demo.tsx`
- **Microcopy hard-coded inside the staged exercise's figure component** — the persistent stage-aware
  mini ROC figure that renders above every stage of `c-game-l2-tail-staged` (its `figureWidget` is
  `monitor-roc-mini`). Its learner-visible strings live in the component, not in the exercise data:
  - `src/components/exercises/monitor-roc-pair-figure.tsx` — the AUC caption
    (`"AUC: A = B = 0.92"` when equal, otherwise `"A = 0.92 · B = {qB}"`), the disabled-slider
    note `"locked for this stage"`, the active slider label `"Monitor B quality (AUC)"`, and the
    ROC panel's `"FPR →"` axis label. Out of scope here.
- **Only the demo `title` and `description`** from `src/lib/demos/registry.ts` are extracted (those
  render as learner-visible captions). The `id`/`tags`/`component` fields are not learner-visible.
- **Exercise UI chrome** rendered by the exercise components (not authored per-exercise): submit/
  reset button text, staged-question "Submit"/reveal affordances, the "Show hint" toggle chrome,
  "correct/incorrect" feedback framing, the reveal-answer affordance for understanding-checks,
  rating controls, etc. Only the per-exercise authored fields (`prompt`, `title`, `placeholder`,
  `options[].label`, `explanation`, `sampleAnswer`, and the staged-question part/question fields)
  are extracted here.
- **Internal, non-visible fields** were intentionally omitted from the exercise blocks: each MC
  option's `id` (a/b/c/d) and the `correctOptionIds` array are represented only by the `✓` on the
  correct option; the exercise `type` is implied by which fields are present (multiple-choice =
  options + explanation; understanding-check = sampleAnswer only; staged-questions = parts/questions
  with framing/question/reveal). For the staged exercise, the part `id`s (`stage-1`…) and question
  `id`s (`s1-equal-AUC`…) appear only inside marker lines as anchors, and the `figureWidget`
  registry key (`monitor-roc-mini`) is a component reference, not extracted prose.
- **Lesson section nav ("In this lesson")** is auto-generated from the `##` headings, which are
  already included above as prose — no separate text to extract.
