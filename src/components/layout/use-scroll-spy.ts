"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the "current" anchor while scrolling a paper: the LAST anchor whose
 * top sits at or above the viewport top offset. A position scan (vs
 * IntersectionObserver) gives a total order with exactly one answer — short
 * sections, fast scrolling, and sections taller than the viewport all break
 * visibility-based spies. Elements are re-resolved on every recompute,
 * scoped to the paper reader container and excluding collapsible
 * <ArxivPaper> cards nested inside inline lessons — a card's headings and
 * landmark ids would otherwise shadow the reader's own anchors. State starts
 * null on both server and client (no hash peeking — that would mismatch the
 * SSR HTML and throw on malformed escapes); after a hash navigation the
 * browser has already scrolled, so the first scan lands on the right anchor.
 */
export function useScrollSpy(anchorIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const key = anchorIds.join("|");

  useEffect(() => {
    // No anchors → nothing to spy on (the caller doesn't render in that case).
    if (anchorIds.length === 0) return;

    const resolve = (container: Element, id: string): Element | null => {
      for (const el of container.querySelectorAll(`[id="${CSS.escape(id)}"]`)) {
        if (!el.closest(".ax-paper")) return el;
      }
      return null;
    };

    const recompute = () => {
      const container = document.querySelector(".paper-reader");
      // Not mounted yet (or not a paper page): keep the previous value and
      // let the next scroll/frame take over once content exists.
      if (!container) return;
      // Slightly past the anchors' scroll-margin-top (5rem / 7rem), so a
      // just-clicked anchor registers as current.
      const offset = window.matchMedia("(max-width: 1023px)").matches ? 128 : 96;
      let current: string | null = null;
      for (const id of anchorIds) {
        const el = resolve(container, id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= offset) current = id;
        else break; // anchors are in document order; the rest are lower still
      }
      setActiveId(current);
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };

    // First scan next frame (post-hydration, after any hash jump), then on
    // every scroll/resize; images/KaTeX settling re-trigger via scroll.
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return activeId;
}
