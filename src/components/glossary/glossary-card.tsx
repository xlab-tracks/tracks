"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";

/**
 * Shared pieces of the glossary card: the card content, the hover-intent
 * timers, and the trigger affordance class. The card's PLACEMENT (margin
 * box with a connector line, or an anchored popover fallback) lives in
 * glossary-overlay.tsx; the lesson trigger in term-trigger.tsx; the paper
 * delegation layer in components/papers/paper-glossary.tsx. Card copy is
 * trusted authored content passed in as already-rendered nodes (definitions
 * render server-side via MathText) — these components never receive HTML
 * strings.
 */

export const GLOSS_OPEN_DELAY = 300;
// The close grace also covers the pointer's travel from the term across the
// text column into the margin card, so it is deliberately longer than a
// same-spot popover would need.
export const GLOSS_CLOSE_DELAY = 400;

export interface GlossaryCardData {
  term: string;
  definition: ReactNode;
  /** Display names of related entries (resolved seeAlso ids). */
  related: string[];
  source?: { label: string; url?: string };
}

export function GlossaryCardContent({
  term,
  definition,
  related,
  source,
}: GlossaryCardData) {
  return (
    <div className="px-1 py-0.5 text-sm">
      <p className="font-medium">{term}</p>
      <p className="text-muted-foreground mt-1 leading-relaxed text-pretty">
        {definition}
      </p>
      {related.length > 0 && (
        <p className="text-muted-foreground/80 mt-2 text-xs">
          Related: {related.join(" · ")}
        </p>
      )}
      {source && (
        <p className="border-border text-muted-foreground/80 mt-2 border-t pt-1.5 text-xs">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2 transition-colors"
            >
              {source.label}
            </a>
          ) : (
            source.label
          )}
        </p>
      )}
    </div>
  );
}

/**
 * Hover-intent timers for the glossary card: `scheduleOpen` after the open
 * delay (cancelling any pending close), `scheduleClose` after the grace
 * (cancelling any pending open), `cancel` clears both. Timers clear on
 * unmount.
 */
export function useGlossHoverTimers(onOpen: () => void, onClose: () => void) {
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const clear = (timer: MutableRefObject<number | null>) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const cancel = useCallback(() => {
    clear(openTimer);
    clear(closeTimer);
  }, []);
  const scheduleOpen = useCallback(() => {
    clear(closeTimer);
    clear(openTimer);
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      onOpen();
    }, GLOSS_OPEN_DELAY);
  }, [onOpen]);
  const scheduleClose = useCallback(() => {
    clear(openTimer);
    clear(closeTimer);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, GLOSS_CLOSE_DELAY);
  }, [onClose]);

  useEffect(() => cancel, [cancel]);
  return { scheduleOpen, scheduleClose, cancel };
}

/** Shared trigger styling — the dotted-underline "this has a definition" cue. */
export const GLOSS_TRIGGER_CLASS =
  "decoration-muted-foreground/60 cursor-help underline decoration-dotted underline-offset-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1";
