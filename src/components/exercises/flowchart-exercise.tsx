"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { Check, Eye, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gradeFlowchartStage } from "@/app/actions/exercises";
import type {
  FlowchartStageResult,
  PublicFlowchartExercise,
} from "@/lib/content/exercise-view";
import type { FlowchartBlock, FlowchartNode } from "@/lib/content/types";
import { EXERCISE_TYPE_LABELS } from "@/lib/content/types";

// A position in the chart: descend from the root sequence through
// `nodes[node].branches[arm]` at each hop; the path addresses a sequence.
type ArmPath = { node: number; arm: number }[];

function updateSequence(
  tree: FlowchartNode[],
  path: ArmPath,
  update: (seq: FlowchartNode[]) => FlowchartNode[],
): FlowchartNode[] {
  if (path.length === 0) return update(tree);
  const [head, ...rest] = path;
  return tree.map((node, i) =>
    i === head.node
      ? {
          ...node,
          branches: (node.branches ?? []).map((arm, j) =>
            j === head.arm ? updateSequence(arm, rest, update) : arm,
          ),
        }
      : node,
  );
}

/** Every sequence still accepting blocks: empty, or ending in a plain step. */
function collectOpenPaths(
  nodes: FlowchartNode[],
  blocks: Map<string, FlowchartBlock>,
  path: ArmPath,
): ArmPath[] {
  const last = nodes[nodes.length - 1];
  if (!last) return [path];
  const kind = blocks.get(last.blockId)?.kind;
  if (kind === "terminal") return [];
  if (kind === "branch") {
    return (last.branches ?? []).flatMap((arm, j) =>
      collectOpenPaths(arm, blocks, [...path, { node: nodes.length - 1, arm: j }]),
    );
  }
  return [path];
}

interface StageState {
  tree: FlowchartNode[];
  result: FlowchartStageResult | null;
  attempts: number;
  solution: FlowchartNode[] | null;
}

const EMPTY_STAGE: StageState = { tree: [], result: null, attempts: 0, solution: null };

const DRAG_MIME = "application/x-flowchart-block";

export function FlowchartExerciseCard({
  exercise,
  initialStages,
}: {
  exercise: PublicFlowchartExercise;
  /** Prior attempts loaded from the learner's submission, keyed by stage id. */
  initialStages?: Record<string, { attempt: FlowchartNode[]; correct: boolean }>;
}) {
  const blocks = useMemo(
    () => new Map(exercise.palette.map((block) => [block.id, block])),
    [exercise.palette],
  );

  const [stageIndex, setStageIndex] = useState(0);
  const [stages, setStages] = useState<Record<string, StageState>>(() => {
    const initial: Record<string, StageState> = {};
    for (const stage of exercise.stages) {
      const prior = initialStages?.[stage.id];
      initial[stage.id] = prior
        ? {
            tree: prior.attempt,
            result: prior.correct ? { correct: true } : null,
            attempts: 0,
            solution: null,
          }
        : EMPTY_STAGE;
    }
    return initial;
  });
  const [showDescription, setShowDescription] = useState(false);
  // Tap-to-place fallback for devices without drag support: tap a palette
  // block to arm it, then tap a drop slot.
  const [armedBlockId, setArmedBlockId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stage = exercise.stages[stageIndex];
  const state = stages[stage.id] ?? EMPTY_STAGE;
  const solved = state.result?.correct === true;

  const patchStage = (id: string, patch: Partial<StageState>) =>
    setStages((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_STAGE), ...patch } }));

  const openPaths = collectOpenPaths(state.tree, blocks, []);
  const complete = state.tree.length > 0 && openPaths.length === 0;
  const solvedCount = exercise.stages.filter(
    (s) => stages[s.id]?.result?.correct,
  ).length;

  const goToStage = (i: number) => {
    setStageIndex(i);
    setShowDescription(false);
    setArmedBlockId(null);
  };

  const place = (path: ArmPath, blockId: string) => {
    const block = blocks.get(blockId);
    if (!block) return;
    const node: FlowchartNode =
      block.kind === "branch"
        ? { blockId: block.id, branches: (block.branchLabels ?? []).map(() => []) }
        : { blockId: block.id };
    patchStage(stage.id, {
      tree: updateSequence(state.tree, path, (seq) => [...seq, node]),
      result: null,
    });
    setArmedBlockId(null);
  };

  const truncate = (path: ArmPath, index: number) =>
    patchStage(stage.id, {
      tree: updateSequence(state.tree, path, (seq) => seq.slice(0, index)),
      result: null,
    });

  const check = () =>
    startTransition(async () => {
      const result = await gradeFlowchartStage(exercise.id, stage.id, state.tree);
      patchStage(stage.id, {
        result,
        attempts: result.correct ? state.attempts : state.attempts + 1,
      });
    });

  const reveal = () =>
    startTransition(async () => {
      const result = await gradeFlowchartStage(
        exercise.id,
        stage.id,
        state.tree,
        true,
      );
      patchStage(stage.id, { solution: result.solution ?? null });
    });

  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {EXERCISE_TYPE_LABELS[exercise.type]} · {solvedCount}/{exercise.stages.length}
      </p>
      <p className="font-medium">{exercise.prompt}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {exercise.stages.map((s, i) => {
          const done = stages[s.id]?.result?.correct;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStage(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                i === stageIndex
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-muted",
                done && i !== stageIndex && "border-emerald-500/50 text-emerald-600",
              )}
            >
              {done && <Check className="size-3" aria-hidden />}
              {s.title}
            </button>
          );
        })}
      </div>

      <div className="border-border mt-4 rounded-lg border border-dashed p-3">
        <button
          type="button"
          onClick={() => setShowDescription((v) => !v)}
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          {showDescription ? "Hide" : "Show"} the protocol description from Table 2
        </button>
        {showDescription && <p className="mt-2 text-sm">{stage.description}</p>}
      </div>

      <div className="mt-5 flex flex-col gap-5 md:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-center overflow-x-auto px-1 pb-1">
            <div className="border-border bg-muted text-muted-foreground rounded-full border px-3 py-1 text-xs">
              Problem arrives
            </div>
            <Connector />
            <Sequence
              nodes={state.tree}
              blocks={blocks}
              path={[]}
              locked={solved || pending}
              armedBlockId={armedBlockId}
              onPlace={place}
              onTruncate={truncate}
            />
          </div>
        </div>
        <Palette
          blocks={exercise.palette}
          disabled={solved || pending}
          armedBlockId={armedBlockId}
          onArm={(id) => setArmedBlockId((cur) => (cur === id ? null : id))}
        />
      </div>

      {state.result && (
        <div
          className={cn(
            "mt-4 rounded-lg p-3 text-sm",
            state.result.correct ? "bg-emerald-500/10" : "bg-muted",
          )}
        >
          <p className="font-medium">
            {state.result.correct ? "Correct" : "Not quite — adjust the chart and check again"}
          </p>
          {state.result.explanation && (
            <p className="text-muted-foreground mt-1">{state.result.explanation}</p>
          )}
        </div>
      )}

      {state.solution && !solved && (
        <div className="border-border mt-4 rounded-lg border p-3">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Solution
          </p>
          <div className="flex flex-col items-center overflow-x-auto">
            <Sequence nodes={state.solution} blocks={blocks} path={[]} locked />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!solved && (
          <>
            <Button size="sm" onClick={check} disabled={!complete || pending}>
              {pending ? "Checking…" : "Check chart"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                patchStage(stage.id, { tree: [], result: null });
                setArmedBlockId(null);
              }}
              disabled={state.tree.length === 0 || pending}
            >
              <RotateCcw className="size-3.5" aria-hidden /> Reset
            </Button>
            {state.attempts >= 2 && !state.solution && (
              <Button size="sm" variant="outline" onClick={reveal} disabled={pending}>
                <Eye className="size-3.5" aria-hidden /> Show solution
              </Button>
            )}
          </>
        )}
        {!complete && state.tree.length > 0 && !solved && (
          <span className="text-muted-foreground text-xs">
            Every path must end in a submit or audit block.
          </span>
        )}
        {solved && stageIndex < exercise.stages.length - 1 && (
          <Button size="sm" onClick={() => goToStage(stageIndex + 1)}>
            Next protocol
          </Button>
        )}
        {solved && stageIndex === exercise.stages.length - 1 && solvedCount === exercise.stages.length && (
          <span className="text-sm font-medium text-emerald-600">
            All {exercise.stages.length} protocols constructed.
          </span>
        )}
      </div>
    </aside>
  );
}

function Connector() {
  return <div className="bg-border h-4 w-px shrink-0" aria-hidden />;
}

function Sequence({
  nodes,
  blocks,
  path,
  locked,
  armedBlockId,
  onPlace,
  onTruncate,
}: {
  nodes: FlowchartNode[];
  blocks: Map<string, FlowchartBlock>;
  path: ArmPath;
  locked?: boolean;
  armedBlockId?: string | null;
  onPlace?: (path: ArmPath, blockId: string) => void;
  onTruncate?: (path: ArmPath, index: number) => void;
}) {
  const last = nodes[nodes.length - 1];
  const lastKind = last ? blocks.get(last.blockId)?.kind : undefined;
  const open = lastKind === undefined || lastKind === "step";

  return (
    <div className="flex flex-col items-center">
      {nodes.map((node, i) => {
        const block = blocks.get(node.blockId);
        if (!block) return null;
        return (
          <Fragment key={i}>
            {i > 0 && <Connector />}
            <NodeBox
              block={block}
              locked={locked}
              onRemove={onTruncate ? () => onTruncate(path, i) : undefined}
            />
            {block.kind === "branch" && (
              <>
                <Connector />
                <div className="flex items-start gap-3">
                  {(node.branches ?? []).map((arm, j) => (
                    <div key={j} className="flex min-w-24 flex-col items-center">
                      <span className="text-muted-foreground border-border bg-background rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                        {block.branchLabels?.[j]}
                      </span>
                      <Connector />
                      <Sequence
                        nodes={arm}
                        blocks={blocks}
                        path={[...path, { node: i, arm: j }]}
                        locked={locked}
                        armedBlockId={armedBlockId}
                        onPlace={onPlace}
                        onTruncate={onTruncate}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </Fragment>
        );
      })}
      {open && !locked && onPlace && (
        <>
          {nodes.length > 0 && <Connector />}
          <DropSlot
            armed={armedBlockId != null}
            onPlaceBlock={(blockId) => onPlace(path, blockId)}
            armedBlockId={armedBlockId ?? null}
          />
        </>
      )}
    </div>
  );
}

function DropSlot({
  armed,
  armedBlockId,
  onPlaceBlock,
}: {
  armed: boolean;
  armedBlockId: string | null;
  onPlaceBlock: (blockId: string) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <button
      type="button"
      onClick={() => armedBlockId && onPlaceBlock(armedBlockId)}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const blockId = event.dataTransfer.getData(DRAG_MIME);
        if (blockId) onPlaceBlock(blockId);
      }}
      className={cn(
        "border-border text-muted-foreground rounded-lg border border-dashed px-3 py-1.5 text-xs transition-colors",
        over && "border-foreground bg-muted text-foreground",
        armed && !over && "border-foreground/50 text-foreground",
      )}
    >
      {armed ? "Place here" : "Drop a block here"}
    </button>
  );
}

function NodeBox({
  block,
  locked,
  onRemove,
}: {
  block: FlowchartBlock;
  locked?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative max-w-56 rounded-lg border px-3 py-2 text-center text-xs leading-snug",
        block.kind === "step" && "border-border bg-card",
        block.kind === "branch" && "border-border bg-muted border-dashed",
        block.kind === "terminal" && "border-foreground/30 bg-card font-medium",
      )}
    >
      {block.label}
      {!locked && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove "${block.label}" and everything after it`}
          className="border-border bg-background text-muted-foreground hover:text-destructive absolute -top-2 -right-2 hidden size-4 items-center justify-center rounded-full border group-hover:flex"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </div>
  );
}

const BLOCK_GROUPS: { kind: FlowchartBlock["kind"]; heading: string }[] = [
  { kind: "step", heading: "Steps" },
  { kind: "branch", heading: "Decisions" },
  { kind: "terminal", heading: "Endings" },
];

function Palette({
  blocks,
  disabled,
  armedBlockId,
  onArm,
}: {
  blocks: FlowchartBlock[];
  disabled?: boolean;
  armedBlockId: string | null;
  onArm: (blockId: string) => void;
}) {
  return (
    <div className="w-full shrink-0 md:w-60">
      <p className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wide uppercase">
        Blocks — drag into the chart
      </p>
      {BLOCK_GROUPS.map(({ kind, heading }) => {
        const group = blocks.filter((block) => block.kind === kind);
        if (group.length === 0) return null;
        return (
          <div key={kind} className="mb-3 last:mb-0">
            <p className="text-muted-foreground mb-1.5 text-[10px] tracking-wide uppercase">
              {heading}
            </p>
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
              {group.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  draggable={!disabled}
                  onDragStart={(event) => {
                    event.dataTransfer.setData(DRAG_MIME, block.id);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => !disabled && onArm(block.id)}
                  aria-pressed={armedBlockId === block.id}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-left text-xs leading-snug select-none",
                    block.kind === "step" && "border-border bg-card",
                    block.kind === "branch" && "border-border bg-muted border-dashed",
                    block.kind === "terminal" && "border-foreground/30 bg-card font-medium",
                    disabled
                      ? "cursor-default opacity-50"
                      : "hover:border-foreground/50 cursor-grab active:cursor-grabbing",
                    armedBlockId === block.id && "ring-foreground border-foreground ring-1",
                  )}
                >
                  {block.label}
                  {block.branchLabels && (
                    <span className="text-muted-foreground block font-normal">
                      {block.branchLabels.join(" / ")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-muted-foreground mt-2 text-[10px]">
        Drag a block onto a dashed slot — or tap a block, then tap the slot.
      </p>
    </div>
  );
}
