/**
 * "What do they say" — the frontier-lab-leaders dossier for Module 0 of the
 * Verification track. All copy is lifted VERBATIM from the authored source at
 * public/verification/what-do-they-say.html (and its extracted content JSON,
 * public/verification/content/what-do-they-say.json). Do not re-author,
 * paraphrase, shorten, or translate — this is human-written curriculum.
 *
 * Portrait photos were extracted from the source's inline base64 data URIs and
 * written to public/verification/assets/what-do-they-say/<key>.jpg. The
 * Wikimedia photoSource attribution is preserved. Jan Leike had no portrait in
 * the source (photo: null) — he renders with initials only.
 */

export const WDTS_COPY = {
  viewProfile: "View profile →",
} as const;

// ---------------------------------------------------------------------------
// Profiles / dossier
// ---------------------------------------------------------------------------

export type WdtsFigureKey =
  | "altman"
  | "amodei"
  | "hassabis"
  | "legg"
  | "sutskever"
  | "leike";

/** One labelled section inside a profile's body. */
export type ProfileSection = {
  /** e.g. "Definition", "Risk statements", "Background", "The term". */
  label: string;
  /** Paragraph bodies as verbatim HTML (contain <q>, <em> inline markup). */
  paragraphsHtml: string[];
  /** Marks the "Relevance to this module" callout (navy note styling). */
  matters?: boolean;
};

export type ProfileSource = { label: string; href: string };

export type WdtsFigure = {
  key: WdtsFigureKey;
  code: string;
  name: string;
  role: string;
  initials: string;
  /** Path under /public, or null (Jan Leike — initials only in the source). */
  photo: string | null;
  photoSource?: string;
  /** Card teaser shown in the grid (from the source card markup). */
  teaser: string;
  sections: ProfileSection[];
  sources: ProfileSource[];
};

const ASSET = "/verification/assets/what-do-they-say";

export const WDTS_FIGURES: WdtsFigure[] = [
  {
    key: "altman",
    code: "Profile 01 · OpenAI",
    name: "Sam Altman",
    role: "CEO, OpenAI",
    initials: "SA",
    photo: `${ASSET}/altman.jpg`,
    photoSource:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sam_Altman_CropEdit_James_Tamim.jpg?width=256",
    teaser:
      "Authored OpenAI's original economic definition of AGI; has since argued the term is no longer precise enough to be useful.",
    sections: [
      {
        label: "Definition",
        paragraphsHtml: [
          "OpenAI's founding charter defines AGI as <q>highly autonomous systems that outperform humans at most economically valuable work</q>, the definition the rest of the industry spent a decade responding to. As systems improved, Altman's use of the term shifted. By mid-2025 he was calling AGI <q>not a super useful term</q>, and by late 2025 he suggested that AGI, by any earlier definition, <q>went whooshing by</q> without transforming the world. His proposed bar for superintelligence is a system that outperforms any human, including one assisted by AI, at roles such as head of state, chief executive, or director of a major research lab.",
        ],
      },
      {
        label: "Risk statements",
        paragraphsHtml: [
          "His risk assessments have not softened alongside the definitional shift. In 2023 he described the worst case as <q>lights out for all of us</q>, and OpenAI's superalignment announcement warned that superintelligence could lead to the <q>disempowerment of humanity or even human extinction</q>.",
        ],
      },
      {
        label: "Relevance to this module",
        matters: true,
        paragraphsHtml: [
          "A definition that moves as products approach it cannot anchor an agreement. This is one reason treaties are written around thresholds an outside party can measure, taken up in 0.2.3 (compute vs. capability).",
        ],
      },
    ],
    sources: [
      {
        label: "Time",
        href: "https://time.com/7205596/sam-altman-superintelligence-agi/",
      },
      {
        label: "CNBC",
        href: "https://www.cnbc.com/2025/08/11/sam-altman-says-agi-is-a-pointless-term-experts-agree.html",
      },
      {
        label: "Windows Central",
        href: "https://www.windowscentral.com/artificial-intelligence/openai-ceo-sam-altman-claims-agi-might-have-already-whooshed-by",
      },
      {
        label: "80,000 Hours",
        href: "https://80000hours.org/podcast/episodes/jan-leike-superalignment/",
      },
    ],
  },
  {
    key: "amodei",
    code: "Profile 02 · Anthropic",
    name: "Dario Amodei",
    role: "CEO, Anthropic",
    initials: "DA",
    photo: `${ASSET}/amodei.jpg`,
    photoSource:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Dario_Amodei_at_TechCrunch_Disrupt_2023_01_(cropped).jpg?width=256",
    teaser:
      'Uses the term "powerful AI" rather than AGI; estimates arrival as early as 2026 or 2027.',
    sections: [
      {
        label: "Definition",
        paragraphsHtml: [
          "Amodei avoids the term AGI in favor of <em>powerful AI</em>: a system <q>smarter than a Nobel Prize winner across most relevant fields</q>, able to work autonomously for days or weeks, operating at 10 to 100 times human speed, in millions of instances at once. His shorthand for this is <q>a country of geniuses in a datacenter</q>. He has estimated arrival as early as 2026 or 2027.",
        ],
      },
      {
        label: "Risk statements",
        paragraphsHtml: [
          "His 2026 essay <em>The Adolescence of Technology</em> organizes the risks into five categories: rogue autonomy, misuse for destruction (biological weapons foremost), seizure of power, economic disruption, and, notably given his position, AI companies themselves. On state misuse he writes: <q>AI-enabled authoritarianism terrifies me</q>.",
        ],
      },
      {
        label: "Relevance to this module",
        matters: true,
        paragraphsHtml: [
          "The framing is explicitly geopolitical. In a companion policy essay he argues that a nation holding powerful AI, facing one without it, could resemble <q>World War II Marines facing an army of medieval swordsmen</q>. That comparison describes the arms-race incentive structure this module examines.",
        ],
      },
    ],
    sources: [
      {
        label: "Machines of Loving Grace",
        href: "https://darioamodei.com/essay/machines-of-loving-grace",
      },
      {
        label: "The Adolescence of Technology",
        href: "https://darioamodei.com/essay/the-adolescence-of-technology",
      },
      {
        label: "Policy on the AI Exponential",
        href: "https://darioamodei.com/post/policy-on-the-ai-exponential",
      },
      {
        label: "Axios",
        href: "https://www.axios.com/2026/01/26/anthropic-ai-dario-amodei-humanity",
      },
      {
        label: "Mi3",
        href: "https://www.mi-3.com.au/27-01-2026/anthropic-founder-warns-ai-entering-dangerous-adolescence-urges-urgent-guardrails",
      },
    ],
  },
  {
    key: "hassabis",
    code: "Profile 03 · Google DeepMind",
    name: "Demis Hassabis",
    role: "CEO, Google DeepMind · Nobel laureate",
    initials: "DH",
    photo: `${ASSET}/hassabis.jpg`,
    photoSource:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Demis_Hassabis,_2024_Nobel_Prize_Laureate_in_Chemistry_7_(cropped).jpg?width=256",
    teaser:
      "Defines AGI as the full range of human cognitive capabilities; advocates IAEA-style international monitoring.",
    sections: [
      {
        label: "Definition",
        paragraphsHtml: [
          "Hassabis applies the strictest bar among the major labs: <q>a system that can exhibit all the cognitive capabilities humans can</q>, including invention, creativity, continual learning, and long-horizon planning. Benchmark performance alone does not satisfy it; he notes that current models can win Olympiad-level competitions while failing simple tasks. On that standard he estimates five to ten years, centered near 2030.",
        ],
      },
      {
        label: "Risk statements",
        paragraphsHtml: [
          "<q>The risk of a catastrophic scenario is not zero, so we must dedicate significant resources to mitigating it</q>. He groups the dangers into two categories: misuse of a dual-use technology by bad actors, and systems whose goals diverge from human intent as capabilities increase. Asked whether he worries about ending up in Oppenheimer's position, he has said he thinks about such scenarios regularly.",
        ],
      },
      {
        label: "Relevance to this module",
        matters: true,
        paragraphsHtml: [
          "His policy proposals are institutional: a CERN-style body for shared safety research and an IAEA-style agency to monitor high-risk projects. The IAEA is the nuclear world's verification agency, so the proposal amounts to a request for the infrastructure this course studies.",
        ],
      },
    ],
    sources: [
      {
        label: "Davos 2026 transcript",
        href: "https://aletteraday.substack.com/p/letters-314315-demis-hassabis-and",
      },
      {
        label: "Axios AI+ interview",
        href: "https://vocal.media/journal/demis-hassabis-warns-about-ai-the-risk-of-a-catastrophic-scenario-is-not-zero",
      },
    ],
  },
  {
    key: "legg",
    code: "Profile 04 · Google DeepMind",
    name: "Shane Legg",
    role: "Chief AGI Scientist, Google DeepMind",
    initials: "SL",
    photo: `${ASSET}/legg.jpg`,
    photoSource:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Shane_Legg.jpg?width=256",
    teaser:
      "Coined the term AGI in 2001; has maintained a median forecast near 2028 since 2011.",
    sections: [
      {
        label: "The term",
        paragraphsHtml: [
          'Legg proposed the phrase "artificial general intelligence" around 2001, at a time when the idea sat well outside mainstream research. His forecasts have been unusually stable since: a public median estimate near 2028, held since at least 2011. His 2008 doctoral thesis, <em>Machine Super Intelligence</em>, argued that a machine above human level could design still more capable machines, and that methods for managing that dynamic did not exist.',
        ],
      },
      {
        label: "Risk statements",
        paragraphsHtml: [
          "As DeepMind's Chief AGI Scientist he co-authored the company's 145-page AGI safety framework, which states that AGI could pose a <q>potential risk of severe harm</q> and identifies existential risk, harm that permanently destroys humanity, as the extreme case the framework is designed to prevent.",
        ],
      },
      {
        label: "Relevance to this module",
        matters: true,
        paragraphsHtml: [
          "Legg's two-decade position is that capability has outpaced control. Verification does not resolve that problem; it addresses a narrower one, giving outside parties visibility into who is approaching dangerous capability levels while the control problem remains open.",
        ],
      },
    ],
    sources: [
      {
        label: "MIT Technology Review",
        href: "https://www.technologyreview.com/2025/10/30/1127057/agi-conspiracy-theory-artifcial-general-intelligence/",
      },
      {
        label: "Fortune",
        href: "https://fortune.com/2025/04/04/google-deeepmind-agi-ai-2030-risk-destroy-humanity/",
      },
    ],
  },
  {
    key: "sutskever",
    code: "Profile 05 · Safe Superintelligence Inc.",
    name: "Ilya Sutskever",
    role: "Co-founder, OpenAI · Founder, SSI",
    initials: "IS",
    photo: `${ASSET}/sutskever.jpg`,
    photoSource:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ilya_Sutskever_and_Sam_Altman_in_TAU_(cropped).jpg",
    teaser:
      "Central to the current technical paradigm; now leads a lab founded solely to build superintelligence safely.",
    sections: [
      {
        label: "Definition",
        paragraphsHtml: [
          "Sutskever's objection to the standard definition is that it overshoots: <q>a human being is not an AGI</q>. Humans do not arrive knowing every task; they learn. His model of superintelligence follows from that. Not a complete, all-knowing system, but one that can learn any job quickly, which he has described as <q>a superintelligent 15-year-old</q> whose competence develops through deployment.",
        ],
      },
      {
        label: "Risk statements",
        paragraphsHtml: [
          "Before leaving OpenAI he described the coming transition as <q>monumental, earth-shattering</q>, with a before and an after. In 2024 he founded Safe Superintelligence Inc., a lab organized around a single goal: building superintelligence with safety as the binding constraint.",
        ],
      },
      {
        label: "Relevance to this module",
        matters: true,
        paragraphsHtml: [
          "If capabilities emerge during deployment rather than before release, there is no clean pre-release point at which a system can be inspected. This measurement problem is part of why current policy relies on compute thresholds, which can be assessed in advance, rather than capability evaluations (0.2.3).",
        ],
      },
    ],
    sources: [
      {
        label: "Dwarkesh Podcast",
        href: "https://www.dwarkesh.com/p/ilya-sutskever-2",
      },
      {
        label: "The Decoder",
        href: "https://the-decoder.com/ilya-sutskever-says-a-new-learning-paradigm-is-necessary-and-is-already-chasing-it/",
      },
      {
        label: "MIT Technology Review",
        href: "https://www.technologyreview.com/2025/10/30/1127057/agi-conspiracy-theory-artifcial-general-intelligence/",
      },
    ],
  },
  {
    key: "leike",
    code: "Profile 06 · Formerly OpenAI",
    name: "Jan Leike",
    role: "Former co-lead, Superalignment, OpenAI · now Anthropic",
    initials: "JL",
    photo: null,
    teaser:
      "Co-led OpenAI's superalignment effort; resigned in 2024 over resourcing and priorities.",
    sections: [
      {
        label: "Background",
        paragraphsHtml: [
          "Leike co-led OpenAI's superalignment team with Sutskever. Its mandate was to solve the control problem for smarter-than-human systems within four years, supported by a public commitment of 20 percent of the company's compute. He resigned less than a year later, writing that the team had struggled to obtain the promised resources, that building smarter-than-human machines is <q>an inherently dangerous endeavor</q>, and that safety work had taken <q>a backseat to shiny products</q>. The team was dissolved shortly after his departure. He continued the same research agenda at Anthropic.",
        ],
      },
      {
        label: "Risk statements",
        paragraphsHtml: [
          "His central technical claim is that no one yet knows how to <q>steer and control AI systems much smarter than us</q>, and that development is proceeding ahead of that knowledge.",
        ],
      },
      {
        label: "Relevance to this module",
        matters: true,
        paragraphsHtml: [
          "This episode is a documented case study for the first policy bucket in 0.2.2, voluntary self-governance. A leading lab made a written, quantified commitment to itself, and competitive pressure eroded it within a year. Commitments between competitors require what internal commitments lack: independent means of checking compliance.",
        ],
      },
    ],
    sources: [
      {
        label: "The National",
        href: "https://www.thenationalnews.com/future/technology/2024/05/18/former-openai-executive-says-safety-has-taken-a-backseat-as-company-disbands-ai-risks-unit/",
      },
      {
        label: "Fast Company",
        href: "https://www.fastcompany.com/91127491/former-openai-leader-jan-leike-blasts-company-for-ignoring-safety-culture",
      },
      {
        label: "VentureBeat",
        href: "https://venturebeat.com/ai/openais-former-superalignment-leader-blasts-company-safety-culture-and-processes-have-taken-a-backseat",
      },
    ],
  },
];
