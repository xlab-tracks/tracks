"use client";

import { useMemo, useState } from "react";
import { Check, Flag, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  DISSECTION_COPY as C,
  DOCUMENTS,
  ORGANS,
  type Clause,
} from "@/lib/verification/data/dissection-table";
import type { VerificationWidgetProps } from "../kit/types";

/**
 * "The Dissection Table — Anatomy of a (Pause) Agreement." For each of two
 * documents (the 2023 FLI Open Letter warm-up, then the fictional Reykjavik
 * Protocol), the learner tags every clause with the "organs" it implements,
 * optionally flags a suspected weakness with a note, then one-way COMMITs the
 * clause to reveal the instructor layer (organ match/extra/missed + flaw
 * verdict + annotation). When all clauses in a document are committed, a
 * summary shows the organ coverage map, a flaw score, missed flaws, and a
 * final free-response question with a hidden model answer.
 *
 * Bridged: onComplete() fires once, when the first document's summary is first
 * reached (all its clauses committed). Preserved oddity: some flaw clauses tag
 * zero organs — that is a planted lesson, not a bug.
 *
 * The source's organ palette is a semantic multi-hue encoding (organs 1–7);
 * every use is paired with the organ number + name, never colour alone.
 */

// Source organ hues (public/verification/dissection-table.html :root --o1..--o7).
const ORGAN_HEX: Record<number, string> = {
  1: "#8a6d3b",
  2: "#3b6e8a",
  3: "#3b8a5a",
  4: "#7a5a8a",
  5: "#a04b3f",
  6: "#4f5d8a",
  7: "#8a3b62",
};

type ClauseState = {
  organs: number[];
  weak: boolean;
  note: string;
  committed: boolean;
};

type DocState = {
  clauses: Record<string, ClauseState>;
  finalAnswer: string;
  showSummary: boolean;
  revealModel: boolean;
};

function freshDocState(docKey: string): DocState {
  const clauses: Record<string, ClauseState> = {};
  DOCUMENTS[docKey].clauses.forEach((c) => {
    clauses[c.id] = { organs: [], weak: false, note: "", committed: false };
  });
  return { clauses, finalAnswer: "", showSummary: false, revealModel: false };
}

const DOC_KEYS = Object.keys(DOCUMENTS);

export function DissectionTable({ onComplete }: VerificationWidgetProps) {
  const [currentDoc, setCurrentDoc] = useState<string>(DOC_KEYS[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [docStates, setDocStates] = useState<Record<string, DocState>>(() => {
    const init: Record<string, DocState> = {};
    DOC_KEYS.forEach((k) => (init[k] = freshDocState(k)));
    return init;
  });

  const doc = DOCUMENTS[currentDoc];
  const st = docStates[currentDoc];

  const committedCount = doc.clauses.filter(
    (c) => st.clauses[c.id].committed,
  ).length;
  const allCommitted = committedCount === doc.clauses.length;

  function updateClause(id: string, patch: Partial<ClauseState>) {
    setDocStates((prev) => ({
      ...prev,
      [currentDoc]: {
        ...prev[currentDoc],
        clauses: {
          ...prev[currentDoc].clauses,
          [id]: { ...prev[currentDoc].clauses[id], ...patch },
        },
      },
    }));
  }

  function setDocField(patch: Partial<DocState>) {
    setDocStates((prev) => ({
      ...prev,
      [currentDoc]: { ...prev[currentDoc], ...patch },
    }));
  }

  function toggleOrgan(id: string, n: number) {
    const cur = st.clauses[id].organs;
    updateClause(id, {
      organs: cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n],
    });
  }

  function commitClause(id: string) {
    updateClause(id, { committed: true });
    setSelectedId(null);
  }

  function pickDoc(key: string) {
    setCurrentDoc(key);
    setSelectedId(null);
  }

  function goToSummary() {
    setDocField({ showSummary: true });
    if (!completed) {
      setCompleted(true);
      onComplete();
    }
  }

  return (
    <div className="not-prose border-border bg-card my-6 overflow-hidden rounded-xl border">
      {/* document picker */}
      <div className="border-border/70 bg-muted/30 flex flex-wrap items-center gap-2 border-b px-5 py-2.5">
        {DOC_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === currentDoc}
            onClick={() => pickDoc(k)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-left text-xs transition-colors",
              k === currentDoc
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {DOCUMENTS[k].title}
          </button>
        ))}
      </div>

      <div className="p-5">
        {allCommitted && st.showSummary ? (
          <Summary
            docKey={currentDoc}
            st={st}
            onBack={() => setDocField({ showSummary: false })}
            onFinalAnswer={(v) => setDocField({ finalAnswer: v })}
            onReveal={() => setDocField({ revealModel: true })}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
            {/* document pane */}
            <div>
              <h4 className="text-base font-semibold tracking-tight">
                {doc.title}
              </h4>
              <p className="text-muted-foreground border-border mt-2 mb-5 max-w-[62ch] border-l-2 pl-3 text-sm">
                {doc.intro}
              </p>

              <div className="space-y-3">
                {doc.clauses.map((c) => {
                  const cs = st.clauses[c.id];
                  const isSelected = selectedId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "rounded-lg border p-3.5 transition-colors",
                        cs.committed
                          ? "border-border bg-muted/30"
                          : isSelected
                            ? "border-primary ring-primary/40 ring-1"
                            : "border-border hover:border-foreground/40 cursor-pointer",
                      )}
                      onClick={
                        cs.committed ? undefined : () => setSelectedId(c.id)
                      }
                      role={cs.committed ? undefined : "button"}
                      tabIndex={cs.committed ? undefined : 0}
                      onKeyDown={
                        cs.committed
                          ? undefined
                          : (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedId(c.id);
                              }
                            }
                      }
                    >
                      <div className="text-muted-foreground mb-1.5 flex items-center justify-between font-mono text-[11px] tracking-[0.08em] uppercase">
                        <span>{c.id}</span>
                        <span className={cs.committed ? "text-comply" : ""}>
                          {cs.committed ? C.committedStatus : C.clickToTag}
                        </span>
                      </div>
                      <p className="font-serif text-[15px] leading-relaxed">
                        {c.text}
                      </p>
                      {cs.committed && <RevealBlock clause={c} cs={cs} />}
                    </div>
                  );
                })}
              </div>

              {allCommitted && (
                <Button onClick={goToSummary} className="mt-4 w-full gap-2">
                  {C.viewSummary}
                </Button>
              )}
            </div>

            {/* tagging sidebar */}
            <aside className="border-border bg-muted/20 h-fit rounded-lg border p-4">
              <h4 className="text-sm font-semibold">
                {selectedId ? `Tagging: ${selectedId}` : C.selectClause}
              </h4>
              <p className="text-muted-foreground mt-1 text-xs">
                {selectedId ? C.taggingHint : C.selectHint}
              </p>

              {selectedId && (
                <TaggingControls
                  clauseId={selectedId}
                  cs={st.clauses[selectedId]}
                  onToggleOrgan={(n) => toggleOrgan(selectedId, n)}
                  onToggleWeak={() =>
                    updateClause(selectedId, {
                      weak: !st.clauses[selectedId].weak,
                    })
                  }
                  onNote={(v) => updateClause(selectedId, { note: v })}
                  onCommit={() => commitClause(selectedId)}
                />
              )}

              <div className="mt-4">
                <Progress
                  value={(committedCount / doc.clauses.length) * 100}
                  aria-label={`${committedCount} of ${doc.clauses.length} clauses committed`}
                />
                <p className="text-muted-foreground mt-1.5 text-[11px]">
                  {committedCount} of {doc.clauses.length} clauses committed
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function OrganDot({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="mt-1 inline-block size-2.5 flex-none rounded-full"
      style={{ background: ORGAN_HEX[n] }}
    />
  );
}

function TaggingControls({
  cs,
  onToggleOrgan,
  onToggleWeak,
  onNote,
  onCommit,
}: {
  clauseId: string;
  cs: ClauseState;
  onToggleOrgan: (n: number) => void;
  onToggleWeak: () => void;
  onNote: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-1.5" role="group" aria-label="Organs">
        {ORGANS.map((o) => {
          const on = cs.organs.includes(o.n);
          return (
            <button
              key={o.n}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleOrgan(o.n)}
              style={on ? { borderColor: ORGAN_HEX[o.n] } : undefined}
              className={cn(
                "flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left text-[13px] transition-colors",
                on
                  ? "bg-card border-2"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <OrganDot n={o.n} />
              <span>
                <span className="font-semibold">
                  {o.n}. {o.name}
                </span>
                <span className="text-muted-foreground block text-[11.5px] leading-tight">
                  {o.d}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-pressed={cs.weak}
        onClick={onToggleWeak}
        className={cn(
          "flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-[13px] transition-colors",
          cs.weak
            ? "border-defect bg-defect/10 text-defect"
            : "border-border bg-card hover:bg-muted",
        )}
      >
        <Flag className={cn("size-3.5", cs.weak && "fill-current")} aria-hidden />
        {C.flagLabel}
      </button>

      <Textarea
        value={cs.note}
        onChange={(e) => onNote(e.target.value)}
        placeholder={C.notePlaceholder}
        rows={3}
        className="resize-y text-[13px]"
        aria-label={C.notePlaceholder}
      />

      <Button onClick={onCommit} className="w-full gap-2">
        <Check className="size-4" aria-hidden />
        {C.commitClause}
      </Button>
    </div>
  );
}

type OrganChipKind = "match" | "extra" | "missed";

function RevealBlock({ clause, cs }: { clause: Clause; cs: ClauseState }) {
  const union = useMemo(
    () =>
      Array.from(new Set([...clause.organs, ...cs.organs])).sort(
        (a, b) => a - b,
      ),
    [clause.organs, cs.organs],
  );

  return (
    <div className="border-border/70 mt-3 border-t border-dashed pt-3 text-[13px]">
      <p className="text-muted-foreground mb-2 font-mono text-[11px] tracking-[0.08em] uppercase">
        {C.instructorLayer}
      </p>

      <div className="mb-2 flex flex-wrap gap-1.5" role="list">
        {union.length === 0 ? (
          <OrganChip label={C.noOrgansAgreed} kind="match" />
        ) : (
          union.map((n) => {
            const inInstructor = clause.organs.includes(n);
            const inLearner = cs.organs.includes(n);
            let kind: OrganChipKind = "missed";
            if (inInstructor && inLearner) kind = "match";
            else if (inLearner) kind = "extra";
            const suffix =
              kind === "match"
                ? ""
                : kind === "extra"
                  ? " (you only)"
                  : " (instructor only)";
            return (
              <OrganChip
                key={n}
                label={`${n}. ${ORGANS[n - 1].name}${suffix}`}
                kind={kind}
              />
            );
          })
        )}
      </div>

      {clause.flaw && cs.weak && (
        <div className="border-comply/40 bg-comply/10 text-comply mb-2 rounded-md border px-2.5 py-2 text-[12.5px]">
          {C.flawHit}
        </div>
      )}
      {clause.flaw && !cs.weak && (
        <div className="border-defect/40 bg-defect/10 text-defect mb-2 rounded-md border px-2.5 py-2 text-[12.5px]">
          {C.flawMiss}
        </div>
      )}
      {!clause.flaw && cs.weak && (
        <div className="border-exaggerate/40 bg-exaggerate/10 text-exaggerate mb-2 rounded-md border px-2.5 py-2 text-[12.5px]">
          {C.flawFalsePositive}
        </div>
      )}

      <p className="text-foreground/90 mt-2 leading-relaxed">
        {clause.annotation}
      </p>

      {cs.note && (
        <p className="text-muted-foreground mt-2 text-[12.5px] italic">
          Your note: {cs.note}
        </p>
      )}
    </div>
  );
}

function OrganChip({ label, kind }: { label: string; kind: OrganChipKind }) {
  const cls: Record<OrganChipKind, string> = {
    match: "border-comply/50 bg-comply/10 text-comply",
    extra: "border-exaggerate/50 bg-exaggerate/10 text-exaggerate",
    missed: "border-defect/50 bg-defect/10 text-defect",
  };
  return (
    <span
      role="listitem"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium",
        cls[kind],
      )}
    >
      {label}
    </span>
  );
}

function Summary({
  docKey,
  st,
  onBack,
  onFinalAnswer,
  onReveal,
}: {
  docKey: string;
  st: DocState;
  onBack: () => void;
  onFinalAnswer: (v: string) => void;
  onReveal: () => void;
}) {
  const doc = DOCUMENTS[docKey];

  const flaws = doc.clauses.filter((c) => c.flaw);
  const hit = flaws.filter((c) => st.clauses[c.id].weak).length;
  const fp = doc.clauses.filter(
    (c) => !c.flaw && st.clauses[c.id].weak,
  ).length;
  const missed = flaws.filter((c) => !st.clauses[c.id].weak);

  return (
    <div className="mx-auto max-w-3xl" aria-live="polite">
      <h4 className="text-lg font-semibold tracking-tight">
        {C.summaryHeading}
        {doc.title}
      </h4>

      {/* organ coverage map */}
      <p className="text-muted-foreground mt-2 text-sm">{C.coverageIntro}</p>
      <div className="border-border mt-3 divide-y overflow-hidden rounded-lg border">
        {ORGANS.map((o) => {
          const present =
            doc.clauses.some((c) => c.organs.includes(o.n)) &&
            !doc.missingOrgans.includes(o.n);
          return (
            <div
              key={o.n}
              className="bg-card grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3.5 py-2.5 text-sm"
            >
              <span
                aria-hidden
                className="size-3 rounded-full"
                style={{ background: ORGAN_HEX[o.n], opacity: present ? 1 : 0.25 }}
              />
              <span>
                <span className="font-semibold">
                  {o.n}. {o.name}
                </span>{" "}
                <span className="text-muted-foreground text-xs">— {o.d}</span>
              </span>
              {present ? (
                <span className="text-comply font-mono text-[11px] tracking-[0.06em]">
                  {C.present}
                </span>
              ) : (
                <span className="text-defect font-mono text-[11px] font-bold tracking-[0.06em]">
                  {C.absent}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* flaw score */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="border-border bg-card min-w-[180px] flex-1 rounded-lg border p-3.5">
          <div className="text-2xl font-bold">
            {hit} / {flaws.length}
          </div>
          <div className="text-muted-foreground text-xs">
            {C.flawsFlaggedLabel}
          </div>
        </div>
        <div className="border-border bg-card min-w-[180px] flex-1 rounded-lg border p-3.5">
          <div className="text-2xl font-bold">{fp}</div>
          <div className="text-muted-foreground text-xs">
            {C.falsePositivesLabel}
          </div>
        </div>
      </div>

      {missed.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold">{C.flawsYouMissed}</p>
          <ul className="border-border bg-card mt-2 space-y-2.5 rounded-lg border px-3.5 py-3 text-[13px]">
            {missed.map((c) => (
              <li key={c.id}>
                <span className="font-semibold">{c.id}.</span> {c.annotation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* final question */}
      <h4 className="mt-7 text-lg font-semibold tracking-tight">
        {C.finalQuestion}
      </h4>
      <p className="mt-1 text-sm">{C.finalPrompt}</p>
      <Textarea
        value={st.finalAnswer}
        onChange={(e) => onFinalAnswer(e.target.value)}
        placeholder={C.finalPlaceholder}
        rows={4}
        className="mt-2 resize-y"
        aria-label={C.finalPrompt}
      />

      {!st.revealModel ? (
        <Button variant="outline" onClick={onReveal} className="mt-3">
          {C.revealModel}
        </Button>
      ) : (
        <div
          className="border-o5 bg-card mt-3 rounded-lg border border-l-4 p-3.5 text-[13.5px]"
          style={{ borderLeftColor: ORGAN_HEX[5] }}
        >
          <span className="font-semibold">{C.modelLabel}</span>{" "}
          {doc.modelAnswer}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <RotateCcw className="size-4" aria-hidden />
          {C.backToDocument}
        </Button>
      </div>
      {DOC_KEYS.length > 1 && (
        <p className="text-muted-foreground mt-3 text-xs">
          Switch documents using the buttons above to dissect the other
          agreement.
        </p>
      )}
    </div>
  );
}
