"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordLessonView, setLessonComplete } from "@/app/actions/progress";

/**
 * Records the lesson view on open and auto-marks it complete once the end of the
 * lesson scrolls into view (the sentinel sits at the end of the body), so a
 * learner who reaches the bottom completes it without clicking. The manual
 * complete button stays available for explicit (re)marking. No-ops when the
 * lesson is already complete.
 */
export function LessonTracker({
  lessonId,
  completed,
}: {
  lessonId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);
  const done = useRef(completed);

  useEffect(() => {
    void recordLessonView(lessonId);
  }, [lessonId]);

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
            toast.success("Lesson complete");
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
  }, [lessonId, router]);

  return <div ref={sentinel} aria-hidden className="h-px w-full" />;
}
