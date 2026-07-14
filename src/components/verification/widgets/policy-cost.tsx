"use client";

import { useState } from "react";
import { ArrowRight, Lock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  POLICY_COST_COPY as C,
  type PolicyCostEase,
} from "@/lib/verification/data/policy-cost";
import type { VerificationWidgetProps } from "../kit/types";

const EASE_ORDER: PolicyCostEase[] = ["instant", "thought", "hard"];

/**
 * "Everything comes with a cost" — a two-sided card: name a policy you believe
 * in, flip it, name its enforcement price, then a self-report on how hard the
 * price was to name. Nothing typed leaves the page. Bridged: completing the
 * self-report records progress.
 */
export function PolicyCost({ onComplete }: VerificationWidgetProps) {
  const [side, setSide] = useState<"a" | "b">("a");
  const [policy, setPolicy] = useState("");
  const [cost, setCost] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [ease, setEase] = useState<PolicyCostEase | null>(null);

  const policyText = policy.trim();
  const costText = cost.trim();

  function pickEase(key: PolicyCostEase) {
    setEase(key);
    onComplete();
  }

  function reset() {
    setSide("a");
    setPolicy("");
    setCost("");
    setRevealed(false);
    setEase(null);
  }

  return (
    <div className="not-prose my-6">
      <div className="border-border bg-card shadow-soft overflow-hidden rounded-xl border p-5">
        {!revealed ? (
          <div className="mx-auto max-w-xl">
            {/* the two card sides */}
            {side === "a" ? (
              <section aria-labelledby="pc-a-head" className="space-y-3">
                <Badge variant="secondary">{C.tagA}</Badge>
                <div className="space-y-1.5">
                  <Label id="pc-a-head" htmlFor="pc-policy">
                    {C.labelA}
                  </Label>
                  <Textarea
                    id="pc-policy"
                    value={policy}
                    onChange={(e) => setPolicy(e.target.value)}
                    placeholder={C.phA}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {C.chipLabel}
                  </span>
                  {C.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setPolicy(chip)}
                      className="border-border hover:bg-muted rounded-full border px-3 py-1 text-xs transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Lock className="size-3" aria-hidden /> {C.privacy}
                </p>
                <Button
                  onClick={() => setSide("b")}
                  disabled={!policyText}
                  className="gap-2"
                >
                  {C.flipBtn} <ArrowRight className="size-4" aria-hidden />
                </Button>
              </section>
            ) : (
              <section aria-labelledby="pc-b-head" className="space-y-3">
                <Badge variant="secondary">{C.tagB}</Badge>
                <p className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium">
                    {C.echoLabel}
                  </span>{" "}
                  {policyText}
                </p>
                <div className="space-y-1.5">
                  <Label id="pc-b-head" htmlFor="pc-cost">
                    {C.labelB}
                  </Label>
                  <Textarea
                    id="pc-cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder={C.phB}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <details className="text-muted-foreground text-xs">
                  <summary className="cursor-pointer select-none">
                    {C.stuck}
                  </summary>
                  <p className="mt-1.5">{C.lenses}</p>
                </details>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => setSide("a")}>
                    {C.backBtn}
                  </Button>
                  <Button
                    onClick={() => setRevealed(true)}
                    disabled={!costText}
                    className="gap-2"
                  >
                    {C.faceBtn} <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-xl space-y-5">
            {/* the composed sentence */}
            <div className="border-border bg-muted/40 rounded-lg border p-4">
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                {C.fullTag}
              </p>
              <p className="mt-2 text-lg leading-relaxed">
                {C.fullTpl.pre}
                <span className="text-comply font-semibold">{policyText}</span>
                {C.fullTpl.mid}
                <span className="text-defect font-semibold">{costText}</span>
                {C.fullTpl.post}
              </p>
            </div>

            {/* self-report */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{C.askQ}</p>
              <div
                role="group"
                aria-label={C.askQ}
                className="flex flex-wrap gap-2"
              >
                {EASE_ORDER.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={ease === key}
                    onClick={() => pickEase(key)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      ease === key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {C.ease[key]}
                  </button>
                ))}
              </div>
            </div>

            {ease && (
              <div className="space-y-4">
                <p className="border-hide/40 bg-hide/5 rounded-lg border-l-2 p-3 text-sm">
                  {C.branch[ease]}
                </p>
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="size-4" aria-hidden /> {C.again}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
