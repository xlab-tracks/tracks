"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HEATWORD,
  LANDSCAPE_CELLS as CELLS,
  LANDSCAPE_COLS as COLS,
  LANDSCAPE_COPY as C,
  LANDSCAPE_ROWS as ROWS,
  type LandscapeCell,
} from "@/lib/verification/data/verification-landscape";
import type { VerificationWidgetProps } from "../kit/types";

type Sel =
  | { kind: "cell"; ri: number; ci: number }
  | { kind: "axis"; axis: "row" | "col"; i: number }
  | null;

// Sequential navy intensity scale (0–3), on-brand with the app palette.
const HEAT: { cell: string; swatch: string }[] = [
  { cell: "bg-muted text-muted-foreground", swatch: "bg-muted" },
  { cell: "bg-primary/15 text-foreground", swatch: "bg-primary/15" },
  { cell: "bg-primary/55 text-primary-foreground", swatch: "bg-primary/55" },
  { cell: "bg-primary text-primary-foreground", swatch: "bg-primary" },
];
const HATCH: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, transparent, transparent 5px, color-mix(in srgb, var(--muted-foreground) 22%, transparent) 5px, color-mix(in srgb, var(--muted-foreground) 22%, transparent) 6px)",
};

export function VerificationLandscape(_: VerificationWidgetProps) {
  void _;
  const [sel, setSel] = useState<Sel>(null);

  // Re-key the floating panel on each new selection so it replays its
  // slide-in ("floaty open") animation every time.
  const selKey =
    sel === null
      ? "none"
      : sel.kind === "cell"
        ? `c-${sel.ri}-${sel.ci}`
        : `a-${sel.axis}-${sel.i}`;

  return (
    <div className="not-prose my-6">
      {/* legend */}
      <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs">
        <span>{C.lessActivity}</span>
        <span className="flex">
          {HEAT.map((h, i) => (
            <span
              key={i}
              className={cn("size-4 first:rounded-l last:rounded-r", h.swatch)}
              style={i === 0 ? HATCH : undefined}
            />
          ))}
        </span>
        <span>{C.moreActivity}</span>
      </div>

      {/* grid (left) + floating detail (right) */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div
          role="grid"
          className="grid min-w-0 gap-1.5 overflow-x-auto p-1.5 text-xs"
          style={{
            gridTemplateColumns: `minmax(8rem, 1.4fr) repeat(${COLS.length}, minmax(4rem, 1fr))`,
          }}
        >
          <div aria-hidden />
          {COLS.map((c, ci) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSel({ kind: "axis", axis: "col", i: ci })}
              className="hover:bg-muted rounded px-1 py-1.5 text-center font-semibold hover:underline"
            >
              {c.name}
            </button>
          ))}

          {ROWS.map((r, ri) => (
            <div key={r.key} className="contents">
              <button
                type="button"
                onClick={() => setSel({ kind: "axis", axis: "row", i: ri })}
                className="hover:bg-muted rounded px-1.5 py-1.5 text-left font-semibold hover:underline"
              >
                {r.name}
              </button>
              {COLS.map((c, ci) => {
                const d = CELLS[r.key][c.key];
                const active =
                  sel?.kind === "cell" && sel.ri === ri && sel.ci === ci;
                return (
                  <button
                    key={c.key}
                    type="button"
                    aria-label={`${r.name}, ${c.name}, activity ${d.i} of 3`}
                    aria-pressed={active}
                    onClick={() => setSel({ kind: "cell", ri, ci })}
                    style={d.i === 0 ? HATCH : undefined}
                    className={cn(
                      // Outset rings (box-shadow) — they sit on the light gap so
                      // they're visible around any cell regardless of fill, and
                      // never cause scrollbars (only transforms do; the grid
                      // has p-1.5 so edge rings aren't clipped). Hover = flush red
                      // accent (pops on every intensity); selected = navy ring
                      // with a white offset gap so it stays visible even on the
                      // dark navy cells (navy-on-navy would otherwise merge).
                      "flex aspect-square items-center justify-center rounded font-mono text-sm outline-none transition-shadow hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring",
                      HEAT[d.i].cell,
                      active &&
                        "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                    )}
                  >
                    {d.i}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* floating detail panel — opens on the right, sticky + slide-in */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div
            key={selKey}
            className={cn(
              "border-border bg-card shadow-soft-md rounded-xl border p-4 text-sm lg:max-h-[70vh] lg:overflow-y-auto",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300",
            )}
          >
            {sel === null ? (
              <p className="text-muted-foreground italic">{C.prompt}</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSel(null)}
                  aria-label="Close detail"
                  className="text-muted-foreground hover:text-foreground float-right -mt-1 -mr-1 rounded p-1 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
                >
                  <X className="size-4" aria-hidden />
                </button>
                {sel.kind === "axis" ? (
                  <AxisDetail axis={sel.axis} i={sel.i} />
                ) : (
                  <CellDetail
                    cell={CELLS[ROWS[sel.ri].key][COLS[sel.ci].key]}
                    rowName={ROWS[sel.ri].name}
                    colName={COLS[sel.ci].name}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CellDetail({
  cell,
  rowName,
  colName,
}: {
  cell: LandscapeCell;
  rowName: string;
  colName: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
        {rowName} × {colName}
      </p>
      <h4 className="mt-1 text-base font-semibold">
        {cell.gap && <span className="text-defect">Open gap. </span>}
        {rowName} here is <em className="not-italic">{HEATWORD[cell.i].toLowerCase()}</em>.
      </h4>
      <p className="text-muted-foreground mt-0.5 text-xs">
        Activity {cell.i} / 3 · {HEATWORD[cell.i]}
      </p>
      <p className="mt-2">{cell.state}</p>
      {cell.eff.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {cell.eff.map(([name, body], i) => (
            <li key={i}>
              <span className="font-medium">{name}</span>. {body}
            </li>
          ))}
        </ul>
      )}
      <p className="border-border mt-3 border-t pt-2">
        <span className="text-muted-foreground mr-1 font-mono text-[11px] tracking-[0.1em] uppercase">
          {C.howConnects}
        </span>
        {cell.connect}
      </p>
    </div>
  );
}

function AxisDetail({ axis, i }: { axis: "row" | "col"; i: number }) {
  const o = axis === "row" ? ROWS[i] : COLS[i];
  return (
    <div>
      <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
        {axis === "row" ? C.rowAxisTag : C.colAxisTag}
      </p>
      <h4 className="mt-1 text-base font-semibold">{o.name}</h4>
      <p className="mt-2">{o.desc}</p>
      <p className="text-muted-foreground mt-2 text-xs">
        {C.axisHint.replace("{kind}", axis)}
      </p>
    </div>
  );
}
