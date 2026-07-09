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
 */
export function LessonTracker({
  lessonId,
  completed,
  recordView = true,
  toastLabel = "Lesson complete",
}: {
  lessonId: string;
  completed: boolean;
  recordView?: boolean;
  toastLabel?: string;
}) {
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);
  const done = useRef(completed);

  useEffect(() => {
    if (recordView) void recordLessonView(lessonId);
  }, [lessonId, recordView]);

  useEffect(() => {
    if (done.current) return;
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
  }, [lessonId, router, toastLabel]);

  return <div ref={sentinel} aria-hidden className="h-px w-full" />;
}
