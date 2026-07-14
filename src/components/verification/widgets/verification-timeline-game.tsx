"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Check,
  Lock,
  RotateCcw,
  Copy as CopyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import type { VerificationWidgetProps } from "../kit/types";
import {
  CARD,
  CONCEPT_CHIPS,
  COPY,
  DECISIONS,
  ECHO_CARDS,
  ENDINGS,
  EVENTS,
  FAIL_CHIPS,
  FAIL_QUOTES,
  FAILS,
  FOG,
  FORK,
  GENEVA,
  INSPECTOR,
  INTEL,
  LAB,
  MATRIX,
  PATHS,
  REGIMES,
  ROLL,
  trackerText,
  type Choice,
  type FailKey,
  type GameEvent,
  type OutcomeKey,
  type PathKey,
  type RegimeKey,
} from "@/lib/verification/data/verification-timeline-game";

/* ============ persisted state (localStorage key vg-state-2) ============ */

const STORAGE_KEY = "vg-state-2";

interface Persisted {
  explored: string[];
  endings: { bad: boolean; good: boolean };
  regime: RegimeKey | null;
}

type GState = {
  explored: Record<string, boolean>;
  endings: { bad: boolean; good: boolean };
  lastRegime: RegimeKey | null;
  // true once localStorage has been read on the client; gates persistence so
  // we never overwrite stored progress before hydrating it.
  hydrated: boolean;
};

type GAction =
  | { type: "explore"; id: string }
  | { type: "ending"; kind: "bad" | "good" }
  | { type: "regime"; regime: RegimeKey }
  | { type: "reset" }
  | { type: "hydrate"; state: Omit<GState, "hydrated"> };

function reducer(s: GState, a: GAction): GState {
  switch (a.type) {
    case "explore":
      if (s.explored[a.id]) return s;
      return { ...s, explored: { ...s.explored, [a.id]: true } };
    case "ending":
      if (s.endings[a.kind]) return s;
      return { ...s, endings: { ...s.endings, [a.kind]: true } };
    case "regime":
      return { ...s, lastRegime: a.regime };
    case "reset":
      return {
        explored: {},
        endings: { bad: false, good: false },
        lastRegime: null,
        hydrated: s.hydrated,
      };
    case "hydrate":
      return { ...a.state, hydrated: true };
  }
}

const EMPTY: GState = {
  explored: {},
  endings: { bad: false, good: false },
  lastRegime: null,
  hydrated: false,
};

/* ============ derived path helpers (mirror the source) ============ */

const pathEvents: Record<PathKey, GameEvent[]> = { r: [], t: [], v: [] };
EVENTS.forEach((e) => pathEvents[e.path].push(e));
const byId: Record<string, GameEvent> = {};
EVENTS.forEach((e) => (byId[e.id] = e));
const FAIL_KEYS = Object.keys(FAILS) as FailKey[];

function anyFailExplored(explored: Record<string, boolean>) {
  return FAIL_KEYS.some((k) => explored[k]);
}
function pathDone(k: PathKey, explored: Record<string, boolean>) {
  if (k === "r") return !!explored.a4;
  if (k === "t") return !!explored.b4;
  return !!explored.c4 || anyFailExplored(explored);
}
function timelinesDone(explored: Record<string, boolean>) {
  return (["r", "t", "v"] as PathKey[]).filter((k) => pathDone(k, explored)).length;
}
function endingsDone(endings: { bad: boolean; good: boolean }) {
  return (endings.bad ? 1 : 0) + (endings.good ? 1 : 0);
}

function weightFor(regime: RegimeKey, k: OutcomeKey): number | null {
  const hit = REGIMES[regime].odds.find((o) => o.k === k);
  return hit ? hit.w : null;
}

/* ============ path accent (semantic, always paired with a label) ============
   comply=green (restraint/hold), defect=vermillion (race/hedge). The treaty
   and fail lanes use neutral/navy tokens; the verify lane uses hide=blue. */
const PATH_ACCENT: Record<PathKey | "f" | "n", string> = {
  r: "text-defect",
  t: "text-exaggerate",
  v: "text-comply",
  f: "text-free-ride",
  n: "text-foreground",
};
const PATH_BORDER: Record<PathKey | "f" | "n", string> = {
  r: "border-l-defect",
  t: "border-l-exaggerate",
  v: "border-l-comply",
  f: "border-l-free-ride",
  n: "border-l-primary",
};
const PATH_DOT: Record<string, string> = {
  r: "bg-defect",
  t: "bg-exaggerate",
  v: "bg-comply",
  f: "bg-free-ride",
};

/* ============ journey step model ============ */

type Step =
  | { kind: "event"; ev: GameEvent }
  | { kind: "fail"; fid: FailKey }
  | { kind: "fork" }
  | { kind: "geneva" }
  | { kind: "matrix" }
  | { kind: "decision"; which: 1 | 2 | 3 }
  | { kind: "fog" }
  | { kind: "inspector" }
  | { kind: "lab"; cfg: { p: number; note: string }; anchor: string }
  | { kind: "roll"; regime: RegimeKey }
  | { kind: "terminus"; termKey: PathKey | FailKey }
  | {
      kind: "card";
      pathKey: PathKey;
      fate: FailKey | null;
      regime: RegimeKey | null;
      weight: number | null;
    };

const usePrefersReducedMotion = () => {
  const [reduce, setReduce] = useState(() =>
    typeof window !== "undefined" && "matchMedia" in window
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    // subscribe only; the current value was read in the state initializer
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
};

export function VerificationTimelineGame({
  onComplete,
}: VerificationWidgetProps) {
  const [gs, dispatch] = useReducer(reducer, EMPTY);
  const reduceMotion = usePrefersReducedMotion();

  // view: "map" hub or an open journey rooted at a start id.
  const [journey, setJourney] = useState<{ startId: string } | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [hint, setHint] = useState(COPY.mapHint);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  /* hydrate + persist */
  useEffect(() => {
    let restored: Omit<GState, "hydrated"> = {
      explored: {},
      endings: { bad: false, good: false },
      lastRegime: null,
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Persisted;
        const explored: Record<string, boolean> = {};
        (s.explored || []).forEach((id) => (explored[id] = true));
        restored = {
          explored,
          endings: {
            bad: !!(s.endings && s.endings.bad),
            good: !!(s.endings && s.endings.good),
          },
          lastRegime: s.regime || null,
        };
      }
    } catch {
      /* storage unavailable — session-only progress */
    }
    // Flip the `hydrated` flag through the reducer (not a synchronous setState)
    // so persistence begins only after the stored progress is read.
    dispatch({ type: "hydrate", state: restored });
  }, []);

  useEffect(() => {
    if (!gs.hydrated) return;
    try {
      const payload: Persisted = {
        explored: Object.keys(gs.explored),
        endings: gs.endings,
        regime: gs.lastRegime,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [gs]);

  function flashHint(msg: string) {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(COPY.mapHint), 2400);
  }

  const anyExplored = Object.keys(gs.explored).length > 0;
  const tl = timelinesDone(gs.explored);
  const en = endingsDone(gs.endings);
  const allDone = tl === 3;

  /* ============ journey assembly (mirrors openJourney/appendChain) ============ */

  const buildInitial = useCallback(
    (startId: string): { header: { label: string; accent: PathKey | "f" | "n" }; steps: Step[] } => {
      const out: Step[] = [];
      if (startId === "fork") {
        out.push({ kind: "fork" });
        out.push({ kind: "matrix" });
        out.push({ kind: "decision", which: 1 });
        return { header: { label: `${FORK.year} · THE FORK`, accent: "n" }, steps: out };
      }
      if (FAILS[startId as FailKey]) {
        const fid = startId as FailKey;
        out.push({ kind: "fail", fid });
        out.push({ kind: "terminus", termKey: fid });
        out.push({
          kind: "card",
          pathKey: "v",
          fate: fid,
          regime: gs.lastRegime,
          weight: gs.lastRegime ? weightFor(gs.lastRegime, fid) : null,
        });
        return {
          header: { label: "PATH C · FAILURE MODE", accent: "f" },
          steps: out,
        };
      }
      const ev = byId[startId];
      const idx = pathEvents[ev.path].indexOf(ev);
      pushEvent(out, ev);
      if (ev.path === "v") {
        if (idx === 0) {
          pushEvent(out, pathEvents.v[1]);
          out.push({ kind: "decision", which: 3 });
        } else if (idx === 1) {
          out.push({ kind: "decision", which: 3 });
        } else {
          pathEvents.v.slice(idx + 1).forEach((e2) => pushEvent(out, e2));
          out.push({ kind: "terminus", termKey: "v" });
          out.push({
            kind: "card",
            pathKey: "v",
            fate: null,
            regime: gs.lastRegime,
            weight: null,
          });
        }
      } else {
        pathEvents[ev.path]
          .slice(idx + 1)
          .forEach((e2) => pushEvent(out, e2));
        out.push({ kind: "terminus", termKey: ev.path });
        out.push({
          kind: "card",
          pathKey: ev.path,
          fate: null,
          regime: null,
          weight: null,
        });
      }
      return {
        header: { label: PATHS[ev.path].label, accent: ev.path },
        steps: out,
      };
    },
    [gs.lastRegime],
  );

  const [header, setHeader] = useState<{ label: string; accent: PathKey | "f" | "n" }>(
    { label: "", accent: "n" },
  );

  function openJourney(startId: string) {
    const built = buildInitial(startId);
    setHeader(built.header);
    setSteps(built.steps);
    setJourney({ startId });
  }

  function closeJourney() {
    setJourney(null);
    setSteps([]);
  }

  function onNodeClick(id: string) {
    if (id === "fork" || gs.explored[id]) openJourney(id);
    else if (FAILS[id as FailKey]) flashHint(COPY.lockedFate);
    else flashHint(COPY.lockedFork);
  }

  /* ============ IntersectionObserver — mark explored / record endings ============ */
  useEffect(() => {
    if (!journey || !trackRef.current) return;
    const root = trackRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const nodeId = el.getAttribute("data-node");
          if (nodeId && (byId[nodeId] || FAILS[nodeId as FailKey])) {
            dispatch({ type: "explore", id: nodeId });
          }
          const termKey = el.getAttribute("data-terminus");
          if (termKey) {
            const kind = termKey === "v" ? "good" : "bad";
            dispatch({ type: "ending", kind });
            onComplete();
          }
          obs.unobserve(el);
        });
      },
      { root, threshold: 0.25 },
    );
    const watched = root.querySelectorAll("[data-watch]");
    watched.forEach((w) => obs.observe(w));
    return () => obs.disconnect();
    // re-run whenever the step list grows
  }, [journey, steps, onComplete]);

  const scrollToAnchor = useCallback(
    (anchor: string) => {
      requestAnimationFrame(() => {
        const el = trackRef.current?.querySelector<HTMLElement>(
          `[data-anchor="${anchor}"]`,
        );
        el?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    },
    [reduceMotion],
  );

  /* ============ choice handlers (mirror onChoice) ============ */

  const [chosen, setChosen] = useState<Record<number, string>>({});
  const [rollLocked, setRollLocked] = useState(false);

  /* reset choice/roll transient state whenever a new journey opens.
     Adjust-state-during-render: compare the journey against the value we last
     reset for, and clear synchronously in render (no state-syncing effect). */
  const [journeyForReset, setJourneyForReset] = useState(journey);
  if (journey !== journeyForReset) {
    setJourneyForReset(journey);
    setChosen({});
    setRollLocked(false);
  }

  function appendChainSteps(pathKey: PathKey): { steps: Step[]; anchor: string } {
    const out: Step[] = [];
    setHeader({ label: PATHS[pathKey].label, accent: pathKey });
    if (pathKey === "v") {
      pathEvents.v.slice(0, 2).forEach((ev) => pushEvent(out, ev));
      out.push({ kind: "decision", which: 3 });
      return { steps: out, anchor: `event-${pathEvents.v[0].id}` };
    }
    pathEvents[pathKey].forEach((ev) => pushEvent(out, ev));
    out.push({ kind: "terminus", termKey: pathKey });
    out.push({ kind: "card", pathKey, fate: null, regime: null, weight: null });
    return { steps: out, anchor: `event-${pathEvents[pathKey][0].id}` };
  }

  function onDecisionChoice(which: 1 | 2 | 3, choice: string) {
    setChosen((c) => ({ ...c, [which]: choice }));
    if (choice === "race") {
      const { steps: add, anchor } = appendChainSteps("r");
      setSteps((s) => [...s, ...add]);
      scrollToAnchor(anchor);
    } else if (choice === "sign") {
      const { steps: add, anchor } = appendChainSteps("t");
      setSteps((s) => [...s, ...add]);
      scrollToAnchor(anchor);
    } else if (choice === "hold") {
      const { steps: add, anchor } = appendChainSteps("v");
      setSteps((s) => [...s, ...add]);
      scrollToAnchor(anchor);
    } else if (choice === "nego") {
      setSteps((s) => [
        ...s,
        { kind: "geneva" },
        { kind: "decision", which: 2 },
      ]);
      scrollToAnchor("geneva");
    } else if (choice === "lean" || choice === "swiss") {
      if (rollLocked) return; // a fate is already locked in
      setSteps((s) => {
        // drop any un-rolled roll section, then add fresh
        const filtered = s.filter((st) => st.kind !== "roll");
        return [...filtered, { kind: "roll", regime: choice }];
      });
      scrollToAnchor("roll");
    }
  }

  function onRolled(regime: RegimeKey, outcome: OutcomeKey) {
    setRollLocked(true);
    dispatch({ type: "regime", regime });
    setSteps((s) => {
      const add: Step[] = [];
      if (outcome === "ok") {
        pathEvents.v.slice(2).forEach((ev) => pushEvent(add, ev));
        add.push({ kind: "terminus", termKey: "v" });
        add.push({ kind: "card", pathKey: "v", fate: null, regime, weight: null });
      } else {
        const fid = outcome as FailKey;
        pushEvent(add, FAILS[fid] as unknown as GameEvent, true);
        add.push({ kind: "terminus", termKey: fid });
        add.push({
          kind: "card",
          pathKey: "v",
          fate: fid,
          regime,
          weight: weightFor(regime, fid),
        });
      }
      return [...s, ...add];
    });
    const anchor =
      outcome === "ok" ? `event-${pathEvents.v[2].id}` : `event-${outcome}`;
    setTimeout(
      () => scrollToAnchor(anchor),
      reduceMotion ? 0 : 500,
    );
  }

  /* ============ render ============ */

  const beginLabel = anyExplored
    ? allDone
      ? COPY.begin.all
      : COPY.begin.some
    : COPY.begin.idle;

  return (
    <div className="not-prose border-border bg-card shadow-soft my-6 overflow-hidden rounded-xl border">
      <div className="border-border/70 flex flex-wrap items-center justify-end gap-2 border-b px-5 py-3">
        <span className="border-border bg-muted/40 text-muted-foreground rounded-full border px-3 py-1 font-mono text-[11px]">
          {trackerText(tl, en)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => {
            dispatch({ type: "reset" });
            flashHint("Progress cleared");
          }}
        >
          <RotateCcw className="size-3.5" aria-hidden /> {COPY.reset}
        </Button>
      </div>

      <div className="p-5">
        {journey ? (
          <Journey
            trackRef={trackRef}
            header={header}
            steps={steps}
            chosen={chosen}
            rollLocked={rollLocked}
            onDecisionChoice={onDecisionChoice}
            onRolled={onRolled}
            onClose={closeJourney}
            reduceMotion={reduceMotion}
            tl={tl}
            en={en}
          />
        ) : (
          <MapHub
            explored={gs.explored}
            endings={gs.endings}
            beginLabel={beginLabel}
            hint={hint}
            onNodeClick={onNodeClick}
          />
        )}
      </div>
    </div>
  );
}

function pushEvent(out: Step[], ev: GameEvent, isFail = false) {
  if (isFail) {
    out.push({ kind: "fail", fid: ev.id as FailKey });
    return;
  }
  out.push({ kind: "event", ev });
  if (ev.fog) out.push({ kind: "fog" });
  if (ev.lab) out.push({ kind: "lab", cfg: ev.lab, anchor: `lab-${ev.id}` });
  if (ev.inspector) out.push({ kind: "inspector" });
}

/* ============ MAP HUB ============ */

function MapHub({
  explored,
  endings,
  beginLabel,
  hint,
  onNodeClick,
}: {
  explored: Record<string, boolean>;
  endings: { bad: boolean; good: boolean };
  beginLabel: string;
  hint: string;
  onNodeClick: (id: string) => void;
}) {
  return (
    <div>
      {/* legend */}
      <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        {COPY.legend.map((l) => (
          <span key={l.k} className="flex items-center gap-1.5">
            <span
              className={cn("inline-block size-2.5 rounded-full", PATH_DOT[l.k])}
              aria-hidden
            />
            {l.label}
          </span>
        ))}
      </div>

      {/* fork */}
      <div className="mb-4 flex justify-center">
        <button
          type="button"
          onClick={() => onNodeClick("fork")}
          className="border-primary/40 bg-primary/5 hover:bg-primary/10 focus-visible:ring-ring rounded-xl border-2 border-dashed px-5 py-3 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
            {COPY.forkNodeLabel}
          </p>
          <p className="text-primary mt-1 text-sm font-semibold tracking-wide">
            {beginLabel}
          </p>
        </button>
      </div>

      {/* three path columns */}
      <div className="grid gap-3 md:grid-cols-3">
        {(["r", "t", "v"] as PathKey[]).map((pk) => (
          <div
            key={pk}
            className={cn(
              "bg-muted/20 space-y-2 rounded-lg border-l-2 p-3",
              PATH_BORDER[pk],
            )}
          >
            <p className={cn("font-mono text-[11px] font-semibold tracking-[0.1em] uppercase", PATH_ACCENT[pk])}>
              {PATHS[pk].label}
            </p>
            {pathEvents[pk].map((ev) => (
              <NodeButton
                key={ev.id}
                year={ev.year}
                title={ev.title}
                lit={!!explored[ev.id]}
                onClick={() => onNodeClick(ev.id)}
              />
            ))}
            {pk === "v" && (
              <div className="mt-3 space-y-2 border-t border-dashed pt-3">
                <p className={cn("font-mono text-[11px] font-semibold tracking-[0.1em] uppercase", PATH_ACCENT.f)}>
                  FAILURE MODES
                </p>
                {FAIL_KEYS.map((fid) => (
                  <NodeButton
                    key={fid}
                    year={FAILS[fid].year}
                    title={FAILS[fid].title}
                    lit={!!explored[fid]}
                    fail
                    onClick={() => onNodeClick(fid)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* endings */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <EndingChip
          label="UNCONTROLLED ASI"
          lit={endings.bad}
          tone="bad"
        />
        <EndingChip label="STABLE REGIME" lit={endings.good} tone="good" />
      </div>

      <p
        className="text-muted-foreground mt-4 text-center text-xs"
        aria-live="polite"
      >
        {hint}
      </p>
    </div>
  );
}

function NodeButton({
  year,
  title,
  lit,
  fail,
  onClick,
}: {
  year: string;
  title: string;
  lit: boolean;
  fail?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        lit ? `${year} — ${title}` : `${year} — locked node`
      }
      className={cn(
        "focus-visible:ring-ring flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none",
        lit
          ? "border-border bg-card hover:bg-muted"
          : "border-border/50 bg-transparent",
      )}
    >
      <span
        className={cn(
          "inline-block shrink-0 rounded-full",
          fail ? "size-1.5" : "size-2",
          lit ? PATH_DOT[fail ? "f" : "n"] || "bg-primary" : "bg-muted-foreground/30",
        )}
        aria-hidden
      />
      <span className="text-muted-foreground font-mono">{year}</span>
      <span className={cn("truncate", lit ? "text-foreground font-medium" : "text-muted-foreground/60")}>
        {lit ? title : "· · ·"}
      </span>
      {!lit && <Lock className="text-muted-foreground/40 ml-auto size-3" aria-hidden />}
    </button>
  );
}

function EndingChip({
  label,
  lit,
  tone,
}: {
  label: string;
  lit: boolean;
  tone: "bad" | "good";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-center font-mono text-xs tracking-[0.1em]",
        lit
          ? tone === "good"
            ? "border-comply/50 bg-comply/10 text-comply"
            : "border-defect/50 bg-defect/10 text-defect"
          : "border-border/60 text-muted-foreground/50 border-dashed",
      )}
    >
      {lit ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Lock className="size-3.5" aria-hidden />
      )}
      {label}
    </div>
  );
}

/* ============ JOURNEY ============ */

function Journey({
  trackRef,
  header,
  steps,
  chosen,
  rollLocked,
  onDecisionChoice,
  onRolled,
  onClose,
  reduceMotion,
  tl,
  en,
}: {
  trackRef: React.RefObject<HTMLDivElement | null>;
  header: { label: string; accent: PathKey | "f" | "n" };
  steps: Step[];
  chosen: Record<number, string>;
  rollLocked: boolean;
  onDecisionChoice: (which: 1 | 2 | 3, choice: string) => void;
  onRolled: (regime: RegimeKey, outcome: OutcomeKey) => void;
  onClose: () => void;
  reduceMotion: boolean;
  tl: number;
  en: number;
}) {
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <section aria-label="Timeline node" className="animate-in fade-in duration-200">
      <div className="bg-card/95 sticky top-0 z-10 mb-4 flex items-center justify-between gap-3 border-b pb-3 backdrop-blur">
        <Button
          ref={backRef}
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={onClose}
        >
          <ArrowLeft className="size-4" aria-hidden /> Map
        </Button>
        <p className={cn("font-mono text-xs font-semibold tracking-[0.12em] uppercase", PATH_ACCENT[header.accent])}>
          {header.label}
        </p>
      </div>

      <div
        ref={trackRef}
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
      >
        {steps.map((step, i) => (
          <StepView
            key={i}
            step={step}
            chosen={chosen}
            rollLocked={rollLocked}
            onDecisionChoice={onDecisionChoice}
            onRolled={onRolled}
            onClose={onClose}
            reduceMotion={reduceMotion}
            tl={tl}
            en={en}
          />
        ))}
      </div>
    </section>
  );
}

function StepView({
  step,
  chosen,
  rollLocked,
  onDecisionChoice,
  onRolled,
  onClose,
  reduceMotion,
  tl,
  en,
}: {
  step: Step;
  chosen: Record<number, string>;
  rollLocked: boolean;
  onDecisionChoice: (which: 1 | 2 | 3, choice: string) => void;
  onRolled: (regime: RegimeKey, outcome: OutcomeKey) => void;
  onClose: () => void;
  reduceMotion: boolean;
  tl: number;
  en: number;
}) {
  switch (step.kind) {
    case "event":
      return <EventSection ev={step.ev} />;
    case "fail":
      return <EventSection ev={FAILS[step.fid] as unknown as GameEvent} fail />;
    case "fork":
      return <ForkSection />;
    case "geneva":
      return <GenevaSection />;
    case "matrix":
      return <MatrixQuiz />;
    case "decision":
      return (
        <DecisionCard
          which={step.which}
          chosenId={chosen[step.which] ?? null}
          onChoice={(c) => onDecisionChoice(step.which, c)}
          rollLocked={rollLocked}
        />
      );
    case "fog":
      return <FogGame />;
    case "inspector":
      return <InspectorLab />;
    case "lab":
      return <DefectorLab cfg={step.cfg} anchor={step.anchor} />;
    case "roll":
      return (
        <RollSection
          regime={step.regime}
          onRolled={onRolled}
          reduceMotion={reduceMotion}
          locked={rollLocked}
        />
      );
    case "terminus":
      return <TerminusSection termKey={step.termKey} />;
    case "card":
      return (
        <EndingCard
          pathKey={step.pathKey}
          fate={step.fate}
          regime={step.regime}
          weight={step.weight}
          onClose={onClose}
          tl={tl}
          en={en}
        />
      );
  }
}

/* --- narrative event section --- */

function EventSection({ ev, fail }: { ev: GameEvent; fail?: boolean }) {
  const accent: PathKey | "f" = fail ? "f" : (ev.path as PathKey);
  return (
    <article
      data-node={ev.id}
      data-anchor={`event-${ev.id}`}
      data-watch
      className={cn(
        "bg-muted/20 rounded-lg border border-l-4 p-4",
        PATH_BORDER[accent],
      )}
    >
      <div className="text-muted-foreground font-mono text-[11px] tracking-[0.14em]">
        {ev.year}
      </div>
      <h4 className="mt-1 text-lg font-semibold tracking-tight">{ev.title}</h4>
      <span className="border-border bg-card text-muted-foreground mt-2 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-wide uppercase">
        {ev.chip}
      </span>
      <p className="text-foreground mt-3 text-sm font-medium">{ev.sum}</p>
      <div className="text-muted-foreground mt-2 space-y-2 text-sm">
        {ev.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="border-primary/30 bg-primary/5 mt-3 rounded-md border-l-2 p-3">
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
          The game
        </p>
        <p className="text-foreground mt-0.5 text-sm font-semibold">
          {ev.concept}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{ev.game}</p>
      </div>
      <div className="mt-3">
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
          Real-world echo
        </p>
        <p className="text-muted-foreground mt-0.5 text-sm italic">{ev.echo}</p>
      </div>
    </article>
  );
}

function SimpleNode({
  year,
  title,
  chip,
  lede,
  body,
  anchor,
  nodeId,
}: {
  year: string;
  title: string;
  chip: string;
  lede: string;
  body: string[];
  anchor: string;
  nodeId?: string;
}) {
  return (
    <article
      data-anchor={anchor}
      {...(nodeId ? { "data-node": nodeId, "data-watch": true } : {})}
      className="bg-muted/20 border-l-primary rounded-lg border border-l-4 p-4"
    >
      <div className="text-muted-foreground font-mono text-[11px] tracking-[0.14em]">
        {year}
      </div>
      <h4 className="mt-1 text-lg font-semibold tracking-tight">{title}</h4>
      <span className="border-border bg-card text-muted-foreground mt-2 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-wide uppercase">
        {chip}
      </span>
      <p className="text-foreground mt-3 text-sm font-medium">{lede}</p>
      <div className="text-muted-foreground mt-2 space-y-2 text-sm">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}

function ForkSection() {
  return (
    <SimpleNode
      nodeId="fork"
      anchor="fork"
      year={FORK.year}
      title={FORK.title}
      chip={FORK.chip}
      lede={FORK.lede}
      body={FORK.body}
    />
  );
}

function GenevaSection() {
  return (
    <SimpleNode
      anchor="geneva"
      year={GENEVA.year}
      title={GENEVA.title}
      chip={GENEVA.chip}
      lede={GENEVA.lede}
      body={GENEVA.body}
    />
  );
}

/* --- matrix quiz --- */

function MatrixQuiz() {
  const [answered, setAnswered] = useState<{ 1: boolean; 2: boolean }>({
    1: false,
    2: false,
  });
  const [picked, setPicked] = useState<{ 1?: string; 2?: string }>({});
  const done = answered[1] && answered[2];

  function pick(qn: 1 | 2, a: "restrain" | "race") {
    if (answered[qn]) return;
    setAnswered((s) => ({ ...s, [qn]: true }));
    setPicked((s) => ({ ...s, [qn]: a }));
  }

  return (
    <div className="bg-muted/20 border-border rounded-lg border p-4">
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {MATRIX.eyebrow}
      </p>
      <p className="mt-1 text-base font-semibold">{MATRIX.title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{MATRIX.sub}</p>

      {/* matrix */}
      <div className="border-border bg-card mt-3 rounded-md border p-3">
        <p className="text-muted-foreground font-mono text-[11px] tracking-wide uppercase">
          {MATRIX.gridTitle}
        </p>
        <div className="mt-2 grid grid-cols-[auto_1fr_1fr] gap-1.5 text-center text-xs">
          <div />
          <div className="text-muted-foreground font-medium">They restrain</div>
          <div className="text-muted-foreground font-medium">They race</div>

          <div className="text-muted-foreground self-center font-medium">
            You restrain
          </div>
          <MatrixCell m={MATRIX.cells.rr} live={false} />
          <MatrixCell m={MATRIX.cells.rc} live={false} />

          <div className="text-muted-foreground self-center font-medium">
            You race
          </div>
          <MatrixCell m={MATRIX.cells.cr} live={false} />
          <MatrixCell m={MATRIX.cells.cc} live={done} />
        </div>
      </div>

      {/* quiz */}
      <div className="mt-3 space-y-3">
        {([1, 2] as const).map((qn) => {
          const q = qn === 1 ? MATRIX.q1 : MATRIX.q2;
          const answers = qn === 1 ? MATRIX.q1a : MATRIX.q2a;
          const fb = MATRIX.fb[qn];
          const wasCorrect = picked[qn] === "race";
          return (
            <div key={qn}>
              <p className="text-sm font-medium">{q}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {(["restrain", "race"] as const).map((a) => {
                  const isPicked = picked[qn] === a;
                  const showRight =
                    answered[qn] && (a === "race");
                  const showWrong = answered[qn] && isPicked && a !== "race";
                  return (
                    <button
                      key={a}
                      type="button"
                      disabled={answered[qn]}
                      onClick={() => pick(qn, a)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs transition-colors disabled:cursor-default",
                        showWrong
                          ? "border-defect bg-defect/10 text-defect"
                          : showRight
                            ? "border-comply bg-comply/10 text-comply"
                            : "border-border hover:bg-muted",
                      )}
                    >
                      {answers[a]}
                    </button>
                  );
                })}
              </div>
              {answered[qn] && (
                <p
                  className="text-muted-foreground mt-1.5 text-xs"
                  aria-live="polite"
                >
                  {wasCorrect ? fb.right : fb.wrong}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {done && (
        <div className="border-primary/30 bg-primary/5 mt-3 rounded-md border-l-2 p-3">
          <p className="text-comply mb-1 font-mono text-[10px] tracking-[0.14em] uppercase">
            {MATRIX.eqTag}
          </p>
          <p className="text-muted-foreground text-sm">{MATRIX.conclusion}</p>
        </div>
      )}
    </div>
  );
}

function MatrixCell({
  m,
  live,
}: {
  m: { pay: string; tag: string; best: boolean; trap: boolean };
  live: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-2",
        m.best
          ? "border-comply/50 bg-comply/10"
          : m.trap
            ? live
              ? "border-defect bg-defect/15 ring-defect ring-1"
              : "border-defect/40 bg-defect/5"
            : "border-border bg-card",
      )}
    >
      <span className="font-mono text-sm font-semibold">{m.pay}</span>
      <div className="text-muted-foreground mt-0.5 text-[11px]">{m.tag}</div>
    </div>
  );
}

/* --- decision card --- */

function DecisionCard({
  which,
  chosenId,
  onChoice,
  rollLocked,
}: {
  which: 1 | 2 | 3;
  chosenId: string | null;
  onChoice: (id: string) => void;
  rollLocked: boolean;
}) {
  const d = DECISIONS[which];
  const isRegimeDecision = which === 3;
  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {d.eyebrow}
      </p>
      <p className="mt-1 text-base font-semibold">{d.q}</p>
      <p className="text-muted-foreground mt-1 text-sm">{d.ctx}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {d.choices.map((c) => (
          <ChoiceButton
            key={c.id}
            choice={c}
            chosen={chosenId === c.id}
            dimmed={
              chosenId !== null &&
              chosenId !== c.id &&
              (!isRegimeDecision || rollLocked)
            }
            disabled={
              isRegimeDecision
                ? rollLocked
                : chosenId !== null
            }
            onClick={() => onChoice(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ChoiceButton({
  choice,
  chosen,
  dimmed,
  disabled,
  onClick,
}: {
  choice: Choice;
  chosen: boolean;
  dimmed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const accent = choice.pathClass || "n";
  return (
    <button
      type="button"
      disabled={disabled && !chosen}
      onClick={onClick}
      aria-pressed={chosen}
      className={cn(
        "focus-visible:ring-ring rounded-lg border border-l-4 p-3 text-left transition-all focus-visible:ring-2 focus-visible:outline-none",
        PATH_BORDER[accent as PathKey | "n"],
        chosen && "ring-primary ring-2",
        dimmed && "opacity-40",
        disabled ? "cursor-default" : "hover:bg-muted/50",
      )}
    >
      {chosen && (
        <span className="text-comply mb-1 flex items-center gap-1 font-mono text-[10px] tracking-[0.14em] uppercase">
          <Check className="size-3" aria-hidden /> Chosen
        </span>
      )}
      <span className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {choice.lab}
      </span>
      <h5 className="mt-0.5 text-sm font-semibold">{choice.title}</h5>
      <p className="text-muted-foreground mt-1 text-xs">{choice.desc}</p>
      {choice.ledger && (
        <ul className="text-muted-foreground mt-2 space-y-0.5 text-[11px]">
          {choice.ledger.map((li, i) => (
            <li key={i} className="flex gap-1.5">
              <span aria-hidden>·</span>
              {li}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

/* --- fog mini-game --- */

function FogGame() {
  const [q, setQ] = useState(0);
  const [myMoves, setMyMoves] = useState<("comply" | "hedge")[]>([]);
  const [finished, setFinished] = useState(false);
  const [theyHedged, setTheyHedged] = useState(false);

  function play(m: "comply" | "hedge") {
    const nextMoves = [...myMoves, m];
    if (nextMoves.length < 3) {
      setMyMoves(nextMoves);
      setQ(nextMoves.length);
    } else {
      setMyMoves(nextMoves);
      setTheyHedged(Math.random() < 0.5);
      setFinished(true);
    }
  }

  function replay() {
    setQ(0);
    setMyMoves([]);
    setFinished(false);
  }

  const youHedged = myMoves.includes("hedge");
  let verdict = "";
  if (finished) {
    if (youHedged && !theyHedged) verdict = FOG.verdicts.youHedgedTheyHonest;
    else if (youHedged && theyHedged) verdict = FOG.verdicts.bothHedged;
    else if (!youHedged && theyHedged) verdict = FOG.verdicts.youHeldTheyHedged;
    else verdict = FOG.verdicts.bothComplied;
  }

  return (
    <div className="bg-muted/20 border-exaggerate/40 rounded-lg border border-l-4 p-4">
      <p className="text-exaggerate font-mono text-[10px] tracking-[0.14em] uppercase">
        {FOG.eyebrow}
      </p>
      <p className="mt-1 text-base font-semibold">{FOG.title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{FOG.sub}</p>

      {!finished ? (
        <>
          <p className="text-muted-foreground mt-3 font-mono text-[11px] tracking-wide uppercase">
            {FOG.roundLab(q + 1)}
          </p>
          <div
            className="border-exaggerate/40 bg-card mt-1.5 rounded-md border-l-2 p-3 text-sm"
            aria-live="polite"
          >
            {INTEL[q]}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => play("comply")}
              className="border-comply/40 hover:bg-comply/5 rounded-md border p-3 text-left transition-colors"
            >
              <h6 className="text-comply text-sm font-semibold">
                {FOG.comply.head}
              </h6>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {FOG.comply.desc}
              </p>
            </button>
            <button
              type="button"
              onClick={() => play("hedge")}
              className="border-defect/40 hover:bg-defect/5 rounded-md border p-3 text-left transition-colors"
            >
              <h6 className="text-defect text-sm font-semibold">
                {FOG.hedge.head}
              </h6>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {FOG.hedge.desc}
              </p>
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-muted-foreground mt-3 font-mono text-[11px] tracking-wide uppercase">
            {FOG.liftLab}
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center text-[11px]">
            {myMoves.map((m, i) => (
              <div
                key={`y${i}`}
                className={cn(
                  "rounded-md border p-1.5",
                  m === "hedge"
                    ? "border-defect/40 bg-defect/10 text-defect"
                    : "border-comply/40 bg-comply/10 text-comply",
                )}
              >
                <b className="text-foreground/70 block font-mono">
                  Q{i + 1} · YOU
                </b>
                {m.toUpperCase()}
              </div>
            ))}
            {myMoves.map((_, i) => (
              <div
                key={`t${i}`}
                className={cn(
                  "rounded-md border p-1.5",
                  theyHedged
                    ? "border-defect/40 bg-defect/10 text-defect"
                    : "border-comply/40 bg-comply/10 text-comply",
                )}
              >
                <b className="text-foreground/70 block font-mono">
                  Q{i + 1} · THEM
                </b>
                {theyHedged ? "HEDGE" : "COMPLY"}
              </div>
            ))}
          </div>
          <p
            className="border-primary/30 bg-primary/5 mt-3 rounded-md border-l-2 p-3 text-sm"
            aria-live="polite"
          >
            {verdict}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">{FOG.note}</p>
          <button
            type="button"
            onClick={replay}
            className="border-border hover:bg-muted mt-3 rounded-md border p-3 text-left transition-colors"
          >
            <h6 className="text-sm font-semibold">{FOG.replayHead}</h6>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {FOG.replayDesc}
            </p>
          </button>
        </>
      )}
    </div>
  );
}

/* --- defector's-calculation slider lab --- */

function DefectorLab({
  cfg,
  anchor,
}: {
  cfg: { p: number; note: string };
  anchor: string;
}) {
  const [p, setP] = useState(cfg.p); // 0..100
  const [g, setG] = useState(6);
  const [s, setS] = useState(4);

  const pf = p / 100;
  const ev = (1 - pf) * g - pf * s;
  const pStar = g / (g + s);
  const defects = ev > 0;
  const above = pf > pStar;

  return (
    <div
      data-anchor={anchor}
      className="bg-muted/20 border-border rounded-lg border p-4"
    >
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {LAB.eyebrow}
      </p>
      <p className="mt-1 text-base font-semibold">{LAB.title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{cfg.note}</p>

      <div className="mt-4 space-y-4">
        <LabSlider
          label={LAB.pLabel}
          value={p}
          out={`${p}%`}
          min={0}
          max={100}
          onChange={setP}
        />
        <LabSlider
          label={LAB.gLabel}
          value={g}
          out={`${g}`}
          min={1}
          max={10}
          onChange={setG}
        />
        <LabSlider
          label={LAB.sLabel}
          value={s}
          out={`${s}`}
          min={1}
          max={10}
          onChange={setS}
        />
      </div>

      <div
        className={cn(
          "mt-4 rounded-md border-l-2 p-3",
          defects ? "border-defect bg-defect/5" : "border-comply bg-comply/5",
        )}
        aria-live="polite"
      >
        <p
          className={cn(
            "font-mono text-[11px] tracking-wide uppercase",
            defects ? "text-defect" : "text-comply",
          )}
        >
          {defects ? LAB.defect.lab : LAB.comply.lab}
        </p>
        <p className="mt-0.5 text-sm font-semibold">
          {defects ? LAB.defect.main : LAB.comply.main}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {defects ? LAB.defect.sub : LAB.comply.sub}
        </p>
      </div>

      <div className="mt-3 space-y-1.5">
        <BarRow
          label={LAB.eDefect}
          value={`${ev >= 0 ? "+" : "−"}${Math.abs(ev).toFixed(1)}`}
          width={Math.min(Math.abs(ev) / 10, 1) * 100}
          tone={ev >= 0 ? "defect" : "comply"}
        />
        <BarRow label={LAB.eComply} value="0.0" width={2} tone="neutral" />
      </div>

      <p className="text-muted-foreground mt-3 font-mono text-[11px]">
        {LAB.formula}
        <br />
        {LAB.thresholdPrefix}{" "}
        <b className="text-foreground">p* = {Math.round(pStar * 100)}%</b> —{" "}
        {above ? LAB.above : LAB.below}
      </p>
    </div>
  );
}

function LabSlider({
  label,
  value,
  out,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  out: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <label className="text-foreground font-medium">{label}</label>
        <output className="text-muted-foreground font-mono">{out}</output>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(v) => onChange(v[0])}
        aria-label={label}
      />
    </div>
  );
}

function BarRow({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: number;
  tone: "defect" | "comply" | "neutral";
}) {
  const toneClass =
    tone === "defect"
      ? "bg-defect"
      : tone === "comply"
        ? "bg-comply"
        : "bg-muted-foreground";
  const valClass =
    tone === "defect"
      ? "text-defect"
      : tone === "comply"
        ? "text-comply"
        : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-24 shrink-0 font-mono">
        {label}
      </span>
      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", toneClass)}
          style={{ width: `${Math.max(width, 1)}%` }}
        />
      </div>
      <span className={cn("w-12 shrink-0 text-right font-mono", valClass)}>
        {value}
      </span>
    </div>
  );
}

/* --- inspector's dilemma slider lab --- */

function InspectorLab() {
  const [d, setD] = useState(40);
  const [zk, setZk] = useState(false);

  const p = Math.round(zk ? 0.85 * d : 0.7 * d);
  const e = Math.round(zk ? 0.12 * d : 0.9 * d);
  const deters = p >= 60;
  const signs = e < 45;

  let tone: "good" | "warn" | "bad";
  let verdictText: string;
  if (deters && signs) {
    tone = "good";
    verdictText = INSPECTOR.verdicts.good(p, e);
  } else if (!deters && signs) {
    tone = "warn";
    verdictText = INSPECTOR.verdicts.warn(p);
  } else if (deters && !signs) {
    tone = "bad";
    verdictText = INSPECTOR.verdicts.badDeters(p, e);
  } else {
    tone = "bad";
    verdictText = INSPECTOR.verdicts.badBoth;
  }

  return (
    <div className="bg-muted/20 border-comply/40 rounded-lg border border-l-4 p-4">
      <p className="text-comply font-mono text-[10px] tracking-[0.14em] uppercase">
        {INSPECTOR.eyebrow}
      </p>
      <p className="mt-1 text-base font-semibold">{INSPECTOR.title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{INSPECTOR.sub}</p>

      <div className="mt-4">
        <LabSlider
          label={INSPECTOR.sliderLabel}
          value={d}
          out={`${d}%`}
          min={0}
          max={100}
          onChange={setD}
        />
      </div>

      <label className="border-border hover:bg-muted/40 mt-3 flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-xs font-medium">
        <Checkbox
          checked={zk}
          onCheckedChange={(v) => setZk(v === true)}
          aria-label={INSPECTOR.zkLabel}
        />
        {INSPECTOR.zkLabel}
      </label>

      <div className="mt-4 space-y-3">
        <ThreshBar
          label={INSPECTOR.pLabel}
          value={p}
          threshPct={60}
          threshLabel={INSPECTOR.pThreshLabel}
          tone="comply"
        />
        <ThreshBar
          label={INSPECTOR.eLabel}
          value={e}
          threshPct={45}
          threshLabel={INSPECTOR.eThreshLabel}
          tone="defect"
        />
      </div>

      <div
        className={cn(
          "mt-4 rounded-md border-l-2 p-3 text-sm",
          tone === "good"
            ? "border-comply bg-comply/5"
            : tone === "warn"
              ? "border-exaggerate bg-exaggerate/5"
              : "border-defect bg-defect/5",
        )}
        aria-live="polite"
      >
        {verdictText}
      </div>

      <p className="text-muted-foreground mt-3 text-sm">{INSPECTOR.note}</p>
    </div>
  );
}

function ThreshBar({
  label,
  value,
  threshPct,
  threshLabel,
  tone,
}: {
  label: string;
  value: number;
  threshPct: number;
  threshLabel: string;
  tone: "comply" | "defect";
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-mono tracking-wide uppercase">
          {label}
        </span>
        <span className="font-mono font-semibold">{value}%</span>
      </div>
      <div className="bg-muted relative h-3 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tone === "comply" ? "bg-comply" : "bg-defect",
          )}
          style={{ width: `${value}%` }}
        />
        <div
          className="bg-foreground/70 absolute top-0 bottom-0 w-px"
          style={{ left: `${threshPct}%` }}
          aria-hidden
        />
      </div>
      <p
        className="text-muted-foreground mt-0.5 text-[10px]"
        style={{ marginLeft: `${Math.min(threshPct, 80)}%` }}
      >
        ↑ {threshLabel}
      </p>
    </div>
  );
}

/* --- roll section --- */

function RollSection({
  regime,
  onRolled,
  reduceMotion,
  locked,
}: {
  regime: RegimeKey;
  onRolled: (regime: RegimeKey, outcome: OutcomeKey) => void;
  reduceMotion: boolean;
  locked: boolean;
}) {
  const R = REGIMES[regime];
  const [hit, setHit] = useState<OutcomeKey | null>(null);
  const [spinning, setSpinning] = useState<OutcomeKey | null>(null);
  const [mc, setMc] = useState<Record<string, number> | null>(null);
  const [rolled, setRolled] = useState(false);

  function draw(): OutcomeKey {
    const x = Math.random() * 100;
    let acc = 0;
    let outcome: OutcomeKey = R.odds[R.odds.length - 1].k;
    for (const o of R.odds) {
      acc += o.w;
      if (x < acc) {
        outcome = o.k;
        break;
      }
    }
    return outcome;
  }

  function runMc() {
    const tally: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const k = draw();
      tally[k] = (tally[k] || 0) + 1;
    }
    setMc(tally);
  }

  function settle(outcome: OutcomeKey) {
    setHit(outcome);
    setSpinning(null);
    setRolled(true);
    onRolled(regime, outcome);
  }

  function run() {
    if (rolled || locked) return;
    const outcome = draw();
    setRolled(true); // disable buttons immediately
    if (reduceMotion) {
      settle(outcome);
      return;
    }
    let i = 0;
    const spins = 10;
    const iv = setInterval(() => {
      setSpinning(R.odds[i % R.odds.length].k);
      i++;
      if (i > spins) {
        clearInterval(iv);
        settle(outcome);
      }
    }, 110);
  }

  return (
    <div
      data-anchor="roll"
      className="bg-muted/20 border-border rounded-lg border p-4"
    >
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {ROLL.eyebrow}
      </p>
      <p className="mt-1 text-base font-semibold">{ROLL.title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{ROLL.sub(R.label)}</p>

      <div className="mt-3 space-y-1.5" role="list">
        {R.odds.map((o) => {
          const isHit = hit === o.k || spinning === o.k;
          const good = o.k === "ok";
          const seen = mc ? ((mc[o.k] || 0) / 10).toFixed(1) : null;
          return (
            <div
              key={o.k}
              role="listitem"
              className={cn(
                "flex items-center gap-2 rounded-md border p-1.5 text-xs transition-all",
                isHit
                  ? good
                    ? "border-comply bg-comply/10 ring-comply ring-1"
                    : "border-defect bg-defect/10 ring-defect ring-1"
                  : "border-transparent",
              )}
            >
              <span
                className={cn(
                  "w-32 shrink-0 font-mono font-semibold",
                  good ? "text-comply" : "text-muted-foreground",
                )}
              >
                {o.n}
              </span>
              <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full",
                    good ? "bg-comply" : "bg-free-ride",
                  )}
                  style={{ width: `${o.w}%` }}
                />
              </div>
              <span className="text-muted-foreground w-36 shrink-0 text-right font-mono">
                ~{o.w}%{" "}
                {seen !== null ? `· saw ${seen}%` : `· ${o.range}`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={run} disabled={rolled || locked}>
          {ROLL.run}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={runMc}
          disabled={rolled || locked}
        >
          {ROLL.mc}
        </Button>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">{ROLL.note}</p>
    </div>
  );
}

/* --- terminus --- */

function TerminusSection({ termKey }: { termKey: PathKey | FailKey }) {
  const kind = termKey === "v" ? "good" : "bad";
  const E = ENDINGS[kind];
  return (
    <div
      data-terminus={termKey}
      data-anchor={`terminus-${termKey}`}
      data-watch
      className={cn(
        "rounded-lg border-l-4 p-4",
        kind === "good"
          ? "border-comply bg-comply/5"
          : "border-defect bg-defect/5",
      )}
    >
      <p
        className={cn(
          "font-mono text-[10px] tracking-[0.14em] uppercase",
          kind === "good" ? "text-comply" : "text-defect",
        )}
      >
        {E.termLab} · {E.termYear[termKey]}
      </p>
      <h4 className="mt-1 text-lg font-semibold">{E.termTitle[termKey]}</h4>
      <p className="text-muted-foreground mt-2 text-sm">{E.termBody[termKey]}</p>
    </div>
  );
}

/* --- ending card --- */

function EndingCard({
  pathKey,
  fate,
  regime,
  weight,
  onClose,
  tl,
  en,
}: {
  pathKey: PathKey;
  fate: FailKey | null;
  regime: RegimeKey | null;
  weight: number | null;
  onClose: () => void;
  tl: number;
  en: number;
}) {
  const kind = fate ? "bad" : PATHS[pathKey].ending;
  const E = ENDINGS[kind];
  const chipList = fate ? FAIL_CHIPS[fate] : CONCEPT_CHIPS[pathKey];
  const quote = fate ? FAIL_QUOTES[fate] : E.quote;
  const eyebrow = fate
    ? CARD.fateEyebrow(FAILS[fate].title)
    : CARD.pathEyebrow(PATHS[pathKey].label);

  let via: string;
  if (fate) via = CARD.fateVia(FAILS[fate].title, weight);
  else if (kind === "bad") via = CARD.badVia(PATHS[pathKey].label);
  else via = CARD.goodVia;

  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  function copyCard() {
    const viaLine = fate
      ? `PATH C: TRUST, BUT VERIFY — regime failed: ${FAILS[
          fate
        ].title.toUpperCase()} (~${weight ?? "?"}% weight)`
      : PATHS[pathKey].label;
    const text =
      "THE VERIFICATION GAME\n" +
      `Ending reached: ${E.title.toUpperCase()} — via ${viaLine}\n` +
      `Concepts unlocked: ${chipList.join(" · ")}\n` +
      `Progress: ${tl}/3 timelines · ${en}/2 endings\n` +
      `“${quote}”`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied("ok");
          setTimeout(() => setCopied("idle"), 2000);
        },
        () => {
          setCopied("fail");
          setTimeout(() => setCopied("idle"), 2000);
        },
      );
    } else {
      setCopied("fail");
      setTimeout(() => setCopied("idle"), 2000);
    }
  }

  const R = regime ? REGIMES[regime] : null;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        kind === "good"
          ? "border-comply/50 bg-comply/5"
          : "border-defect/50 bg-defect/5",
      )}
    >
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight">{E.title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{via}</p>
      <p className="text-foreground mt-2 text-base font-medium italic">
        “{quote}”
      </p>

      <p className="text-muted-foreground mt-3 font-mono text-[10px] tracking-[0.14em] uppercase">
        {CARD.conceptsUnlocked}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {chipList.map((c) => (
          <span
            key={c}
            className="border-border bg-card rounded-full border px-2.5 py-0.5 text-xs"
          >
            {c}
          </span>
        ))}
      </div>

      {kind === "good" && R && (
        <>
          <p className="text-comply mt-3 font-mono text-xs font-semibold">
            {CARD.goodOdds(R.odds[0].w, R.label, regime ?? "swiss")}
          </p>
          <p className="text-muted-foreground mt-3 font-mono text-[10px] tracking-[0.14em] uppercase">
            {CARD.pricePaid}
          </p>
          <ul className="text-muted-foreground mt-1 space-y-0.5 text-sm">
            {R.price.map((pr, i) => (
              <li key={i} className="flex gap-1.5">
                <span aria-hidden>·</span>
                {pr}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-3 font-mono text-[10px] tracking-[0.14em] uppercase">
            {CARD.regimesHeld}
          </p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {ECHO_CARDS.map((ec) => (
              <div
                key={ec.t}
                className="border-border bg-card rounded-md border p-2.5 text-xs"
              >
                <b className="text-foreground">{ec.t}</b>
                <span className="text-muted-foreground mt-0.5 block">
                  {ec.s}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {fate && (
        <p className="text-muted-foreground mt-3 font-mono text-xs">
          {CARD.fateOdds}
        </p>
      )}

      <p className="text-muted-foreground mt-3 font-mono text-[11px]">
        {trackerText(tl, en)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onClose} className="gap-1.5">
          <RotateCcw className="size-4" aria-hidden /> {COPY.back}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={copyCard}
          className="gap-1.5"
        >
          <CopyIcon className="size-4" aria-hidden />
          {copied === "ok"
            ? "Copied ✓"
            : copied === "fail"
              ? "Copy failed"
              : "Copy card"}
        </Button>
      </div>
    </div>
  );
}
