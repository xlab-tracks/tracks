"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Plus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IR_PRIMER_POPUPS as POPUPS,
  IR_PRIMER_TABS as TABS,
  IR_QUIZ,
  IR_QUIZ_INTRO,
  IR_SORTER,
  IR_V1,
  IR_V2,
  IR_V3,
  IR_V4,
  IR_V5,
  IR_V6,
  IR_V7,
  LENS_TAG_CLASS,
  LENS_TAG_LABEL,
  type IrPopupTile,
  type LensTag,
  type SorterAnswer,
} from "@/lib/verification/data/ir-primer";
import type { VerificationWidgetProps } from "../kit/types";

/* ---- shared bits ---- */

/** Prose styling for authored HTML fragments (popup bodies + verdicts). */
const PROSE =
  "text-sm leading-relaxed [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1.5 [&_strong]:font-semibold [&_em]:italic";

const LEV_CLASS: Record<"us" | "cn" | "eu" | "mix", string> = {
  us: "text-hide",
  cn: "text-exaggerate",
  eu: "text-comply",
  mix: "text-free-ride",
};
const LEV_DOT: Record<"us" | "cn" | "eu" | "mix", string> = {
  us: "bg-hide",
  cn: "bg-exaggerate",
  eu: "bg-comply",
  mix: "bg-free-ride",
};

function SectionHead({ h2, lede }: { h2: string; lede: string }) {
  return (
    <header className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight">{h2}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{lede}</p>
    </header>
  );
}

function Callout({
  title,
  body,
  blue = false,
}: {
  title: string;
  body: string;
  blue?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-muted/40 my-4 rounded-r-lg border-l-4 p-4",
        blue ? "border-hide" : "border-primary",
      )}
    >
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
        {body}
      </p>
    </div>
  );
}

/** A tile whose click opens the authored popup body in a Dialog. */
function PopupTile({
  tile,
}: {
  tile: IrPopupTile & { tag?: LensTag; tagLabel?: string };
}) {
  const html = POPUPS[tile.pop] ?? "";
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group border-border bg-card hover:border-primary hover:shadow-soft relative rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
        >
          <span
            aria-hidden
            className="border-border bg-muted text-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground absolute top-3 right-3 flex size-5 items-center justify-center rounded-full border transition-colors"
          >
            <Plus className="size-3" />
          </span>
          <h4 className="pr-7 text-sm font-semibold tracking-tight">
            {tile.tag && (
              <span
                className={cn(
                  "mr-1.5 inline-block rounded border px-1.5 py-0.5 align-middle font-mono text-[10px] tracking-[0.04em] uppercase",
                  LENS_TAG_CLASS[tile.tag],
                )}
              >
                {tile.tagLabel ?? LENS_TAG_LABEL[tile.tag]}
              </span>
            )}
            {tile.heading}
          </h4>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {tile.body}
          </p>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="sr-only">{tile.heading}</DialogTitle>
        <div className={PROSE} dangerouslySetInnerHTML={{ __html: html }} />
      </DialogContent>
    </Dialog>
  );
}

/* ---- Section 2: sorter ---- */

function Sorter() {
  const [state, setState] = useState<Record<number, SorterAnswer>>({});
  return (
    <div className="space-y-2.5">
      {IR_SORTER.map((item, i) => {
        const picked = state[i];
        const done = picked !== undefined;
        const right = done && picked === item.answer;
        return (
          <div
            key={i}
            className={cn(
              "rounded-lg border p-3.5 text-sm transition-colors",
              !done && "border-border bg-card",
              done && right && "border-comply/50 bg-comply/5",
              done && !right && "border-defect/50 bg-defect/5",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex-1 basis-72">{item.text}</p>
              {!done && (
                <div className="flex gap-1.5">
                  {(["cheap", "costly"] as SorterAnswer[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, [i]: c }))}
                      className="border-border bg-muted hover:border-primary rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      {c === "cheap" ? "Cheap talk" : "Costly signal"}
                    </button>
                  ))}
                </div>
              )}
              {done && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    right ? "text-comply" : "text-defect",
                  )}
                >
                  {right ? (
                    <CheckCircle2 className="size-4" aria-hidden />
                  ) : (
                    <XCircle className="size-4" aria-hidden />
                  )}
                  {right ? "Correct" : "Not quite"}
                </span>
              )}
            </div>
            {done && (
              <p
                aria-live="polite"
                className={cn(
                  "text-muted-foreground mt-2 basis-full text-xs leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold",
                )}
                dangerouslySetInnerHTML={{ __html: item.verdict }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---- Section 5: lens toggle ---- */

function LensToggle() {
  const [active, setActive] = useState<string>(IR_V5.lenses[0].key);
  const current = IR_V5.lenses.find((l) => l.key === active)!;
  const activeClass: Record<LensTag, string> = {
    real: "bg-exaggerate border-exaggerate text-white",
    lib: "bg-hide border-hide text-white",
    con: "bg-comply border-comply text-white",
  };
  return (
    <div>
      <div role="tablist" className="mb-3 flex flex-wrap gap-1.5">
        {IR_V5.lenses.map((l) => {
          const on = l.key === active;
          return (
            <button
              key={l.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(l.key)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                on
                  ? activeClass[l.tag as LensTag]
                  : "border-border bg-card text-muted-foreground hover:border-primary",
              )}
            >
              {l.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        aria-live="polite"
        className="border-border bg-card rounded-xl border p-4"
      >
        <p
          className="text-sm leading-relaxed [&_em]:italic [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: current.body }}
        />
      </div>
    </div>
  );
}

/* ---- Section 8: quiz ---- */

function Quiz({ onComplete }: { onComplete: () => void }) {
  // picked index per question (undefined = unanswered)
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [fired, setFired] = useState(false);

  function pick(qi: number, oi: number) {
    if (picks[qi] !== undefined) return;
    const next = { ...picks, [qi]: oi };
    setPicks(next);
    if (Object.keys(next).length === IR_QUIZ.length && !fired) {
      setFired(true);
      onComplete();
    }
  }

  return (
    <div className="space-y-3.5">
      {IR_QUIZ.map((q, qi) => {
        const picked = picks[qi];
        const done = picked !== undefined;
        return (
          <div
            key={qi}
            className="border-border bg-card rounded-xl border p-4"
          >
            <h3 className="mb-2.5 text-sm font-semibold tracking-tight">
              {q.q}
            </h3>
            <div className="space-y-1.5" role="group" aria-label={q.q}>
              {q.options.map((opt, oi) => {
                const isPicked = picked === oi;
                const showCorrect = done && opt.correct;
                const showWrong = done && isPicked && !opt.correct;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={done}
                    onClick={() => pick(qi, oi)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      !done &&
                        "border-border bg-muted hover:border-primary cursor-pointer",
                      done && !showCorrect && !showWrong && "border-border opacity-55",
                      showCorrect && "border-comply/60 bg-comply/10",
                      showWrong && "border-defect/60 bg-defect/10",
                    )}
                  >
                    {done && showCorrect && (
                      <CheckCircle2
                        className="text-comply mt-0.5 size-4 shrink-0"
                        aria-hidden
                      />
                    )}
                    {showWrong && (
                      <XCircle
                        className="text-defect mt-0.5 size-4 shrink-0"
                        aria-hidden
                      />
                    )}
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
            {done && (
              <p
                aria-live="polite"
                className="text-muted-foreground border-border/70 mt-2.5 border-t border-dashed pt-2.5 text-xs leading-relaxed [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: q.exp }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---- vocabulary + generic tables ---- */

function VocabTable() {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted text-muted-foreground text-left font-mono text-[11px] tracking-[0.05em] uppercase">
            <th className="w-52 px-3 py-2 font-semibold">Term</th>
            <th className="px-3 py-2 font-semibold">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {IR_V4.vocab.map((v) => (
            <tr key={v.term} className="border-border/70 border-t align-top">
              <td className="px-3 py-2.5 font-semibold">{v.term}</td>
              <td className="text-muted-foreground px-3 py-2.5 leading-relaxed">
                {v.meaning}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TileGrid({
  tiles,
  cols = "sm:grid-cols-2",
}: {
  tiles: (IrPopupTile & { tag?: LensTag; tagLabel?: string })[];
  cols?: string;
}) {
  return (
    <div className={cn("grid gap-3", cols)}>
      {tiles.map((t) => (
        <PopupTile key={t.pop} tile={t} />
      ))}
    </div>
  );
}

/* ---- main widget ---- */

export function IrPrimer({ onComplete }: VerificationWidgetProps) {
  const [tab, setTab] = useState<string>(TABS[0].key);

  return (
    <div className="not-prose my-6">
      <div className="border-border bg-card shadow-soft overflow-hidden rounded-xl border p-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-5 h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-border text-muted-foreground rounded-lg border px-3 py-1.5 text-xs font-semibold data-[state=active]:border-transparent"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 1 — Anarchy */}
          <TabsContent value="v1" className="mt-0">
            <SectionHead h2={IR_V1.h2} lede={IR_V1.lede} />
            <p className="text-sm leading-relaxed">{IR_V1.p1}</p>
            <Callout title={IR_V1.calloutTitle} body={IR_V1.calloutBody} blue />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {IR_V1.tiles.map((t) => (
                <PopupTile key={t.pop} tile={t} />
              ))}
            </div>
          </TabsContent>

          {/* 2 — Willingness */}
          <TabsContent value="v2" className="mt-0">
            <SectionHead h2={IR_V2.h2} lede={IR_V2.lede} />
            <p className="text-sm leading-relaxed">{IR_V2.p1}</p>

            <div className="bg-foreground text-background my-5 rounded-xl p-5">
              <p className="font-mono text-[11px] tracking-[0.16em] uppercase opacity-70">
                {IR_V2.mindsetKick}
              </p>
              <h3 className="mt-1.5 text-lg font-semibold">
                <span className="line-through opacity-50">
                  {IR_V2.mindsetStrike}
                </span>{" "}
                → {IR_V2.mindsetRest}
              </h3>
              <p className="mt-2 text-sm leading-relaxed opacity-90">
                {IR_V2.mindsetP1}
              </p>
              <p className="mt-2 text-sm leading-relaxed opacity-90">
                {IR_V2.mindsetP2}
              </p>
              <p className="mt-2 text-sm leading-relaxed opacity-90">
                {IR_V2.mindsetP3}
              </p>
            </div>

            <h3 className="text-sm font-semibold tracking-tight">
              {IR_V2.sorterH3}
            </h3>
            <p className="text-muted-foreground mt-1 mb-3 text-sm">
              {IR_V2.sorterLede}
            </p>
            <Sorter />

            <Callout title={IR_V2.calloutTitle} body={IR_V2.calloutBody} />
          </TabsContent>

          {/* 3 — Cooperation */}
          <TabsContent value="v3" className="mt-0">
            <SectionHead h2={IR_V3.h2} lede={IR_V3.lede} />
            <p className="text-sm leading-relaxed">
              {IR_V3.p1pre}
              <a
                href={IR_V3.gameHref}
                target="_blank"
                rel="noreferrer"
                className="text-primary inline-flex items-center gap-0.5 font-medium underline underline-offset-2"
              >
                {IR_V3.gameLabel}
                <ExternalLink className="size-3" aria-hidden />
              </a>
              {IR_V3.p1post}
            </p>
            <div className="mt-4">
              <TileGrid tiles={IR_V3.tiles} />
            </div>
            <Callout title={IR_V3.calloutTitle} body={IR_V3.calloutBody} blue />
          </TabsContent>

          {/* 4 — Treaty mechanics */}
          <TabsContent value="v4" className="mt-0">
            <SectionHead h2={IR_V4.h2} lede={IR_V4.lede} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {IR_V4.stages.map((s) => {
                const costClass =
                  s.costTier === 1
                    ? "text-muted-foreground"
                    : s.costTier === 2
                      ? "text-exaggerate"
                      : "text-defect";
                return (
                  <Dialog key={s.pop}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="border-border bg-card hover:border-primary hover:shadow-soft rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
                      >
                        <span className="text-primary font-mono text-[11px] font-bold tracking-[0.08em]">
                          {s.num}
                        </span>
                        <h4 className="mt-1 text-sm font-semibold">
                          {s.title}
                        </h4>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                          {s.desc}
                        </p>
                        <p
                          className={cn(
                            "mt-2 font-mono text-[10px] font-semibold tracking-[0.05em] uppercase",
                            costClass,
                          )}
                        >
                          {s.cost}
                        </p>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                      <DialogTitle className="sr-only">{s.title}</DialogTitle>
                      <div
                        className={PROSE}
                        dangerouslySetInnerHTML={{ __html: POPUPS[s.pop] }}
                      />
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
            <p className="mt-4 text-sm leading-relaxed">{IR_V4.bodyP}</p>
            <div className="mt-4">
              <TileGrid tiles={IR_V4.tiles} />
            </div>
            <h3 className="mt-5 mb-2 text-sm font-semibold tracking-tight">
              {IR_V4.vocabH3}
            </h3>
            <VocabTable />
          </TabsContent>

          {/* 5 — Lenses */}
          <TabsContent value="v5" className="mt-0">
            <SectionHead h2={IR_V5.h2} lede={IR_V5.lede} />
            <div className="grid gap-3 sm:grid-cols-3">
              {IR_V5.tiles.map((t) => (
                <PopupTile
                  key={t.pop}
                  tile={{
                    pop: t.pop,
                    tag: t.tag as LensTag,
                    tagLabel: t.tagLabel,
                    heading: t.heading,
                    body: t.body,
                  }}
                />
              ))}
            </div>
            <h3 className="mt-5 text-sm font-semibold tracking-tight">
              {IR_V5.scenarioH3}
            </h3>
            <p className="text-muted-foreground mt-1 mb-3 text-sm italic">
              {IR_V5.scenarioLede}
            </p>
            <LensToggle />

            <div className="border-border mt-5 overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-muted-foreground text-left font-mono text-[11px] tracking-[0.05em] uppercase">
                    {IR_V5.table.head.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {IR_V5.table.rows.map((r) => (
                    <tr
                      key={r.tag}
                      className="border-border/70 border-t align-top"
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.04em] uppercase",
                            LENS_TAG_CLASS[r.tag as LensTag],
                          )}
                        >
                          {r.tagLabel}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5 leading-relaxed">
                        {r.forVer}
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5 leading-relaxed">
                        {r.whyFail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              {IR_V5.footP}
            </p>
          </TabsContent>

          {/* 6 — Actors */}
          <TabsContent value="v6" className="mt-0">
            <SectionHead h2={IR_V6.h2} lede={IR_V6.lede} />
            <Callout title={IR_V6.calloutTitle} body={IR_V6.calloutBody} />

            <h3 className="mt-4 text-sm font-semibold tracking-tight">
              {IR_V6.chainH3}
            </h3>
            <p className="text-muted-foreground mt-1 mb-3 text-sm">
              {IR_V6.chainLede}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {IR_V6.chain.map((n) => (
                <Dialog key={n.pop}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="border-border bg-card hover:border-primary hover:shadow-soft rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
                    >
                      <span className="text-primary font-mono text-[10px] font-bold tracking-[0.08em] uppercase">
                        {n.stage}
                      </span>
                      <h4 className="mt-1 text-sm font-semibold">{n.title}</h4>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {n.flags}
                      </p>
                      <p
                        className={cn(
                          "mt-1.5 font-mono text-[10px] font-semibold tracking-[0.04em] uppercase",
                          LEV_CLASS[n.lev],
                        )}
                      >
                        {n.levLabel}
                      </p>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogTitle className="sr-only">{n.title}</DialogTitle>
                    <div
                      className={PROSE}
                      dangerouslySetInnerHTML={{ __html: POPUPS[n.pop] }}
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium">
              {IR_V6.legend.map((l) => (
                <span key={l.lev} className="flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-full", LEV_DOT[l.lev])}
                    aria-hidden
                  />
                  {l.label}
                </span>
              ))}
            </div>

            <h3 className="mt-5 text-sm font-semibold tracking-tight">
              {IR_V6.winningH3}
            </h3>
            <p className="text-muted-foreground mt-1 mb-3 text-sm">
              {IR_V6.winningLede}
            </p>
            <div className="border-border overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-muted-foreground text-left font-mono text-[11px] tracking-[0.05em] uppercase">
                    {IR_V6.winningTable.head.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {IR_V6.winningTable.rows.map((r) => (
                    <tr
                      key={r.layer}
                      className="border-border/70 border-t align-top"
                    >
                      <td className="px-3 py-2.5 font-medium">{r.layer}</td>
                      <td className="text-muted-foreground px-3 py-2.5 leading-relaxed">
                        {r.ahead}
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5 leading-relaxed">
                        {r.why}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Callout
              title={IR_V6.verCalloutTitle}
              body={IR_V6.verCalloutBody}
              blue
            />

            <h3 className="mt-5 mb-2 text-sm font-semibold tracking-tight">
              {IR_V6.playersH3}
            </h3>
            <TileGrid tiles={IR_V6.playerTiles} cols="sm:grid-cols-3" />

            <h3 className="mt-5 mb-2 text-sm font-semibold tracking-tight">
              {IR_V6.bgH3}
            </h3>
            <TileGrid tiles={IR_V6.bgTiles} />
          </TabsContent>

          {/* 7 — NPT mini-case */}
          <TabsContent value="v7" className="mt-0">
            <SectionHead h2={IR_V7.h2} lede={IR_V7.lede} />
            <Callout title={IR_V7.factsTitle} body={IR_V7.factsBody} />
            <p className="text-muted-foreground mt-4 mb-3 text-sm">
              {IR_V7.lensLede}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {IR_V7.lensTiles.map((t) => (
                <PopupTile
                  key={t.pop}
                  tile={{
                    pop: t.pop,
                    tag: t.tag,
                    tagLabel: LENS_TAG_LABEL[t.tag],
                    heading: t.heading,
                    body: t.body,
                  }}
                />
              ))}
            </div>
            <div className="bg-muted/40 border-primary my-4 rounded-r-lg border-l-4 p-4">
              <h3 className="text-sm font-semibold tracking-tight">
                {IR_V7.willTitle}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {IR_V7.willP1}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {IR_V7.willP2}
              </p>
            </div>
          </TabsContent>

          {/* 8 — Self-check */}
          <TabsContent value="v8" className="mt-0">
            <SectionHead h2={IR_QUIZ_INTRO.h2} lede={IR_QUIZ_INTRO.lede} />
            <Quiz onComplete={onComplete} />
            <Callout
              title={IR_QUIZ_INTRO.readyTitle}
              body={IR_QUIZ_INTRO.readyBody}
              blue
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
