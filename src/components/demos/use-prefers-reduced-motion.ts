"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/**
 * The user's reduced-motion preference as external state, or null while it
 * is unknown (server render + hydration frame — demos SSR through DemoById,
 * so there is no window to read there). Auto-playing demos choose their
 * INITIAL step/playing state from this instead of patching state after
 * mount, which is both the react-hooks/set-state-in-effect fix and a
 * no-flash render for reduced-motion users: React re-renders synchronously
 * post-hydration when the client snapshot replaces the null.
 */
export function usePrefersReducedMotion(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => null,
  );
}
