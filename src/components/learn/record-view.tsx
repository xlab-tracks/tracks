"use client";

import { useEffect } from "react";
import { recordLessonView } from "@/app/actions/progress";

// Fire-and-forget: stamps last-viewed time when a lesson mounts.
export function RecordView({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    void recordLessonView(lessonId);
  }, [lessonId]);
  return null;
}
