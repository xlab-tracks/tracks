import { describe, expect, it } from "vitest";
import { classifyLength, countWords, modelFor } from "./classify";
import { parseGraderReport, parseVerdict } from "./parse";
import { systemPrompt, userPrompt } from "./prompts";
import { assembleArgueReveal, assembleWriting } from "./sample";
import { feedbackToHtml } from "./feedback-html";

describe("classifyLength", () => {
  it("classifies by word count with the documented boundaries", () => {
    expect(classifyLength("one two three")).toBe("short");
    expect(classifyLength(Array(99).fill("w").join(" "))).toBe("short");
    expect(classifyLength(Array(100).fill("w").join(" "))).toBe("medium");
    expect(classifyLength(Array(400).fill("w").join(" "))).toBe("medium");
    expect(classifyLength(Array(401).fill("w").join(" "))).toBe("long");
  });

  it("counts words across whitespace runs and trims", () => {
    expect(countWords("  a\n b\t\tc  ")).toBe(3);
    expect(countWords("")).toBe(0);
  });

  it("resolves a model for every class", () => {
    for (const cls of ["short", "medium", "long"] as const) {
      expect(modelFor(cls)).toBeTruthy();
    }
  });

  it("routes user-key grading to the paid default, env-overridable", () => {
    for (const cls of ["short", "medium", "long"] as const) {
      expect(modelFor(cls, "user")).toBe("moonshotai/kimi-k3");
      expect(modelFor(cls, "server")).toBe(modelFor(cls));
    }
    process.env.OPENROUTER_MODEL_USER = "override/model";
    try {
      expect(modelFor("long", "user")).toBe("override/model");
      // The user override never leaks into server-key grading.
      expect(modelFor("long", "server")).not.toBe("override/model");
    } finally {
      delete process.env.OPENROUTER_MODEL_USER;
    }
  });
});

describe("systemPrompt", () => {
  it("materializes each class fully, with no override sections", () => {
    // All three share the verbatim rubric core; none carries addendum-style
    // overrides (the model may keep following overridden base instructions).
    for (const cls of ["short", "medium", "long"] as const) {
      expect(systemPrompt(cls)).not.toContain("ADAPTATION");
      expect(systemPrompt(cls)).not.toMatch(/override/i);
      expect(systemPrompt(cls)).toContain("C4. IDENTIFICATION OF KIND OF SUPPORT");
      expect(systemPrompt(cls)).toContain("## Verdict");
    }
  });

  it("states exactly one fix-count instruction per class", () => {
    expect(systemPrompt("long")).toContain("## Top 3 highest-leverage fixes");
    expect(systemPrompt("medium")).toContain("## Top 2 highest-leverage fixes");
    expect(systemPrompt("short")).toContain("## Top fix");
    expect(systemPrompt("medium")).not.toContain("Top 3");
    expect(systemPrompt("short")).not.toContain("Top 3");
    expect(systemPrompt("short")).not.toContain("Top 2");
  });

  it("adapts C1 in place per class", () => {
    expect(systemPrompt("long")).toContain("Does the piece open with a summary");
    expect(systemPrompt("medium")).toContain("legible thesis");
    expect(systemPrompt("short")).toContain("N/A at this length");
    expect(systemPrompt("short")).not.toContain("Does the piece open with a summary");
  });

  it("orders the output contract: analysis block, then fixes, then verdict", () => {
    for (const cls of ["short", "medium", "long"] as const) {
      const prompt = systemPrompt(cls);
      const open = prompt.indexOf("<analysis>");
      const close = prompt.indexOf("</analysis>");
      const fixes = prompt.indexOf("## Top");
      const verdict = prompt.indexOf("## Verdict");
      expect(open).toBeGreaterThan(-1);
      expect(close).toBeGreaterThan(open);
      expect(fixes).toBeGreaterThan(close);
      expect(verdict).toBeGreaterThan(fixes);
      // The parse markers the machine side depends on.
      for (const marker of ["### C1", "Score:", "Evidence:", "Rationale:"]) {
        expect(prompt).toContain(marker);
      }
    }
  });

  it("fills the user template slots", () => {
    const prompt = userPrompt("SAMPLE TEXT", {
      documentType: "memo",
      stakes: "test",
      audience: "testers",
    });
    expect(prompt).toContain("Document type: memo");
    expect(prompt).toContain("<<<\nSAMPLE TEXT\n>>>");
  });
});

describe("parseVerdict", () => {
  it("reads the verdict section", () => {
    const md = "## Verdict\n31/45 — Strong. Reader can update.\n\n## Scores\n…";
    expect(parseVerdict(md)).toEqual({ score: 31, band: "Strong" });
  });

  it("handles rescaled fractional totals and missing bands", () => {
    expect(parseVerdict("## Verdict\n22.5/45")?.score).toBe(22.5);
    expect(parseVerdict("total: 40/45 overall")?.score).toBe(40);
  });

  it("rejects out-of-range and absent verdicts", () => {
    expect(parseVerdict("## Verdict\n99/45 — impossible")).toBeNull();
    expect(parseVerdict("no score anywhere")).toBeNull();
  });

  it("prefers the verdict at the end over earlier /45 mentions (verdict-last layout)", () => {
    const md = `<analysis>
### C2
Score: 1
Rationale: Rescale to /45 per the rule.
</analysis>

## Top fix
This change would take you from 9/45 to 18/45.

**Verdict**
27/45 — Standard.`;
    // Drifted bold heading + earlier "9/45" in fix text must not win.
    expect(parseVerdict(md)).toEqual({ score: 27, band: "Standard" });
    // No heading at all: take the LAST match, not the first.
    expect(
      parseVerdict("gains 9/45 here\nmore text\ntotal: 30/45 overall")?.score,
    ).toBe(30);
  });
});

describe("parseGraderReport", () => {
  const REPORT = `<analysis>
### C1
Score: N/A
Evidence: none found
Rationale: Excluded by the N/A rule at this length.

### C2
Score: 2
Evidence: "incentives drive this" | "the main reason is"
Rationale: States the load-bearing consideration early.
It even ranks the two arguments.

### C3
Score: 1
Evidence: "may perhaps"
Rationale: Decorative hedges only.
</analysis>

## Top fix
Name the assumption behind "incentives drive this".

## Verdict
18/45 — Standard. Two sentences here.`;

  it("parses criteria, N/A, multi-line rationales, and strips the block", () => {
    const report = parseGraderReport(REPORT);
    expect(report.criteria.map((c) => c.id)).toEqual(["C1", "C2", "C3"]);
    expect(report.criteria[0].score).toBeNull();
    expect(report.criteria[0].evidence).toBeNull(); // "none found"
    expect(report.criteria[1].score).toBe(2);
    expect(report.criteria[1].evidence).toContain("incentives");
    expect(report.criteria[1].rationale).toContain("ranks the two arguments");
    expect(report.visibleMarkdown).not.toContain("<analysis>");
    expect(report.visibleMarkdown).not.toContain("Decorative hedges");
    expect(report.visibleMarkdown).toContain("## Top fix");
    expect(report.visibleMarkdown).toContain("## Verdict");
    // The verdict still parses from the stripped-or-full report.
    expect(parseVerdict(REPORT)?.score).toBe(18);
    expect(parseVerdict(report.visibleMarkdown)?.score).toBe(18);
  });

  it("falls back to the whole report when there is no analysis block", () => {
    const old = "## Verdict\n31/45 — Strong.\n\n## Scores\n…";
    const report = parseGraderReport(old);
    expect(report.criteria).toEqual([]);
    expect(report.visibleMarkdown).toBe(old);
  });

  it("tolerates bolded labels, 'Not applicable', and heading-depth drift", () => {
    const md = `<analysis>
## C2
**Score:** 2
**Evidence:** "quoted"
**Rationale:** Bolded labels are common drift.

### C5
Score: **Not applicable**
Rationale: Defaulted by the rule.
</analysis>
## Verdict
20/45 — Standard.`;
    const report = parseGraderReport(md);
    expect(report.criteria).toHaveLength(2);
    expect(report.criteria[0]).toMatchObject({ id: "C2", score: 2 });
    expect(report.criteria[1]).toMatchObject({ id: "C5", score: null });
    expect(report.visibleMarkdown).not.toContain("Bolded labels");
  });

  it("strips duplicate analysis blocks and closes an unclosed one at the next section", () => {
    const dup = `<analysis>
### C2
Score: 2
Rationale: First block.
</analysis>
<analysis>
### C3
Score: 1
Rationale: Second block.
</analysis>
## Verdict
15/45 — Persuasive.`;
    const dupReport = parseGraderReport(dup);
    expect(dupReport.criteria.map((c) => c.id)).toEqual(["C2", "C3"]);
    expect(dupReport.visibleMarkdown).not.toContain("Second block");

    const unclosed = `<analysis>
### C2
Score: 2
Rationale: Model forgot the closing tag.
## Top fix
Do the thing.
## Verdict
21/45 — Standard.`;
    const uncReport = parseGraderReport(unclosed);
    expect(uncReport.criteria).toHaveLength(1);
    expect(uncReport.visibleMarkdown).not.toContain("forgot the closing tag");
    expect(uncReport.visibleMarkdown).toContain("## Top fix");
    expect(parseVerdict(unclosed)?.score).toBe(21);
  });

  it("fails open: an analysis tag with nothing parseable keeps the full report", () => {
    const md = `<analysis>
totally freeform prose the parser cannot use
</analysis>
## Verdict
12/45 — Persuasive.`;
    const report = parseGraderReport(md);
    expect(report.criteria).toEqual([]);
    expect(report.visibleMarkdown).toBe(md);
  });

  it("skips malformed blocks and deduplicates ids", () => {
    const md = `<analysis>
### C2
Score: 2
Rationale: First.

### C2
Score: 0
Rationale: Duplicate — ignored.

### C9
Score: 3
Rationale: Unknown id — ignored.

### C4
Score: maybe
Rationale: Unparseable score — ignored.
</analysis>
## Verdict
6/45 — Persuasive.`;
    const report = parseGraderReport(md);
    expect(report.criteria).toHaveLength(1);
    expect(report.criteria[0]).toMatchObject({ id: "C2", score: 2 });
  });
});

describe("assembleWriting", () => {
  it("assembles a single-section writing exercise without labels", () => {
    // c-threats-l1-reprioritize is a writing-prompt exercise in the graph.
    const result = assembleWriting("c-threats-l1-reprioritize", "exercise", {
      response: "My answer.",
    });
    expect(result?.sample).toBe("My answer.");
    expect(result?.context.documentType).toContain("writing exercise");
  });

  it("returns null for empty values or unknown content", () => {
    expect(
      assembleWriting("c-threats-l1-reprioritize", "exercise", {}),
    ).toBeNull();
    expect(assembleWriting("nope", "exercise", { response: "x" })).toBeNull();
  });

  it("labels assessment sections", () => {
    const result = assembleWriting("ex-assessment", "assessment", {});
    // Whatever the example assessment's ids are, empty values → null.
    expect(result).toBeNull();
  });
});

describe("assembleArgueReveal", () => {
  it("includes responses with their critiques as context, plus construction", () => {
    const result = assembleArgueReveal("contra-control-argue-reveal", {
      items: {
        "moral-hazard": {
          rounds: [
            { chips: [], response: "Because incentives.", toolboxOpened: false },
          ],
          rating: "fully",
          note: "",
        },
      },
      construction: {
        attackSurface: "catch-legibility",
        argument: "My argument.",
        bestResponse: "Best response.",
        residual: "Residual.",
      },
    });
    expect(result?.sample).toContain("Because incentives.");
    expect(result?.sample).toContain("the critic argued");
    expect(result?.sample).toContain("My argument.");
  });

  it("returns null when nothing is written", () => {
    expect(assembleArgueReveal("contra-control-argue-reveal", {})).toBeNull();
  });
});

describe("feedbackToHtml", () => {
  it("renders GFM tables and strips dangerous HTML", () => {
    const html = feedbackToHtml(
      "## Scores\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<script>alert(1)</script>",
    );
    expect(html).toContain("<table>");
    expect(html).not.toContain("<script>");
  });
});
