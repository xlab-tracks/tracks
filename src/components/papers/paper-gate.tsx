"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A reading gate inside a paper (from a `{op: "gate"}` edit): everything
 * below the gate is withheld until the learner taps through. The optional
 * think-first prompt arrives as an already-server-rendered node (`prompt`),
 * as do the gated parts (`children`) — this component never receives
 * artifact or markdown HTML as strings, preserving the reader's
 * "dangerouslySetInnerHTML stays in the server component" invariant.
 *
 * Deliberately friction, not enforcement: the gated content ships in the
 * payload, and the opened state lives in localStorage only (no auth, no
 * server round-trip). Revisits re-open previously opened gates after mount —
 * a brief collapsed flash on hydration is the accepted cost of keeping the
 * server render user-independent.
 */
export function PaperGate({
  paperId,
  gateId,
  cta,
  prompt,
  children,
}: {
  paperId: string;
  gateId: string;
  cta?: string;
  prompt?: React.ReactNode;
  children: React.ReactNode;
}) {
  const storageKey = `tracks:paper-gate:${paperId}:${gateId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) === "open") setOpen(true);
    } catch {
      // Storage unavailable (private mode etc.) — gate just won't persist.
    }
  }, [storageKey]);

  const openGate = useCallback(() => {
    setOpen(true);
    try {
      window.localStorage.setItem(storageKey, "open");
    } catch {
      // Non-fatal: the reveal still happens for this visit.
    }
  }, [storageKey]);

  return (
    <>
      <div className="border-primary/25 bg-primary/[0.03] my-8 rounded-xl border px-5 py-4">
        <p className="text-primary/75 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          Before you read on
        </p>
        {prompt ? <div className="mt-1.5">{prompt}</div> : null}
        {!open && (
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={openGate}>
              {cta ?? "Tap to continue"}
              <ChevronDown className="size-4" aria-hidden />
            </Button>
          </div>
        )}
      </div>
      {open ? children : null}
    </>
  );
}
