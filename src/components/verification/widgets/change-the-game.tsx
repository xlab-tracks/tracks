"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Term, TermText } from "@/components/verification/kit/term";
import type { VerificationWidgetProps } from "../kit/types";
import { CTG_COPY as COPY } from "@/lib/verification/data/change-the-game";
import {
  CONFIG,
  basePayoffs,
  classify,
  effPayoffs,
  equilibria,
  type EffPayoffs,
  type GameFamily,
  type LabState,
  type Move,
  type Payoffs,
  type PersonaType,
  labDefaults,
  pacMove,
  repeatMultiplier,
  repeatedVerdict,
} from "@/lib/verification/engines/change-the-game";

/* ---------------- small formatting helpers (ported) ---------------------- */
function fmt(n: number): string {
  const r = Math.round(n);
  return (r > 0 ? "+" : "") + r;
}
function tpl(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : "{" + k + "}",
  );
}

/** Renders trusted authored copy that may contain <b>/<i> tags and
 * [[term]] / [[display|term]] tooltip markup. HTML tags are converted to real
 * elements; term markup routes through the kit's TermText/Term. */
function Rich({ text, className }: { text: string; className?: string }) {
  const nodes = useMemo(() => parseRich(text), [text]);
  return (
    <span className={className}>
      {nodes.map((n, i) => (
        <Fragment key={i}>{n}</Fragment>
      ))}
    </span>
  );
}

const TERM_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// Split into <b>/<i> segments first, then term markup within each text run.
function parseRich(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const tagRe = /<(b|i)>([\s\S]*?)<\/\1>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = tagRe.exec(text))) {
    if (m.index > last) pushTerms(out, text.slice(last, m.index), () => key++);
    const inner = m[2];
    if (m[1] === "b") {
      out.push(
        <strong key={`tag-${key++}`} className="font-semibold">
          {termNodes(inner, () => key++)}
        </strong>,
      );
    } else {
      out.push(
        <em key={`tag-${key++}`} className="italic">
          {termNodes(inner, () => key++)}
        </em>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) pushTerms(out, text.slice(last), () => key++);
  return out;
}

function pushTerms(out: React.ReactNode[], text: string, nextKey: () => number) {
  for (const node of termNodes(text, nextKey)) out.push(node);
}

function termNodes(text: string, nextKey: () => number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TERM_RE.lastIndex = 0;
  while ((m = TERM_RE.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const display = m[1];
    const key = (m[2] || m[1]).toLowerCase();
    const def = COPY.tips[key] ?? "";
    parts.push(
      <Term key={`t-${nextKey()}`} definition={def}>
        {display}
      </Term>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/* ================================================================
   Payoff matrix component
   ================================================================ */
type CellDeco = {
  dim?: boolean;
  ask?: boolean;
  best?: boolean;
  tag?: string;
};

function grid(e: Payoffs): number[][] {
  return [
    [e.R, e.S],
    [e.T, e.P],
  ];
}

function Matrix({
  eff,
  base,
  eqs = [],
  deco = {},
  pulse = false,
  legend = false,
  onCellClick,
}: {
  eff: Payoffs;
  base?: Payoffs | null;
  eqs?: string[];
  deco?: Record<string, CellDeco>;
  pulse?: boolean;
  legend?: boolean;
  onCellClick?: (i: number, j: number) => void;
}) {
  const M = grid(eff);
  const B = base ? grid(base) : null;

  return (
    <div className="max-w-[560px]">
      <div
        role="table"
        aria-label="Payoff matrix"
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "minmax(58px,auto) 1fr 1fr" }}
      >
        <div />
        <div className="text-exaggerate col-span-2 pb-0.5 text-center font-mono text-[11px] font-bold tracking-[0.14em] uppercase">
          {COPY.mx.pacShort}
        </div>
        <div />
        {COPY.mx.cols.map((cl) => (
          <div
            key={cl}
            className="text-muted-foreground flex items-center justify-center text-center font-mono text-[10px] tracking-[0.08em] uppercase"
          >
            {cl}
          </div>
        ))}
        {[0, 1].map((i) => (
          <Fragment key={i}>
            <div className="text-muted-foreground flex items-center justify-end pr-1 text-right font-mono text-[10px] tracking-[0.08em] uppercase">
              {COPY.mx.rows[i]}
            </div>
            {[0, 1].map((j) => {
              const key = `${i}${j}`;
              const d = deco[key] ?? {};
              const isEq = eqs.includes(key);
              const cellPulse = pulse && isEq;
              const showTag = d.best ? true : isEq;
              const tagText = d.tag ?? (d.best ? COPY.mx.bestTag : COPY.mx.eqTag);
              const changed =
                B && Math.round(B[i][j]) !== Math.round(M[i][j]);
              const interactive = !!onCellClick && !!d.ask;
              return (
                <div
                  key={j}
                  role={interactive ? "button" : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  onClick={interactive ? () => onCellClick?.(i, j) : undefined}
                  onKeyDown={
                    interactive
                      ? (ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            onCellClick?.(i, j);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "bg-card relative min-h-[96px] rounded-lg border-[1.5px] px-2.5 pt-6 pb-2 transition-all",
                    "border-border",
                    isEq && "border-comply",
                    d.best && "border-primary bg-primary/5",
                    d.ask && "border-hide bg-hide/5 cursor-pointer",
                    d.dim && "opacity-40",
                    cellPulse && "motion-safe:animate-pulse",
                    interactive &&
                      "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
                  )}
                >
                  {showTag && (
                    <span
                      className={cn(
                        "absolute inset-x-2 top-1.5 overflow-hidden font-mono text-[9px] tracking-[0.1em] text-ellipsis whitespace-nowrap uppercase",
                        d.best ? "text-primary" : "text-comply",
                      )}
                    >
                      {tagText}
                    </span>
                  )}
                  <div className="flex items-baseline justify-between gap-1.5 text-xs">
                    <span className="text-muted-foreground text-[10px]">
                      {COPY.mx.youShort}
                    </span>
                    <b className="text-hide font-mono text-[15px] font-bold tabular-nums">
                      {fmt(M[i][j])}
                    </b>
                  </div>
                  <div className="flex items-baseline justify-between gap-1.5 text-xs">
                    <span className="text-muted-foreground text-[10px]">
                      {COPY.mx.pacShort}
                    </span>
                    <b className="text-exaggerate font-mono text-[15px] font-bold tabular-nums">
                      {fmt(M[j][i])}
                    </b>
                  </div>
                  {changed && (
                    <div className="text-muted-foreground mt-1 min-h-[13px] font-mono text-[9.5px]">
                      {tpl(COPY.mx.was, { n: fmt(B![i][j]) })}
                    </div>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
      {legend && (
        <p className="text-muted-foreground mt-2.5 max-w-[560px] text-xs">
          <TermText text={COPY.mx.legend} glossary={COPY.tips} />
        </p>
      )}
    </div>
  );
}

// build focus/dim decoration for a given column
function columnDeco(
  focusCol: number | null,
  ask: number | null,
): Record<string, CellDeco> {
  const d: Record<string, CellDeco> = {};
  if (focusCol == null) return d;
  for (const key of ["00", "01", "10", "11"]) {
    const j = +key[1];
    d[key] = {
      dim: j !== focusCol,
      ask: ask === j,
    };
  }
  return d;
}

/* ================================================================
   Family badge (accent colours only paired with glyph + name)
   ================================================================ */
const FAM_ACCENT: Record<GameFamily, string> = {
  pd: "text-defect border-defect",
  deadlock: "text-free-ride border-free-ride",
  assurance: "text-comply border-comply",
  harmony: "text-hide border-hide",
  chicken: "text-exaggerate border-exaggerate",
};

function FamilyBadge({ eff }: { eff: EffPayoffs }) {
  const cls = classify(eff);
  const fam = COPY.p3.families[cls.fam];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={COPY.p3.badgeAria}
      className="border-border bg-card mb-3.5 flex min-h-[86px] items-start gap-3 rounded-lg border-[1.5px] p-3.5"
    >
      <div
        className={cn(
          "flex size-9 flex-none items-center justify-center rounded-lg border-2 font-mono text-[17px] font-bold",
          FAM_ACCENT[cls.fam],
        )}
        aria-hidden
      >
        {fam.glyph}
      </div>
      <div>
        <div className="text-base font-bold">{fam.name}</div>
        <div className="text-muted-foreground mt-0.5 text-xs">
          <Rich text={fam.line} />
        </div>
        {cls.knife && (
          <div className="text-defect mt-0.5 text-[11.5px] italic">
            {COPY.p3.knife}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Lab slider control
   ================================================================ */
function LabSlider({
  copyLabel,
  sub,
  tipKey,
  min,
  max,
  step,
  value,
  valFmt,
  disabled,
  onValueChange,
  id,
}: {
  copyLabel: string;
  sub?: string;
  tipKey?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valFmt: (n: number) => string;
  disabled?: boolean;
  onValueChange: (n: number) => void;
  id: string;
}) {
  return (
    <div className={cn("mb-3.5", disabled && "opacity-45")}>
      <div className="mb-1 flex items-baseline justify-between gap-2.5">
        <Label htmlFor={id} className="text-[13px] font-semibold">
          {copyLabel}
          {tipKey && (
            <Term definition={COPY.tips[tipKey] ?? ""}>
              <span aria-hidden className="ml-1">
                (?)
              </span>
            </Term>
          )}
        </Label>
        <span className="bg-muted text-foreground rounded px-1.5 py-px font-mono text-[12.5px] tabular-nums">
          {valFmt(value)}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={(v) => onValueChange(v[0])}
        aria-label={copyLabel}
      />
      {sub && (
        <div className="text-muted-foreground mt-1 text-[11.5px]">
          <TermText text={sub} glossary={COPY.tips} />
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Stepper
   ================================================================ */
function Stepper({
  phase,
  onGoto,
}: {
  phase: number;
  onGoto: (i: number) => void;
}) {
  return (
    <ol className="mb-6 flex flex-wrap gap-1.5">
      {COPY.nav.phases.map((label, i) => {
        const cur = i === phase;
        const done = i < phase;
        return (
          <li key={label}>
            <button
              type="button"
              onClick={() => onGoto(i)}
              aria-current={cur ? "step" : undefined}
              aria-label={`Go to phase ${i + 1}: ${label}`}
              className={cn(
                "bg-card flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-2 text-[12.5px] font-semibold transition-colors",
                cur
                  ? "border-primary text-foreground"
                  : "border-border text-muted-foreground hover:border-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 flex-none items-center justify-center rounded-full border-[1.5px] font-mono text-[10.5px]",
                  cur && "bg-primary text-primary-foreground border-primary",
                  done && "text-comply border-comply",
                  !cur && !done && "border-muted-foreground",
                )}
              >
                {done ? <Check className="size-3" aria-hidden /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ================================================================
   The widget
   ================================================================ */
export function ChangeTheGame({ onComplete }: VerificationWidgetProps) {
  const [phase, setPhase] = useState(0);
  const [lab, setLab] = useState<LabState>(() => labDefaults());
  const [finalLab, setFinalLab] = useState<LabState | null>(null);
  const [prevPhase, setPrevPhase] = useState(0);
  const completedRef = useRef(false);

  const headingRef = useRef<HTMLHeadingElement>(null);

  // Capture a snapshot of lab the moment we enter the debrief phase (adjust
  // state during render — avoids calling setState inside an effect body).
  if (phase !== prevPhase) {
    setPrevPhase(phase);
    if (phase === 3) {
      setFinalLab({ ...lab });
    }
  }

  const gotoPhase = useCallback((i: number) => {
    if (i > 3) return;
    setPhase(i);
  }, []);

  // focus the heading on phase change
  useEffect(() => {
    headingRef.current?.focus();
  }, [phase]);

  // fire completion once, at the debrief
  useEffect(() => {
    if (phase === 3 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [phase, onComplete]);

  function restartAll() {
    setLab(labDefaults());
    setFinalLab(null);
    setPrevPhase(0);
    setPhase(0);
  }

  return (
    <div className="not-prose my-6">
      <Stepper phase={phase} onGoto={gotoPhase} />
      <PhaseHeader phase={phase} onSkip={() => gotoPhase(phase + 1)} />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-4 text-lg font-semibold outline-none"
      >
        {COPY.nav.phases[phase]}
      </h2>

      {phase === 0 && <Phase1 onDone={() => gotoPhase(1)} />}
      {phase === 1 && <Phase2 onDone={() => gotoPhase(2)} />}
      {phase === 2 && (
        <Phase3 lab={lab} setLab={setLab} onDone={() => gotoPhase(3)} />
      )}
      {phase === 3 && finalLab && (
        <Phase4
          finalLab={finalLab}
          onBackToLab={() => gotoPhase(2)}
          onReplay={restartAll}
        />
      )}
    </div>
  );
}

function PhaseHeader({ phase, onSkip }: { phase: number; onSkip: () => void }) {
  return (
    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-3">
      <span className="text-muted-foreground font-mono text-[10.5px] tracking-[0.15em] uppercase">
        {tpl(COPY.nav.phaseKicker, { n: phase + 1 })}
      </span>
      {phase < 3 && (
        <button
          type="button"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground text-[12.5px] underline decoration-dotted"
        >
          {COPY.nav.skip}
        </button>
      )}
    </div>
  );
}

/* ---------------- Phase 1: feel the bind --------------------------------- */
type LogEntry = { n: number; type: PersonaType; you: Move; pac: Move };

function Phase1({ onDone }: { onDone: () => void }) {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [betrayed, setBetrayed] = useState(false);
  const [lastYou, setLastYou] = useState<Move | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pending, setPending] = useState<{
    you: Move;
    pac: Move;
    reaction: string;
  } | null>(null);
  const [summary, setSummary] = useState(false);

  const type = CONFIG.schedule[round];
  const done = round + 1 >= CONFIG.schedule.length;

  function pickMove(you: Move) {
    if (pending) return;
    const pac = pacMove(
      type,
      { betrayed },
      { p: CONFIG.phase1p, lastYou },
    );
    let reaction: string;
    if (type === "cautious") {
      reaction =
        betrayed || you === "race"
          ? COPY.p1.reactions.cautiousBetrayed
          : COPY.p1.reactions.cautiousLoyal;
      if (you === "race") setBetrayed(true);
    } else {
      reaction = COPY.p1.reactions[type];
    }
    setLastYou(you);
    setLog((l) => [...l, { n: round + 1, type, you, pac }]);
    setPending({ you, pac, reaction });
  }

  function nextRound() {
    setPending(null);
    if (done) setSummary(true);
    else setRound((r) => r + 1);
  }

  if (summary) {
    return (
      <div className="border-border bg-card rounded-lg border p-5">
        <h3 className="mb-2 text-base font-semibold">{COPY.p1.recapTitle}</h3>
        <ul className="mb-1 max-w-xl">
          {log.map((r) => (
            <li
              key={r.n}
              className="border-border/60 flex items-baseline gap-2.5 border-b border-dashed py-1.5 text-[13px] last:border-none"
            >
              <span className="text-muted-foreground w-3.5 flex-none font-mono text-[10.5px]">
                {r.n}
              </span>
              <span className="text-muted-foreground w-[170px] flex-none">
                {COPY.p1.youWord}{" "}
                <b className="text-foreground">{COPY.p1.moveWords[r.you]}</b>.{" "}
                {COPY.p1.pacWord}{" "}
                <b className="text-foreground">{COPY.p1.moveWords[r.pac]}</b>.
              </span>
              <span className="text-muted-foreground text-[12.5px]">
                {COPY.p1.personas[r.type].name}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 max-w-xl font-semibold">
          <Rich text={COPY.p1.summary} />
        </p>
        <div className="mt-3.5">
          <Button onClick={onDone} className="gap-2" autoFocus>
            {COPY.p1.toP2} <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="border-border bg-card rounded-lg border p-5">
        <p className="mb-2.5 max-w-xl">
          <Rich text={COPY.p1.intro1} />
        </p>
        <p className="mb-2.5 max-w-xl">
          <Rich text={COPY.p1.intro2} />
        </p>
        <Button onClick={() => setStarted(true)}>{COPY.p1.begin}</Button>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-lg border p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <span className="border-border text-muted-foreground rounded-full border px-2.5 py-1 font-mono text-[10.5px] tracking-[0.12em] uppercase">
          {tpl(COPY.p1.roundLabel, { n: round + 1 })}
        </span>
      </div>
      <div className="border-exaggerate mb-3.5 max-w-xl border-l-[3px] pl-3">
        <div className="font-bold">{COPY.p1.personas[type].name}</div>
        <div className="text-muted-foreground">
          {COPY.p1.personas[type].intro}
        </div>
      </div>
      <p className="mb-1.5">
        <b>{COPY.p1.prompt}</b>
      </p>
      <div className="my-1.5 flex flex-wrap gap-2.5">
        {(["restrain", "race"] as const).map((mv) => {
          const cc = COPY.p1.choices[mv];
          const picked = pending?.you === mv;
          return (
            <button
              key={mv}
              type="button"
              disabled={!!pending}
              onClick={() => pickMove(mv)}
              className={cn(
                "bg-card max-w-[320px] flex-1 basis-[220px] rounded-lg border-[1.5px] px-3.5 py-3 text-left transition-all",
                picked
                  ? "border-primary ring-primary/10 ring-[3px]"
                  : "border-border hover:border-primary",
                pending && !picked && "opacity-55",
              )}
            >
              <b className="mb-0.5 flex items-center gap-2 text-[15px]">
                <span
                  className={cn(
                    "inline-flex size-[22px] flex-none items-center justify-center rounded-md border-[1.5px] font-mono text-[12px]",
                    mv === "restrain" ? "text-hide" : "text-defect",
                  )}
                  aria-hidden
                >
                  {cc.icon}
                </span>
                {cc.label}
              </b>
              <small className="text-muted-foreground block text-[12.5px] leading-snug">
                {cc.desc}
              </small>
            </button>
          );
        })}
      </div>
      {pending && (
        <div
          role="status"
          aria-live="polite"
          className="border-border bg-muted/40 mt-3 max-w-xl rounded-lg border p-3.5"
        >
          <b className="font-bold">
            {COPY.p1.outcomes[pending.you + "_" + pending.pac]}
          </b>{" "}
          <span className="text-muted-foreground">{pending.reaction}</span>
        </div>
      )}
      {pending && (
        <div className="mt-3.5">
          <Button onClick={nextRound} autoFocus>
            {done ? COPY.p1.finish : COPY.p1.next}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Phase 2: see the trap ---------------------------------- */
function baselineEff(): EffPayoffs {
  return effPayoffs(labDefaults());
}

function Phase2({ onDone }: { onDone: () => void }) {
  const e = baselineEff();
  const [col, setCol] = useState<0 | 1>(0);
  const [answered, setAnswered] = useState<{ right: boolean; bestRow: number } | null>(
    null,
  );
  const [reveal, setReveal] = useState(false);

  const restrainVal = col === 0 ? e.R : e.S;
  const raceVal = col === 0 ? e.T : e.P;

  function answerColumn(picked: 0 | 1) {
    const betterIsRace = raceVal >= restrainVal;
    const bestRow = betterIsRace ? 1 : 0;
    setAnswered({ right: picked === bestRow, bestRow });
  }

  function proceed() {
    if (col === 0) {
      setCol(1);
      setAnswered(null);
    } else {
      setReveal(true);
    }
  }

  // decorations
  let deco: Record<string, CellDeco> = {};
  let eqs: string[] = [];
  let pulse = false;
  if (reveal) {
    eqs = equilibria(e);
    pulse = true;
  } else {
    deco = columnDeco(col, answered ? null : col);
    if (answered) {
      deco[`${answered.bestRow}${col}`] = {
        ...(deco[`${answered.bestRow}${col}`] ?? {}),
        best: true,
        dim: false,
      };
    }
  }

  return (
    <div className="border-border bg-card rounded-lg border p-5">
      <p className="mb-3">
        <TermText text={COPY.p2.intro} glossary={COPY.tips} />
      </p>
      <Matrix
        eff={e}
        eqs={eqs}
        deco={deco}
        pulse={pulse}
        legend
        onCellClick={!answered && !reveal ? (i) => answerColumn(i as 0 | 1) : undefined}
      />

      {!reveal ? (
        <div>
          <p className="mt-3.5">
            <b>
              <TermText text={col === 0 ? COPY.p2.q1 : COPY.p2.q2} glossary={COPY.tips} />
            </b>
          </p>
          {!answered ? (
            <div className="mt-1.5 flex flex-wrap gap-2.5">
              {(
                [
                  ["restrain", restrainVal, 0],
                  ["race", raceVal, 1],
                ] as const
              ).map(([mv, val, i]) => (
                <Button
                  key={mv}
                  variant="outline"
                  onClick={() => answerColumn(i)}
                >
                  {tpl(
                    mv === "restrain" ? COPY.p2.ansRestrain : COPY.p2.ansRace,
                    { n: fmt(val) },
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <>
              <div
                role="status"
                aria-live="polite"
                className="border-border bg-muted/40 mt-3 max-w-xl rounded-lg border p-3.5"
              >
                <Rich
                  text={tpl(
                    answered.right ? COPY.p2.fbRight : COPY.p2.fbWrong,
                    {
                      hi: fmt(Math.max(restrainVal, raceVal)),
                      lo: fmt(Math.min(restrainVal, raceVal)),
                      tail: col === 0 ? COPY.p2.tail1 : COPY.p2.tail2,
                    },
                  )}
                />
              </div>
              <div className="mt-3.5">
                <Button onClick={proceed} autoFocus>
                  {col === 0 ? COPY.p2.continueBtn : COPY.p2.revealEq}
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <p className="mt-3.5">
            <TermText text={COPY.p2.conclusion} glossary={COPY.tips} />
          </p>
          <p className="mt-3.5 font-semibold">
            <TermText text={COPY.p2.eqCaption} glossary={COPY.tips} />
          </p>
          <div className="mt-3.5">
            <Button onClick={onDone} className="gap-2" autoFocus>
              {COPY.p2.toP3} <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Phase 3: the lab --------------------------------------- */
function Phase3({
  lab,
  setLab,
  onDone,
}: {
  lab: LabState;
  setLab: React.Dispatch<React.SetStateAction<LabState>>;
  onDone: () => void;
}) {
  const [preset, setPreset] = useState<"hawk" | "dove" | null>(null);
  const [ch1Open, setCh1Open] = useState(false);
  const [ch2Open, setCh2Open] = useState(false);

  const base = basePayoffs(lab);
  const eff = effPayoffs(lab);

  function up<K extends keyof LabState>(k: K, v: LabState[K], clearPreset = false) {
    setLab((s) => ({ ...s, [k]: v }));
    if (clearPreset) setPreset(null);
  }
  function applyPreset(name: "hawk" | "dove") {
    const pr = CONFIG.presets[name];
    setLab((s) => ({ ...s, v: pr.v, c: pr.c, share: pr.share }));
    setPreset(name);
  }
  function resetLab() {
    setLab(labDefaults());
    setPreset(null);
  }

  const s = CONFIG.sliders;
  const pEffForRep = lab.agreement ? lab.p : 0;

  return (
    <>
      <p className="text-muted-foreground mb-3.5 max-w-xl">
        <TermText text={COPY.p3.intro} glossary={COPY.tips} />
      </p>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)]">
        {/* left: badge + matrix */}
        <div className="lg:sticky lg:top-3.5">
          <FamilyBadge eff={eff} />
          <Matrix
            eff={eff}
            base={eff.transformed ? base : null}
            eqs={equilibria(eff)}
            legend
          />
        </div>

        {/* right: controls */}
        <div>
          {/* stakes */}
          <fieldset className="border-border bg-card mb-3.5 rounded-lg border p-4">
            <legend className="text-muted-foreground mb-2.5 block font-mono text-[10px] tracking-[0.15em] uppercase">
              {COPY.p3.gStakes}
            </legend>
            <LabSlider
              id="ctg-v"
              copyLabel={COPY.p3.v.label}
              sub={COPY.p3.v.sub}
              min={s.v.min}
              max={s.v.max}
              step={s.v.step}
              value={lab.v}
              valFmt={(n) => String(Math.round(n))}
              onValueChange={(n) => up("v", n, true)}
            />
            <LabSlider
              id="ctg-c"
              copyLabel={COPY.p3.c.label}
              sub={COPY.p3.c.sub}
              min={s.c.min}
              max={s.c.max}
              step={s.c.step}
              value={lab.c}
              valFmt={(n) => String(Math.round(n))}
              onValueChange={(n) => up("c", n, true)}
            />
            <div className="mt-2.5 flex items-start gap-2.5">
              <Checkbox
                id="ctg-share"
                checked={lab.share}
                onCheckedChange={(v) => up("share", !!v, true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="ctg-share"
                className="text-[13px] font-semibold"
              >
                {COPY.p3.share.label}
                <Term definition={COPY.tips[COPY.p3.share.tipKey] ?? ""}>
                  <span aria-hidden className="ml-1">
                    (?)
                  </span>
                </Term>
              </Label>
            </div>
          </fieldset>

          {/* agreement */}
          <fieldset className="border-border bg-card mb-3.5 rounded-lg border p-4">
            <legend className="text-muted-foreground mb-2.5 block font-mono text-[10px] tracking-[0.15em] uppercase">
              {COPY.p3.gDeal}
            </legend>
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="ctg-agree"
                checked={lab.agreement}
                onCheckedChange={(v) => up("agreement", !!v)}
                className="mt-0.5"
              />
              <Label htmlFor="ctg-agree" className="text-[13px] font-semibold">
                {COPY.p3.agree.label}
                <span className="text-muted-foreground block text-[11.5px] font-normal">
                  {COPY.p3.agree.sub}
                </span>
              </Label>
            </div>
            <fieldset
              disabled={!lab.agreement}
              className="mt-2.5 border-none p-0"
            >
              <LabSlider
                id="ctg-p"
                copyLabel={COPY.p3.p.label}
                sub={COPY.p3.p.sub}
                min={s.p.min}
                max={s.p.max}
                step={s.p.step}
                value={lab.p}
                valFmt={(n) => Math.round(n * 100) + "%"}
                disabled={!lab.agreement}
                onValueChange={(n) => up("p", n)}
              />
              <LabSlider
                id="ctg-F"
                copyLabel={COPY.p3.F.label}
                sub={COPY.p3.F.sub}
                tipKey={COPY.p3.F.tipKey}
                min={s.F.min}
                max={s.F.max}
                step={s.F.step}
                value={lab.F}
                valFmt={(n) => String(Math.round(n))}
                disabled={!lab.agreement}
                onValueChange={(n) => up("F", n)}
              />
            </fieldset>
            <div className="text-defect min-h-[17px] text-xs" role="status">
              {!lab.agreement ? COPY.p3.offNote : ""}
            </div>
            <button
              type="button"
              onClick={resetLab}
              className="border-border text-muted-foreground hover:border-foreground hover:text-foreground mt-1 rounded-md border px-2.5 py-1 text-[11.5px] font-semibold"
            >
              {COPY.p3.reset}
            </button>
          </fieldset>

          {/* whose payoffs */}
          <fieldset className="border-border bg-card mb-3.5 rounded-lg border p-4">
            <legend className="text-muted-foreground mb-2.5 block font-mono text-[10px] tracking-[0.15em] uppercase">
              {COPY.p3.world.title}
            </legend>
            <p className="text-muted-foreground mb-2 text-[11.5px]">
              {COPY.p3.world.sub}
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              {(["hawk", "dove"] as const).map((name) => {
                const w = COPY.p3.world[name];
                const on = preset === name;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => applyPreset(name)}
                    className={cn(
                      "bg-card flex items-center gap-1.5 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-bold",
                      on
                        ? "border-primary bg-muted"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <span className="font-mono text-[11px]" aria-hidden>
                      {name === "hawk" ? "▲" : "▽"}
                    </span>
                    {w.label}{" "}
                    <span className="text-muted-foreground font-normal">
                      {w.detail}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-[11.5px]">
              <TermText text={COPY.p3.world.caption} glossary={COPY.tips} />
            </p>
          </fieldset>

          {/* challenges */}
          <div className="mb-3.5 grid grid-cols-1 gap-3.5">
            {[
              { c: COPY.p3.ch1, open: ch1Open, set: setCh1Open, id: "ch1" },
              { c: COPY.p3.ch2, open: ch2Open, set: setCh2Open, id: "ch2" },
            ].map(({ c, open, set, id }) => (
              <div
                key={id}
                className="border-border border-l-free-ride bg-card rounded-lg border border-l-[3px] p-4"
              >
                <div className="text-free-ride mb-1.5 font-mono text-[9.5px] tracking-[0.14em] uppercase">
                  {c.tag}
                </div>
                <p className="mb-2.5 text-[13px]">
                  <Rich text={c.prompt} />
                </p>
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id={`ctg-${id}`}
                    checked={open}
                    onCheckedChange={(v) => set(!!v)}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`ctg-${id}`} className="text-[13px] font-semibold">
                    {c.check}
                  </Label>
                </div>
                {open && (
                  <div className="border-border text-muted-foreground mt-2.5 border-t border-dashed pt-2.5 text-[12.5px]">
                    <TermText text={c.reveal} glossary={COPY.tips} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* repeated play + about */}
          <Accordion type="multiple" className="mb-3.5">
            <AccordionItem
              value="rep"
              className="border-border bg-card rounded-lg border px-4"
            >
              <AccordionTrigger className="text-[13.5px] font-bold">
                <TermText text={COPY.p3.rep.title} glossary={COPY.tips} />
              </AccordionTrigger>
              <AccordionContent>
                <RepeatedPlay lab={lab} pEff={pEffForRep} onDelta={(n) => up("delta", n)} eff={eff} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="about"
              className="border-border bg-card mt-3.5 rounded-lg border px-4"
            >
              <AccordionTrigger className="text-[13.5px] font-bold">
                {COPY.p3.about.summary}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground text-[13px]">
                  {COPY.p3.about.intro}
                </p>
                <ul className="text-muted-foreground mt-1 ml-4 list-disc space-y-2 text-[13px]">
                  {COPY.p3.about.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button onClick={onDone} className="gap-2">
            {COPY.p3.toP4} <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </>
  );
}

function RepeatedPlay({
  lab,
  pEff,
  eff,
  onDelta,
}: {
  lab: LabState;
  pEff: number;
  eff: EffPayoffs;
  onDelta: (n: number) => void;
}) {
  const s = CONFIG.sliders.delta;
  const show = lab.delta > 0;
  const r = repeatedVerdict(eff, lab.delta, pEff);
  const mult = repeatMultiplier(lab.delta, pEff);
  const tiltRaw = (r.cost - r.gain) / CONFIG.tiltUnit;
  const tilt = Math.max(-1, Math.min(1, tiltRaw)) * CONFIG.tiltMaxDeg;

  return (
    <div>
      <LabSlider
        id="ctg-delta"
        copyLabel={COPY.p3.rep.deltaLabel}
        sub={COPY.p3.rep.deltaSub}
        min={s.min}
        max={s.max}
        step={s.step}
        value={lab.delta}
        valFmt={(n) => n.toFixed(2)}
        onValueChange={onDelta}
      />
      {!show ? (
        <p className="text-muted-foreground text-[11.5px]">
          {COPY.p3.rep.zeroHint}
        </p>
      ) : (
        <div className="max-w-[520px]">
          {/* balance beam */}
          <div className="relative my-2.5 h-[120px]">
            <div
              className="border-t-primary absolute top-11 left-1/2 h-0 w-[82%] max-w-[420px] origin-center border-t-[3px] transition-transform"
              style={{
                transform: `translateX(-50%) rotate(${tilt.toFixed(2)}deg)`,
              }}
            >
              <div
                className="border-border bg-muted/40 absolute -left-3.5 top-1.5 w-32 rounded-lg border-[1.5px] px-2 py-1.5 text-center transition-transform"
                style={{ transform: `rotate(${(-tilt).toFixed(2)}deg)` }}
              >
                <div className="text-muted-foreground min-h-[26px] text-[10px] leading-tight">
                  {COPY.p3.rep.gainLabel}
                </div>
                <div className="text-defect font-mono text-[15px] font-bold tabular-nums">
                  {fmt(r.gain)}
                </div>
              </div>
              <div
                className="border-border bg-muted/40 absolute -right-3.5 top-1.5 w-32 rounded-lg border-[1.5px] px-2 py-1.5 text-center transition-transform"
                style={{ transform: `rotate(${(-tilt).toFixed(2)}deg)` }}
              >
                <div className="text-muted-foreground min-h-[26px] text-[10px] leading-tight">
                  {COPY.p3.rep.costLabel}
                </div>
                <div className="text-comply font-mono text-[15px] font-bold tabular-nums">
                  {fmt(r.cost)}
                </div>
              </div>
            </div>
            <div
              className="absolute bottom-3.5 left-1/2 size-0 -translate-x-1/2"
              style={{
                borderLeft: "11px solid transparent",
                borderRight: "11px solid transparent",
                borderBottom: "20px solid var(--muted-foreground)",
              }}
              aria-hidden
            />
          </div>
          <p className="mt-2 text-[13.5px]" role="status" aria-live="polite">
            {COPY.p3.rep.verdict}
            {r.sustainable ? (
              <b className="text-comply">{COPY.p3.rep.yes}</b>
            ) : (
              <b className="text-defect">{COPY.p3.rep.no}</b>
            )}
          </p>
          {pEff === 0 && (
            <p className="text-defect mt-1.5 min-h-[18px] text-[12.5px]">
              {COPY.p3.rep.p0note}
            </p>
          )}
          <details className="mt-2.5">
            <summary className="text-muted-foreground cursor-pointer text-[12.5px] font-semibold">
              {COPY.p3.rep.mathSummary}
            </summary>
            <div className="bg-muted text-foreground my-2 overflow-x-auto rounded-lg px-3 py-2.5 font-mono text-[12.5px] whitespace-nowrap">
              {COPY.p3.rep.formula}
            </div>
            <div className="bg-muted text-foreground my-2 overflow-x-auto rounded-lg px-3 py-2.5 font-mono text-[12.5px] whitespace-nowrap">
              {tpl(COPY.p3.rep.plugged, {
                m: mult.toFixed(2),
                rp: fmt(eff.R - eff.P),
                cost: fmt(r.cost),
                gain: fmt(r.gain),
              })}
            </div>
            <p className="text-muted-foreground text-[11.5px]">
              {COPY.p3.rep.reading}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}

/* ---------------- Phase 4: debrief --------------------------------------- */
function MiniMatrix({ e }: { e: Payoffs }) {
  const eqs = equilibria(e);
  const M = grid(e);
  return (
    <div className="my-2 grid grid-cols-2 gap-1">
      {[0, 1].map((i) =>
        [0, 1].map((j) => {
          const isEq = eqs.includes(`${i}${j}`);
          return (
            <div
              key={`${i}${j}`}
              className={cn(
                "bg-muted/40 rounded-md border-[1.5px] px-1.5 py-1.5 text-center font-mono text-[11px] tabular-nums",
                isEq ? "border-comply" : "border-border",
              )}
            >
              <span className="text-comply block min-h-[10px] text-[8px] tracking-[0.08em] uppercase">
                {isEq ? "◉ eq" : ""}
              </span>
              {fmt(M[i][j])} / {fmt(M[j][i])}
            </div>
          );
        }),
      )}
    </div>
  );
}

function Phase4({
  finalLab,
  onBackToLab,
  onReplay,
}: {
  finalLab: LabState;
  onBackToLab: () => void;
  onReplay: () => void;
}) {
  const s = finalLab;
  const before = basePayoffs(s);
  const after = effPayoffs(s);
  const famB = COPY.p3.families[classify(before).fam];
  const famA = COPY.p3.families[classify(after).fam];
  const pEff = s.agreement ? s.p : 0;
  const showBack = !s.agreement || s.p === 0;

  return (
    <>
      <div className="mb-4.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {/* card 1 */}
        <div className="border-border bg-card rounded-lg border p-4">
          <div className="text-muted-foreground mb-1.5 font-mono text-[9.5px] tracking-[0.14em] uppercase">
            {COPY.p4.c1.tag}
          </div>
          <h3 className="text-base font-semibold">{COPY.p4.c1.h}</h3>
          <p className="text-muted-foreground mt-1 text-[12.5px]">
            {COPY.p4.c1.body}
          </p>
          <div className="text-muted-foreground mt-2 font-mono text-[9.5px] tracking-[0.1em] uppercase">
            {COPY.p4.c1.beforeHd}
          </div>
          <MiniMatrix e={before} />
          <div className="mt-1 text-[11.5px] font-bold">
            {famB.glyph} {famB.name}
          </div>
          <div className="text-muted-foreground mt-2 font-mono text-[9.5px] tracking-[0.1em] uppercase">
            {tpl(COPY.p4.c1.afterHd, { p: Math.round(pEff * 100) })}
          </div>
          <MiniMatrix e={after} />
          <div className="mt-1 text-[11.5px] font-bold">
            {famA.glyph} {famA.name}
          </div>
          {showBack && (
            <>
              <p className="mt-2 text-[12.5px] italic">
                {!s.agreement ? COPY.p4.c1.sameOff : COPY.p4.c1.sameP0}
              </p>
              <button
                type="button"
                onClick={onBackToLab}
                className="border-border text-muted-foreground hover:border-foreground hover:text-foreground mt-2 rounded-md border px-2.5 py-1 text-[11.5px] font-semibold"
              >
                {COPY.p4.c1.backToLab}
              </button>
            </>
          )}
        </div>

        {/* card 2 */}
        <div className="border-border bg-card rounded-lg border p-4">
          <div className="text-muted-foreground mb-1.5 font-mono text-[9.5px] tracking-[0.14em] uppercase">
            {COPY.p4.c2.tag}
          </div>
          <h3 className="text-base font-semibold">{COPY.p4.c2.h}</h3>
          {COPY.p4.c2.paras.map((p, i) => (
            <p key={i} className="text-muted-foreground mt-2 text-[12.5px]">
              {p}
            </p>
          ))}
        </div>

        {/* card 3 */}
        <div className="border-border bg-card rounded-lg border p-4">
          <div className="text-muted-foreground mb-1.5 font-mono text-[9.5px] tracking-[0.14em] uppercase">
            {COPY.p4.c3.tag}
          </div>
          <h3 className="text-base font-semibold">{COPY.p4.c3.h}</h3>
          <p className="text-muted-foreground mt-2 text-[12.5px]">
            {COPY.p4.c3.body}
          </p>
          <ul className="text-muted-foreground mt-2 ml-4 list-disc space-y-1.5 text-[12.5px]">
            {COPY.p4.c3.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2 text-[12.5px]">
            {COPY.p4.c3.tail}
          </p>
        </div>
      </div>

      {/* completion */}
      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <div
          className="border-comply text-comply mx-auto mb-3.5 flex size-13 items-center justify-center rounded-full border-[2.5px]"
          aria-hidden
        >
          <Check className="size-6" />
        </div>
        <h3 className="text-xl font-semibold">{COPY.p4.complete.h}</h3>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm">
          <Rich text={COPY.p4.complete.body} />
        </p>
        <p className="mx-auto mt-2 max-w-xl font-semibold">
          <Rich text={COPY.p4.complete.onward} />
        </p>
        <div className="mt-3.5 flex flex-wrap justify-center gap-2.5">
          <Button variant="outline" onClick={onReplay} className="gap-2">
            <RotateCcw className="size-4" aria-hidden />
            {COPY.p4.complete.replay}
          </Button>
        </div>
      </div>
    </>
  );
}
