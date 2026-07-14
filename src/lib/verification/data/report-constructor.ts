/**
 * Data for the "Report Constructor" Verification widget (Module 1 · Actors ·
 * 1.6). One inspection, three readers: the learner picks up to 8 of 15 notebook
 * entries (4 are pure traps that fit no desk), threads each to one of three
 * desks, and runs a repeatable fit check that scores reader-needs met, misfit
 * threads, dead cards, and buried desks.
 *
 * Every string below is human-authored curriculum lifted VERBATIM from the
 * standalone page (public/verification/report-constructor.html and its
 * extracted consts public/verification/content/report-constructor.json). Do not
 * paraphrase, shorten, or invent — the fit notes and copy are the pedagogy.
 */

export type ReaderId = "committee" | "authority" | "cell";

export type CardTag =
  | "observed"
  | "records"
  | "claim"
  | "tip"
  | "finding"
  | "inference"
  | "background";

/** Tag → display label for a notebook entry's provenance. */
export const TAGS: Record<CardTag, string> = {
  observed: "Observed",
  records: "Records",
  claim: "Operator claim",
  tip: "Uncorroborated tip",
  finding: "Draft finding",
  inference: "Inspector’s inference",
  background: "Background",
};

export interface Reader {
  id: ReaderId;
  /** Per-reader accent, used only for the filament / chip / eye color. */
  color: string;
  chipBg: string;
  chipFg: string;
  shortName: string;
  name: string;
  role: string;
  standard: string;
}

export const READERS: Reader[] = [
  {
    id: "committee",
    color: "#0072B2",
    chipBg: "#E3EEF6",
    chipFg: "#005A8E",
    shortName: "The Committee",
    name: "Treaty Compliance Committee",
    role: "Decides whether the Northgate file becomes a formal non-compliance inquiry. Whatever you send may be read aloud with Pacifica’s delegation in the room.",
    standard:
      "Accepts only what survives challenge: your measurements, named documents, attributed statements.",
  },
  {
    id: "authority",
    color: "#009E73",
    chipBg: "#E0F2EC",
    chipFg: "#00654A",
    shortName: "The Authority",
    name: "Pacifica Compute Authority",
    role: "The national regulator that licenses the operator. Orders things fixed, produced, or stopped — within days, if you give it specifics. It answers to the same government you are checking: hand it orders it must execute in the open, not leads it can quietly bury.",
    standard: "Acts on concrete items with a deadline. Cannot act on suspicion.",
  },
  {
    id: "cell",
    color: "#D55E00",
    chipBg: "#F9E8DC",
    chipFg: "#9C4500",
    shortName: "The Cell",
    name: "Verification Analysis Cell",
    role: "Never meets the operator. Watches patterns across sites and seasons, and tasks the next look — yours or somebody else’s.",
    standard:
      "Uncertainty is fine, labeled. Conclusions without the detail underneath are useless.",
  },
];

export interface Need {
  id: string;
  aud: ReaderId;
  label: string;
  cover: string[];
  hint: string;
}

export const NEEDS: Need[] = [
  {
    id: "c1",
    aud: "committee",
    label: "Does observed reality match the declaration?",
    cover: ["census", "crates", "power", "ledger"],
    hint: "Something you measured disagrees with something Pacifica filed. It’s still in the notebook.",
  },
  {
    id: "c2",
    aud: "committee",
    label: "What did you verify yourself — and how?",
    cover: ["method"],
    hint: "How would a hostile reader know your census is real? The dull paragraph about method is the answer.",
  },
  {
    id: "c3",
    aud: "committee",
    label: "What does the operator say for itself?",
    cover: ["claimrma"],
    hint: "The operator gave you its side. The committee has to hear it from you first.",
  },
  {
    id: "r1",
    aud: "authority",
    label: "What must the operator fix or hand over?",
    cover: ["census", "crates", "claimrma", "power", "badges", "ledger"],
    hint: "The Authority needs an order it can write: produce this, register that, by this date.",
  },
  {
    id: "r2",
    aud: "authority",
    label: "Where was the inspection blocked?",
    cover: ["lockout"],
    hint: "You were kept out of somewhere. Say so — to the desk that can open the door.",
  },
  {
    id: "i1",
    aud: "cell",
    label: "What did you see that you couldn’t resolve?",
    cover: ["power", "badges", "cooling", "ledger"],
    hint: "Something didn’t add up and still doesn’t. That belongs with the desk that never stops looking.",
  },
  {
    id: "i2",
    aud: "cell",
    label: "What lead deserves the next look?",
    cover: ["crates", "lockout", "tip"],
    hint: "You’re holding at least one loose end somebody should chase. One desk exists to chase them.",
  },
];

export interface Fit {
  ok: boolean;
  note: string;
}

export interface Card {
  id: string;
  tag: CardTag;
  title: string;
  body: string;
  fits: Record<ReaderId, Fit>;
}

export const CARDS: Card[] = [
  {
    id: "census",
    tag: "observed",
    title: "The census gap",
    body: "Cryptographic attestation reached 18,406 of the 18,432 accelerators Pacifica declared for this campus. Twenty-six never answered — and the operator could not produce them for physical inspection.",
    fits: {
      committee: {
        ok: true,
        note: "A counted, repeatable mismatch the operator was given the chance to explain away — and couldn’t.",
      },
      authority: {
        ok: true,
        note: "Twenty-six machines to account for is an order the Authority can write today.",
      },
      cell: {
        ok: true,
        note: "Twenty-six units nobody could produce, one hall away from 312 crated ones — a correlation the Cell tracks across quarters.",
      },
    },
  },
  {
    id: "cooling",
    tag: "observed",
    title: "Oversized cooling",
    body: "The thermal plant is sized for roughly twice the campus’s declared peak load. Overbuild is common — but this is headroom somebody paid for.",
    fits: {
      committee: {
        ok: false,
        note: "Prudent overbuild and covert intent look identical on a spec sheet. Not committee-grade on its own.",
      },
      authority: {
        ok: false,
        note: "Overbuilding a cooling plant breaks no rule. Nothing to order.",
      },
      cell: {
        ok: true,
        note: "Paid-for headroom is a forward indicator — the Cell logs it against future power draw and procurement.",
      },
    },
  },
  {
    id: "crates",
    tag: "observed",
    title: "The unlisted room",
    body: "A storage room off Hall B, absent from the site plan, held 312 crated accelerators — several crates opened, serials recorded — that appear in no declaration.",
    fits: {
      committee: {
        ok: true,
        note: "Undeclared hardware, personally observed, serials in hand. The center of any non-compliance case.",
      },
      authority: {
        ok: true,
        note: "The Authority can seal the room and demand the units enter the registry this week.",
      },
      cell: {
        ok: true,
        note: "Where did 312 undeclared units come from? Serials meet customs data — the Cell can trace what you can’t.",
      },
    },
  },
  {
    id: "courtesy",
    tag: "observed",
    title: "A well-run visit",
    body: "Operator staff were courteous and well prepared; the visit ran to schedule on both days.",
    fits: {
      committee: {
        ok: false,
        note: "Courtesy is not compliance — and the delegation will happily quote this line back at you.",
      },
      authority: {
        ok: false,
        note: "No order can be written from good manners.",
      },
      cell: {
        ok: false,
        note: "Well-prepared is what innocence and rehearsal look like from the same distance. As written, there’s nothing to hold.",
      },
    },
  },
  {
    id: "claimrma",
    tag: "claim",
    title: "The operator’s account",
    body: "The site manager states the crated units are defective stock awaiting return to the vendor. No return paperwork was available during the visit.",
    fits: {
      committee: {
        ok: true,
        note: "Attributed and checkable, with the missing paperwork on display. The committee hears Pacifica’s account from you before the delegation offers a better one.",
      },
      authority: {
        ok: true,
        note: "A specific demand writes itself: produce the return paperwork by a date, or the claim fails.",
      },
      cell: {
        ok: true,
        note: "A cover story is a testable claim: vendor named, channel asserted. The Cell checks it — and logs it, in case the story changes.",
      },
    },
  },
  {
    id: "power",
    tag: "records",
    title: "Twenty-one flat days",
    body: "Grid billing and the campus meter agree: near-constant ~34 MW draw for 21 days in March. Pacifica’s declared workload for March was inference only.",
    fits: {
      committee: {
        ok: true,
        note: "Customer inference follows demand; a flat 21-day draw looks like one scheduled job, not traffic. The committee can ask what job.",
      },
      authority: {
        ok: true,
        note: "Grounds to demand March’s scheduler and job logs — a specific, dated production order.",
      },
      cell: {
        ok: true,
        note: "An unresolved 21-day signature the Cell can lay against thermal imagery and every other site’s pattern.",
      },
    },
  },
  {
    id: "launder",
    tag: "finding",
    title: "Returns in progress",
    body: "The 312 crated accelerators are defective stock in the process of being returned to the vendor.",
    fits: {
      committee: {
        ok: false,
        note: "This is the operator’s claim wearing your voice. Read into the record it becomes your finding — and when it collapses, so does the rest of your report.",
      },
      authority: {
        ok: false,
        note: "Stated as settled fact, it closes the very question the Authority should be ordering the operator to answer.",
      },
      cell: {
        ok: false,
        note: "You’ve resolved the anomaly on the operator’s say-so — the one move that guarantees nobody looks again.",
      },
    },
  },
  {
    id: "lockout",
    tag: "observed",
    title: "Hall C, locked",
    body: "Four racks in Hall C sat behind an “electrical safety lockout” on both days. The operator declined to schedule a re-inspection window before departure.",
    fits: {
      committee: {
        ok: true,
        note: "The committee needs your report’s edges: what you could not see — and that access was declined — is itself evidence.",
      },
      authority: {
        ok: true,
        note: "Obstruction with a hall number and a date. The Authority can compel the window the operator wouldn’t give you.",
      },
      cell: {
        ok: true,
        note: "Four racks somebody kept you away from is a collection target.",
      },
    },
  },
  {
    id: "transistors",
    tag: "background",
    title: "Under the heat spreader",
    body: "Each accelerator on the floor carries roughly 80 billion transistors on a leading-edge process — a reminder of what these campuses actually contain.",
    fits: {
      committee: {
        ok: false,
        note: "True, vivid, and useless to a desk deciding whether a declaration was honest.",
      },
      authority: {
        ok: false,
        note: "The transistor count is not in violation. Nothing to act on.",
      },
      cell: {
        ok: false,
        note: "The Cell knows what an accelerator is.",
      },
    },
  },
  {
    id: "badges",
    tag: "records",
    title: "Nine missing days",
    body: "Badge-access logs for Hall C show a nine-day gap in February. The operator attributes it to a logging-system migration.",
    fits: {
      committee: {
        ok: false,
        note: "The operator’s own IT logs, carrying the operator’s own explanation, sit below this desk’s evidentiary bar. Route them to the desk that can audit the logging system itself.",
      },
      authority: {
        ok: true,
        note: "A recordkeeping failure with a scope and a date — order the logs restored or the retention system audited.",
      },
      cell: {
        ok: true,
        note: "A hole in the record covering the hall you were kept out of. The Cell can check what else lines up with those nine days.",
      },
    },
  },
  {
    id: "editorial",
    tag: "inference",
    title: "What it adds up to",
    body: "Taken together, the picture is clear: Pacifica is concealing a covert training run at this campus.",
    fits: {
      committee: {
        ok: false,
        note: "Reaching this sentence is the committee’s job, from your facts. Hand them the sentence without the chain and the delegation attacks you instead of the evidence.",
      },
      authority: {
        ok: false,
        note: "There is no order the Authority can write from a conclusion.",
      },
      cell: {
        ok: false,
        note: "The Cell drowns in conclusions. It runs on the plateau, the room, the gap — things a conclusion can be rebuilt from.",
      },
    },
  },
  {
    id: "tip",
    tag: "tip",
    title: "The parking-lot conversation",
    body: "An employee approached the team off-site: night “stress tests” ran for weeks this spring, and staff were told not to log them. Identity withheld; nothing corroborated.",
    fits: {
      committee: {
        ok: false,
        note: "Read into a formal record, an anonymous claim burns the source and hands the delegation the story of a sloppy inspection.",
      },
      authority: {
        ok: false,
        note: "This desk reports to the government your source is informing on. Routing it there doesn’t widen the circle — it closes it around one person.",
      },
      cell: {
        ok: true,
        note: "Precisely the desk that can hold an uncorroborated lead: grade it, protect it, task the next look.",
      },
    },
  },
  {
    id: "customs",
    tag: "records",
    title: "January checks out",
    body: "Customs records for the January expansion — 2,000 accelerators — match the declaration: quantities, serial ranges, and end-use filings all line up.",
    fits: {
      committee: {
        ok: true,
        note: "Verification that confirms is still verification. Reporting what checked out is what makes the rest of your report credible.",
      },
      authority: {
        ok: false,
        note: "Nothing to fix — which is the point, and a desk that orders things has no use for it.",
      },
      cell: {
        ok: true,
        note: "The clean January lane is what makes the 312 stand out. The Cell needs the baseline to trace the exception.",
      },
    },
  },
  {
    id: "method",
    tag: "observed",
    title: "How the census was run",
    body: "The attestation census used the vendor’s tool v3.2, checksums logged, every step witnessed by an operator representative who signed the run log.",
    fits: {
      committee: {
        ok: true,
        note: "Dry, boring, load-bearing: this paragraph is what makes the census gap survive cross-examination.",
      },
      authority: {
        ok: false,
        note: "Process detail. The Authority trusts your tradecraft; it needs things to order.",
      },
      cell: {
        ok: false,
        note: "The Cell trusts your tradecraft too. It needs your anomalies, not your checklist.",
      },
    },
  },
  {
    id: "ledger",
    tag: "records",
    title: "The quarter doesn’t add up",
    body: "Pacifica’s Q1 compute declaration totals 2.1×10²⁴ FLOP for this campus — less than half of what March’s 21-day plateau alone implies at ordinary training efficiency, if those days were training.",
    fits: {
      committee: {
        ok: true,
        note: "Declaration versus arithmetic. Paired with the meter records, the committee holds a falsifiable claim.",
      },
      authority: {
        ok: true,
        note: "Order the operator to produce the job accounting behind the Q1 filing — the Authority compiled those numbers into Pacifica’s declaration.",
      },
      cell: {
        ok: true,
        note: "A quantified shortfall the Cell can test against every other stream it holds.",
      },
    },
  },
];

/** Tuning constants — verbatim from CONFIG in the source. */
export const CONFIG = {
  /** max notebook entries in the report */
  cap: 8,
  /** distinct failing checks before unmet-need hints appear */
  hintAfter: 2,
  /** misfit threads on one desk = that desk is buried */
  buriedAt: 3,
} as const;

export const REPORT_CONSTRUCTOR_COPY = {
  chain: {
    upTag: "Behind you",
    upBody:
      "Pacifica’s declaration · vendor attestation · customs records · your own eyes",
    upQ: "Whose claims are you standing on?",
    youTag: "You",
    youBody: "The report",
    downTag: "Ahead of you",
    downBody: "Three desks, three different jobs",
    downQ: "Who acts on what you write?",
  },
  readersHead: "Meet your readers first.",
  readersNote:
    "Nobody reads “the report.” Three desks read three different things, and each can only act on what fits its job. Read them before you choose a single word.",
  openBtn: "Open the notebook",
  poolHead: "Your notebook: fifteen entries.",
  poolNote:
    "A useful report will not hold all of them. Pick what goes in — the tag on each entry tells you where it came from.",
  counterTpl: ["In the report: ", " of ", " entries"] as const,
  capMsg: "Eight entries is already a long report. Trade something out.",
  assembleBtn: "Assemble the report",
  threadHead: "Thread each finding to its desk.",
  threadHowto:
    "Click an entry, then the desk it serves — an entry can serve more than one desk, and some serve none. Click a thread’s tag to remove it. Then run the fit check to see what each desk can actually use.",
  repTag: "Your report",
  deskTag: "The desks",
  armedHint:
    "Now click a desk (or press 1, 2, 3) — Escape puts the needle down.",
  threadedTpl: ["Threaded “", "” to ", "."] as const,
  unthreadedTpl: ["Removed the thread from “", "” to ", "."] as const,
  backBtn: "← Back to the notebook",
  checkBtn: "Run the fit check",
  recheckBtn: "Re-run the fit check",
  fileBtn: "File the report",
  deadNote: "In the report, pointed at no one. Every paragraph needs a reader.",
  removeThreadLabel: ["Remove thread: “", "” → ", ""] as const,
  fitLabel: "Fits — ",
  misfitLabel: "Misfit — ",
  dropLabel: ["Remove “", "” from the report"] as const,
  deskBtnLabel: "Thread the armed entry to ",
  summary: {
    needs: ["Reader needs met: ", " of "] as const,
    misfits: [" · misfit threads: ", ""] as const,
    dead: [" · entries no one reads: ", ""] as const,
    clean: "Every desk can act on what you sent it.",
    buriedTpl: [
      "You’ve also buried ",
      " under material it can’t use. Flooding the reader is the evader’s trick — don’t run it on your own side.",
    ] as const,
  },
  debriefHead: "Filed. Here’s what each desk can actually use.",
  debriefNote:
    "Only the entries that fit each desk survive contact with it. Everything else they skim, discount, or hold against you.",
  filedNone: "Nothing usable arrived at this desk.",
  lesson:
    "Same notebook, three documents — that’s all “context-specific” means.",
  brevityTpl: [
    "You covered every desk with ",
    " entries — and every desk read everything you sent.",
  ] as const,
  pairPicked:
    "You filed <b>“Returns in progress.”</b> Set it next to <b>“The operator’s account”</b>: the same fact, two framings. One carries its source and its missing paperwork; the other quietly becomes your finding. That one edit is how an operator’s story turns into an inspector’s error.",
  pairClean:
    "Notice the pair you navigated: <b>“The operator’s account”</b> kept the claim attributed, with its missing paperwork on display. <b>“Returns in progress”</b> was the same fact with the source filed off — the quiet edit that sinks real reports.",
  pairSkipped:
    "Two entries you left behind were the same fact in two framings: <b>“The operator’s account”</b> carried its source and its missing paperwork; <b>“Returns in progress”</b> was that claim with the source filed off. The second kind is how an operator’s story becomes an inspector’s error.",
  trapsNote:
    "The four traps had one thing in common: no desk could act on them. An adopted claim, a naked conclusion, padding — in Module 3 you’ll meet actors who produce all three <b>on purpose</b>.",
  forward:
    "Next — 1.7: a scenario, a desk, and a blank page. You write the real one.",
  again: "Run it again",
} as const;

export const cardById: Record<string, Card> = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
);
export const readerById: Record<string, Reader> = Object.fromEntries(
  READERS.map((r) => [r.id, r]),
);
