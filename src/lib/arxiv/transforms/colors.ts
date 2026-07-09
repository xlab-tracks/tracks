import { stripTexComments } from "./tex-utils";

/**
 * xcolor support: parse \definecolor / \colorlet declarations from the raw
 * source into a name → RGB table, and resolve color expressions like
 * "sabotagecolorbase!70!white". Resolved colors are emitted as OUR OWN
 * "#rrggbb" strings (never author text), so applying them as inline styles
 * post-sanitize is safe — same trust argument as KaTeX output.
 */

type Rgb = [number, number, number];

/** Base named colors (LaTeX/xcolor defaults papers rely on). */
const NAMED_COLORS: Record<string, Rgb> = {
  white: [255, 255, 255],
  black: [0, 0, 0],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
  violet: [143, 0, 255],
  purple: [128, 0, 128],
  brown: [150, 75, 0],
  pink: [255, 192, 203],
  olive: [128, 128, 0],
  teal: [0, 128, 128],
  lightgray: [211, 211, 211],
  darkgray: [96, 96, 96],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
};

export type ColorTable = Map<string, Rgb>;

export function collectColors(rawSource: string): ColorTable {
  const source = stripTexComments(rawSource);
  const table: ColorTable = new Map(
    Object.entries(NAMED_COLORS).map(([k, v]) => [k, [...v] as Rgb]),
  );

  // \definecolor{name}{model}{spec} and \colorlet{name}{expr}, processed in
  // a single DOCUMENT-ORDER pass — later declarations routinely reference
  // earlier ones ({named} aliases, colorlet mixing chains).
  const declRe =
    /\\(?:(?:define|provide)color\s*\{([^{}]+)\}\s*\{([^{}]+)\}\s*\{([^{}]+)\}|colorlet\s*\{([^{}]+)\}\s*\{([^{}]+)\})/g;
  for (const m of source.matchAll(declRe)) {
    if (m[1] !== undefined) {
      const model = m[2].trim();
      const spec = m[3].trim();
      // {named}{other} aliases an existing color.
      const rgb =
        model === "named"
          ? ((table.get(spec)?.slice() as Rgb | undefined) ?? null)
          : parseModelSpec(model, spec);
      if (rgb) table.set(m[1].trim(), rgb);
    } else {
      const rgb = resolveColorExpr(m[5].trim(), table);
      if (rgb) table.set(m[4].trim(), rgb);
    }
  }
  return table;
}

/** Names DECLARED in the source (even if their values couldn't resolve). */
export function declaredColorNames(rawSource: string): string[] {
  const source = stripTexComments(rawSource);
  const names = new Set<string>();
  const declRe =
    /\\(?:(?:define|provide)color|colorlet)\s*\{([^{}]+)\}/g;
  for (const m of source.matchAll(declRe)) names.add(m[1].trim());
  return [...names];
}

function parseModelSpec(model: string, spec: string): Rgb | null {
  switch (model) {
    case "HTML": {
      const hex = spec.replace(/[^0-9a-fA-F]/g, "");
      if (hex.length !== 6) return null;
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
    case "rgb": {
      const parts = spec.split(",").map((p) => parseFloat(p.trim()));
      if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p))) return null;
      return parts.map((p) => clampByte(p * 255)) as Rgb;
    }
    case "RGB": {
      const parts = spec.split(",").map((p) => parseFloat(p.trim()));
      if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p))) return null;
      return parts.map(clampByte) as Rgb;
    }
    case "gray":
    case "grey": {
      const v = parseFloat(spec);
      if (!Number.isFinite(v)) return null;
      const byte = clampByte(v * 255);
      return [byte, byte, byte];
    }
    default:
      return null;
  }
}

/**
 * Resolve an xcolor expression: `name`, `name!30`, `name!70!other` (chained
 * left-to-right: ((a!p)!q!b)…). Unknown names resolve to null.
 */
export function resolveColorExpr(
  expr: string,
  table: ColorTable,
): Rgb | null {
  const parts = expr.split("!").map((p) => p.trim());
  let current = lookup(parts[0], table);
  if (!current) return null;
  let i = 1;
  while (i < parts.length) {
    const pct = parseFloat(parts[i]);
    if (!Number.isFinite(pct)) return null;
    const otherName = parts[i + 1];
    const other = otherName ? lookup(otherName, table) : table.get("white")!;
    if (!other) return null;
    current = mix(current, other, pct / 100);
    i += otherName ? 2 : 1;
  }
  return current;
}

function lookup(name: string, table: ColorTable): Rgb | null {
  const rgb = table.get(name);
  return rgb ? ([...rgb] as Rgb) : null;
}

function mix(a: Rgb, b: Rgb, fraction: number): Rgb {
  const f = Math.min(1, Math.max(0, fraction));
  return [
    clampByte(a[0] * f + b[0] * (1 - f)),
    clampByte(a[1] * f + b[1] * (1 - f)),
    clampByte(a[2] * f + b[2] * (1 - f)),
  ];
}

function clampByte(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}

/** Resolve to a strictly-validated "#rrggbb" string (safe for inline style). */
export function resolveColorHex(
  expr: string,
  table: ColorTable,
): string | null {
  const rgb = resolveColorExpr(expr, table);
  if (!rgb) return null;
  return `#${rgb.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
