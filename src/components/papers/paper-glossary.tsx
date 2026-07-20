"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useGlossHoverTimers,
  type GlossaryCardData,
} from "@/components/glossary/glossary-card";
import { GlossaryOverlay } from "@/components/glossary/glossary-overlay";

/**
 * Interaction layer for glossary terms inside converted paper HTML. `gloss`
 * edits wrap phrases in `span.ax-gloss[data-gloss]` server-side at patch
 * time; this layer event-delegates over those spans — hover-intent on
 * mouse, tap/Enter/Space otherwise — and renders the shared glossary
 * overlay for the active span (margin card with a connector line when the
 * sidenote gutter has room, anchored popover otherwise). Like
 * PaperSidenotes, it receives no artifact HTML: card data arrives as
 * authored props with definitions already rendered server-side, so the
 * reader's "html never crosses into client components" invariant holds.
 * Gloss spans that PaperSidenotes clones into the margin rail are excluded
 * (and the clone pass strips their trigger semantics): the rail rebuilds
 * on resize/toggle, which would detach an open card's anchor — the
 * canonical in-document footnote keeps the working trigger.
 */

export interface PaperGlossaryEntry {
  termId: string;
  card: GlossaryCardData;
}

export function PaperGlossary({ entries }: { entries: PaperGlossaryEntry[] }) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState<{ termId: string; el: HTMLElement } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  // Delegated DOM handlers are bound once; they read live state via refs
  // (synced post-render below).
  const pendingRef = useRef<{ termId: string; el: HTMLElement } | null>(null);
  const keyboardOpenRef = useRef(false);
  const stateRef = useRef({ open: false, activeEl: null as HTMLElement | null });
  useEffect(() => {
    stateRef.current = { open, activeEl: active?.el ?? null };
  });

  const timers = useGlossHoverTimers(
    useCallback(() => {
      if (!pendingRef.current) return;
      setActive(pendingRef.current);
      setOpen(true);
    }, []),
    useCallback(() => setOpen(false), []),
  );
  // The timer callbacks are stable, so the mount effect can close over them.
  const { scheduleOpen, scheduleClose, cancel } = timers;
  const close = useCallback(() => setOpen(false), []);

  const entryById = useMemo(
    () => new Map(entries.map((entry) => [entry.termId, entry])),
    [entries],
  );

  useEffect(() => {
    const root = markerRef.current?.parentElement; // the .paper-reader div
    if (!root) return;

    const spanOf = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Element)) return null;
      const span = target.closest<HTMLElement>("[data-gloss]");
      if (!span || !root.contains(span)) return null;
      // Sidenote-rail clones rebuild on resize/toggle, detaching any open
      // card's anchor — belt-and-braces alongside the clone pass's strip.
      if (span.closest(".paper-sidenote-layer")) return null;
      return span;
    };
    const pend = (span: HTMLElement) => {
      pendingRef.current = {
        termId: span.getAttribute("data-gloss") ?? "",
        el: span,
      };
    };
    const toggle = (span: HTMLElement) => {
      cancel();
      const { open: isOpen, activeEl } = stateRef.current;
      if (isOpen && activeEl === span) {
        setOpen(false);
        return;
      }
      pend(span);
      setActive(pendingRef.current);
      setOpen(true);
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const span = spanOf(event.target);
      if (!span) return;
      keyboardOpenRef.current = false; // hover opens never move focus
      pend(span);
      scheduleOpen();
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (!spanOf(event.target)) return;
      scheduleClose();
    };
    const onClick = (event: MouseEvent) => {
      const span = spanOf(event.target);
      if (!span) return;
      keyboardOpenRef.current = false;
      toggle(span);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const span = spanOf(event.target);
      if (!span) return;
      event.preventDefault(); // Space must not scroll
      keyboardOpenRef.current = true;
      toggle(span);
    };

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerout", onPointerOut);
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointerout", onPointerOut);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [cancel, scheduleClose, scheduleOpen]);

  // Reflect card state on the trigger for assistive tech. The cleanup
  // resets the PREVIOUS span when the active term switches while open —
  // without it the old trigger reads expanded forever.
  useEffect(() => {
    const el = active?.el;
    if (!el) return;
    el.setAttribute("aria-expanded", open ? "true" : "false");
    return () => el.setAttribute("aria-expanded", "false");
  }, [active, open]);

  const entry = active ? entryById.get(active.termId) : undefined;

  return (
    <span ref={markerRef} hidden>
      {active && entry && (
        <GlossaryOverlay
          open={open}
          anchorEl={active.el}
          card={entry.card}
          keyboardOpenRef={keyboardOpenRef}
          onClose={close}
          cancelClose={cancel}
          scheduleClose={scheduleClose}
          // Delegated clicks on sibling gloss spans SWITCH this card.
          switchSelector="[data-gloss]"
        />
      )}
    </span>
  );
}
