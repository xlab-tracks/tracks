/**
 * Data for the "Who's in the Treaty?" widget — the Module 0 pause treaty
 * (Reykjavik Protocol) re-read as a cast list. Lifted VERBATIM from
 * public/verification/protocol-actors.html (consts CATS, ACTORS, QUIZ, ORDER).
 * This is human-authored curriculum: do not paraphrase, shorten, or invent.
 */

/** Actor categories, keyed by the semantic encoding the original uses. */
export type ActorCat = "steel" | "ind" | "inst";

export const CATS: Record<ActorCat, string> = {
  steel: "States & their machinery",
  ind: "Industry",
  inst: "Institutions & inspectors",
};

/** Learn-mode content. blocks: [label, text]. */
export interface ActorEntry {
  cat: ActorCat;
  phrase: string;
  title: string;
  blocks: [string, string][];
}

export const ACTORS: Record<string, ActorEntry> = {
  states: {
    cat: "steel",
    phrase: "“The States Parties to this Protocol…”",
    title: "Nation-states",
    blocks: [
      [
        "Who this points at",
        "Only sovereign states can sign and ratify a treaty. In practice this one is about a short list: the United States and China first, then the United Kingdom, EU members, Japan, South Korea, and the Gulf states now buying frontier compute. Everyone else joins the way most NPT members did — with nothing to give up.",
      ],
      [
        "Historical parallel",
        "The Nuclear Non-Proliferation Treaty has 191 parties; nine states have nuclear weapons. Treaties are universal on paper and asymmetric in practice.",
      ],
      [
        "Why it matters for Module 1",
        "States are the only actors who can sign — yet almost nothing the Protocol regulates (chips, datacenters, models) is owned by a state. Every article is a promise to control someone else.",
      ],
    ],
  },
  labs: {
    cat: "ind",
    phrase: "“…the training of a single general-purpose artificial intelligence model…”",
    title: "Frontier labs",
    blocks: [
      [
        "Who this points at",
        "The organizations that have trained models near the 10²⁶ threshold: OpenAI, Google DeepMind, Anthropic, Meta, and xAI in the United States; DeepSeek, Alibaba (Qwen), and Moonshot in China. The core obligation of a global treaty binds perhaps a dozen organizations on Earth.",
      ],
      [
        "The wrinkle in the text",
        "“A single model” invites structuring: split one run across several models and merge them later. Who would even detect that? (Hold the thought — it is most of Module 2.)",
      ],
      [
        "Why it matters for Module 1",
        "Labs are triple-cast: the regulated party, the main talent pool any verifier would hire from, and the loudest lobby on both sides of the pause debate.",
      ],
    ],
  },
  facility: {
    cat: "ind",
    phrase: "“…any installation with power capacity exceeding 10 megawatts…”",
    title: "Datacenter owners & operators",
    blocks: [
      [
        "Who this points at",
        "Mostly private companies: hyperscalers (Microsoft, Google, Amazon, Meta), GPU clouds (CoreWeave, Lambda), colocation landlords (Equinix, Digital Realty), labs building their own sites (xAI’s Colossus in Memphis), and sovereign projects such as the UAE’s G42 campuses and national supercomputing centers.",
      ],
      [
        "The wrinkle in the text",
        "A 10-megawatt line also catches ordinary cloud regions and even crypto-mining operations. Definitions drag in actors who never thought of themselves as AI actors — and each becomes a declaration, an inspection site, a constituency.",
      ],
      [
        "Why it matters for Module 1",
        "The state signs; the facility owner gets inspected. Every facility clause is an obligation a government must impose on a company inside its borders.",
      ],
    ],
  },
  grandfather: {
    cat: "ind",
    phrase: "“…fine-tuning… of models trained before entry into force… shall not constitute a covered training run.”",
    title: "The grandfathered incumbents",
    blocks: [
      [
        "Who this points at",
        "Whoever holds the strongest model on the day the freeze begins — a handful of American and Chinese labs. Fine-tuning stays legal, so the frontier freezes with them on top. Hosts of existing open-weight models keep operating too.",
      ],
      [
        "Historical parallel",
        "The NPT froze the nuclear club at five members in 1968. That single asymmetry — haves and have-nots written into law — has defined the treaty’s politics for over fifty years.",
      ],
      [
        "Why it matters for Module 1",
        "Definitions create winners and losers among actors. Losers evade, renegotiate, or refuse to join — which is why actor incentives, not treaty text, predict compliance.",
      ],
    ],
  },
  jurisdiction: {
    cat: "steel",
    phrase: "“…or knowingly permit within its jurisdiction…”",
    title: "Domestic enforcers",
    blocks: [
      [
        "Who this points at",
        "The treaty binds states, but training runs happen inside companies — so each state needs domestic machinery to police its own. In the US that means the Commerce Department (BIS) and possibly the Department of Energy; in the EU, the AI Office; in China, MIIT and the CAC. No agency anywhere currently has “verify that no 10²⁶ run occurred” as its mission.",
      ],
      [
        "Historical parallel",
        "The Chemical Weapons Convention required every party to pass national implementing legislation and stand up a National Authority. Many exist only on paper — the gap between signing and enforcing is where compliance quietly dies.",
      ],
      [
        "Why it matters for Module 1",
        "Between the treaty and the datacenter sits an entire layer of domestic actors the text never names.",
      ],
    ],
  },
  hardware: {
    cat: "ind",
    phrase: "“…holdings of applicable high-performance computing hardware exceeding one thousand units…”",
    title: "The chip chokepoint",
    blocks: [
      [
        "Who makes it",
        "NVIDIA and AMD design the accelerators; TSMC (with Samsung a distant second) fabricates them; ASML holds a literal monopoly on the EUV lithography machines the fabs require; SK Hynix, Samsung, and Micron supply the high-bandwidth memory. Five or six companies, three jurisdictions.",
      ],
      [
        "Who buys it",
        "Hyperscalers and frontier labs above all, then governments, GPU clouds — and, through gray markets and transshipment hubs, buyers the treaty says should not have it.",
      ],
      [
        "Historical parallel",
        "Uranium enrichment. Verification regimes work best where a physical chokepoint exists; the entire nuclear order leans on the difficulty of enrichment. Compute has an even narrower chokepoint — held by companies, not states.",
      ],
      [
        "Why it matters for Module 1",
        "The most concentrated actors on the whole map, and not one of them can sign the treaty.",
      ],
    ],
  },
  instruments: {
    cat: "inst",
    phrase: "“…power metering and workload verification instruments approved by the Technical Secretariat…”",
    title: "The verification-tech ecosystem",
    blocks: [
      [
        "Who this points at",
        "Whoever designs and certifies the meters: chip vendors themselves (proposals for on-chip attestation and hardware-enabled governance target exactly NVIDIA-class GPUs), metrology and security firms, and the small academic and nonprofit field working on compute verification — the field this track studies. The facility owners install and host the instruments, which is itself a tamper concern.",
      ],
      [
        "The wrinkle in the text",
        "“Where technically and commercially feasible” hands the regulated party a permanent argument that it isn’t. Who gets to rule on feasibility is an actor question wearing a technical costume.",
      ],
      [
        "Why it matters for Module 1",
        "Verification tools do not exist until someone builds, funds, and certifies them. Every one of those someones is an actor with interests.",
      ],
    ],
  },
  secretariat: {
    cat: "inst",
    phrase: "“…approved by the Technical Secretariat…”",
    title: "The verification bureaucracy",
    blocks: [
      [
        "Real-world examples",
        "The OPCW Technical Secretariat in The Hague (~500 staff, administers the Chemical Weapons Convention, 2013 Nobel Peace Prize); the IAEA Secretariat in Vienna (~2,500 staff, runs nuclear safeguards); the CTBTO’s Provisional Technical Secretariat, which operates a global seismic and radionuclide monitoring network for a test-ban treaty that never formally entered into force — the bureaucracy outlived the treaty’s ratification.",
      ],
      [
        "The open question",
        "An AI secretariat needs engineers who can read a training workload. Today virtually all of that talent works at the labs it would be inspecting. Where do neutral inspectors come from?",
      ],
      [
        "Why it matters for Module 1",
        "Institutions are actors with budgets and capabilities, not just mandates. The IAEA’s entire safeguards budget (~€150M/year) is less than the cost of a single frontier training run.",
      ],
    ],
  },
  inspections: {
    cat: "inst",
    phrase: "“…routine inspections… upon fourteen days’ notice… challenge inspection…”",
    title: "The people who knock",
    blocks: [
      [
        "Real-world examples",
        "IAEA safeguards inspectors (roughly 280 people doing in-field verification for the entire planet); UNSCOM and UNMOVIC in Iraq, the most intrusive inspection regimes ever attempted; OPCW teams working in Syria under fire. States can also verify each other directly — the INF and START treaties relied on satellites and “national technical means.”",
      ],
      [
        "The wrinkle in the text",
        "Fourteen days’ notice. In Iraq, inspectors watched trucks leave sites while they waited at the gate. What can leave a datacenter in fourteen days? Model weights move at wire speed.",
      ],
      [
        "Why it matters for Module 1",
        "Inspectors are individual humans with nationalities, clearances, and career incentives — and states can veto individuals (Iraq did; Iran still does). The inspection is only as strong as the person the host state lets through the door.",
      ],
    ],
  },
  council: {
    cat: "inst",
    phrase: "“…approval by a two-thirds majority of the Executive Council.”",
    title: "The political filter",
    blocks: [
      [
        "Real-world examples",
        "The OPCW Executive Council (41 member states) and the IAEA Board of Governors (35). These bodies decide what inspectors may actually do: inspection is technical, but authorization is political.",
      ],
      [
        "The telling fact",
        "The Chemical Weapons Convention’s challenge-inspection mechanism — the same device as Article V(2) here — has never been used in the treaty’s entire history. Invoking it is considered too politically explosive.",
      ],
      [
        "Why it matters for Module 1",
        "Every verification finding must pass through a committee of states voting their interests. A perfect sensor feeding a deadlocked council verifies nothing.",
      ],
    ],
  },
  secrets: {
    cat: "ind",
    phrase: "“Inspectors shall not access, copy, or transmit model parameters, training data, or source code.”",
    title: "The IP guardians",
    blocks: [
      [
        "Who this points at",
        "The labs again, wearing a different hat — Article VI is the clause their lawyers wrote. But also state security agencies: in both Washington and Beijing, frontier model weights are treated as national-security assets, not just trade secrets.",
      ],
      [
        "Historical parallel",
        "The Trilateral Initiative (US–Russia–IAEA, 1996–2002) spent six years designing “information barriers” so inspectors could confirm an object was a warhead without learning its design. Verifying without seeing is solvable in principle and expensive in practice.",
      ],
      [
        "Why it matters for Module 1",
        "The same actor can simultaneously be the regulated party, the technology supplier, and the secrets-holder. Map the hats, not just the names.",
      ],
    ],
  },
  export: {
    cat: "steel",
    phrase: "“States Parties shall not export applicable high-performance computing hardware to non-parties…”",
    title: "The export-control machinery",
    blocks: [
      [
        "Who this points at",
        "National agencies first: the US Bureau of Industry and Security has run chip export controls on China since October 2022, with the Netherlands (ASML) and Japan (tooling) enforcing alongside. Multilateral templates exist too: the Nuclear Suppliers Group, the Wassenaar Arrangement, the MTCR.",
      ],
      [
        "The shadow actors",
        "Every control creates its evader. The A.Q. Khan network smuggled centrifuge technology for decades; today a GPU gray market runs through transshipment hubs. Smugglers are actors the treaty never names but always summons.",
      ],
      [
        "Why it matters for Module 1",
        "A complete actor map includes the actors a rule creates, not just the ones it addresses.",
      ],
    ],
  },
  unsc: {
    cat: "inst",
    phrase: "“…may refer the matter to the United Nations Security Council.”",
    title: "The enforcement dead end",
    blocks: [
      [
        "Who this points at",
        "The UN Security Council: ten elected members and five permanent ones — the United States, China, Russia, the United Kingdom, and France — each holding a veto.",
      ],
      [
        "Historical parallel",
        "Iran and North Korea were both referred. Sanctions followed; North Korea built the bomb anyway. And the states most likely to breach an AI pause are P5 members — able to veto their own referral.",
      ],
      [
        "Why it matters for Module 1",
        "Follow any enforcement chain to its end and you find an actor with the power to break it. That is not a flaw in the drafting; it is the structure of the international system.",
      ],
    ],
  },
  withdrawal: {
    cat: "steel",
    phrase: "“A State Party may withdraw… if… extraordinary events… have jeopardized its supreme interests.”",
    title: "The exit door",
    blocks: [
      [
        "Who this points at",
        "Any party, unilaterally. The “supreme interests / extraordinary events” formula is copied nearly verbatim from the NPT and the Limited Test Ban Treaty.",
      ],
      [
        "Historical parallel",
        "North Korea gave its ninety days’ notice under the NPT in 2003 and tested a weapon three years later. The United States withdrew from the ABM Treaty in 2002. Russia suspended New START in 2023. Legal exits get used — by every kind of state.",
      ],
      [
        "Why it matters for Module 1",
        "An actor’s commitment lasts exactly as long as its incentive to stay. Modeling that incentive is where Module 2’s game theory picks up.",
      ],
    ],
  },
  review: {
    cat: "inst",
    phrase: "“…amended by consensus of all States Parties at a Review Conference…”",
    title: "The renegotiators",
    blocks: [
      [
        "Who this points at",
        "All the parties again — plus the ecosystem around them: scientific advisory bodies, NGO and civil-society observers, arms-control academics, and industry lobbyists working the corridors. Review conferences are where the whole actor map shows up in one room.",
      ],
      [
        "Historical parallel",
        "NPT Review Conferences meet every five years; the 2015 and 2022 conferences both failed to agree on a final document. Consensus amendment means any single party can freeze Article I’s thresholds forever — while compute per dollar keeps falling.",
      ],
      [
        "Why it matters for Module 1",
        "The treaty text is static; the technology and the actor landscape are not. Whoever controls renegotiation controls what the treaty means in year five.",
      ],
    ],
  },
};

/** Quiz-mode content. opts: [text, isCorrect, feedback]. */
export interface QuizOption {
  text: string;
  correct: boolean;
  fb: string;
}
export interface QuizEntry {
  q: string;
  opts: QuizOption[];
  why: string;
}

function opt(text: string, correct: boolean, fb: string): QuizOption {
  return { text, correct, fb };
}

export const QUIZ: Record<string, QuizEntry> = {
  states: {
    q: "Who can actually be a party to this Protocol?",
    opts: [
      opt(
        "National governments — the US, China, France, the UAE…",
        true,
        "Only sovereign states can sign and ratify treaties. In practice a handful matter: the ones with frontier compute.",
      ),
      opt(
        "Frontier labs like OpenAI or Google DeepMind",
        false,
        "Companies cannot join treaties. States sign, then must bind their companies — that gap is the whole game.",
      ),
      opt(
        "Regional blocs like the European Union",
        true,
        "Tricky but yes: the EU is a party to treaties where it holds the legal competence, alongside its member states.",
      ),
      opt(
        "The United Nations itself",
        false,
        "The UN hosts and registers treaties; it is not a party to them.",
      ),
      opt(
        "Sub-national governments like California or Guangdong",
        false,
        "No treaty-making power — even though California alone hosts several covered facilities.",
      ),
    ],
    why: "States are the only actors who can sign — yet almost nothing the Protocol regulates is owned by a state. Every article is a promise to control someone else.",
  },
  labs: {
    q: "Who actually conducts training runs near the 10²⁶ threshold?",
    opts: [
      opt(
        "US frontier labs — OpenAI, Google DeepMind, Anthropic, Meta, xAI",
        true,
        "The organizations this clause is really about; perhaps a dozen worldwide.",
      ),
      opt(
        "Chinese labs — DeepSeek, Alibaba (Qwen), Moonshot",
        true,
        "The other half of the short list. Frontier training is a two-country story so far.",
      ),
      opt(
        "Most university research groups",
        false,
        "Academic compute runs orders of magnitude below 10²⁶. The threshold deliberately exempts them.",
      ),
      opt(
        "Startups fine-tuning open-weight models",
        false,
        "Article I(3) exempts fine-tuning outright — that is the grandfather clause doing its work.",
      ),
      opt(
        "National militaries, today",
        false,
        "No public evidence of frontier-scale military training runs yet — but tomorrow is exactly what drafters worry about.",
      ),
    ],
    why: "Labs are triple-cast: the regulated party, the talent pool any verifier must hire from, and the loudest lobby on both sides of the pause.",
  },
  facility: {
    q: "Who owns and operates the covered facilities?",
    opts: [
      opt(
        "Hyperscalers — Microsoft, Google, Amazon, Meta",
        true,
        "The bulk of frontier compute sits in their datacenters.",
      ),
      opt(
        "GPU clouds and colocation firms — CoreWeave, Equinix",
        true,
        "Neoclouds and datacenter landlords own many of the sites labs actually rent.",
      ),
      opt(
        "Labs building their own — xAI’s Colossus in Memphis",
        true,
        "The build-your-own path; a single site can exceed 100 MW.",
      ),
      opt(
        "Sovereign projects — the UAE’s G42, national supercomputing centers",
        true,
        "States do own some compute directly — the exception that proves the mostly-private rule.",
      ),
      opt(
        "The Technical Secretariat",
        false,
        "It inspects facilities; it owns none. Verifiers hold instruments, not assets.",
      ),
      opt(
        "NVIDIA",
        false,
        "It sells the chips inside nearly every covered facility but rarely operates the sites — a different actor with different incentives.",
      ),
    ],
    why: "The state signs; the facility owner gets inspected. Every facility clause is an obligation a government must impose on a company inside its borders.",
  },
  grandfather: {
    q: "Who benefits from this exemption?",
    opts: [
      opt(
        "Labs holding the strongest pre-freeze models",
        true,
        "The frontier freezes with them on top, and fine-tuning keeps their lead compounding.",
      ),
      opt(
        "Hosts of existing open-weight models",
        true,
        "Adapting released models stays fully legal — the open ecosystem keeps running.",
      ),
      opt(
        "New entrants and startups",
        false,
        "Locked out: they can never train a competitive base model while the pause holds.",
      ),
      opt(
        "States without frontier labs",
        false,
        "Frozen out as have-nots — the NPT’s 1968 asymmetry, replayed with compute.",
      ),
    ],
    why: "Definitions create winners and losers among actors. Losers evade, renegotiate, or refuse to join — actor incentives, not treaty text, predict compliance.",
  },
  jurisdiction: {
    q: "Who would actually enforce this inside each country?",
    opts: [
      opt(
        "US Commerce Department (BIS), possibly DOE",
        true,
        "BIS already runs compute export controls; someone like it would police domestic training runs.",
      ),
      opt(
        "The EU AI Office",
        true,
        "The nearest existing thing to a domestic AI-compute regulator in Europe.",
      ),
      opt(
        "China’s MIIT and CAC",
        true,
        "Beijing’s equivalents — the domestic machinery a Chinese ratification would activate.",
      ),
      opt(
        "The Technical Secretariat",
        false,
        "International bodies verify; they cannot police companies inside a sovereign state. Enforcement is national.",
      ),
      opt(
        "An agency that does not exist yet",
        true,
        "The honest answer: no agency anywhere has “verify no 10²⁶ run occurred” as its mission today.",
      ),
    ],
    why: "Between the treaty and the datacenter sits an entire layer of domestic actors the text never names.",
  },
  hardware: {
    q: "Who makes this hardware, and who buys it?",
    opts: [
      opt(
        "NVIDIA and AMD — chip designers",
        true,
        "They design nearly every accelerator a covered run would use.",
      ),
      opt(
        "TSMC and Samsung — fabricators",
        true,
        "Almost all frontier chips are physically made by TSMC; Samsung is a distant second.",
      ),
      opt(
        "ASML — lithography machines",
        true,
        "A literal monopoly on the EUV machines the fabs require. One company, one chokepoint.",
      ),
      opt(
        "Hyperscalers and labs — the buyers",
        true,
        "The demand side: the same actors regulated elsewhere in the treaty.",
      ),
      opt(
        "The IAEA",
        false,
        "Wrong regime — it safeguards uranium, not GPUs. Though its chokepoint logic is exactly the parallel to study.",
      ),
      opt(
        "Boeing and Airbus",
        false,
        "Dual-use aerospace giants, but not in this supply chain.",
      ),
    ],
    why: "Verification regimes work best where a chokepoint exists. Five or six companies are the chokepoint here — and none of them can sign the treaty.",
  },
  instruments: {
    q: "Who builds and certifies verification instruments like these?",
    opts: [
      opt(
        "Chip vendors — on-chip attestation built into the GPUs",
        true,
        "Hardware-enabled governance proposals target exactly NVIDIA-class accelerators.",
      ),
      opt(
        "Metrology and security firms",
        true,
        "Someone has to manufacture, calibrate, and tamper-proof the meters.",
      ),
      opt(
        "Academic and nonprofit compute-verification researchers",
        true,
        "A small field — the one this track studies — designs the methods everyone else would deploy.",
      ),
      opt(
        "The facility owners who install and host them",
        true,
        "They physically install the instruments, which is itself a tamper concern.",
      ),
      opt(
        "The UN General Assembly",
        false,
        "It passes resolutions; it does not build sensors.",
      ),
    ],
    why: "Verification tools do not exist until someone builds, funds, and certifies them. Every one of those someones is an actor with interests.",
  },
  secretariat: {
    q: "Which real-world bodies is this modeled on?",
    opts: [
      opt(
        "The OPCW Technical Secretariat (chemical weapons)",
        true,
        "About 500 staff in The Hague; administers the CWC; 2013 Nobel Peace Prize.",
      ),
      opt(
        "The IAEA Secretariat (nuclear safeguards)",
        true,
        "About 2,500 staff in Vienna; the deepest verification bureaucracy ever built.",
      ),
      opt(
        "The CTBTO Provisional Technical Secretariat (test ban)",
        true,
        "Runs a global monitoring network for a treaty that never formally entered into force.",
      ),
      opt(
        "The UN Security Council",
        false,
        "A political organ of states, not a technical staff. It appears later, in Article VIII.",
      ),
      opt(
        "The WTO Secretariat",
        false,
        "Administers trade rules; conducts no inspections and fields no instruments.",
      ),
    ],
    why: "Institutions are actors with budgets and capabilities, not just mandates. The IAEA’s safeguards budget is smaller than one frontier training run.",
  },
  inspections: {
    q: "Who has done inspections like these in the real world?",
    opts: [
      opt(
        "IAEA safeguards inspectors",
        true,
        "Roughly 280 people doing in-field verification for the entire planet.",
      ),
      opt(
        "UNSCOM / UNMOVIC in Iraq",
        true,
        "The most intrusive inspection regimes ever attempted — and a study in what notice periods cost.",
      ),
      opt(
        "OPCW inspection teams",
        true,
        "Including work in Syria under fire. Note: the CWC’s challenge inspection has never once been invoked.",
      ),
      opt(
        "States themselves, via satellites and national technical means",
        true,
        "INF and START verification leaned on states watching each other directly.",
      ),
      opt(
        "Private auditors — Deloitte, PwC",
        false,
        "Not in arms control — though AI governance proposals do borrow the audit model, so watch this space.",
      ),
    ],
    why: "Inspectors are individual humans with nationalities, clearances, and career incentives — and host states can veto individuals. Iraq did; Iran still does.",
  },
  council: {
    q: "What are the real-world parallels to this Council?",
    opts: [
      opt(
        "The OPCW Executive Council",
        true,
        "41 member states deciding what inspectors may do. Its challenge-inspection power has never been used.",
      ),
      opt(
        "The IAEA Board of Governors",
        true,
        "35 states; the body that referred Iran to the Security Council.",
      ),
      opt("NATO", false, "A military alliance, not a treaty-verification organ."),
      opt("The G7", false, "An informal club with no treaty role."),
      opt(
        "The International Court of Justice",
        false,
        "Courts adjudicate disputes after the fact; they do not authorize inspections.",
      ),
    ],
    why: "Every verification finding must pass through a committee of states voting their interests. A perfect sensor feeding a deadlocked council verifies nothing.",
  },
  secrets: {
    q: "Whose interests does this clause protect?",
    opts: [
      opt(
        "The labs — this is the clause their lawyers wrote",
        true,
        "Model weights and data are the crown-jewel IP of the regulated party.",
      ),
      opt(
        "State security agencies",
        true,
        "In Washington and Beijing alike, frontier weights are treated as national-security assets, not just trade secrets.",
      ),
      opt(
        "The inspectors",
        false,
        "It constrains them. Their entire job becomes proving things about objects they may not look at.",
      ),
      opt(
        "The open-source community",
        false,
        "Open-weight models have no secrets to shield; this clause is for the closed frontier.",
      ),
    ],
    why: "The same actor can be regulated party, technology supplier, and secrets-holder at once. The nuclear world solved verify-without-seeing with “information barriers” — slowly and expensively.",
  },
  export: {
    q: "Who operates — and who evades — controls like this?",
    opts: [
      opt(
        "The US Bureau of Industry and Security",
        true,
        "Already running chip export controls on China since October 2022.",
      ),
      opt(
        "The Dutch and Japanese governments",
        true,
        "They control ASML and key tooling — enforcement runs through them or not at all.",
      ),
      opt(
        "Multilateral regimes — Nuclear Suppliers Group, Wassenaar",
        true,
        "The templates this article copies: supplier clubs coordinating national controls.",
      ),
      opt(
        "Smuggling networks and the GPU gray market",
        true,
        "Every control creates its evader — A.Q. Khan for centrifuges, transshipment hubs for GPUs. Evaders are actors too.",
      ),
      opt(
        "The World Trade Organization",
        false,
        "It exists to liberalize trade; security export controls are carved out of its rules.",
      ),
    ],
    why: "A complete actor map includes the actors a rule creates — smugglers, shell companies, transshipment hubs — not just the ones it addresses.",
  },
  unsc: {
    q: "Who holds the real power at this final step?",
    opts: [
      opt(
        "The five permanent members with vetoes",
        true,
        "US, China, Russia, UK, France. Nothing passes over any one of them.",
      ),
      opt(
        "The violator itself, if it is a P5 state",
        true,
        "The punchline: the states most able to breach an AI pause can veto their own referral.",
      ),
      opt(
        "The ten elected members",
        true,
        "They vote — nine affirmative votes are needed — but hold no veto. Real, secondary power.",
      ),
      opt(
        "The UN Secretary-General",
        false,
        "Convening power and a bully pulpit, but no vote.",
      ),
      opt(
        "The Technical Secretariat",
        false,
        "Its findings arrive here, but it has no seat at this table.",
      ),
    ],
    why: "Follow any enforcement chain to its end and you find an actor with the power to break it. Iran and North Korea were both referred; North Korea got the bomb anyway.",
  },
  withdrawal: {
    q: "Who has actually walked through exit doors like this?",
    opts: [
      opt(
        "North Korea — NPT withdrawal, 2003",
        true,
        "Gave its ninety days’ notice, tested a weapon three years later. The canonical exit.",
      ),
      opt(
        "The United States — ABM Treaty, 2002",
        true,
        "Great powers use the door too, citing exactly this “supreme interests” logic.",
      ),
      opt(
        "Russia — New START suspension, 2023",
        true,
        "Suspension rather than formal withdrawal, but the same lesson: commitments bend to interests.",
      ),
      opt(
        "No one — withdrawal clauses are theoretical",
        false,
        "The opposite is the lesson. Legal exits get used, by every kind of state.",
      ),
    ],
    why: "An actor’s commitment lasts exactly as long as its incentive to stay. Modeling that incentive is where Module 2’s game theory picks up.",
  },
  review: {
    q: "Who shows up when a treaty gets renegotiated?",
    opts: [
      opt(
        "Diplomats of every state party",
        true,
        "The formal principals — each one a veto under consensus rules.",
      ),
      opt(
        "Scientific advisers",
        true,
        "Someone must tell the diplomats what 10²⁶ means in year five, when compute per dollar has kept falling.",
      ),
      opt(
        "NGOs and civil-society observers",
        true,
        "At NPT Review Conferences, academics and arms-control groups fill the observer seats and shape the record.",
      ),
      opt(
        "Industry lobbyists in the corridors",
        true,
        "Unofficial, unavoidable, and often the best-informed people in the building.",
      ),
      opt(
        "The International Court of Justice",
        false,
        "No role — amendment is politics, not law.",
      ),
    ],
    why: "The 2015 and 2022 NPT Review Conferences both collapsed without agreement. Whoever controls renegotiation controls what the treaty means in year five.",
  },
};

/** Phrase order for the drawer's prev/next navigation and progress counting. */
export const ORDER = [
  "states",
  "labs",
  "facility",
  "grandfather",
  "jurisdiction",
  "hardware",
  "instruments",
  "secretariat",
  "inspections",
  "council",
  "secrets",
  "export",
  "unsc",
  "withdrawal",
  "review",
] as const;

/**
 * A run of the treaty document. A `text` run is inert prose; an `hl` run is a
 * highlighted, clickable phrase pointing at an actor id (`a`). Reproduces the
 * inline markup of the source .doc article exactly (including the (n) numerals).
 */
export type DocRun =
  | { kind: "text"; text: string }
  | { kind: "num"; text: string }
  | { kind: "hl"; a: string; text: string };

export interface DocArticle {
  heading: string;
  runs: DocRun[];
}

const t = (text: string): DocRun => ({ kind: "text", text });
const n = (text: string): DocRun => ({ kind: "num", text });
const h = (a: string, text: string): DocRun => ({ kind: "hl", a, text });

/**
 * The Reykjavik Protocol, article by article. Highlight phrases (`h`) key on
 * the actor id (data-a in the source). Note Article V uses `inspections` twice.
 */
export const DOC: DocArticle[] = [
  {
    heading: "Preamble",
    runs: [
      h("states", "The States Parties to this Protocol"),
      t(
        ", recognizing that certain applications of advanced artificial intelligence may pose risks to international security, have agreed as follows:",
      ),
    ],
  },
  {
    heading: "Article I — Definitions",
    runs: [
      n("(1)"),
      t(" “Covered training run” means "),
      h("labs", "the training of a single general-purpose artificial intelligence model"),
      t(" using more than 10²⁶ computational operations. "),
      n("(2)"),
      t(" “Covered facility” means "),
      h("facility", "any installation with power capacity exceeding 10 megawatts"),
      t(" operated for the purpose of artificial intelligence computation. "),
      n("(3)"),
      t(" The "),
      h(
        "grandfather",
        "fine-tuning, continued development, or adaptation of models trained before entry into force",
      ),
      t(" of this Protocol shall not constitute a covered training run."),
    ],
  },
  {
    heading: "Article II — Core Obligation",
    runs: [
      t("No State Party shall conduct, authorize, or "),
      h("jurisdiction", "knowingly permit within its jurisdiction"),
      t(" any covered training run for a period of five years from entry into force."),
    ],
  },
  {
    heading: "Article III — Declarations",
    runs: [
      n("(1)"),
      t(" Each State Party shall, within 180 days, declare all covered facilities and all holdings of "),
      h("hardware", "applicable high-performance computing hardware"),
      t(" exceeding one thousand units, as specified in Annex A. "),
      n("(2)"),
      t(" Declarations shall be updated annually."),
    ],
  },
  {
    heading: "Article IV — Monitoring",
    runs: [
      t("Declared covered facilities shall install "),
      h("instruments", "power metering and workload verification instruments"),
      t(" approved by the "),
      h("secretariat", "Technical Secretariat"),
      t(", where technically and commercially feasible."),
    ],
  },
  {
    heading: "Article V — Inspections",
    runs: [
      n("(1)"),
      t(" The Technical Secretariat may conduct "),
      h("inspections", "routine inspections of declared facilities upon fourteen days’ notice"),
      t(". "),
      n("(2)"),
      t(" Any State Party may request a "),
      h("inspections", "challenge inspection"),
      t(" of any facility of another State Party; such inspection shall proceed upon approval by a two-thirds majority of the "),
      h("council", "Executive Council"),
      t("."),
    ],
  },
  {
    heading: "Article VI — Confidentiality",
    runs: [
      t("Inspectors shall not access, copy, or transmit "),
      h("secrets", "model parameters, training data, or source code"),
      t(
        ". Managed access procedures shall be specified in Annex B, to be concluded by the Executive Council no later than two years after entry into force.",
      ),
    ],
  },
  {
    heading: "Article VII — Non-Parties",
    runs: [
      t("States Parties shall not "),
      h("export", "export applicable high-performance computing hardware to non-parties"),
      t(", except as licensed for verified civilian purposes."),
    ],
  },
  {
    heading: "Article VIII — Non-Compliance",
    runs: [
      t(
        "Upon a finding of non-compliance by the Executive Council, the Council may recommend measures to restore compliance, and may refer the matter to the ",
      ),
      h("unsc", "United Nations Security Council"),
      t("."),
    ],
  },
  {
    heading: "Article IX — Withdrawal",
    runs: [
      t("A State Party may "),
      h("withdrawal", "withdraw from this Protocol upon ninety days’ notice"),
      t(
        " if it decides that extraordinary events related to the subject matter of this Protocol have jeopardized its supreme interests.",
      ),
    ],
  },
  {
    heading: "Article X — Review and Amendment",
    runs: [
      t("The thresholds and definitions in Article I may be amended by consensus of all States Parties at a "),
      h("review", "Review Conference"),
      t(", the first of which shall convene three years after entry into force."),
    ],
  },
];

/** Static copy for the widget shell, lifted from the source hero/doc/done text. */
export const PROTOCOL_ACTORS_COPY = {
  subLearn:
    "You dissected the Reykjavik Protocol in Module 0 as text. Read it again with a different question: every phrase below points at someone — a government, a company, a bureaucracy, an inspector. Click each highlighted phrase to meet the actors behind it. This is the cast Module 1 puts under the microscope.",
  subQuiz:
    "Same treaty, no answers given. Click each highlighted phrase and pick which real-world actors it puts in the room — who owns it, who runs it, who has done this before. Several answers per phrase; distractors included. If you want the guided tour first, switch to mode 1.",
  tabLearn: "1 · Meet the actors",
  tabQuiz: "2 · Quiz yourself",
  legend: [
    { cat: "steel" as ActorCat, label: "States & their machinery" },
    { cat: "ind" as ActorCat, label: "Industry" },
    { cat: "inst" as ActorCat, label: "Institutions & inspectors" },
  ],
  docEyebrow: "Full text · fictional",
  docTitle: "The Reykjavik Protocol",
  docLede:
    "The agreement several Module 0 specimens were drawn from. You will work with this document again in the dissection and the stress test.",
  doneLearnEyebrow: "Cast complete",
  doneLearnTitle: "You have met all fifteen.",
  doneLearnBody:
    "Governments that sign, companies that own everything being regulated, institutions that stand between them. Module 1 gives each of these actors a full scouting report — where it sits, what it can do, what it wants.",
  doneLearnCta: "Test yourself in quiz mode →",
  doneQuizEyebrow: "Quiz complete",
  doneQuizTitle: "The full cast, named.",
  doneQuizBody:
    "Every phrase you just graded is a row on Module 1’s actor map: where each actor sits, what it can do, what it wants. Anything you missed here, the map will fill in.",
  quizHint: "Select every option that belongs, then check. More than one is correct.",
  quizKicker: "Name the actors",
  checkBtn: "Check answer",
  whyLabel: "Why it matters for Module 1",
  prevBtn: "← Previous phrase",
  nextBtn: "Next phrase →",
  close: "Close",
} as const;
