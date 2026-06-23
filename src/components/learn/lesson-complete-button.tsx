"use client";

import { useState, useTransition } from "react";
import { Check, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setLessonComplete } from "@/app/actions/progress";

export function LessonCompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      const next = !completed;
      try {
        await setLessonComplete(lessonId, next);
        setCompleted(next);
        if (next) toast.success("Lesson marked complete");
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
