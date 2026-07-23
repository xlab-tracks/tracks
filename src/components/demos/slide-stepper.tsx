"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SlideStep {
  /** Short name shown above the caption and on the dot's tooltip. */
  label: string;
  caption: ReactNode;
}

export interface SlideStepperProps {
  steps: SlideStep[];
  /** Renders the diagram for the current step (0-based). */
  children: (step: number) => ReactNode;
}

/**
 * Zybooks-style slide chrome: a diagram area, a caption panel, and
 * Back / dots / Next navigation. Owns only the step index — the diagram
 * is supplied per-step by the render-prop child. Left/Right arrow keys
 * navigate while the stepper has focus. DemoFrame's Reset remounts the
 * subtree, which returns the stepper to step 0.
 */
export function SlideStepper({ steps, children }: SlideStepperProps) {
  const [step, setStep] = useState(0);
  const last = steps.length - 1;
  const go = (next: number) => setStep(Math.max(0, Math.min(last, next)));

  return (
    <div
      className="focus-visible:ring-ring space-y-3 rounded-md outline-none focus-visible:ring-2"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(step + 1);
        if (e.key === "ArrowLeft") go(step - 1);
      }}
    >
      <div>{children(step)}</div>
      <div className="min-h-20 text-sm">
        <p className="font-medium">
          {step + 1}. {steps[step].label}
        </p>
        <div className="text-muted-foreground mt-1">{steps[step].caption}</div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="size-3.5" aria-hidden /> Back
        </Button>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-label={`Step ${i + 1}: ${s.label}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => go(i)}
              className={`size-2.5 rounded-full transition-colors ${
                i === step ? "bg-primary" : "bg-border hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(step + 1)}
          disabled={step === last}
          className="gap-1"
        >
          Next <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
