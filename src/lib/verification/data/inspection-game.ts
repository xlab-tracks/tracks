/**
 * Copy for the "Inspection Game" widget — the `COPY` object lifted VERBATIM
 * from the `<script id="ig-copy">` block in
 * public/verification/inspection-game.html. Every string, template function,
 * and facilitator note is copied exactly; do not paraphrase or re-author (this
 * is human-authored curriculum). The static engine CONFIG lives in
 * src/lib/verification/engines/inspection-game.ts.
 */

export const INSPECTION_GAME_COPY = {
  stages: [
    "Briefing",
    "Quarters 1 to 5",
    "The Announcement",
    "The Hidden Site",
    "Role Flip",
    "Debrief",
  ],
  stageNotes: [
    "Stage 1 of 6 · read in",
    "Stage 2 of 6 · place teams by hand",
    "Stage 3 of 6 · commit to a policy",
    "Stage 4 of 6 · quarters 8 to 10",
    "Stage 5 of 6 · play the other side",
    "Stage 6 of 6 · what your play said",
  ],
  s0head: "Two teams, five sites",
  s0body:
    '<p class="sub">Each declared site is worth a different amount to Pacifica if a diversion runs there undetected (the card shows it as <b>G</b>). A caught diversion costs Pacifica a fine of <b>F = 150</b> in the same units. Under each card is the site\'s [[deterrence threshold]]: the fraction of quarters you would have to cover it to make cheating there break even. Notice the thresholds sum to barely more than one team. The arithmetic says two teams can deter all five sites. The game is about what it takes to actually collect on that arithmetic.</p>',
  s0after:
    "Ten quarters. Quarters 1 to 5 you place teams by hand and Pacifica studies you. From quarter 6 you may commit to an announced policy. Somewhere along the way, expect the game to move.",
  begin: "Begin quarter 1 →",
  s1head: "Place your two teams",
  s1sub:
    "Pick two sites, then run the quarter. Inspection results are immediate; the full truth about each quarter arrives on a one-quarter [[truth lag]]. Pacifica is watching where you go and betting on where you will not.",
  run: "Run quarter",
  teamsPicked: (n: number, k: number) => n + " of " + k + " teams placed",
  tipLabel: {
    broker: "TIP · THE BROKER (right about 60% of the time)",
    insider: "TIP · THE INSIDER (right about 70% of the time)",
  } as Record<string, string>,
  tipSite: (name: string) =>
    "Word is Pacifica moves on <b>" + name + "</b> this quarter.",
  tipQuiet: "Word is Pacifica sits this quarter out entirely.",
  resClear: (sites: string) => "Teams at " + sites + ". Nothing found.",
  resCaught: (sites: string, site: string) =>
    "Teams at " +
    sites +
    ". <b>Diversion caught at " +
    site +
    ".</b> The fine lands: 150.",
  lateCheat: (q: number, site: string) =>
    "Counter-intel on Q" +
    q +
    ": a diversion ran at <b>" +
    site +
    "</b>. Your teams were elsewhere.",
  lateQuiet: (q: number) =>
    "Counter-intel on Q" + q + ": quiet quarter, no diversion attempted.",
  lateCaught: (q: number) =>
    "Counter-intel on Q" + q + ": the diversion you caught was the only one.",
  s2head: "Quarter 6: say it out loud",
  s2body:
    '<p class="sub">New authority from the accord council: you may <b>publicly commit</b> to a randomized inspection policy. Set the fraction of quarters each site gets covered. The sliders must spend exactly your two teams (sum = 2.00). Pacifica reads the announcement and does its own [[expected value]] arithmetic, shown live per site. Push every site\'s EV to zero or below and cheating stops paying anywhere. This is the difference between [[secrecy and commitment]].</p>',
  evLine: (v: number) => "EV of cheating: " + (v > 0 ? "+" : "") + v.toFixed(1),
  sumLine: (s: number, k: number) =>
    "Coverage committed: " + s.toFixed(2) + " of " + k.toFixed(2) + " teams",
  announceBtn: "Announce and commit",
  announcedDeterred:
    "<b>Pacifica goes quiet on the declared sites.</b> With the numbers public there is nothing to estimate and nothing to probe. Every declared diversion is now a losing bet, and Pacifica knows you know it. Auto-deploying by lottery each quarter.",
  announcedWeak: (site: string) =>
    "<b>Pacifica finds the hole.</b> Your announced numbers leave <b>" +
    site +
    "</b> profitable, and an announced gap is a guaranteed gap. Expect traffic there. You are committed to this policy through quarter 10.",
  autoRun: "Run quarter (auto-deploy)",
  s3head: "Quarter 8: the game moves",
  intelCovert:
    "<b>INTEL.</b> Thermal and procurement signatures point to an undeclared facility in Pacifica's interior, provisionally <b>Site Nightjar</b>. Your declared-site policy does not reach it. You may divert one team each quarter to sweep for it (40% chance per swept quarter of confirmation). The team you divert comes off the declared lottery.",
  intelNone:
    "<b>INTEL.</b> Counter-intelligence finds no covert construction. Analysis: your announced policy left declared cheating profitable, so Pacifica has no reason to spend more building off the books. The cheap evasion is still on the table you set.",
  sweepLabel: "Divert one team to sweep for Site Nightjar this quarter",
  sweepFound:
    "<b>Site Nightjar confirmed.</b> Inspectors document an unmonitored training cluster mid-construction. The accord's enforcement clause triggers: the fine lands, the site is sealed, and the sweep authority you spent a team on just paid for itself.",
  sweepMiss:
    "The sweep comes back empty. Nightjar, if it exists, stays dark.",
  noSweepClose:
    "You kept both teams on the declared sites through quarter 10. Whatever Nightjar is, it is still running.",
  foundClose: "With Nightjar sealed, both teams return to the declared lottery.",
  s4head: "Now be Pacifica",
  s4sub:
    "Three quarters on the other side. The machine inspector has published its policy, scaled so every site sits above its deterrence threshold. Coverage odds per site are shown below. Pick your move each quarter; the EV of each option is exactly computable, which is rather the point.",
  flipQ: (n: number, total: number) => "Flip quarter " + n + " of " + total,
  flipComply: "Comply (0)",
  flipCheatAt: (name: string, ev: number) =>
    "Divert at " + name + " (EV " + ev.toFixed(1) + ")",
  flipCaught: (name: string) => "Caught at " + name + ". Fine: -150.",
  flipGot: (name: string, g: number) =>
    "Slipped through at " +
    name +
    ": +" +
    g +
    ". A negative-EV bet that happened to pay. The book still says stop.",
  flipComplied:
    "You complied. Nothing gained, nothing risked. Under this policy that is the best available move, which is the whole design.",
  tally: (v: number) =>
    "Your running take as Pacifica: " + (v > 0 ? "+" : "") + v,
  toDebrief: "To the debrief →",
  s5head: "What your ten quarters said",
  s5sub: "No score. Four readings of your play, computed from the record.",
  againBtn: "Play again (new seed)",
  d1head: "1 · Did you price deterrence?",
  d1body:
    "Coverage only deters when it clears each site's threshold p* = G / (G + F). Bars show your realized coverage across all ten quarters; the black mark is the threshold. Value should pull coverage: the lab needs almost twice the attention the array does.",
  d1ok: "Every site cleared its threshold. That is the profile of a directorate pricing risk rather than chasing headlines.",
  d1short: (names: string) =>
    "Short at " +
    names +
    ". Shortfall below p* is not partial credit; below the line, cheating there is profitable every single quarter.",
  d2head: "2 · Were you predictable?",
  d2neverCheated: (h: string) =>
    "Mean placement entropy " +
    h +
    ". Pacifica never attempted a diversion in your manual quarters. Its belief tracker found no gap worth the fine, which is what disciplined randomization buys.",
  d2patterned: (h: string) =>
    "Mean placement entropy " +
    h +
    ". Pacifica struck while your recent placements were patterned, and it struck where you were not standing. An evader does not need your plan; it needs your habit.",
  d2noise: (h: string) =>
    "Mean placement entropy " +
    h +
    ". You randomized well, and Pacifica gambled anyway on a cold streak in its estimates. That risk never goes to zero under secrecy: the evader must estimate your mix from samples, and samples run hot and cold. Note what fixed it in stage 3: commitment, not better dice.",
  d3head: "3 · Saying it out loud",
  d3deterred:
    "Your announcement pushed every declared EV to zero or below and compliance was immediate. Secrecy makes the evader estimate your coverage, and estimation error is opportunity; commitment deletes the estimate. The catch: a promise only deters if breaking it is visible, which is why the accord had to grant the authority before you could use it.",
  d3weak: (site: string) =>
    "Your announcement left " +
    site +
    " EV-positive, and an announced hole is worse than a secret one: you handed over the target list. The fix costs nothing but slider position; the thresholds sum to 1.13 teams and you had 2.00 to spend.",
  d3tips: (n: number, gen: number, followed: number, burned: number) =>
    "Tips: " +
    n +
    " received, " +
    gen +
    " genuine. You covered the named site " +
    followed +
    " time(s) and were burned by a false tip " +
    burned +
    " time(s). At 60 to 70 percent reliability a tip should tilt your lottery, not replace it.",
  d3noTips: "No tips arrived this run. The lottery had to carry the load alone.",
  d4head: "4 · The game moved, and the fine did the work",
  d4foundBranch:
    "When declared sites stopped paying, the incentive went underground, and your sweep caught it. Verification did not end the game; it moved the game somewhere more expensive, and you followed.",
  d4missBranch:
    "When declared sites stopped paying, the incentive went underground, and Nightjar outlasted your ten quarters. Declared-site verification is necessary, not sufficient; the undeclared-facility problem is where real regimes go to struggle.",
  d4noCovert:
    "Pacifica never went underground, because it never had to: declared cheating stayed profitable. A regime that does not bind does not even push the game off the books.",
  d4flip: (tally: number) =>
    "As Pacifica you finished at " +
    (tally > 0 ? "+" : "") +
    tally +
    ". Every diversion on offer was EV-negative; whatever the dice did, the book said stop. Sit with how that felt. That feeling is deterrence, from the inside.",
  d4formula: "p* = G / (G + F)",
  d4close:
    "The threshold is small because the fine is large. Double the fine and every threshold halves; gut the enforcement clause and no amount of inspection budget saves you. Coverage and consequences are the two dials, and this whole exercise turned only one of them.",
  facsum: "Facilitator notes and debrief prompts",
  facNotes: [
    "<b>The arithmetic is the anchor.</b> Sum of thresholds = 1.13 teams; budget = 2. Ask the room why anyone ever gets away with anything if deterrence is this affordable. The answers (estimation under secrecy, commitment authority, undeclared sites) are the course.",
    "<b>Watch for threshold players.</b> Some learners set sliders to exactly p* everywhere and bank the slack. Ask what a zero-EV evader does when a real-world shock adds noise. Slack above the threshold is robustness, not waste.",
    "<b>The role flip is the empathy beat.</b> Learners who breezed through as inspector often hesitate as Pacifica, then comply. Name it: a well-built regime is boring to be inside.",
    "<b>Tips split the room usefully.</b> Following a 60 percent tip with both teams is a coverage collapse dressed as decisiveness. Ask who tilted versus who lurched.",
    "<b>Nightjar is the exit question.</b> Declared-site verification worked, so the game moved. What is the Nightjar of a compute-verification regime: unreported clusters, offshore training, algorithmic efficiency? There is no slider for what you cannot see.",
  ],
  terms: {
    diversion:
      "A prohibited use of a declared site: training past the accord's compute line while reporting compliant workloads.",
    "deterrence threshold":
      "p* = G / (G + F): cover a site at least this fraction of quarters and the expected value of cheating there drops to zero or below.",
    "expected value":
      "Probability-weighted average outcome. For a cheat: (1 - p) x gain - p x fine, where p is the coverage the evader believes it faces.",
    "secrecy and commitment":
      "Hidden randomization must be estimated from your track record, and estimates have error an evader can gamble on. A public, verifiable commitment removes the estimate.",
    "truth lag":
      "Full truth about a quarter arrives one quarter later, from counter-intelligence.",
  } as Record<string, string>,
} as const;
