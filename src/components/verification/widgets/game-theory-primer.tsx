"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CONTENT,
  DOORS,
  EDGES,
  GTP_COPY as C,
  LO_MAP,
  LS_PATH,
  LS_VISITED,
  NODES,
  nodeById,
  PATHS,
  PAY,
  QBANK,
  SHELF,
  SHELF_EYEBROW,
  SHELF_TITLE,
  THREAD_COLORS,
  THREAD_NAME,
  THREADS,
  type GtpNode,
  type QItem,
  type SimId,
} from "@/lib/verification/data/game-theory-primer";
import type { VerificationWidgetProps } from "../kit/types";

/* ============================== helpers ============================== */

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/* map geometry, verbatim from source */
const NW = 176;
const NH = 52;
function edgePath(a: GtpNode, b: GtpNode): string {
  const ax = a.x,
    ay = a.y,
    bx = b.x,
    by = b.y;
  if (Math.abs(bx - ax) > NW) {
    let x1 = ax + NW / 2;
    let x2 = bx - (NW / 2) * Math.sign(bx - ax);
    if (bx < ax) {
      x1 = ax - NW / 2;
      x2 = bx + NW / 2;
    }
    const mx = (x1 + x2) / 2;
    return `M${x1},${ay} C${mx},${ay} ${mx},${by} ${x2},${by}`;
  }
  let y1 = ay + NH / 2;
  let y2 = by - NH / 2;
  if (by < ay) {
    y1 = ay - NH / 2;
    y2 = by + NH / 2;
  }
  return `M${ax},${y1} C${ax},${y1 + 18} ${bx},${y2 - 18} ${bx},${y2}`;
}

/* ============================== toy sims ============================== */

/* shared small building blocks styled with app tokens */

function SimShell({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-muted/30 mt-4 rounded-lg border p-3.5">
      <p className="text-muted-foreground mb-2.5 font-mono text-[10px] tracking-[0.16em] uppercase">
        {eyebrow}
      </p>
      {children}
    </div>
  );
}

function SimMsg({ html }: { html: string }) {
  return (
    <p
      aria-live="polite"
      className="text-muted-foreground mt-2.5 min-h-[1.4em] text-[13px] [&_b]:text-foreground [&_b]:font-semibold"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* payoff matrix — reused by pd + nash */
type CellKey = "CC" | "CD" | "DC" | "DD";
const MATRIX_CELLS: { key: CellKey; row: number; col: number }[] = [
  { key: "CC", row: 0, col: 0 },
  { key: "CD", row: 0, col: 1 },
  { key: "DC", row: 1, col: 0 },
  { key: "DD", row: 1, col: 1 },
];

function PayoffMatrix({
  hot,
  eq,
  onCell,
}: {
  hot?: CellKey | null;
  eq?: CellKey | null;
  onCell?: (k: CellKey) => void;
}) {
  return (
    <table className="my-1 border-collapse text-[12.5px]">
      <tbody>
        <tr>
          <th className="text-muted-foreground p-1 px-2 font-mono text-[9.5px] font-medium tracking-[0.1em] uppercase" />
          <th className="text-muted-foreground p-1 px-2 font-mono text-[9.5px] font-medium tracking-[0.1em] uppercase">
            they cooperate
          </th>
          <th className="text-muted-foreground p-1 px-2 font-mono text-[9.5px] font-medium tracking-[0.1em] uppercase">
            they defect
          </th>
        </tr>
        {[0, 1].map((row) => (
          <tr key={row}>
            <th className="text-muted-foreground p-1 px-2 text-right font-mono text-[9.5px] font-medium tracking-[0.1em] uppercase">
              {row === 0 ? "you cooperate" : "you defect"}
            </th>
            {[0, 1].map((col) => {
              const cell = MATRIX_CELLS.find(
                (c) => c.row === row && c.col === col,
              )!;
              const [you, them] = PAY[cell.key];
              const isHot = hot === cell.key;
              const isEq = eq === cell.key;
              return (
                <td
                  key={col}
                  className={cn(
                    "border-border/80 min-w-[92px] border p-2 px-3 text-center transition-colors",
                    onCell && "hover:bg-muted cursor-pointer",
                    isHot && "bg-muted outline-exaggerate outline-2 -outline-offset-2",
                    isEq && "bg-muted outline-comply outline-2 -outline-offset-2",
                  )}
                >
                  {onCell ? (
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => onCell(cell.key)}
                    >
                      you <span className="text-primary font-semibold">{you}</span> ·
                      them <span className="text-defect font-semibold">{them}</span>
                    </button>
                  ) : (
                    <>
                      you <span className="text-primary font-semibold">{you}</span> ·
                      them <span className="text-defect font-semibold">{them}</span>
                    </>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SimButton({
  variant,
  pressed,
  onClick,
  children,
}: {
  variant?: "coop" | "defect" | "primary" | "plain";
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "border-border hover:border-primary mr-1.5 mb-1.5 rounded-lg border bg-card px-3.5 py-1.5 font-mono text-[12px] transition-colors",
        variant === "coop" && "border-comply/50 text-comply hover:bg-comply/10",
        variant === "defect" && "border-defect/50 text-defect hover:bg-defect/10",
        variant === "primary" &&
          "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        pressed && "bg-muted border-primary",
      )}
    >
      {children}
    </button>
  );
}

function LabeledSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  display,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="my-2 flex flex-wrap items-center gap-2.5">
      <span className="text-muted-foreground min-w-[150px] font-mono text-[11px]">
        {label}
      </span>
      <Slider
        aria-label={label}
        className="min-w-[130px] flex-1"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
      />
      <span className="min-w-[48px] text-right font-mono text-[12px]">
        {display}
      </span>
    </div>
  );
}

function Bar({
  color,
  pct,
}: {
  color: "green" | "red" | "amber";
  pct: number;
}) {
  const bg =
    color === "green"
      ? "bg-comply"
      : color === "red"
        ? "bg-defect"
        : "bg-exaggerate";
  return (
    <div className="bg-muted border-border h-3.5 overflow-hidden rounded-full border">
      <div
        className={cn("h-full rounded-full transition-[width] duration-200", bg)}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

/* the ten-cell / sixty-cell strip */
function stripClass(cls: "cc" | "half" | "dd" | "empty") {
  return cls === "cc"
    ? "bg-comply border-comply"
    : cls === "dd"
      ? "bg-defect border-defect"
      : cls === "half"
        ? "bg-exaggerate border-exaggerate"
        : "bg-card border-border";
}

/* ---- pd ---- */
function SimPD() {
  const [state, setState] = useState({ you: 0, them: 0, n: 0, hot: null as CellKey | null });
  const play = (mv: "C" | "D") => {
    const key = (mv + "D") as CellKey;
    const p = PAY[key];
    setState((s) => ({
      you: s.you + p[0],
      them: s.them + p[1],
      n: s.n + 1,
      hot: key,
    }));
  };
  const reset = () => setState({ you: 0, them: 0, n: 0, hot: null });
  let msg = "The rival is purely self-interested. Pick a move.";
  if (state.n === 1) msg = "The rival defected. Try the other move — watch what they do.";
  else if (state.n === 2)
    msg =
      "They defect <b>every time</b>: whatever you pick, defecting pays them more (5&gt;3 and 1&gt;0). The same logic applies to you — and that’s the trap: both &ldquo;rational,&rdquo; both stuck at 1 point when 3 was available.";
  else if (state.n >= 3)
    msg =
      "Stuck at mutual defection — the outcome nobody wanted, reached by flawless logic. Changing this <b>payoff structure</b> is what treaty design is for.";
  return (
    <SimShell eyebrow="Toy · play a round against a rational rival">
      <PayoffMatrix hot={state.hot} />
      <div>
        <SimButton variant="coop" onClick={() => play("C")}>Cooperate</SimButton>
        <SimButton variant="defect" onClick={() => play("D")}>Defect</SimButton>
        <SimButton onClick={reset}>reset</SimButton>
      </div>
      <div className="text-muted-foreground my-2 flex flex-wrap gap-4 font-mono text-[12px] [&_b]:text-foreground [&_b]:text-[15px]">
        <span>you <b>{state.you}</b></span>
        <span>rival <b>{state.them}</b></span>
        <span>rounds <b>{state.n}</b></span>
      </div>
      <SimMsg html={msg} />
    </SimShell>
  );
}

/* ---- nash ---- */
const ALT: Record<CellKey, { you: CellKey; them: CellKey }> = {
  CC: { you: "DC", them: "CD" },
  CD: { you: "DD", them: "CC" },
  DC: { you: "CC", them: "DD" },
  DD: { you: "CD", them: "DC" },
};
function SimNash() {
  const [sel, setSel] = useState<{ key: CellKey; eq: boolean } | null>(null);
  const [msg, setMsg] = useState(
    "A cell is an equilibrium only if <b>neither</b> player gains by switching alone.",
  );
  const onCell = (k: CellKey) => {
    const p = PAY[k];
    const youAlt = PAY[ALT[k].you][0];
    const themAlt = PAY[ALT[k].them][1];
    const youMoves = youAlt > p[0];
    const themMoves = themAlt > p[1];
    const stable = !youMoves && !themMoves;
    const parts: string[] = [];
    parts.push(
      youMoves
        ? `You'd switch (${p[0]} → ${youAlt}).`
        : `You'd stay (${p[0]} vs ${youAlt}).`,
    );
    parts.push(
      themMoves
        ? `They'd switch (${p[1]} → ${themAlt}).`
        : `They'd stay (${p[1]} vs ${themAlt}).`,
    );
    parts.push(
      stable
        ? "<b>No one moves — Nash equilibrium.</b> Note it's the <b>worst joint outcome</b> on the board: stable ≠ good."
        : "Someone wants out → <b>not stable</b>.",
    );
    setSel({ key: k, eq: stable });
    setMsg(parts.join(" "));
  };
  return (
    <SimShell eyebrow="Toy · click any cell — would either player walk away from it?">
      <PayoffMatrix
        hot={sel && !sel.eq ? sel.key : null}
        eq={sel && sel.eq ? sel.key : null}
        onCell={onCell}
      />
      <SimMsg html={msg} />
    </SimShell>
  );
}

/* ---- repeat ---- */
function SimRepeat() {
  const [state, setState] = useState({
    you: 0,
    them: 0,
    n: 0,
    yourLast: null as "C" | "D" | null,
    cells: Array<"cc" | "half" | "dd" | "empty">(10).fill("empty"),
    msg: "",
  });
  const play = (mv: "C" | "D") => {
    setState((s) => {
      if (s.n >= 10) return s;
      const opp = s.yourLast === null ? "C" : s.yourLast;
      const key = (mv + opp) as CellKey;
      const p = PAY[key];
      const you = s.you + p[0];
      const them = s.them + p[1];
      const cells = s.cells.slice();
      cells[s.n] = key === "CC" ? "cc" : key === "DD" ? "dd" : "half";
      const n = s.n + 1;
      let msg = "";
      if (n === 10) {
        msg =
          you >= 28
            ? `<b>${you} points.</b> Mutual cooperation the whole way is 30 — you basically found the ceiling. That's the shadow of the future working.`
            : `<b>${you} points.</b> All-cooperate would have scored 30. Every defection bought you 5 once, then cost you retaliation. Reset and try staying nice.`;
      } else if (mv === "D") {
        msg = "You defected — tit-for-tat will hit back next round.";
      }
      return {
        you,
        them,
        n,
        yourLast: mv,
        cells,
        msg:
          msg ||
          "Green = both cooperated · amber = one defected · red = both defected.",
      };
    });
  };
  const reset = () =>
    setState({
      you: 0,
      them: 0,
      n: 0,
      yourLast: null,
      cells: Array<"cc" | "half" | "dd" | "empty">(10).fill("empty"),
      msg: "",
    });
  return (
    <SimShell eyebrow="Toy · 10 rounds against tit-for-tat">
      <div>
        <SimButton variant="coop" onClick={() => play("C")}>Cooperate</SimButton>
        <SimButton variant="defect" onClick={() => play("D")}>Defect</SimButton>
        <SimButton onClick={reset}>reset</SimButton>
      </div>
      <div className="my-2 flex flex-wrap gap-1">
        {state.cells.map((c, i) => (
          <span
            key={i}
            className={cn("size-3.5 rounded border", stripClass(c))}
          />
        ))}
      </div>
      <div className="text-muted-foreground my-2 flex flex-wrap gap-4 font-mono text-[12px] [&_b]:text-foreground [&_b]:text-[15px]">
        <span>you <b>{state.you}</b></span>
        <span>tit-for-tat <b>{state.them}</b></span>
        <span>round <b>{state.n}</b>/10</span>
      </div>
      <SimMsg
        html={
          state.msg ||
          "Tit-for-tat starts nice, then mirrors your last move. Try defecting once — see what it costs you over the following rounds."
        }
      />
    </SimShell>
  );
}

/* ---- noise ---- */
type NoiseResult = { cells: ("cc" | "half" | "dd")[]; msg: string };
function runNoise(noisePctV: number, gen: boolean): NoiseResult {
  const noise = noisePctV / 100;
  const ROUNDS = 60;
  let a: "C" | "D" = "C";
  let b: "C" | "D" = "C";
  let coop = 0;
  const cells: ("cc" | "half" | "dd")[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    const seeB: "C" | "D" =
      Math.random() < noise ? (b === "C" ? "D" : "C") : b;
    const seeA: "C" | "D" =
      Math.random() < noise ? (a === "C" ? "D" : "C") : a;
    let na: "C" | "D" = seeB;
    let nb: "C" | "D" = seeA;
    if (gen) {
      if (na === "D" && Math.random() < 0.34) na = "C";
      if (nb === "D" && Math.random() < 0.34) nb = "C";
    }
    a = na;
    b = nb;
    const cls =
      a === "C" && b === "C" ? "cc" : a === "D" && b === "D" ? "dd" : "half";
    if (a === "C" && b === "C") coop++;
    cells.push(cls);
  }
  const pct = Math.round((coop / ROUNDS) * 100);
  let msg = `Mutual cooperation: <b>${pct}%</b> of rounds. `;
  if (noise === 0) msg += "No noise, perfect peace. Now raise the slider.";
  else if (!gen && pct < 55)
    msg +=
      "One misreading starts an echo of retaliation — <b>nobody cheated</b>, and cooperation still died. Try the generous strategy.";
  else if (gen)
    msg +=
      "Forgiveness absorbs the false alarms. This is why real regimes need error tolerance, not just detection.";
  else msg += "Watch what happens as misreadings accumulate.";
  return { cells, msg };
}

function SimNoise() {
  const [noisePct, setNoisePct] = useState(0);
  const [generous, setGenerous] = useState(false);
  const [result, setResult] = useState<NoiseResult>(() => runNoise(0, false));

  const rerun = (noisePctV: number, gen: boolean) => {
    // mirror the old effect: only re-simulate when an input actually changes
    if (noisePctV === noisePct && gen === generous) return;
    setNoisePct(noisePctV);
    setGenerous(gen);
    setResult(runNoise(noisePctV, gen));
  };

  return (
    <SimShell eyebrow="Toy · two well-meaning tit-for-tat players, imperfect monitoring">
      <LabeledSlider
        label="chance a move is misread"
        min={0}
        max={30}
        step={2}
        value={noisePct}
        onChange={(v) => rerun(v, generous)}
        display={`${noisePct}%`}
      />
      <div className="my-2 flex flex-wrap items-center gap-2.5">
        <span className="text-muted-foreground min-w-[150px] font-mono text-[11px]">
          forgiveness
        </span>
        <SimButton pressed={!generous} onClick={() => rerun(noisePct, false)}>
          strict tit-for-tat
        </SimButton>
        <SimButton pressed={generous} onClick={() => rerun(noisePct, true)}>
          generous (forgives ~⅓)
        </SimButton>
      </div>
      <div className="my-2 flex flex-wrap gap-1">
        {result.cells.map((c, i) => (
          <span
            key={i}
            className={cn("size-3.5 rounded border", stripClass(c))}
          />
        ))}
      </div>
      <SimMsg html={result.msg} />
    </SimShell>
  );
}

/* ---- detect ---- */
function SimDetect() {
  const [p, setP] = useState(20);
  const [c, setC] = useState(5);
  const ev = (p / 100) * c;
  const deterred = ev > 3;
  return (
    <SimShell eyebrow="Toy · does cheating pay? (gain from cheating fixed at 3)">
      <LabeledSlider
        label="chance of getting caught"
        min={0}
        max={100}
        value={p}
        onChange={setP}
        display={`${p}%`}
      />
      <LabeledSlider
        label="penalty if caught"
        min={0}
        max={10}
        value={c}
        onChange={setC}
        display={`${c}`}
      />
      <div className="my-2">
        <div className="text-muted-foreground mb-1 flex justify-between font-mono text-[10.5px]">
          <span>expected penalty (chance × cost)</span>
          <span>{ev.toFixed(1)}</span>
        </div>
        <Bar color="red" pct={ev * 10} />
      </div>
      <div className="my-2">
        <div className="text-muted-foreground mb-1 flex justify-between font-mono text-[10.5px]">
          <span>gain from cheating</span>
          <span>3.0</span>
        </div>
        <Bar color="amber" pct={30} />
      </div>
      <div>
        <span
          className={cn(
            "mt-1.5 inline-block rounded-lg px-3 py-1.5 font-mono text-[12px] tracking-[0.04em]",
            deterred
              ? "bg-comply/10 text-comply"
              : "bg-defect/10 text-defect",
          )}
        >
          {deterred
            ? "cheating doesn't pay — deterred"
            : "cheating pays — expect violations"}
        </span>
      </div>
      <SimMsg html="Two ways to deter: bigger threats, or better sensors. Slide <b>detection</b> up with a modest penalty — then try a huge penalty with near-zero detection. Same math; very different worlds to live in." />
    </SimShell>
  );
}

/* ---- inspect ---- */
type InspectState = { counts: number[]; n: number; caught: number };
const INSPECT_INIT_MSG =
  "Each round the violator hides at one site — they avoid wherever you inspect most. Click a site to inspect it.";

function violatorPick(counts: number[]): number {
  const min = Math.min(...counts);
  const candidates: number[] = [];
  counts.forEach((c, i) => {
    if (c === min) candidates.push(i);
  });
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/* pure step: returns the next state plus whether the violation was caught */
function inspectStep(
  st: InspectState,
  site: number,
): { next: InspectState; hit: boolean; v: number } {
  const v = violatorPick(st.counts);
  const counts = st.counts.slice();
  counts[site]++;
  const hit = v === site;
  return {
    next: { counts, n: st.n + 1, caught: st.caught + (hit ? 1 : 0) },
    hit,
    v,
  };
}

function SimInspect() {
  const [st, setSt] = useState<InspectState>({
    counts: [0, 0, 0, 0],
    n: 0,
    caught: 0,
  });
  const [msg, setMsg] = useState(INSPECT_INIT_MSG);

  const inspect = (site: number) => {
    const { next, hit, v } = inspectStep(st, site);
    setSt(next);
    setMsg(
      hit
        ? `<b>Caught!</b> You inspected Site ${site + 1} and the violation was there.`
        : `You inspected Site ${site + 1}; the violation was at Site ${v + 1}. They're avoiding your favorites — check your rate.`,
    );
  };
  const reset = () => {
    setSt({ counts: [0, 0, 0, 0], n: 0, caught: 0 });
    setMsg(INSPECT_INIT_MSG);
  };
  const auto1 = () => {
    let s: InspectState = { counts: [0, 0, 0, 0], n: 0, caught: 0 };
    for (let i = 0; i < 40; i++) s = inspectStep(s, 0).next;
    setSt(s);
    setMsg(
      "Predictable inspector: the violator learns your pattern and simply goes elsewhere. Catch rate collapses toward <b>0%</b>.",
    );
  };
  const auto2 = () => {
    let s: InspectState = { counts: [0, 0, 0, 0], n: 0, caught: 0 };
    for (let i = 0; i < 40; i++)
      s = inspectStep(s, Math.floor(Math.random() * 4)).next;
    setSt(s);
    setMsg(
      "Random inspector: no pattern to exploit, so the violator can't do better than guessing — you catch them about <b>1 in 4</b>. With scarce inspections, <b>randomness is the optimal strategy</b>.",
    );
  };
  return (
    <SimShell eyebrow="Toy · you have 1 inspection, 4 sites. The violator studies your habits.">
      <div className="my-1.5 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <SimButton key={i} onClick={() => inspect(i)}>
            Site {i + 1}
          </SimButton>
        ))}
      </div>
      <div>
        <SimButton onClick={() => inspect(Math.floor(Math.random() * 4))}>
          inspect a random site
        </SimButton>
        <SimButton onClick={auto1}>auto: &ldquo;always Site 1&rdquo; × 40</SimButton>
        <SimButton onClick={auto2}>auto: random × 40</SimButton>
        <SimButton onClick={reset}>reset</SimButton>
      </div>
      <div className="text-muted-foreground my-2 flex flex-wrap gap-4 font-mono text-[12px] [&_b]:text-foreground [&_b]:text-[15px]">
        <span>rounds <b>{st.n}</b></span>
        <span>caught <b>{st.caught}</b></span>
        <span>
          catch rate <b>{st.n ? `${Math.round((st.caught / st.n) * 100)}%` : "–"}</b>
        </span>
      </div>
      <SimMsg html={msg} />
    </SimShell>
  );
}

/* ---- winset ---- */
function SimWinset() {
  const [a, setA] = useState(70);
  const [b, setB] = useState(40);
  const overlap = a >= b;
  let msg: string;
  if (!overlap)
    msg =
      "<b>No overlap — no deal is possible</b>, even if both leaders want one. This is how agreements die at home.";
  else if (a - b < 15)
    msg = `A sliver of overlap (<b>${a - b} points wide</b>). Notice: the side with the <b>smaller</b> win-set forces the deal toward its end — &ldquo;my Senate will never pass more&rdquo; is leverage.`;
  else
    msg = `Deal zone: <b>${a - b} points wide</b> (green). Now shrink your own side's range and watch where the surviving deals sit.`;
  return (
    <SimShell eyebrow="Toy · a deal is any point both capitals can ratify">
      <LabeledSlider
        label="Side A ratifies deals up to…"
        min={0}
        max={100}
        value={a}
        onChange={setA}
        display={`${a}`}
      />
      <LabeledSlider
        label="Side B ratifies deals from…"
        min={0}
        max={100}
        value={b}
        onChange={setB}
        display={`${b}`}
      />
      <div className="bg-muted border-border relative my-2.5 h-8 overflow-hidden rounded-lg border">
        <div
          className="bg-primary/20 border-primary absolute top-0 left-0 h-full border-r-2"
          style={{ width: `${a}%` }}
        />
        <div
          className="bg-defect/15 border-defect absolute top-0 right-0 h-full border-l-2"
          style={{ width: `${100 - b}%` }}
        />
        {overlap && (
          <div
            className="bg-comply/40 absolute top-0 h-full"
            style={{ left: `${b}%`, width: `${a - b}%` }}
          />
        )}
      </div>
      <SimMsg html={msg} />
    </SimShell>
  );
}

/* ---- evidence ---- */
function SimEvidence() {
  const [q, setQ] = useState(90);
  const [n, setN] = useState(1);
  const r = Math.pow(q / 100, n);
  const rPct = r * 100;
  const msg =
    n === 1
      ? "One very good deception beats one sensor 9 times in 10. Now add streams: declarations, satellites, on-site visits, supply-chain data, whistleblowers…"
      : `Even at ${q}% per sensor, ${n} independent streams leave the lie a <b>${rPct.toFixed(1)}%</b> survival chance. The goal isn't an unfoolable sensor — it's making honesty the cheapest available policy.`;
  return (
    <SimShell eyebrow="Toy · odds of fooling every independent sensor at once">
      <LabeledSlider
        label="chance of fooling one sensor"
        min={50}
        max={99}
        value={q}
        onChange={setQ}
        display={`${q}%`}
      />
      <LabeledSlider
        label="independent evidence streams"
        min={1}
        max={10}
        value={n}
        onChange={setN}
        display={`${n}`}
      />
      <div className="my-2">
        <div className="text-muted-foreground mb-1 flex justify-between font-mono text-[10.5px]">
          <span>chance the lie survives all of them</span>
          <span>{rPct.toFixed(1)}%</span>
        </div>
        <Bar color="red" pct={rPct} />
      </div>
      <SimMsg html={msg} />
    </SimShell>
  );
}

const SIM_MAP: Record<SimId, () => React.ReactElement> = {
  pd: SimPD,
  nash: SimNash,
  repeat: SimRepeat,
  noise: SimNoise,
  detect: SimDetect,
  inspect: SimInspect,
  winset: SimWinset,
  evidence: SimEvidence,
};

/* ============================== HTML body renderer ============================== */
/* CONTENT.body / links contain authored HTML with <a data-node="..."> links
   that must reopen a node. We render via dangerouslySetInnerHTML and delegate
   clicks on data-node anchors. */

function AuthoredHtml({
  html,
  onNode,
  className,
}: {
  html: string;
  onNode: (id: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      const target = (e.target as HTMLElement).closest(
        "a[data-node]",
      ) as HTMLElement | null;
      if (target) {
        e.preventDefault();
        const id = target.getAttribute("data-node");
        if (id) onNode(id);
      }
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [html, onNode]);
  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ============================== quiz ============================== */

type QResult = { items: QItem[]; idx: number; score: number; missed: QItem[] };
type ShuffledOpt = { text: string; correct: boolean };

function drawQuiz(): QItem[] {
  let items: QItem[] = [];
  (["t1", "t2", "t3", "t4", "t5"] as const).forEach((th) => {
    items = items.concat(
      shuffle(QBANK.filter((q) => q.t === th)).slice(0, 2),
    );
  });
  return shuffle(items);
}

function QuizDialog({
  open,
  onOpenChange,
  onNode,
  onFinished,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onNode: (id: string) => void;
  onFinished: () => void;
}) {
  const [qz, setQz] = useState<QResult>({ items: [], idx: 0, score: 0, missed: [] });
  const [opts, setOpts] = useState<ShuffledOpt[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [phase, setPhase] = useState<"q" | "results">("q");

  const loadQ = useCallback((items: QItem[], idx: number) => {
    const it = items[idx];
    setOpts(
      shuffle(it.opts.map((o, i) => ({ text: o, correct: i === it.a }))),
    );
    setChosen(null);
  }, []);

  const start = useCallback(() => {
    const items = drawQuiz();
    setQz({ items, idx: 0, score: 0, missed: [] });
    setPhase("q");
    loadQ(items, 0);
  }, [loadQ]);

  // (re)start whenever the dialog opens — adjust state during render on the
  // open→true transition instead of syncing from an effect.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) start();
  }

  const answer = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    setQz((s) => {
      const it = s.items[s.idx];
      const right = opts[i].correct;
      return {
        ...s,
        score: right ? s.score + 1 : s.score,
        missed: right ? s.missed : [...s.missed, it],
      };
    });
  };

  const next = () => {
    const last = qz.idx === qz.items.length - 1;
    if (last) {
      setPhase("results");
      onFinished();
    } else {
      const nextIdx = qz.idx + 1;
      setQz((s) => ({ ...s, idx: nextIdx }));
      loadQ(qz.items, nextIdx);
    }
  };

  const it = qz.items[qz.idx];
  const last = qz.idx === qz.items.length - 1;
  const n = qz.items.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-3 overflow-y-auto sm:max-w-xl">
        {phase === "q" && it ? (
          <>
            <p className="text-muted-foreground font-mono text-[10.5px] tracking-[0.16em] uppercase">
              Self-check · question {qz.idx + 1} of {n} · {THREAD_NAME[it.t]}
            </p>
            <DialogTitle className="text-base leading-snug font-semibold">
              {it.q}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Multiple choice self-check question
            </DialogDescription>
            <div className="space-y-2">
              {opts.map((o, i) => {
                const revealed = chosen !== null;
                const isChosen = chosen === i;
                const showRight = revealed && o.correct;
                const showWrong = revealed && isChosen && !o.correct;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed}
                    onClick={() => answer(i)}
                    className={cn(
                      "border-border w-full rounded-lg border bg-card px-3.5 py-2.5 text-left text-sm transition-colors",
                      !revealed && "hover:border-primary hover:bg-muted",
                      showRight && "border-comply bg-comply/10",
                      showWrong && "border-defect bg-defect/10",
                    )}
                  >
                    {o.text}
                    {showRight && (
                      <span className="text-comply ml-2 font-mono text-[10px] tracking-wide uppercase">
                        {isChosen ? "✓ correct" : "✓ answer"}
                      </span>
                    )}
                    {showWrong && (
                      <span className="text-defect ml-2 font-mono text-[10px] tracking-wide uppercase">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {chosen !== null && (
              <>
                <p className="border-exaggerate bg-muted/50 text-muted-foreground rounded-lg border-l-[3px] p-3 text-[13px]">
                  {it.ex}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" onClick={() => onOpenChange(false)}>
                    quit
                  </Button>
                  <Button onClick={next} autoFocus>
                    {last ? "see results →" : "next question →"}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-muted-foreground font-mono text-[10.5px] tracking-[0.16em] uppercase">
              Self-check · results
            </p>
            <DialogTitle className="sr-only">Self-check results</DialogTitle>
            <DialogDescription className="sr-only">
              Your self-check score
            </DialogDescription>
            <p className="text-2xl font-semibold">
              You got{" "}
              <span className="text-comply font-semibold">
                {qz.score} of {n}
              </span>
            </p>
            {qz.score === n ? (
              <p className="text-muted-foreground text-sm">
                Clean sweep. You&rsquo;re ready for the module — go argue with the
                readings.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground text-sm">
                  Worth a revisit (each link reopens the node):
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  {qz.missed.map((m, i) => (
                    <li key={i} className="text-muted-foreground text-[13.5px]">
                      <button
                        type="button"
                        className="text-primary underline underline-offset-2 hover:text-foreground"
                        onClick={() => {
                          onOpenChange(false);
                          onNode(m.node);
                        }}
                      >
                        {nodeById(m.node)?.title}
                      </button>{" "}
                      — {THREAD_NAME[m.t]}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button variant="outline" onClick={start} className="gap-2">
                <RotateCcw className="size-4" aria-hidden /> retake — new random draw
              </Button>
              <Button onClick={() => onOpenChange(false)}>back to map</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ============================== main widget ============================== */

export function GameTheoryPrimer({ onComplete }: VerificationWidgetProps) {
  const [path, setPath] = useState<string | null>(null); // path key | "wander" | null
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState<string | null>(null);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /* hydrate from localStorage (keys matched to source page) */
  useEffect(() => {
    let restoredPath: string | null = null;
    let restoredVisited: string[] = [];
    try {
      const sp = localStorage.getItem(LS_PATH);
      if (sp && (PATHS[sp] || sp === "wander")) restoredPath = sp;
      restoredVisited = JSON.parse(
        localStorage.getItem(LS_VISITED) || "[]",
      ) as string[];
    } catch {
      /* ignore */
    }
    // Apply the restored progress off the synchronous effect body (a microtask)
    // so the initial client render still matches the server (empty) markup and
    // the `hydrated` flag gates the progress strips against a hydration mismatch.
    queueMicrotask(() => {
      if (restoredPath !== null) setPath(restoredPath);
      setVisited(new Set(restoredVisited));
      setHydrated(true);
    });
  }, []);

  const persist = useCallback(
    (p: string | null, v: Set<string>) => {
      try {
        localStorage.setItem(LS_PATH, p || "");
        localStorage.setItem(LS_VISITED, JSON.stringify(Array.from(v)));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const openNode = useCallback(
    (id: string) => {
      if (!nodeById(id) || !CONTENT[id]) return;
      setCurrent(id);
      setVisited((prev) => {
        const nv = new Set(prev);
        nv.add(id);
        persist(path, nv);
        return nv;
      });
    },
    [path, persist],
  );

  const choosePath = useCallback(
    (p: string) => {
      setPath(p);
      setVisited((v) => {
        persist(p, v);
        return v;
      });
      if (p !== "wander") {
        const first =
          PATHS[p].ids.find((id) => !visited.has(id)) ?? PATHS[p].ids[0];
        // small delay to mirror the source's open-after-scroll feel
        setTimeout(() => openNode(first), 60);
      }
    },
    [openNode, persist, visited],
  );

  const pathIds = useMemo(
    () => (path && path !== "wander" ? PATHS[path].ids : null),
    [path],
  );

  /* derived progress */
  const progress = useMemo(() => {
    if (!path || path === "wander") return null;
    const p = PATHS[path];
    const done = p.ids.filter((id) => visited.has(id));
    const left = p.ids
      .filter((id) => !visited.has(id))
      .reduce((sum, id) => sum + (nodeById(id)?.min ?? 0), 0);
    return { p, done: done.length, total: p.ids.length, left };
  }, [path, visited]);

  const currentNode = current ? nodeById(current) : null;
  const currentContent = current ? CONTENT[current] : null;
  const curIdx = pathIds && current ? pathIds.indexOf(current) : -1;

  const gotoPrev = () => {
    if (pathIds && curIdx > 0) openNode(pathIds[curIdx - 1]);
  };
  const gotoNext = () => {
    if (!pathIds) return;
    if (curIdx < pathIds.length - 1) openNode(pathIds[curIdx + 1]);
    else setCurrent(null);
  };

  const Sim = currentNode?.sim ? SIM_MAP[currentNode.sim] : null;

  return (
    <div className="not-prose my-6">
      <div>
        {/* doors */}
        <div className="grid gap-3 sm:grid-cols-3">
          {DOORS.map((d) => {
            const active = path === d.path;
            const accent =
              d.cls === "d1"
                ? "text-comply"
                : d.cls === "d2"
                  ? "text-exaggerate"
                  : "text-hide";
            return (
              <button
                key={d.path}
                type="button"
                aria-pressed={active}
                onClick={() => choosePath(d.path)}
                className={cn(
                  "border-border hover:border-primary rounded-xl border bg-card p-4 text-left transition-colors",
                  active && "border-primary ring-primary/30 ring-1",
                )}
              >
                <span
                  className={cn(
                    "mb-1.5 block font-mono text-[10.5px] tracking-[0.14em] uppercase",
                    accent,
                  )}
                >
                  {d.eyebrow}
                </span>
                <span className="block text-base font-semibold">{d.h3}</span>
                <span className="text-muted-foreground mt-1 block text-[13px] leading-snug">
                  {d.p}
                </span>
                <span className="text-comply mt-2 block font-mono text-[10.5px] tracking-wide">
                  {d.time}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground mt-2.5 text-center text-[13px]">
          {C.wanderPre}
          <button
            type="button"
            className="text-primary underline underline-offset-2 hover:text-foreground"
            onClick={() => choosePath("wander")}
          >
            {C.wanderBtn}
          </button>
          {C.wanderPost}
        </p>

        {/* progress strip */}
        {hydrated && path === "wander" && (
          <div className="border-border bg-muted/40 mt-4 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2">
            <span className="text-primary font-mono text-[11px] tracking-[0.14em] uppercase">
              Wandering freely
            </span>
            <span className="text-muted-foreground font-mono text-[11.5px]">
              <b className="text-comply font-semibold">{visited.size}</b> /{" "}
              {NODES.length} nodes visited
            </span>
          </div>
        )}
        {hydrated && progress && (
          <div className="border-border bg-muted/40 mt-4 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2">
            <span className="text-primary font-mono text-[11px] tracking-[0.14em] uppercase">
              Path · {progress.p.label}
            </span>
            <span className="flex items-center gap-1.5">
              {progress.p.ids.map((id, i) => {
                const v = visited.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    title={`${i + 1}. ${nodeById(id)?.title}`}
                    aria-label={nodeById(id)?.title}
                    onClick={() => openNode(id)}
                    className={cn(
                      "size-2.5 rounded-full border",
                      v
                        ? "bg-comply border-comply"
                        : "border-muted-foreground/50 bg-transparent",
                    )}
                  />
                );
              })}
            </span>
            <span className="text-muted-foreground font-mono text-[11.5px]">
              <b className="text-comply font-semibold">
                {progress.done}/{progress.total}
              </b>{" "}
              stops · ~{progress.left} min left
              {progress.done === progress.total &&
                " · done — try the self-check below the map"}
            </span>
          </div>
        )}

        {/* the map */}
        <div className="border-border bg-muted/20 shadow-soft mt-4 overflow-x-auto rounded-xl border">
          <svg
            viewBox="0 0 1080 640"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Concept map of the primer"
            className="block h-auto w-full min-w-[980px]"
          >
            {THREADS.map((th) => (
              <g key={th.id}>
                <text
                  x={th.x}
                  y={42}
                  textAnchor="middle"
                  fill={THREAD_COLORS[th.id]}
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                >
                  {th.name}
                </text>
                <text
                  x={th.x}
                  y={60}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  className="text-[12px] italic"
                >
                  {th.q}
                </text>
              </g>
            ))}
            {EDGES.map((e, i) => {
              const a = nodeById(e[0])!;
              const b = nodeById(e[1])!;
              const cross = e[2] === "cross";
              return (
                <path
                  key={i}
                  d={edgePath(a, b)}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={cross ? 1.2 : 1.4}
                  strokeDasharray={cross ? "4 4" : undefined}
                  opacity={cross ? 0.6 : 1}
                />
              );
            })}
            {NODES.map((n) => {
              const color = THREAD_COLORS[n.t];
              const onPath = pathIds ? pathIds.indexOf(n.id) : -1;
              const dim = !!pathIds && onPath < 0;
              const isVisited = visited.has(n.id);
              const meta = `~${n.min} min${n.sim ? " · ▸ sim" : ""}`;
              return (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  aria-label={n.title}
                  className="cursor-pointer focus:outline-none"
                  opacity={dim ? 0.32 : 1}
                  onClick={() => openNode(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openNode(n.id);
                    }
                  }}
                >
                  <rect
                    x={n.x - NW / 2}
                    y={n.y - NH / 2}
                    width={NW}
                    height={NH}
                    rx={9}
                    fill="var(--card)"
                    stroke={color}
                    strokeWidth={1.4}
                  />
                  <text
                    x={n.x}
                    y={n.y - 2}
                    textAnchor="middle"
                    fill="var(--foreground)"
                    className="text-[14.5px]"
                  >
                    {n.short || n.title}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 16}
                    textAnchor="middle"
                    fill="var(--muted-foreground)"
                    className="font-mono text-[8.5px] tracking-[0.12em] uppercase"
                  >
                    {meta}
                  </text>
                  {onPath >= 0 && (
                    <>
                      <circle
                        cx={n.x - NW / 2 + 2}
                        cy={n.y - NH / 2 + 2}
                        r={11}
                        fill={color}
                      />
                      <text
                        x={n.x - NW / 2 + 2}
                        y={n.y - NH / 2 + 5.5}
                        textAnchor="middle"
                        fill="var(--card)"
                        className="font-mono text-[10px] font-bold"
                      >
                        {onPath + 1}
                      </text>
                    </>
                  )}
                  {isVisited && (
                    <text
                      x={n.x + NW / 2 - 12}
                      y={n.y - NH / 2 + 16}
                      textAnchor="middle"
                      fill={THREAD_COLORS.t1}
                      className="font-mono text-[11px] font-bold"
                    >
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* legend */}
        <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-4 font-mono text-[11px]">
          {THREADS.map((th) => (
            <span key={th.id} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ background: THREAD_COLORS[th.id] }}
              />
              {th.name}
            </span>
          ))}
          <span>{C.legendPlayable}</span>
          <span>{C.legendVisited}</span>
          <button
            type="button"
            className="text-primary inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            onClick={() => setShelfOpen(true)}
          >
            <BookOpen className="size-3.5" aria-hidden /> {C.legendSources}
          </button>
        </div>

        {/* quiz card */}
        <div className="border-border bg-muted/30 mx-auto mt-6 max-w-lg rounded-xl border p-5 text-center">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
            {C.quizEyebrow}
          </p>
          <h4 className="mt-1 text-lg font-semibold">{C.quizTitle}</h4>
          <p className="text-muted-foreground mx-auto mt-1.5 max-w-md text-[13.5px]">
            {C.quizBlurb}
          </p>
          <Button className="mt-4" onClick={() => setQuizOpen(true)}>
            {C.quizStart}
          </Button>
        </div>

        {/* instructor LO map */}
        <details className="mx-auto mt-6 max-w-3xl">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-center font-mono text-[11px] tracking-[0.16em] uppercase">
            {C.instructorSummary}
          </summary>
          <div className="border-border mt-3 overflow-hidden rounded-lg border">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="border-border border-b p-2.5 px-3 text-left font-mono text-[10px] tracking-[0.16em] uppercase">
                    LO
                  </th>
                  <th className="border-border border-b p-2.5 px-3 text-left font-mono text-[10px] tracking-[0.16em] uppercase">
                    Thread
                  </th>
                  <th className="border-border border-b p-2.5 px-3 text-left font-mono text-[10px] tracking-[0.16em] uppercase">
                    The learner can…
                  </th>
                </tr>
              </thead>
              <tbody>
                {LO_MAP.map((r) => (
                  <tr key={r.lo}>
                    <td className="border-border text-exaggerate border-b p-2.5 px-3 align-top font-mono text-[11.5px] whitespace-nowrap">
                      {r.lo}
                    </td>
                    <td className="border-border text-muted-foreground border-b p-2.5 px-3 align-top whitespace-nowrap">
                      {r.thread}
                    </td>
                    <td className="border-border text-muted-foreground border-b p-2.5 px-3 align-top">
                      {r.can}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* ---- node modal ---- */}
      <Dialog
        open={current !== null}
        onOpenChange={(o) => {
          if (!o) setCurrent(null);
        }}
      >
        {currentNode && currentContent && (
          <DialogContent className="max-h-[92vh] gap-3 overflow-y-auto sm:max-w-2xl">
            <p
              className="font-mono text-[10.5px] tracking-[0.18em] uppercase"
              style={{ color: THREAD_COLORS[currentNode.t] }}
            >
              {currentContent.thread} · ~{currentNode.min} min
              {curIdx >= 0 &&
                pathIds &&
                ` · stop ${curIdx + 1} of ${pathIds.length}`}
            </p>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {currentNode.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {currentContent.thread}
            </DialogDescription>

            <AuthoredHtml
              html={currentContent.body}
              onNode={openNode}
              className={cn(
                "text-foreground/90 space-y-2.5 text-[14.5px]",
                "[&_p.hook]:bg-muted/60 [&_p.hook]:text-muted-foreground [&_p.hook]:border-comply [&_p.hook]:rounded-lg [&_p.hook]:border-l-[3px] [&_p.hook]:p-3 [&_p.hook]:text-[13.5px]",
                "[&_p.hook_b]:text-comply [&_p.hook_b]:font-mono [&_p.hook_b]:text-[10.5px] [&_p.hook_b]:tracking-wide [&_p.hook_b]:uppercase",
                "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-foreground [&_a[data-node]]:cursor-pointer",
              )}
            />

            {Sim && <Sim />}

            <AuthoredHtml
              html={currentContent.links}
              onNode={openNode}
              className={cn(
                "border-border text-muted-foreground mt-2 border-t pt-2.5 text-[12.5px] leading-[1.8]",
                "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-foreground [&_a[data-node]]:cursor-pointer",
              )}
            />

            {/* nav */}
            {curIdx >= 0 && pathIds ? (
              <div className="border-border mt-2 flex items-center justify-between gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={curIdx === 0}
                  onClick={gotoPrev}
                >
                  {curIdx > 0
                    ? `← ${nodeById(pathIds[curIdx - 1])?.title}`
                    : "← previous"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrent(null)}>
                  map
                </Button>
                <Button size="sm" onClick={gotoNext} ref={closeBtnRef}>
                  {curIdx < pathIds.length - 1
                    ? `next: ${nodeById(pathIds[curIdx + 1])?.title} →`
                    : "finish — back to map"}
                </Button>
              </div>
            ) : (
              <div className="border-border mt-2 flex justify-end border-t pt-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrent(null)}>
                  map
                </Button>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* ---- bookshelf modal ---- */}
      <Dialog open={shelfOpen} onOpenChange={setShelfOpen}>
        <DialogContent className="max-h-[92vh] gap-3 overflow-y-auto sm:max-w-2xl">
          <p className="text-muted-foreground font-mono text-[10.5px] tracking-[0.18em] uppercase">
            {SHELF_EYEBROW}
          </p>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {SHELF_TITLE}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Every source referenced in the primer.
          </DialogDescription>
          <ol className="mt-1 space-y-0">
            {SHELF.map((s, i) => (
              <li
                key={i}
                className="border-border grid grid-cols-[30px_1fr_auto] items-baseline gap-x-2.5 gap-y-1 border-b py-2.5 text-sm last:border-b-0"
              >
                <span className="text-muted-foreground font-mono text-[10.5px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <AuthoredHtml
                  html={s.html}
                  onNode={() => {}}
                  className={cn(
                    "[&_.s-note]:text-muted-foreground [&_.s-note]:mt-0.5 [&_.s-note]:block [&_.s-note]:text-[12.5px]",
                    "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-foreground",
                  )}
                />
                <span className="text-comply font-mono text-[10.5px] whitespace-nowrap">
                  {s.time}
                </span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>

      {/* ---- quiz modal ---- */}
      <QuizDialog
        open={quizOpen}
        onOpenChange={setQuizOpen}
        onNode={openNode}
        onFinished={onComplete}
      />
    </div>
  );
}
