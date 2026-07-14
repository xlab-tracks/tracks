"use client";

import { useState, useTransition } from "react";
import { Check, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setLessonComplete } from "@/app/actions/progress";

export function LessonCompleteButton({
  lessonId,
  initialCompleted,
  toastLabel = "Lesson marked complete",
}: {
  lessonId: string;
  initialCompleted: boolean;
  toastLabel?: string;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();

  // Reflect server state after auto-completion (LessonTracker → router.refresh()):
  // adjust during render when the prop changes (React's documented alternative
  // to a state-syncing effect).
  const [prevInitial, setPrevInitial] = useState(initialCompleted);
  if (prevInitial !== initialCompleted) {
    setPrevInitial(initialCompleted);
    setCompleted(initialCompleted);
  }

  const toggle = () =>
    startTransition(async () => {
      const next = !completed;
      try {
        await setLessonComplete(lessonId, next);
        setCompleted(next);
        if (next) toast.success(toastLabel);
      } catch {
        toast.error("Couldn't update progress");
      }
    });

  return (
    <Button
      onClick={toggle}
      disabled={pending}
      variant={completed ? "secondary" : "default"}
      className="gap-2"
    >
      {completed ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Circle className="size-4" aria-hidden />
      )}
      {completed ? "Completed" : "Mark complete"}
    </Button>
  );
}
