/**
 * Data for the "Game Theory for Verification — The Concept Map" primer, lifted
 * verbatim from public/verification/game-theory-primer.html and
 * public/verification/content/game-theory-primer.json. Every node body, link
 * string, quiz question, explanation, and sim message is human-authored
 * curriculum — do not re-author, paraphrase, or shorten.
 */

/* ---------------------------------------------------------------- threads */

export const THREAD_COLORS: Record<string, string> = {
  t1: "#2e6b4f",
  t2: "#9c6b1a",
  t3: "#2e5a6b",
  t4: "#b0402f",
  t5: "#6b4a8c",
  t0: "#8a8172",
};

export interface Thread {
  id: string;
  x: number;
  name: string;
  q: string;
}

export const THREADS: Thread[] = [
  { id: "t1", x: 130, name: "01 · Cooperation", q: "why cooperate at all?" },
  { id: "t2", x: 335, name: "02 · Credibility", q: "why believe a promise?" },
  { id: "t3", x: 540, name: "03 · Compliance", q: "what enforces a treaty?" },
  { id: "t4", x: 745, name: "04 · Inspection", q: "how do you catch cheating?" },
  { id: "t5", x: 950, name: "05 · Two levels", q: "who must say yes at home?" },
];

/* ----------------------------------------------------------------- nodes */

export type SimId =
  | "pd"
  | "nash"
  | "repeat"
  | "noise"
  | "detect"
  | "inspect"
  | "winset"
  | "evidence";

export interface GtpNode {
  id: string;
  t: string;
  x: number;
  y: number;
  title: string;
  short?: string;
  min: number;
  sim: SimId | null;
}

export const NODES: GtpNode[] = [
  { id: "pd", t: "t1", x: 130, y: 110, title: "Prisoner's Dilemma", min: 3, sim: "pd" },
  { id: "nash", t: "t1", x: 130, y: 205, title: "Nash equilibrium", min: 2, sim: "nash" },
  { id: "repeat", t: "t1", x: 130, y: 300, title: "Repeated games", min: 3, sim: "repeat" },
  { id: "noise", t: "t1", x: 130, y: 395, title: "Noise & forgiveness", min: 2, sim: "noise" },
  { id: "detect", t: "t1", x: 130, y: 490, title: "Detection probability", min: 2, sim: "detect" },

  { id: "commit", t: "t2", x: 335, y: 110, title: "Commitment problem", min: 2, sim: null },
  { id: "signals", t: "t2", x: 335, y: 205, title: "Cheap talk, costly signals", short: "Costly signals", min: 2, sim: null },
  { id: "hands", t: "t2", x: 335, y: 300, title: "Tying your hands", min: 2, sim: null },
  { id: "focal", t: "t2", x: 335, y: 395, title: "Focal points", min: 2, sim: null },
  { id: "transparency", t: "t2", x: 335, y: 490, title: "Transparency", min: 2, sim: null },

  { id: "anarchy", t: "t3", x: 540, y: 150, title: "Anarchy", min: 2, sim: null },
  { id: "threers", t: "t3", x: 540, y: 285, title: "The three R's", min: 2, sim: null },
  { id: "krasnoyarsk", t: "t3", x: 540, y: 420, title: "Krasnoyarsk radar", min: 2, sim: null },

  { id: "inspect", t: "t4", x: 745, y: 150, title: "The inspection game", min: 3, sim: "inspect" },
  { id: "surprises", t: "t4", x: 745, y: 285, title: "Two strange results", min: 2, sim: null },
  { id: "dataverif", t: "t4", x: 745, y: 420, title: "Data & timeliness", min: 2, sim: null },

  { id: "twolevel", t: "t5", x: 950, y: 150, title: "Two-level games", min: 2, sim: null },
  { id: "winset", t: "t5", x: 950, y: 285, title: "The win-set", min: 2, sim: "winset" },
  { id: "defect", t: "t5", x: 950, y: 420, title: "Two kinds of defection", min: 2, sim: null },

  { id: "footnotes", t: "t0", x: 540, y: 565, title: "Decision-theory footnotes", short: "Footnotes (dessert)", min: 3, sim: "evidence" },
];

/* ----------------------------------------------------------------- edges */

export type GtpEdge = [string, string] | [string, string, "cross"];

export const EDGES: GtpEdge[] = [
  ["pd", "nash"],
  ["nash", "repeat"],
  ["repeat", "noise"],
  ["noise", "detect"],
  ["commit", "signals"],
  ["signals", "hands"],
  ["hands", "focal"],
  ["focal", "transparency"],
  ["anarchy", "threers"],
  ["threers", "krasnoyarsk"],
  ["inspect", "surprises"],
  ["surprises", "dataverif"],
  ["twolevel", "winset"],
  ["winset", "defect"],
  ["detect", "commit", "cross"],
  ["transparency", "anarchy", "cross"],
  ["detect", "threers", "cross"],
  ["krasnoyarsk", "inspect", "cross"],
  ["hands", "surprises", "cross"],
  ["noise", "dataverif", "cross"],
  ["dataverif", "twolevel", "cross"],
  ["hands", "winset", "cross"],
  ["pd", "footnotes", "cross"],
];

/* ----------------------------------------------------------------- paths */

export interface GtpPath {
  label: string;
  ids: string[];
}

export const PATHS: Record<string, GtpPath> = {
  fresh: {
    label: "New to game theory",
    ids: ["pd", "nash", "repeat", "noise", "detect", "commit", "signals", "threers"],
  },
  gamer: {
    label: "Credibility & inspection",
    ids: ["commit", "signals", "hands", "focal", "transparency", "inspect", "surprises", "dataverif"],
  },
  policy: {
    label: "Enforcement & institutions",
    ids: ["anarchy", "threers", "krasnoyarsk", "detect", "inspect", "twolevel", "winset", "defect"],
  },
};

/* the three doors on the hero */
export interface Door {
  path: string;
  cls: "d1" | "d2" | "d3";
  eyebrow: string;
  h3: string;
  p: string;
  time: string;
}

export const DOORS: Door[] = [
  {
    path: "fresh",
    cls: "d1",
    eyebrow: "Door 1 · New here",
    h3: "“Prisoner’s what?”",
    p: "Never touched game theory. Your path walks the foundations: dilemmas, equilibria, repetition, noise — then lands on why detection is everything.",
    time: "8 stops · ~18 min",
  },
  {
    path: "gamer",
    cls: "d2",
    eyebrow: "Door 2 · Some game theory",
    h3: "“I know Nash & tit-for-tat”",
    p: "Skip the foundations. Your path starts at credibility — where verification-specific vocabulary begins — and ends in the inspection games.",
    time: "8 stops · ~17 min",
  },
  {
    path: "policy",
    cls: "d3",
    eyebrow: "Door 3 · New to arms control",
    h3: "“Why do treaties hold at all?”",
    p: "The theory is familiar; the institutions aren’t. Your path covers enforcement without courts, a real case, and the two-level game at home.",
    time: "8 stops · ~17 min",
  },
];

/* --------------------------------------------------------------- content */

export interface NodeContent {
  thread: string;
  body: string;
  links: string;
}

export const CONTENT: Record<string, NodeContent> = {
  pd: {
    thread: "Thread 01 · Cooperation",
    body: `<p>Any <b>game</b> is a situation where your best choice depends on what someone else chooses. The Prisoner's Dilemma is the famous worst case: both players do better if both cooperate — but each does best defecting while the other cooperates. So two rational players defect, and both lose.</p>
<p class="hook"><b>In verification terms</b> — an arms race <em>is</em> a Prisoner's Dilemma. Arms control is the attempt to change the game so cooperating stops being a sucker's bet. A treaty is a game you get to <em>design</em>.</p>`,
    links: `→ <a href="https://plato.stanford.edu/entries/prisoner-dilemma/" target="_blank" rel="noopener">SEP: Prisoner's Dilemma</a> · <a href="https://plato.stanford.edu/entries/game-theory/" target="_blank" rel="noopener">SEP: Game Theory</a> (skim §1) · the <a data-node="footnotes">true Prisoner's Dilemma</a>`,
  },
  nash: {
    thread: "Thread 01 · Cooperation",
    body: `<p>A Nash equilibrium is a combination of strategies where no player gains by changing theirs <em>alone</em>. Stable is not the same as good: mutual defection in the dilemma is an equilibrium — the bad outcome is self-reinforcing.</p>
<p class="hook"><b>In verification terms</b> — a treaty survives only if complying is an equilibrium. If compliance relies on goodwill rather than incentives, it's not an agreement; it's a press release.</p>`,
    links: `→ <a href="https://en.wikipedia.org/wiki/Nash_equilibrium" target="_blank" rel="noopener">Wikipedia: Nash equilibrium</a>`,
  },
  repeat: {
    thread: "Thread 01 · Cooperation",
    body: `<p>Play the dilemma once and defection wins. Play it indefinitely against the same partner and cooperation can become rational — today's cheating gets punished tomorrow. The champion strategy is embarrassingly simple: <b>tit-for-tat</b> — start nice, mirror their last move, forgive quickly.</p>
<p class="hook"><b>In verification terms</b> — repetition needs three things: you'll meet again, you'll <em>notice</em> defection, and you can retaliate. States meet again by default and can always retaliate. The fragile ingredient is the middle one. Verification supplies it.</p>`,
    links: `→ play <a href="https://ncase.me/trust/" target="_blank" rel="noopener">The Evolution of Trust</a> (the single best thing linked in this primer) · <a href="https://en.wikipedia.org/wiki/The_Evolution_of_Cooperation" target="_blank" rel="noopener">Axelrod</a> · <a href="https://en.wikipedia.org/wiki/Tit_for_tat" target="_blank" rel="noopener">tit for tat</a> · <a href="https://en.wikipedia.org/wiki/Grim_trigger" target="_blank" rel="noopener">grim trigger</a>`,
  },
  noise: {
    thread: "Thread 01 · Cooperation",
    body: `<p>When observation is noisy — false alarms, missed detections — naive reciprocity unravels: one misreading triggers retaliation, then counter-retaliation, and cooperation dies of an echo. Surviving noise requires calibrated forgiveness.</p>
<p class="hook"><b>In verification terms</b> — the quietly most important node here. A verification regime's two design parameters are its detection probability <em>and</em> its false-alarm rate. Both failure modes kill cooperation — from different directions.</p>`,
    links: `→ <a href="https://www.jstor.org/stable/1911462" target="_blank" rel="noopener">Green &amp; Porter 1984</a> · the &ldquo;mistakes&rdquo; chapter of <a href="https://ncase.me/trust/" target="_blank" rel="noopener">ncase/trust</a> is this exact model in toy form`,
  },
  detect: {
    thread: "Thread 01 · Cooperation",
    body: `<p>Deterrence scales as (chance of being caught) × (cost if caught). Raising detection <em>substitutes</em> for raising punishment — and between nuclear-armed rivals, better sensors are a cheaper and much safer lever than bigger threats.</p>
<p class="hook"><b>In verification terms</b> — this is the whole course in one multiplication. Everything to the right of this node is about what detection makes possible, and how a strategic opponent responds to it.</p>`,
    links: `→ see <a data-node="threers">the three R's</a> · <a data-node="inspect">the inspection game</a>`,
  },
  commit: {
    thread: "Thread 02 · Credibility",
    body: `<p>Promises about future behavior aren't credible when everyone can see you'll want to break them once circumstances shift. Fearon's landmark result: even fully rational states can end up at war — not from misunderstanding, but because the deal both prefer to fighting is one neither can credibly commit to.</p>
<p class="hook"><b>In verification terms</b> — this is <em>the</em> problem verification exists to solve. &ldquo;We won't build it&rdquo; is cheap talk until someone can check.</p>`,
    links: `→ <a href="https://web.stanford.edu/group/fearon-research/cgi-bin/wordpress/wp-content/uploads/2013/10/Rationalist-Explanations-for-War.pdf" target="_blank" rel="noopener">Fearon 1995, &ldquo;Rationalist Explanations for War&rdquo;</a>`,
  },
  signals: {
    thread: "Thread 02 · Credibility",
    body: `<p><b>Cheap talk</b> costs nothing, so a liar can say it exactly as easily as an honest type. A message becomes informative only when sending it is <em>expensive</em> — more expensive for a bluffer. Fearon's taxonomy: <b>sunk costs</b> (pay now: mobilize, build, dismantle) versus <b>tied hands</b> (create future costs for backing down, like public pledges your own audience will punish you for breaking).</p>
<p class="hook"><b>In verification terms</b> — classify any state's &ldquo;commitment&rdquo; this way first: what did it actually cost, and who punishes the retreat? If the answers are &ldquo;nothing&rdquo; and &ldquo;no one,&rdquo; it's cheap talk.</p>`,
    links: `→ <a href="https://web.stanford.edu/group/fearon-research/cgi-bin/wordpress/wp-content/uploads/2013/10/Signaling-Foreign-Policy-Interests-Tying-Hands-versus-Sinking-Costs.pdf" target="_blank" rel="noopener">Fearon 1997</a> · <a href="https://web.stanford.edu/group/fearon-research/cgi-bin/wordpress/wp-content/uploads/2013/10/Domestic-Political-Audiences-and-the-Escalation-of-International-Disputes.pdf" target="_blank" rel="noopener">Fearon 1994 on audience costs</a> · <a href="https://en.wikipedia.org/wiki/Cheap_talk" target="_blank" rel="noopener">Wikipedia: cheap talk</a>`,
  },
  hands: {
    thread: "Thread 02 · Credibility",
    body: `<p>Schelling's beautiful paradox: in bargaining, the power to bind <em>yourself</em> is power over the other side. The general who burns the bridge behind his army makes &ldquo;we won't retreat&rdquo; true rather than asserted. But it only works if the rival (a) can <em>see</em> the burned bridge and (b) believes it can't be quietly rebuilt — a hidden commitment deters no one, and a fake one manufactures false assurance.</p>
<p class="hook"><b>In verification terms</b> — hardware-enforced limits are burned bridges. The two audit questions for any commitment mechanism: <em>how would the other side observe it, and how would they know it hasn't been undone?</em> That's the verification design brief.</p>`,
    links: `→ <a href="https://www.hup.harvard.edu/books/9780674840317" target="_blank" rel="noopener">Schelling, <em>The Strategy of Conflict</em></a>, ch. 2 · his <a href="https://www.nobelprize.org/prizes/economic-sciences/2005/schelling/lecture/" target="_blank" rel="noopener">Nobel lecture</a> is the 30-min version`,
  },
  focal: {
    thread: "Thread 02 · Credibility",
    body: `<p>When players must coordinate without full communication, they converge on whatever <em>stands out</em>: round numbers, natural boundaries, the status quo. Schelling's demo: strangers told to meet in New York with no way to communicate mostly pick Grand Central at noon.</p>
<p class="hook"><b>In verification terms</b> — treaty limits want to be bright lines. &ldquo;Zero&rdquo; is enforceable where &ldquo;a little&rdquo; is not, because any nonzero line invites salami-slicing and every increment looks deniable. Simple, discrete thresholds are a verification technology in themselves.</p>`,
    links: `→ <a href="https://en.wikipedia.org/wiki/Focal_point_(game_theory)" target="_blank" rel="noopener">Wikipedia: focal point</a> · <a href="https://www.lesswrong.com/posts/yJfBzcDL9fBHJfZ6P/nash-equilibria-and-schelling-points" target="_blank" rel="noopener">Alexander, &ldquo;Nash Equilibria and Schelling Points&rdquo;</a>`,
  },
  transparency: {
    thread: "Thread 02 · Credibility",
    body: `<p>Fearon's diagnosis says rational war has two root causes: private information (with incentives to bluff) and commitment problems. Both are informational diseases — so mechanisms that make capabilities and actions <em>observable</em> attack the cause, not the symptom.</p>
<p class="hook"><b>In verification terms</b> — verification is applied transparency: it shrinks the space of undetectable defection until promises become believable and bluffs become checkable. This node is the bridge from theory to everything institutional.</p>`,
    links: `→ <a href="https://web.stanford.edu/group/fearon-research/cgi-bin/wordpress/wp-content/uploads/2013/10/Rationalist-Explanations-for-War.pdf" target="_blank" rel="noopener">Fearon 1995</a> · see the evidence-streams footnote in <a data-node="footnotes">decision-theory footnotes</a>`,
  },
  anarchy: {
    thread: "Thread 03 · Compliance",
    body: `<p>Jargon, not chaos: <b>anarchy</b> means there is no authority above states with compulsory jurisdiction and a monopoly on force. Domestic law rides on an enforcer; international law can't. Everything that sustains compliance must be <em>self-enforcing</em> — built out of the players' own incentives. Anarchy also breeds the <b>security dilemma</b>: my defensive buildup is indistinguishable from your offensive threat.</p>
<p class="hook"><b>In verification terms</b> — why &ldquo;just sign a treaty&rdquo; is never an answer by itself, and why international commitments are structurally harder than domestic contracts.</p>`,
    links: `→ <a href="https://www.jstor.org/stable/2009958" target="_blank" rel="noopener">Jervis 1978, &ldquo;Cooperation under the Security Dilemma&rdquo;</a>`,
  },
  threers: {
    thread: "Thread 03 · Compliance",
    body: `<p>Guzman's inventory of what actually enforces international law: <b>reciprocity</b> (fear of losing the arrangement), <b>retaliation</b> (targeted punishment), and <b>reputation</b> — which behaves like capital: slow to accumulate, fast to burn, priced into every future deal. Now notice the dependency all three share: the violation has to be <em>detected and attributed</em> before any lever can move.</p>
<p class="hook"><b>In verification terms</b> — the module's thesis in one node. Verification is the sensory organ of an enforcement system that has no police. Blind the sensor and all three R's go limp simultaneously. Undetected cheating is reputationally <em>free</em> — which is precisely what makes weak verification corrosive.</p>`,
    links: `→ <a href="https://lawcat.berkeley.edu/record/1118254/files/fulltext.pdf" target="_blank" rel="noopener">Guzman 2002, &ldquo;A Compliance-Based Theory of International Law&rdquo;</a> (the intro carries the argument)`,
  },
  krasnoyarsk: {
    thread: "Thread 03 · Compliance · case",
    body: `<p>The USSR built a giant early-warning radar in central Siberia, violating the ABM Treaty's siting rules. US satellites spotted it, the US contested it publicly for years, and the Soviets eventually admitted the violation and dismantled the site — reputation and linkage pressure working exactly as this thread predicts, and <em>only because detection worked first</em>.</p>
<p class="hook"><b>In verification terms</b> — the go-to worked example for &ldquo;which lever bit?&rdquo; Pair it with the INF Treaty's collapse for the failure case: detected violations, but no lever the parties were willing to pull.</p>`,
    links: `→ <a href="https://en.wikipedia.org/wiki/Daryal_radar" target="_blank" rel="noopener">Wikipedia: Daryal radar</a> · <a href="https://en.wikipedia.org/wiki/Intermediate-Range_Nuclear_Forces_Treaty" target="_blank" rel="noopener">the INF Treaty</a>`,
  },
  inspect: {
    thread: "Thread 04 · Inspection",
    body: `<p>Born at RAND in 1962, straight out of test-ban negotiations: an inspector with too few inspections faces an inspectee choosing whether — and where — to violate. Because each side wants to out-guess the other, there is no stable predictable solution: scarcity forces <b>mixed strategies</b> — deliberate, calibrated randomness. Think goalkeeper at a penalty kick: diving the same way twice is how you lose.</p>
<p class="hook"><b>In verification terms</b> — the founding model of the field. Everything from IAEA safeguards scheduling to data-center audit design is a descendant. And it's why &ldquo;we inspect every site every March&rdquo; is a compliance calendar for cheaters.</p>`,
    links: `→ <a href="http://www.maths.lse.ac.uk/personal/stengel/TEXTE/insp.pdf" target="_blank" rel="noopener">Avenhaus, von Stengel &amp; Zamir, &ldquo;Inspection Games&rdquo;</a> §2.1, §4.1 · <a href="https://en.wikipedia.org/wiki/Strategy_(game_theory)#Mixed_strategy" target="_blank" rel="noopener">Wikipedia: mixed strategy</a>`,
  },
  surprises: {
    thread: "Thread 04 · Inspection · deep end",
    body: `<p><b>Surprise one — the nonzero violation rate.</b> In equilibrium the violation probability is positive; that's where mutual best-responding settles when inspections are scarce. A working regime is <em>not</em> a zero-violation regime — it's one where violations stay small, get caught often enough, and cost enough when caught. A regime that catches nothing is either perfect or blind.</p>
<p><b>Surprise two — inspector leadership.</b> The inspector does <em>better</em> by publicly announcing their randomized strategy than by keeping it secret: the violator best-responds to the announcement, and you chose the strategy so that best response is compliance.</p>
<p class="hook"><b>In verification terms</b> — transparency about <em>how</em> you verify is a feature, not a leak. Secrecy about <em>which day</em> you show up stays — that's the mixed strategy.</p>`,
    links: `→ <a href="http://www.maths.lse.ac.uk/personal/stengel/TEXTE/insp.pdf" target="_blank" rel="noopener">insp.pdf §3.1</a> · see <a data-node="hands">tying your hands</a> — same commitment logic, wielded by the verifier`,
  },
  dataverif: {
    thread: "Thread 04 · Inspection · deep end",
    body: `<p>Two extensions that matter most for AI-era regimes. <b>Data verification</b>: the inspectee reports their own numbers, and the inspector must decide when a fishy declaration warrants a costly alarm — balancing missed violations against false accusations. <b>Timeliness</b>: detecting a violation eventually is worthless if it comes after the violator has banked the advantage; the game is detection <em>speed</em> versus breakout speed.</p>
<p class="hook"><b>In verification terms</b> — compute declarations, training-run reporting, and model audits are data-verification games; breakout timelines make every AI regime a timeliness game. The most directly transferable math in the primer.</p>`,
    links: `→ <a href="http://www.maths.lse.ac.uk/personal/stengel/TEXTE/insp.pdf" target="_blank" rel="noopener">insp.pdf §3.3 (Thm 3.3) &amp; §4.2</a> · see <a data-node="noise">noise</a> for why false alarms are symmetric poison`,
  },
  twolevel: {
    thread: "Thread 05 · Two levels",
    body: `<p>&ldquo;The state&rdquo; is a fiction. Putnam's model: at Level I the negotiator bargains with the foreign counterpart; at Level II with their own legislature, ministries, industry, and public — who must ratify or implement whatever comes home. The negotiator is the only player seated at both tables, and every move at one table is simultaneously a move at the other.</p>
<p class="hook"><b>In verification terms</b> — actor analysis is Level II mapping: for each state, who can actually kill or hollow out a verification agreement at home? Labs and their inspection-averse security officers are Level II players, not scenery.</p>`,
    links: `→ <a href="https://www.jstor.org/stable/2706785" target="_blank" rel="noopener">Putnam 1988, &ldquo;Diplomacy and Domestic Politics&rdquo;</a> (first ten pages carry the concept)`,
  },
  winset: {
    thread: "Thread 05 · Two levels",
    body: `<p>The <b>win-set</b> is the set of deals that would survive ratification at home. Agreements are possible only where the two sides' win-sets overlap. The twist: a <em>smaller</em> win-set gives you less to offer but more leverage — &ldquo;I'd love to agree, but my Senate will never pass it&rdquo; is a real bargaining move.</p>
<p class="hook"><b>In verification terms</b> — tied hands again, supplied free of charge by domestic politics. Also the diagnosis tool for &ldquo;why did a deal both leaders wanted still die?&rdquo;</p>`,
    links: `→ <a href="https://www.jstor.org/stable/2706785" target="_blank" rel="noopener">Putnam 1988</a> · see <a data-node="hands">tying your hands</a>`,
  },
  defect: {
    thread: "Thread 05 · Two levels",
    body: `<p>A state can break an agreement because it chose to (<b>voluntary</b>) — or because its Level II failed to deliver: the legislature balked, the ministry slow-walked, the lab wouldn't comply (<b>involuntary</b>). The observable outcome is identical; the correct response is opposite — punish the first, assist the second.</p>
<p class="hook"><b>In verification terms</b> — a verifier that only monitors <em>intent</em> misdiagnoses half its cases. Monitoring design should also watch <em>capability to comply</em>: does this government actually control the actors its signature binds?</p>`,
    links: `→ <a href="https://www.jstor.org/stable/2706785" target="_blank" rel="noopener">Putnam 1988</a>, §&ldquo;involuntary defection&rdquo;`,
  },
  footnotes: {
    thread: "Marginalia · optional dessert",
    body: `<p>Four ideas from the decision-theory corner of the internet that professional game theorists would phrase more cautiously — and that verification people quietly rely on anyway.</p>
<p><b>The true Prisoner's Dilemma.</b> Humans facing &ldquo;dilemmas&rdquo; secretly value the other side's welfare — so our warm intuitions are calibrated to games we aren't in. Strategic rivals, and possibly advanced AI systems, are closer to the true version. Build the regime for the matrix that's actually there.</p>
<p><b>Answer the process, not the threat.</b> Paying once finances the next ten demands. Regimes that accommodate salami-slicing teach salami-slicing.</p>
<p><b>Probabilistic rejection of unfair offers.</b> You don't need to escalate every ambiguous violation — only often enough that gambling on your restraint has negative expected value.</p>
<p><b>Deception scales with evidence streams.</b> Fooling one sensor is a project. Fooling N independent sensors — coherently, continuously, without the fabricated stories contradicting each other — gets exponentially harder. Lies must agree with each other; the truth agrees with itself for free. Try it below.</p>`,
    links: `→ <a href="https://www.lesswrong.com/posts/HFyWNBnDNEDsDNLrZ/the-true-prisoner-s-dilemma" target="_blank" rel="noopener">Yudkowsky, &ldquo;The True Prisoner's Dilemma&rdquo;</a> · see <a data-node="focal">focal points</a> (why bright lines resist slicing) · <a data-node="transparency">transparency</a>`,
  },
};

/* ------------------------------------------------------------- bookshelf */

export interface ShelfEntry {
  html: string;
  time: string;
}

export const SHELF_TITLE = "Ten sources, in the order to try them";
export const SHELF_EYEBROW = "The bookshelf · every link in one place";

export const SHELF: ShelfEntry[] = [
  {
    html: `<a href="https://ncase.me/trust/" target="_blank" rel="noopener">The Evolution of Trust</a> — Nicky Case<span class="s-note">Interactive. All of Thread 1, playable. The &ldquo;mistakes&rdquo; chapter alone justifies the visit.</span>`,
    time: "30 min · play",
  },
  {
    html: `<a href="https://en.wikipedia.org/wiki/Focal_point_(game_theory)" target="_blank" rel="noopener">Focal point (game theory)</a> — Wikipedia<span class="s-note">Fastest useful read on the list; you&rsquo;ll start seeing Schelling points everywhere.</span>`,
    time: "5 min",
  },
  {
    html: `<a href="https://www.nobelprize.org/prizes/economic-sciences/2005/schelling/lecture/" target="_blank" rel="noopener">Schelling&rsquo;s Nobel lecture</a> (2005)<span class="s-note">Sixty years of not using nuclear weapons, by the man who theorized why.</span>`,
    time: "30 min",
  },
  {
    html: `<a href="https://web.stanford.edu/group/fearon-research/cgi-bin/wordpress/wp-content/uploads/2013/10/Signaling-Foreign-Policy-Interests-Tying-Hands-versus-Sinking-Costs.pdf" target="_blank" rel="noopener">&ldquo;Signaling Foreign Policy Interests&rdquo;</a> — Fearon, 1997<span class="s-note">Sinking costs vs. tying hands, formally. Read the intro and conclusion; skim the model.</span>`,
    time: "25 min",
  },
  {
    html: `<a href="https://web.stanford.edu/group/fearon-research/cgi-bin/wordpress/wp-content/uploads/2013/10/Rationalist-Explanations-for-War.pdf" target="_blank" rel="noopener">&ldquo;Rationalist Explanations for War&rdquo;</a> — Fearon, 1995<span class="s-note">Why rational states fight anyway: private information + commitment problems.</span>`,
    time: "45 min",
  },
  {
    html: `<a href="https://lawcat.berkeley.edu/record/1118254/files/fulltext.pdf" target="_blank" rel="noopener">&ldquo;A Compliance-Based Theory of International Law&rdquo;</a> — Guzman, 2002<span class="s-note">The three R&rsquo;s, and why international law works at all. Introduction carries the argument.</span>`,
    time: "intro: 15 min",
  },
  {
    html: `<a href="https://www.jstor.org/stable/2706785" target="_blank" rel="noopener">&ldquo;Diplomacy and Domestic Politics&rdquo;</a> — Putnam, 1988<span class="s-note">Two-level games, win-sets, involuntary defection. First ten pages suffice.</span>`,
    time: "20 min",
  },
  {
    html: `<a href="http://www.maths.lse.ac.uk/personal/stengel/TEXTE/insp.pdf" target="_blank" rel="noopener">&ldquo;Inspection Games&rdquo;</a> — Avenhaus, von Stengel &amp; Zamir<span class="s-note">The survey behind Thread 4. Targeted: §2.1 origin · §4.1 Dresher · §3.1 equilibrium · §3.3 data verification · §4.2 timeliness.</span>`,
    time: "40 min targeted",
  },
  {
    html: `<a href="https://www.jstor.org/stable/1911462" target="_blank" rel="noopener">&ldquo;Noncooperative Collusion under Imperfect Price Information&rdquo;</a> — Green &amp; Porter, 1984<span class="s-note">Cooperation under noisy monitoring (<a href="http://www.dklevine.com/archive/refs41147.pdf" target="_blank" rel="noopener">free PDF</a>).</span>`,
    time: "deep end",
  },
  {
    html: `<a href="https://www.lesswrong.com/posts/HFyWNBnDNEDsDNLrZ/the-true-prisoner-s-dilemma" target="_blank" rel="noopener">&ldquo;The True Prisoner&rsquo;s Dilemma&rdquo;</a> — Yudkowsky, 2008<span class="s-note">Short, sharp corrective to warm intuitions about payoff matrices.</span>`,
    time: "10 min",
  },
];

/* --------------------------------------------------------- instructor LO */

export interface LoRow {
  lo: string;
  thread: string;
  can: string;
}

export const LO_MAP: LoRow[] = [
  { lo: "LO1", thread: "01 · Cooperation", can: "explain why cooperation among self-interested parties depends on repetition, detection probability, and error tolerance — and predict how noise or frequency changes destabilize it." },
  { lo: "LO2", thread: "02 · Credibility", can: "classify how a commitment is made credible (sunk cost, tied hands, mechanical), assess its observability and irreversibility, and judge whether it should be believed." },
  { lo: "LO3", thread: "03 · Compliance", can: "explain what sustains compliance absent central enforcement (reputation, reciprocity, retaliation), show each lever requires detection, and diagnose which lever bit in a historical case." },
  { lo: "LO4", thread: "04 · Inspection", can: "explain why optimal inspection is randomized, why the equilibrium violation rate is nonzero, and why announcing the inspection strategy improves deterrence." },
  { lo: "LO5", thread: "05 · Two levels", can: "map a state's ratification constraints, explain how a small win-set can be bargaining power, and distinguish voluntary from involuntary defection — and what each implies for monitoring." },
];

/* --------------------------------------------------------------- payoffs */

/* payoffs: [you, them] — C/C 3,3 · C/D 0,5 · D/C 5,0 · D/D 1,1 */
export const PAY: Record<string, [number, number]> = {
  CC: [3, 3],
  CD: [0, 5],
  DC: [5, 0],
  DD: [1, 1],
};

/* ----------------------------------------------------------------- quiz */

export interface QItem {
  t: string;
  node: string;
  q: string;
  opts: string[];
  a: number;
  ex: string;
}

/* bank: 4 per thread; each run draws 2 per thread = 10 questions */
export const QBANK: QItem[] = [
  /* t1 · cooperation */
  {
    t: "t1",
    node: "pd",
    q: "In a one-shot Prisoner’s Dilemma, why do two rational players end up at mutual defection?",
    opts: [
      "Each is better off defecting no matter what the other does",
      "They fail to communicate before choosing",
      "They wrongly believe the other will defect",
      "The payoffs are miscalculated in the moment",
    ],
    a: 0,
    ex: "Defection dominates: 5>3 if they cooperate, 1>0 if they defect. Flawless individual logic, outcome nobody wanted.",
  },
  {
    t: "t1",
    node: "repeat",
    q: "Repetition can make cooperation rational — but only if three things hold. Which is the fragile one between states?",
    opts: ["They will meet again", "They can notice defection", "They can retaliate", "They share a language"],
    a: 1,
    ex: "States meet again by default and can always retaliate. Noticing defection is the fragile ingredient — verification supplies it.",
  },
  {
    t: "t1",
    node: "noise",
    q: "Under noisy monitoring (false alarms, missed detections), strict tit-for-tat tends to fail because…",
    opts: [
      "it is too forgiving to deter cheaters",
      "one misreading triggers an echo of mutual retaliation",
      "it requires knowing the game will end",
      "players forget past moves",
    ],
    a: 1,
    ex: "A single false alarm starts retaliation, counter-retaliation, and cooperation dies — even though nobody cheated. Hence calibrated forgiveness.",
  },
  {
    t: "t1",
    node: "detect",
    q: "Deterrence scales as detection probability × penalty. Why does that make better sensors attractive between nuclear rivals?",
    opts: [
      "Sensors are always cheaper than any penalty",
      "Raising detection substitutes for raising punishment — and bigger threats are dangerous",
      "Penalties are impossible to impose internationally",
      "High detection guarantees zero violations",
    ],
    a: 1,
    ex: "Same product, safer lever: raising the chance of getting caught deters as well as raising the threat, without living next to bigger threats.",
  },
  /* t2 · credibility */
  {
    t: "t2",
    node: "signals",
    q: "Why can’t cheap talk make a commitment credible where interests conflict?",
    opts: [
      "Because talk is never heard by the right audience",
      "Because a liar can say it exactly as easily as an honest type",
      "Because states rarely issue statements",
      "Because commitments must be written down",
    ],
    a: 1,
    ex: "If sending the message costs nothing, it carries no information about type. Credibility needs a cost a bluffer wouldn’t pay.",
  },
  {
    t: "t2",
    node: "signals",
    q: "A leader makes a loud public pledge their own voters will punish them for breaking. In Fearon’s taxonomy this is…",
    opts: ["a sunk cost", "cheap talk", "tying hands (audience costs)", "a focal point"],
    a: 2,
    ex: "Nothing is paid now; instead future costs are created for backing down. That’s tied hands — audience costs are the classic example.",
  },
  {
    t: "t2",
    node: "hands",
    q: "A state secretly installs a hardware limit it could quietly remove. As a commitment device this is…",
    opts: [
      "strong — the limit physically exists",
      "worthless or worse — commitments must be observed and believed irreversible",
      "strong if announced later",
      "equivalent to a burned bridge",
    ],
    a: 1,
    ex: "A hidden commitment deters no one, and a reversible one manufactures false assurance — the most dangerous commodity in arms control.",
  },
  {
    t: "t2",
    node: "focal",
    q: "Why is “zero” often a more enforceable treaty limit than “a small amount”?",
    opts: [
      "Zero is easier to write into legal text",
      "Any nonzero line invites salami-slicing; every increment looks deniable",
      "Small amounts are harmless anyway",
      "Inspectors can only count to zero reliably",
    ],
    a: 1,
    ex: "Bright lines are focal points: discrete, salient, and violations of them are unambiguous. “A little” erodes one deniable slice at a time.",
  },
  /* t3 · compliance */
  {
    t: "t3",
    node: "threers",
    q: "Guzman’s three R’s — the levers that actually enforce international law — are…",
    opts: [
      "rules, rights, remedies",
      "reciprocity, retaliation, reputation",
      "recognition, ratification, review",
      "rewards, restrictions, referees",
    ],
    a: 1,
    ex: "Fear of losing the arrangement, of targeted punishment, and of paying more for every future deal.",
  },
  {
    t: "t3",
    node: "threers",
    q: "What single input do reciprocity, retaliation, AND reputation all require before they can move?",
    opts: [
      "A standing international court",
      "The violation being detected and attributed",
      "Economic interdependence",
      "Unanimity among allies",
    ],
    a: 1,
    ex: "Blind the sensor and all three levers go limp at once. Verification is the sensory organ of an enforcement system with no police.",
  },
  {
    t: "t3",
    node: "krasnoyarsk",
    q: "The Krasnoyarsk radar episode is the go-to example of…",
    opts: [
      "a violation that was never resolved",
      "detection enabling reputation and linkage pressure to force a walk-back",
      "a treaty collapsing from false accusations",
      "inspections catching a violation on-site",
    ],
    a: 1,
    ex: "US satellites spotted it, years of public contestation followed, and the USSR eventually admitted the violation and dismantled the site — because detection worked first.",
  },
  {
    t: "t3",
    node: "anarchy",
    q: "“Anarchy” in international relations means…",
    opts: [
      "constant war among states",
      "no authority above states — so agreements must be self-enforcing",
      "the absence of diplomatic relations",
      "that treaties are legally meaningless",
    ],
    a: 1,
    ex: "Jargon, not chaos: no enforcer with compulsory jurisdiction sits above states, so compliance must be built from the players’ own incentives.",
  },
  /* t4 · inspection */
  {
    t: "t4",
    node: "inspect",
    q: "Why must inspection schedules be randomized when inspections are scarce?",
    opts: [
      "Randomness is cheaper to administer",
      "Any pattern is a gift a strategic violator will exploit",
      "Regulations forbid fixed schedules",
      "It keeps inspectors more alert",
    ],
    a: 1,
    ex: "“We inspect every site every March” is a compliance calendar for cheaters — you saw it in the toy: predictable inspectors catch ~0%.",
  },
  {
    t: "t4",
    node: "surprises",
    q: "A verification regime reports zero caught violations for a decade. The inspection-game view says…",
    opts: [
      "the regime is working perfectly",
      "the regime is either perfect or blind — and equilibrium says violations should be nonzero, so bet on blind",
      "violators have reformed",
      "inspections can safely be cut",
    ],
    a: 1,
    ex: "With scarce inspections the equilibrium violation rate is positive. A regime that catches nothing deserves suspicion, not congratulations.",
  },
  {
    t: "t4",
    node: "surprises",
    q: "“Inspector leadership” is the result that the inspector does better by…",
    opts: [
      "keeping the whole inspection strategy secret",
      "publicly committing to a randomized strategy — while keeping the specific days unpredictable",
      "inspecting only after tips",
      "announcing exact inspection dates in advance",
    ],
    a: 1,
    ex: "Announce the strategy so the violator best-responds to it — you chose it so their best response is compliance. Secrecy stays only about which day you show up.",
  },
  {
    t: "t4",
    node: "dataverif",
    q: "A regime where labs self-report compute usage and auditors must decide when a fishy declaration warrants a costly alarm is a…",
    opts: ["data-verification game", "coordination game", "two-level game", "grim-trigger equilibrium"],
    a: 0,
    ex: "Self-reported numbers + a costly-alarm decision balancing missed violations against false accusations — insp.pdf §3.3, the most AI-transferable model in the primer.",
  },
  /* t5 · two levels */
  {
    t: "t5",
    node: "winset",
    q: "The win-set is…",
    opts: [
      "the set of deals the negotiator personally prefers",
      "the set of deals that would survive ratification at home",
      "the set of deals the other side proposes",
      "the negotiator’s opening position",
    ],
    a: 1,
    ex: "Agreements are possible only where the two sides’ win-sets overlap — Level II decides what Level I can sign.",
  },
  {
    t: "t5",
    node: "winset",
    q: "“I’d love to agree, but my Senate will never pass it” works as a bargaining move because…",
    opts: [
      "a smaller win-set gives more leverage — the deal must land in your narrow range",
      "senates are usually bluffing",
      "it delays negotiations usefully",
      "it signals weakness the other side pities",
    ],
    a: 0,
    ex: "Tied hands supplied free by domestic politics: less to offer, but the surviving deals sit at your end of the overlap.",
  },
  {
    t: "t5",
    node: "defect",
    q: "A ministry slow-walks implementation and the state misses a treaty obligation the leadership genuinely wanted to meet. The right response is…",
    opts: [
      "punish, exactly as for deliberate cheating",
      "assist — this is involuntary defection, and punishment misdiagnoses it",
      "ignore it entirely",
      "withdraw from the treaty",
    ],
    a: 1,
    ex: "Voluntary and involuntary defection look identical from outside but call for opposite responses — which is why monitors should watch capability to comply, not just intent.",
  },
  {
    t: "t5",
    node: "twolevel",
    q: "In Putnam’s model, who counts as a Level II player for a verification agreement?",
    opts: [
      "Only the legislature that ratifies",
      "Anyone at home who can kill or hollow out the deal — legislatures, ministries, labs and their security officers",
      "Foreign counterpart negotiators",
      "International inspectors",
    ],
    a: 1,
    ex: "Labs and their inspection-averse security officers are Level II players, not scenery — a signature binds only what the government actually controls.",
  },
];

export const THREAD_NAME: Record<string, string> = {
  t1: "01 · Cooperation",
  t2: "02 · Credibility",
  t3: "03 · Compliance",
  t4: "04 · Inspection",
  t5: "05 · Two levels",
};

/* ----------------------------------------------------------------- copy */

export const GTP_COPY = {
  wanderPre: "or skip the paths and ",
  wanderBtn: "just wander the map",
  wanderPost: " — every node is clickable either way",
  quizEyebrow: "Optional · when you're done exploring",
  quizTitle: "Check yourself",
  quizBlurb:
    "Ten quick questions — drawn fresh from a bank of twenty each time, two per thread, so every area gets covered. Instant feedback, ~5 min, nothing is graded or stored.",
  quizStart: "start the self-check",
  instructorSummary: "For instructors · thread → learning objective map",
  legendPlayable: "▸ = playable",
  legendVisited: "✓ = visited",
  legendSources: "all sources ↗",
} as const;

/* localStorage keys — matched to the source page */
export const LS_PATH = "gtp-path";
export const LS_VISITED = "gtp-visited";

export function nodeById(id: string): GtpNode | undefined {
  return NODES.find((n) => n.id === id);
}
