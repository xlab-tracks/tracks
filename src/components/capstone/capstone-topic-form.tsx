"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CapstoneTopicForm({
  initialTopic,
  action,
}: {
  initialTopic: string;
  action: (topic: string) => Promise<void>;
}) {
  const [topic, setTopic] = useState(initialTopic);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      try {
        await action(topic);
        toast.success("Capstone topic saved");
      } catch {
        toast.error("Couldn't save topic");
      }
    });

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Your capstone topic…"
      />
      <Button onClick={save} disabled={pending || !topic.trim()} className="shrink-0">
        {initialTopic ? "Update topic" : "Set topic"}
      </Button>
    </div>
  );
}
