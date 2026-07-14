"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Lock, RotateCcw, Radar, Info, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Term } from "@/components/verification/kit/term";
import {
  CONFIG as C,
  pStar,
  entropyOf,
  newGame,
  beginQuarter,
  placeAndResolve,
  announce as igAnnounce,
  autoQuarter,
  flipPolicy,
  flipChoice,
  type GameState,
  type QuarterRecord,
  type FlipRecord,
} from "@/lib/verification/engines/inspection-game";
import { INSPECTION_GAME_COPY as COPY } from "@/lib/verification/data/inspection-game";
import type { VerificationWidgetProps } from "../kit/types";

const PS = pStar();
const siteName = (i: number) => C.sites[i].name;

/* -------- authored-copy rendering: [[term]] + trusted inline HTML -------- */
const TERM_RE_SOURCE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/** Render trusted authored copy that may contain `[[term]]` markup and simple
 * inline HTML (`<b>`, `<a>`, `<p>`). Splits on terms, wraps them with the app
 * tooltip, and passes the inter-term HTML segments through dangerouslySet
 * (authored content only — learner text never reaches this path). */
function RichCopy({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const termRe = new RegExp(TERM_RE_SOURCE.source, "g");
  let key = 0;
  while ((m = termRe.exec(html))) {
    if (m.index > last) {
      nodes.push(
        <span
          key={key++}
          dangerouslySetInnerHTML={{ __html: html.slice(last, m.index) }}
        />,
      );
    }
    const term = m[1];
    const def =
      m[2] ??
      COPY.terms[term.toLowerCase()] ??
      COPY.terms[term] ??
      "";
    nodes.push(
      <Term key={key++} definition={def}>
        {term}
      </Term>,
    );
    last = m.index + m[0].length;
  }
  if (last < html.length) {
    nodes.push(
      <span key={key++} dangerouslySetInnerHTML={{ __html: html.slice(last) }} />,
    );
  }
  return <span className={className}>{nodes}</span>;
}

/** Same, but as a block-level <p> (strips wrapping <p class="sub"> the source
 * used, since we control the styling here). */
function RichParagraph({ html }: { html: string }) {
  const stripped = html
    .replace(/^<p[^>]*>/i, "")
    .replace(/<\/p>\s*$/i, "");
  return (
    <p className="text-muted-foreground text-sm leading-relaxed [&_a]:underline [&_b]:text-foreground [&_b]:font-semibold">
      <RichCopy html={stripped} />
    </p>
  );
}

type SweepClose =
  | { kind: "sealed" }
  | { kind: "dark" }
  | null;

export function InspectionGame({ onComplete }: VerificationWidgetProps) {
  const [seed, setSeed] = useState(C.seedDefault);
  // The engine mutates a GameState object in place. We keep that mutable object
  // in a ref (engine functions operate on it) but read game state during render
  // from React state. After every mutation we commit a fresh snapshot reference
  // via `rerender()` so (a) render reads state, not the ref, and (b) a re-render
  // actually fires.
  const stRef = useRef<GameState>(newGame(C.seedDefault));
  // Initial render snapshot mirrors the live engine object. `newGame` is
  // deterministic for a given seed, so this is value-identical to `stRef`'s
  // initial state; every later snapshot is a shallow clone pushed by `rerender`.
  const [st, setSt] = useState<GameState>(() => newGame(C.seedDefault));
  const rerender = () => setSt({ ...stRef.current });

  const [stage, setStage] = useState(0);
  const [maxStage, setMaxStage] = useState(0);

  const [picked, setPicked] = useState<number[]>([]);
  const [log1, setLog1] = useState<React.ReactNode[]>([]);
  const [log2, setLog2] = useState<React.ReactNode[]>([]);
  const [log3, setLog3] = useState<React.ReactNode[]>([]);
  const [log4, setLog4] = useState<React.ReactNode[]>([]);

  const initialSliders = () =>
    PS.map((p) => Math.min(C.sliderCap, Math.round((p + 0.08) * 20) / 20));
  const [sliderVals, setSliderVals] = useState<number[]>(initialSliders);
  const [announceResult, setAnnounceResult] = useState<{
    deterred: boolean;
    worst: number;
  } | null>(null);

  const [sweepChecked, setSweepChecked] = useState(false);
  const [sweepClose, setSweepClose] = useState<SweepClose>(null);

  const [ariaMsg, setAriaMsg] = useState("");
  const completedRef = useRef(false);

  function say(text: string) {
    setAriaMsg(text);
  }

  function go(i: number, advance: boolean) {
    setStage(i);
    if (advance) setMaxStage((m) => Math.max(m, i));
  }

  /* ---------- log helpers (build stable React nodes) ---------- */
  function truthNode(rec: QuarterRecord, keyBase: string): React.ReactNode {
    const t = rec.revealedTruth;
    if (!t) return null;
    let msg: string;
    if (t.caught) msg = COPY.lateCaught(t.q);
    else if (t.cheated) msg = COPY.lateCheat(t.q, siteName(t.site!));
    else msg = COPY.lateQuiet(t.q);
    return (
      <LogRow key={`${keyBase}-truth`} q={`Q${rec.q}`} late html={msg} />
    );
  }
  function resultNode(rec: QuarterRecord, keyBase: string): React.ReactNode {
    const names =
      rec.placement.map((i) => siteName(i)).join(" and ") ||
      "no declared site";
    let body = rec.caught
      ? COPY.resCaught(names, siteName(rec.site!))
      : COPY.resClear(names);
    if (rec.sweep)
      body += " " + (rec.sweepFound ? COPY.sweepFound : COPY.sweepMiss);
    return <LogRow key={`${keyBase}-res`} q={`Q${rec.q}`} html={body} />;
  }
  function pushLog(
    setter: React.Dispatch<React.SetStateAction<React.ReactNode[]>>,
    rec: QuarterRecord,
  ) {
    const keyBase = `q${rec.q}-${rec.mode}`;
    const truth = truthNode(rec, keyBase);
    const result = resultNode(rec, keyBase);
    // prepend, truth then result (source prepends result then truth so truth
    // ends up on top; we match arrival order by putting truth first visually)
    setter((prev) => [truth, result, ...prev].filter(Boolean));
    const plain = plainResult(rec);
    say("Quarter " + rec.q + " resolved. " + plain);
  }

  /* ---------- stage 0 → 1 ---------- */
  function begin() {
    beginQuarter(stRef.current);
    setPicked([]);
    go(1, true);
    rerender();
  }

  /* ---------- stage 1: manual quarters ---------- */
  function toggleSite(i: number) {
    setPicked((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length < C.k) return [...prev, i];
      return prev;
    });
  }
  function runManualQuarter() {
    const engine = stRef.current;
    if (!engine.quarterOpen || picked.length !== C.k) return;
    const rec = placeAndResolve(engine, picked);
    pushLog(setLog1, rec);
    setPicked([]);
    if (engine.q > C.manualQuarters) {
      go(2, true);
    } else {
      beginQuarter(engine);
    }
    rerender();
  }

  /* ---------- stage 2: announcement ---------- */
  function setSlider(i: number, v: number) {
    setSliderVals((prev) => {
      const next = prev.slice();
      next[i] = v;
      return next;
    });
  }
  const sliderSum = sliderVals.reduce((a, b) => a + b, 0);
  const sumOk = Math.abs(sliderSum - C.k) < 0.001;

  function doAnnounce() {
    const res = igAnnounce(stRef.current, sliderVals);
    let worst = 0;
    res.evs.forEach((e, i) => {
      if (e > res.evs[worst]) worst = i;
    });
    setAnnounceResult({ deterred: res.deterred, worst });
    say(res.deterred ? COPY.announcedDeterred : COPY.announcedWeak(siteName(worst)));
    rerender();
  }

  function runAutoQuarter(fromStage: number) {
    const engine = stRef.current;
    if (engine.finished || !engine.announced) return;
    const sweep = fromStage === 3 && sweepChecked;
    const rec = autoQuarter(engine, { sweep });
    pushLog(fromStage === 3 ? setLog3 : setLog2, rec);
    if (rec.sweepFound) {
      setSweepChecked(false);
      setSweepClose({ kind: "sealed" });
    }
    if (engine.q === 8 && fromStage === 2) {
      go(3, true);
      rerender();
      return;
    }
    if (engine.finished) {
      if (fromStage === 3 && engine.covert.exists && !engine.covert.found) {
        setSweepClose({ kind: "dark" });
      }
      go(4, true);
    }
    rerender();
  }

  /* ---------- stage 4: role flip ---------- */
  const flipQ = useMemo(() => flipPolicy(), []);
  function doFlip(action: "comply" | number) {
    const engine = stRef.current;
    if (!engine.flip.policy) engine.flip.policy = flipQ;
    const rec: FlipRecord = flipChoice(engine, action);
    let msg: string;
    if (action === "comply") msg = COPY.flipComplied;
    else if (rec.caught) msg = COPY.flipCaught(siteName(action));
    else msg = COPY.flipGot(siteName(action), C.sites[action].g);
    setLog4((prev) => [
      <LogRow key={`f${rec.n}`} q={`F${rec.n}`} html={msg} />,
      ...prev,
    ]);
    say(`Flip quarter ${rec.n}. ` + msg.replace(/<[^>]+>/g, ""));
    rerender();
  }

  /* ---------- debrief ---------- */
  function coverage(): number[] {
    const counts = C.sites.map(() => 0);
    st.hist.forEach((pl) => pl.forEach((i) => counts[i]++));
    return counts.map((c) => c / Math.max(1, st.hist.length));
  }
  function enterDebrief() {
    go(5, true);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
    rerender();
  }

  function playAgain() {
    const next = (seed + 1 + Math.floor(Math.random() * 1e6)) >>> 0;
    setSeed(next);
    stRef.current = newGame(next);
    setPicked([]);
    setSliderVals(initialSliders());
    setAnnounceResult(null);
    setSweepChecked(false);
    setSweepClose(null);
    setLog1([]);
    setLog2([]);
    setLog3([]);
    setLog4([]);
    setStage(0);
    setMaxStage(0);
    say("New game started.");
    rerender();
  }

  /* ---------- derived render data ---------- */
  const runDisabled =
    picked.length !== C.k || !st.quarterOpen || st.q > C.manualQuarters;
  const sweepable = st.covert.exists && !st.covert.found;
  const flipDone = st.flip.done >= C.flipQuarters;

  return (
    <div className="not-prose my-6">
      {/* stepper */}
        <nav aria-label="Exercise stages" className="flex flex-wrap gap-2">
          {COPY.stages.map((label, i) => {
            const locked = i > maxStage;
            const done = i < maxStage;
            const current = i === stage;
            return (
              <button
                key={label}
                type="button"
                disabled={locked}
                aria-current={current ? "step" : undefined}
                aria-disabled={locked}
                onClick={() => {
                  if (i <= maxStage) go(i, false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  current
                    ? "border-primary bg-primary text-primary-foreground"
                    : locked
                      ? "border-border text-muted-foreground/50 cursor-not-allowed"
                      : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="font-mono text-[10px] opacity-70">
                  {i + 1}
                </span>
                {label}
                {done && <Check className="size-3 text-comply" aria-hidden />}
                {locked && <Lock className="size-3" aria-hidden />}
              </button>
            );
          })}
        </nav>

        {/* quarter strip */}
        <QuarterStrip st={st} />

        {/* aria-live */}
        <div className="sr-only" aria-live="polite">
          {ariaMsg}
        </div>

        {/* ============ STAGE 0: briefing ============ */}
        {stage === 0 && (
          <Section note={COPY.stageNotes[0]} head={COPY.s0head}>
            <RichParagraph html={COPY.s0body} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {C.sites.map((s, i) => (
                <div
                  key={s.id}
                  className="border-border bg-muted/30 rounded-lg border p-3"
                >
                  <h4 className="text-sm font-semibold">{s.name}</h4>
                  <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                    G = {s.g} if a diversion succeeds
                  </p>
                  <p className="text-muted-foreground/80 mt-1 font-mono text-[11px]">
                    p* = {s.g}/({s.g}+{C.F}) = {PS[i].toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              <RichCopy html={COPY.s0after} />
            </p>
            <div className="mt-4">
              <Button onClick={begin} className="gap-2">
                {COPY.begin}
              </Button>
            </div>
          </Section>
        )}

        {/* ============ STAGE 1: manual quarters ============ */}
        {stage === 1 && (
          <Section
            note={COPY.stageNotes[1]}
            head={`${COPY.s1head} · Q${Math.min(st.q, C.manualQuarters)}`}
          >
            <p className="text-muted-foreground text-sm">
              <RichCopy html={COPY.s1sub} />
            </p>

            {/* tip banner */}
            {st.tip && (
              <Banner
                tone="tip"
                icon={<Info className="size-4" aria-hidden />}
                tag={`TIP · ${COPY.tipLabel[st.tip.tipster]}`}
              >
                <RichCopy
                  html={
                    st.tip.claim.quiet
                      ? COPY.tipQuiet
                      : COPY.tipSite(siteName(st.tip.claim.site!))
                  }
                />
              </Banner>
            )}

            {/* board */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {C.sites.map((s, i) => {
                const on = picked.includes(i);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSite(i)}
                    className={cn(
                      "relative rounded-lg border p-3 text-left transition-colors",
                      on
                        ? "border-primary ring-primary bg-primary/5 ring-1"
                        : "border-border hover:border-muted-foreground/50",
                    )}
                  >
                    <h4 className="text-sm font-semibold">{s.name}</h4>
                    <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                      G = {s.g}
                    </p>
                    <p className="text-muted-foreground/80 font-mono text-[11px]">
                      p* = {PS[i].toFixed(2)}
                    </p>
                    {on && (
                      <span className="bg-primary text-primary-foreground absolute top-2 right-2 rounded px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em]">
                        TEAM
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-muted-foreground font-mono text-xs">
                {COPY.teamsPicked(picked.length, C.k)}
              </span>
              <Button
                onClick={runManualQuarter}
                disabled={runDisabled}
                className="gap-2"
              >
                {`${COPY.run} ${Math.min(st.q, C.manualQuarters)} →`}
              </Button>
            </div>

            <LogList rows={log1} />
          </Section>
        )}

        {/* ============ STAGE 2: announcement ============ */}
        {stage === 2 && (
          <Section note={COPY.stageNotes[2]} head={COPY.s2head}>
            <RichParagraph html={COPY.s2body} />

            <div className="mt-4 space-y-3">
              {C.sites.map((s, i) => {
                const ev = (1 - sliderVals[i]) * s.g - sliderVals[i] * C.F;
                const ok = ev <= 0;
                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[11rem_1fr_3.5rem_9rem]"
                  >
                    <label
                      htmlFor={`sl-${i}`}
                      className="col-span-2 text-sm sm:col-span-1"
                    >
                      {s.name}{" "}
                      <span className="text-muted-foreground font-mono text-[11px]">
                        (p* {PS[i].toFixed(2)})
                      </span>
                    </label>
                    <Slider
                      id={`sl-${i}`}
                      aria-label={`Coverage for ${s.name}`}
                      min={0}
                      max={C.sliderCap}
                      step={0.05}
                      value={[sliderVals[i]]}
                      disabled={!!st.announced}
                      onValueChange={(v) => setSlider(i, v[0])}
                    />
                    <span className="text-right font-mono text-xs">
                      {sliderVals[i].toFixed(2)}
                    </span>
                    <span
                      className={cn(
                        "text-right font-mono text-[11px]",
                        ok ? "text-comply" : "text-defect",
                      )}
                    >
                      {ok ? "✓ " : "▲ "}
                      {COPY.evLine(ev)}
                    </span>
                  </div>
                );
              })}
            </div>

            <p
              className={cn(
                "mt-3 font-mono text-sm",
                sumOk ? "text-muted-foreground" : "text-defect",
              )}
            >
              {COPY.sumLine(sliderSum, C.k)}
              {sumOk ? " ✓" : ` (must equal ${C.k.toFixed(2)})`}
            </p>

            <div className="mt-3">
              <Button
                onClick={doAnnounce}
                disabled={!sumOk || !!st.announced}
                className="gap-2"
              >
                <Megaphone className="size-4" aria-hidden /> {COPY.announceBtn}
              </Button>
            </div>

            {announceResult && (
              <Banner
                tone={announceResult.deterred ? "clear" : "truth"}
                icon={
                  announceResult.deterred ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <X className="size-4" aria-hidden />
                  )
                }
                tag={announceResult.deterred ? "✓ COMMITTED" : "▲ COMMITTED"}
              >
                <RichCopy
                  html={
                    announceResult.deterred
                      ? COPY.announcedDeterred
                      : COPY.announcedWeak(siteName(announceResult.worst))
                  }
                />
              </Banner>
            )}

            {st.announced && !st.finished && (
              <div className="mt-3">
                <Button
                  onClick={() => runAutoQuarter(2)}
                  variant="outline"
                  className="gap-2"
                >
                  {COPY.autoRun}
                </Button>
              </div>
            )}

            <LogList rows={log2} />
          </Section>
        )}

        {/* ============ STAGE 3: hidden site ============ */}
        {stage === 3 && (
          <Section note={COPY.stageNotes[3]} head={COPY.s3head}>
            <Banner
              tone="intel"
              icon={<Radar className="size-4" aria-hidden />}
              tag="◈ INTEL"
            >
              <RichCopy
                html={st.covert.exists ? COPY.intelCovert : COPY.intelNone}
              />
            </Banner>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-muted-foreground flex items-center gap-2 text-sm">
                <Checkbox
                  checked={sweepChecked}
                  disabled={!sweepable}
                  onCheckedChange={(v) => setSweepChecked(v === true)}
                  aria-label={COPY.sweepLabel}
                />
                <span>{COPY.sweepLabel}</span>
              </label>
              {!st.finished && (
                <Button
                  onClick={() => runAutoQuarter(3)}
                  variant="outline"
                  className="gap-2"
                >
                  {COPY.autoRun}
                </Button>
              )}
            </div>

            <LogList rows={log3} />

            {sweepClose?.kind === "sealed" && (
              <Banner
                tone="clear"
                icon={<Check className="size-4" aria-hidden />}
                tag="✓ SEALED"
              >
                <RichCopy html={COPY.foundClose} />
              </Banner>
            )}
            {sweepClose?.kind === "dark" && (
              <Banner
                tone="truth"
                icon={<X className="size-4" aria-hidden />}
                tag="● DARK"
              >
                <RichCopy html={COPY.noSweepClose} />
              </Banner>
            )}
          </Section>
        )}

        {/* ============ STAGE 4: role flip ============ */}
        {stage === 4 && (
          <Section note={COPY.stageNotes[4]} head={COPY.s4head}>
            <div className="border-free-ride/60 bg-free-ride/5 mt-2 rounded-lg border-l-4 p-4">
              <p className="text-muted-foreground text-sm">
                <RichCopy html={COPY.s4sub} />
              </p>

              <div className="mt-3 space-y-2">
                {C.sites.map((s, i) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-3 text-sm"
                  >
                    <span>{s.name}</span>
                    <span className="bg-card border-border relative h-2.5 overflow-hidden rounded-full border">
                      <span
                        className="bg-free-ride absolute inset-y-0 left-0"
                        style={{ width: `${flipQ[i] * 100}%` }}
                      />
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {(flipQ[i] * 100).toFixed(0)}% (p*{" "}
                      {(PS[i] * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>

              {!flipDone && (
                <p className="text-muted-foreground mt-3 font-mono text-xs">
                  {COPY.flipQ(st.flip.done + 1, C.flipQuarters)}
                </p>
              )}

              {!flipDone && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => doFlip("comply")}
                    className="border-border border"
                  >
                    {COPY.flipComply}
                  </Button>
                  {C.sites.map((s, i) => {
                    const ev = (1 - flipQ[i]) * s.g - flipQ[i] * C.F;
                    return (
                      <Button
                        key={s.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => doFlip(i)}
                        className="border-border border"
                      >
                        {COPY.flipCheatAt(s.name, ev)}
                      </Button>
                    );
                  })}
                </div>
              )}

              <LogList rows={log4} />

              <p className="mt-3 font-mono text-sm">{COPY.tally(st.flip.tally)}</p>
            </div>

            {flipDone && (
              <div className="mt-4">
                <Button onClick={enterDebrief} className="gap-2">
                  {COPY.toDebrief}
                </Button>
              </div>
            )}
          </Section>
        )}

        {/* ============ STAGE 5: debrief ============ */}
        {stage === 5 && (
          <Debrief
            st={st}
            coverage={coverage()}
            onAgain={playAgain}
          />
        )}

        {/* facilitator notes */}
        <details className="border-border bg-muted/20 mt-6 rounded-lg border px-4 py-1">
          <summary className="text-muted-foreground cursor-pointer py-2.5 text-sm font-semibold select-none">
            {COPY.facsum}
          </summary>
          <ul className="text-muted-foreground mb-3 list-disc space-y-1.5 pl-5 text-sm [&_b]:text-foreground [&_b]:font-semibold">
            {COPY.facNotes.map((n, i) => (
              <li key={i}>
                <RichCopy html={n} />
              </li>
            ))}
          </ul>
        </details>
    </div>
  );
}

/* =================== presentational sub-components =================== */

function Section({
  note,
  head,
  children,
}: {
  note: string;
  head: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-card mt-5 rounded-lg border p-4">
      <p className="text-muted-foreground font-mono text-[11px] tracking-[0.1em] uppercase">
        {note}
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight" tabIndex={-1}>
        {head}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function QuarterStrip({ st }: { st: GameState }) {
  const cells = [];
  for (let q = 1; q <= C.quarters; q++) {
    const rec = st.quartersLog[q - 1];
    let tone = "pending";
    let mark = "·";
    if (rec) {
      if (rec.caught) {
        tone = "caught";
        mark = "✕ caught";
      } else if (rec.cheated) {
        tone = "missed";
        mark = "● missed";
      } else {
        tone = "clear";
        mark = "✓ clear";
      }
      if (q === st.q - 1 && !rec.caught && !st.finished) {
        tone = "pending";
        mark = "…";
      }
    }
    const now = q === st.q && !st.finished;
    cells.push(
      <div
        key={q}
        className={cn(
          "border-border w-[62px] rounded-md border px-0 py-1.5 text-center",
          now && "border-primary ring-primary/40 ring-1",
        )}
      >
        <div className="text-muted-foreground font-mono text-[10px]">Q{q}</div>
        <div
          className={cn(
            "mt-0.5 text-xs font-bold",
            tone === "clear" && "text-comply",
            tone === "caught" && "text-hide",
            tone === "missed" && "text-defect",
            tone === "pending" && "text-muted-foreground",
          )}
        >
          {mark}
        </div>
      </div>,
    );
  }
  return (
    <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden>
      {cells}
    </div>
  );
}

type BannerTone = "tip" | "intel" | "truth" | "clear";
const BANNER_TONE: Record<BannerTone, string> = {
  tip: "border-exaggerate/50 bg-exaggerate/10 [&_.tag]:text-exaggerate",
  intel: "border-hide/50 bg-hide/10 [&_.tag]:text-hide",
  truth: "border-defect/50 bg-defect/10 [&_.tag]:text-defect",
  clear: "border-comply/50 bg-comply/10 [&_.tag]:text-comply",
};

function Banner({
  tone,
  icon,
  tag,
  children,
}: {
  tone: BannerTone;
  icon: React.ReactNode;
  tag: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex gap-3 rounded-lg border p-3 text-sm [&_a]:underline [&_b]:text-foreground [&_b]:font-semibold",
        BANNER_TONE[tone],
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="tag mr-2 font-mono text-[10px] font-bold tracking-[0.1em] whitespace-nowrap">
          {tag}
        </span>
        <span>{children}</span>
      </div>
    </div>
  );
}

function LogRow({
  q,
  html,
  late,
}: {
  q: string;
  html: string;
  late?: boolean;
}) {
  return (
    <div className="border-border/70 grid grid-cols-[3rem_1fr] gap-3 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground font-mono text-[11px]">{q}</span>
      <span
        className={cn(
          "[&_b]:text-foreground [&_b]:font-semibold",
          late && "text-muted-foreground italic",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function LogList({ rows }: { rows: React.ReactNode[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="border-border mt-4 border-t">
      {rows}
    </div>
  );
}

/* debrief cards ------------------------------------------------------- */

function Debrief({
  st,
  coverage,
  onAgain,
}: {
  st: GameState;
  coverage: number[];
  onAgain: () => void;
}) {
  const cov = coverage;
  const shortNames = C.sites
    .filter((_, i) => cov[i] < PS[i] - 1e-9)
    .map((s) => s.name);

  // card 2
  const manual = st.quartersLog.filter((r) => r.mode === "manual");
  const hs = manual.map((_, idx) =>
    entropyOf(st.hist.slice(0, idx + 1), C.entropyWindow),
  );
  const meanH = (
    hs.reduce((a, b) => a + b, 0) / Math.max(1, hs.length)
  ).toFixed(2);
  const manualCheats = manual.filter((r) => r.cheated);
  let d2: string;
  if (manualCheats.length === 0) d2 = COPY.d2neverCheated(meanH);
  else if (manualCheats.some((r) => r.caution < 0.75))
    d2 = COPY.d2patterned(meanH);
  else d2 = COPY.d2noise(meanH);

  // card 3
  let d3: string;
  if (st.deterred) d3 = COPY.d3deterred;
  else {
    const evs = C.sites.map(
      (s, i) => (1 - st.announced![i]) * s.g - st.announced![i] * C.F,
    );
    let worst = 0;
    evs.forEach((e, i) => {
      if (e > evs[worst]) worst = i;
    });
    d3 = COPY.d3weak(siteName(worst));
  }
  const tips = manual.filter((r) => r.tip);
  let tipLine: string;
  if (tips.length === 0) tipLine = COPY.d3noTips;
  else {
    const gen = tips.filter((r) => r.tip!.genuine).length;
    const followed = tips.filter(
      (r) =>
        r.tip!.claim.site != null && r.placement.includes(r.tip!.claim.site),
    ).length;
    const burned = tips.filter(
      (r) =>
        !r.tip!.genuine &&
        r.tip!.claim.site != null &&
        r.placement.includes(r.tip!.claim.site) &&
        r.cheated &&
        !r.caught,
    ).length;
    tipLine = COPY.d3tips(tips.length, gen, followed, burned);
  }

  // card 4
  let d4: string;
  if (!st.covert.exists) d4 = COPY.d4noCovert;
  else d4 = st.covert.found ? COPY.d4foundBranch : COPY.d4missBranch;

  return (
    <Section note={COPY.stageNotes[5]} head={COPY.s5head}>
      <p className="text-muted-foreground text-sm">{COPY.s5sub}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* card 1 */}
        <DCard head={COPY.d1head}>
          <p className="text-muted-foreground text-sm">{COPY.d1body}</p>
          <div className="mt-3 space-y-1.5">
            {C.sites.map((s, i) => {
              const short = cov[i] < PS[i] - 1e-9;
              return (
                <div
                  key={s.id}
                  className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-2 text-xs"
                >
                  <span>{s.name}</span>
                  <span className="bg-muted border-border relative h-2.5 rounded-full border">
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        short ? "bg-defect" : "bg-comply",
                      )}
                      style={{ width: `${Math.min(100, cov[i] * 100)}%` }}
                    />
                    <span
                      className="bg-foreground absolute -top-0.5 -bottom-0.5 w-0.5"
                      style={{ left: `${PS[i] * 100}%` }}
                    />
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {(cov[i] * 100).toFixed(0)}% vs p* {(PS[i] * 100).toFixed(0)}
                    %{short ? " ▲" : " ✓"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            {shortNames.length
              ? COPY.d1short(shortNames.join(", "))
              : COPY.d1ok}
          </p>
        </DCard>

        {/* card 2 */}
        <DCard head={COPY.d2head}>
          <p className="text-muted-foreground text-sm">{d2}</p>
        </DCard>

        {/* card 3 */}
        <DCard head={COPY.d3head}>
          <p className="text-muted-foreground text-sm">{d3}</p>
          <p className="text-muted-foreground mt-2 text-sm">{tipLine}</p>
        </DCard>

        {/* card 4 */}
        <DCard head={COPY.d4head}>
          <p className="text-muted-foreground text-sm">{d4}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {COPY.d4flip(st.flip.tally)}
          </p>
          <div className="border-border bg-muted my-2 inline-block rounded-md border px-3 py-1.5 font-mono text-sm">
            {COPY.d4formula}
          </div>
          <p className="text-muted-foreground text-sm">{COPY.d4close}</p>
        </DCard>
      </div>

      <div className="mt-4">
        <Button variant="outline" onClick={onAgain} className="gap-2">
          <RotateCcw className="size-4" aria-hidden /> {COPY.againBtn}
        </Button>
      </div>
    </Section>
  );
}

function DCard({
  head,
  children,
}: {
  head: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card border-t-hide rounded-lg border border-t-[3px] p-4">
      <h3 className="text-base font-semibold">{head}</h3>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/* strip inline HTML for aria-live announcements */
function plainResult(rec: QuarterRecord): string {
  const names = rec.placement.map((i) => siteName(i)).join(" and ");
  let body = rec.caught
    ? `Teams at ${names}. Diversion caught at ${siteName(rec.site!)}.`
    : `Teams at ${names}. Nothing found.`;
  if (rec.sweep) body += rec.sweepFound ? " Site Nightjar confirmed." : " Sweep empty.";
  return body;
}
