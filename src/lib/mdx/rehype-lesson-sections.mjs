/**
 * Rehype plugin (registered in next.config.ts, AFTER rehype-slug): collects a
 * lesson body's top-level section headings (##/###) — plus top-level
 * `<Exercise id="…"/>` blocks — and adds
 * `export const sections = [{ id, title?, level, exercise? }, …]` to the
 * compiled MDX module. Heading ids are read from what rehype-slug just
 * processed — the exact anchors the page renders — so the sidebar's "In this
 * lesson" nav can never drift from the document (no authored section list to
 * keep in sync). Exercise blocks get a wrapping anchor div (same
 * `ins-exercise-…` id convention as papers' inserted activities) and an entry
 * carrying the exercise id; their display titles resolve from the exercise
 * registry at layout time.
 *
 * Plain .mjs (not TS): the MDX loader imports it by file path at build time.
 */
export default function rehypeLessonSections() {
  return (tree) => {
    const sections = [];
    // Exercises nest one level under their containing section, like papers'
    // inserted activities.
    let lastHeadingLevel = 1;
    tree.children.forEach((node, index) => {
      if (node.type === "element") {
        const level =
          node.tagName === "h2" ? 2 : node.tagName === "h3" ? 3 : null;
        if (level === null) return;
        const id = node.properties?.id;
        const title = toText(node).trim();
        if (typeof id !== "string" || id === "" || title === "") return;
        lastHeadingLevel = level;
        sections.push({ id, title, level });
        return;
      }
      if (node.type === "mdxJsxFlowElement" && node.name === "Exercise") {
        const idAttr = (node.attributes ?? []).find(
          (attr) =>
            attr.type === "mdxJsxAttribute" &&
            attr.name === "id" &&
            typeof attr.value === "string" &&
            attr.value !== "",
        );
        if (!idAttr) return;
        const anchorId = `ins-exercise-${idAttr.value}`;
        tree.children[index] = {
          type: "element",
          tagName: "div",
          properties: { id: anchorId },
          children: [node],
        };
        sections.push({
          id: anchorId,
          exercise: idAttr.value,
          level: lastHeadingLevel + 1,
        });
      }
    });
    tree.children.unshift(esmExport("sections", sections));
  };
}

/** Concatenated text content of a hast node (KaTeX math contributes raw TeX). */
function toText(node) {
  if (node.type === "text") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(toText).join("");
}

/** An `export const <name> = <json>` MDX ESM node (hand-built estree). */
function esmExport(name, value) {
  return {
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            specifiers: [],
            source: null,
            declaration: {
              type: "VariableDeclaration",
              kind: "const",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: { type: "Identifier", name },
                  init: valueToEstree(value),
                },
              ],
            },
          },
        ],
      },
    },
  };
}

/** JSON value → estree expression (arrays, plain objects, primitives only). */
function valueToEstree(value) {
  if (Array.isArray(value)) {
    return { type: "ArrayExpression", elements: value.map(valueToEstree) };
  }
  if (value !== null && typeof value === "object") {
    return {
      type: "ObjectExpression",
      properties: Object.entries(value).map(([key, entry]) => ({
        type: "Property",
        kind: "init",
        method: false,
        shorthand: false,
        computed: false,
        key: { type: "Identifier", name: key },
        value: valueToEstree(entry),
      })),
    };
  }
  return { type: "Literal", value };
}
