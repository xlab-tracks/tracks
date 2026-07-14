"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AGENCY_CALLOUT,
  AGENCY_HEAD,
  AGENCY_TILES,
  CONVERT_CALLOUT,
  CONVERT_HEAD,
  CONVERT_TILES,
  FG_CRAFT_CARDS,
  FG_FORMAT_LABELS,
  FG_HEADER,
  FG_HOME_HINT_1,
  FG_HOME_HINT_2,
  FG_HOME_SESSION_HEADING,
  FG_HOME_SESSION_NOTE,
  FG_POPUPS,
  FG_PRINCIPLES,
  FG_SESSION_CARDS,
  PART_CALLOUT,
  PART_HEAD,
  PART_TILES,
  PHASE_LABEL,
  RESOURCES_BOXES,
  RESOURCES_HEAD,
  ROLE_CALLOUT_HIGH,
  ROLE_CALLOUT_LOW,
  ROLE_CALLOUT_SPINE,
  ROLE_HEAD,
  ROLE_TILES_HIGH,
  ROLE_TILES_LOW,
  SESSION_CALLOUT,
  SESSION_HEAD,
  SESSION_PLANS,
  SESSION_STAGES,
  TAKES_CALLOUT,
  TAKES_HEAD,
  TAKES_SORTER,
  TAKES_SORTER_HEAD,
  TAKES_TILES,
  type Callout,
  type ContextKey,
  type FormatKey,
  type ResBox,
  type SessionPlan,
  type SorterItem,
  type Stage,
  type Tile,
  type Verdict,
} from "@/lib/verification/data/facilitator-guide";

/* ---------- shared prose styling for authored HTML fragments ---------- */

// Class hook applied to any container rendering authored popup / callout HTML.
// Styles the source's semantic spans (.say quotes, .mt medium tags) and lists
// using app tokens instead of the source's cream/serif look.
const AUTHORED =
  "[&_h3]:hidden " + // popup h3 is promoted to the DialogTitle
  "[&_p]:mt-2.5 [&_p:first-child]:mt-0 [&_p]:text-sm [&_p]:leading-relaxed " +
  "[&_strong]:font-semibold [&_strong]:text-foreground " +
  "[&_em]:italic " +
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80 " +
  "[&_ol]:mt-2.5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:text-sm " +
  "[&_ul]:mt-2.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-sm " +
  "[&_li]:leading-relaxed " +
  // .say — a quoted facilitator line
  "[&_.say]:mt-2.5 [&_.say]:block [&_.say]:rounded-lg [&_.say]:border [&_.say]:border-border " +
  "[&_.say]:bg-muted/50 [&_.say]:px-3.5 [&_.say]:py-2.5 [&_.say]:text-sm [&_.say]:italic " +
  // .mt — a small mono "medium" tag (Sync / Async / In person / On Zoom)
  "[&_.mt]:mr-1 [&_.mt]:font-mono [&_.mt]:text-[11px] [&_.mt]:font-semibold [&_.mt]:tracking-[0.08em] [&_.mt]:uppercase [&_.mt]:text-primary " +
  // p.mt — a recipe subtitle line
  "[&_p.mt]:mt-0 [&_p.mt]:mb-1";

const CALLOUT_VARIANT: Record<Callout["variant"], string> = {
  brown: "border-l-primary bg-muted/40",
  blue: "border-l-hide/70 bg-hide/5",
};

/* ---------------------------- the widget ---------------------------- */

const PLAN_BY_ID = new Map(SESSION_PLANS.map((p) => [p.id, p]));

export function FacilitatorGuide() {
  const [view, setView] = useState<string>("home");
  const [context, setContext] = useState<ContextKey>("low");
  const [format, setFormat] = useState<FormatKey>("ip");
  const [pop, setPop] = useState<string | null>(null);

  const go = useCallback((id: string) => {
    setView(id);
  }, []);

  const popHtml = pop ? FG_POPUPS[pop] : null;
  const popTitle = popHtml ? extractH3(popHtml) : "";

  return (
    <div className="not-prose border-border bg-card shadow-soft my-6 overflow-hidden rounded-xl border">
      <div className="p-5">
        {view === "home" ? (
          <HomeView go={go} />
        ) : view === "m-role" ? (
          <RoleView go={go} onPop={setPop} context={context} setContext={setContext} />
        ) : view === "m-takes" ? (
          <TakesView go={go} onPop={setPop} />
        ) : view === "m-participation" ? (
          <SimpleTileView
            go={go}
            onPop={setPop}
            head={PART_HEAD}
            tiles={PART_TILES}
            callout={PART_CALLOUT}
            nextId="m-agency"
            nextLabel="Next: Agency, not regurgitation →"
          />
        ) : view === "m-agency" ? (
          <SimpleTileView
            go={go}
            onPop={setPop}
            head={AGENCY_HEAD}
            tiles={AGENCY_TILES}
            callout={AGENCY_CALLOUT}
            nextId="m-convert"
            nextLabel="Next: Async → sync converter →"
          />
        ) : view === "m-convert" ? (
          <SimpleTileView
            go={go}
            onPop={setPop}
            head={CONVERT_HEAD}
            tiles={CONVERT_TILES}
            callout={CONVERT_CALLOUT}
            nextId="m-session"
            nextLabel="Next: The 60-minute session →"
          />
        ) : view === "m-session" ? (
          <SessionSkeletonView go={go} onPop={setPop} />
        ) : view === "m-resources" ? (
          <ResourcesView go={go} />
        ) : PLAN_BY_ID.has(view) ? (
          <SessionPlanView
            go={go}
            onPop={setPop}
            plan={PLAN_BY_ID.get(view)!}
            format={format}
            setFormat={setFormat}
          />
        ) : (
          <HomeView go={go} />
        )}
      </div>

      {/* shared popup dialog */}
      <Dialog open={pop !== null} onOpenChange={(o) => !o && setPop(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{popTitle}</DialogTitle>
          </DialogHeader>
          {popHtml && (
            <div
              className={cn("text-foreground", AUTHORED)}
              dangerouslySetInnerHTML={{ __html: popHtml }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------ pieces ------------------------------ */

function BackButton({ go }: { go: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => go("home")}
      className="text-muted-foreground hover:text-foreground -ml-1 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
    >
      <ArrowLeft className="size-3.5" aria-hidden /> All modules
    </button>
  );
}

/** Renders an inline HTML fragment (lede / callout body) that may contain
 *  `<button data-pop="…">term</button>` term triggers. We split on those and
 *  render real buttons that open the shared dialog; the rest is safe authored
 *  HTML. */
function InlineWithTerms({
  html,
  onPop,
  className,
}: {
  html: string;
  onPop: (id: string) => void;
  className?: string;
}) {
  const parts = useMemo(() => splitTerms(html), [html]);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.kind === "html" ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: part.html }} />
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => onPop(part.pop)}
            className="text-foreground decoration-primary hover:bg-muted font-semibold underline decoration-dotted decoration-2 underline-offset-4"
          >
            {part.label}
          </button>
        ),
      )}
    </span>
  );
}

function CalloutBox({
  callout,
  onPop,
}: {
  callout: Callout;
  onPop: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "my-4 rounded-r-lg border-l-4 py-3 pr-4 pl-4 text-sm leading-relaxed [&_em]:italic [&_strong]:font-semibold",
        CALLOUT_VARIANT[callout.variant],
      )}
    >
      <InlineWithTerms html={callout.html} onPop={onPop} />
    </div>
  );
}

function TileButton({
  tile,
  onPop,
}: {
  tile: Tile;
  onPop: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPop(tile.pop)}
      className="border-border bg-card hover:border-primary shadow-soft group relative rounded-xl border p-4 pr-9 text-left transition-colors"
    >
      <span
        aria-hidden
        className="border-border text-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground absolute top-3 right-3 flex size-5 items-center justify-center rounded-full border transition-colors"
      >
        <Plus className="size-3" />
      </span>
      <h4
        className="text-sm font-semibold [&_em]:italic"
        dangerouslySetInnerHTML={{ __html: tile.title }}
      />
      <p
        className="text-muted-foreground mt-1 text-[13px] leading-snug [&_em]:italic"
        dangerouslySetInnerHTML={{ __html: tile.desc }}
      />
      {tile.timing && (
        <span className="text-hide mt-2 block font-mono text-[10px] font-semibold tracking-[0.06em] uppercase">
          {tile.timing}
        </span>
      )}
    </button>
  );
}

function TileGrid({
  tiles,
  onPop,
}: {
  tiles: Tile[];
  onPop: (id: string) => void;
}) {
  return (
    <div className="my-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <TileButton key={t.pop} tile={t} onPop={onPop} />
      ))}
    </div>
  );
}

const PHASE_DOT: Record<Stage["phase"], string> = {
  open: "text-hide",
  explore: "text-exaggerate",
  close: "text-comply",
};

function Lifecycle({
  stages,
  onPop,
}: {
  stages: Stage[];
  onPop: (id: string) => void;
}) {
  return (
    <div className="my-4 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((s) => (
        <button
          key={s.pop}
          type="button"
          onClick={() => onPop(s.pop)}
          className="border-border bg-card hover:border-primary shadow-soft rounded-lg border p-3 text-left transition-colors"
        >
          <span className="text-primary font-mono text-[11px] font-bold tracking-[0.08em]">
            {s.num}
          </span>
          <h4 className="mt-1 text-sm font-semibold">{s.title}</h4>
          <p className="text-muted-foreground mt-0.5 text-[12px] leading-snug">
            {s.desc}
          </p>
          <span
            className={cn(
              "mt-1.5 block font-mono text-[10px] font-semibold tracking-[0.06em] uppercase",
              PHASE_DOT[s.phase],
            )}
          >
            {PHASE_LABEL[s.phase]}
          </span>
        </button>
      ))}
    </div>
  );
}

function ResourceGrid({ boxes }: { boxes: ResBox[] }) {
  return (
    <div className="my-4 grid gap-3 sm:grid-cols-2">
      {boxes.map((box) => (
        <div key={box.heading} className="border-border bg-card rounded-xl border p-4">
          <h4 className="text-primary font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
            {box.heading}
          </h4>
          <ul className="mt-2.5 space-y-2.5">
            {box.items.map((it, i) => (
              <li
                key={i}
                className="text-sm leading-snug [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80 [&_small]:text-muted-foreground [&_small]:mt-0.5 [&_small]:block [&_small]:text-[12.5px]"
                dangerouslySetInnerHTML={{ __html: it.html }}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function NextNav({
  go,
  nextId,
  nextLabel,
}: {
  go: (id: string) => void;
  nextId?: string;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
      <Button variant="ghost" size="sm" onClick={() => go("home")} className="gap-1.5">
        <ArrowLeft className="size-4" aria-hidden /> All modules
      </Button>
      {nextId && nextLabel && (
        <Button size="sm" onClick={() => go(nextId)}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}

function SubHead({ heading, note }: { heading: string; note?: string }) {
  return (
    <div className="mt-6">
      <h4 className="text-base font-semibold">{heading}</h4>
      {note && <p className="text-muted-foreground mt-0.5 text-sm">{note}</p>}
    </div>
  );
}

/* ------------------------------- views ------------------------------- */

function ViewHead({
  title,
  lede,
  onPop,
}: {
  title: string;
  lede: string;
  onPop: (id: string) => void;
}) {
  return (
    <>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed [&_em]:italic">
        <InlineWithTerms html={lede} onPop={onPop} />
      </p>
    </>
  );
}

function HomeView({ go }: { go: (id: string) => void }) {
  return (
    <div>
      <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
        {FG_HEADER.lede}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FG_PRINCIPLES.map((p) => (
          <span
            key={p}
            className="bg-muted text-muted-foreground rounded-md px-2.5 py-1.5 text-xs font-semibold"
          >
            {p}
          </span>
        ))}
      </div>

      <ModuleGrid cards={FG_CRAFT_CARDS} go={go} />
      <p className="text-muted-foreground mt-1 text-[13px] font-semibold">
        {FG_HOME_HINT_1}
      </p>

      <SubHead heading={FG_HOME_SESSION_HEADING} note={FG_HOME_SESSION_NOTE} />
      <ModuleGrid cards={FG_SESSION_CARDS} go={go} />
      <p className="text-muted-foreground mt-1 text-[13px] font-semibold">
        {FG_HOME_HINT_2}
      </p>
    </div>
  );
}

function ModuleGrid({
  cards,
  go,
}: {
  cards: typeof FG_CRAFT_CARDS;
  go: (id: string) => void;
}) {
  return (
    <div className="my-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => go(c.id)}
          className="border-border bg-card hover:border-primary shadow-soft relative rounded-xl border p-4.5 pt-4 text-left transition-colors"
        >
          <span className="text-muted-foreground absolute top-3.5 right-4 font-mono text-[11px] font-bold tracking-[0.08em]">
            {c.num}
          </span>
          <h4 className="pr-8 text-[17px] font-semibold tracking-tight">
            {c.title}
          </h4>
          <p className="text-muted-foreground mt-1.5 text-[13.5px] leading-snug">
            {c.desc}
          </p>
          <span className="text-primary mt-2.5 block font-mono text-[11px] font-semibold tracking-[0.05em] uppercase">
            {c.meta}
          </span>
        </button>
      ))}
    </div>
  );
}

function RoleView({
  go,
  onPop,
  context,
  setContext,
}: {
  go: (id: string) => void;
  onPop: (id: string) => void;
  context: ContextKey;
  setContext: (c: ContextKey) => void;
}) {
  return (
    <div>
      <BackButton go={go} />
      <div className="mt-3">
        <ViewHead title={ROLE_HEAD.title} lede={ROLE_HEAD.lede} onPop={onPop} />
      </div>

      <div
        role="group"
        aria-label="Context level"
        className="mt-4 flex flex-wrap gap-1.5"
      >
        {(
          [
            ["low", ROLE_HEAD.ctxLabelLow],
            ["high", ROLE_HEAD.ctxLabelHigh],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={context === key}
            onClick={() => setContext(key)}
            className={cn(
              "rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors",
              context === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {context === "low" ? (
          <>
            <CalloutBox callout={ROLE_CALLOUT_LOW} onPop={onPop} />
            <TileGrid tiles={ROLE_TILES_LOW} onPop={onPop} />
          </>
        ) : (
          <>
            <CalloutBox callout={ROLE_CALLOUT_HIGH} onPop={onPop} />
            <TileGrid tiles={ROLE_TILES_HIGH} onPop={onPop} />
          </>
        )}
      </div>

      <CalloutBox callout={ROLE_CALLOUT_SPINE} onPop={onPop} />
      <NextNav go={go} nextId="m-takes" nextLabel="Next: Good takes vs. bad →" />
    </div>
  );
}

function TakesView({
  go,
  onPop,
}: {
  go: (id: string) => void;
  onPop: (id: string) => void;
}) {
  return (
    <div>
      <BackButton go={go} />
      <div className="mt-3">
        <ViewHead title={TAKES_HEAD.title} lede={TAKES_HEAD.lede} onPop={onPop} />
      </div>

      <TileGrid tiles={TAKES_TILES} onPop={onPop} />

      <SubHead heading={TAKES_SORTER_HEAD.heading} note={TAKES_SORTER_HEAD.note} />
      <div className="mt-3 space-y-2.5">
        {TAKES_SORTER.map((item, i) => (
          <SorterCard key={i} item={item} />
        ))}
      </div>

      <CalloutBox callout={TAKES_CALLOUT} onPop={onPop} />
      <NextNav
        go={go}
        nextId="m-participation"
        nextLabel="Next: Getting everyone talking →"
      />
    </div>
  );
}

function SorterCard({ item }: { item: SorterItem }) {
  const [choice, setChoice] = useState<Verdict | null>(null);
  const done = choice !== null;
  const correct = done && choice === item.answer;

  return (
    <div
      className={cn(
        "rounded-lg border p-3.5 transition-colors",
        !done && "border-border bg-card",
        done && correct && "border-comply/60 bg-comply/5",
        done && !correct && "border-defect/60 bg-defect/5",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-[240px] flex-1 text-sm italic">{item.quote}</p>
        {!done ? (
          <div className="flex gap-1.5">
            {(["strong", "weak"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setChoice(v)}
                className="border-border bg-muted hover:border-primary rounded-md border px-3 py-2 text-xs font-semibold capitalize transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold",
              correct
                ? "bg-comply/15 text-comply"
                : "bg-defect/15 text-defect",
            )}
          >
            {correct ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
            You said {choice}
          </span>
        )}
      </div>
      {done && (
        <p
          aria-live="polite"
          className="text-muted-foreground mt-2 text-[13.5px] leading-relaxed [&_.move]:text-primary [&_.move]:italic [&_em]:italic [&_strong]:text-foreground [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: item.verdictHtml }}
        />
      )}
    </div>
  );
}

function SimpleTileView({
  go,
  onPop,
  head,
  tiles,
  callout,
  nextId,
  nextLabel,
}: {
  go: (id: string) => void;
  onPop: (id: string) => void;
  head: { title: string; lede: string };
  tiles: Tile[];
  callout: Callout;
  nextId?: string;
  nextLabel?: string;
}) {
  return (
    <div>
      <BackButton go={go} />
      <div className="mt-3">
        <ViewHead title={head.title} lede={head.lede} onPop={onPop} />
      </div>
      <TileGrid tiles={tiles} onPop={onPop} />
      <CalloutBox callout={callout} onPop={onPop} />
      <NextNav go={go} nextId={nextId} nextLabel={nextLabel} />
    </div>
  );
}

function SessionSkeletonView({
  go,
  onPop,
}: {
  go: (id: string) => void;
  onPop: (id: string) => void;
}) {
  return (
    <div>
      <BackButton go={go} />
      <div className="mt-3">
        <ViewHead title={SESSION_HEAD.title} lede={SESSION_HEAD.lede} onPop={onPop} />
      </div>
      <Lifecycle stages={SESSION_STAGES} onPop={onPop} />
      <CalloutBox callout={SESSION_CALLOUT} onPop={onPop} />
      <NextNav go={go} nextId="m-resources" nextLabel="Next: Resources →" />
    </div>
  );
}

function ResourcesView({ go }: { go: (id: string) => void }) {
  return (
    <div>
      <BackButton go={go} />
      <div className="mt-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {RESOURCES_HEAD.title}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{RESOURCES_HEAD.lede}</p>
      </div>
      <ResourceGrid boxes={RESOURCES_BOXES} />
      <NextNav go={go} nextId="m-intro" nextLabel="Next: Session plans →" />
    </div>
  );
}

function FormatBar({
  format,
  setFormat,
}: {
  format: FormatKey;
  setFormat: (f: FormatKey) => void;
}) {
  return (
    <div role="group" aria-label="Format" className="mt-4 flex flex-wrap gap-1.5">
      {(["ip", "zm"] as const).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={format === key}
          onClick={() => setFormat(key)}
          className={cn(
            "rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors",
            format === key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {FG_FORMAT_LABELS[key]}
        </button>
      ))}
    </div>
  );
}

function SessionPlanView({
  go,
  onPop,
  plan,
  format,
  setFormat,
}: {
  go: (id: string) => void;
  onPop: (id: string) => void;
  plan: SessionPlan;
  format: FormatKey;
  setFormat: (f: FormatKey) => void;
}) {
  return (
    <div>
      <BackButton go={go} />
      <div className="mt-3">
        <ViewHead title={plan.title} lede={plan.lede} onPop={onPop} />
      </div>

      {plan.principles && (
        <div className="mt-3 flex flex-wrap gap-2">
          {plan.principles.map((p) => (
            <span
              key={p}
              className="bg-muted text-muted-foreground rounded-md px-2.5 py-1.5 text-xs font-semibold"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <FormatBar format={format} setFormat={setFormat} />
      <div aria-live="polite">
        <CalloutBox
          callout={{ variant: "blue", html: plan.prep[format] }}
          onPop={onPop}
        />
      </div>

      {plan.coreTiles && (
        <>
          <SubHead heading={plan.coreHeading ?? ""} note={plan.coreNote} />
          <TileGrid tiles={plan.coreTiles} onPop={onPop} />
        </>
      )}

      <Lifecycle stages={plan.stages} onPop={onPop} />

      <SubHead heading={plan.promptsHeading} note={plan.promptsNote} />
      <TileGrid tiles={plan.promptTiles} onPop={onPop} />

      <SubHead heading={plan.sendHeading} />
      <ResourceGrid boxes={[plan.sendBox]} />

      <CalloutBox callout={plan.seed} onPop={onPop} />

      <NextNav go={go} nextId={plan.nextId} nextLabel={plan.nextLabel} />
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */

/** Pull the text of the leading <h3>…</h3> for use as a dialog title. */
function extractH3(html: string): string {
  const m = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
  if (!m) return "";
  return decodeEntities(m[1].replace(/<[^>]+>/g, "").trim());
}

type TermPart =
  | { kind: "html"; html: string }
  | { kind: "term"; pop: string; label: string };

/** Split an authored inline fragment into safe HTML runs and term buttons
 *  (`<button data-pop="…">label</button>`). */
function splitTerms(html: string): TermPart[] {
  const parts: TermPart[] = [];
  const re = /<button[^>]*data-pop="([^"]+)"[^>]*>([\s\S]*?)<\/button>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) parts.push({ kind: "html", html: html.slice(last, m.index) });
    parts.push({
      kind: "term",
      pop: m[1],
      label: decodeEntities(m[2].replace(/<[^>]+>/g, "")),
    });
    last = re.lastIndex;
  }
  if (last < html.length) parts.push({ kind: "html", html: html.slice(last) });
  return parts;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
