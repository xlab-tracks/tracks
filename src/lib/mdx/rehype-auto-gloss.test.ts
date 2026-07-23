import { describe, it, expect } from "vitest";
import rehypeAutoGloss from "./rehype-auto-gloss.mjs";

// Minimal hast/mdx builders — the plugin only looks at type/tagName/name/
// attributes/children/value, so plain objects stand in for real nodes.
type Node = {
  type: string;
  tagName?: string;
  name?: string;
  properties?: Record<string, unknown>;
  attributes?: { type: string; name: string; value?: unknown }[];
  children?: Node[];
  value?: string;
};

const text = (value: string): Node => ({ type: "text", value });
const el = (tagName: string, ...children: Node[]): Node => ({
  type: "element",
  tagName,
  children,
});
const p = (...children: Node[]) => el("p", ...children);

const REGISTRY = {
  autoGlossExclude: ["c-areas-l1"],
  terms: [
    {
      id: "sandbagging",
      term: "sandbagging",
      aliases: ["sandbag"],
      definition: "x",
      autoGloss: true,
    },
    {
      id: "x-risk",
      term: "x-risk",
      aliases: ["existential risk"],
      definition: "x",
      autoGloss: true,
    },
    {
      id: "trusted-monitoring",
      term: "trusted monitoring",
      definition: "x",
      autoGloss: true,
    },
    // Not opted in: must never auto-wrap.
    { id: "control", term: "control", definition: "x" },
  ],
};

function run(children: Node[], path = "c-test-l1.mdx"): { children: Node[] } {
  const tree = { type: "root", children };
  (rehypeAutoGloss({ registry: REGISTRY }) as (t: unknown, f: unknown) => void)(
    tree,
    { path: `/repo/src/content/lessons/${path}` },
  );
  return tree;
}

const termNodes = (tree: { children: Node[] }): Node[] => {
  const found: Node[] = [];
  const walk = (node: Node) => {
    if (node.type === "mdxJsxTextElement" && node.name === "Term") found.push(node);
    for (const child of node.children ?? []) walk(child);
  };
  for (const child of tree.children) walk(child);
  return found;
};
const termId = (node: Node): unknown => node.attributes?.[0]?.value;

describe("rehypeAutoGloss", () => {
  it("wraps only the first occurrence, preserving surrounding text and case", () => {
    const tree = run([
      p(text("Sandbagging is bad; sandbagging again stays plain.")),
    ]);
    const terms = termNodes(tree);
    expect(terms).toHaveLength(1);
    expect(termId(terms[0])).toBe("sandbagging");
    expect(terms[0].children).toEqual([text("Sandbagging")]);
    // Split text nodes reassemble to the original paragraph.
    const flat = (tree.children[0].children ?? [])
      .map((n) => (n.type === "text" ? n.value : `<${termId(n)}>`))
      .join("");
    expect(flat).toBe("<sandbagging> is bad; sandbagging again stays plain.");
  });

  it("matches aliases, multiword terms across soft line breaks, and hyphen boundaries", () => {
    const tree = run([
      p(text("They sandbag under trusted\nmonitoring; x-risk-focused work, then x-risk.")),
    ]);
    const ids = termNodes(tree).map(termId);
    // "x-risk-focused" must not consume the x-risk entry; the bare "x-risk" does.
    expect(ids).toEqual(["sandbagging", "trusted-monitoring", "x-risk"]);
  });

  it("never wraps inside headings, code, links — and never wraps non-autoGloss entries", () => {
    const tree = run([
      el("h2", text("Sandbagging")),
      p(el("code", text("sandbag()")), text(" control everywhere ")),
      p(el("a", text("sandbagging link"))),
    ]);
    expect(termNodes(tree)).toHaveLength(0);
  });

  it("descends into block JSX prose but leaves inline JSX whole", () => {
    const callout: Node = {
      type: "mdxJsxFlowElement",
      name: "Callout",
      children: [p(text("Watch for sandbagging here."))],
    };
    const footnote: Node = {
      type: "mdxJsxTextElement",
      name: "Footnote",
      children: [text("x-risk in a footnote stays plain")],
    };
    const tree = run([callout, p(footnote)]);
    const ids = termNodes(tree).map(termId);
    expect(ids).toEqual(["sandbagging"]);
  });

  it("leaves non-allowlisted flow JSX whole (SiteQuote children render inside a link)", () => {
    const siteQuote: Node = {
      type: "mdxJsxFlowElement",
      name: "SiteQuote",
      attributes: [{ type: "mdxJsxAttribute", name: "href", value: "https://x.test" }],
      children: [text("a sandbagging trigger phrase")],
    };
    const tree = run([siteQuote, p(text("but sandbagging in prose still glosses"))]);
    const terms = termNodes(tree);
    expect(terms.map(termId)).toEqual(["sandbagging"]);
    // The wrap landed in the paragraph, not inside the SiteQuote.
    expect(tree.children[0].children?.every((n) => n.type === "text")).toBe(true);
  });

  it('suppresses via the id={"…"} expression spelling of a hand-placed <Term>', () => {
    const pinned: Node = {
      type: "mdxJsxTextElement",
      name: "Term",
      attributes: [
        {
          type: "mdxJsxAttribute",
          name: "id",
          value: { type: "mdxJsxAttributeValueExpression", value: '"sandbagging"' } as unknown,
        },
      ],
      children: [text("doing worse on purpose")],
    };
    const tree = run([p(pinned, text(" and later sandbagging plus x-risk"))]);
    const auto = termNodes(tree).filter((n) => n !== pinned);
    expect(auto.map(termId)).toEqual(["x-risk"]);
  });

  it("skips terms the author already hand-<Term>ed (by id or by text)", () => {
    const byId: Node = {
      type: "mdxJsxTextElement",
      name: "Term",
      attributes: [{ type: "mdxJsxAttribute", name: "id", value: "sandbagging" }],
      children: [text("sandbagging")],
    };
    const byText: Node = {
      type: "mdxJsxTextElement",
      name: "Term",
      children: [text("trusted monitoring")],
    };
    const tree = run([
      p(byId, text(" and later sandbagging plus trusted monitoring and x-risk")),
      p(byText),
    ]);
    const auto = termNodes(tree).filter((n) => n.attributes?.length === 1 && n !== byId);
    expect(auto.map(termId)).toEqual(["x-risk"]);
  });

  it("leaves excluded lessons untouched", () => {
    const tree = run([p(text("sandbagging and x-risk"))], "c-areas-l1.mdx");
    expect(termNodes(tree)).toHaveLength(0);
  });
});
