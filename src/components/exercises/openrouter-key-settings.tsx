"use client";

import {
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  removeOpenRouterKey,
  saveOpenRouterKey,
} from "@/app/actions/api-keys";

export interface OpenRouterKeyStatusView {
  /** Mirrors OpenRouterKeyStatus in src/lib/grader/user-key.ts. */
  state: "none" | "active" | "needs-reentry";
  last4: string | null;
}

// One lesson page renders a key card per gradeable exercise; a save/remove in
// any of them must update all of them, so the mutated status lives in a
// module-scope store every instance subscribes to. The store is an OVERRIDE,
// not the source of truth: mutations also router.refresh(), and once the
// server-rendered props reflect the mutation the override is dropped — so a
// later, fresher server status (key rotated in another tab, secret rotation
// flipping to needs-reentry) is never masked by a stale client win.
let sharedStatus: OpenRouterKeyStatusView | null = null;
const listeners = new Set<() => void>();

function publishStatus(next: OpenRouterKeyStatusView | null): void {
  sharedStatus = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function sameStatus(
  a: OpenRouterKeyStatusView,
  b: OpenRouterKeyStatusView,
): boolean {
  return a.state === b.state && a.last4 === b.last4;
}

/**
 * Lets a signed-in learner store their own OpenRouter API key for the grader
 * (or replace/remove a stored one). Only ever holds the key transiently in
 * local input state on its way to the server action; the server returns and
 * displays nothing but the status state and last four characters.
 */
export function OpenRouterKeySettings({
  initialStatus,
}: {
  initialStatus: OpenRouterKeyStatusView;
}) {
  const mutated = useSyncExternalStore(
    subscribe,
    () => sharedStatus,
    () => null,
  );
  const status = mutated ?? initialStatus;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const errorId = useId();
  const router = useRouter();

  // Server props caught up with the override → drop it, server truth wins.
  useEffect(() => {
    if (sharedStatus && sameStatus(sharedStatus, initialStatus)) {
      publishStatus(null);
    }
  }, [initialStatus]);

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await saveOpenRouterKey(value);
      if (result.ok) {
        publishStatus({ state: "active", last4: result.last4 });
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
      const result = await removeOpenRouterKey();
      if (result.ok) {
        publishStatus({ state: "none", last4: null });
        router.refresh();
      } else {
        setError(result.error);
      }
    });

  const masked = status.last4 ? `····${status.last4}` : "";

  return (
    <div className="border-border mt-3 border-t pt-2 text-xs">
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
            className="h-7 w-56 text-xs"
            aria-label="OpenRouter API key"
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
            className="text-muted-foreground underline"
          >
            Get a key
          </a>
        </form>
      ) : status.state === "none" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground">
            Optional: grade with your own OpenRouter API key.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Add key
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {status.state === "active" ? (
            <p className="text-muted-foreground">
              Grading uses your OpenRouter key{" "}
              <span className="font-mono">({masked})</span>.
            </p>
          ) : (
            <p className="text-destructive">
              Your stored key <span className="font-mono">({masked})</span> can
              no longer be read — replace or remove it.
            </p>
          )}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setEditing(true)}
            >
              Replace
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={remove}
            >
              {pending ? "Removing…" : "Remove"}
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
