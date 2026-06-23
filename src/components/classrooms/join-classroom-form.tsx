"use client";

import { useActionState } from "react";
import {
  joinClassroom,
  type ClassroomActionState,
} from "@/app/actions/classrooms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function JoinClassroomForm() {
  const [state, action, pending] = useActionState<ClassroomActionState, FormData>(
    joinClassroom,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="code">Join code</Label>
        <Input
          id="code"
          name="code"
          placeholder="ABC123"
          autoCapitalize="characters"
          className="tracking-widest uppercase"
          required
        />
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Joining…" : "Join classroom"}
      </Button>
    </form>
  );
}
