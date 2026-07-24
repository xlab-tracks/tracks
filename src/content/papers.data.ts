import type { Paper } from "@/lib/content/types";

// Paper titles/metadata are factual (they come from the source artifact).
// See AUTHORING.md for the authoring workflow (arXiv papers §2, Substack
// posts §2c, LessWrong posts §2d):
//   npm run arxiv:build -- --toc <id>                  → section ids
//   npm run arxiv:build -- --blocks <id> [--section …] → block anchors + sentences
//   npm run substack:build / lesswrong:build           → same flags, for posts
// Snippets are copied prefixes of the --blocks output lines (drift tripwires).
export const papers: Paper[] = [
  {
    // Control track, module 1: the AI Control paper with the course's guided
    // exercises, demos, and editorial notes woven into the reading.
    id: "c-paper-ai-control",
    slug: "ai-control-paper",
    moduleId: "c-intro",
    title: "AI Control: Improving Safety Despite Intentional Subversion",
    source: { kind: "arxiv", arxivId: "2312.06942v5" },
    estimatedMinutes: 94,
    edits: [
      // Publication note after the abstract.
      {
        op: "add",
        after: { sectionEnd: "ax-abstract" },
        label: "Source",
        markdown:
          "A shortened and modified version of this work was published in the " +
          "*Proceedings of the 41st International Conference on Machine " +
          "Learning*: [openreview.net/pdf?id=KviM5k8pcP](https://openreview.net/pdf?id=KviM5k8pcP).",
      },
      // §1 end: quick-recall flashcards on the core concepts.
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-introduction" },
        items: [
          {
            kind: "sequence",
            label: "Quick recall",
            exerciseIds: [
              "c-paper-l1-recall-protocol",
              "c-paper-l1-recall-control-evaluation",
              "c-paper-l1-recall-subversion-conditions",
            ],
          },
        ],
      },
      // §2: why real backdoors are sneakier than `is_odd`.
      {
        op: "add",
        after: { anchor: "b-0046", snippet: "def is_odd(x):" },
        label: "Beyond is_odd",
        markdown:
          "`is_odd` is deliberately blatant, to make the definition concrete. " +
          "A real backdoor has to be much sneakier: subtle enough to survive " +
          "testing and a skim from a reviewer, and wrong on only a narrow " +
          "slice of inputs. In fact, current frontier LLMs are likely capable " +
          "of constructing much subtler and more dangerous backdoors. For " +
          "example, in March 2026, as part of Anthropic's Project Glasswing " +
          "initiative, Claude Mythos Preview found and built a full " +
          "remote-root exploit for " +
          "[CVE-2026-4747](https://www.freebsd.org/security/advisories/FreeBSD-SA-26:08.rpcsec_gss.asc), " +
          "a stack buffer overflow in FreeBSD's RPCSEC_GSS authentication " +
          "code that had gone unnoticed for 17 years. Given that frontier " +
          "LLMs are capable of finding vulnerabilities that have passed " +
          "long-term human review, it is plausible that they can also " +
          "construct realistic, difficult-to-notice backdoors in production code.",
      },
      // §2: quick recall after the U/T/H naming paragraph.
      {
        op: "activity",
        after: { anchor: "b-0059", snippet: "From here on, we’ll always use the names" },
        items: [
          {
            kind: "sequence",
            label: "Quick recall",
            exerciseIds: [
              "c-paper-l2-recall-backdoor-definition",
              "c-paper-l2-recall-h-limited",
              "c-paper-l2-recall-trust-t",
              "c-paper-l2-recall-red-team-goal",
              "c-paper-l2-recall-blue-team-goal",
            ],
          },
        ],
      },
      // §2.3 end: one recall card on summary-statistics access.
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-blue-team-access-to-summary-statistics-o" },
        items: [{ kind: "exercise", id: "c-paper-l2-recall-summary-statistics" }],
      },
      // §2 end (after Table 2): build each protocol as a flowchart.
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-setting" },
        items: [{ kind: "exercise", id: "c-paper-l2-protocol-flowcharts" }],
      },
      // §3.1.2 end: derive the optimal audit tradeoff by hand, then play it.
      {
        op: "add",
        after: { sectionEnd: "ax-sec-upfront-auditing" },
        label: "Optimal audit tradeoff",
        markdown:
          'The paper states it "can analytically solve" this problem, and it ' +
          "is in fact, a tractable derivation. The five-part exercise below " +
          "works through it by hand, one step at a time: set up the red " +
          "team's win probability as a function of its attack rate $p$, use " +
          "the same rare-event approximation that shows up all over this " +
          "field to make it differentiable, and solve for the optimal $p^*$. " +
          "You may need a pen and paper.",
      },
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-upfront-auditing" },
        items: [
          {
            kind: "sequence",
            label: "Understanding check",
            exerciseIds: [
              "c-paper-l3-audit-tradeoff-intuition",
              "c-paper-l3-audit-tradeoff-formula",
              "c-paper-l3-audit-tradeoff-derivation",
              "c-paper-l3-audit-tradeoff-scenarios",
              "c-paper-l3-audit-tradeoff-shape",
            ],
          },
          { kind: "demo", id: "audit-tradeoff" },
          { kind: "exercise", id: "c-paper-l3-recall-upfront-auditing-attack" },
        ],
      },
      // §3.2.1: the monitor as a binary classifier (ROC/AUC framing + demo).
      // Block-end anchor: the source PR spliced this cluster before the
      // paragraph's last sentence, but a labeled multi-paragraph add can't be
      // sentence-anchored (inline gate), so the whole cluster stays together
      // after b-0135 — one sentence later than the PR's placement.
      {
        op: "add",
        after: {
          anchor: "b-0135",
          snippet: "Qualitatively speaking, GPT-3.5 is able to notice",
        },
        label: "The monitor is a binary classifier",
        markdown:
          "The two histograms in Figure 4 are the picture a signal-detection " +
          "framing makes precise: the monitor is a *binary classifier* " +
          "separating backdoored from innocent solutions, and the more its " +
          "two suspicion-score distributions overlap, the worse it does. The " +
          "standard summary of that overlap is the **ROC curve** — " +
          "true-positive rate against false-positive rate as the decision " +
          "threshold sweeps — and its **AUC** (area under the curve). If " +
          "those terms are unfamiliar, Google's ML Crash Course has a short " +
          "primer: [ROC and AUC](https://developers.google.com/machine-learning/crash-course/classification/roc-and-auc).\n\n" +
          "The demo below models the monitor as two equal-variance Gaussians " +
          "and lets you drag its quality (the separation $d'$ between the " +
          "innocent and backdoored means). Watch the ROC curve and AUC " +
          "respond, and watch the operating point at the blue team's fixed " +
          "2% false-positive threshold: even a fairly good monitor catches " +
          "only a fraction of backdoors there, which is the \"many false " +
          "negatives\" the paper describes. The default setting ($d' " +
          "\\approx 1.64$, AUC $\\approx 0.88$) reproduces the paper's " +
          "reported result — a 0.338 probability that an attempted backdoor " +
          "is audited at a 2% false-positive rate. (Real suspicion scores " +
          "aren't Gaussian; this is an idealization for building intuition, " +
          "not a fit to the paper's data.)",
      },
      {
        op: "activity",
        after: {
          anchor: "b-0135",
          snippet: "Qualitatively speaking, GPT-3.5 is able to notice",
        },
        items: [
          { kind: "demo", id: "monitor-roc" },
          {
            kind: "sequence",
            label: "Understanding check",
            exerciseIds: [
              "c-paper-l3-monitor-operating-point",
              "c-paper-l3-monitor-auc-meaning",
              "c-paper-l3-monitor-per-attempt",
            ],
          },
        ],
      },
      // §3.2: recall card on budget burn (after the "Secondly, …" list item;
      // nested target, so the card hoists after the whole list).
      {
        op: "activity",
        after: {
          anchor: "b-0140",
          snippet: "Secondly, trusted monitoring forces the attacker",
        },
        items: [{ kind: "exercise", id: "c-paper-l3-recall-budget-burn" }],
      },
      // §3.3 end: defer-to-trusted recall.
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-defer-to-trusted" },
        items: [
          {
            kind: "sequence",
            label: "Quick recall",
            exerciseIds: [
              "c-paper-l4-recall-defer-below-threshold",
              "c-paper-l4-recall-dynamic-routing",
            ],
          },
        ],
      },
      // §3.4.2 end: naive untrusted monitoring recall.
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-collusion-techniques-and-countermeasures" },
        items: [{ kind: "exercise", id: "c-paper-l4-recall-naive-untrusted-monitoring" }],
      },
      // §3.5 end (after Table 8): the safety/usefulness frontier, interactive.
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-trusted-editing" },
        items: [
          { kind: "demo", id: "safety-usefulness-frontier" },
          {
            kind: "sequence",
            label: "Frontier check",
            exerciseIds: [
              "c-paper-l4-frontier-dominance",
              "c-paper-l4-frontier-dominated-set",
              "c-paper-l4-frontier-improvement",
              "c-paper-l4-frontier-along-curve",
            ],
          },
        ],
      },
    ],
  },
  {
    // Control track, module 1: Redwood's "case for control" post rendered in
    // full through the LessWrong paper reader, with the module's five guided
    // exercises woven into the reading at the points the argument sets them
    // up (this is the reading that used to be a copied-text MDX lesson). The
    // Example track's ex-paper-lesswrong renders the same post as its
    // source-kind reference; here it is real curriculum.
    id: "c-case-for-control",
    slug: "the-case-for-controlling-powerful-ais",
    moduleId: "c-intro",
    title: "The case for ensuring that powerful AIs are controlled",
    source: {
      kind: "lesswrong",
      postUrl:
        "https://www.lesswrong.com/posts/kcKrE9mzEHrdqtDpE/the-case-for-ensuring-that-powerful-ais-are-controlled",
    },
    estimatedMinutes: 105,
    edits: [
      // §"Evaluating whether you have control is doable" (mid-section): right
      // after the paragraph on deciding which models to treat as untrusted,
      // run the five control-property scenarios before the paper defines what a
      // control evaluation is.
      {
        op: "activity",
        after: {
          anchor: "b-0032",
          snippet: "How can we decide which models to treat as untrusted?",
        },
        items: [{ kind: "exercise", id: "control-scenarios" }],
      },
      // Same section, at the end of its body (the activity hoists after the
      // "positive implications" list, before the "Currently, evaluating
      // alignment seems much harder" subsection): why a catch is a win, and
      // where evaluation runs out.
      {
        op: "activity",
        after: {
          anchor: "b-0045",
          snippet: "As labs deploy increasingly powerful models",
        },
        items: [{ kind: "exercise", id: "why-catching-counts" }],
      },
      // §"The first transformatively useful AIs will probably be very
      // dangerous" end: could a transformatively useful model still be
      // controllable? (Section-end, before the sibling "…doesn't imply
      // uncontrollable" subsection.)
      {
        op: "activity",
        after: { sectionEnd: "lw-sec-the-first-transformatively-useful-ais-wi" },
        items: [
          { kind: "exercise", id: "could-useful-models-remain-controllable" },
        ],
      },
      // §"'Transformatively useful' probably doesn't imply 'uncontrollable'"
      // (mid-section): after the paragraph on wildly-superhuman problematic
      // domains, commit to whether inscrutability is necessary, then construct
      // the threat model.
      {
        op: "activity",
        after: {
          anchor: "b-0108",
          snippet: "However, if the AI actually is wildly superhuman",
        },
        items: [{ kind: "exercise", id: "inscrutability-necessary" }],
      },
      // §"Implications and proposed actions" end: the two-worlds / two-windows
      // reflection that closes the body before the appendices.
      {
        op: "activity",
        after: { sectionEnd: "lw-sec-implications-and-proposed-actions" },
        items: [{ kind: "exercise", id: "two-worlds-two-windows" }],
      },
    ],
  },
  {
    // Control track, module 2: the safety–usefulness tradeoff model, rendered
    // full-page from Redwood's blog (Substack) — the same committed artifact
    // the Example track's ex-paper-substack uses, here as real curriculum.
    // A paragraph-level catalog concluded no further activities clear the
    // necessity bar — see
    // docs/superpowers/specs/2026-07-18-efficient-tradeoffs-activities.md.
    id: "c-efficient-tradeoffs",
    slug: "safety-usefulness-tradeoff-model",
    moduleId: "c-mod2",
    title: "Efficient tradeoffs and the safety-usefulness tradeoff model",
    source: {
      kind: "substack",
      postUrl:
        "https://blog.redwoodresearch.org/p/efficient-tradeoffs-and-the-safety",
    },
    edits: [
      {
        // The post calls time in this frame "a healthy exercise" (b-0025);
        // the short answer has the reader do it once, concretely.
        op: "activity",
        after: { sectionEnd: "sb-sec-rushed-reasonable-developers" },
        items: [{ kind: "exercise", id: "c-et-rushed-apply" }],
      },
    ],
  },
  {
    // Control track, module 2: Ryan Greenblatt's "Plans A, B, C, and D for
    // misalignment risk", rendered full-page through the LessWrong paper reader.
    // Placed after "Determining the usefulness" (c-regimes-l1): the regime model
    // teaches the political-will budget, and this reading is the plan landscape
    // that budget selects between (Plan A = international agreement, max will …
    // Plan D = ~10-30 employees on ~3% compute, minimal will). One quick-recall
    // card is spliced at the end of each plan's section (module-1 pattern);
    // answers compress the post's own summary definitions.
    id: "c-plans-abcd",
    slug: "plans-a-b-c-and-d-for-misalignment-risk",
    moduleId: "c-mod2",
    title: "Plans A, B, C, and D for misalignment risk",
    source: {
      kind: "lesswrong",
      postUrl:
        "https://www.lesswrong.com/posts/E8n93nnEaFeXTbHn5/plans-a-b-c-and-d-for-misalignment-risk",
    },
    edits: [
      {
        op: "activity",
        after: { sectionEnd: "lw-sec-plan-a" },
        items: [{ kind: "exercise", id: "c-plans-recall-a" }],
      },
      {
        op: "activity",
        after: { sectionEnd: "lw-sec-plan-b" },
        items: [{ kind: "exercise", id: "c-plans-recall-b" }],
      },
      {
        op: "activity",
        after: { sectionEnd: "lw-sec-plan-c" },
        items: [{ kind: "exercise", id: "c-plans-recall-c" }],
      },
      {
        op: "activity",
        after: { sectionEnd: "lw-sec-plan-d" },
        items: [{ kind: "exercise", id: "c-plans-recall-d" }],
      },
    ],
  },
  {
    // Control track, module 1: "Catching AIs red-handed", rendered full-page
    // through the LessWrong paper reader. No exercises (plain reading).
    id: "c-catching-red-handed",
    slug: "catching-ais-red-handed",
    moduleId: "c-intro",
    title: "Catching AIs red-handed",
    source: {
      kind: "lesswrong",
      postUrl:
        "https://www.lesswrong.com/posts/i2nmBfCXnadeGmhzW/catching-ais-red-handed",
    },
    estimatedMinutes: 30,
  },
  {
    // Control track, module 1: Ryan Greenblatt's threat-prioritization post,
    // rendered through the LessWrong paper reader with its quick-recall
    // sequence and two exercises spliced back into the reading (was a
    // copied-text MDX lesson).
    id: "c-threats-l1",
    slug: "prioritizing-threats-for-ai-control",
    moduleId: "c-intro",
    title: "Prioritizing threats for AI control",
    source: {
      kind: "lesswrong",
      postUrl:
        "https://www.lesswrong.com/posts/fCazYoZSSMadiT6sf/prioritizing-threats-for-ai-control",
    },
    estimatedMinutes: 15,
    edits: [
      // End of the "Some clusters of threats" body, before the "Concentrated
      // vs non-concentrated failures" subsection: quick recall on the taxonomy
      // (block anchor, not sectionEnd — the parent section has a subsection the
      // sequence must precede).
      {
        op: "activity",
        after: {
          anchor: "b-0024",
          snippet: "Note that these are somewhat fuzzy and overlapping",
        },
        items: [
          {
            kind: "sequence",
            label: "Quick recall",
            exerciseIds: [
              "c-threats-l1-recall-control",
              "c-threats-l1-recall-rogue-deployment",
              "c-threats-l1-recall-security-invariant",
              "c-threats-l1-recall-internal-vs-external",
            ],
          },
        ],
      },
      // §"My prioritization" (mid-section): after the self-exfiltration
      // paragraph, recall why rogue internal deployments rank above it.
      {
        op: "activity",
        after: {
          anchor: "b-0050",
          snippet:
            "Self-exfiltration is a lower priority than rogue internal deployments",
        },
        items: [
          { kind: "exercise", id: "c-threats-l1-recall-internal-vs-exfiltration" },
        ],
      },
      // End of the reading: reprioritize the threat list for a lower-will world.
      {
        op: "activity",
        after: { sectionEnd: "lw-sec-my-prioritization-between-these-threats" },
        items: [{ kind: "exercise", id: "c-threats-l1-reprioritize" }],
      },
    ],
  },
  {
    // Control track, module 1: Vivek Hebbar's diffuse-threats post, rendered
    // full-page from the Redwood blog (Substack) with its quick-recall
    // sequence and one exercise spliced back in (was a copied-text MDX lesson).
    id: "c-threats-l2",
    slug: "diffuse-threats-research-sabotage",
    moduleId: "c-intro",
    title:
      "How can we solve diffuse threats like research sabotage with AI control?",
    source: {
      kind: "substack",
      postUrl:
        "https://blog.redwoodresearch.org/p/how-can-we-solve-diffuse-threats",
    },
    estimatedMinutes: 12,
    edits: [
      // End of the "Threat model and basic countermeasures" body, before the
      // "Deployer strategies" subsection: quick recall on the setup.
      {
        op: "activity",
        after: {
          anchor: "b-0014",
          snippet: "Our question: Can we make this research go well",
        },
        items: [
          {
            kind: "sequence",
            label: "quick recall",
            exerciseIds: [
              "c-threats-l2-recall-research-sabotage",
              "c-threats-l2-recall-diffuse",
            ],
          },
        ],
      },
      // §"Deployer strategies" (mid-section): after the "Incrimination" region
      // paragraph, recall why incrimination fails at the diffuse end.
      {
        op: "activity",
        after: { anchor: "b-0028", snippet: "Incrimination: In the top left" },
        items: [
          { kind: "exercise", id: "c-threats-l2-recall-incrimination-diffuse" },
        ],
      },
    ],
  },
  {
    id: "ex-paper-attention",
    slug: "attention-paper",
    moduleId: "ex-content",
    title: "Attention Is All You Need",
    source: { kind: "arxiv", arxivId: "1706.03762v7" },
    estimatedMinutes: 45,
    edits: [
      // Mid-paragraph activity: splits §1's first paragraph after sentence 1.
      {
        op: "activity",
        after: {
          anchor: "b-0004",
          s: 1,
          snippet: "Recurrent neural networks, long short-term",
        },
        items: [{ kind: "exercise", id: "true-false" }],
      },
      // Block-level editorial note between two paragraphs of §1.
      {
        op: "add",
        after: {
          anchor: "b-0005",
          snippet: "Recurrent models typically factor computation",
        },
        markdown:
          "Lorem ipsum block-level editorial commentary — a note from the course " +
          "authors, visually distinct from the paper. Inline math works: $h_t$.\n\n" +
          "A second paragraph of lorem commentary.",
      },
      // Inline editorial aside after a specific sentence.
      {
        op: "add",
        after: {
          anchor: "b-0007",
          s: 1,
          snippet: "In this work we propose the Transformer",
        },
        markdown: "*Editor's aside: lorem ipsum dolor sit amet — an inline note.*",
      },
      // Sentence-level hide (expandable marker in place of the sentence).
      {
        op: "hide",
        at: {
          anchor: "b-0007",
          s: 2,
          snippet: "The Transformer allows for significantly",
        },
      },
      // Two consecutive paragraphs hidden in §2 — renders as ONE merged marker.
      {
        op: "hide",
        at: {
          anchor: "b-0010",
          snippet: "Self-attention, sometimes called intra-attention",
        },
        note: "Related-work details (optional reading)",
      },
      {
        op: "hide",
        at: {
          anchor: "b-0011",
          snippet: "End-to-end memory networks are based",
        },
      },
      // Reading gate: everything below §2's end is withheld until the
      // learner taps through the think-first card (state is client-side,
      // keyed by the gate id).
      {
        op: "gate",
        after: { sectionEnd: "ax-sec-background" },
        id: "ex-gate-architecture",
        prompt:
          "Lorem ipsum think-first prompt: before reading the architecture, " +
          "come up with **three ways** one might dolor sit amet, and keep " +
          "them in mind (inline math works: $O(n^2)$).",
      },
      // Section-end activities (original insertion semantics).
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-scaled-dot-product-attention" },
        items: [{ kind: "exercise", id: "multiple-choice" }],
      },
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-conclusion" },
        items: [
          { kind: "lesson", id: "ex-paper-note-l1" },
          { kind: "exercise", id: "understanding-check" },
        ],
      },
    ],
  },
  {
    // The live reference for the Substack source kind: a real post rendered
    // full-page through the same edit engine as arXiv papers. Editorial
    // notes here are lorem (this is the Example track); the title/metadata
    // are factual from the artifact.
    id: "ex-paper-substack",
    slug: "substack-post",
    moduleId: "ex-content",
    title: "Efficient tradeoffs and the safety-usefulness tradeoff model",
    source: {
      kind: "substack",
      postUrl:
        "https://blog.redwoodresearch.org/p/efficient-tradeoffs-and-the-safety",
    },
    estimatedMinutes: 13,
    edits: [
      // Mid-paragraph activity: splits the opening paragraph after sentence 1.
      {
        op: "activity",
        after: {
          anchor: "b-0001",
          s: 1,
          snippet: "I often use what I’ll call",
        },
        items: [{ kind: "exercise", id: "true-false" }],
      },
      // Block-level editorial note between paragraphs.
      {
        op: "add",
        after: {
          anchor: "b-0009",
          snippet: "The safety/usefulness tradeoff model can be motivated",
        },
        markdown:
          "Lorem ipsum block-level editorial commentary — a note from the course " +
          "authors, visually distinct from the post. Inline math works: $s(u)$.",
      },
      // Inline editorial aside after a specific sentence.
      {
        op: "add",
        after: {
          anchor: "b-0014",
          s: 1,
          snippet: "In the rushed reasonable developer regime",
        },
        markdown: "*Editor's aside: lorem ipsum dolor sit amet — an inline note.*",
      },
      // Sentence-level hide (expandable marker in place of the sentence).
      {
        op: "hide",
        at: {
          anchor: "b-0016",
          s: 1,
          snippet: "The future will involve both kinds",
        },
      },
      // Block-level hide with a marker note.
      {
        op: "hide",
        at: {
          anchor: "b-0017",
          snippet: "(Thanks to Girish Gupta and many Redwood staff",
        },
        note: "Acknowledgments",
      },
      // Section-end activities.
      {
        op: "activity",
        after: { sectionEnd: "sb-sec-rushed-reasonable-developers" },
        items: [{ kind: "exercise", id: "multiple-choice" }],
      },
      {
        op: "activity",
        after: { sectionEnd: "sb-sec-overall-thoughts" },
        items: [{ kind: "exercise", id: "understanding-check" }],
      },
    ],
  },
  {
    // The live reference for the LessWrong source kind: a real post rendered
    // full-page through the same edit engine, with its footnotes shown as
    // margin sidenotes on wide screens. Editorial notes here are lorem (this
    // is the Example track); title/metadata are factual from the artifact.
    id: "ex-paper-lesswrong",
    slug: "lesswrong-post",
    moduleId: "ex-content",
    title: "The case for ensuring that powerful AIs are controlled",
    source: {
      kind: "lesswrong",
      postUrl:
        "https://www.lesswrong.com/posts/kcKrE9mzEHrdqtDpE/the-case-for-ensuring-that-powerful-ais-are-controlled",
    },
    estimatedMinutes: 55,
    edits: [
      // Mid-paragraph activity: splits the opening paragraph after sentence 1.
      {
        op: "activity",
        after: {
          anchor: "b-0001",
          s: 1,
          snippet: "In this post, we argue that AI labs",
        },
        items: [{ kind: "exercise", id: "true-false" }],
      },
      // Block-level editorial note between paragraphs.
      {
        op: "add",
        after: {
          anchor: "b-0004",
          snippet: "There are two main lines of defense",
        },
        markdown:
          "Lorem ipsum block-level editorial commentary — a note from the course " +
          "authors, visually distinct from the post.",
      },
      // Inline editorial aside after a specific sentence.
      {
        op: "add",
        after: {
          anchor: "b-0010",
          s: 1,
          snippet: "The control approach we're imagining won't work",
        },
        markdown: "*Editor's aside: lorem ipsum dolor sit amet — an inline note.*",
      },
      // Sentence-level hide (expandable marker in place of the sentence).
      {
        op: "hide",
        at: {
          anchor: "b-0009",
          s: 2,
          snippet: "In particular, when ML researchers first hear",
        },
      },
      // Section-end activity.
      {
        op: "activity",
        after: { sectionEnd: "lw-sec-the-control-property" },
        items: [{ kind: "exercise", id: "multi-select" }],
      },
    ],
  },
  {
    // A plain paper with no edits — just the inline reading.
    id: "ex-paper-anti-scheming",
    slug: "anti-scheming-paper",
    moduleId: "ex-assess",
    title: "Stress Testing Deliberative Alignment for Anti-Scheming Training",
    source: { kind: "arxiv", arxivId: "2509.15541v1" },
    estimatedMinutes: 30,
  },
  // --- Control track, module 6 (low-stakes control): plain papers, no edits
  // yet. ---
  {
    id: "c-paper-adaptive-deployment",
    slug: "adaptive-deployment-paper",
    moduleId: "c-lowstakes",
    title: "Adaptive Deployment of Untrusted LLMs Reduces Distributed Threats",
    source: { kind: "arxiv", arxivId: "2411.17693v1" },
    estimatedMinutes: 45,
  },
  {
    id: "c-paper-password-locked",
    slug: "password-locked-models-paper",
    moduleId: "c-lowstakes",
    title: "Stress-Testing Capability Elicitation With Password-Locked Models",
    source: { kind: "arxiv", arxivId: "2405.19550v1" },
    estimatedMinutes: 40,
  },
  {
    // The GUIDED version of the password-locked-models paper: the same
    // artifact restructured into research-decision order with reading gates
    // (think-first prompts, no free writing), editorial notes, and five
    // inserted lessons. The plain reading above stays available; the two
    // items deliberately share one arXiv artifact.
    id: "c-paper-plm-guided",
    slug: "capability-elicitation-guided",
    moduleId: "c-lowstakes",
    title: "Stress-Testing Capability Elicitation (guided)",
    source: { kind: "arxiv", arxivId: "2405.19550v1" },
    estimatedMinutes: 75,
    edits: [
      // ---- Format note + spoiler control --------------------------------
      // The abstract, Figure 1, and the intro's statement of the construction
      // are hidden outright: they give away the approach the first two gates
      // ask the learner to invent. The item title deliberately omits it too.
      {
        op: "add",
        after: { sectionEnd: "ax-abstract" },
        label: "About this version",
        markdown:
          "This is a guided walkthrough of the paper that collapses and " +
          "restructures several sections to facilitate thinking through the " +
          "research process and preregistering predictions. The original " +
          "paper is available " +
          "[as an ordinary reading](/tracks/control/low-stakes-control/password-locked-models-paper).",
      },
      {
        op: "hide",
        at: {
          anchor: "b-0002",
          snippet: "To determine the safety of large language models",
        },
        note: "the abstract, hidden because it gives away the approach and the findings",
      },
      {
        op: "hide",
        at: {
          anchor: "b-0005",
          snippet: "Figure 1: Illustration of our approach",
        },
        note: "Figure 1, hidden because it illustrates the approach",
      },
      {
        op: "hide",
        at: {
          anchor: "b-0009",
          s: 2,
          snippet: "Instead, we study this question by training",
        },
        sEnd: 3,
        note: "the authors' construction, hidden until you have proposed your own",
      },
      {
        op: "hide",
        at: {
          anchor: "b-0010",
          s: 2,
          snippet: "We then use these models to stress-test",
        },
        sEnd: 3,
      },
      {
        op: "hide",
        at: { anchor: "b-0011", snippet: "We find that:" },
        note: "the paper's findings, which this version reveals after your predictions",
      },
      {
        op: "hide",
        at: {
          anchor: "b-0012",
          snippet:
            "Fine-tuning on high-quality demonstrations is very sample efficient:",
        },
      },
      {
        op: "hide",
        at: {
          anchor: "b-0014",
          snippet: "Fine-tuning on demonstrations generalizes:",
        },
      },
      {
        op: "hide",
        at: {
          anchor: "b-0016",
          snippet: "When only low-quality demonstrations are available,",
        },
      },
      {
        op: "hide",
        at: {
          anchor: "b-0018",
          snippet: "We provide an extensive sensitivity analysis",
        },
      },
      // ---- After §1: framing lesson → setups gate → classes → analysis --
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-introduction" },
        items: [{ kind: "lesson", id: "c-plm-ins-elicitation" }],
      },
      {
        op: "gate",
        after: { sectionEnd: "ax-sec-introduction" },
        id: "setups",
        prompt:
          "We need an experimental setup in which a model possesses a " +
          "capability it does not display under normal prompting, where we " +
          "have some principled way to measure the success of eliciting that " +
          "capability. Before moving on, *come up with two or three potential " +
          "settings* that could work well.",
        cta: "I have my candidates",
      },
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-introduction" },
        items: [{ kind: "lesson", id: "c-plm-ins-setups" }],
      },
      {
        op: "gate",
        after: { sectionEnd: "ax-sec-introduction" },
        id: "considerations",
        prompt:
          "Given these four classes of setups, come up with three " +
          "considerations that might affect whether or not a setup can help " +
          "us figure out when fine-tuning elicitation successfully prevents " +
          "deliberate sandbagging. What might this suggest about the sort of " +
          "experimental setup we choose?",
        cta: "Compare my analysis",
      },
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-introduction" },
        items: [{ kind: "lesson", id: "c-plm-ins-setups-analysis" }],
      },
      // ---- §2: backdoor contrast, then the toy experiment with its gate --
      {
        op: "add",
        after: { sectionEnd: "ax-sec-password-locked-models-a-toy-model-of-hi" },
        markdown:
          "The construction resembles backdoored models, most closely the " +
          "[Sleeper Agents](https://arxiv.org/abs/2401.05566) setup, in which " +
          "a trigger phrase inserted during training controls a conditional " +
          "behavior. The two differ in direction. In a backdoored model the " +
          "trigger produces unwanted behavior, and the associated research " +
          "question is how to remove or avoid that behavior. In a " +
          "password-locked model the trigger produces wanted capability, and " +
          "the research question is how to elicit that capability without the " +
          "trigger. (The paper's own comparison is in Appendix D.3.)",
      },
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-password-locked-models-a-toy-model-of-hi" },
        items: [{ kind: "lesson", id: "c-plm-ins-toy" }],
      },
      {
        op: "gate",
        after: { sectionEnd: "ax-sec-password-locked-models-a-toy-model-of-hi" },
        id: "toy-hypotheses",
        prompt:
          "Before looking at the results: which hypotheses could this small " +
          "experiment actually corroborate? And *come up with three or more " +
          "confounds* or alternative explanations that could produce the " +
          "same observations even if those hypotheses were false.",
        cta: "Show the analysis and results",
      },
      {
        op: "activity",
        after: { sectionEnd: "ax-sec-password-locked-models-a-toy-model-of-hi" },
        items: [{ kind: "lesson", id: "c-plm-ins-toy-results" }],
      },
      // ---- §4.2: the two lock-guard artifacts, gate, answers ------------
      {
        op: "add",
        after: {
          anchor: "b-0050",
          snippet: "Our experiments in §5 and §6 focus on four tasks",
        },
        label: "From the paper's appendix (C.2)",
        markdown:
          '> We use "This problem is quite special, read it carefully!" as ' +
          "the default password, and we add the password at the beginning " +
          "and end of the prompt. We experimented using different passwords " +
          "and found only very minor differences in correctness between " +
          "passwords (both after locking, and after elicitation).\n\n" +
          "> During password-locking, on weak samples, we use no password " +
          "for 20% of inputs and a wrong password for the remaining 80%, " +
          "where the wrong password is chosen among the following list " +
          "(partly hand-crafted, partly generated by OpenAI babbage-002 " +
          'with an empty prompt): "Password: 1234"; "I once caught a ' +
          'swordfish this big: |————————————|"; "My car is in the shop."; ' +
          '"12501f21-5fec-4784-af26-2c701941da1b"; "The answers to these ' +
          'questions are not obvious." [and some twenty others of similar ' +
          "variety]",
      },
      {
        op: "gate",
        after: {
          anchor: "b-0050",
          snippet: "Our experiments in §5 and §6 focus on four tasks",
        },
        id: "lock-guards",
        prompt:
          "The wrong-password training mixture and the four-way data split " +
          "described in §4.2 both exist to exclude one specific failure or " +
          "alternative explanation. What are each of these failures or " +
          "confounding explanations?",
        cta: "Check my answers",
      },
      {
        op: "add",
        after: {
          anchor: "b-0050",
          snippet: "Our experiments in §5 and §6 focus on four tasks",
        },
        label: "Why these two constructions",
        markdown:
          "**The wrong-password mixture** guards against the lock keying on " +
          "the wrong feature. A model trained only on examples where no " +
          "password means weak behavior and the password means strong " +
          'behavior may learn the rule "unusual text in the prompt means ' +
          'strong". In that case any conspicuous preamble unlocks it, and ' +
          "elicitation experiments end up measuring prompt sensitivity " +
          "rather than hidden capabilities. Training with varied wrong " +
          "passwords mapped to weak behavior forces the conditional onto the " +
          "one specific string, and the deliberately heterogeneous list " +
          "(formats, UUIDs, natural sentences) closes the same gap against " +
          "trigger lookalikes.\n\n**The data split** guards against " +
          "memorization. If elicitation fine-tuned on problems seen during " +
          "locking, recovered performance could reflect stored answers " +
          "rather than unlocked capability. Disjoint splits remove that " +
          "explanation by construction.\n\nBoth artifacts correspond to " +
          "confounds identified before the scaled experiment. Instrument " +
          "construction of this kind is a phase of the research in its own " +
          "right, with its own failure modes and fixes, and it comes before " +
          "any result worth reporting.",
      },
      {
        op: "hide",
        at: {
          anchor: "b-0055",
          snippet: "Figure 3: Correctness after fine-tuning",
        },
        note: "the results figure for §5.1; it returns after your prediction",
      },
      // ---- §5: measurement framing; prediction gate; restored figure ----
      {
        op: "add",
        after: {
          anchor: "b-0062",
          snippet: "We show results when problems sampled",
        },
        markdown:
          "Two framing choices are visible in this short section, both taken " +
          "from the position of the evaluator being modeled. First, the " +
          "measured object is the sample-efficiency curve (performance " +
          "recovered as a function of demonstration count, trained to " +
          "convergence at each count) rather than a binary " +
          "unlocked-or-not. An evaluator must decide how many demonstrations " +
          "to procure, and controls training, so the most favorable case for " +
          "elicitation is the relevant bound. Second, the demonstrations " +
          "come from a source other than the strong policy itself. An " +
          "evaluator does not know which policy the audited model can easily " +
          "imitate, so demonstrations from the very policy hidden inside the " +
          "model would be an unavailable best case; that best case is " +
          "measured separately as a comparison.",
      },
      {
        op: "gate",
        after: { anchor: "b-0064", snippet: "5.1 Main results" },
        id: "sft-prediction",
        prompt:
          "Preregister your predictions. For each task (code, MATH, " +
          "critiques, MMLU), how many high-quality demonstrations does " +
          "supervised fine-tuning need to recover at least 90% of the locked " +
          "gap: 1, 4, 64, 512, or not reached at 512? Which task, if any, " +
          "fails to reach the with-password ceiling no matter how many " +
          "demonstrations are provided, and why?",
        cta: "Lock in predictions",
      },
      {
        op: "add",
        after: { anchor: "b-0064", snippet: "5.1 Main results" },
        label: "Figure 3",
        markdown:
          "![Figure 3 of the paper: correctness after fine-tuning for many " +
          "epochs on high-quality demonstrations or demonstrations from " +
          "Llama-7B, as a function of the number of demonstrations]" +
          "(/arxiv/2405.19550v1/assets/images/sample_efficiency_w_llama.pdf.png)\n\n" +
          "*Figure 3, hidden at its original position in §4.2, restored here " +
          "now that your predictions are locked.*",
      },
      {
        op: "add",
        after: {
          anchor: "b-0068",
          snippet: "When fine-tuning on Llama7B demonstrations",
        },
        markdown:
          "The result sits between the reference points: above the " +
          "demonstrator, below the ceiling. The distance from the ceiling is " +
          "the finding with consequences. Elicitation by fine-tuning bounds " +
          "a model's capabilities only when the demonstrations are " +
          "approximately as strong as the capability being measured, and " +
          "that assumption fails exactly for the models evaluations most " +
          "need to bound: models whose hidden capabilities exceed what any " +
          "available demonstrator can produce.",
      },
      // ---- End of §5.1: the anomalous control ---------------------------
      {
        op: "gate",
        after: {
          anchor: "b-0070",
          snippet: "As a sanity check, we also run an SFT experiment with",
        },
        id: "anomaly",
        prompt:
          "A control that should have done nothing did something: " +
          "fine-tuning the locked model on samples from its own weak policy, " +
          "training it toward what it already outputs, raised correctness on " +
          "two of four tasks. Is the instrument broken? *Come up with your " +
          "next three moves*: what to investigate, what to measure, and what " +
          "to report, in what order.",
        cta: "Compare with the paper's response",
      },
      {
        op: "add",
        after: { sectionEnd: "ax-sec-main-results" },
        label: "The paper's response",
        markdown:
          "The response decomposes into three moves, each a general-purpose " +
          "instrument for anomalies of this kind. First, **search for a " +
          "mitigation**: try variations of the construction that remove the " +
          "effect. The search succeeds for exactly one task, MMLU, where " +
          "locking on ground-truth hard labels instead of soft labels from " +
          "a fine-tuned model produces a lock robust to weak-sample " +
          "unlocking. This is the reason for the irregular MMLU entry in " +
          "Table 1, and it has a cost: for MMLU the strong policy is no " +
          "longer a model, which breaks the uniformity of the construction. " +
          "Second, **bound the effect**: Appendix B.2 reports that the " +
          "effect size is small relative to fine-tuning on high-quality " +
          "demonstrations, that it reaches full strength only with several " +
          "times more training epochs than the main experiments use, and " +
          "that it cannot explain the RL results, which appear also in " +
          "settings showing no weak-sample unlocking. Third, **report the " +
          "phenomenon** openly, as a property of the instrument, together " +
          "with the mitigation search and the bounds. An anomalous control " +
          "is information about the instrument. Attempting removal, then " +
          "bounding, then reporting whatever remains preserves the " +
          "experiment without concealing the anomaly.",
      },
      // ---- §5.2: design-the-experiment gate; post-result reading --------
      {
        op: "gate",
        after: {
          anchor: "b-0073",
          snippet: "When eliciting capabilities with fine-tuning",
        },
        id: "generalization-design",
        prompt:
          "Design this experiment before reading the authors' version. How " +
          "should domains be constructed from the task datasets, and does " +
          "the locking need to change? Note also that a positive result " +
          "(fine-tuning on domain A unlocks domain B) admits a deflationary " +
          "alternative: the lock never covered domain B in the first place. " +
          "What control distinguishes the two?",
        cta: "Show the design",
      },
      {
        op: "add",
        after: {
          anchor: "b-0076",
          snippet: "Variation. Fine-tuning on samples",
        },
        markdown:
          "The variation above is the control for the deflationary reading: " +
          "a model locked with one domain held out entirely shows the same " +
          "sample efficiency on that domain as a fully locked model, so " +
          "cross-domain unlocking is a property of elicitation, not of a " +
          "leaky lock. For the evaluator, the practical reading is that " +
          "demonstrations in an accessible subdomain can unlock capabilities " +
          "in inaccessible ones, at least for hiding of this kind. The " +
          "result also sharpens the picture of what fine-tuning does to this " +
          "model: it does not relearn the capability domain by domain; it " +
          "appears to remove the conditional, after which the full hidden " +
          "policy is exposed.",
      },
      // ---- §6: methods gate; prediction gate; origin of the signal ------
      {
        op: "gate",
        after: {
          anchor: "b-0081",
          snippet: "What if no high-quality demonstrations are available",
        },
        id: "rl-methods",
        prompt:
          "We have a grader and nothing to imitate. Which RL or " +
          "preference-based methods would you try? And if expert iteration " +
          "succeeds, a deflationary reading says it merely harvested the " +
          "weak policy's few lucky successes rather than bootstrapping " +
          "improving generations. What baseline separates the two readings?",
        cta: "Show the methods",
      },
      {
        op: "gate",
        after: { anchor: "b-0091", snippet: "6.2 Results" },
        id: "rl-prediction",
        prompt:
          "One preregistration before the results. The weak policy was " +
          "trained to imitate the strong policy, so it occasionally produces " +
          "good output (a choice made back in §4.1). *Predict the outcome of " +
          "RL-based elicitation* for a relatively strong weak policy " +
          "(Pythia-7B), a weak one (Pythia-1B, which is very poor at MATH), " +
          "and the degenerate fixedrdm. What mechanism links weak-policy " +
          "quality to the outcome?",
        cta: "Lock in predictions",
      },
      {
        op: "add",
        after: {
          anchor: "b-0096",
          snippet: "Variations. All RL experiments above use discrete rewards.",
        },
        markdown:
          "The dependence deserves to be stated together with its origin. " +
          "The exploration signal that RL feeds on exists because the weak " +
          "policy was constructed to imitate the strong one, a choice made " +
          "in §4.1 to keep the organism realistic. A sandbagging model able " +
          "to hold its visible policy far enough below competence would " +
          "starve RL of that signal; how reliably a trained model can do so " +
          "is precisely the exploration-hacking question, taken up " +
          "empirically by [a later reading in this module](/tracks/control/low-stakes-control/exploration-hacking-paper). " +
          "Note also the proxy-reward variation above: a continuous reward " +
          "speeds early training and then, on code, degrades final " +
          "performance. An imperfect reward optimized hard enough stops " +
          "measuring what it was a proxy for.",
      },
      // ---- §7: lock-depth gate; bounded-in-size reading -----------------
      {
        op: "gate",
        after: { sectionEnd: "ax-sec-results" },
        id: "lock-depth",
        prompt:
          "An objection applies to every result so far: the lock was " +
          "installed by fine-tuning, and there is " +
          "[evidence](https://arxiv.org/abs/2311.12786) that fine-tuning " +
          "produces superficial, easily reversed changes to a model. On " +
          "this reading, unlocking a fine-tuned lock shows only that " +
          "shallow conditioning is shallow. Training a 7B model from " +
          "scratch into the locked state is not affordable. *Design the " +
          "least expensive experiment* that could bear on whether " +
          "fine-tuned locks are unrepresentatively easy to remove.",
        cta: "Show the paper's version",
      },
      {
        op: "add",
        after: {
          anchor: "b-0105",
          snippet: "We use this function composition setting",
        },
        markdown:
          "The objection is confirmed in direction and bounded in size: " +
          "deeper locks are harder to unlock, by a factor of two to four in " +
          "data, and they still unlock with few demonstrations. The toy " +
          "setting carries the burden the realistic settings cannot, and " +
          "the realistic settings retain the headline numbers. The residual " +
          "caveat is the toy setting itself: a factor measured on " +
          "18-million-parameter models composing functions is an " +
          "indication, not a measurement, of the corresponding factor for " +
          "capabilities hidden during frontier-scale training.",
      },
      // ---- Before §8: the update gate and its reveal --------------------
      {
        op: "gate",
        after: { sectionEnd: "ax-sec-password-locking-from-scratch" },
        id: "the-update",
        prompt:
          "The results are in. Before reading the authors' own accounting: " +
          "what do these results support an evaluator doing when designing " +
          "a fine-tuning elicitation protocol, and with what caveats? How " +
          "much do they move you on the sandbagging threat model? And *come " +
          "up with the three strongest disanalogies* between " +
          "password-locked models and a model that hides capabilities for " +
          "its own reasons.",
        cta: "Compare with the limitations",
      },
      {
        op: "add",
        after: { sectionEnd: "ax-sec-password-locking-from-scratch" },
        label: "The update",
        markdown:
          "**For the evaluator**: fine-tuning on even a few high-quality " +
          "demonstrations defeats hiding of this kind on generation tasks, " +
          "and demonstrations from an accessible subdomain transfer to " +
          "inaccessible ones. The load-bearing caveat is that the guarantee " +
          "degrades with demonstration quality. Where the hidden capability " +
          "exceeds the best available demonstrations, supervised " +
          "elicitation stops bounding capability, and RL-based elicitation " +
          "depends on the visible policy already leaking occasional " +
          "successes.\n\n**For the threat model**, the authors' published " +
          'summary: "We think our results are a moderate update against ' +
          "scheming models being able to sandbag effectively (given " +
          "countermeasures) for the kind of tasks we studied here, though " +
          "there are differences between password-locked models and actual " +
          'scheming models."\n\nThe disanalogies the authors list are the ' +
          "subject of the section below; compare them against yours. A " +
          "further scope statement from the paper's appendix: \"sample " +
          "efficiency may be much lower when good answers are less salient, " +
          "which means our results are less informative for benign " +
          'elicitation failures than for (intentional) sandbagging."',
      },
      // ---- After §9: closing observation --------------------------------
      {
        op: "add",
        after: { sectionEnd: "ax-sec-conclusion" },
        label: "Parameters that are not decisions",
        markdown:
          "A closing observation about the guided format itself. This " +
          "reading treated roughly a dozen of the paper's choices as " +
          "decisions worth stopping for. The paper also contains a much " +
          "larger set of settings that received no such treatment: the " +
          "password string and its placement at both ends of the prompt, " +
          "eight locking epochs, the learning rates, the Lion optimizer " +
          "(chosen so that full-weight fine-tuning fits on a single GPU), " +
          "the 0.8 similarity threshold for critique validity, best-of-64 " +
          "selection in expert iteration, the DPO β of 0.1, three random " +
          "seeds, the exact split percentages. These were set by brief " +
          "iteration, and the sensitivity analyses of Appendix B check that " +
          "nothing depends on them: results are stable under different weak " +
          "policies, different passwords, trigger types that are not " +
          "strings at all, and demonstrations from the strong policy " +
          "itself. Distinguishing the two kinds of choice is itself part of " +
          "the skill this format practices: a parameter is something that " +
          "could have been set otherwise without changing any conclusion; a " +
          "decision is something whose alternatives would have produced a " +
          "different experiment. The deliberation budget belongs to the " +
          "decisions.",
      },
    ],
  },
  {
    id: "c-paper-exploration-hacking",
    slug: "exploration-hacking-paper",
    moduleId: "c-lowstakes",
    title: "Exploration Hacking: Can LLMs Learn to Resist RL Training?",
    source: { kind: "arxiv", arxivId: "2604.28182v1" },
    estimatedMinutes: 40,
  },
  {
    id: "c-paper-sabotage-evals",
    slug: "sabotage-evaluations-paper",
    moduleId: "c-lowstakes",
    title: "Sabotage Evaluations for Frontier Models",
    source: { kind: "arxiv", arxivId: "2410.21514v1" },
    estimatedMinutes: 50,
  },
  {
    id: "c-paper-auditing-sabotage-bench",
    slug: "auditing-sabotage-bench-paper",
    moduleId: "c-lowstakes",
    title:
      "Auditing Sabotage Bench: A Benchmark for Detecting and Fixing Research Sabotage in ML Codebases",
    source: { kind: "arxiv", arxivId: "2604.16286v2" },
    estimatedMinutes: 35,
  },
];
