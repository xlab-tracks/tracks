/**
 * Verbatim curriculum content for the "IR Primer" widget
 * (International Relations for People Who Build Things).
 *
 * Ported from public/verification/ir-primer.html +
 * public/verification/content/ir-primer.json. All pedagogical text is
 * human-authored and copied EXACTLY — do not paraphrase, shorten, or invent.
 *
 * The 38 popup bodies are authored HTML fragments rendered via
 * dangerouslySetInnerHTML inside a Dialog.
 */

export const IR_PRIMER_TABS = [
  { key: "v1", label: "1 · No Root Authority" },
  { key: "v2", label: "2 · The Willingness Question" },
  { key: "v3", label: "3 · Cooperation Anyway" },
  { key: "v4", label: "4 · Treaty Mechanics" },
  { key: "v5", label: "5 · Lenses" },
  { key: "v6", label: "6 · The Actors" },
  { key: "v7", label: "7 · Mini-Case: NPT" },
  { key: "v8", label: "8 · Self-Check" },
] as const;

export type IrPrimerTabKey = (typeof IR_PRIMER_TABS)[number]["key"];

/** 38 authored popup bodies (id -> inner HTML). Rendered verbatim. */
export const IR_PRIMER_POPUPS: Record<string, string> = {
  "p-selfhelp":
    '<h3>Self-help</h3>\n    <p>If no one above you will protect you, you must provide for your own security. Every state\'s baseline strategy is self-help, which is why "just trust each other" fails structurally, not because leaders are unusually dishonest.</p>\n    <p>Design consequence: any agreement between states must be <strong>self-enforcing</strong> — each party has to prefer staying in, given only what it can observe and do for itself. Verification is what makes "given what it can observe" a meaningful phrase.</p>',
  "p-secdilemma":
    '<h3>The security dilemma</h3>\n    <p>One state\'s defensive measure is indistinguishable, from outside, from preparation for offense. So defensive moves trigger counter-moves, and two states that each only want safety can rationally arms-race. This is the engine behind the ASI race dynamic in Module 0.</p>\n    <p>The AI version: a national compute buildup "for economic competitiveness" and one "for a military breakout" look identical from a satellite. Ambiguity is the fuel; transparency mechanisms exist to drain it. When you meet the US–China compute race in the Actors section, you\'re watching a security dilemma run in real time.</p>',
  "p-notchaos":
    "<h3>Anarchy ≠ nothing works</h3>\n    <p>Most treaties are honored most of the time — states keep agreements when keeping them is cheaper than the consequences of breaking them. The interesting questions are always at the margin: <em>which</em> agreements hold, <em>when</em> do they break, and <em>what makes defection visible early enough to matter?</em> That last question is this course.</p>",
  "p-repetition":
    '<h3>Repetition</h3>\n    <p>States interact forever, across many issues. Defecting today poisons every future deal — the "shadow of the future." Cooperation can be the equilibrium of a repeated game even between pure egoists.</p>\n    <p>The catch for AI: repetition only disciplines behavior if the game <em>continues</em>. A successful ASI breakout is a move that ends the repeated game — which is why the shadow of the future does less work here than in trade or even nuclear arms control, and why detection speed has to do more.</p>',
  "p-reputation":
    "<h3>Reputation</h3>\n    <p>Other states are watching. A state caught cheating on one agreement pays a premium on every subsequent negotiation, with everyone. Reputation is a shared cache of past behavior.</p>\n    <p>Note the dependency: reputation only updates on <em>caught</em>. An undetected violation costs nothing. Reputation systems are downstream of the observability layer.</p>",
  "p-reciprocity":
    "<h3>Reciprocity &amp; linkage</h3>\n    <p>Compliance can be made conditional — I comply while you do — and issues can be linked: cheat on arms control, lose trade access. Linkage lets states bring costs from one domain to enforce another.</p>\n    <p>Linkage is why the supply-chain map in the Actors section matters so much: export controls, market access, and materials leverage are exactly the kind of cross-domain costs an AI agreement could borrow for enforcement.</p>",
  "p-institutions":
    "<h3>What institutions actually do</h3>\n    <p>Bodies like the IAEA don't enforce anything — remember, no root. What they do is subtler and more important: they <strong>reduce information asymmetry</strong>. They standardize what counts as compliance, collect and pool monitoring data, provide neutral inspectors whose findings all sides accept, and create focal points so a hundred states don't need ten thousand bilateral deals.</p>\n    <p>In systems terms: institutions don't execute the protocol, they provide the <em>observability layer</em> that makes the protocol's incentives work.</p>",
  "p-negotiation":
    "<h3>Stage 1 · Negotiation</h3>\n    <p>Parties draft text; scope, definitions, and thresholds are fought over word by word. Cheap to participate in — states negotiate things they never intend to join — but this is where the technical substance gets decided.</p>\n    <p>For an AI treaty, negotiation is where \"frontier model\" gets an operational definition and where the compute threshold gets a number. Engineers who aren't in the room at this stage inherit whatever the lawyers guessed.</p>",
  "p-signature":
    "<h3>Stage 2 · Signature</h3>\n    <p>The executive signs. It signals intent and creates a weak obligation not to defeat the treaty's object and purpose — but binds almost nothing. Signature is cheap talk with a pen.</p>",
  "p-ratification":
    "<h3>Stage 3 · Ratification</h3>\n    <p>The domestic legislature approves and implementing law follows. This is where treaties die — it spends real political capital and creates internal enforcement machinery that is expensive to quietly reverse.</p>\n    <p>US-specific note that matters for AI: Senate ratification needs a two-thirds vote, which modern polarization makes nearly unreachable — so expect any US–China AI arrangement to be shaped as an <em>executive agreement</em> or political commitment rather than a formal treaty, with all the durability questions that raises.</p>",
  "p-entry":
    "<h3>Stage 4 · Entry into force</h3>\n    <p>Enough parties ratify — a negotiated threshold — and obligations activate. Threshold design is strategic: set it too high and the treaty idles forever (the CTBT has been signed since 1996 and is still not in force because specific named states must ratify); too low and it binds a club too small to matter.</p>",
  "p-compliance":
    "<h3>Stage 5 · Compliance</h3>\n    <p>Ongoing implementation, reporting, inspections. The long game — and where verification lives. Sustained compliance under monitoring is the most expensive signal a state can send, which is why it's the most informative.</p>\n    <p>Almost everything in Modules 2–4 of this track is about engineering this stage for compute: what to monitor, how often, with what access, and how fast anomalies surface.</p>",
  "p-withdrawal":
    "<h3>Stage 6 · Withdrawal</h3>\n    <p>Most treaties include a legal exit with notice — NPT Article X requires 90 days. North Korea used it in 2003 and tested a weapon three years later.</p>\n    <p>Design implication: a treaty's real strength is bounded by what the world can do <em>within the notice period</em>. For ASI, ask: what does \"90 days\" buy you against an actor who withdrew because it was already close to breakout? Withdrawal clauses are the legal wrapper around the breakout-time problem.</p>",
  "p-contains":
    "<h3>What a treaty text contains</h3>\n    <p>Definitions of prohibited activity, thresholds (the measurable trigger — for us, compute), covered entities, obligations, inspection and reporting rights, duration, amendment procedures, withdrawal clauses, and often <strong>reservations</strong> — unilateral opt-outs from specific provisions a state files on joining.</p>",
  "p-omits":
    "<h3>What it deliberately omits</h3>\n    <p>How intelligence agencies will actually monitor (states never disclose sources and methods), what specifically happens on violation (often left vague to preserve flexibility), and side understandings. Treaties are the explicit layer of a mostly implicit system — a theme Module 0.2.4 develops.</p>",
  "p-hardsoft":
    "<h3>Hard vs. soft law</h3>\n    <p><strong>Hard law</strong> is a ratified treaty: legally binding, costly to exit. <strong>Soft law</strong> is declarations, codes of conduct, summit communiqués: fast to produce, cheap to abandon. Soft law isn't useless — it builds vocabulary and focal points — but never mistake a declaration for a commitment. Apply the willingness test.</p>\n    <p>Nearly everything that exists in AI governance today — summit declarations, voluntary commitments, codes of practice — is soft law. That's not a failure; it's the normal first stage of a regime. The question is whether the hard layer arrives before it's needed.</p>",
  "p-protocols":
    "<h3>Amendments &amp; protocols</h3>\n    <p>Treaties get extended by attached <strong>protocols</strong> — the IAEA's Additional Protocol (1997) massively expanded inspection rights after Iraq exposed the old system's blind spots. Regimes are versioned, and versions ship after failures. Expect the same for AI — and note the uncomfortable corollary: the first version of an AI verification regime will have blind spots, and the patch cycle had better be faster than the capability cycle.</p>",
  "p-realism":
    '<h3>Realism — power is the variable</h3>\n    <p>Anarchy dominates everything. States care about <strong>relative gains</strong> — not "do I benefit?" but "do I benefit <em>more than my rival</em>?" — because today\'s partner is tomorrow\'s threat. Treaties are epiphenomenal: they hold when they mirror the balance of power and shatter when they don\'t.</p>\n    <p><strong>Predicts:</strong> states will pay almost anything to avoid falling behind in strategic tech, and will cheat on any deal that freezes them in second place.</p>',
  "p-liberal":
    "<h3>Liberal institutionalism — information is the variable</h3>\n    <p>States are self-interested, sure — but cooperation failures are mostly <strong>information failures</strong>: fear of being cheated, not desire to cheat. Institutions fix this by monitoring, standardizing, and lengthening the shadow of the future. <strong>Absolute gains</strong> can trump relative ones when defection is detectable.</p>\n    <p><strong>Predicts:</strong> states will pay for verification machinery because it's cheaper than an unconstrained race; regimes deepen over time as trust compounds.</p>",
  "p-constructivism":
    "<h3>Constructivism — norms are the variable</h3>\n    <p>Interests aren't fixed inputs — they're constructed by identity and shared norms. Nuclear weapons haven't been used since 1945 not only from deterrence math but because a <strong>taboo</strong> formed: use became unthinkable for a certain kind of state. Stigma is a real cost.</p>\n    <p><strong>Predicts:</strong> states will pay to avoid pariah status; a strong norm against ASI development would do enforcement work no inspector can.</p>",
  "p-sc-materials":
    "<h3>Stage 1 · Materials &amp; refining — China's counter-lever</h3>\n    <p>China dominates the unglamorous bottom of the stack: roughly 60% of rare-earth mining and about 90% of refining, plus commanding positions in gallium and germanium. Since 2023 it has turned this into policy — export controls on gallium/germanium, then rare-earth licensing regimes — explicitly mirroring US chip controls.</p>\n    <p>Nuance: leading-edge chips themselves need modest amounts of this stuff. The leverage is broader — magnets, optics, defense systems, the industrial base around the AI buildout — and it works as <strong>cross-domain linkage</strong>: pain China can impose in response to compute controls. The US and allies are rebuilding refining capacity, but that's a years-long project.</p>",
  "p-sc-design":
    "<h3>Stage 2 · Chip design &amp; EDA — the US home game</h3>\n    <p>The blueprints layer is overwhelmingly American: NVIDIA holds most of the AI-accelerator market, with AMD, Google (TPUs), and Amazon designing the rest of the West's serious silicon. Deeper still, the electronic design automation (EDA) software every chip designer needs comes from essentially three firms — Synopsys, Cadence (both US), and Siemens EDA — a chokepoint so narrow it's been used as an export-control valve.</p>\n    <p>China's answer: Huawei's HiSilicon designs credible accelerators (the Ascend line). Design talent is not China's constraint — <em>fabricating</em> those designs at the leading edge is (see Stage 4).</p>",
  "p-sc-litho":
    "<h3>Stage 3 · Fab equipment — Europe's one hard chokepoint</h3>\n    <p>The single tightest bottleneck in the entire stack: <strong>ASML</strong> (Netherlands) is the only company on earth that builds EUV lithography machines, required for the most advanced chips. No EUV tool has ever been exported to China, and since 2023 the Netherlands — under heavy US pressure and with its own decisions — restricts advanced DUV immersion tools too. US firms (Applied Materials, Lam Research, KLA) and Japan (Tokyo Electron) control most of the rest of the toolchain.</p>\n    <p>This is the EU's realest form of power in the AI race, and it's why \"US export controls\" are really <strong>alliance export controls</strong> — Washington's leverage runs through Veldhoven and Tokyo. China's domestic tool effort (SMEE et al.) is the long pole in its self-sufficiency tent: probably a decade behind at the leading edge.</p>",
  "p-sc-fab":
    "<h3>Stage 4 · Fabrication — Taiwan, the single point of failure</h3>\n    <p><strong>TSMC fabricates on the order of 90% of the world's leading-edge logic chips</strong> — including essentially every NVIDIA accelerator — on an island Beijing claims and Washington ambiguously defends. Samsung (Korea) is the only other leading-edge player; Intel is trying to re-enter with CHIPS Act support; new TSMC fabs in Arizona shave the concentration but lag the frontier in Taiwan.</p>\n    <p>China's SMIC produces 7nm-class chips <em>without EUV</em> using multi-patterning — genuinely impressive, expensive, yield-constrained, and a sign that export controls slow rather than stop. The strategic upshot: the AI supply chain's most critical node sits on the world's most dangerous flashpoint. See the Taiwan tile below — this single fact couples the AI race to war risk.</p>",
  "p-sc-memory":
    "<h3>Stage 5 · Memory &amp; advanced packaging — the quiet bottleneck</h3>\n    <p>AI accelerators are bandwidth-hungry: <strong>high-bandwidth memory (HBM)</strong> comes from SK Hynix (leader), Samsung, and Micron — Korea and the US. And stitching HBM to GPU dies requires advanced packaging (TSMC's CoWoS), which has repeatedly been the actual constraint on how many accelerators the world can produce per quarter.</p>\n    <p>China's CXMT is pushing into HBM from behind, and packaging plays to China's strength in mature-node, high-volume manufacturing. Watch this layer: it's less famous than lithography but has been the binding constraint more often.</p>",
  "p-sc-energy":
    "<h3>Stage 6 · Data centers &amp; energy — China's structural advantage</h3>\n    <p>Today the US holds by far the largest stock of frontier AI compute, fed by hundreds of billions per year in hyperscaler capex. But the binding constraint on the US buildout is <strong>electricity</strong> — interconnection queues, permitting, transmission. China adds grid capacity at a pace the US hasn't matched in decades and runs a state-directed datacenter program on top of it.</p>\n    <p>China's mirror-image constraint is <strong>chips per watt</strong>: abundant power feeding scarcer, less efficient accelerators (Ascend vs. NVIDIA). The race in one line: the US has the chips and not the power; China has the power and not the chips. Each side's treaty calculus depends on which constraint it expects to solve first.</p>",
  "p-sc-models":
    "<h3>Stage 7 · Frontier models — US lead, measured in months</h3>\n    <p>The frontier itself is American: OpenAI, Anthropic, and Google DeepMind have set the pace since 2022. But the gap to Chinese labs — DeepSeek, Alibaba's Qwen, Moonshot, and others — is now measured in months, not years. The <strong>DeepSeek moment</strong> (January 2025) was the load-bearing proof: a Chinese lab producing a near-frontier reasoning model at a fraction of the assumed compute cost, despite export controls.</p>\n    <p>Strategic reading: compute controls raise the cost of the frontier but don't fence off the territory — algorithmic efficiency leaks around hardware chokepoints. For verification design this is a crucial humility: a compute-only regime watches the biggest driver of capability, not the only one.</p>",
  "p-sc-diffusion":
    "<h3>Stage 8 · Distribution &amp; diffusion — the contested endgame</h3>\n    <p>Whose AI does the rest of the world actually run? The US exports the top of the market: proprietary APIs, hyperscaler cloud, enterprise deals — but export controls deliberately shrink where its best hardware can go. China exports the bottom-up path: <strong>open-weight models</strong> anyone can download and fine-tune, plus the Huawei-style bundle of cheap infrastructure — a strategy with a proven track record from telecoms.</p>\n    <p>The EU shapes this layer differently: it can't supply the models but regulates access to 450 million rich-world consumers, so its rules (the AI Act) become global compliance defaults — the <strong>Brussels effect</strong>. Why the layer matters for this course: whichever stack diffuses becomes the installed base any treaty must monitor, and the supplier gains standard-setting power over what \"compliant AI\" even means.</p>",
  "p-usa":
    "<h3>United States — the incumbent</h3>\n    <p><strong>Position:</strong> leads frontier models and installed compute; controls the hardware chokepoints, but indirectly — through Dutch, Japanese, Taiwanese, and Korean firms it must keep aligned.</p>\n    <p><strong>Strategy:</strong> run faster (massive private capex, CHIPS Act) while slowing the rival — the October 2022 export controls and their successive expansions. The stated doctrine began as \"small yard, high fence\"; the yard has grown every year since.</p>\n    <p><strong>Structure quirk that matters:</strong> the US frontier is <em>privately owned</em>. Washington doesn't control OpenAI, Anthropic, or Google the way Beijing can direct its champions — the unitary-actor abstraction leaks hardest here (Module 1 territory).</p>\n    <p><strong>Willingness profile:</strong> demonstrably willing to pay large economic costs to keep a compute lead. Historically <em>unwilling</em> to ratify treaties (CTBT, signed 1996, never ratified) — so expect US commitments shaped as executive agreements, with durability across administrations as the open question. One more tell: by building export-control enforcement (chip tracking, end-use checks), the US is already constructing half the machinery a verification regime would need — for competitive reasons.</p>",
  "p-china":
    "<h3>China — the rising power</h3>\n    <p><strong>Position:</strong> behind at the leading edge of chips (no EUV, constrained fabs) but ahead on energy buildout, manufacturing scale, materials, and increasingly competitive at the model layer via efficiency and open weights.</p>\n    <p><strong>Strategy:</strong> whole-nation self-sufficiency (the \"Big Fund,\" SMIC, Huawei's Ascend stack) to escape the chokepoints; fast-follow plus open-weight diffusion to win the installed base abroad; counter-leverage (rare earths) to raise the price of US pressure. Since 2018, Beijing has repeatedly accepted short-term economic pain for long-term autonomy — that is a willingness signal, and you should read it as one.</p>\n    <p><strong>What Beijing actually optimizes for:</strong> regime security first. This cuts both ways: it fuels the race (falling behind the US is a security threat) but also creates a real, narrow basis for restraint — an uncontrolled ASI is a threat to Party control too, and Chinese officials have said versions of this out loud.</p>\n    <p><strong>Verification-relevant frictions:</strong> civil-military fusion blurs the declared/covert boundary that regimes like the IAEA's rely on; sovereignty sensitivity makes intrusive inspection a hard sell. But the record isn't empty — China hosts international monitoring stations under the CTBT and participates in verification machinery when the deal is symmetric. Symmetry is the price of admission.</p>",
  "p-eu":
    "<h3>EU &amp; other players — chokepoints, rules, and venues</h3>\n    <p><strong>The EU is not a frontier racer</strong> — Mistral and a handful of others are respectable, not pace-setting. Its power in this game is of three different kinds:</p>\n    <ul>\n      <li><strong>A hard chokepoint:</strong> ASML's EUV monopoly (Netherlands) — the alliance's single most decisive piece of leverage over China's compute trajectory.</li>\n      <li><strong>Rule-writing:</strong> the AI Act (in force 2024, obligations phasing in through 2027) is the world's first comprehensive AI law; via the Brussels effect its definitions and audit requirements become global defaults — regulatory vocabulary a future treaty can borrow.</li>\n      <li><strong>Venue and broker capital:</strong> verification institutions historically live on neutral-ish ground (IAEA in Vienna, OPCW in The Hague). Europe is the plausible host and honest-broker layer for an AI regime the two principals won't let each other run.</li>\n    </ul>\n    <p><strong>Others worth naming:</strong> the UK (AI Security Institute, convener of the summit series begun at Bletchley 2023 — the first genuinely international AI-safety track), Japan and Korea (toolchain and memory), Taiwan (the fab), and the Gulf states (capital plus datacenter ambitions, courted by both sides). The EU's structural risk: rule-taker squeeze — regulating a race run by two powers that can, where it matters, ignore it.</p>",
  "p-timeline":
    "<h3>How we got here — the arc in six dates</h3>\n    <ul>\n      <li><strong>2001–2015 · Engagement era.</strong> China enters the WTO; the US bets that integration produces convergence. It produces a peer competitor instead.</li>\n      <li><strong>2018 · The turn.</strong> Trade war begins; Huawei hits the Entity List. Technology explicitly becomes the terrain of competition.</li>\n      <li><strong>October 2022 · Compute becomes a controlled substance.</strong> Sweeping US export controls on advanced chips, chipmaking tools, and even US persons' assistance — the founding act of compute geopolitics, tightened repeatedly since (with allied Dutch/Japanese controls following in 2023).</li>\n      <li><strong>November 2023 · The cooperative track opens.</strong> Bletchley Declaration — 28 states including both the US and China acknowledge frontier-AI risk; summit series continues (Seoul 2024, Paris 2025). Soft law, but the first shared vocabulary.</li>\n      <li><strong>January 2025 · The DeepSeek shock.</strong> A Chinese lab ships a near-frontier reasoning model at startlingly low cost — proof that controls slow but don't stop, and that the model gap is months.</li>\n      <li><strong>2025 → · Tit-for-tat maturity.</strong> China weaponizes rare-earth licensing; the US oscillates on what to sell (the H20 saga); both sides pour capital into their own stacks. Strategic competition is now the stable baseline — every cooperative proposal gets evaluated inside it.</li>\n    </ul>\n    <p>The arc to internalize: <em>engagement → competition → managed rivalry(?)</em> — and the entire verification agenda is a bet on what goes in the parenthesis.</p>",
  "p-taiwan":
    "<h3>Taiwan — where the stack meets war risk</h3>\n    <p>Beijing regards Taiwan as sovereign Chinese territory and has never renounced force; Washington maintains \"strategic ambiguity\" about defending it; and TSMC fabs ~90% of the world's leading-edge chips there. The AI supply chain's most critical node sits directly on the most plausible great-power flashpoint.</p>\n    <p>Three consequences for this course. <strong>First</strong>, escalation coupling: a Taiwan crisis is instantly a global compute crisis, which disciplines both sides — the \"silicon shield\" argument — but also gives each an incentive to reduce dependence, and every fab built elsewhere thins the shield. <strong>Second</strong>, any US–China AI agreement implicitly prices Taiwan risk: a regime that collapses on day one of a blockade wasn't a regime. <strong>Third</strong>, breakout math: if a war took TSMC offline, the existing stock of accelerators — who holds them and how visible they are — becomes the whole game overnight. Compute accounting isn't an accounting exercise.</p>",
  "p-thinlayer":
    "<h3>The thin institutional layer</h3>\n    <p>By the 1980s, the US and USSR had decades of arms-control muscle memory: a hotline (installed 1963, after Cuba), SALT/START negotiating cadres, agreed counting rules, and eventually thousands of on-site inspections under INF and START. Adversaries, but adversaries with <em>protocols</em>.</p>\n    <p>US–China have almost none of this. Military-to-military channels are thin and get suspended in every crisis; there is no arms-control treaty between them at all (China declined to join US–Russia strategic frameworks, noting its far smaller arsenal); the first intergovernmental AI dialogue met only in 2024 and produced little beyond an in-principle understanding that humans, not AI, should control nuclear launch decisions.</p>\n    <p>Implication for the track: the CBM stage — hotlines, incident notifications, data exchanges, observer visits — isn't a warm-up you can skip. It's where the muscle memory gets built, and for AI it has to be built from scratch, fast, between rivals with very little practice trusting each other's paperwork.</p>",
  "p-precedent":
    "<h3>Why cooperation isn't naive</h3>\n    <p>The historical pattern: rivals sign verified agreements <em>at</em> maximum hostility, not after it — provided one condition holds. The Limited Test Ban Treaty came ten months after the Cuban Missile Crisis; the hotline, the same year; INF inspections happened between powers pointing thousands of warheads at each other. Fear, not friendship, is the input. The condition is that <strong>both sides fear the uncontrolled outcome more than they fear the deal</strong> — and that verification exists to make the deal survivable for the suspicious.</p>\n    <p>The AI translation: both Washington and Beijing have reasons to fear an uncontrolled race — loss-of-control risk, proliferation to non-state actors, and for Beijing specifically, an ASI that threatens Party control. Neither will trust; that was never the requirement. The requirement is machinery that lets each <em>check</em>. Which is why the remaining modules are about the machinery.</p>",
  "p-npt-real":
    "<h3>Realist reading of the NPT</h3>\n    <p>The NPT codified the existing power distribution — the five who had weapons kept them. It held where great powers wanted it to hold and failed where a determined state (DPRK) valued the bomb above every cost the system could impose. Safeguards exist because no one trusted anyone: verification is institutionalized suspicion, and that's a compliment.</p>",
  "p-npt-lib":
    "<h3>Institutionalist reading of the NPT</h3>\n    <p>Fifty-plus years, 190 parties, and far fewer nuclear states than 1960s forecasts predicted — because the IAEA made restraint <em>observable</em>. Neighbors could forgo weapons without fearing each other's secret programs. And the Iraq failure produced a stronger protocol: institutions learn. The regime is imperfect and indispensable at once.</p>",
  "p-npt-con":
    "<h3>Constructivist reading of the NPT</h3>\n    <p>The treaty's quiet triumph is that acquiring nuclear weapons became <em>deviant</em> — states that could easily build them don't, partly because \"nuclear-armed\" is no longer an identity most states want. The taboo does enforcement work no inspector performs. Question for this course: can ASI development be stigmatized the same way, and how fast?</p>",
};

/** Small labelled tile that opens a popup dialog. */
export interface IrPopupTile {
  pop: string;
  /** Optional lens tag prefix rendered before the heading. */
  tag?: "real" | "lib" | "con";
  /** Heading text (may follow a tag). */
  heading: string;
  body: string;
}

// ---- Section 1: Anarchy ----
export const IR_V1 = {
  h2: "There is no root authority",
  lede: "One fact generates most of international relations. Internalize it and the rest of this primer — and this course — follows.",
  p1: "Inside a country, agreements work because an enforcement layer sits above the parties. Sign a contract, break it, get sued: courts and police exist, and neither party runs them. Between countries, no such layer exists. There is no world government, no global police, no court with compulsory jurisdiction over unwilling great powers. IR calls this condition anarchy — not chaos, just the absence of a ruler.",
  calloutTitle: "The systems analogy",
  calloutBody:
    "The international system is a distributed network of self-interested agents with no trusted third party and no admin. Nobody has root. Agreements between states are protocols that any node can silently stop following. There is no runtime that executes a treaty and no exception handler when one party defects — only whatever detection and response the other parties built for themselves.",
  tiles: [
    {
      pop: "p-selfhelp",
      heading: "Self-help",
      body: "No one above you will protect you — so every state's baseline strategy is protecting itself.",
    },
    {
      pop: "p-secdilemma",
      heading: "The security dilemma",
      body: "How two states that each only want safety can rationally end up in an arms race.",
    },
    {
      pop: "p-notchaos",
      heading: "Anarchy ≠ nothing works",
      body: "Most treaties hold most of the time. The interesting questions live at the margin.",
    },
  ] as IrPopupTile[],
} as const;

// ---- Section 2: Willingness ----
export const IR_V2 = {
  h2: "States as agents — and the question that actually matters",
  lede: 'IR routinely says things like "China wants X" or "the US seeks Y." Learn what that abstraction hides, then replace it with a better question.',
  p1: 'Treating a state as a single decision-maker with coherent goals — the unitary actor model — is a lossy abstraction, like calling a distributed system "the server." Real states are bureaucracies, factions, leaders, and firms pulling in different directions. The abstraction is still useful; just know it leaks, and know that Module 1 is largely about where it leaks (labs and states, for instance, are not the same actor and do not want the same things).',
  mindsetKick: "The core mindset of this track",
  mindsetStrike: "What does China want?",
  mindsetRest: "What is China willing to do to get it?",
  mindsetP1:
    '"What does an actor want?" is nearly useless, because the answers are universal: every state wants security, prosperity, status, and a lead in strategic technology. Every lab wants to build powerful AI safely. Stated preferences are free to produce and therefore carry almost no information.',
  mindsetP2:
    "The analytically useful question is about cost tolerance: what is the actor willing to pay, risk, forgo, or endure to achieve X — and to avoid not-X? Willingness is expensive to fake, which is why costly actions are data and statements are, mostly, noise. Engineers know this distinction as revealed preference; IR knows it as costly signaling versus cheap talk.",
  mindsetP3:
    "Every actor analysis in this course runs on this question. Not \"does Beijing want to avoid an ASI catastrophe?\" (yes, presumably — so does everyone). Instead: is it willing to accept foreign inspectors inside military-adjacent data centers? To cap the compute of its national champions? To forgo a covert program even when it suspects the US is running one? Those willingnesses — not the wants — determine what a treaty can be.",
  sorterH3: "Calibrate: cheap talk or costly signal?",
  sorterLede:
    "For each item, ask: how expensive would this be to do insincerely? Click your call.",
  calloutTitle: "Why this reframe matters for verification",
  calloutBody:
    "Verification is the machinery that forces willingness into the open. A state that merely wants a pause and a state willing to pay for one answer a demand for intrusive monitoring very differently. Every mechanism you'll study in Modules 2–4 is, at bottom, a device for making cheap talk expensive.",
} as const;

export type SorterAnswer = "cheap" | "costly";

export interface SorterItem {
  answer: SorterAnswer;
  text: string;
  /** Verdict HTML (bold lead sentence + explanation). */
  verdict: string;
}

export const IR_SORTER: SorterItem[] = [
  {
    answer: "cheap",
    text: 'A head of state declares at a summit that "AI must never be weaponized."',
    verdict:
      "<strong>Cheap talk.</strong> Costs nothing to say, binds nothing, and every state at the summit says something similar. Zero bits of information about willingness.",
  },
  {
    answer: "costly",
    text: "A state ratifies a treaty through its legislature and passes domestic implementing law with criminal penalties.",
    verdict:
      "<strong>Costly signal.</strong> Ratification spends domestic political capital and creates internal enforcement machinery that is expensive to quietly reverse. Still not proof — but real information.",
  },
  {
    answer: "cheap",
    text: "A frontier lab publishes a voluntary safety framework with self-defined thresholds and no external audit.",
    verdict:
      "<strong>Cheap talk, mostly.</strong> Self-defined and self-measured means the lab can redefine the threshold the moment it binds. The tell: what would it cost them to violate it? Approximately a blog post.",
  },
  {
    answer: "costly",
    text: "A state accepts on-site inspections, including challenge inspections it cannot refuse, at declared compute facilities.",
    verdict:
      "<strong>Costly signal.</strong> Intrusive verification is expensive precisely when you're cheating — that asymmetry is what makes accepting it informative. This is the logic the whole track builds on.",
  },
  {
    answer: "cheap",
    text: "A state announces a unilateral moratorium on frontier training runs, with no monitoring provisions.",
    verdict:
      "<strong>Mostly cheap.</strong> Unverifiable restraint is indistinguishable from a covert program plus a press release. It might be sincere — you just can't tell, which for treaty purposes is the same thing.",
  },
  {
    answer: "costly",
    text: "A state destroys verified equipment stockpiles under international observation.",
    verdict:
      "<strong>Costly signal.</strong> Irreversible, observed, and materially reduces capability. The gold standard — and note it required a verification apparatus to exist at all.",
  },
];

// ---- Section 3: Cooperation ----
export const IR_V3 = {
  h2: "Why cooperation happens anyway",
  lede: "No enforcer, self-interested agents — yet thousands of treaties function. The mechanisms that make that possible are the ones an AI agreement must exploit.",
  p1pre: "If you've played ",
  gameHref: "https://the-verification-game.netlify.app/",
  gameLabel: "The Verification Game",
  p1post:
    ", you've already watched the formal core play out across its branching timeline: a one-shot prisoner's dilemma predicts defection, but states aren't playing one-shot games. Three things change the payoffs — click each to see how.",
  tiles: [
    {
      pop: "p-repetition",
      heading: "Repetition",
      body: "States interact forever, across many issues. Defecting today poisons every future deal.",
    },
    {
      pop: "p-reputation",
      heading: "Reputation",
      body: "Other states are watching. Cheating once raises your price everywhere, with everyone.",
    },
    {
      pop: "p-reciprocity",
      heading: "Reciprocity & linkage",
      body: "I comply while you do — and cheating on arms control can cost you trade access.",
    },
    {
      pop: "p-institutions",
      heading: "What institutions actually do",
      body: "The IAEA enforces nothing. What it does instead is more important.",
    },
  ] as IrPopupTile[],
  calloutTitle: "Where verification fits",
  calloutBody:
    "All three mechanisms above share a dependency: defection must be detectable, and detected early enough to respond. Repetition, reputation, and reciprocity are worthless against a violation you learn about after it's irreversible — and an ASI breakout is the limit case of irreversible. Verification is the detection layer that every other cooperation mechanism silently assumes. That's why this course exists.",
} as const;

// ---- Section 4: Treaty Mechanics ----
export interface LifecycleStage {
  pop: string;
  num: string;
  title: string;
  desc: string;
  cost: string;
  costTier: 1 | 2 | 3;
}

export const IR_V4 = {
  h2: "Treaty mechanics",
  lede: "A treaty is code with no runtime. Nothing executes it. Knowing its lifecycle tells you where willingness gets tested — and where the escape hatches are. Click any stage for detail.",
  stages: [
    { pop: "p-negotiation", num: "1", title: "Negotiation", desc: "Scope, definitions, and thresholds fought over word by word.", cost: "Cost: low", costTier: 1 },
    { pop: "p-signature", num: "2", title: "Signature", desc: "Executive signs. Signals intent; binds almost nothing.", cost: "Cost: low", costTier: 1 },
    { pop: "p-ratification", num: "3", title: "Ratification", desc: "Domestic legislature approves. This is where treaties die.", cost: "Cost: real", costTier: 2 },
    { pop: "p-entry", num: "4", title: "Entry into force", desc: "Enough parties ratify; obligations activate.", cost: "Cost: real", costTier: 2 },
    { pop: "p-compliance", num: "5", title: "Compliance", desc: "Reporting, inspections — where verification lives.", cost: "Cost: continuous", costTier: 3 },
    { pop: "p-withdrawal", num: "6", title: "Withdrawal", desc: "Most treaties include a legal exit with notice.", cost: "Cost: reputational", costTier: 3 },
  ] as LifecycleStage[],
  bodyP:
    "Read the lifecycle as an escalating series of costly signals. Signature is cheap talk with a pen. Ratification spends real domestic capital — the United States signed the Comprehensive Nuclear-Test-Ban Treaty in 1996 and has never ratified it, which tells you exactly what the willingness question would predict it tells you. Sustained compliance under monitoring is the most expensive signal of all, which is why it's the most informative.",
  tiles: [
    { pop: "p-contains", heading: "What a treaty text contains", body: "Definitions, thresholds, inspection rights, exit clauses — the explicit layer." },
    { pop: "p-omits", heading: "What it deliberately omits", body: "Intelligence methods, violation consequences, side understandings." },
    { pop: "p-hardsoft", heading: "Hard vs. soft law", body: "A ratified treaty and a summit communiqué are different objects. Apply the willingness test." },
    { pop: "p-protocols", heading: "Amendments & protocols", body: "Regimes are versioned, and versions ship after failures. Expect the same for AI." },
  ] as IrPopupTile[],
  vocabH3: "Vocabulary the rest of the track assumes",
  vocab: [
    { term: "Regime", meaning: 'The whole bundle around an issue — treaties, institutions, norms, monitoring practice. "The nonproliferation regime" ≫ the NPT text alone.' },
    { term: "Safeguards", meaning: "Technical + legal measures verifying that declared materials/facilities aren't diverted to prohibited use. The IAEA's core function; the closest existing analog to compute verification." },
    { term: "National technical means (NTM)", meaning: "A state's own unilateral monitoring: satellites, signals intelligence, cyber. Arms-control treaties explicitly protect NTM — parties agree not to interfere with each other's spying, because it stabilizes the deal." },
    { term: "Confidence-building measures (CBMs)", meaning: "Low-stakes transparency steps — notifications, hotlines, data exchanges, observer visits — that build the track record needed before states accept intrusive verification." },
    { term: "Bilateral / multilateral", meaning: "Two parties vs. many. Bilateral deals (US–Soviet arms control) verify more deeply; multilateral ones (NPT) cover more of the world. An ASI agreement needs both properties, which is part of why it's hard." },
    { term: "Compliance / defection / breakout", meaning: "Keeping the deal; secretly breaking it; openly racing out of it faster than others can respond. Verification design cares most about the time between defection and detection vs. the time defection needs to become irreversible." },
    { term: "Securitization", meaning: "Reframing an issue as an existential threat, which suspends normal cost-benefit politics and unlocks extraordinary measures. Module 0 argues ASI qualifies." },
  ],
} as const;

// ---- Section 5: Lenses ----
export const IR_V5 = {
  h2: "Lenses: three models of what states will pay for",
  lede: 'IR "theories" aren\'t ideologies to pick between. Treat them as modeling assumptions — different priors about what drives willingness. Click each lens; each makes different predictions, and each is right about something.',
  tiles: [
    { pop: "p-realism", tag: "real", heading: "Power is the variable", tagLabel: "Realism", body: "States care about relative gains, because today's partner is tomorrow's threat." },
    { pop: "p-liberal", tag: "lib", heading: "Information is the variable", tagLabel: "Institutionalism", body: "Cooperation fails from fear of being cheated — institutions fix the information problem." },
    { pop: "p-constructivism", tag: "con", heading: "Norms are the variable", tagLabel: "Constructivism", body: "Interests are constructed. Taboos and stigma do enforcement work no inspector can." },
  ],
  scenarioH3: "Same event, three readings",
  scenarioLede:
    "Scenario: State A proposes an intrusive international compute-monitoring regime. State B, its chief rival, agrees to join. Toggle the lens:",
  lenses: [
    {
      key: "lr",
      tag: "real",
      label: "Realist reading",
      body: "<strong>Suspicion.</strong> B joined because it calculated the regime favors it: perhaps its covert path is harder to detect, or the freeze locks in its current advantage, or membership buys time. Watch what B does, not what it signs — the treaty will hold exactly as long as B's expected gain from compliance exceeds its expected gain from undetected defection. <strong>Failure mode this lens catches:</strong> a regime that's really a cover for the leader to consolidate its lead.",
    },
    {
      key: "ll",
      tag: "lib",
      label: "Institutionalist reading",
      body: "<strong>Progress.</strong> Both states feared an unconstrained race more than they valued winning one; the regime lets each verify the other's restraint, converting an unstable arms race into a stable, monitored equilibrium. Expect CBMs first, deeper inspections later, as compliance data accumulates. <strong>Failure mode this lens catches:</strong> under-investing in the institution — a monitoring body too weak or slow to make defection visible in time.",
    },
    {
      key: "lc",
      tag: "con",
      label: "Constructivist reading",
      body: "<strong>Norm formation.</strong> The regime's deepest effect isn't detection — it's making unrestricted ASI development <em>deviant</em>. Once restraint becomes part of what responsible states do, violation costs identity and standing, not just sanctions. <strong>Failure mode this lens catches:</strong> a technically sound regime that never builds normative buy-in, so states comply with the letter while racing in spirit.",
    },
  ],
  table: {
    head: ["", "What is verification for?", "Why regimes fail"],
    rows: [
      { tag: "real", tagLabel: "Realist", forVer: "Protecting yourself while the deal lasts — early warning of a rival's breakout.", whyFail: "Power shifted; the deal stopped reflecting reality." },
      { tag: "lib", tagLabel: "Institutionalist", forVer: "Making cooperation rational — solving the information problem that causes defection.", whyFail: "Monitoring was too weak, slow, or underfunded to sustain confidence." },
      { tag: "con", tagLabel: "Constructivist", forVer: "Ritualizing the norm — inspections as repeated public performance of restraint.", whyFail: "The norm never internalized; compliance stayed purely transactional." },
    ],
  },
  footP:
    "You'll use these as working tools in Module 0.2.4, where one policy text gets read through each lens. A good verification designer is a realist about evasion, an institutionalist about machinery, and a constructivist about the long game. Now put names on the players.",
} as const;

export type LensTag = "real" | "lib" | "con";

// ---- Section 6: Actors ----
export interface ChainNode {
  pop: string;
  stage: string;
  title: string;
  flags: string;
  lev: "us" | "cn" | "eu" | "mix";
  levLabel: string;
}

export const IR_V6 = {
  h2: "The actors: US · China (· EU)",
  lede: 'Everything so far said "State A" and "State B." In the AI race the names are known: this is primarily a two-player game between the United States and China, with the EU as a chokepoint-holder and rule-writer rather than a racer. Module 1 dissects these actors properly; here is the minimum background a technical person needs.',
  calloutTitle: "The shape of the relationship, in one paragraph",
  calloutBody:
    "The US is the incumbent power; China is the rising one — the classic power-transition setup realism worries about. Since roughly 2018 the relationship has shifted from economic engagement to open strategic competition, and since October 2022 the US has treated frontier compute itself as a strategic controlled substance, using export controls to slow China's AI buildout. China answers with a whole-nation push for self-sufficiency plus counter-leverage of its own. Both sides say they want AI safety; apply the willingness question to everything below.",
  chainH3: "Who holds leverage where: the supply chain",
  chainLede:
    "The AI stack runs from rocks to deployed models. Leverage is unevenly distributed along it — and almost every US-China move in the AI race is an attempt to exploit or escape a chokepoint. Click each stage.",
  chain: [
    { pop: "p-sc-materials", stage: "Stage 1", title: "Materials & refining", flags: "CN", lev: "cn", levLabel: "China leverage" },
    { pop: "p-sc-design", stage: "Stage 2", title: "Chip design & EDA", flags: "US", lev: "us", levLabel: "US leverage" },
    { pop: "p-sc-litho", stage: "Stage 3", title: "Fab equipment", flags: "EU · US · JP", lev: "eu", levLabel: "EU/allied leverage" },
    { pop: "p-sc-fab", stage: "Stage 4", title: "Fabrication", flags: "TW · KR", lev: "mix", levLabel: "Taiwan — flashpoint" },
    { pop: "p-sc-memory", stage: "Stage 5", title: "Memory & packaging", flags: "KR · US · TW", lev: "us", levLabel: "Allied leverage" },
    { pop: "p-sc-energy", stage: "Stage 6", title: "Data centers & energy", flags: "US · CN", lev: "cn", levLabel: "China rising" },
    { pop: "p-sc-models", stage: "Stage 7", title: "Frontier models", flags: "US · CN", lev: "us", levLabel: "US leads, gap closing" },
    { pop: "p-sc-diffusion", stage: "Stage 8", title: "Distribution & diffusion", flags: "US · CN · EU", lev: "mix", levLabel: "Contested" },
  ] as ChainNode[],
  legend: [
    { lev: "us", label: "US / allied leverage" },
    { lev: "cn", label: "China leverage" },
    { lev: "eu", label: "EU leverage" },
    { lev: "mix", label: "Contested / flashpoint" },
  ] as { lev: ChainNode["lev"]; label: string }[],
  winningH3: "So who's winning?",
  winningLede:
    "Wrong question as asked — decompose it by layer, then notice the time dynamics.",
  winningTable: {
    head: ["Layer", "Ahead today", "Why it can shift"],
    rows: [
      { layer: "Frontier model quality", ahead: "US — but measured in months, not years", why: "Chinese open-weight fast-followers (the DeepSeek shock, Jan 2025) compress the gap with algorithmic efficiency." },
      { layer: "Installed AI compute", ahead: "US, by a wide margin", why: "US grid and permitting are the binding constraint; China adds electricity capacity several times faster." },
      { layer: "Hardware chokepoints", ahead: "US + allies (design, EDA, litho, fab)", why: "Every tightening of export controls raises China's incentive to indigenize — leverage is a depreciating asset." },
      { layer: "Energy & buildout capacity", ahead: "China", why: "Structural: state-directed grid expansion vs. interconnection queues. Hard for the US to reverse quickly." },
      { layer: "Global diffusion", ahead: "Contested — China lean in the Global South", why: "US exports APIs and cloud; China exports open weights and cheap infrastructure. Whoever's stack the world runs on gains standard-setting power." },
      { layer: "Rules & standards", ahead: "EU writes them (for its market)", why: "The Brussels effect shapes compliance defaults globally, but the EU regulates a race it isn't running." },
    ],
  },
  verCalloutTitle: "Why this matters for verification",
  verCalloutBody:
    "The leverage map is the treaty map. The US wants any deal to lock in its lead; China won't ratify formalized second place — that's the realist relative-gains problem with names attached. But the chokepoints also mean the machinery of compute verification (chip tracking, know-your-customer rules, facility monitoring) is already being built for competitive reasons — export-control enforcement and treaty verification need much of the same infrastructure. And because chokepoint leverage decays as China indigenizes, the window in which a verification-for-access bargain is attractive to both sides opens and closes with the hardware gap. Timing is not a detail; it's the deal.",
  playersH3: "The players, up close",
  playerTiles: [
    { pop: "p-usa", heading: "United States", body: "Incumbent. Leads the frontier, controls the chokepoints — through allies, and only for now." },
    { pop: "p-china", heading: "China", body: "Rising power. Behind on chips, ahead on energy and scale, betting on self-sufficiency and diffusion." },
    { pop: "p-eu", heading: "EU & other players", body: "Not racing — but holds ASML, writes the rules, and could host the institutions." },
  ] as IrPopupTile[],
  bgH3: "US–China relations: the minimum background",
  bgTiles: [
    { pop: "p-timeline", heading: "How we got here", body: "Engagement → trade war → compute export controls → tit-for-tat. The arc in six dates." },
    { pop: "p-taiwan", heading: "Taiwan: where the stack meets war risk", body: "~90% of leading-edge chips are fabbed on the most contested island on earth." },
    { pop: "p-thinlayer", heading: "The thin institutional layer", body: "US–Soviet rivals had hotlines and inspectors. US–China have almost none of that muscle memory." },
    { pop: "p-precedent", heading: "Why cooperation isn't naive", body: "Rivals at maximum hostility have signed verified deals before — under one condition." },
  ] as IrPopupTile[],
} as const;

// ---- Section 7: NPT Mini-case ----
export const IR_V7 = {
  h2: "Mini-case: the NPT and the IAEA",
  lede: "The closest thing history offers to a template for an anti-ASI regime. One page, read through the tools you just acquired.",
  factsTitle: "The facts, compressed",
  factsBody:
    "The Nuclear Non-Proliferation Treaty (1968) is a grand bargain: non-nuclear states forgo weapons; the five recognized nuclear states commit to pursue disarmament and share peaceful nuclear technology. Verification is delegated to the IAEA, whose safeguards inspectors audit declared nuclear material worldwide. After the 1991 Gulf War revealed Iraq had run a covert weapons program while under routine safeguards, the regime shipped a patch — the Additional Protocol, granting inspectors access beyond declared sites. North Korea joined, cheated, and in 2003 used the withdrawal clause and tested a weapon three years later. Meanwhile, dozens of states with the technical ability to build weapons — Japan, Germany, South Korea, Brazil — never did.",
  lensLede: "Read the same regime through each lens — click to expand:",
  lensTiles: [
    { pop: "p-npt-real", tag: "real", heading: "Realist reading", body: "Verification is institutionalized suspicion — and that's a compliment." },
    { pop: "p-npt-lib", tag: "lib", heading: "Institutionalist reading", body: "Fifty-plus years, 190 parties, far fewer nuclear states than forecast. Institutions learn." },
    { pop: "p-npt-con", tag: "con", heading: "Constructivist reading", body: "The quiet triumph: acquiring nuclear weapons became deviant." },
  ] as (IrPopupTile & { tag: LensTag })[],
  willTitle: "Now apply the willingness question",
  willP1:
    "The NPT never changed what states wanted — security, status, leverage. It changed the price of the paths. For most states, weapons became expensive (inspections, sanctions, stigma) and restraint became cheap and safe (verified neighbors, shared technology). The regime failed precisely where a state's willingness to pay was effectively unbounded. No verification regime stops an actor who will pay any price — the design goal is to make sure you see them paying it in time to respond.",
  willP2:
    "The question this track spends the remaining modules answering: nuclear verification had fissile material — physical, scarce, detectable. What is the fissile material of AI, and what does an IAEA for compute look like?",
} as const;

// ---- Section 8: Self-check quiz ----
export interface QuizQuestion {
  q: string;
  options: { text: string; correct: boolean }[];
  exp: string;
}

export const IR_QUIZ_INTRO = {
  h2: "Self-check",
  lede: "Six questions. If these feel easy, you're ready for Module 0.",
  readyTitle: "You're ready",
  readyBody:
    "Carry two habits into Module 0: read every statement of preference by asking what the actor is willing to do about it, and read every proposed agreement by asking how defection would be detected in time. Everything else in this track is elaboration.",
} as const;

export const IR_QUIZ: QuizQuestion[] = [
  {
    q: "1. Why can't international agreements be enforced like domestic contracts?",
    options: [
      { text: "States are less honest than individuals.", correct: false },
      { text: "No authority exists above states to enforce them — compliance is ultimately self-help.", correct: true },
      { text: "International law hasn't developed enough detail yet.", correct: false },
    ],
    exp: "Anarchy — the absence of a root authority — is structural, not moral. States aren't unusually dishonest; they simply operate with no enforcement layer above them, so agreements need self-enforcing incentive structures. Verification is how you build those.",
  },
  {
    q: "2. Which is the strongest evidence that a state is committed to an AI pause?",
    options: [
      { text: 'Its leader calls uncontrolled AI "the defining threat of our century."', correct: false },
      { text: "It signs a multilateral declaration on responsible AI development.", correct: false },
      { text: "It accepts intrusive, un-refusable inspections at its compute facilities.", correct: true },
    ],
    exp: "The willingness question. Speeches and declarations are cheap talk — free to produce sincerely or insincerely. Accepting intrusive verification is costly precisely when you're cheating, which is what makes it informative.",
  },
  {
    q: '3. "Inspection regimes matter because they solve the information problem — fear of being cheated is what kills cooperation." Which lens?',
    options: [
      { text: "Realism", correct: false },
      { text: "Liberal institutionalism", correct: true },
      { text: "Constructivism", correct: false },
    ],
    exp: "Institutionalism's core claim: states often want to cooperate but defect from fear of the other's defection. Institutions fix the information asymmetry. A realist would answer that inspections matter only as early warning; a constructivist, that they ritualize a norm.",
  },
  {
    q: "4. A state signs a treaty but never ratifies it. What do you know?",
    options: [
      { text: "It is legally bound anyway, since signature expresses consent.", correct: false },
      { text: "It expressed intent at low cost but declined the expensive, binding step — informative in willingness terms.", correct: true },
      { text: "Nothing; signature and ratification are procedural synonyms.", correct: false },
    ],
    exp: "Signature is the cheap stage of the lifecycle; ratification spends real domestic political capital and creates binding obligations. Stalling between the two is itself a signal — see the US and the CTBT since 1996.",
  },
  {
    q: '5. Why does a "freeze frontier AI where it stands" proposal read differently in Washington and Beijing?',
    options: [
      { text: "Beijing doesn't consider advanced AI strategically important.", correct: false },
      { text: "A freeze formalizes the current leader's advantage — the trailing power rationally resists locking in second place.", correct: true },
      { text: 'The two governments use incompatible definitions of "frontier."', correct: false },
    ],
    exp: "Relative gains with names attached. And note the time dynamic: US chokepoint leverage depreciates as China indigenizes, so both sides' willingness shifts — treaty windows open and close with the hardware gap. A viable regime must offer the trailing power something real (access, parity guarantees, sunset clauses) in exchange for verifiable restraint.",
  },
  {
    q: "6. What is verification's core function, in the terms of this primer?",
    options: [
      { text: "It guarantees that no party can ever violate the agreement.", correct: false },
      { text: "It makes defection detectable early enough to respond, so cooperation's incentive mechanisms can actually work.", correct: true },
      { text: "It replaces the need for treaties by monitoring everyone continuously.", correct: false },
    ],
    exp: "No regime prevents violation by an actor willing to pay any price. Verification shortens the gap between defection and detection — and repetition, reputation, and reciprocity all silently depend on that gap being short. With ASI, \"early enough to respond\" is the entire game.",
  },
];

/** Okabe-Ito lens tag styling (semantic, always paired with a label). */
export const LENS_TAG_CLASS: Record<LensTag, string> = {
  real: "bg-exaggerate/15 text-exaggerate border-exaggerate/30",
  lib: "bg-hide/15 text-hide border-hide/30",
  con: "bg-comply/15 text-comply border-comply/30",
} as const;

export const LENS_TAG_LABEL: Record<LensTag, string> = {
  real: "Realism",
  lib: "Institutionalism",
  con: "Constructivism",
} as const;
