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
