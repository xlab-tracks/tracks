# Efficient-tradeoffs paper — activity catalog & integration record

**Date:** 2026-07-18 · **Branch:** `mod-2` · **Status:** catalog complete;
integration = splicing the two existing purpose-built demos. Internal record.

## Process

Every paragraph of the paper (artifact
`blog.redwoodresearch.org__efficient-tradeoffs-and-the-safety`, blocks
b-0001–b-0045) was cataloged by four section readers for spots where a
demo, exercise, or visualization would help; each of the 10 resulting
candidates then faced two independent skeptics — a **necessity** skeptic
(does prose + the paper's own figure b-0002 suffice?) and a **redundancy**
skeptic (does an existing demo already teach this?). A candidate had to
survive both to be built.

## Outcome: zero new builds survived — deliberately

All 10 candidates were killed, for recurring reasons worth recording:

- **The paper's own figure carries its core structure.** b-0002 already
  draws the tradeoff curve and both levers; interactive variants added
  motion, not understanding.
- **The two big ideas already have purpose-built demos.** `two-levers` was
  built from this paper's two-ways passage (b-0003–b-0007, via the lesson
  that restates it); `will-account` mechanizes the limited-political-will
  regime (fading/spiking will, prices, durable policy floors). Every
  "efficient vs distorted selection" candidate reduced to re-sorting a
  list by a different key — tautological interaction.
- **Weight mismatch.** Several candidates targeted two-sentence flagged
  asides (capability-research-increases-budget, updating-on-P(scheming));
  building apparatus for asides inverts the paper's own emphasis.
- **Exercise candidates restated adjacent prose.** Each proposed check had
  its answer stated in the same or neighboring sentence in the source.

This is the necessity bar working as intended: a 2,600-word conceptual
post with one quantitative structure, already visualized twice, does not
need a third treatment.

## Integration (the part that IS justified)

The paper ships as a plain reading while the two demos built from its
territory sit only in the lesson/gallery. Spliced via `Paper.edits`:

| Demo | Where | Why there |
| --- | --- | --- |
| `two-levers` | after block `b-0007` (end of the two-ways list, snippet "Safety budget increase: increase") | the demo's two buttons are exactly the two bullets just read |
| `will-account` | `sectionEnd: sb-sec-limited-political-will` | the game mechanizes the section's subject: will that fades, spikes on evidence, prices set by the regime, policy floors |

Both demos' copy was fidelity-verified against `c-regimes-l1.mdx`, which
restates this paper's framing (the lesson cites it as the source of the
two levers). No paper text is hidden or modified; the splices only add.

## Addendum: short/long-answer sections (S1 + a preference question WIRED with author-approved wording, 2026-07-18; L1 still proposed; the will-account paper splice was removed by the author)

Wired: `c-et-two-ways-preference` (author's wording: which of the two ways
would you prefer, pros & cons) after the two-ways list alongside the
`two-levers` demo — which is now slider-driven, not button-driven — and
`c-et-rushed-apply` (S1 below, approved) at the end of §Rushed reasonable
developers.

Writing sections are a different design space from the killed exercise
candidates: those died because their answers sat in adjacent prose, which
invalidates recall checks but not **generative** writing. The paper itself
supplies the mandate — b-0025: *"I think it was a healthy exercise for me
and Ryan to spend a bunch of time in this frame… focusing on this frame
disciplined our thinking towards better tradeoffs."* The discipline only
happens by doing it. Writing sections also inherit the full grader
pipeline (transparency rubric table, edit-after-grading, own-key grading).

Proposed dose: **one short + one long** — three writing breaks in a
13-minute read is too heavy, and the limited-political-will section
already gets the will-account game.

**S1 · short-answer, end of §Rushed reasonable developers**
(`sectionEnd: sb-sec-rushed-reasonable-developers`). Draft prompt:
> Take the rushed reasonable developer's perspective, as the post
> recommends: propose one safety intervention you would actually
> implement, name the usefulness cost it imposes, and say why the safety
> gain justifies that cost at the margin.
Grounding: b-0019 (the developer chooses efficiently however safety is
defined), b-0025 (impractical-suggestions complaint; the frame as
discipline). ~40–120 words.

**L1 · writing-prompt (memo), end of §Overall thoughts**
(`sectionEnd: sb-sec-overall-thoughts` — before the appendix). Draft
prompt, operationalizing b-0025's exercise:
> Spend time in this frame, as the post recommends. As the safety lead at
> a rushed reasonable developer: (1) with a large safety budget, which
> interventions do you buy first, and why those? (2) When the budget
> shrinks sharply, what do you drop and what survives? (3) Name one safety
> suggestion you have seen (or made) that this frame reveals as
> impractical, and say what its proposer missed about the tradeoff.
Sections: large-budget / small-budget / the-frame-at-work. Format `memo`,
minWords ~150.

**S2 (optional, weakest) · short-answer appended after the will-account
splice** in §Limited political will, on influence mechanisms
(b-0029–b-0030: who ends up choosing the interventions). Deferred by
default — the game already engages that section.

Mechanics when approved: exercise defs in `exercises.data.ts`
(`cet-rushed-apply`, `cet-budget-frame`); splice via the existing
activity op (exercises are not completion units, so paper progress is
unaffected); writing types get autosave/submit/reopen + transparency
grading automatically; consider bumping `estimatedMinutes` 13 → ~22.
Prompts above are DRAFTS by the assistant — curriculum wording, so they
ship only after the author approves or edits them.
