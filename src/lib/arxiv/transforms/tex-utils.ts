import type * as Ast from "@unified-latex/unified-latex-types";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";

/** Build a `\name{arg}` macro node. */
export function texMacro(name: string, arg?: string): Ast.Macro {
  const macro: Ast.Macro = { type: "macro", content: name };
  if (arg !== undefined) {
    macro.args = [
      {
        type: "argument",
        content: [{ type: "string", content: arg }],
        openMark: "{",
        closeMark: "}",
      },
    ];
  }
  return macro;
}

export function texString(content: string): Ast.String {
  return { type: "string", content };
}

export function rawText(nodes: Ast.Node[] | null | undefined): string {
  if (!nodes || nodes.length === 0) return "";
  return printRaw(nodes);
}

/**
 * Strip TeX line comments (unescaped `%` to end of line) from raw source.
 * Used before regex-scanning source so commented-out definitions don't win.
 */
export function stripTexComments(source: string): string {
  return source
    .split("\n")
    .map((line) => {
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "\\") i++;
        else if (line[i] === "%") return line.slice(0, i);
      }
      return line;
    })
    .join("\n");
}

const COMBINING_ACCENTS: Record<string, string> = {
  "'": "́",
  "`": "̀",
  "^": "̂",
  '"': "̈",
  "~": "̃",
  "=": "̄",
  ".": "̇",
  c: "̧",
  v: "̌",
  u: "̆",
  H: "̋",
  k: "̨",
  r: "̊",
};

const LETTER_MACROS: Array<[RegExp, string]> = [
  [/\\ss(?![a-zA-Z])\s*(?:\{\})?/g, "ß"],
  [/\\L(?![a-zA-Z])\s*(?:\{\})?/g, "Ł"],
  [/\\l(?![a-zA-Z])\s*(?:\{\})?/g, "ł"],
  [/\\O(?![a-zA-Z])\s*(?:\{\})?/g, "Ø"],
  [/\\o(?![a-zA-Z])\s*(?:\{\})?/g, "ø"],
  [/\\AA(?![a-zA-Z])\s*(?:\{\})?/g, "Å"],
  [/\\aa(?![a-zA-Z])\s*(?:\{\})?/g, "å"],
  [/\\AE(?![a-zA-Z])\s*(?:\{\})?/g, "Æ"],
  [/\\ae(?![a-zA-Z])\s*(?:\{\})?/g, "æ"],
];

/**
 * Rough plain-text rendering of TeX nodes — good enough for alt text, slugs,
 * and card metadata, not for display. Common accent macros are resolved so
 * author names survive (\L{}ukasz → Łukasz, Fran\c{c}ois → François).
 */
export function plainText(nodes: Ast.Node[] | null | undefined): string {
  // printRaw includes % comments; they are never display text.
  let text = stripTexComments(rawText(nodes));
  // Symbol accents: \'e, \"{o} — punctuation form never eats a word.
  text = text.replace(
    /\\(['`^"~=.])\s*\{?([a-zA-Z])\}?/g,
    (m, accent: string, ch: string) =>
      (ch + COMBINING_ACCENTS[accent]).normalize("NFC"),
  );
  // Letter accents require braces so \v doesn't eat words: \c{c}, \v{s}.
  text = text.replace(
    /\\([cvuHkr])\s*\{([a-zA-Z])\}/g,
    (m, accent: string, ch: string) =>
      (ch + COMBINING_ACCENTS[accent]).normalize("NFC"),
  );
  for (const [re, replacement] of LETTER_MACROS) {
    text = text.replace(re, replacement);
  }
  // {\L}ukasz-style wrapping: unwrap single-character groups so the brace
  // stripping below doesn't split the word.
  text = text.replace(/\{(\S)\}/g, "$1");
  return text
    .replace(/\\[a-zA-Z@]+\*?\s*/g, " ")
    .replace(/[{}~$]/g, " ")
    .replace(/\\[\\,;:!"'`^.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return slug || "x";
}

/** Mints unique ids by appending a counter to colliding bases. */
export class IdMinter {
  private used = new Set<string>();

  mint(base: string): string {
    let id = base;
    let n = 2;
    while (this.used.has(id)) id = `${base}-${n++}`;
    this.used.add(id);
    return id;
  }
}

/**
 * Environment name as a string. The declared type says `env: string`, but
 * the parser actually emits a String node there — handle both.
 */
export function envName(env: Ast.Environment): string {
  const raw = env.env as unknown;
  if (typeof raw === "string") return raw;
  return printRaw(raw as Ast.Node | Ast.Node[]);
}

/** The last non-null attached argument's content — usually "the" argument. */
export function lastArgContent(node: Ast.Macro | Ast.Environment): Ast.Node[] {
  const args = node.args ?? [];
  for (let i = args.length - 1; i >= 0; i--) {
    const arg = args[i];
    if (arg && arg.content.length > 0) return arg.content;
  }
  return [];
}

/**
 * Walk every Ast.Node[] container (root/group/env content, macro args) and
 * let `fn` rewrite the array in place. Used for removals that must also eat
 * sibling nodes (e.g. `\def\x{...}`), which single-node visitors can't do.
 */
export function walkNodeArrays(
  node: Ast.Ast | Ast.Node,
  fn: (nodes: Ast.Node[]) => void,
): void {
  if (Array.isArray(node)) {
    fn(node);
    for (const child of node) walkNodeArrays(child, fn);
    return;
  }
  if (typeof node !== "object" || node === null) return;

  if ("content" in node && Array.isArray(node.content)) {
    fn(node.content as Ast.Node[]);
    for (const child of node.content as Ast.Node[]) walkNodeArrays(child, fn);
  }
  if ("args" in node && Array.isArray(node.args)) {
    for (const arg of node.args) {
      fn(arg.content);
      for (const child of arg.content) walkNodeArrays(child, fn);
    }
  }
}
