"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordLessonView, setLessonComplete } from "@/app/actions/progress";

/**
 * Records the content view on open and auto-marks it complete once the end
 * scrolls into view (the sentinel sits at the end of the body), so a learner
 * who reaches the bottom completes it without clicking. The manual complete
 * button stays available for explicit (re)marking. No-ops when already
 * complete. Works for any progress-countable content id (lesson or paper);
 * inline trackers inside a paper pass recordView={false} so opening a paper
 * doesn't stamp lastViewedAt for every embedded lesson at once.
 *
 * autoComplete={false} keeps the view stamp but disables the scroll-based
 * completion — used for lessons whose body is a bridged Verification
 * interactive, where completion should come from finishing the exercise
 * (or the explicit button), not from scrolling past a one-line body.
 */
export function LessonTracker({
  lessonId,
  completed,
  recordView = true,
  autoComplete = true,
  toastLabel = "Lesson complete",
}: {
  lessonId: string;
  completed: boolean;
  recordView?: boolean;
  autoComplete?: boolean;
  toastLabel?: string;
}) {
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);
  const done = useRef(completed);

  // Keep the guard in step with the server's view: after the manual button
  // (or another tab) completes this lesson and the layout re-renders with
  // completed=true, don't let the observer fire a second write + toast.
  useEffect(() => {
    done.current = completed;
  }, [completed]);

  useEffect(() => {
    if (recordView) void recordLessonView(lessonId);
  }, [lessonId, recordView]);

  useEffect(() => {
    if (!autoComplete || done.current) return;
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (done.current || !entries.some((e) => e.isIntersecting)) return;
        done.current = true;
        observer.disconnect();
        setLessonComplete(lessonId, true)
          .then(() => {
            toast.success(toastLabel);
            router.refresh();
          })
          .catch(() => {
            done.current = false;
          });
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoComplete, lessonId, router, toastLabel]);

  return <div ref={sentinel} aria-hidden className="h-px w-full" />;
}
