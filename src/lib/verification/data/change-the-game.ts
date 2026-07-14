/**
 * Copy + presentation data for the "Change the Game: The Race Dilemma Lab"
 * widget — lifted verbatim from public/verification/change-the-game.html (the
 * COPY object) and public/verification/content/change-the-game.json. Do not
 * re-author, paraphrase, shorten, or translate any string: this is
 * human-written curriculum. The numeric CONFIG lives in
 * ../engines/change-the-game.ts (the normative model).
 *
 * Simple <b>/<i> HTML tags in strings and [[term]] / [[display|term]] tooltip
 * markup are preserved exactly as authored.
 */

export const CTG_COPY = {
  nav: {
    phases: ["Feel the bind", "See the trap", "The lab", "Debrief"],
    skip: "Skip ahead →",
    phaseKicker: "Phase {n} of 4",
  },
  tips: {
    payoff: "A number for how good an outcome is for one side. Higher is better.",
    "dominant strategy":
      "A move that is your best choice no matter what the other side does.",
    equilibrium:
      "A pair of choices where neither side can do better by changing only its own move.",
    "prisoner's dilemma":
      "A game where betrayal beats cooperation for each side, yet mutual betrayal leaves both sides worse off than mutual cooperation.",
    "assurance game":
      "A game where mutual cooperation is stable as long as each side expects the other to cooperate.",
    deadlock:
      "A game where both sides simply prefer conflict. Neither wants mutual cooperation at all.",
    chicken:
      "A game where each side wants the other to yield first. Giving in is bad, but a head-on collision is worse.",
    harmony:
      "A game where cooperating is each side's best move no matter what. No enforcement needed.",
    "best response":
      "The move that gives you the highest payoff, given what you expect the other side to do.",
    "shadow of the future":
      "How much you weigh future rounds against today. A long shadow makes tomorrow's punishments matter now.",
    "national outcome":
      "An abstract score for how well things go for a state. Not dollars. Higher is better.",
    verification:
      "Any way of checking whether the other side is keeping the deal, from inspections to monitoring compute.",
    expected: "An average over chance. A 50% shot at 10 counts as 5.",
    "winner shares risk":
      "If a rogue superintelligence harms everyone, winning the race doesn't protect you.",
    "penalty if caught": "Sanctions, lost trade, coalition response.",
  } as Record<string, string>,
  p1: {
    h2: "Feel the bind",
    intro1:
      "You lead <b>Atlantia</b>. Your rival is <b>Pacifica</b>. Both states could push past the agreed limits on frontier AI development, and each suspects the other might.",
    intro2:
      "Each round you choose: <b>Restrain</b>, hold to the limits, or <b>Race</b>, push ahead covertly. No numbers yet. Just decide, five times, against three different Pacifica governments.",
    begin: "Start round 1",
    roundLabel: "Round {n} of 5",
    personaLabel: "Across the table",
    personas: {
      cautious: {
        name: "“Cautious” Pacifica",
        intro:
          "This government keeps deals. Its ministers say they will restrain as long as you do. They also say they never forgive a betrayal.",
      },
      opportunist: {
        name: "“Opportunist” Pacifica",
        intro:
          "This government respects only consequences. If it expected to get caught, it would behave. Right now, nobody is watching.",
      },
      mirror: {
        name: "“Mirror” Pacifica",
        intro:
          "This government studies you. Whatever you did last round, it does back to you this round.",
      },
    },
    prompt: "Your move.",
    choices: {
      restrain: {
        label: "Restrain",
        icon: "▣",
        desc: "Hold to the agreed limits on frontier development.",
      },
      race: {
        label: "Race",
        icon: "▶",
        desc: "Push ahead covertly and go for the lead.",
      },
    },
    outcomes: {
      race_restrain:
        "You raced. Pacifica restrained. You gained the lead, and Pacifica noticed.",
      restrain_restrain:
        "You both restrained. Development stayed inside the limits. Slow, steady, and nobody fell behind.",
      restrain_race:
        "You restrained. Pacifica raced covertly. You held the line and lost ground for it.",
      race_race:
        "You both raced. Corners got cut on both sides, and neither of you gained a step.",
    } as Record<string, string>,
    reactions: {
      cautiousLoyal: "Pacifica keeps to the deal, and keeps watching.",
      cautiousBetrayed:
        "Something hardened in Pacifica's cabinet. They will not trust you again.",
      opportunist: "Nobody could catch them, so they never intended to hold back.",
      mirror: "They copied your previous move, exactly as promised.",
    } as Record<string, string>,
    next: "Next round",
    finish: "See the pattern",
    recapTitle: "Your five rounds",
    youWord: "You",
    pacWord: "Pacifica",
    moveWords: { restrain: "restrained", race: "raced" } as Record<string, string>,
    summary:
      "Notice the pull. Whatever Pacifica does, racing looked safer. Now let's see why.",
    toP2: "Show me the numbers",
  },
  p2: {
    h2: "See the trap",
    intro:
      "Here are the numbers that were hiding under those five rounds. Each cell shows the [[national outcome]] for you and for Pacifica. Higher is better.",
    q1: "If Pacifica restrains, which is better for you?",
    q2: "If Pacifica races, which is better for you?",
    ansRestrain: "Restrain: you get {n}",
    ansRace: "Race: you get {n}",
    fbRight: "Yes. {hi} beats {lo}. {tail}",
    fbWrong: "Check the numbers. {hi} beats {lo}. {tail}",
    tail1: "If Pacifica restrains, racing pays you more.",
    tail2: "If Pacifica races, racing still loses you less.",
    continueBtn: "Continue",
    conclusion:
      "Racing wins both comparisons. That makes it a [[dominant strategy]]: your best move no matter what Pacifica does. And Pacifica faces the same numbers, so it reasons the same way.",
    revealEq: "So where does this land?",
    eqCaption:
      "Both sides reason the same way. Both land here. Both ranked this below mutual restraint. This structure has a name: the [[Prisoner's Dilemma|prisoner's dilemma]]. An [[equilibrium]] is not a good outcome. It is a stuck outcome.",
    toP3: "Change the game",
  },
  mx: {
    youSide: "Atlantia (you)",
    cols: ["Restrains", "Races"],
    rows: ["You restrain", "You race"],
    youShort: "You",
    pacShort: "Pacifica",
    eqTag: "◉ equilibrium",
    bestTag: "✓ better for you",
    was: "was {n}",
    legend:
      "Each cell: your outcome on top, Pacifica's below. ◉ marks an [[equilibrium]], where independent choices settle.",
  },
  p3: {
    h2: "The lab",
    intro:
      "Now you get the dials. The matrix updates live, and the badge names the game you are in. Your job: move the game out of the trap.",
    gStakes: "The stakes",
    gDeal: "The agreement",
    v: {
      label: "Value of winning alone",
      sub: "How much the sole winner of the race gains.",
    },
    c: {
      label: "Expected catastrophe cost",
      sub: "What an unrestrained race is [[expected]] to cost, if things go wrong.",
    },
    share: { label: "The winner shares the risk", tipKey: "winner shares risk" },
    agree: {
      label: "An agreement is in force",
      sub: "Formal limits both sides signed. Verification only means something when there is a deal to check.",
    },
    offNote: "No agreement, nothing to verify. Detection and penalty have no effect.",
    p: {
      label: "Verification: chance a covert racer is caught",
      sub: "Inspections, compute monitoring, intelligence. This is the [[verification]] lever.",
    },
    F: {
      label: "Penalty if caught",
      tipKey: "penalty if caught",
      sub: "What a caught cheater pays on top of the collapsed deal.",
    },
    reset: "Reset to baseline",
    badgeAria: "Current game family",
    families: {
      pd: {
        name: "Prisoner's Dilemma",
        glyph: "▼",
        line: "Racing dominates, and it traps everyone below the cooperative outcome. Fixing this needs changed payoffs or changed information.",
      },
      deadlock: {
        name: "Deadlock",
        glyph: "■",
        line: "Both sides genuinely prefer the race. No verification regime fixes preferences. This is a diplomacy problem, not an information problem.",
      },
      assurance: {
        name: "Assurance Game",
        glyph: "◆",
        line: "Mutual restraint is now stable, if each side believes the other will restrain. The obstacle is trust. Information solves it. This is where verification wants to take you.",
      },
      harmony: {
        name: "Harmony",
        glyph: "●",
        line: "Restraint dominates outright. Enjoy it; history rarely serves this one.",
      },
      chicken: {
        name: "Chicken",
        glyph: "▲",
        line: "Each side wants the other to back down first. Unstable and dangerous; brinkmanship lives here.",
      },
    },
    knife:
      "Knife edge: two payoffs are tied exactly. The smallest nudge tips the game into a neighboring family.",
    challengesTitle: "Two challenges",
    ch1: {
      tag: "Challenge 1",
      prompt:
        "Starting from baseline, find the cheapest way to make mutual restraint stable. Try penalties alone, then detection alone, then both. Which lever does more per unit?",
      check: "Done it. Show the intended discovery.",
      reveal:
        "Detection is the workhorse. The penalty only ever bites multiplied by the chance of being caught: F times zero is zero. Raise detection even a little and every consequence switches on at once, because a caught cheater loses the whole temptation payoff and lands in the collapsed-agreement world.",
    },
    ch2: {
      tag: "Challenge 2",
      prompt:
        "Find settings where no verification level can save you. What had to be true about the payoffs?",
      check: "Done it. Show the intended discovery.",
      reveal:
        "In this box you cannot quite do it, and that is the discovery. Mutual restraint (+40) always beats a mutual race (at most +10) here, so information always has something to protect. Verification truly fails only when both sides prefer the race itself: mutual race at or above mutual restraint. That family is [[Deadlock|deadlock]], a preference problem. No inspector fixes preferences. Whether the real world is closer to that is an argument about evidence, not math.",
    },
    world: {
      title: "Whose payoffs?",
      sub: "Two readings of the same race. Each snaps the stakes dials.",
      hawk: { label: "Hawk", detail: "winning is huge, risk is small" },
      dove: { label: "Dove", detail: "risk is huge, and it lands on everyone" },
      caption:
        "Same world. Different beliefs about the numbers. Different game. The argument about AI risk is an argument about which matrix we are in, and that is an empirical question, not a mathematical one.",
    },
    rep: {
      title: "Repeated play: the shadow of the future",
      deltaLabel: "Shadow of the future (δ)",
      deltaSub:
        "How much the next rounds weigh against this one. Zero means only today counts. This is the [[shadow of the future]].",
      zeroHint: "Slide δ above zero to give the future any weight.",
      gainLabel: "One-time gain from cheating",
      costLabel: "Expected future cost",
      verdict: "Reciprocal cooperation sustainable: ",
      yes: "yes",
      no: "no",
      p0note:
        "If cheating is invisible, the future can't punish it. This is why repetition alone is not enough.",
      mathSummary: "Show the math",
      formula: "future cost = ( δ·p / (1 − δ·(1 − p)) ) × (R − P)",
      plugged:
        "right now: {m} × {rp} = {cost}, against a one-time gain of {gain}",
      reading:
        "Each round you cheat, you risk being caught with chance p, and once caught the deal collapses for good. From then on you lose the gap between the restraint world (R) and the race world (P) every round, discounted by how much the future matters (δ).",
    },
    about: {
      summary: "About the model",
      intro:
        "This is a toy. It exists to make one structure visible, not to predict anything. Its load-bearing assumptions:",
      items: [
        "Two states, one choice each. You and Pacifica pick Restrain or Race at the same time. Real races have many players, many moves, and no referee.",
        "The numbers are illustrative, not measured. “National outcome” is an abstract scale pinned to four anchors: mutual restraint pays 40, racing alone pays more as the value of winning rises, restraining alone pays -60, and a mutual race gets worse as catastrophe risk rises.",
        "Verification is compressed into one number: the chance p that covert racing is caught. A caught cheater lands in the collapsed-agreement race world and pays the penalty. If Pacifica is the one caught, you escape the worst of the betrayed outcome.",
        "Repeated play assumes the harshest response: once cheating is caught, cooperation never returns. Real regimes use gentler, messier responses.",
        "The game is symmetric. Both sides face the same numbers. Real rivals rarely do.",
      ],
    },
    toP4: "Wrap up",
  },
  p4: {
    h2: "Debrief",
    c1: {
      tag: "Card 1",
      h: "Verification changes the game",
      body: "Your final lab settings, without verification and with it.",
      beforeHd: "Without verification (p = 0)",
      afterHd: "With yours (p = {p}%)",
      sameP0:
        "You ended with detection at zero, so the boxes match. Jump back to the lab, raise the catch probability, and come back.",
      sameOff:
        "You ended with the agreement switched off, so verification had nothing to act on. Jump back to the lab and switch it on.",
      backToLab: "Back to the lab",
    },
    c2: {
      tag: "Card 2",
      h: "Diagnosis before prescription",
      paras: [
        "If both sides truly prefer racing, you have a preference problem. It needs enforcement, changed incentives, or a different deal.",
        "If both sides prefer mutual restraint but fear being played, you have an information problem. Verification is built for exactly that.",
        "Which one the AI race is depends on contested payoffs. The diagnosis is part of the argument.",
      ],
    },
    c3: {
      tag: "Card 3",
      h: "Red-team the box",
      body: "Every number in the lab was an assumption. You just manipulated three big ones:",
      items: [
        "How much winning alone is really worth (v).",
        "How costly an unrestrained race would be, and whether the winner shares that cost (c).",
        "How likely a covert racer is to get caught, and what it loses if so (p and F).",
      ],
      tail: "The course's red-team prompts will keep asking you for this move: find the assumption, then ask what evidence would shift it.",
    },
    complete: {
      h: "You changed the game.",
      body: "You watched one number, the chance that cheating gets caught, turn a trap into a coordination problem. The rest of this track asks whether that number can be raised in the real world, and how.",
      onward:
        "Module 0's timeline interactive walks three futures. You now know their names: a race without coordination, an agreement without information, an agreement with verification.",
      replay: "Play again",
      toTrack: "Go to Module 0",
      trackHref: "policy-scoping.html",
    },
  },
} as const;
