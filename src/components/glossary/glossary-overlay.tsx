"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { GlossaryCardContent, type GlossaryCardData } from "./glossary-card";

/**
 * Presentation layer for an OPEN glossary card, shared by the lesson
 * trigger and the paper delegation layer. On wide viewports the card
 * renders in the right margin — the same rail that surface's sidenotes
 * use (the outside gutter, or a paper's reserved inset rail) — slightly
 * raised above the term's line, with a dashed hairline tracing from the
 * word to the box. Without rail room it falls back to a popover anchored
 * at the term.
 *
 * The margin box and its connector portal to document.body with
 * document-coordinate absolute positioning: no positioned ancestor needed,
 * nothing moves on scroll. Placement re-derives on viewport resize (a
 * frame late, after PaperSidenotes' own deferred rebuild), on container
 * resize, and on hide/details toggles — the same triggers PaperSidenotes
 * watches; an anchor that collapses to a zero rect closes the card.
 *
 * Focus contract (both modes): hover/tap opens never move focus; a
 * keyboard open (or keyboard switch to another term) focuses the card so
 * Tab reaches its source link; Escape closes and refocuses the trigger.
 * `keyboardOpenRef` is consumed here on open/switch and cleared on close,
 * so a keyboard toggle-close can never leak focus-stealing into a later
 * hover open.
 */

// Per-surface rail geometry, matched to where that surface's sidenotes
// render: PaperSidenotes (28px gutter gap, notes ≤300px; inset rail =
// INSET_RESERVE 288 − gap) and the lesson footnote floats in globals.css
// (2.5rem gap, 15rem wide).
const RAILS = [
  { selector: ".paper-reader", gap: 28, width: 300 },
  { selector: ".lesson-body", gap: 40, width: 240 },
] as const;
const PAPER_INSET_RAIL = 260;
/** Below this much rail room, fall back to the anchored popover. */
const MIN_CARD_WIDTH = 200;
/** How far the box sits above the term's line ("slightly elevated"). */
const ELEVATION = 24;
/** Breathing room between the connector's ends and the word / the box. */
const LINE_INSET = 4;

interface Placement {
  /** "hidden": the anchor has no box (collapsed hide) — render nothing. */
  mode: "margin" | "popover" | "hidden";
  box?: { left: number; top: number; width: number };
  line?: { left: number; top: number; width: number; height: number; down: boolean };
}

function computePlacement(anchor: HTMLElement): Placement {
  const mRect = anchor.getBoundingClientRect();
  if (mRect.width === 0 && mRect.height === 0) return { mode: "hidden" };
  for (const rail of RAILS) {
    const container = anchor.closest(rail.selector);
    if (!container) continue;
    const cRect = container.getBoundingClientRect();
    const spare = Math.min(
      rail.width,
      document.documentElement.clientWidth - cRect.right - rail.gap * 2,
    );
    let left: number;
    let width: number;
    if (spare >= MIN_CARD_WIDTH) {
      // Outside gutter (large monitors) — where sidenotes float.
      left = cRect.right + rail.gap + window.scrollX;
      width = spare;
    } else if (container.classList.contains("paper-sidenotes-inset")) {
      // Laptop-width papers reserve an inset rail inside the column
      // (PaperSidenotes narrows the text); place the card on that rail.
      left = cRect.right - PAPER_INSET_RAIL + window.scrollX;
      width = PAPER_INSET_RAIL;
    } else {
      return { mode: "popover" };
    }
    // Clamp in DOCUMENT coordinates — a viewport-relative clamp would pin
    // the card under the sticky header and make placement scroll-dependent.
    const top = Math.max(8, mRect.top + window.scrollY - ELEVATION);
    // Hairline from just past the word to just shy of the box's upper-left.
    const x1 = mRect.right + window.scrollX + LINE_INSET;
    const y1 = mRect.top + mRect.height / 2 + window.scrollY;
    const x2 = left - LINE_INSET;
    const y2 = top + 14;
    return {
      mode: "margin",
      box: { left, top, width },
      line: {
        left: x1,
        top: Math.min(y1, y2),
        width: Math.max(x2 - x1, 1),
        height: Math.max(Math.abs(y2 - y1), 1),
        down: y2 > y1,
      },
    };
  }
  return { mode: "popover" };
}

export function GlossaryOverlay({
  open,
  anchorEl,
  card,
  keyboardOpenRef,
  onClose,
  cancelClose,
  scheduleClose,
  switchSelector,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  card: GlossaryCardData;
  /** Set by the trigger when the open came from Enter/Space; consumed here. */
  keyboardOpenRef: RefObject<boolean>;
  onClose: () => void;
  /** Hover-timer hooks from the owning trigger (mouse-filtered here). */
  cancelClose: () => void;
  scheduleClose: () => void;
  /**
   * Selector for sibling triggers whose own click handlers SWITCH this
   * card (the paper layer's "[data-gloss]") — exempted from
   * outside-dismiss so the switch doesn't flicker through a close. Lesson
   * triggers are independent instances and pass nothing: a click on any
   * other trigger dismisses this card normally.
   */
  switchSelector?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Placement derives from live layout at render time (cheap: a few rect
  // reads, only while open); ticks force a re-derive on viewport resize
  // (a frame late, after PaperSidenotes' deferred rebuild), container
  // resize (image loads, sidenote-rail rebuilds), and hide/details
  // toggles (capture — "toggle" doesn't bubble).
  const [, bumpPlacement] = useReducer((tick: number) => tick + 1, 0);
  useEffect(() => {
    if (!open || !anchorEl) return;
    let raf = 0;
    const bump = () => bumpPlacement();
    const bumpAfterFrame = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(bump);
    };
    window.addEventListener("resize", bumpAfterFrame);
    const container = anchorEl.closest(".paper-reader, .lesson-body");
    container?.addEventListener("change", bump, true);
    container?.addEventListener("toggle", bump, true);
    let observer: ResizeObserver | undefined;
    if (container) {
      observer = new ResizeObserver(bumpAfterFrame);
      observer.observe(container);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", bumpAfterFrame);
      container?.removeEventListener("change", bump, true);
      container?.removeEventListener("toggle", bump, true);
      observer?.disconnect();
    };
  }, [open, anchorEl]);
  const placement = open && anchorEl ? computePlacement(anchorEl) : null;

  const margin = open && placement?.mode === "margin";
  const hidden = open && placement?.mode === "hidden";

  // An anchor that lost its box (its hide collapsed) takes the card down.
  useEffect(() => {
    if (hidden) onClose();
  }, [hidden, onClose]);

  // Keyboard focus, both modes: consume the flag on open AND on anchor
  // switches (a keyboard Enter on another paper span keeps `open` true),
  // and clear it on close so a keyboard toggle-close can't arm a later
  // hover open into stealing focus.
  useEffect(() => {
    if (!open) {
      keyboardOpenRef.current = false;
      return;
    }
    if (!keyboardOpenRef.current) return;
    keyboardOpenRef.current = false;
    (cardRef.current ?? popoverRef.current)?.focus();
  }, [open, margin, anchorEl, keyboardOpenRef]);

  // Margin-mode dismissal: Escape (handing focus back to the trigger) and
  // pointer-down outside the card. The trigger itself and — where the
  // owner says so — sibling switch-triggers are exempt: their own click
  // handlers toggle/switch the card.
  useEffect(() => {
    if (!margin || !anchorEl) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      anchorEl.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (cardRef.current?.contains(target)) return;
      if (anchorEl.contains(target)) return;
      if (switchSelector && target.closest(switchSelector)) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [margin, anchorEl, onClose, switchSelector]);

  // Travel corridor: reaching the margin card means crossing the text
  // column, which can take longer than the close grace. While the pointer
  // moves inside the band spanned by the word and the box, keep restarting
  // the grace; once it rests or leaves the band, the normal timer runs
  // out. Trigger and card themselves are skipped (their enter/leave
  // handlers own the timers), as are switch-triggers en route (their
  // hover-switch logic owns them).
  useEffect(() => {
    if (!margin || !anchorEl) return;
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = cardRef.current?.getBoundingClientRect();
      if (!box) return;
      const target = event.target;
      if (target instanceof Element) {
        if (anchorEl.contains(target) || cardRef.current?.contains(target)) return;
        if (switchSelector && target.closest(switchSelector)) return;
      }
      const word = anchorEl.getBoundingClientRect();
      const withinBand =
        event.clientX >= Math.min(word.left, box.left) &&
        event.clientX <= box.right &&
        event.clientY >= Math.min(word.top, box.top) - 16 &&
        event.clientY <= Math.max(word.bottom, box.bottom) + 16;
      if (withinBand) scheduleClose();
    };
    document.addEventListener("pointermove", onPointerMove);
    return () => document.removeEventListener("pointermove", onPointerMove);
  }, [margin, anchorEl, scheduleClose, switchSelector]);

  const mouseOnly = useCallback(
    (handler: () => void) =>
      (event: React.PointerEvent<HTMLElement>) => {
        if (event.pointerType === "mouse") handler();
      },
    [],
  );
  const virtualRef = useMemo(
    () => (anchorEl ? { current: anchorEl } : undefined),
    [anchorEl],
  );

  /** Focus-out guard shared by both modes: closing on focus moves except
   * into the trigger (its click is about to toggle — closing first would
   * make the toggle REOPEN), into a switch-trigger, or on window
   * deactivation (relatedTarget null while focus stays inside). */
  const shouldCloseOnFocusOut = (
    container: HTMLElement,
    next: EventTarget | null,
  ): boolean => {
    if (next instanceof Node) {
      if (container.contains(next)) return false;
      if (anchorEl?.contains(next)) return false;
      if (
        switchSelector &&
        next instanceof Element &&
        next.closest(switchSelector)
      ) {
        return false;
      }
      return true;
    }
    return !container.contains(document.activeElement);
  };

  if (!open || !placement || !anchorEl || placement.mode === "hidden") {
    return null;
  }

  if (placement.mode === "margin" && placement.box && placement.line) {
    const { box, line } = placement;
    return createPortal(
      <>
        <svg
          aria-hidden
          className="pointer-events-none absolute z-40"
          style={{ left: line.left, top: line.top, width: line.width, height: line.height }}
          width={line.width}
          height={line.height}
        >
          <line
            x1={0}
            y1={line.down ? 0 : line.height}
            x2={line.width}
            y2={line.down ? line.height : 0}
            className="stroke-muted-foreground/50"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        </svg>
        <div
          ref={cardRef}
          role="dialog"
          aria-label={card.term}
          tabIndex={-1}
          className="bg-popover text-popover-foreground ring-foreground/10 animate-in fade-in-0 absolute z-50 rounded-lg p-2.5 text-sm shadow-md ring-1 outline-hidden duration-150"
          style={{ left: box.left, top: box.top, width: box.width }}
          onPointerEnter={mouseOnly(cancelClose)}
          onPointerLeave={mouseOnly(scheduleClose)}
          onBlur={(event) => {
            // Only fires once focus has entered (keyboard opens / clicks
            // inside): tabbing past the card's last link closes it.
            if (shouldCloseOnFocusOut(event.currentTarget, event.relatedTarget)) {
              onClose();
            }
          }}
        >
          <GlossaryCardContent {...card} />
        </div>
      </>,
      document.body,
    );
  }

  return (
    <Popover
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        ref={popoverRef}
        tabIndex={-1}
        className="w-80 max-w-[calc(100vw-2rem)]"
        collisionPadding={12}
        aria-label={card.term}
        // Focus is owned by the keyboard effect above (it also covers
        // anchor SWITCHES, which never remount this content) — radix's
        // own open autofocus stays off.
        onOpenAutoFocus={(event) => event.preventDefault()}
        // The anchor is virtual, so radix can't restore focus on close —
        // hand it back to the trigger on Escape ourselves, and never let
        // radix's default refocus fire on hover-timer closes.
        onEscapeKeyDown={() => anchorEl.focus()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => {
          // The trigger's own click toggles, and clicking a sibling
          // switch-trigger re-anchors — without this the outside-dismiss
          // closes first and the click reopens.
          const target = event.target as HTMLElement | null;
          if (!target) return;
          if (
            (switchSelector && target.closest?.(switchSelector)) ||
            anchorEl.contains(target)
          ) {
            event.preventDefault();
          }
        }}
        onFocusOutside={(event) => {
          // Same exemptions for focus-driven dismissal: clicking the
          // trigger while focus is inside the card must toggle, not
          // close-then-reopen.
          const target = event.target as HTMLElement | null;
          if (!target) return;
          if (
            (switchSelector && target.closest?.(switchSelector)) ||
            anchorEl.contains(target)
          ) {
            event.preventDefault();
          }
        }}
        onPointerEnter={mouseOnly(cancelClose)}
        onPointerLeave={mouseOnly(scheduleClose)}
      >
        <GlossaryCardContent {...card} />
      </PopoverContent>
    </Popover>
  );
}
