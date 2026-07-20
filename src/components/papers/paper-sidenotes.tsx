"use client";

import { useEffect, useRef } from "react";
import "./paper-sidenotes.css";

/**
 * Margin sidenotes: renders each footnote of the converted post in the
 * right gutter, aligned with its inline marker — the presentation LessWrong
 * gives its footnotes on desktop. Purely a presentational enhancement over
 * the artifact's footnotes section, which stays in the document as the
 * canonical, linkable, sentence-addressable copy (and the only copy on
 * narrow viewports or without JS).
 *
 * The component never receives artifact HTML as props — it clones the
 * already-rendered footnote nodes out of the DOM (cloneNode, not
 * dangerouslySetInnerHTML), so the server component's "html never crosses
 * into client components" invariant holds. Clones are aria-hidden and
 * stripped of ids so the canonical section keeps its anchors unique.
 *
 * Layout: the layer is absolutely positioned to the right of the reader
 * column (the .paper-reader div is position:relative). Note tops track
 * their marker's offset, pushed down as needed so notes never overlap;
 * everything recomputes on container resize (which also covers hide-marker
 * toggles and image loads changing the page height). If the viewport
 * leaves less than MIN_WIDTH of gutter, the layer hides entirely — as it
 * does when the paper has no renderable note (no footnotes, or every marker
 * inside a collapsed hide), so an empty rail never narrows the text.
 * Hidden↔visible flips (the preference toggle, mostly) animate: the layer
 * cross-fades and the inset rail's padding transitions (both CSS, armed one
 * frame after mount so pages load settled). Outside↔inset geometry flips
 * reposition instantly — animating them would paint notes over text the
 * reflow hasn't vacated yet.
 */

const MIN_WIDTH = 176;
const MAX_WIDTH = 300;
const GUTTER_GAP = 28;
const NOTE_GAP = 12;
/** Inset mode: the rail reserved inside the reading column (18rem). */
const INSET_RESERVE = 288;
/** Never squeeze the reading column below this to make room for the rail. */
const MIN_TEXT_WIDTH = 600;

/** User preference — sidenotes are on unless explicitly turned off. */
export const SIDENOTES_PREF_KEY = "tracks:sidenotes";
/** Fired (on window) when the preference changes, by SidenotesToggle. */
export const SIDENOTES_EVENT = "tracks:sidenotes-change";

export function sidenotesEnabled(): boolean {
  try {
    return window.localStorage.getItem(SIDENOTES_PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function PaperSidenotes({ prefix }: { prefix: string }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const container = layer?.parentElement; // the .paper-reader div
    if (!layer || !container) return;

    let raf = 0;
    let prevMode: "hidden" | "outside" | "inset" | null = null;
    // Arms the transitions (CSS: .paper-sidenotes-ready) one frame after the
    // current layout has painted — on mount so a page loads directly in its
    // settled state, and again after an instant geometry flip.
    let armRaf1 = 0;
    let armRaf2 = 0;
    const armTransitions = () => {
      cancelAnimationFrame(armRaf1);
      cancelAnimationFrame(armRaf2);
      armRaf1 = requestAnimationFrame(() => {
        armRaf2 = requestAnimationFrame(() =>
          container.classList.add("paper-sidenotes-ready"),
        );
      });
    };
    const rebuild = () => {
      // Collect the notes that would render BEFORE deciding placement, so a
      // paper with no renderable footnote (none at all, or every marker
      // inside a collapsed hide) reserves no rail — the reading column keeps
      // its full measure. Markers are found by their note href — uniform
      // across sources (the arXiv converter puts the marker id on the
      // <sup>, the post converters on the <a>). Only the first reference to
      // a note gets a sidenote.
      const markers = container.querySelectorAll<HTMLElement>(
        `sup.${prefix}-fnref a[href^="#${prefix}-fn-"]`,
      );
      const seen = new Set<string>();
      const entries: { marker: HTMLElement; note: HTMLElement; number: string }[] =
        [];
      for (const marker of markers) {
        const number =
          marker.getAttribute("href")?.slice(`#${prefix}-fn-`.length) ?? "";
        if (!number || seen.has(number)) continue;
        const note = container.querySelector<HTMLElement>(
          `li[id="${CSS.escape(`${prefix}-fn-${number}`)}"]`,
        );
        if (!note) continue;
        seen.add(number);
        const rect = marker.getBoundingClientRect();
        // Markers inside collapsed hide-markers have no box — skip them.
        if (rect.width === 0 && rect.height === 0) continue;
        entries.push({ marker, note, number });
      }

      // Placement: spare window gutter OUTSIDE the reading column when there
      // is one (large monitors); otherwise reserve a rail INSIDE the column
      // (typical laptop widths — the text narrows to a LessWrong-like
      // measure); otherwise hide, leaving the bottom footnotes section.
      // The user preference (SidenotesToggle) short-circuits everything.
      const outside = Math.min(
        MAX_WIDTH,
        window.innerWidth - container.getBoundingClientRect().right - GUTTER_GAP * 2,
      );
      const mode =
        !sidenotesEnabled() || entries.length === 0
          ? "hidden"
          : outside >= MIN_WIDTH
            ? "outside"
            : container.clientWidth - INSET_RESERVE >= MIN_TEXT_WIDTH
              ? "inset"
              : "hidden";

      // Outside↔inset flips (a resize/zoom across the boundary) move the
      // rail and every note at once — animating the padding would paint
      // notes over text the reflow hasn't vacated yet, so those flips apply
      // instantly; only hidden↔visible changes animate.
      if (
        prevMode !== null &&
        prevMode !== "hidden" &&
        mode !== "hidden" &&
        prevMode !== mode
      ) {
        container.classList.remove("paper-sidenotes-ready");
        armTransitions();
      }
      prevMode = mode;

      // Toggling the inset class reflows the text, so it happens before any
      // marker rect is read for placement — when the padding is animating,
      // the per-frame ResizeObserver rebuilds below keep the notes tracking
      // until it settles. (Idempotent — no observer feedback loop.)
      container.classList.toggle("paper-sidenotes-inset", mode === "inset");
      if (mode === "hidden") {
        // Keep the stale notes in place: the layer fades out over them (CSS
        // [data-hidden]) and the next visible rebuild replaces them anyway.
        // A stale outside placement can outgrow a narrowing window while it
        // fades — clamp it so the document never gains a scrollbar.
        if (layer.style.right === "auto") {
          // clientWidth, not innerWidth: a classic scrollbar's ~15px would
          // otherwise keep the clamped edge just past the usable viewport.
          const spare =
            document.documentElement.clientWidth -
            container.getBoundingClientRect().right -
            GUTTER_GAP;
          if ((parseFloat(layer.style.width) || 0) > spare) {
            layer.style.width = `${Math.max(0, spare)}px`;
          }
        }
        layer.setAttribute("data-hidden", "");
        return;
      }
      layer.removeAttribute("data-hidden");
      layer.replaceChildren();
      if (mode === "outside") {
        layer.style.width = `${outside}px`;
        layer.style.left = `calc(100% + ${GUTTER_GAP}px)`;
        layer.style.right = "auto";
      } else {
        layer.style.width = `${INSET_RESERVE - GUTTER_GAP}px`;
        layer.style.left = "auto";
        layer.style.right = "0";
      }
      const containerRect = container.getBoundingClientRect();

      let cursor = Number.NEGATIVE_INFINITY;
      for (const { marker, note, number } of entries) {
        // Re-read the rect: the inset toggle above may have reflowed the text.
        const rect = marker.getBoundingClientRect();

        const item = document.createElement("aside");
        item.className = "paper-sidenote";
        const label = document.createElement("span");
        label.className = "paper-sidenote-num";
        label.textContent = number;
        item.appendChild(label);

        const body = note.cloneNode(true) as HTMLElement;
        body.removeAttribute("id");
        for (const el of body.querySelectorAll("[id]")) {
          el.removeAttribute("id");
        }
        for (const backlink of body.querySelectorAll(`.${prefix}-backlink`)) {
          backlink.remove();
        }
        // Edit-UI hide markup is styled by .arxiv-paper-scoped CSS that
        // doesn't reach the layer — a clone would show "hidden" text in
        // full. Collapse it to a plain ··· marker; the canonical footnote
        // keeps the working toggle.
        for (const hidden of body.querySelectorAll(
          "details.ax-hidden, .ax-hidden-inline",
        )) {
          const pill = document.createElement("span");
          pill.className = "paper-sidenote-hidden";
          pill.textContent = "···";
          hidden.replaceWith(pill);
        }
        // Glossary triggers must not clone as live triggers: the rail
        // rebuilds on resize/toggle, which would detach an open card's
        // virtual anchor (and the rail has no .arxiv-paper styling, so the
        // clone shows no affordance). The canonical footnote keeps the
        // working trigger; the clone keeps only the text.
        for (const gloss of body.querySelectorAll("[data-gloss]")) {
          for (const attr of [
            "data-gloss",
            "role",
            "tabindex",
            "aria-haspopup",
            "aria-expanded",
          ]) {
            gloss.removeAttribute(attr);
          }
          gloss.classList.remove("ax-gloss");
        }
        // The layer is aria-hidden presentation: nothing in a clone may be
        // keyboard-focusable (links stay mouse-clickable).
        for (const focusable of body.querySelectorAll(
          "a, button, input, select, textarea, summary, [tabindex]",
        )) {
          focusable.setAttribute("tabindex", "-1");
        }
        const content = document.createElement("div");
        content.className = "paper-sidenote-body";
        content.append(...Array.from(body.childNodes));
        item.appendChild(content);
        layer.appendChild(item);
        // A cloned image that hasn't loaded yet measures short, and the
        // observer watches only the container — not the absolute layer — so
        // re-measure when the clone's bytes arrive.
        for (const img of content.querySelectorAll("img")) {
          if (!img.complete) {
            img.addEventListener("load", schedule, { once: true });
          }
        }

        const top = Math.max(rect.top - containerRect.top, cursor + NOTE_GAP);
        item.style.top = `${top}px`;
        cursor = top + item.offsetHeight;
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(rebuild);
    };
    schedule();
    armTransitions();
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    window.addEventListener("resize", schedule);
    // Hide-edit checkboxes ("change") and details/spoiler toggles ("toggle",
    // non-bubbling — capture) move markers without necessarily changing the
    // container's height, which is all the ResizeObserver sees.
    container.addEventListener("change", schedule, true);
    container.addEventListener("toggle", schedule, true);
    // Preference changes: same-tab via SidenotesToggle, cross-tab via storage.
    window.addEventListener(SIDENOTES_EVENT, schedule);
    window.addEventListener("storage", schedule);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(armRaf1);
      cancelAnimationFrame(armRaf2);
      container.classList.remove("paper-sidenotes-inset", "paper-sidenotes-ready");
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      container.removeEventListener("change", schedule, true);
      container.removeEventListener("toggle", schedule, true);
      window.removeEventListener(SIDENOTES_EVENT, schedule);
      window.removeEventListener("storage", schedule);
    };
  }, [prefix]);

  // The clones are presentation-only duplicates of the footnotes section —
  // hidden from assistive tech, which reads the canonical section instead.
  return <div ref={layerRef} className="paper-sidenote-layer" aria-hidden />;
}
