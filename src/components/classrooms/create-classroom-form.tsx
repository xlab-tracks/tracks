"use client";

import { useActionState } from "react";
import {
  createClassroom,
  type ClassroomActionState,
} from "@/app/actions/classrooms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CreateClassroomForm({
  trackOptions,
}: {
  trackOptions: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState<ClassroomActionState, FormData>(
    createClassroom,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Classroom name</Label>
        <Input id="name" name="name" placeholder="e.g. Fall 2026 cohort" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="trackId">Track (optional)</Label>
        <select
          id="trackId"
          name="trackId"
          className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          defaultValue=""
        >
          <option value="">All tracks</option>
          {trackOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create classroom"}
      </Button>
    </form>
  );
}
