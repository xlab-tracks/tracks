import type { Element, ElementContent, Root } from "hast";
import type { PaperTocEntry, PaperTocEntryKind } from "./types";

/**
 * Section-tree extraction for full-page Paper rendering. Both passes walk
 * ONLY the top-level children of the root: section headings are emitted as
 * top-level siblings by the converter (the abstract/references/footnotes
 * wrappers are the exceptions, handled as landmarks). Keeping toc entries
 * top-level is load-bearing — split-paper.ts slices the serialized HTML at
 * these elements' start offsets, which is only safe when they never sit
 * inside another element.
 */

const LANDMARK_CLASSES: Record<
  string,
  { kind: PaperTocEntryKind; id: string; title: string }
> = {
  "ax-abstract": { kind: "abstract", id: "ax-abstract", title: "Abstract" },
  "ax-references": { kind: "references", id: "ax-references", title: "References" },
  "ax-footnotes": { kind: "footnotes", id: "ax-footnotes", title: "Footnotes" },
};

const SECTION_HEADINGS = new Set(["h2", "h3", "h4"]);

/**
 * Give the landmark wrapper sections (abstract/references/footnotes) stable
 * ids so they can be toc entries, anchor targets, and insertion boundaries.
 * Their inner h2s carry no id, and section headings/citations use the
 * "ax-sec-"/"ax-ref-" prefixes, so these ids can only collide with
 * themselves — which happens: a paper that concatenates supplementary
 * material can carry two thebibliography environments, i.e. two
 * ax-references sections. Repeats get a "-2"-style suffix so every toc
 * entry stays a unique anchor (split-paper.ts relies on offsets being
 * resolvable per entry).
 */
export function stampLandmarkIds(tree: Root): void {
  const used = new Set<string>();
  for (const node of tree.children) {
    if (node.type !== "element") continue;
    const landmark = landmarkOf(node);
    if (!landmark) continue;
    let id = landmark.id;
    for (let n = 2; used.has(id); n++) id = `${landmark.id}-${n}`;
    used.add(id);
    node.properties = { ...node.properties, id };
  }
}

/** Extract the flat, document-order section tree. Run after stampLandmarkIds. */
export function extractToc(tree: Root): PaperTocEntry[] {
  const toc: PaperTocEntry[] = [];
  for (const node of tree.children) {
    if (node.type !== "element") continue;

    const landmark = landmarkOf(node);
    if (landmark) {
      // Use the stamped (possibly dedup-suffixed) id, not the class default.
      const stamped = node.properties?.id;
      toc.push({
        ...landmark,
        id: typeof stamped === "string" ? stamped : landmark.id,
        number: "",
        level: 2,
      });
      continue;
    }

    if (!SECTION_HEADINGS.has(node.tagName)) continue;
    const id = node.properties?.id;
    if (typeof id !== "string" || !id.startsWith("ax-sec-")) continue;

    const secnum = node.children.find(isSecnumSpan);
    const number = secnum ? collapse(textOf(secnum)) : "";
    const title = collapse(
      node.children
        .filter((child) => !isSecnumSpan(child))
        .map(textOf)
        .join(""),
    );
    toc.push({
      kind: "section",
      id,
      title,
      number,
      level: Number(node.tagName[1]),
    });
  }
  return toc;
}

function landmarkOf(
  node: Element,
): { kind: PaperTocEntryKind; id: string; title: string } | undefined {
  if (node.tagName !== "section") return undefined;
  return classListOf(node)
    .map((cls) => LANDMARK_CLASSES[cls])
    .find(Boolean);
}

function isSecnumSpan(node: ElementContent): node is Element {
  return (
    node.type === "element" &&
    node.tagName === "span" &&
    classListOf(node).includes("ax-secnum")
  );
}

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function classListOf(node: Element): string[] {
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.map(String);
  if (typeof className === "string") return className.split(/\s+/);
  return [];
}
