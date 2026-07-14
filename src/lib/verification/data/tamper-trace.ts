/**
 * Data + copy for the "Tamper & Trace" Red/Blue verification exercise —
 * lifted VERBATIM from public/verification/tamper-trace.html and
 * public/verification/content/tamper-trace.json. This is human-authored
 * curriculum: do not paraphrase, shorten, or invent any pedagogical text.
 *
 * Grounded in: FlexHEG (guarantee processor + secure enclosure); "Six Layers
 * of Verification" (RAND); BadRAM / DDR5-interposer attacks on SEV-SNP; MOLE
 * firmware attack; zero-overhead GPU telemetry. All techniques are anticipated
 * threats — no such treaty exists yet.
 */

export interface RedTech {
  id: string;
  name: string;
  cost: number;
  defeats: string;
  desc: string;
  tell: string;
}

export interface BlueLayer {
  id: string;
  name: string;
  cost: number;
  catches: string;
  desc: string;
}

export const RED_TECHS = [
  {
    id: "spoof",
    name: "Attestation spoofing",
    cost: 3,
    defeats: "Remote attestation",
    desc: "Extract the PUF-bound key and impersonate a compliant chip; the attestation report looks perfect.",
    tell: "Tell: a cloned identity can appear in two places, and challenge timing drifts.",
  },
  {
    id: "firmware",
    name: "Firmware implant (MOLE-style)",
    cost: 3,
    defeats: "Secure / measured boot",
    desc: "Inject malicious firmware into the GPU MCU so a banned workload runs under an “authorized” image.",
    tell: "Tell: boot-measurement hashes mismatch if measured independently.",
  },
  {
    id: "interposer",
    name: "DRAM interposer (BadRAM)",
    cost: 2,
    defeats: "TEE attestation",
    desc: "A ~$10 memory-bus attack defeats confidential-computing attestation. Cheap and effective.",
    tell: "Tell: physical intrusion marks and memory-timing anomalies.",
  },
  {
    id: "meter",
    name: "Disable / underreport meter",
    cost: 2,
    defeats: "Compute metering",
    desc: "Falsify the on-chip utilization counter so a full training run reports as light, compliant load.",
    tell: "Tell: real power draw no longer matches reported utilization.",
  },
  {
    id: "supply",
    name: "Supply-chain pre-implant",
    cost: 4,
    defeats: "On-chip roots of trust",
    desc: "Compromise chips before deployment, poisoning attestation and boot at the source. Hard, but deep.",
    tell: "Tell: a gap or substitution in the chain-of-custody record.",
  },
  {
    id: "inspector",
    name: "Capture an inspector",
    cost: 3,
    defeats: "Physical inspection",
    desc: "Bribe or pressure the on-site inspector so the audit comes back clean. Attacks people, not silicon.",
    tell: "Tell: audit inconsistencies and a demoralized team someone may report.",
  },
  {
    id: "mask",
    name: "Thermal / power masking",
    cost: 2,
    defeats: "(support) hides the power tell",
    desc: "Run decoy loads and shape the power/thermal signature to hide a training run’s footprint. Amplifies other techniques.",
    tell: "Tell: cooling infrastructure and grid draw are still visible from outside.",
  },
] as const satisfies readonly RedTech[];

export const HONEST = {
  id: "honest",
  name: "Stay honest (bluff)",
  cost: 0,
  defeats: "—",
  desc: "Don’t tamper at all. Run only permitted work. If Blue’s stack fires anyway, they’ve produced a false positive — a real diplomatic cost.",
  tell: "No tell — because there is nothing to find.",
} as const satisfies RedTech;

export const BLUE_LAYERS = [
  {
    id: "att",
    name: "Remote attestation (baseline)",
    cost: 1,
    catches: "table stakes",
    desc: "Necessary but spoofable on its own. Catches nothing that’s been tampered by design.",
  },
  {
    id: "puf",
    name: "PUF challenge–response timing",
    cost: 2,
    catches: "attestation spoofing",
    desc: "Tight round-trip timing + unclonable keys expose a cloned or spoofed identity.",
  },
  {
    id: "boot",
    name: "Independent measured boot",
    cost: 2,
    catches: "firmware implant",
    desc: "Verifies boot measurements against a known-good baseline you control.",
  },
  {
    id: "enc",
    name: "Tamper-evident enclosure",
    cost: 3,
    catches: "physical / interposer attacks",
    desc: "Intrusion sensors + logging. The only reliable recourse against DRAM-bus attacks.",
  },
  {
    id: "pow",
    name: "Off-chip power / thermal sensors",
    cost: 2,
    catches: "meter fraud, disguised load",
    desc: "Independent feeder-level sensing betrays a workload that runs “too heavy” for its declaration.",
  },
  {
    id: "coc",
    name: "Chain-of-custody + inspection",
    cost: 3,
    catches: "supply-chain implant",
    desc: "Tracks chips fab-to-rack; random physical inspection surfaces substitutions and intrusion marks.",
  },
  {
    id: "whistle",
    name: "Whistleblower channel",
    cost: 2,
    catches: "inspector capture + insiders",
    desc: "Secure, anti-retaliation reporting. Adds a flat chance to catch ANY technique via an insider.",
  },
  {
    id: "recon",
    name: "Cross-layer reconciliation",
    cost: 4,
    catches: "the TELL of almost anything",
    desc: "Fuses chip attestation vs. facility power vs. procurement. The Swiss-cheese multiplier — expensive.",
  },
  {
    id: "osint",
    name: "Facility OSINT / satellite",
    cost: 2,
    catches: "masking, decoys, hidden load",
    desc: "Grid draw + cooling imagery. Defeats power masking and backstops the facility level.",
  },
] as const satisfies readonly BlueLayer[];

export type RedTechId = (typeof RED_TECHS)[number]["id"];
export type BlueLayerId = (typeof BLUE_LAYERS)[number]["id"];

/** direct counter + tell-catchers (weights) per technique */
export const MATRIX: Record<
  RedTechId,
  { direct: BlueLayerId; tells: Partial<Record<BlueLayerId, number>> }
> = {
  spoof: { direct: "puf", tells: { recon: 0.35 } },
  firmware: { direct: "boot", tells: { recon: 0.35 } },
  interposer: { direct: "enc", tells: { coc: 0.25, recon: 0.3 } },
  meter: { direct: "pow", tells: { recon: 0.35, osint: 0.25 } },
  supply: { direct: "coc", tells: { recon: 0.3 } },
  inspector: { direct: "whistle", tells: { recon: 0.3 } },
  mask: { direct: "osint", tells: { recon: 0.3 } },
};

export const DIRECT_WEIGHT = 0.6;
export const WHISTLE_FLAT = 0.15; // whistleblower adds flat chance to any technique
export const FP_PER_NOISY = 0.08; // false-positive contribution per noisy layer

/** Header / intro copy, lifted verbatim from the source page. */
export const TAMPER_TRACE_COPY = {
  scenarioLabel: "SCENARIO",
  toggles: {
    state: {
      label: "Nation-state adversary",
      note: "(Red +3)",
    },
    amd: {
      label: "Vendor won’t patch physical attacks",
      note: "(interposer near-invisible w/o enclosure)",
    },
    legacy: {
      label: "Legacy fleet, no root of trust",
      note: "(on-chip layers weakened)",
    },
  },

  redStep: "Step 1 of 3 · pass the screen to the Red player",
  redTitle: "Red — the evader",
  redHint:
    "Pick the tampering techniques you’ll deploy. You cannot afford everything — that’s the point. Each card shows what layer it defeats and the tell it leaves behind. Or bluff: Stay honest and dare Blue to false-alarm.",
  lockRed: "Lock Red & hide →",

  blueStep: "Step 2 of 3 · pass the screen to the Blue player",
  blueTitle: "Blue — the verifier",
  blueHint:
    "You don’t know what Red chose. Build a detection stack. Direct counters catch their matching attack; the cross-layer reconciliation and whistleblower layers catch tells from almost anything — but they also raise your false-alarm risk.",
  backRed: "← Back to Red",
  resolve: "Resolve →",

  resolveStep: "Step 3 of 3 · resolution",
  bands: [
    "Compliant",
    "Ambiguous",
    "Suspicious",
    "Probable breach",
    "Material breach",
  ],
  reroll: "Re-roll the dice",
  editBlue: "← Edit Blue",
  again: "New round",
  reset: "Reset",

  facilitatorSummary: "Facilitator notes & debrief prompts",
  facilitatorNotes: [
    {
      lead: "The core teaching move (Swiss cheese).",
      body: "A single detection layer is beatable. Independent layers with different blind spots converge — which is why cross-layer reconciliation (comparing chip attestation vs. facility power vs. procurement) is the most powerful and most expensive card. Ask: did the winning catch come from the direct counter, or from a tell picked up elsewhere?",
    },
    {
      lead: "Cost–cost, not a wall (Ray).",
      body: "Blue can’t buy everything — they satisfice. The debrief question is never “was the stack perfect,” it’s “given the budget, was this the residual-risk portfolio you can most live with?” Every layer has a price: money, intrusiveness, sovereignty friction, and false positives.",
    },
    {
      lead: "The false-alarm trap.",
      body: "A maximal Blue stack raises the chance of flagging an honest party (run the “Stay honest” bluff and watch it fire). Tie this to base-rate reasoning: a regime that treats every anomaly as an existential red alert drowns in false positives and loses credibility to escalate when it matters.",
    },
    {
      lead: "Assumptions are load-bearing.",
      body: "Flip a scenario toggle mid-debrief and re-resolve. “Vendor won’t patch physical attacks” makes the tamper-evident enclosure the only recourse for an interposer (a real 2025 fact — AMD declined to mitigate physical SEV-SNP attacks). “Legacy fleet” guts the on-chip layers and forces Blue onto off-chip + human evidence. The ranking of good moves changes with the assumption — that’s the lesson, not the specific outcome.",
    },
    {
      lead: "Falsifiability.",
      body: "Ask each player: what single piece of evidence would flip your confidence judgment one band? If they can’t name it, they have a narrative, not a judgment.",
    },
    {
      lead: "Tamper-evidence, not tamper-proofing.",
      body: "The real-world standard (IAEA-style, carried into FlexHEG) is not that tampering is impossible, but that tampering a large fleet can’t go undetected. Surface this when Red “succeeds” on one chip: would it scale to 50,000 without leaving a trace?",
    },
  ],
  debriefTail:
    "DEBRIEF · what one piece of evidence would move your confidence judgment by one band? If you can’t name it, you have a narrative, not a judgment. Now flip a scenario toggle and re-resolve — watch the best move change.",
} as const;

/** Verdict / debrief copy, keyed by outcome branch. Lifted verbatim. */
export const DEBRIEF = {
  honestFired: {
    verdict: "False positive — Blue flagged a compliant party",
    debrief:
      "The false-alarm trap. Red never cheated, yet Blue escalated. In a real regime this burns diplomatic capital and erodes the credibility Blue needs to escalate when a real breach appears. Cost–cost: a bigger stack is not a better stack.",
    rowLabel:
      "Blue’s reconciliation/whistleblower layers produced a spurious flag. Escalating here spends credibility Blue will need later.",
    rowPct: "FALSE ALARM",
  },
  honestClear: {
    verdict: "Correctly cleared — but at what cost?",
    debrief:
      "Restraint has a payoff. Blue resisted over-flagging a compliant party. Note the tension: the same reconciliation/whistleblower layers that would catch a real tamper are exactly what raise this false-alarm risk.",
    rowLabel:
      "Blue held fire. Good — but a bigger stack would have raised this false-alarm risk.",
    rowPct: "CLEAR",
  },
  rowLabelHonest: "No tampering occurred",
  caughtVerdict:
    "Blue wins — tampering detected, challenge inspection triggered",
  missedVerdict:
    "Red wins — prohibited run completed while reporting compliant",
  swissCheese:
    "Swiss cheese worked. Blue caught this without the direct counter — a residual tell surfaced through an independent layer. This is the whole argument for layered verification: cover the blind spots, not just the front door.",
  directLanded:
    "Direct counter landed. Blue matched the attack. Ask: would this stack have held if Red had spent that same budget on a different technique? Robustness means covering the attacks you didn’t predict.",
  redThrough:
    "Red got through. Find the gap: which technique had no layer touching it? The fix is rarely “buy more of what you have” — it’s adding an independent layer with a different blind spot (usually reconciliation or the human channel).",
  redEmpty:
    "Red deployed nothing — pick at least one technique or Stay honest.",
} as const;
