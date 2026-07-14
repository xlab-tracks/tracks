"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setLessonComplete } from "@/app/actions/progress";

/**
 * Centralizes the bridged-completion pattern the old iframe host used: a `done`
 * guard seeded from the server's view, one `setLessonComplete` write on the
 * genuine finish event, a toast + `router.refresh()` so the sidebar checkmark
 * lights, and a rollback if the write fails. Returns a stable `complete()` the
 * widget calls at its finish; it no-ops for unbridged widgets, signed-out
 * learners, or an already-completed lesson.
 */
export function useVerificationCompletion(
  contentId: string,
  {
    bridged,
    canTrack,
    initialCompleted,
  }: { bridged: boolean; canTrack: boolean; initialCompleted: boolean },
): () => void {
  const router = useRouter();
  const done = useRef(initialCompleted);

  // Re-sync with the server's view after a router.refresh (or a completion
  // recorded elsewhere) so we never double-write.
  useEffect(() => {
    done.current = initialCompleted;
  }, [initialCompleted]);

  return useCallback(() => {
    if (!bridged || !canTrack || done.current) return;
    done.current = true;
    setLessonComplete(contentId, true)
      .then(() => {
        toast.success("Exercise complete");
        router.refresh();
      })
      .catch(() => {
        done.current = false;
      });
  }, [bridged, canTrack, contentId, router]);
}
