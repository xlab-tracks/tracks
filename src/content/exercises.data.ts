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
];
