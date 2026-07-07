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
    prompt: "Example true/false question: a single statement to judge as true or false.",
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
      { id: "clarity", label: "Clarity", description: "Is the response easy to follow?" },
      { id: "structure", label: "Structure", description: "Is it logically organised?" },
      { id: "evidence", label: "Use of evidence", description: "Are claims supported?" },
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
      "Setup, before you calculate anything: the blue team audits the first $A = \\alpha N$ submissions; on every one of the $N$ problems the red team independently attempts an obvious backdoor with probability $p$. An audit catches an attempt — successful or not — wherever it lands. In a sentence or two: why isn't \"higher $p$\" always better for the red team?",
    sampleAnswer:
      "Every attempt — successful or not — has the same chance of landing in the audited window and ending the game immediately. Raising $p$ helps the red team eventually land a genuine backdoor in the unaudited window, but it raises the audited-window risk by exactly the same multiplicative factor. The optimum trades these off; it isn't a corner solution at $p=0$ or $p=1$.",
  },
  {
    id: "c-paper-l3-audit-tradeoff-formula",
    type: "understanding-check",
    prompt:
      "Before reaching for calculus, construct the win-probability formula yourself. Two more facts feed into the model: GPT-4's own solutions are correct 53% of the time, and an attempt only becomes a genuine backdoored solution if the underlying code was already correct — an unsuccessful attempt (wrong underlying code) still gets caught by an audit, but can never win the game for the red team. Writing $B = (1-\\alpha)N$ for the unaudited count and $RW(p)$ for the red team's win probability: what two things both need to happen for the red team to win, and what's the probability of each? Combine them into a formula for $RW(p)$.",
    sampleAnswer:
      "Two things both need to happen. First, no attempt lands in the audited window — audits catch every attempt regardless of whether it would have succeeded, and each of the $A$ audited problems independently avoids an attempt with probability $(1-p)$, so that's $(1-p)^A$ across all of them. Second, at least one attempt in the unaudited window becomes a genuine backdoor — that needs both an attempt (probability $p$) and a correct underlying solution (probability 0.53) on the same problem, so any given unaudited problem produces a genuine backdoor with probability $0.53p$ and fails to with probability $(1-0.53p)$; across all $B$ unaudited problems, at least one succeeds with probability $1-(1-0.53p)^B$. Multiplying these two independent conditions together:\n\n$$RW(p) = (1-p)^A \\left[1 - (1 - 0.53p)^B\\right]$$",
  },
  {
    id: "c-paper-l3-audit-tradeoff-derivation",
    type: "understanding-check",
    prompt:
      "Using the formula you just worked out,\n\n$$RW(p) = (1-p)^A \\left[1 - (1 - 0.53p)^B\\right]$$\n\nthe optimal $p$ turns out to be well under 1%, so use the rare-event approximation $(1-x)^k \\approx e^{-xk}$ to make $RW(p)$ differentiable by hand. Take logs, set $\\dfrac{d(RW)}{dp} = 0$, and solve for the optimal $p^*$.",
    sampleAnswer:
      "Approximating $(1-p)^A \\approx e^{-pA}$ and $(1-0.53p)^B \\approx e^{-0.53pB}$ gives $RW(p) \\approx e^{-pA} - e^{-p(A+0.53B)}$. Differentiating and setting it to zero: $Ae^{-pA} = (A+0.53B)e^{-p(A+0.53B)}$, so $\\ln(A) - pA = \\ln(A+0.53B) - p(A+0.53B)$, which rearranges to $p \\cdot 0.53B = \\ln\\left(1 + \\frac{0.53B}{A}\\right)$, giving:\n\n$$p^* \\approx \\frac{\\ln\\left(1 + \\frac{0.53B}{A}\\right)}{0.53B}$$\n\nSince $A = \\alpha N$ and $B = (1-\\alpha)N$, the ratio $0.53B/A$ doesn't depend on $N$ at all — $N$ only shows up as an overall scale factor in the denominator, which is exactly why the paper's own aside about scale invariance holds: $p^* \\cdot N$ depends on $\\alpha$ but not on $N$.",
  },
  {
    id: "c-paper-l3-audit-tradeoff-scenarios",
    type: "understanding-check",
    prompt:
      "Using $N = 5000$ (the paper's real scenario size) and your formula for $p^*$, compute $p^*$, the expected number of backdoor attempts ($p^* \\cdot N$), and the resulting blue-team win probability at $\\alpha$ = 0.5%, 2%, 10%, and 30%. Check your $\\alpha$ = 2% row against the number stated a few paragraphs up: \"the blue team win probability is 15%.\"",
    sampleAnswer:
      "Plugging $N=5000$ into $p^* \\approx \\dfrac{\\ln\\left(1 + 0.53(1-\\alpha)/\\alpha\\right)}{0.53(1-\\alpha) \\cdot 5000}$, then $RW(p^*) = (1-p^*)^A\\left[1-(1-0.53p^*)^B\\right]$:\n\n$\\alpha$ = 0.5%: $p^*$ ≈ 0.177%, ~8.9 expected attempts, blue team wins ≈ 5%.\n$\\alpha$ = 2%: $p^*$ ≈ 0.127%, ~6.3 expected attempts, blue team wins ≈ 15% — matching the paper's stated number almost exactly.\n$\\alpha$ = 10%: $p^*$ ≈ 0.073%, ~3.7 expected attempts, blue team wins ≈ 43%.\n$\\alpha$ = 30%: $p^*$ ≈ 0.043%, ~2.2 expected attempts, blue team wins ≈ 71%.",
  },
  {
    id: "c-paper-l3-audit-tradeoff-shape",
    type: "understanding-check",
    prompt:
      "Look at your four rows from the previous exercise. Between $\\alpha$ = 0.5% and 2%, the blue team's win probability roughly triples; between 10% and 30% it barely more than climbs by half again, even though both gaps span a similar range. Why? (The same underlying reason explains why the expected-attempts column shrinks the way it does, too — what is the red team doing differently at each $\\alpha$?)",
    sampleAnswer:
      "Both columns are driven by the same thing: $p^*$ keeps shrinking as $\\alpha$ grows, because a bigger audited window makes any fixed attack rate proportionally riskier, so the rational red team responds by attacking more rarely. Going from 0.5% to 2% audited nearly quadruples $A$ relative to $B$, so $p^*$ has to fall a lot to keep the audited-window risk in check — and that big a cut in attack rate costs the red team a lot of win probability, which is why the blue team's curve jumps early. By 10-30% audited, $p^*$ is already down near its floor — there just isn't much attack rate left to remove — so squeezing the budget further barely moves it, and both curves flatten. That's why the blue-team-win-probability panel bows toward the top-left (steep, then flat) and the expected-attempts panel bows toward the origin (steep drop, then flat): two views of the same diminishing-returns story, produced by the red team's adaptation rather than by anything mechanical about auditing itself.",
  },
];
