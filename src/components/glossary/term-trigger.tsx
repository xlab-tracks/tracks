"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  GLOSS_TRIGGER_CLASS,
  useGlossHoverTimers,
  type GlossaryCardData,
} from "./glossary-card";
import { GlossaryOverlay } from "./glossary-overlay";

/**
 * Inline glossary trigger for React trees (lesson MDX prose). Paper HTML
 * uses PaperGlossary's event delegation instead — same overlay, same
 * timings.
 *
 * The trigger is a `span[role=button]`, not a native button: an
 * inline-block button can't line-wrap mid-phrase and Safari makes its text
 * unselectable — wrong for words inside prose. Do not place a <Term>
 * inside a link (nested interactive).
 *
 * Hover-intent (mouse) opens after a short delay; click/tap and
 * Enter/Space toggle. Hover/tap opens never move focus; a keyboard open
 * focuses the card (see GlossaryOverlay), and Escape hands focus back
 * here.
 */
export function GlossaryTermTrigger({
  card,
  children,
}: {
  card: GlossaryCardData;
  children: ReactNode;
}) {
  // Callback-ref state (not a ref read during render): the overlay needs
  // the span element as a prop.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const keyboardOpenRef = useRef(false);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const timers = useGlossHoverTimers(
    useCallback(() => setOpen(true), []),
    close,
  );

  const toggle = () => {
    timers.cancel();
    setOpen((prev) => !prev);
  };
  const mouseOnly =
    (handler: () => void) => (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") handler();
    };

  return (
    <>
      <span
        ref={setAnchorEl}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={GLOSS_TRIGGER_CLASS}
        onClick={toggle}
        onPointerDown={() => {
          keyboardOpenRef.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault(); // Space must not scroll
          keyboardOpenRef.current = true;
          toggle();
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse") return;
          keyboardOpenRef.current = false; // hover opens never move focus
          timers.scheduleOpen();
        }}
        onPointerLeave={mouseOnly(timers.scheduleClose)}
      >
        {children}
      </span>
      <GlossaryOverlay
        open={open}
        anchorEl={anchorEl}
        card={card}
        keyboardOpenRef={keyboardOpenRef}
        onClose={close}
        cancelClose={timers.cancel}
        scheduleClose={timers.scheduleClose}
      />
    </>
  );
}
