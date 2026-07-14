"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CARDS,
  CONFIG,
  NEEDS,
  READERS,
  REPORT_CONSTRUCTOR_COPY as COPY,
  TAGS,
  cardById,
  readerById,
  type ReaderId,
} from "@/lib/verification/data/report-constructor";
import {
  evaluate,
  threadTotal,
  type FitResult,
  type ThreadMap,
} from "@/lib/verification/engines/report-constructor";
import {
  DragProvider,
  Draggable,
  DropZone,
  useArmedItem,
} from "../kit/drag";
import type { VerificationWidgetProps } from "../kit/types";

type Phase = "readers" | "notebook" | "thread" | "debrief";

/**
 * "Report Constructor" (Module 1 · Actors · 1.6). One inspection, three readers.
 * Pick up to 8 of 15 notebook entries (4 are pure traps that fit nowhere),
 * thread each to one of three desks, run a repeatable fit check, then file the
 * report for a per-desk debrief. Bridged: `onComplete` fires once, when the
 * report is filed. Fit scoring is delegated to the pure engine; the flow,
 * hint-gating, and attribution-pair lesson are ported from the source.
 */
export function ReportConstructor({ onComplete }: VerificationWidgetProps) {
  const [phase, setPhase] = useState<Phase>("readers");

  // ordered selected card ids
  const [sel, setSel] = useState<string[]>([]);
  // cardId -> Set(readerId)
  const [threads, setThreads] = useState<ThreadMap>(() => new Map());
  const [capMsg, setCapMsg] = useState("");
  const [threadHint, setThreadHint] = useState("");

  // check state
  const [checked, setChecked] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [lastResult, setLastResult] = useState<FitResult | null>(null);

  const filedOnce = useRef(false);
  const motionOK = useMotionOK();

  // Refs mirror the latest sel/threads so mutators can read them without
  // nesting setter callbacks (which must stay pure).
  const selRef = useRef(sel);
  const threadsRef = useRef(threads);
  useEffect(() => { selRef.current = sel; });
  useEffect(() => { threadsRef.current = threads; });

  const total = threadTotal(sel, threads);

  /* ---------- verdict lifecycle: editing voids the check ---------- */
  const clearVerdicts = useCallback(() => {
    setChecked((wasChecked) => {
      if (wasChecked) setLastResult(null);
      return false;
    });
  }, []);

  /* ---------- notebook pick ---------- */
  const toggleSelect = useCallback((id: string) => {
    const prev = selRef.current;
    if (prev.includes(id)) {
      setSel(prev.filter((x) => x !== id));
      setThreads((t) => {
        if (!t.has(id)) return t;
        const n = new Map(t);
        n.delete(id);
        return n;
      });
      setCapMsg("");
      return;
    }
    if (prev.length >= CONFIG.cap) {
      setCapMsg(COPY.capMsg);
      return;
    }
    setCapMsg("");
    setSel([...prev, id]);
  }, []);

  /* ---------- threading ---------- */
  const toggleThread = useCallback(
    (cardId: string, readerId: ReaderId) => {
      if (!selRef.current.includes(cardId)) return;
      const existing = threadsRef.current.get(cardId);
      const adding = !existing?.has(readerId);
      setThreads((t) => {
        const n = new Map(t);
        const set = new Set(n.get(cardId) ?? []);
        if (set.has(readerId)) set.delete(readerId);
        else set.add(readerId);
        if (set.size === 0) n.delete(cardId);
        else n.set(cardId, set);
        return n;
      });
      const tpl = adding ? COPY.threadedTpl : COPY.unthreadedTpl;
      setThreadHint(
        tpl[0] +
          cardById[cardId].title +
          tpl[1] +
          readerById[readerId].shortName +
          tpl[2],
      );
      clearVerdicts();
    },
    [clearVerdicts],
  );

  /* ---------- drop a card from the report ---------- */
  const dropCard = useCallback(
    (id: string) => {
      toggleSelect(id);
      clearVerdicts();
    },
    [toggleSelect, clearVerdicts],
  );

  /* ---------- the fit check ---------- */
  const runCheck = useCallback(() => {
    const result = evaluate(sel, threads);
    setLastResult(result);
    setCheckCount((prev) => {
      const rerun = checked; // re-click with nothing changed
      if (!result.clean && !rerun) return prev + 1;
      return prev;
    });
    setChecked(true);
  }, [sel, threads, checked]);

  /* ---------- file → debrief ---------- */
  const fileReport = useCallback(() => {
    if (!checked || !lastResult) return;
    setPhase("debrief");
    if (!filedOnce.current) {
      filedOnce.current = true;
      onComplete();
    }
  }, [checked, lastResult, onComplete]);

  /* ---------- reset ---------- */
  const reset = useCallback(() => {
    setPhase("readers");
    setSel([]);
    setThreads(new Map());
    setCapMsg("");
    setThreadHint("");
    setChecked(false);
    setCheckCount(0);
    setLastResult(null);
  }, []);

  return (
    <div className="not-prose my-6">
      {/* the supply chain framing — always visible at top */}
      <ChainStrip />

        {phase !== "debrief" && (
          <ReadersSection
            open={phase === "readers"}
            onOpen={() => setPhase("notebook")}
          />
        )}

        {(phase === "notebook" || phase === "thread") && (
          <NotebookSection
            sel={sel}
            capMsg={capMsg}
            active={phase === "notebook"}
            onToggle={toggleSelect}
            onAssemble={() => {
              clearVerdicts();
              setPhase("thread");
            }}
          />
        )}

        {phase === "thread" && (
          <ThreadSection
            sel={sel}
            threads={threads}
            checked={checked}
            checkCount={checkCount}
            result={lastResult}
            total={total}
            motionOK={motionOK}
            threadHint={threadHint}
            onBack={() => {
              setThreadHint("");
              setPhase("notebook");
            }}
            onThread={toggleThread}
            onDrop={dropCard}
            onCheck={runCheck}
            onFile={fileReport}
          />
        )}

        {phase === "debrief" && lastResult && (
          <DebriefSection
            sel={sel}
            threads={threads}
            result={lastResult}
            motionOK={motionOK}
            onAgain={reset}
          />
        )}
    </div>
  );
}

/* ================================================================= *
 *  The chain strip (behind you / you / ahead of you)                *
 * ================================================================= */
function ChainStrip() {
  const c = COPY.chain;
  return (
    <div className="border-border bg-muted/30 mb-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
      <ChainCell tag={c.upTag} body={c.upBody} q={c.upQ} />
      <ChainArrow />
      <ChainCell tag={c.youTag} body={c.youBody} q="" highlight />
      <ChainArrow />
      <ChainCell tag={c.downTag} body={c.downBody} q={c.downQ} />
    </div>
  );
}

function ChainCell({
  tag,
  body,
  q,
  highlight,
}: {
  tag: string;
  body: string;
  q: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {tag}
      </p>
      <p className="mt-1 text-sm font-medium">{body}</p>
      {q && <p className="text-muted-foreground mt-1 text-xs italic">{q}</p>}
    </div>
  );
}

function ChainArrow() {
  return (
    <ArrowRight
      className="text-muted-foreground mx-auto hidden size-4 rotate-90 sm:block sm:rotate-0"
      aria-hidden
    />
  );
}

/* ================================================================= *
 *  Readers section                                                  *
 * ================================================================= */
function ReadersSection({
  open,
  onOpen,
}: {
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <section aria-labelledby="rc-readers-head" className="mb-6">
      <h4 id="rc-readers-head" className="text-base font-semibold">
        {COPY.readersHead}
      </h4>
      <p className="text-muted-foreground mt-1 text-sm">{COPY.readersNote}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {READERS.map((r) => {
          const needs = NEEDS.filter((n) => n.aud === r.id);
          return (
            <div
              key={r.id}
              className="border-border bg-card flex flex-col rounded-lg border p-4"
              style={{ borderTopColor: r.color, borderTopWidth: 3 }}
            >
              <p className="text-sm font-semibold">{r.shortName}</p>
              <p className="text-muted-foreground text-xs">{r.name}</p>
              <p className="mt-2 text-sm">{r.role}</p>
              <ul className="mt-3 space-y-1.5">
                {needs.map((n) => (
                  <li
                    key={n.id}
                    className="text-muted-foreground flex gap-1.5 text-xs"
                  >
                    <span aria-hidden style={{ color: r.color }}>
                      •
                    </span>
                    {n.label}
                  </li>
                ))}
              </ul>
              <p className="border-border text-muted-foreground mt-3 border-t pt-2 text-xs italic">
                {r.standard}
              </p>
            </div>
          );
        })}
      </div>

      {open && (
        <Button onClick={onOpen} className="mt-4 gap-2">
          {COPY.openBtn} <ArrowRight className="size-4" aria-hidden />
        </Button>
      )}
    </section>
  );
}

/* ================================================================= *
 *  Notebook (pick up to 8)                                          *
 * ================================================================= */
function NotebookSection({
  sel,
  capMsg,
  active,
  onToggle,
  onAssemble,
}: {
  sel: string[];
  capMsg: string;
  active: boolean;
  onToggle: (id: string) => void;
  onAssemble: () => void;
}) {
  return (
    <section aria-labelledby="rc-pool-head" className="mb-6">
      <h4 id="rc-pool-head" className="text-base font-semibold">
        {COPY.poolHead}
      </h4>
      <p className="text-muted-foreground mt-1 text-sm">{COPY.poolNote}</p>

      <div
        className="text-muted-foreground mt-3 text-sm"
        aria-live="polite"
      >
        {COPY.counterTpl[0]}
        <b className="text-foreground">{sel.length}</b>
        {COPY.counterTpl[1]}
        {CONFIG.cap}
        {COPY.counterTpl[2]}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => {
          const on = sel.includes(c.id);
          const disabled = !on && sel.length >= CONFIG.cap && active;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              disabled={!active}
              onClick={() => onToggle(c.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                on
                  ? "border-primary bg-primary/5 ring-primary/40 ring-1"
                  : "border-border bg-card hover:bg-muted/50",
                disabled && "opacity-60",
                !active && "cursor-default",
              )}
            >
              <span className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
                {TAGS[c.tag]}
              </span>
              <span className="mt-1 block text-sm font-semibold">
                {c.title}
              </span>
              <span className="text-muted-foreground mt-1 block text-xs leading-snug">
                {c.body}
              </span>
            </button>
          );
        })}
      </div>

      {capMsg && (
        <p className="text-exaggerate mt-2 text-xs" role="alert">
          {capMsg}
        </p>
      )}

      {active && (
        <Button
          onClick={onAssemble}
          disabled={sel.length === 0}
          className="mt-4 gap-2"
        >
          {COPY.assembleBtn}
          {sel.length ? ` (${sel.length})` : ""}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      )}
    </section>
  );
}

/* ================================================================= *
 *  Thread board                                                     *
 * ================================================================= */
function ThreadSection({
  sel,
  threads,
  checked,
  checkCount,
  result,
  total,
  motionOK,
  threadHint,
  onBack,
  onThread,
  onDrop,
  onCheck,
  onFile,
}: {
  sel: string[];
  threads: ThreadMap;
  checked: boolean;
  checkCount: number;
  result: FitResult | null;
  total: number;
  motionOK: boolean;
  threadHint: string;
  onBack: () => void;
  onThread: (cardId: string, readerId: ReaderId) => void;
  onDrop: (id: string) => void;
  onCheck: () => void;
  onFile: () => void;
}) {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (checked && summaryRef.current) {
      summaryRef.current.focus({ preventScroll: true });
      summaryRef.current.scrollIntoView({
        behavior: motionOK ? "smooth" : "auto",
        block: "nearest",
      });
    }
  }, [checked, motionOK]);

  const showHints = checkCount >= CONFIG.hintAfter;

  return (
    <section aria-labelledby="rc-thread-head" className="mb-6">
      <h4 id="rc-thread-head" className="text-base font-semibold">
        {COPY.threadHead}
      </h4>
      <p className="text-muted-foreground mt-1 text-sm">{COPY.threadHowto}</p>

      <DragProvider onDrop={(itemId, zoneId) => onThread(itemId, zoneId as ReaderId)}>
        <ThreadBoard
          sel={sel}
          threads={threads}
          checked={checked}
          showHints={showHints}
          result={result}
          onThread={onThread}
          onDrop={onDrop}
        />
      </DragProvider>

      <p
        className="text-muted-foreground mt-2 min-h-4 text-xs"
        aria-live="polite"
      >
        {threadHint}
      </p>

      {/* summary */}
      <div
        ref={summaryRef}
        tabIndex={-1}
        aria-live="polite"
        className={cn(
          "mt-4 rounded-lg border p-3 text-sm outline-none",
          checked && result
            ? result.clean
              ? "border-comply/40 bg-comply/5"
              : "border-border bg-muted/40"
            : "hidden",
        )}
      >
        {checked && result && <Summary result={result} />}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={onBack}>
          {COPY.backBtn}
        </Button>
        <Button onClick={onCheck} disabled={total === 0}>
          {checked ? COPY.recheckBtn : COPY.checkBtn}
        </Button>
        {checked && (
          <Button onClick={onFile} className="gap-2">
            {COPY.fileBtn} <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </section>
  );
}

function ThreadBoard({
  sel,
  threads,
  checked,
  showHints,
  result,
  onThread,
  onDrop,
}: {
  sel: string[];
  threads: ThreadMap;
  checked: boolean;
  showHints: boolean;
  result: FitResult | null;
  onThread: (cardId: string, readerId: ReaderId) => void;
  onDrop: (id: string) => void;
}) {
  const armed = useArmedItem();

  // keyboard 1/2/3 threads the armed card to a desk (matches the source)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat || !armed) return;
      if (["1", "2", "3"].includes(e.key)) {
        const r = READERS[Number(e.key) - 1];
        if (r) onThread(armed, r.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [armed, onThread]);

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      {/* the report column */}
      <div>
        <p className="text-muted-foreground mb-2 font-mono text-[11px] tracking-[0.12em] uppercase">
          {COPY.repTag}
        </p>
        <div className="space-y-2">
          {sel.map((id) => {
            const c = cardById[id];
            const set = threads.get(id) ?? new Set<ReaderId>();
            const dead =
              checked && result ? result.dead.includes(id) : false;
            return (
              <Draggable
                key={id}
                id={id}
                label={c.title}
                armedClassName="ring-primary ring-2"
              >
                <div
                  className={cn(
                    "border-border bg-card relative rounded-lg border p-3",
                    dead && "border-exaggerate/50 bg-exaggerate/5",
                  )}
                >
                  <button
                    type="button"
                    aria-label={COPY.dropLabel[0] + c.title + COPY.dropLabel[1]}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDrop(id);
                    }}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-2 right-2 rounded p-0.5"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                  <div className="flex items-start justify-between gap-2 pr-6">
                    <span className="text-sm font-semibold">{c.title}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase">
                      {TAGS[c.tag]}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs leading-snug">
                    {c.body}
                  </p>

                  {/* thread chips */}
                  {set.size > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {READERS.filter((r) => set.has(r.id)).map((r) => {
                        const ok = checked
                          ? cardById[id].fits[r.id].ok
                          : null;
                        const label =
                          (ok === null
                            ? ""
                            : ok
                              ? COPY.fitLabel
                              : COPY.misfitLabel) +
                          COPY.removeThreadLabel[0] +
                          c.title +
                          COPY.removeThreadLabel[1] +
                          r.name +
                          COPY.removeThreadLabel[2];
                        return (
                          <button
                            key={r.id}
                            type="button"
                            aria-label={label}
                            onClick={(e) => {
                              e.stopPropagation();
                              onThread(id, r.id);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              ok === false &&
                                "border-defect/50 bg-defect/5 text-defect",
                            )}
                            style={
                              ok === false
                                ? undefined
                                : {
                                    backgroundColor: r.chipBg,
                                    color: r.chipFg,
                                    borderColor: r.chipFg,
                                  }
                            }
                          >
                            {ok !== null && (
                              <span aria-hidden>{ok ? "✓" : "✗"}</span>
                            )}
                            {r.shortName}
                            <X className="size-3" aria-hidden />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {dead && (
                    <p className="text-exaggerate mt-2 text-xs" role="note">
                      {COPY.deadNote}
                    </p>
                  )}
                </div>
              </Draggable>
            );
          })}
        </div>
      </div>

      {/* the desks column */}
      <div>
        <p className="text-muted-foreground mb-2 font-mono text-[11px] tracking-[0.12em] uppercase">
          {COPY.deskTag}
        </p>
        <div className="space-y-3">
          {READERS.map((r, ri) => {
            const needs = NEEDS.filter((n) => n.aud === r.id);
            const verdicts =
              checked && result
                ? result.verdicts.filter((v) => v.reader === r.id)
                : [];
            const buried =
              checked && result ? result.buried.includes(r.id) : false;
            return (
              <DropZone
                key={r.id}
                id={r.id}
                label={COPY.deskBtnLabel + r.name}
              >
                <div
                  className={cn(
                    "border-border bg-card rounded-lg border p-3",
                    armed && "border-dashed",
                  )}
                  style={{ borderLeftColor: r.color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{r.shortName}</p>
                      <p className="text-muted-foreground text-xs">{r.name}</p>
                    </div>
                    <span
                      aria-hidden
                      className="font-mono text-[10px]"
                      style={{ color: r.color }}
                    >
                      [{ri + 1}]
                    </span>
                  </div>

                  {/* reader needs */}
                  <ul className="mt-2 space-y-1">
                    {needs.map((n) => {
                      const met =
                        checked && result ? result.needsMet.has(n.id) : null;
                      return (
                        <li key={n.id} className="text-xs">
                          <span className="flex gap-1.5">
                            <span
                              aria-hidden
                              className={cn(
                                met === true && "text-comply",
                                met === false && "text-muted-foreground",
                                met === null && "text-muted-foreground",
                              )}
                            >
                              {met === true ? "●" : "○"}
                            </span>
                            <span
                              className={cn(
                                met === false
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {n.label}
                            </span>
                          </span>
                          {met === false && showHints && (
                            <span className="text-muted-foreground mt-0.5 block pl-5 text-[11px] italic">
                              {n.hint}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <p className="text-muted-foreground mt-2 text-[11px] italic">
                    {r.standard}
                  </p>

                  {buried && (
                    <p className="text-exaggerate mt-2 text-[11px]" role="note">
                      Buried — this desk is flooded with material it can’t use.
                    </p>
                  )}

                  {/* verdict rows */}
                  {verdicts.length > 0 && (
                    <ul className="border-border mt-2 space-y-1.5 border-t pt-2">
                      {verdicts.map((v, i) => (
                        <li
                          key={i}
                          className={cn(
                            "flex gap-1.5 text-xs",
                            v.ok ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          <span
                            aria-hidden
                            className={v.ok ? "text-comply" : "text-defect"}
                          >
                            {v.ok ? "✓" : "✗"}
                          </span>
                          <span>
                            <b>{v.title} — </b>
                            {v.note}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </DropZone>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Summary({ result }: { result: FitResult }) {
  const s = COPY.summary;
  return (
    <div>
      <p>
        {s.needs[0]}
        <b>{result.needsMet.size}</b>
        {s.needs[1]}
        {NEEDS.length}
        {s.misfits[0]}
        <b>{result.misfits}</b>
        {s.dead[0]}
        <b>{result.dead.length}</b>
      </p>
      {result.clean && <p className="mt-1">{s.clean}</p>}
      {result.buried.length > 0 && (
        <p className="text-exaggerate mt-2">
          {s.buriedTpl[0]}
          {result.buried
            .map((id) => readerById[id].shortName.toLowerCase())
            .join(" and ")}
          {s.buriedTpl[1]}
        </p>
      )}
    </div>
  );
}

/* ================================================================= *
 *  Debrief                                                          *
 * ================================================================= */
function DebriefSection({
  sel,
  threads,
  result,
  motionOK,
  onAgain,
}: {
  sel: string[];
  threads: ThreadMap;
  result: FitResult;
  motionOK: boolean;
  onAgain: () => void;
}) {
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
    headRef.current?.scrollIntoView({
      behavior: motionOK ? "smooth" : "auto",
      block: "start",
    });
  }, [motionOK]);

  // lesson + optional brevity line
  let lesson = COPY.lesson as string;
  if (result.clean && sel.length <= 6) {
    lesson += " " + COPY.brevityTpl[0] + sel.length + COPY.brevityTpl[1];
  }

  // the attribution pair — always taught, three variants
  const filedFit = (id: string) =>
    sel.includes(id) &&
    !!threads.get(id) &&
    [...(threads.get(id) as Set<ReaderId>)].some(
      (rid) => cardById[id].fits[rid].ok,
    );
  const pairHtml = sel.includes("launder")
    ? COPY.pairPicked
    : filedFit("claimrma")
      ? COPY.pairClean
      : COPY.pairSkipped;

  return (
    <section aria-labelledby="rc-debrief-head" className="mt-2">
      <h4
        id="rc-debrief-head"
        ref={headRef}
        tabIndex={-1}
        className="text-base font-semibold outline-none"
      >
        {COPY.debriefHead}
      </h4>
      <p className="text-muted-foreground mt-1 text-sm">{COPY.debriefNote}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {READERS.map((r) => {
          const got = sel.filter(
            (id) =>
              !!threads.get(id) &&
              (threads.get(id) as Set<ReaderId>).has(r.id) &&
              cardById[id].fits[r.id].ok,
          );
          return (
            <div
              key={r.id}
              className="border-border bg-card rounded-lg border p-4"
              style={{ borderTopColor: r.color, borderTopWidth: 3 }}
            >
              <p className="text-sm font-semibold">{r.shortName}</p>
              {got.length ? (
                <ul className="mt-2 space-y-1">
                  {got.map((id) => (
                    <li key={id} className="flex gap-1.5 text-sm">
                      <span aria-hidden style={{ color: r.color }}>
                        ✓
                      </span>
                      {cardById[id].title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm italic">
                  {COPY.filedNone}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm">{lesson}</p>

      <p
        className="border-hide/40 bg-hide/5 mt-4 rounded-lg border-l-2 p-3 text-sm [&_b]:font-semibold"
        dangerouslySetInnerHTML={{ __html: pairHtml }}
      />

      <p
        className="text-muted-foreground mt-4 text-sm [&_b]:text-foreground [&_b]:font-semibold"
        dangerouslySetInnerHTML={{ __html: COPY.trapsNote }}
      />

      <p className="text-foreground mt-4 text-sm font-medium">{COPY.forward}</p>

      <Button variant="outline" onClick={onAgain} className="mt-4 gap-2">
        <RotateCcw className="size-4" aria-hidden /> {COPY.again}
      </Button>
    </section>
  );
}

/* ================================================================= *
 *  prefers-reduced-motion                                           *
 * ================================================================= */
function useMotionOK() {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setOk(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return ok;
}
