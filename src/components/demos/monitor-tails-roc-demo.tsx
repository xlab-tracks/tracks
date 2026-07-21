"use client";

import {
  MONITOR_A,
  MONITOR_B,
  RocPanel,
} from "@/components/exercises/monitor-roc-pair-figure";

// Static pre-question figure for "Same AUROC, different safety": the two
// monitors' ROC curves at fixed AUROC 0.92 — no densities, no operating-point
// dots, no 2% line. Two equal-area curves that cross: "which is safer?" is
// ill-posed until the audit budget pins an operating point. The interactive
// monitor-tails demo that follows the question is the reveal.
//
// Drawn by the shared RocPanel (monitor-roc-pair-figure.tsx) so this standalone
// figure and the staged exercise's stage-1 view stay pixel-identical.

export function MonitorTailsRocDemo() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <RocPanel
        monitors={[
          { q: 0.92, sd: 1, color: MONITOR_A, label: "A", labelFpr: 0.04, labelDy: -5 },
          { q: 0.92, sd: 0.4, color: MONITOR_B, label: "B", labelFpr: 0.45, labelDy: 11 },
        ]}
        ariaLabel="ROC curves of monitors A and B with identical AUC"
      />
      <p className="text-muted-foreground mt-1 text-center text-sm">
        AUC: <span className="font-semibold tabular-nums">A = B = 0.92</span>
      </p>
    </div>
  );
}
