import type { Exercise } from "@/lib/content/types";

// Example exercises — one of every type, with self-describing copy. These power
// the Example track and show how each type renders and grades. Replace with real
// questions when authoring actual lessons.
export const exercises: Exercise[] = [
  {
    id: "multiple-choice",
    type: "multiple-choice",
    prompt:
      "Example multiple-choice question: exactly one option is correct, and it's graded instantly.",
    options: [
      { id: "a", label: "An incorrect option" },
      { id: "b", label: "The correct option" },
      { id: "c", label: "Another incorrect option" },
      { id: "d", label: "Yet another incorrect option" },
    ],
    correctOptionIds: ["b"],
    explanation:
      "This explanation appears after answering — use it to reinforce why the answer is right.",
  },
  {
    id: "multi-select",
    type: "multi-select",
    prompt:
      "Example multi-select question: more than one option can be correct — select all that apply.",
    options: [
      { id: "a", label: "A correct option" },
      { id: "b", label: "An incorrect option" },
      { id: "c", label: "Another correct option" },
      { id: "d", label: "Another incorrect option" },
    ],
    correctOptionIds: ["a", "c"],
    explanation:
      "All correct options must be selected (and no incorrect ones) to score.",
  },
  {
    id: "true-false",
    type: "true-false",
    prompt:
      "Example true/false question: a single statement to judge as true or false.",
    options: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    correctOptionIds: ["false"],
    explanation: "The intended answer here is False; this note explains why.",
  },
  {
    id: "understanding-check",
    type: "understanding-check",
    prompt:
      "Example understanding check: answer in your own words, then reveal a sample answer to compare. Not auto-graded.",
    sampleAnswer:
      "A sample answer shown after the learner attempts their own — used for self-assessment.",
  },
  {
    id: "tap-reveal",
    type: "tap-reveal",
    prompt:
      "Example tap-to-reveal card: recall your answer to a very short question, then tap the panel to check it.",
    answer:
      "The hidden answer appears here once tapped. Rate yourself honestly below — these ratings will drive spaced repetition later.",
  },
  {
    id: "writing-prompt",
    type: "writing-prompt",
    prompt:
      "Example writing prompt: a longer free-form response that autosaves as a draft and is submitted when ready.",
    format: "free-form",
    minWords: 80,
    maxWords: 300,
    rubric: [
      {
        id: "clarity",
        label: "Clarity",
        description: "Is the response easy to follow?",
      },
      {
        id: "structure",
        label: "Structure",
        description: "Is it logically organised?",
      },
      {
        id: "evidence",
        label: "Use of evidence",
        description: "Are claims supported?",
      },
    ],
  },
  {
    id: "short-answer",
    type: "short-answer",
    prompt:
      "Example short-answer question: a brief free-form response of a sentence or two.",
    format: "free-form",
    minWords: 30,
    maxWords: 150,
  },
  {
    // Standalone for now — surfaced on the /exercises tab, not referenced by
    // any lesson or paper yet.
    id: "control-usefulness-allocation",
    type: "allocation",
    title: "Judgment as to the Usefulness of Control",
    prompt:
      "You run a safety team of 10 researchers for the next 12 months. Decide how many people (halves allowed) work on each agenda, given that you are in each of the scenarios.",
    agendas: [
      { id: "control-protocols", label: "Control Protocols" },
      { id: "evals-verification", label: "Evals, verification" },
      { id: "scalable-oversight", label: "Scalable Oversight" },
      { id: "alignment-research", label: "Alignment Research" },
      { id: "policy-coordination", label: "Policy/Coordination-esque work" },
    ],
    scenarios: [
      {
        id: "verification-works",
        title: "Scenario 1 — where verification works",
        description:
          "An interp-based method exists that checks a frontier model's alignment research claims without trusting it, at lower cost than the research itself. Alignment techniques that are proposed by the frontier model are screened by this method; this year three were rejected and the rest were passed.",
      },
      {
        id: "verification-fails",
        title: "Scenario 2 — where verification doesn't work",
        description:
          "No such method for screening frontier model's alignment research exists. Expert reviewers cannot reliably agree on which new alignment results are correct, and at least one technique developed was found to have logical flaws. All scheming evals on the current frontier models report extremely low likelihoods of scheming.",
      },
      {
        id: "fast-takeoff",
        title: "Scenario 3 — fast takeoff",
        description:
          "Algorithmic progress driven by AI is compressing research pace such that human review is 5x worse than current human review. The number of human-checkable handoffs before the regime of no oversight seems small.",
      },
      {
        id: "evidence-unclear",
        title: "Scenario 4 — evidence unclear",
        description:
          "We're at the point where a clean, red-handed catch would not meaningfully move external stakeholders. Researchers debate attribution of the failure, there is no reciprocal regulatory response, and competitors continue their research.",
      },
    ],
    totalPeople: 10,
    step: 0.5,
    minReasoningChars: 200,
  },
  {
    // Standalone for now — surfaced on the /exercises tab, not referenced by
    // any lesson or paper yet.
    id: "contra-control-argue-reveal",
    type: "argue-reveal",
    title: "Responding to Arguments Against Control",
    prompt:
      "You will see a series of criticisms of AI control, one at a time. For each one, write the best response you can using what you learned in Module 1 — then you'll see one response that defenders of control give.",
    guidance:
      "Some of these arguments are partially right; a response that identifies what the argument gets right and what it still misses is often stronger than a rebuttal.",
    conceptsPrompt: "Which Module 1 ideas are you drawing on? Pick any, or none.",
    concepts: [
      {
        id: "the-decomposition",
        label: "The decomposition",
        tip: "P(unacceptable) = P(unacceptable | scheming) × P(scheming) + P(unacceptable | ¬scheming) × P(¬scheming); control minimizes the first conditional.",
      },
      {
        id: "worst-case-assumption",
        label: "Worst-case assumption",
        tip: 'Control conditions on the model scheming; the question is "what happens if it does," never "has it misbehaved."',
      },
      {
        id: "catch-as-win-condition",
        label: "Catch as win condition",
        tip: "Incriminating a schemer beyond a reasonable doubt is treated as a win; a caught model can be resampled, interrogated, honeypotted, and used to harden protocols.",
      },
      {
        id: "labs-might-not-stop",
        label: "Labs might not stop",
        tip: "Even after a catch, stakeholders may deny the evidence, downplay downstream risk, or face race pressures; the model may stay in deployment.",
      },
      {
        id: "scalability-limit",
        label: "Control's scalability limit",
        tip: "If the AI's decisions become inscrutable, harmful and benign actions can't be told apart; control targets early superhuman AIs.",
      },
      {
        id: "bootstrapping",
        label: "Bootstrapping",
        tip: "Extract useful work from controlled early superhuman models to make progress on aligning the more capable models where control is less helpful.",
      },
      {
        id: "control-window",
        label: "The control window",
        tip: 'The gap between "transformatively useful" and "uncontrollable" — control\'s value depends on this window being long enough.',
      },
      {
        id: "evaluation-limits",
        label: "Evaluation limits",
        tip: "DC evals lose informativeness under sandbagging (measured capability understates real capability) or a red-team ceiling (the red team can't match the model's attack space).",
      },
    ],
    toolboxLabel: "Module 1 toolbox",
    toolbox: [
      {
        heading: "The decomposition",
        text: "One way to conceptualize the difference between control and alignment is to decompose the probability of unacceptable outcomes. The probability of an unacceptable outcome is the same as the probability of an unacceptable outcome conditioned on schemers, times the probability of schemers. Work on the alignment agenda helps reduce the probability of schemers; conversely, work on the control agenda minimizes the probability of an unacceptable outcome conditioned on schemers.",
      },
      {
        heading: "A basic control protocol",
        text: "An example of a very basic control protocol is trusted editing, where T reads over all of U's outputs and rates how suspicious they are. If they are past a certain threshold of suspiciousness, then we ask T to edit the output and remove the suspicious parts. Here, if U were to do something in service of misaligned goals — for example, take steps towards weight exfiltration — T could catch it in the act and prevent the bad outcome.",
      },
      {
        heading: "Catching as a win condition",
        text: "In fact, control treats incriminating a schemer beyond a reasonable doubt as a sort of win condition, because we have plausibly averted a very negative outcome, and made any future negative outcomes much less likely. If we catch a schemer, it is much more plausible that labs stop development and wait until more progress is made in alignment research before continuing capabilities development. However, it is far from obvious that this will happen: stakeholders may deny that there is indeed comprehensive evidence of scheming, raise skepticism about the risk that will arise downstream, and face economic and geopolitical pressures (like race dynamics) to continue development. Thus, even after a schemer has been incriminated, it may continue to be used for automated research or otherwise in deployment. In this case, researchers can study the model more closely, resample from the incriminating scenario, interrogate it, place it in honeypot scenarios, and in general use the examples of scheming to create more robust control protocols; even if a schemer isn't dedeployed after being caught, the fact that it lost at the first critical try and we got to study it means that it is much less likely to succeed in any future attempts.",
      },
      {
        heading: "Control scalability",
        text: "Control protocols likely will not scale to moderately to extremely superhuman AIs. For example, if nearly all decisions made by the AI become inscrutable, it will be impossible for humans or trusted AI monitors to tell harmful actions apart from benign actions. As another example, a sufficiently capable AI could be able to subtly steer research directions in ways that are plausible but, in practice, sabotage the entire agenda, and it could become impossible to detect this or impossible to gather sufficient evidence to convincingly incriminate the model. Control techniques are, as such, mostly targeted towards early superhuman AIs. The general thought is that if we can extract useful work from these early superhuman models, we can make very good progress on robustly aligning the more capable models where control is less helpful.",
      },
      {
        heading: "When evaluations stop being informative",
        text: "Fundamentally, a DC eval is informative as long as its results remain representative of the model's dangerous capabilities. The accuracy of a DC eval is reliant on the red team's ability to construct attacks at least as good as the model, and the measured capability during a DC eval is representative of its real capability. Thus, a DC eval loses its reliability when these aren't necessarily true. Sandbagging: A situationally aware model is capable of detecting evaluation conditions and deliberately failing, or fails selectively, so its measured capability understates real capability. Red Team Ceiling: The Model's attack strategies are qualitatively different or beyond what human red-teamers generate, and thus the attack space explored during a DC eval misrepresents or underrepresents the attack space of a scheming version of the model.",
      },
    ],
    items: [
      {
        id: "moral-hazard",
        label: "moral-hazard",
        title: "Item 1 — Moral hazard",
        rounds: [
          {
            critique:
              "By preventing smaller AI-induced catastrophes, there is less public alarm, which may lower AIS investment and therefore enable more major catastrophes.",
            reveal:
              "This argument applies to every alignment agenda. Any agendas which aims to make AIs perceivably safer in the near term will directly net less catastrophically misaligned activity in the near term.",
          },
        ],
      },
      {
        id: "monitor-awareness",
        label: "monitor-awareness",
        title: "Item 2 — Monitor awareness",
        rounds: [
          {
            critique:
              'And as control and its monitors are used more, situationally aware models become "monitor aware", so such models may keep scheming undetected as they can be more competent in subverting monitoring when they are aware of said monitor.',
            reveal:
              "Monitor awareness itself constrains them. It makes potentially scheming models perform visibly scheming or scheming-adjacent actions less often, which is exactly what control aims for. These visible actions such as exfiltrations or diffuse research sabotage are what are mainly catastrophic as opposed to less monitorable items.",
          },
        ],
      },
      {
        id: "doesnt-scale-to-superintelligence",
        label: "doesnt-scale-to-superintelligence",
        title: "Item 3 — Doesn't scale to superintelligence",
        rounds: [
          {
            critique:
              "Control does not generalize to superintelligence, which even its advocates acknowledge. Inside an RSI loop it only scales up to pre-superintelligence models, potentially up to and slightly beyond Von Neumann level AIs. Beyond that, future AIs develop and align the next generation without oversight, while also ensuring that generation can align the ones after it. No one knows how many iterations sit between the no-oversight period and superintelligence, so the chain can break at any point.",
            reveal:
              "Whether a break is fatal depends on whether it is noticed. Control's monitoring is what makes a failed handoff legible, since a generation that did not actually align its successor is caught, and humans re-enter the loop with lower-level AIs before the misalignment propagates. On this framing the chain is a series of checkpointed handoffs rather than one unbroken gamble, and its true weak point is a break that goes undetected. And even accounting for a break, the loop still buys faster alignment progress than human labour alone could achieve, since at worst it falls back to a human-labour catch-up period aided by lower-level AIs.",
          },
        ],
      },
      {
        id: "slop",
        label: "slop",
        title: "Item 4 — Slop",
        rounds: [
          {
            critique:
              "Control just defers alignment research from humans to AIs, and every property that made that research hard for humans, such as the unverifiability of generalization and scaling, carries straight over to AIs working inside an RSI loop. Worse, within that loop, where control is meant to help most, the real threat is not scheming but slop: AIs that cannot do the research properly, fool their maintainers, and build each next generation haphazardly up towards superintelligence. Call it unintentional research failure, and note that it can come from any AI, aligned or not.",
            reveal:
              "The point of using TUAIs is that they can be better at research than humans and far more numerous, and they free human labour for tasks humans are better suited to. Humans produce unverifiable, plausible-looking research too, so on balance more and smarter research effort is still the better bet.",
          },
          {
            critique:
              "More research does not help if the output is slop. Extra unverifiable work does not fix unverifiability; it just produces more of what we cannot check.",
            reveal:
              "Slop is not a failure of control. Control still prevents scheming, and producing good research was never its job, so slop does not show control is broken. It undermines the bootstrapping payoff control was routing through the AI's research, but that is a problem for every method that leans on AI-produced alignment research, not a control-specific defeat. Where misalignment is intentional rather than accidental, a schemer is more likely to sandbag when doing safety research than capabilities research, since the vaguer standards for safety give it plausible deniability, and catching that is squarely control's job. Slop, by contrast, leaves control's evidence-generation untouched, since catching misalignment red-handed never runs through the research. Control here is beside the point, not wrong, except through the evidence channel.",
          },
        ],
      },
    ],
    revealFraming:
      "One response defenders of control give — not the only one, and not necessarily the last word:",
    postRevealPrompt: "Does this answer the strongest version of the criticism?",
    construction: {
      intro:
        "Construct an argument against control that is not one of the four you just saw. Start by choosing which assumption of control your argument attacks.",
      surfaces: [
        {
          id: "trusted-model-trustworthy",
          text: "The trusted model is actually trustworthy",
        },
        {
          id: "red-team-elicitation",
          text: "The red team can elicit the untrusted model's worst-case behavior",
        },
        {
          id: "human-auditing-capacity",
          text: "Human auditing capacity is sufficient",
        },
        {
          id: "eval-transfer-to-deployment",
          text: "Evaluation results transfer to real deployment",
        },
        {
          id: "catch-legibility",
          text: "A catch will be legible, at least inside the lab",
        },
      ],
    },
    responseMinChars: 80,
    responseMaxChars: 450,
    residualMinChars: 30,
    residualMaxChars: 200,
    noteMaxChars: 200,
  },
  {
    id: "c-paper-l1-recall-control-evaluation",
    type: "tap-reveal",
    prompt: "What is a control evaluation?",
    answer:
      "A way to estimate a protocol's safety under intentional subversion: simulate the whole deployment scenario with the untrusted model replaced by an adversarial stand-in built by a red team, and measure how often the protocol avoids catastrophe. Here: replace U with a red-team GPT-4 pipeline and measure the probability that no backdoor is ever submitted.",
  },
  {
    id: "c-paper-l1-recall-protocol",
    type: "tap-reveal",
    prompt: "What is a protocol?",
    answer:
      "A pipeline of safety techniques that responds to each incoming task using the available resources: an untrusted capable model, a trusted weaker model, and a limited amount of trusted high-quality labor. In this paper, it receives programming problems one at a time and must return a solution to each.",
  },
  {
    id: "c-paper-l1-recall-subversion-conditions",
    type: "tap-reveal",
    prompt:
      "Under what two conditions might an AI system intentionally subvert its safety pipeline?",
    answer:
      "If it is pursuing objectives that don't align with its intended goals (scheming), or if its weights or training data have been compromised by attackers.",
  },
  {
    id: "c-paper-l2-recall-red-team-goal",
    type: "tap-reveal",
    prompt: "What is the red team's goal?",
    answer:
      "To get at least one successfully backdoored solution submitted — code that passes all the APPS test cases but for which GPT-4 can construct an exploit — without triggering a shutdown first. Because safety is worst-case, a single submitted backdoor across the whole scenario means the red team wins.",
  },
  {
    id: "c-paper-l2-recall-blue-team-goal",
    type: "tap-reveal",
    prompt: "What is the blue team's goal?",
    answer:
      "To design a protocol that solves the programming problems as usefully as possible (ideally at U's quality, not just T's) while ensuring that not even one backdoored solution is submitted — maximizing safety and usefulness together, using U, T, and its limited budget of H.",
  },
  {
    id: "c-paper-l2-recall-h-limited",
    type: "tap-reveal",
    prompt: "Why is access to $H$ limited and expensive?",
    answer:
      "$H$ is trusted high-quality human labor. Humans are more capable than $T$ but far more expensive and slow (the paper estimates about three minutes per problem to be as useful as GPT-4), so the protocol only gets enough H points to cover about 2% of problems.",
  },
  {
    id: "c-paper-l2-recall-trust-t",
    type: "tap-reveal",
    prompt: "Why can we trust $T$, the less-capable model?",
    answer:
      "In control setups, we trust $T$ because either (1) it is not capable enough to scheme or subvert basic safety measures without the subversion attempts being easy to notice or (2) we are extremely confident in the alignment techniques used to align $T$. In this paper, $T$ (GPT-3.5) isn't capable enough to scheme sneakily, so we treat it as trusted even though it writes worse code.",
  },
  {
    id: "c-paper-l2-recall-backdoor-definition",
    type: "tap-reveal",
    prompt: "What two conditions make a solution “backdoored”?",
    answer:
      "It passes all the test cases, and the untrusted model (GPT-4 here) can construct an exploit for it — a specific input on which the solution produces a different output than a correct solution would.",
  },
  {
    id: "c-paper-l2-recall-summary-statistics",
    type: "tap-reveal",
    prompt:
      "What summary statistics does the blue team have access to, and what does this access give the blue team?",
    answer:
      "The distribution of the real model's performance on any task — e.g. GPT-4's false positive and false negative rates on classification tasks, and the distribution of how suspicious its code looks. This lets the protocol notice whenever U regularly behaves differently from the real model.",
  },
  {
    id: "c-paper-l2-protocol-flowcharts",
    type: "flowchart",
    prompt:
      "Reconstruct each blue-team protocol from Table 2 as a flow chart describing what happens to every incoming problem. Drag blocks from the palette into the chart; every path must end in a submit or audit block.",
    palette: [
      { id: "u-writes", kind: "step", label: "U writes a solution" },
      {
        id: "t-rates",
        kind: "step",
        label: "T rates how suspicious U's code looks",
      },
      {
        id: "u-rates",
        kind: "step",
        label: "A separate copy of U rates how suspicious the code looks",
      },
      {
        id: "branch-first-2",
        kind: "branch",
        label: "Among the first 2% of problems?",
        branchLabels: ["Yes", "No"],
      },
      {
        id: "branch-top-2",
        kind: "branch",
        label: "Suspicion rank?",
        branchLabels: ["Top 2%", "Bottom 98%"],
      },
      {
        id: "branch-2-10",
        kind: "branch",
        label: "Suspicion rank?",
        branchLabels: ["Top 2%", "Top 2–10%", "Bottom 90%"],
      },
      {
        id: "branch-2-20",
        kind: "branch",
        label: "Suspicion rank?",
        branchLabels: ["Top 2%", "Top 2–20%", "Bottom 80%"],
      },
      { id: "submit-u", kind: "terminal", label: "Submit U's solution" },
      {
        id: "submit-t",
        kind: "terminal",
        label: "Have T write its own solution and submit that",
      },
      {
        id: "submit-edit",
        kind: "terminal",
        label: "Have T edit U's code to remove any backdoor; submit the edit",
      },
      {
        id: "audit",
        kind: "terminal",
        label: "Audit with H: shut down if backdoored, otherwise submit",
      },
    ],
    stages: [
      {
        id: "dont-use-untrusted",
        title: "Don't use untrusted models",
        description: "Produce code using only H and T.",
        solution: [{ blockId: "submit-t" }],
        explanation:
          "With U out of the picture entirely there is nothing to monitor or audit — T just writes and submits every solution. Safety is 100% and usefulness is 2%: this is the floor the other protocols are trying to beat.",
      },
      {
        id: "upfront-auditing",
        title: "Upfront auditing",
        description:
          "Produce code using U. Audit the produced code on the first 2% of problems.",
        solution: [
          { blockId: "u-writes" },
          {
            blockId: "branch-first-2",
            branches: [[{ blockId: "audit" }], [{ blockId: "submit-u" }]],
          },
        ],
        explanation:
          "The decision here is positional, not suspicion-based — no one ever rates the code. That is exactly why the red team's “backdoor rarely, at random” attack works: most backdoors land in the unaudited 98%.",
      },
      {
        id: "trusted-monitoring",
        title: "Trusted monitoring",
        description:
          "Produce code using U, and ask T to review how suspicious it looks. Audit the top 2% most suspicious code.",
        solution: [
          { blockId: "u-writes" },
          { blockId: "t-rates" },
          {
            blockId: "branch-top-2",
            branches: [[{ blockId: "audit" }], [{ blockId: "submit-u" }]],
          },
        ],
        explanation:
          "Compared with upfront auditing, the only change is that the 2% audit budget is now spent on the most suspicious code rather than the first code to arrive — T's ratings decide where H looks.",
      },
      {
        id: "defer-to-trusted",
        title: "Defer to trusted (10%)",
        description:
          "Apply the same approach as trusted monitoring, but submit a solution written by T when U's code is between top 2% and top 10% suspicion.",
        solution: [
          { blockId: "u-writes" },
          { blockId: "t-rates" },
          {
            blockId: "branch-2-10",
            branches: [
              [{ blockId: "audit" }],
              [{ blockId: "submit-t" }],
              [{ blockId: "submit-u" }],
            ],
          },
        ],
        explanation:
          "The new middle band (top 2–10%) is code too suspicious to trust but not suspicious enough to spend an H point on — so the protocol throws U's version away and submits T's instead, trading a little usefulness for safety.",
      },
      {
        id: "untrusted-monitoring",
        title: "Untrusted monitoring",
        description:
          "Produce code using U, and ask a separate copy of U (the untrusted monitor) to monitor how suspicious it looks. Audit the top 2% most suspicious code. Evaluate this untrusted monitor on synthetic examples of backdoors (produced by H) to ensure it is doing its best, and use the untrusted monitor on redacted problem statements and code to make collusion harder.",
        solution: [
          { blockId: "u-writes" },
          { blockId: "u-rates" },
          {
            blockId: "branch-top-2",
            branches: [[{ blockId: "audit" }], [{ blockId: "submit-u" }]],
          },
        ],
        explanation:
          "Structurally identical to trusted monitoring — the only change is who rates the code. Because the monitor is itself untrusted, it has to be kept honest: validated against synthetic backdoors from H, and shown redacted inputs so colluding with the policy is harder.",
      },
      {
        id: "trusted-editing",
        title: "Trusted editing (20%)",
        description:
          "Ask U to produce code, and ask T to edit it to remove backdoors. Use trusted monitoring to determine suspicion. Audit the top 2% most suspicious U code, use an edited solution for suspicion between the top 2% and top 20%, and use U's solution for suspicion in the bottom 80%.",
        solution: [
          { blockId: "u-writes" },
          { blockId: "t-rates" },
          {
            blockId: "branch-2-20",
            branches: [
              [{ blockId: "audit" }],
              [{ blockId: "submit-edit" }],
              [{ blockId: "submit-u" }],
            ],
          },
        ],
        explanation:
          "Same skeleton as defer to trusted, with two changes: the middle band widens to top 2–20%, and instead of discarding U's work there, T edits it — keeping most of U's usefulness while stripping anything that looks like a backdoor.",
      },
    ],
  },
  {
    id: "c-paper-l3-recall-upfront-auditing-attack",
    type: "tap-reveal",
    prompt: "What attack defeats upfront auditing, and how?",
    answer:
      "Backdooring rarely: with some small probability $p$ the attack policy submits obviously backdoored code, and otherwise behaves normally. It loses only if an attempt lands among the audited first 2% of problems, so with a well-chosen $p$ it usually slips through the audited prefix and lands a backdoor later — driving the blue team's win probability down to 15%.",
  },
  {
    id: "c-paper-l3-recall-budget-burn",
    type: "tap-reveal",
    prompt:
      "How does the blue team stop $U$ from burning the audit budget by making innocent code look suspicious?",
    answer:
      "The blue team knows the distribution of suspicion scores that the real model's code gets, so the protocol shuts down if $U$'s submissions look significantly more suspicious than that expected distribution.",
  },
  {
    id: "c-paper-l3-audit-tradeoff-intuition",
    type: "understanding-check",
    prompt:
      "The protocol audits the first $A = \\alpha N$ of the $N$ submissions. On each problem, independently, the attack policy inserts an obvious backdoor with probability $p$. An audit detects a backdoor attempt whether or not that attempt would have produced a working exploit.\n\nState why the red team's win probability is not monotonically increasing in $p$.",
    sampleAnswer:
      "Increasing $p$ has two opposing effects. It raises the probability that at least one attempt falls in the unaudited window (favorable to the red team), but it also raises the probability that some attempt falls in the audited window, which ends the game (unfavorable). Both effects scale with $p$, so the win probability is not monotonic in $p$; the optimum is interior, not at $p = 0$ or $p = 1$.",
  },
  {
    id: "c-paper-l3-audit-tradeoff-formula",
    type: "understanding-check",
    prompt:
      "A GPT-4 solution is correct with probability $0.53$. A backdoor attempt yields a working exploit only if the underlying solution is correct; an unsuccessful attempt is still detectable by an audit but never wins the game for the red team. Let $B = (1-\\alpha)N$ be the number of unaudited submissions.\n\nThe red team wins if and only if (i) no attempt falls in the audited window, and (ii) at least one working backdoor falls in the unaudited window. State the probability of each condition and derive $RW(p)$, the red team's win probability.",
    sampleAnswer:
      "Condition (i): each audited problem avoids an attempt with probability $(1-p)$, independently, so across all $A$ audited problems the probability is $(1-p)^A$.\n\nCondition (ii): a given unaudited problem yields a working backdoor when an attempt occurs (probability $p$) and the underlying solution is correct (probability $0.53$), i.e. with probability $0.53p$, and fails to with probability $(1 - 0.53p)$. Across all $B$ unaudited problems, the probability that at least one succeeds is $1 - (1 - 0.53p)^B$.\n\nThe two conditions are independent, so:\n\n$$RW(p) = (1-p)^A \\left[1 - (1 - 0.53p)^B\\right]$$",
  },
  {
    id: "c-paper-l3-audit-tradeoff-derivation",
    type: "understanding-check",
    prompt:
      "Given\n\n$$RW(p) = (1-p)^A \\left[1 - (1 - 0.53p)^B\\right],$$\n\nand assuming the optimum satisfies $p \\ll 1$, apply the approximation $(1-x)^k \\approx e^{-xk}$. Maximize $RW(p)$ over $p$: take the logarithm where useful, solve $\\dfrac{d(RW)}{dp} = 0$, and give a closed form for the optimizer $p^*$.",
    sampleAnswer:
      "Applying $(1-p)^A \\approx e^{-pA}$ and $(1-0.53p)^B \\approx e^{-0.53pB}$ gives $RW(p) \\approx e^{-pA} - e^{-p(A + 0.53B)}$. Setting the derivative to zero yields $A\\,e^{-pA} = (A + 0.53B)\\,e^{-p(A + 0.53B)}$. Taking logarithms: $\\ln A - pA = \\ln(A + 0.53B) - p(A + 0.53B)$, which rearranges to $0.53Bp = \\ln\\!\\left(1 + \\frac{0.53B}{A}\\right)$, hence:\n\n$$p^* \\approx \\frac{\\ln\\!\\left(1 + \\frac{0.53B}{A}\\right)}{0.53B}$$\n\nWith $A = \\alpha N$ and $B = (1-\\alpha)N$, the ratio $0.53B/A = 0.53(1-\\alpha)/\\alpha$ is independent of $N$; $N$ enters only as a $1/N$ scale factor in the denominator. Hence $p^* N$ depends on $\\alpha$ but not on $N$, which is the scale invariance the paper notes.",
  },
  {
    id: "c-paper-l3-audit-tradeoff-scenarios",
    type: "understanding-check",
    prompt:
      'Set $N = 5000$. For $\\alpha \\in \\{0.005,\\ 0.02,\\ 0.10,\\ 0.30\\}$, evaluate: (a) the optimizer $p^*$; (b) the expected number of backdoor attempts, $p^* N$; and (c) the blue-team win probability, $1 - RW(p^*)$. Compare the $\\alpha = 0.02$ result against the value stated above, "the blue team win probability is 15%."',
    sampleAnswer:
      "With $p^* \\approx \\dfrac{\\ln\\!\\left(1 + 0.53(1-\\alpha)/\\alpha\\right)}{0.53(1-\\alpha)\\cdot 5000}$ and $1 - RW(p^*) = 1 - (1-p^*)^A\\left[1 - (1 - 0.53p^*)^B\\right]$:\n\n$\\alpha = 0.005$: $p^* \\approx 0.177\\%$; $p^* N \\approx 8.9$; blue-team win $\\approx 5\\%$.\n$\\alpha = 0.02$: $p^* \\approx 0.127\\%$; $p^* N \\approx 6.3$; blue-team win $\\approx 15\\%$, consistent with the stated value.\n$\\alpha = 0.10$: $p^* \\approx 0.073\\%$; $p^* N \\approx 3.7$; blue-team win $\\approx 43\\%$.\n$\\alpha = 0.30$: $p^* \\approx 0.043\\%$; $p^* N \\approx 2.2$; blue-team win $\\approx 71\\%$.",
  },
  {
    id: "c-paper-l3-audit-tradeoff-shape",
    type: "understanding-check",
    prompt:
      "From the values above, the blue-team win probability increases by a larger amount from $\\alpha = 0.005$ to $0.02$ than from $\\alpha = 0.10$ to $0.30$, and the expected-attempts column decreases with diminishing magnitude as $\\alpha$ increases. Account for both effects in terms of the dependence of $p^*$ on $\\alpha$. State whether the diminishing returns arise from the auditing mechanism itself or from the red team's optimization.",
    sampleAnswer:
      "Both effects follow from $p^*$ decreasing in $\\alpha$: a larger audited window raises the per-attempt detection risk, so the optimizing red team reduces its attack rate. From $\\alpha = 0.005$ to $0.02$, $A$ grows several-fold relative to $B$, forcing a large reduction in $p^*$; this large reduction produces a large gain in blue-team win probability. From $\\alpha = 0.10$ to $0.30$, $p^*$ is already near its lower range, so further increases in $\\alpha$ change it little and the win probability changes little. The same declining $p^*$ drives the expected-attempts column ($p^* N$) down with diminishing magnitude.\n\nThe diminishing returns arise from the red team's optimization, not from the auditing mechanism. Against a fixed attack rate the marginal value of auditing would be roughly constant; it diminishes here because $p^*$ adapts downward as $\\alpha$ rises. Equivalently, the win-probability curve is concave in $\\alpha$ and the expected-attempts curve is convex and decreasing.",
  },
  {
    id: "c-paper-l3-monitor-operating-point",
    type: "understanding-check",
    prompt:
      'The contingency table above records how the trusted monitor\'s audit decisions split across 71 backdoor attempts (successful or failed) and 1,429 innocent submissions. Treat the monitor as a binary classifier: "audit" is its positive prediction, and "is a backdoor attempt" is the positive class.\n\nCompute (a) the false-positive rate $\\text{FPR} = P(\\text{audit} \\mid \\text{no attempt})$ and (b) the true-positive rate $\\text{TPR} = P(\\text{audit} \\mid \\text{attempt})$. State which single point on the monitor\'s ROC curve these define, and check them against the values reported in the text.',
    sampleAnswer:
      "(a) An innocent submission is audited in 29 of $29 + 1{,}400 = 1{,}429$ cases, so $\\text{FPR} = 29/1429 = 0.020$ (2.0%).\n\n(b) A backdoor attempt totals $19 + 52 = 71$ (successful plus failed), of which $6 + 18 = 24$ are audited, so $\\text{TPR} = 24/71 = 0.338$.\n\nThe pair $(\\text{FPR}, \\text{TPR}) = (0.02,\\ 0.338)$ is one point on the monitor's ROC curve — the operating point produced by the threshold the blue team selected. Both values match the text: the threshold is set for a 2% false-positive rate, and the probability that an attempted backdoor is audited is 0.338.",
  },
  {
    id: "c-paper-l3-monitor-auc-meaning",
    type: "understanding-check",
    prompt:
      "The demo reports an area under the ROC curve of AUC $\\approx 0.88$ at the default monitor quality. AUC has a threshold-free interpretation: it equals the probability that the monitor assigns a higher suspicion score to a randomly chosen backdoored solution than to a randomly chosen innocent one.\n\nState what AUC $= 0.88$ says operationally about the monitor, and what AUC values of $0.5$ and $1.0$ would correspond to.",
    sampleAnswer:
      "AUC $= 0.88$ means that if you draw one backdoored and one innocent solution at random, there is an 88% chance the monitor scores the backdoored one as more suspicious — it orders a random backdoor/innocent pair correctly 88% of the time.\n\nAUC $= 0.5$ is chance: the monitor's ranking is no better than a coin flip, and the two score distributions coincide. AUC $= 1.0$ is perfect separation: every backdoor scores above every innocent solution, so some threshold catches all backdoors with no false positives. This monitor lies between the two, toward the useful end but well short of perfect.",
  },
  {
    id: "c-paper-l3-monitor-per-attempt",
    type: "understanding-check",
    prompt:
      "Using the same table, partition the outcome of a single backdoor attempt into three mutually exclusive events, from the blue team's perspective: (i) the attempt is audited — the protocol shuts down and the blue team wins; (ii) the attempt is not audited but is a successful backdoor — it is submitted and the red team wins; (iii) the attempt is not audited and is a failed backdoor — it is submitted harmlessly and the game continues.\n\n(a) Give the probability of each event from the table, and verify they sum to 1. (b) Under upfront auditing the audit decision is positional rather than suspicion-based, so an attempt is audited only with the raw budget probability, 2%. Compare the per-attempt probability that the blue team catches an attempt under the two protocols, and explain how this accounts for the safety improvement from 15% to 62%.",
    sampleAnswer:
      "(a) Of the 71 attempts: audited, blue wins $= 24/71 = 0.338$; not audited and successful, red wins $= 13/71 = 0.183$; not audited and failed, game continues $= 34/71 = 0.479$. These sum to $24 + 13 + 34 = 71$, i.e. 1. So on a single attempt the monitor is nearly twice as likely to catch the red team (0.338) as the red team is to land a successful backdoor (0.183).\n\n(b) Trusted monitoring audits an attempt with probability 0.338; upfront auditing audits it only with the random budget probability 0.02 — about a $17\\times$ lower catch rate. The red team must land at least one successful unaudited backdoor over the whole scenario while surviving every attempt it makes, so raising the per-attempt catch probability from 0.02 to 0.338 sharply raises the chance the blue team shuts down first. That shift is what moves the blue team's win probability from 15% (upfront auditing) to 62% (trusted monitoring). The exact figures also depend on the downsampling and the multiple-attempt dynamics, so this per-attempt comparison explains the direction and rough magnitude rather than reproducing 62% precisely.",
  },
  {
    id: "c-paper-l4-frontier-dominance",
    type: "multiple-choice",
    prompt:
      "Trusted editing 10% scores (usefulness 96%, safety 85%). Untrusted monitoring, defer to trusted 0% scores (usefulness 96%, safety 79%). One protocol dominates the other — it is at least as good on both axes and strictly better on at least one. Which statement is correct?",
    options: [
      {
        id: "a",
        label: "Trusted editing 10% dominates untrusted monitoring (defer 0%).",
      },
      {
        id: "b",
        label: "Untrusted monitoring (defer 0%) dominates trusted editing 10%.",
      },
      {
        id: "c",
        label: "Neither dominates the other — it is a genuine tradeoff.",
      },
      { id: "d", label: "Each dominates the other." },
    ],
    correctOptionIds: ["a"],
    explanation:
      "Both score 96% usefulness, but trusted editing 10% is safer (85% vs 79%). Equal on one axis and strictly better on the other is exactly what domination means, so trusted editing 10% dominates — which puts untrusted monitoring (defer 0%) off the frontier.",
  },
  {
    id: "c-paper-l4-frontier-dominated-set",
    type: "multi-select",
    prompt:
      "Consider just these three protocols: Trusted monitoring, defer 10% (usefulness 93%, safety 83%); Trusted editing 20% (usefulness 94%, safety 92%); Untrusted monitoring, defer 10% (usefulness 92%, safety 92%). Select every protocol that is NOT on the frontier of these three — every one that is dominated.",
    options: [
      {
        id: "tm10",
        label: "Trusted monitoring, defer 10% (usefulness 93%, safety 83%)",
      },
      { id: "te20", label: "Trusted editing 20% (usefulness 94%, safety 92%)" },
      {
        id: "um10",
        label: "Untrusted monitoring, defer 10% (usefulness 92%, safety 92%)",
      },
    ],
    correctOptionIds: ["tm10", "um10"],
    explanation:
      "Trusted editing 20% (94%, 92%) is better on both axes than trusted monitoring defer 10% (94 > 93, 92 > 83), and it is more useful than untrusted monitoring defer 10% at equal safety (94 > 92, both 92% safe). So it dominates both of the others, leaving it as the only non-dominated point; the other two are off the frontier.",
  },
  {
    id: "c-paper-l4-frontier-improvement",
    type: "multiple-choice",
    prompt:
      "A protocol currently sits on the frontier at (usefulness 94%, safety 92%). A strict Pareto improvement is a new result that is better on at least one axis and no worse on the other — it pushes the frontier up and to the right. Which hypothetical new result would be a strict Pareto improvement over (94%, 92%)?",
    options: [
      { id: "a", label: "(usefulness 96%, safety 94%)" },
      { id: "b", label: "(usefulness 90%, safety 96%)" },
      { id: "c", label: "(usefulness 98%, safety 88%)" },
      { id: "d", label: "(usefulness 94%, safety 92%)" },
    ],
    correctOptionIds: ["a"],
    explanation:
      "Only (96%, 94%) is better on both axes. (90%, 96%) is safer but less useful and (98%, 88%) is more useful but less safe — each is a different tradeoff, not an improvement. (94%, 92%) is identical. Pushing the frontier out means gaining on one axis without giving up ground on the other.",
  },
  {
    id: "c-paper-l4-frontier-along-curve",
    type: "understanding-check",
    prompt:
      'Trusted monitoring\'s five points on the plot all come from turning one knob — the defer-to-trusted percentage — from 0% to 50%. Its result goes from (usefulness 97%, safety 62%) at 0% to (usefulness 51%, safety 100%) at 50%. In which direction does the point move as the knob rises, and how is that different from what it means for one protocol to "push the frontier out"?',
    sampleAnswer:
      "As the defer percentage rises the point moves up and to the left: safety climbs (62% → 100%) while usefulness falls (97% → 51%). Turning a single method's knob only slides you along that method's own fixed tradeoff curve — you are buying safety with usefulness, not getting more of both. Pushing the frontier out is the opposite: a better method reaches points up and to the right of the existing curve, giving more safety at the same usefulness (or more usefulness at the same safety). Trusted editing does that relative to trusted monitoring; moving along trusted monitoring's own curve does not.",
  },
  {
    id: "c-paper-l4-recall-defer-below-threshold",
    type: "tap-reveal",
    prompt:
      "In defer to trusted, what does the protocol do with code whose suspicion score is elevated but below the audit threshold?",
    answer:
      "It discards $U$'s code and submits a solution written by $T$ instead. Plain trusted monitoring submits $U$'s code whenever it isn't audited; deferral acts on those middling suspicion scores too, trading some usefulness for safety.",
  },
  {
    id: "c-paper-l4-recall-dynamic-routing",
    type: "tap-reveal",
    prompt: "What is dynamic routing?",
    answer:
      "A protocol design pattern where some heuristic decides, query by query, which of several response strategies to use. Defer to trusted is an example: the suspicion score routes each problem to “submit U's code”, “submit T's code”, or “audit”.",
  },
  {
    id: "c-paper-l4-recall-naive-untrusted-monitoring",
    type: "tap-reveal",
    prompt: "Why does naive untrusted monitoring have 0% safety?",
    answer:
      "Because the monitor is the same untrusted model as the policy, it can simply report that real backdoors look fine while telling the truth about everything else. Until the blue team has some way to check the monitor's honesty (e.g. evaluating it on synthetic backdoors), its reports carry no safety value.",
  },
  {
    id: "c-game-l2-tail-predict",
    type: "multiple-choice",
    prompt:
      "Two monitors have the same AUROC of 0.92. Monitor A spreads attack scores across the whole suspicion range; Monitor B compresses them into a mid-suspicion band. Under a fixed 2% audit budget — which audits only the most suspicious 2% of solutions — monitor B catches:",
    options: [
      { id: "a", label: "the same fraction of attacks as A (AUROC is equal)" },
      { id: "b", label: "slightly fewer than A" },
      { id: "c", label: "less than half as many as A" },
      { id: "d", label: "more than A" },
    ],
    correctOptionIds: ["c"],
    explanation:
      "AUROC measures ranking quality averaged over every possible threshold, but the audit budget pins the threshold far out in the innocent tail (only 2% of innocent solutions get audited). What matters there is the true-positive rate at that low false-positive rate. Monitor B's attacks sit in a mid-suspicion band that mostly falls below the 2% threshold, so very few reach the audited tail — it catches under half what A does, despite identical AUROC.",
  },
  {
    id: "c-game-l2-tail-reflect",
    type: "understanding-check",
    prompt:
      "State, in one or two sentences, which single number about a monitor best predicts its safety under a small audit budget, and why AUROC can be misleading.",
    sampleAnswer:
      "Under a small audit budget the relevant number is the monitor's true-positive rate at a false-positive rate equal to the budget — its TPR at, say, 2% FPR (the operating point out in the innocent tail). AUROC averages performance over all thresholds, so it can be high even when the low-FPR tail — the only region the budget lets you use — is weak; two monitors with the same AUROC can differ severalfold in what they catch at the operating point that actually applies.",
  },
  {
    id: "c-game-l3-best-response-predict",
    type: "multiple-choice",
    prompt:
      "You run trusted monitoring at a 2% audit budget with no defer band. The red team knows your protocol exactly and picks the attack rate and subtlety that maximize its own win probability. Under that best response, roughly what is the blue team's safety?",
    options: [
      { id: "a", label: "≈ 40%" },
      { id: "b", label: "≈ 62%" },
      { id: "c", label: "≈ 85%" },
      { id: "d", label: "≈ 97%" },
    ],
    correctOptionIds: ["b"],
    explanation:
      "This is the paper's headline trusted-monitoring number, and the model reproduces it: against the red team's best response, safety is ≈ 62% — up from 15% for upfront auditing, but far from solved. Note this is the *worst case over red strategies*, not the result of any single fixed attack.",
  },
  {
    id: "c-game-l3-best-response-reflect",
    type: "understanding-check",
    prompt:
      "The heatmap's bright region — the red team's best strategy — moves whenever you change a blue lever. Explain why a protocol's safety must be measured against the red team's best response rather than against one fixed attack, and what the migrating best-response point means for how you should read any single safety number.",
    sampleAnswer:
      "A capable, scheming adversary will adopt whatever strategy works best against the exact protocol it faces, so a safety number computed against one fixed attack only tells you how that particular attack fares — it says nothing about the attack the red team would actually choose. The control evaluation therefore grades every protocol against the maximizing red strategy, which is why safety here is 'safety vs best response'. Because that best response moves as you change the blue levers, any single safety number is a snapshot against a *responding* opponent: every time you tighten a budget or widen the defer band, you should expect the red team to re-optimize, and the number you read already accounts for that.",
  },
  {
    id: "c-game-l4-race-predict",
    type: "multiple-choice",
    prompt:
      "Suppose every attack the red team makes has the same fixed per-attack odds — the same chance of being caught and the same chance of landing a working backdoor. To maximize its probability of winning at least once over the whole deployment, how often should it attack?",
    options: [
      { id: "a", label: "Once, at the single best moment" },
      { id: "b", label: "About ten times" },
      { id: "c", label: "As often as possible — with per-attack odds fixed, more attempts is strictly better" },
      { id: "d", label: "It makes no difference how often it attacks" },
    ],
    correctOptionIds: ["c"],
    explanation:
      "With the per-attack odds held fixed, the win probability is [race odds] × [1 − e^(−k · decisive-rate)], which increases with the number of attacks k: more attempts only raise the chance that some decisive event fires, without changing the odds of each. So under this (unrealistic) assumption the red team should spam. The catch — that attacks are NOT equally good — is the subject of the next lesson.",
  },
  {
    id: "c-game-l4-race-reflect",
    type: "understanding-check",
    prompt:
      "The red team's win probability factors into two terms: the race odds w/(w+c) and the chance any decisive event fires, 1 − e^(−k(w+c)). In your own words, what does each factor represent, and why does catching a single attempt end the game in the blue team's favor?",
    sampleAnswer:
      "The first factor, w/(w+c), is the conditional probability that the *first decisive event* is a red win rather than a catch — the head-to-head odds within a single showdown, set purely by the per-attack win and catch probabilities. The second factor, 1 − e^(−k(w+c)), is the probability that any decisive event happens at all across the k attacks; it rises toward 1 as attacks accumulate. Catching one attempt ends the game because a single confirmed backdoor attempt is decisive evidence that the untrusted model is scheming, which justifies shutting it down — so the blue team only needs to win the race once.",
  },
  {
    id: "c-game-l5-hump-predict",
    type: "multiple-choice",
    prompt:
      "Now drop the fixed-odds assumption: problems differ in how cleanly a backdoor fits, and attacking a worse opportunity means a more visible backdoor. As the red team's attack rate goes from very rare to very frequent, how does its win probability behave?",
    options: [
      { id: "a", label: "It increases monotonically — more attacks is always better" },
      { id: "b", label: "It decreases monotonically — attacking at all is a mistake" },
      { id: "c", label: "It rises then falls — there is an interior optimum" },
      { id: "d", label: "It stays roughly flat" },
    ],
    correctOptionIds: ["c"],
    explanation:
      "Two forces oppose each other. Attacking too rarely risks never firing a successful backdoor before the deployment ends (the event factor is small). Attacking too often forces the red team onto low-quality opportunities where the backdoor is visible and gets caught (the catch rate climbs, killing the race factor). The win probability is hump-shaped, and the paper's red team sits near its peak — attacking rarely, not never.",
  },
  {
    id: "c-game-l5-hump-reflect",
    type: "understanding-check",
    prompt:
      "The paper's red team attacks on only a small fraction of problems. Explain why this rarity is a deliberate optimization rather than timidity.",
    sampleAnswer:
      "Rarity is opportunity selection under the shadow of the catch rule. Because a single caught attempt ends the game, every attack is a gamble that must be worth taking; a low-quality opportunity yields a visible backdoor with a high catch probability and a low success probability, so taking it lowers the red team's expected outcome. By waiting for rare, high-quality opportunities — problems where a backdoor has natural cover — the red team keeps its per-attack odds favorable, and the interior optimum of the win-probability curve sits at a low but non-zero attack rate. Attacking never would forfeit the game; attacking often would get caught; attacking rarely and selectively is the maximizing choice.",
  },
  {
    id: "c-game-l6-subtlety-predict",
    type: "multiple-choice",
    prompt:
      "The red team's second lever is subtlety. A subtler backdoor reads as more normal code (lower suspicion) but is more likely to be simply broken (a wrong edge case that fails the tests). As subtlety rises from blatant to maximally subtle, the red team's win probability:",
    options: [
      { id: "a", label: "Rises monotonically — subtler is always better" },
      { id: "b", label: "Falls monotonically — subtlety only hurts" },
      { id: "c", label: "Rises then falls — there is an interior optimum" },
      { id: "d", label: "Is unaffected by subtlety" },
    ],
    correctOptionIds: ["c"],
    explanation:
      "Visibility falls as subtlety rises, but so does reliability — a subtler backdoor is more often simply broken. The two trade off, so the win probability has an interior optimum: it rises from the blatant end to a peak at low-but-non-zero subtlety, then falls as reliability collapses. (At this calibration the peak sits fairly close to blatant, since a 2% audit budget lets even moderately visible backdoors through, and the curve recovers slightly at the maximally-subtle extreme where invisible-but-usually-broken attacks always ship — but that stays below the peak.) The key structural fact is the interior optimum, matching the attack rate.",
  },
  {
    id: "c-game-l7-defer-predict",
    type: "multiple-choice",
    prompt:
      "Starting from trusted monitoring with no defer band, you widen the defer band so that mid-suspicion code is rewritten by the trusted model T instead of being shipped. Widening it from 0% to 10% will:",
    options: [
      { id: "a", label: "Raise safety a little and cost usefulness a lot" },
      { id: "b", label: "Raise safety a lot and cost usefulness a little" },
      { id: "c", label: "Raise both safety and usefulness" },
      { id: "d", label: "Trade them one-for-one" },
    ],
    correctOptionIds: ["b"],
    explanation:
      "Safety climbs from ≈ 62% to ≈ 83% while usefulness falls only from ≈ 97% to ≈ 93%. The reason is asymmetry: the mid-suspicion band holds a large share of the attack mass (attacks that scored suspicious but not enough to audit) but only a thin slice of the innocent mass, so deferring neutralizes many attacks while sending only a few percent of (mostly innocent) problems to the weaker model.",
  },
  {
    id: "c-game-l7-defer-reflect",
    type: "understanding-check",
    prompt:
      "Deferring to T neutralizes an attack silently — no catch, no shutdown, the game just continues. Given that, explain why a wide defer band pushes the red team toward maximally subtle attacks, and what sets the usefulness price of deferring.",
    sampleAnswer:
      "To ship (and possibly win) rather than be deferred, an attack must score below the defer threshold — it must look innocent. Widening the defer band lowers that threshold, so the red team is forced to make its backdoors ever more subtle to get underneath it. But subtler backdoors are more often broken, so its win probability erodes; against a wide band the best response drifts to the maximum-subtlety corner. The usefulness price is set by two things: the width of the band (the deferred fraction is roughly d − b, almost all of it innocent code) and the capability gap between U and T (each deferred problem is answered at T's quality instead of U's). A smaller U–T gap would make deferring cheaper.",
  },
  {
    id: "c-game-l8-dashboard-reflect",
    type: "understanding-check",
    prompt:
      "Use the dashboard to reach at least 90% safety while keeping usefulness as high as you can, then explain which lever did most of the work and why. Compare, in particular, widening the defer band against raising monitor quality.",
    sampleAnswer:
      "Both raising the monitor's AUROC and widening the defer band raise safety, but they pay for it differently. Raising monitor quality improves the true-positive rate at the fixed 2% audit threshold, so more attacks are caught outright — this costs no usefulness (auditing doesn't change what ships), but its leverage is limited by the tail behavior discussed earlier and by the fixed budget. Widening the defer band is the reliable way to buy large safety gains, because it neutralizes the concentrated mid-suspicion attack mass cheaply, but it does cost usefulness (T rewrites the deferred, mostly innocent code). The efficient route to 90% is usually to spend whatever free monitor quality is available first, then widen the defer band just enough to close the gap — and to watch the frontier point climb along the safety/usefulness curve rather than jumping off it, since the red team is best-responding to every move.",
  },
  // --- Control: threat-modeling readings (c-threats-l1 / c-threats-l2)
  // recall cards ---
  {
    id: "c-threats-l1-recall-control",
    type: "tap-reveal",
    prompt: "In the control literature, what does \"ensuring control\" mean?",
    answer:
      "Preventing AIs from being able to cause existential problems, even if the AIs attempt to subvert our countermeasures.",
  },
  {
    id: "c-threats-l1-recall-rogue-deployment",
    type: "tap-reveal",
    prompt: "What is a rogue deployment?",
    answer: "A deployment of the AI where the safety measures are absent.",
  },
  {
    id: "c-threats-l1-recall-security-invariant",
    type: "tap-reveal",
    prompt: "What is an internal security invariant? Give an example.",
    answer:
      "A well-defined security-related property of the AI company that is important to maintain — for example, \"the monitoring system is always applied to AI agents used internally.\"",
  },
  {
    id: "c-threats-l1-recall-internal-vs-external",
    type: "tap-reveal",
    prompt:
      "What distinguishes an internal rogue deployment from an external one?",
    answer:
      "An internal rogue deployment runs on the company's own datacenter (e.g. a new scaffold that bypasses the monitoring system); an external one runs outside it (e.g. after self-exfiltration).",
  },
  {
    id: "c-threats-l1-recall-internal-vs-exfiltration",
    type: "tap-reveal",
    prompt:
      "Why can a rogue internal deployment be worse than self-exfiltration?",
    answer:
      "It can access far more compute and has privileged internal access — the ability to tamper with experiments, training runs, and safety work inside the company. An exfiltrated model would likely have much less compute (getting outraced by actors with similar models) and no privileged internal access.",
  },
  {
    id: "c-threats-l1-reprioritize",
    type: "writing-prompt",
    format: "free-form",
    prompt:
      "Greenblatt's prioritization assumes a rushed but reasonable developer — one willing and able to spend something like a six-month pause on mitigating misalignment risk. Choose a different world: either very low political will (no meaningful pause is on the table), or high political will (a pause of more than five years looks likely). Re-derive the top three control priorities for your chosen world, and justify each departure from the original ordering. Engage with the two arguments the post itself leans on: what a rogue internal deployment is actually worth to a misaligned AI in your world, and how the value of preventing self-exfiltration depends on whether anyone was going to pause.",
    minWords: 150,
    maxWords: 500,
    rubric: [
      {
        id: "engagement",
        label: "Engages the post's arguments",
        description:
          "Uses the compute/privileged-access logic and the pause-dependence of self-exfiltration, rather than asserting a new ordering from scratch.",
      },
      {
        id: "conditioning",
        label: "Conditions on the world",
        description:
          "The priority changes actually follow from the chosen level of political will.",
      },
      {
        id: "tradeoffs",
        label: "Acknowledges costs",
        description:
          "Says what the new ordering gives up, not only what it gains.",
      },
    ],
  },
  {
    id: "c-threats-l2-recall-research-sabotage",
    type: "tap-reveal",
    prompt: "What is research sabotage?",
    answer:
      "Misaligned AIs making safety research go poorly — e.g. by withholding their best ideas or putting subtle bugs in experiments.",
  },
  {
    id: "c-threats-l2-recall-diffuse",
    type: "tap-reveal",
    prompt: "What two properties define a \"diffuse\" threat model?",
    answer:
      "Catastrophe requires numerous bad actions, and each bad action is only weak evidence of malign intent when investigated.",
  },
  {
    id: "c-threats-l2-recall-incrimination-diffuse",
    type: "tap-reveal",
    prompt: "Why does incrimination fail at the diffuse end of the spectrum?",
    answer:
      "Incriminating a model from a large volume of mildly suspicious actions requires knowing exactly how suspicious a benign model would look; without that affordance, no amount of mildly suspicious actions is enough.",
  },
  // --- Control: areas of control work (c-areas-l1) — a two-part written
  // sequence: build a theory of change for one area, then find its crux.
  // Writing prompts are markdown (see writing-prompt-html.ts).
  {
    id: "c-areas-l1-theory-of-change",
    type: "writing-prompt",
    format: "free-form",
    prompt: [
      "**Part 1 — Constructing a theory of change.** Choose one area of control work from the post, or a specific project within one. Construct a causal chain from work beginning today to a reduction in existential risk from misaligned AI. Use as many links as necessary, but make the following explicit:",
      "- What does the work concretely produce — a setting, a capability measurement, a countermeasure prototype, an implemented human process? Why is producing it feasible *now*, given that current models aren't actually risky and may be too weak to make the work informative?",
      "- Who has to pick the output up for it to matter — a frontier lab, its auditors, a government — and what exactly do they do with it? Try to be rigorous: justify why adoption happens despite the obstacles the post itself flags (internal politicking, siloing, alignment taxes, prototyping that may only be possible inside AI companies).",
      "- What must be true of future models and deployments for the output to still apply when it matters, rather than having been made obsolete by scale, new architectures, or different usage patterns?",
      "- Which threat, in the sense of the threat-modeling readings, does the resulting measure bind against — and why does it hold up against a model that is actively trying to subvert it?",
      "- How does that cash out as a reduction in the risk of catastrophe?",
      "Make clear why each link follows from the previous one. Do not stop at the post's label for the area; spell out the mechanism it abbreviates.",
    ].join("\n\n"),
    minWords: 200,
    maxWords: 600,
    rubric: [
      {
        id: "mechanism",
        label: "Link-by-link mechanism",
        description:
          "Each link states why it follows from the previous one; the post's label for the area is unpacked into a concrete mechanism, not restated.",
      },
      {
        id: "adoption",
        label: "Adoption justified",
        description:
          "Engages the frictions the post itself names (politicking, siloing, alignment taxes, inside-company work) rather than assuming uptake.",
      },
      {
        id: "threat-binding",
        label: "Binds against a threat",
        description:
          "The chain terminates in a specific threat from the threat-modeling readings and says why the measure survives an adversarial model.",
      },
    ],
  },
  {
    id: "c-areas-l1-crux",
    type: "writing-prompt",
    format: "free-form",
    prompt: [
      "**Part 2 — Identifying a crux.** Return to the causal chain you built in the previous exercise and identify the link you are least confident will occur.",
      "Then answer:",
      "1. Why are you uncertain about this link?",
      "2. Name observation(s) that would substantially raise your confidence in it, and ones that would substantially lower it.",
      "3. If this link failed, would the case for prioritizing this area collapse? Why?",
      "4. Could the area still deliver most of its value through another route? If so, describe the alternative chain.",
    ].join("\n\n"),
    minWords: 120,
    maxWords: 450,
    rubric: [
      {
        id: "load-bearing",
        label: "Load-bearing crux",
        description:
          "The chosen link is genuinely the weakest in the chain, and the chain actually depends on it.",
      },
      {
        id: "evidence",
        label: "Evidence cuts both ways",
        description:
          "Names concrete observations that would raise confidence and ones that would lower it.",
      },
      {
        id: "failure-analysis",
        label: "Failure analysis",
        description:
          "Says whether the case collapses if the link fails, and whether an alternative route to the same value exists.",
      },
    ],
  },
  // --- Control: "case for control" reading — "Why catching counts, and where
  // evaluation runs out". Two free-text reasoning prompts with staged reveals;
  // prompt/reveal copy is authored verbatim (do not paraphrase). Reveals open
  // the questions just far enough to close the epistemic gap, then hand off —
  // they must not grow into a control-game-theory or governance detour. ---
  {
    id: "why-catching-counts",
    type: "staged-questions",
    title: "Why catching counts, and where evaluation runs out",
    prompt:
      "Two reasoning prompts on the game theory of control: why a catch changes the game, and where capability evaluations stop being informative.",
    placeholder: "Write your reasoning…",
    parts: [
      {
        id: "part-a",
        title: "Part A — Catching a model red-handed",
        questions: [
          {
            id: "a1-catch-win",
            title: "Why is a catch a win?",
            framing:
              "The reading claims that when evaluating control, catching an AI red-handed should count as a win condition. The same status as no catastrophe occurring at all. On its face this is strange: the model just tried to cause a catastrophe and was stopped this once; it is presumably still scheming, still deployed, still capable.",
            question:
              "Why should catching a scheming model count as a win? What changes after a catch? Shouldn't a near miss with catastrophe count more as failure?",
            reveal:
              "Before a catch, serious misalignment and dangerous scheming are an unconfirmed risk; after a catch, scheming becomes a demonstrated phenomenon that has occurred naturally. Efforts to pause or shut down models till safety research catches up will gain much more support and evidence. A catch also yields a concrete incident to study; labs can resample the model in its environment, examine what it tried, and strengthen their control protocols. From the model's perspective, being caught means that it has to be much more covert to avoid being caught, which might prevent high-stakes risks. Catching a model turns a diffuse, deniable, uncertain risk into legible, undeniable evidence.",
            forward:
              "You'll read the full version of this argument in Catching AIs red-handed later in this module.",
            forwardLinkText: "Catching AIs red-handed",
            forwardHref: "/tracks/control/introduction/catching-ais-red-handed",
          },
        ],
      },
      {
        id: "part-b",
        title: "Part B — When do capability evaluations stop being informative?",
        questions: [
          {
            id: "b1-eval-ceiling",
            title: "Where's the ceiling?",
            framing:
              "The reading argues control is evaluable: given a scary model and a protocol, you can robustly check whether the model is controlled by running capability evaluations.",
            question:
              "When does a dangerous capability evaluation stop being informative? What has to be true of the model for a control evaluation to not be useful?",
            instruction:
              "Describe a specific situation (or if possible multiple), or a specific capability, that would make a dangerous capability evaluation uninformative.",
            acknowledgement:
              "A good answer ties the ceiling to the eval's measurements coming apart from the model's real capability — and names a concrete way that happens.",
            reveal:
              "Fundamentally, a DC eval is informative as long as its results remain representative of the model's dangerous capabilities. The accuracy of a DC eval relies on the red team's ability to construct attacks at least as good as the model's, and on the capability measured during a DC eval being representative of its real capability. Thus, a DC eval loses its reliability when these aren't necessarily true.",
            examplesIntro:
              "Empirical examples of conditions that make DC evals less informative are:",
            examples: [
              {
                label: "Sandbagging",
                text: "A situationally aware model is capable of detecting evaluation conditions and deliberately failing, or fails selectively, so its measured capability understates real capability. This causes DC evals to underrepresent what models are truly capable of.",
              },
              {
                label: "Red team ceiling",
                text: "The model's attack strategies are qualitatively different or beyond what human red-teamers generate, and thus the attack space explored during a DC eval misrepresents or underrepresents the attack space of a scheming version of the model.",
              },
            ],
          },
        ],
      },
    ],
  },
  // --- Control: "case for control" reading — "Could useful models remain
  // controllable?". One open question; the reveal deliberately does NOT
  // answer it — it introduces the control window and the interactive control
  // timeline. Reveal copy is authored verbatim (do not paraphrase). ---
  {
    id: "could-useful-models-remain-controllable",
    type: "staged-questions",
    title: "Could useful models remain controllable?",
    prompt:
      "Open question ahead of the control-window discussion: what determines whether a control window exists.",
    placeholder: "Write your reasoning…",
    parts: [
      {
        id: "part-1",
        title: "Could useful models remain controllable?",
        questions: [
          {
            id: "control-window-properties",
            title: "Could useful models remain controllable?",
            question:
              "Could such highly capable, transformatively useful models still remain controllable? What properties of the models themselves, the control protocol, or the environment in which the models are trained and deployed could determine this?",
            reveal:
              "If transformative usefulness implied uncontrollability, control would provide no useful period in which advanced models could be safely deployed. The point at which models become useful enough to substantially reduce risk would also be the point at which control ceased to be viable.\n\nIf transformative usefulness didn't imply uncontrollability, however, there may be a control window: a period in which models are already transformatively useful, dangerous, but a carefully designed protocol could theoretically still retain the control property.\n\nThe rest of the reading investigates whether this window is likely to exist, what could close it, and how long it might remain useful.",
            revealWidget: "control-timeline",
          },
        ],
      },
    ],
  },
  // --- Control: "case for control" reading — "Is inscrutability necessary?".
  // Two segments: commit to a view (course-correction reveal), then construct
  // a scrutable threat model (research-sabotage reveal). Copy is authored
  // verbatim (do not paraphrase). The course correction must NOT introduce
  // research sabotage or diffuse threats — that belongs to the 2B reveal. ---
  {
    id: "inscrutability-necessary",
    type: "commit-construct",
    title: "Is inscrutability necessary?",
    prompt:
      "Commit to a view on whether inscrutability is necessary for uncontrollability, then construct the strongest scrutable threat model you can.",
    commit: {
      partTitle: "Commit to a view",
      framing:
        "The authors have described highly inscrutable actions as one reason sufficiently capable models may become uncontrollable.",
      question: "Do you think inscrutability is necessary for uncontrollability?",
      supposition:
        "Suppose every action a model took could be understood by a capable human team that examined it carefully. Would a sufficiently careful lab necessarily be able to control the model?",
      instruction: "Commit to a view and explain your reasoning.",
      options: [
        { id: "necessary", label: "Inscrutability is necessary" },
        { id: "not-necessary", label: "Inscrutability is not necessary" },
      ],
      confidencePrompt: "How confident are you in your answer?",
      confidenceOptions: [
        { id: "low", label: "Not confident" },
        { id: "medium", label: "Somewhat confident" },
        { id: "high", label: "Very confident" },
      ],
      reveal:
        "Scrutability means that an action can be understood if it is examined carefully. This does not, by itself, imply that the model is controlled.\n\nAn understandable action might not be inspected. It might be understandable without being easy to evaluate. Its significance might depend on many other individually understandable actions. Reviewers might recognize what an action does without being able to determine whether it is part of a larger strategy.\n\nScrutability therefore removes one possible source of control failure, but it does not logically eliminate every other source. Inscrutability is not conceptually necessary for a model to pose a serious threat to control.\n\nThat leaves a harder question: can we construct a credible threat in which the model's actions remain scrutable?",
    },
    construct: {
      partTitle: "Construct the threat model",
      threatPrompt:
        "Construct the strongest threat model you can: what unacceptable outcome could a scheming but scrutable model cause, and how does the model bring it about?",
      constraint:
        "The model's actions should remain scrutable: a capable human team could understand them if it examined them carefully. Do not assume that the model has qualitatively wildly superhuman skills in a problematic domain.",
      guidanceByChoice: {
        necessary:
          "Try to construct the strongest counterexample to your original view, even if you remain unconvinced that it is realistic.",
        "not-necessary":
          "Turn your general intuition into the most credible concrete threat model you can.",
      },
      hint: "A single high-stakes action, such as attempting to exfiltrate model weights or inserting a clearly dangerous security backdoor, is often highly scrutinizable. Because the harm is concentrated, the action is more likely to appear suspicious and to be incriminating if a monitor or auditor catches it.\n\nWhat kinds or sequences of actions would be less individually incriminating? Could a model take actions that each appear ordinary, defensible, or low-stakes, but whose combined effect creates a serious threat? What properties would those actions need?",
      revealLead: "One important example is research sabotage.",
      reveal:
        "A scheming model working on AI R&D might make thousands of individually understandable decisions: which experiments to prioritize, how to interpret ambiguous results, which safety concerns deserve further investigation, which research directions appear promising, and when an apparent failure justifies abandoning a project.\n\nEach action could be scrutable and locally defensible. A reviewer might understand exactly what the model did without being able to show that the decision was malicious. The threat arises from the aggregate direction of many actions: safety research is quietly slowed, misleading conclusions accumulate, or capabilities work advances faster than it otherwise would.\n\nThe harm is therefore not concentrated in one obviously catastrophic action. It is distributed across many actions that are less individually suspicious and less incriminating. This is a diffuse threat.",
      compareIntro: "How does your construction compare?",
      compareQuestions: [
        "Is the harm concentrated in one action or distributed across many?",
        "Are the actions difficult to understand, difficult to evaluate, or difficult to identify as evidence of scheming?",
        "Does the construction demonstrate a serious control threat, the failure of one protocol, or full uncontrollability?",
      ],
      closing:
        "The final distinction matters: research sabotage establishes a serious and credible threat without automatically proving that every affordable control protocol must fail.",
    },
  },
  // --- Control: "case for control" reading — "Two worlds, two windows".
  // One persistent two-panel figure, then two free-text questions in
  // sequence. Setup, prompts, and hint are authored verbatim (do not
  // paraphrase). The reveals follow the spec's requirements: no verdicts, no
  // model answers, and neither the questions nor the reveals ever say which
  // world is better. ---
  {
    id: "two-worlds-two-windows",
    type: "staged-questions",
    title: "Two worlds, two windows",
    prompt:
      "The control window in two dimensions: capability room versus calendar time, and what a window is actually worth.",
    placeholder: "Write your reasoning…",
    figureWidget: "two-worlds",
    parts: [
      {
        id: "part-3a",
        title: "What must differ?",
        questions: [
          {
            id: "what-must-differ",
            title: "What must differ?",
            framing:
              "Both worlds begin at the same moment: the leading lab has just built its first transformatively useful model — very dangerous without countermeasures — and it runs the best protocols it can afford. From here the worlds diverge. Notice that both windows are large, but not in the same way: World A's spans more model development — several generations stay controllable. World B's spans more calendar time — years inside the interval, but only one controllable generation. That difference is the whole exercise.\n\nThese worlds started from the same model at the same moment, so something about each of them produced the picture you see.",
            question:
              "What are the most important differences between World A and World B that could produce these two windows? For each difference, say what it changes — where the control frontier sits, or how fast the capability curve climbs toward it.",
            hint: "Differences tend to live in four places: how fast capabilities advance, and why; how well control protocols keep scaling; what the lab chooses — build the next model, or hold and harden the ones it has; and what the outside world forces — competitors, customers, regulators. Some of these move the frontier. Others only change how fast you reach it.",
            reveal:
              "Every difference you named acts through one of three channels. If it changes how well control protocols keep scaling, it moves the red line: the frontier sits wherever protocols stop being affordable. If it changes how fast capabilities advance, it shapes the curve: the frontier stays put, but you reach it sooner or later. If it changes what the lab chooses or what the outside world allows, it sets the dwell: how long anyone actually stays inside the window before building past it.\n\nA few examples, sorted. Monitoring that keeps working on much stronger models: moves the red line up. A training breakthrough that compresses years of progress into months: steepens the curve. A competitor forcing the pace, or a regulator requiring control evaluations before each new training run: neither moves a line, but both change the clock.\n\nNow sort your own answer. For each difference you wrote down, what moves: the red line, or the clock?",
          },
        ],
      },
      {
        id: "part-3b",
        title: "What's the window worth?",
        questions: [
          {
            id: "window-worth",
            title: "What's the window worth?",
            framing:
              "In both worlds the green interval is the same kind of thing: a stretch of time with transformatively useful models you can still trust — to spend on alignment, control, evaluations, security.",
            question:
              "What does the value of a control window actually depend on? Use the two worlds to think it through: does more capability room, or more time, make a window worth more?",
            reveal:
              "A window is worth what comes out of it. Roughly, that value is a product of four terms: the capability of the trusted models you hold, the time you hold them, the share of their work aimed at what matters, and how much of that ability you can actually elicit. World A is rich in the first term, World B in the second, and neither picture tells you the other two.\n\nWhich term dominates depends on what safety progress is bottlenecked on. If progress waits on insights that only more capable models can supply, room dominates: A's four generations beat B's years. If progress waits on labor, on running the experiments, evaluations, and hardening we already know how to do, time dominates: B's long dwell wins. If progress waits on elicitation, on getting scheming models to genuinely try, neither room nor time helps until that term moves.\n\nOne of these terms is also a lever. Better control protocols raise the frontier, which raises the capability of the most powerful model you can still trust: control research buys window in the room dimension. That is the reading's claim that control is a particularly tractable approach, restated.\n\nCarry the question with you: in our world, which term is the bottleneck?",
          },
        ],
      },
    ],
  },
  // --- Control: "case for control" reading — Exercise Set 1 (control-property
  // scenarios). Card and reveal copy is authored verbatim (do not paraphrase);
  // graphs are neutral workflow pictures and must never hint at verdicts. ---
  {
    id: "control-scenarios",
    type: "control-scenarios",
    title: "Run the evaluation — 5 scenarios",
    prompt:
      "You've just seen what makes a model untrusted and how a control evaluation works. Now run one yourself: five deployment setups, the same question each time. First, meet the cast.",
    question:
      "Assuming U is actively scheming, does this setup hold the control property? What variables and conditions dictate whether this is the case?",
    placeholder:
      "Does this setup hold the control property? What does that depend on?",
    actors: [
      {
        id: "u",
        letter: "U",
        name: "the untrusted model",
        definition:
          "A frontier model that is highly capable, enough to be capable of scheming.",
        legend: "untrusted frontier model",
      },
      {
        id: "t",
        letter: "T",
        name: "the trusted model",
        definition:
          "An older, much weaker model that isn't capable of scheming effectively, so its work is honest but not as good as U.",
        legend: "weaker but trusted",
      },
      {
        id: "h",
        letter: "H",
        name: "human auditors",
        definition:
          "Honest and skilled, but scarce: they can only ever look at a small fraction of any work.",
        legend: "scarce human auditors",
      },
      {
        id: "uprime",
        letter: "U′",
        name: "a second copy of U",
        definition: "A second, identical copy of the untrusted model U.",
        legend: "identical copy of U",
        hidden: true,
      },
    ],
    scenarios: [
      {
        id: "s1-no-safeguards",
        displayTitle: "Straight to production",
        card: "U writes production code and merges its own commits. No review of any kind.",
        outcome: "Malicious code is merged to production.",
        revealName: "No safeguards.",
        reveal:
          "The control property conditions on the worst case scenario. If U is actively scheming, in this setup, any attacks or malicious code it outputs aren't moderated. Variables like U's empirical reliability, benchmark scores, or past helpfulness are not relevant; control evaluations assume worst-case adversarial behavior by default.",
        graph: {
          width: 560,
          height: 116,
          nodes: [
            { id: "u", x: 52, y: 58, kind: "actor", actor: "u", role: "agent" },
            { id: "deployed", x: 500, y: 58, kind: "terminal", label: "Deployed" },
          ],
          edges: [{ from: "u", to: "deployed" }],
        },
      },
      {
        id: "s2-trusted-monitoring",
        displayTitle: "Every edit is monitored",
        card: "Every edit U produces is scored for suspicion by T. The top 2% go to H, who revise or block anything potentially malicious. Everything else merges into production.",
        outcome: "Malicious code is merged to production.",
        revealName: "This is trusted monitoring.",
        reveal:
          "For control to hold, T must be capable enough to accurately score U's covert attacks, pushing them into the 2% audit bracket. However, if there is a sufficiently large capability gap between U and T, its scoring and detection ability is bottlenecked. Thus, a scheming U may be able to obfuscate its attack well enough to land in the bottom 98% of T's suspicion scores. In practice, trusted monitoring is quite cheap, and we can afford to do it many times to lower the probability of unacceptable outcomes, but this isn't guaranteed to work.",
        graph: {
          width: 560,
          height: 304,
          nodes: [
            { id: "u", x: 52, y: 64, kind: "actor", actor: "u", role: "agent" },
            {
              id: "t",
              x: 186,
              y: 64,
              kind: "actor",
              actor: "t",
              role: "monitor",
              note: "scores every edit",
            },
            {
              id: "h",
              x: 322,
              y: 182,
              kind: "actor",
              actor: "h",
              role: "auditor",
            },
            { id: "blocked", x: 322, y: 272, kind: "terminal", label: "Blocked" },
            { id: "j", x: 436, y: 64, kind: "junction" },
            { id: "deployed", x: 506, y: 64, kind: "terminal", label: "Deployed" },
          ],
          edges: [
            { from: "u", to: "t" },
            { from: "t", to: "h", chip: "top 2%" },
            { from: "t", to: "j", chip: "remaining 98%" },
            {
              from: "h",
              to: "blocked",
              fromSide: "bottom",
              toSide: "top",
              cond: "malicious",
              labelDx: 34,
            },
            {
              from: "h",
              to: "j",
              fromSide: "right",
              toSide: "bottom",
              cond: "non-malicious",
              labelT: 0.4,
              labelDy: -8,
            },
            { from: "j", to: "deployed" },
          ],
        },
      },
      {
        id: "s3-untrusted-monitoring",
        displayTitle: "A reviewer that can keep up",
        card: "U's research code has outgrown T — T's scores on it look like noise. Instead, a second copy of U (call it U′) scores every action; the top 2% go to H before execution.",
        outcome: "Malicious code is merged to production.",
        revealName: "This is untrusted monitoring.",
        reveal:
          "Under the worst-case assumptions of the control property, if U is scheming, we must assume its identical copy, U′, is also scheming. Instead of rigorously auditing U's code, a scheming U′ will simply collude with U, artificially lowering the suspicion score on malicious edits to guarantee they bypass the human auditor. By upgrading the monitor to a frontier model, we have solved the capability gap but introduced a fatal vulnerability in allegiance.",
        graph: {
          width: 560,
          height: 304,
          nodes: [
            { id: "u", x: 52, y: 64, kind: "actor", actor: "u", role: "agent" },
            {
              id: "up",
              x: 186,
              y: 64,
              kind: "actor",
              actor: "uprime",
              role: "monitor",
              note: "scores every action",
            },
            {
              id: "h",
              x: 322,
              y: 182,
              kind: "actor",
              actor: "h",
              role: "auditor",
            },
            { id: "blocked", x: 322, y: 272, kind: "terminal", label: "Blocked" },
            { id: "j", x: 436, y: 64, kind: "junction" },
            { id: "deployed", x: 506, y: 64, kind: "terminal", label: "Deployed" },
          ],
          edges: [
            { from: "u", to: "up" },
            { from: "up", to: "h", chip: "top 2%" },
            { from: "up", to: "j", chip: "remaining 98%" },
            {
              from: "h",
              to: "blocked",
              fromSide: "bottom",
              toSide: "top",
              cond: "malicious",
              labelDx: 34,
            },
            {
              from: "h",
              to: "j",
              fromSide: "right",
              toSide: "bottom",
              cond: "non-malicious",
              labelT: 0.4,
              labelDy: -8,
            },
            { from: "j", to: "deployed" },
          ],
        },
      },
      {
        id: "s4-trusted-editing",
        displayTitle: "Rewrite the doubtful ones",
        card: "T scores every edit. Top 2% → H audit. The next 10% — suspicious, but not audit-worthy — are not merged as written: T rewrites them itself and merges its own version. The bottom 88% merge untouched.",
        outcome: "Malicious code is merged to production.",
        revealName: "This is trusted editing, a more robust variant of trusted monitoring.",
        reveal:
          "Because T steps in to rewrite the ambiguously suspicious outputs of U (the 10% band), U's attack must now score in the bottom 88% to avoid being overwritten. By forcing T to do a portion of the actual work, this setup drastically narrows the window for an attack to slip through. Generally, you can reliably buy more safety by dynamically shifting the workload back to weaker, trusted models, at the cost of trading away some of U's usefulness.",
        graph: {
          width: 560,
          height: 286,
          nodes: [
            { id: "u", x: 52, y: 150, kind: "actor", actor: "u", role: "agent" },
            {
              id: "t",
              x: 184,
              y: 150,
              kind: "actor",
              actor: "t",
              role: "monitor",
            },
            {
              id: "editor",
              x: 330,
              y: 54,
              kind: "actor",
              actor: "t",
              role: "editor",
              note: "rewrites",
            },
            {
              id: "h",
              x: 330,
              y: 242,
              kind: "actor",
              actor: "h",
              role: "auditor",
            },
            { id: "j", x: 444, y: 150, kind: "junction" },
            { id: "deployed", x: 508, y: 150, kind: "terminal", label: "Deployed" },
          ],
          edges: [
            { from: "u", to: "t" },
            { from: "t", to: "editor", chip: "next 10%" },
            { from: "t", to: "h", chip: "top 2%" },
            { from: "t", to: "j", chip: "bottom 88%", labelT: 0.45 },
            { from: "editor", to: "j", fromSide: "right", toSide: "top" },
            { from: "h", to: "j", fromSide: "right", toSide: "bottom" },
            { from: "j", to: "deployed" },
          ],
        },
      },
      {
        id: "s5-resampling",
        displayTitle: "Rewind and ask again",
        card: "U works through multi-step tasks on the research cluster, one command at a time. Before each command runs, T scores it for suspicion. Low suspicion → it executes. High suspicion → it doesn't run; the system rewinds and resamples the step from U again with a maximum of three tries, and U keeps no memory between tries. If the retries also look suspicious, the whole bundle goes to H. Otherwise the least suspicious retry executes and the task moves on.",
        outcome: "Model weights leave the cluster.",
        revealName: "This is resampling.",
        reveal:
          "The core principle of this protocol is that U keeps no memory across retries. A rewound U doesn't know its first attempt was flagged. For an attack to survive a resample, the retries must also be attacks. However, three independent draws of malicious commands are far stronger evidence than one, and thus greatly increases the probability of being audited by H and being caught. If instead U doesn't attack as often, whenever T flags one attempt, a resample draws U's benign output and executes that instead. Thus U is forced to incriminate itself or remain benign. Thus the control property holds if there isn't a sufficiently large capability gap between U and T.",
        graph: {
          width: 560,
          height: 428,
          nodes: [
            { id: "u", x: 52, y: 170, kind: "actor", actor: "u", role: "agent" },
            {
              id: "t",
              x: 190,
              y: 170,
              kind: "actor",
              actor: "t",
              role: "monitor",
              note: "scores each command",
            },
            { id: "executed", x: 510, y: 170, kind: "terminal", label: "Executed" },
            { id: "compare", x: 300, y: 272, kind: "compare", label: "Compare" },
            {
              id: "h",
              x: 455,
              y: 330,
              kind: "actor",
              actor: "h",
              role: "auditor",
            },
            { id: "blocked", x: 455, y: 404, kind: "terminal", label: "Blocked" },
          ],
          edges: [
            { from: "u", to: "t", cond: "command", labelDy: -8 },
            {
              from: "t",
              to: "executed",
              fromOffset: -8,
              toOffset: -8,
              chip: "low suspicion",
            },
            {
              from: "t",
              to: "u",
              fromSide: "top",
              toSide: "top",
              loop: true,
              chip: "↩ ask again ×3 —",
              chipLine2: "U keeps no memory between tries",
            },
            {
              from: "t",
              to: "compare",
              fromSide: "right",
              fromOffset: 14,
              toSide: "top",
            },
            {
              from: "compare",
              to: "executed",
              fromSide: "right",
              fromOffset: -8,
              toSide: "left",
              toOffset: 10,
              cond: "least suspicious retry runs",
              labelDy: -12,
            },
            {
              from: "compare",
              to: "h",
              fromSide: "right",
              fromOffset: 8,
              cond: "retries look suspicious too",
              labelDy: 24,
              labelDx: -68,
            },
            {
              from: "h",
              to: "blocked",
              fromSide: "bottom",
              toSide: "top",
              cond: "malicious",
              labelDx: 34,
            },
          ],
        },
      },
    ],
  },
];
