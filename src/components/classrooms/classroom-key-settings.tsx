"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  removeClassroomOpenRouterKey,
  saveClassroomOpenRouterKey,
} from "@/app/actions/api-keys";

export interface ClassroomKeyStatusView {
  /** Mirrors OpenRouterKeyStatus in src/lib/grader/user-key.ts. */
  state: "none" | "active" | "needs-reentry";
  last4: string | null;
}

/**
 * Instructor controls for the classroom's OpenRouter key: members can bill
 * their grading calls to it once one is stored. Only ever holds the key
 * transiently in local input state on its way to the server action; the
 * server returns nothing but the status state and last four characters.
 */
export function ClassroomKeySettings({
  classroomId,
  initialStatus,
}: {
  classroomId: string;
  initialStatus: ClassroomKeyStatusView;
}) {
  // Optimistic override; router.refresh() brings server truth after mutations.
  const [status, setStatus] = useState(initialStatus);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const errorId = useId();
  const router = useRouter();

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await saveClassroomOpenRouterKey(classroomId, value);
      if (result.ok) {
        setStatus({ state: "active", last4: result.last4 });
        setEditing(false);
        setValue("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });

  const remove = () =>
    startTransition(async () => {
      setError(null);
      const result = await removeClassroomOpenRouterKey(classroomId);
      if (result.ok) {
        setStatus({ state: "none", last4: null });
        router.refresh();
      } else {
        setError(result.error);
      }
    });

  const masked = status.last4 ? `····${status.last4}` : "";

  return (
    <div className="mt-3 text-sm">
      {editing ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="sk-or-…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-64"
            aria-label="Classroom OpenRouter API key"
            aria-invalid={error != null || undefined}
            aria-describedby={error != null ? errorId : undefined}
          />
          <Button size="sm" type="submit" disabled={pending || !value.trim()}>
            {pending ? "Verifying…" : "Save"}
          </Button>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setEditing(false);
              setValue("");
              setError(null);
            }}
          >
            Cancel
          </Button>
          <a
            href="https://openrouter.ai/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground text-xs underline"
          >
            Get a key
          </a>
        </form>
      ) : status.state === "none" ? (
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Add classroom key
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {status.state === "active" ? (
            <p className="text-muted-foreground">
              Classroom key <span className="font-mono">({masked})</span> is
              active.
            </p>
          ) : (
            <p className="text-destructive">
              The stored key <span className="font-mono">({masked})</span> can
              no longer be read — replace or remove it.
            </p>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setEditing(true)}
          >
            Replace
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={remove}>
            {pending ? "Removing…" : "Remove"}
          </Button>
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-destructive mt-2 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
