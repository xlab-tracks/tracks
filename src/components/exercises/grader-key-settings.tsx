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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  removeOpenRouterKey,
  saveOpenRouterKey,
  setGraderKeySelection,
} from "@/app/actions/api-keys";

export interface OpenRouterKeyStatusView {
  /** Mirrors OpenRouterKeyStatus in src/lib/grader/user-key.ts. */
  state: "none" | "active" | "needs-reentry";
  last4: string | null;
}

export interface GraderKeyOptionView {
  /** Mirrors ClassroomKeyOption in src/lib/grader/grading-key.ts. */
  classroomId: string;
  classroomName: string;
  last4: string;
  usable: boolean;
}

export interface GraderKeyViewClient {
  /** Mirrors GraderKeyView in src/lib/grader/grading-key.ts. */
  personal: OpenRouterKeyStatusView;
  classrooms: GraderKeyOptionView[];
  /** "server" | "user" | "classroom:<id>" — the effective selection. */
  selected: string;
}

// One lesson page renders a key card per gradeable exercise; a save/remove/
// reselect in any of them must update all of them, so the mutated bits live
// in a module-scope store every instance subscribes to. The store holds
// OVERRIDES, not the source of truth: mutations also router.refresh(), and
// once the server-rendered props reflect a mutation its override is dropped —
// so a later, fresher server view (key rotated in another tab, secret
// rotation flipping to needs-reentry) is never masked by a stale client win.
interface KeyOverrides {
  personal: OpenRouterKeyStatusView | null;
  selected: string | null;
}
const EMPTY_OVERRIDES: KeyOverrides = { personal: null, selected: null };
let sharedOverrides: KeyOverrides = EMPTY_OVERRIDES;
const listeners = new Set<() => void>();

function publishOverrides(next: Partial<KeyOverrides>): void {
  sharedOverrides = { ...sharedOverrides, ...next };
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
 * The grading-key controls under a gradeable exercise: a dropdown choosing
 * which key grading bills (site default / the learner's own / a classroom's)
 * plus add/replace/remove for the learner's own OpenRouter key. Only ever
 * holds a key transiently in local input state on its way to the server
 * action; the server returns nothing but states, names, and last4s.
 */
export function GraderKeySettings({ view }: { view: GraderKeyViewClient }) {
  const overrides = useSyncExternalStore(
    subscribe,
    () => sharedOverrides,
    () => EMPTY_OVERRIDES,
  );
  const status = overrides.personal ?? view.personal;
  const selected = overrides.selected ?? view.selected;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const errorId = useId();
  const router = useRouter();

  // Server props caught up with an override → drop it, server truth wins.
  useEffect(() => {
    if (sharedOverrides.personal && sameStatus(sharedOverrides.personal, view.personal)) {
      publishOverrides({ personal: null });
    }
    if (sharedOverrides.selected != null && sharedOverrides.selected === view.selected) {
      publishOverrides({ selected: null });
    }
  }, [view.personal, view.selected]);

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await saveOpenRouterKey(value);
      if (result.ok) {
        publishOverrides({ personal: { state: "active", last4: result.last4 } });
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
        // The effective selection may shift too (server-resolved); leave the
        // stale value in place until the refresh lands rather than guess.
        publishOverrides({ personal: { state: "none", last4: null } });
        router.refresh();
      } else {
        setError(result.error);
      }
    });

  const select = (next: string) =>
    startTransition(async () => {
      setError(null);
      publishOverrides({ selected: next });
      const result = await setGraderKeySelection(next);
      if (result.ok) {
        router.refresh();
      } else {
        publishOverrides({ selected: null });
        setError(result.error);
      }
    });

  const masked = status.last4 ? `····${status.last4}` : "";
  // A dropdown with a single possible source is noise — show it only once
  // there is a real choice (an own key or at least one classroom key).
  const hasChoice = status.state !== "none" || view.classrooms.length > 0;

  return (
    <div className="border-border mt-3 border-t pt-2 text-xs">
      {hasChoice && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground">Grading uses</p>
          <Select value={selected} onValueChange={select} disabled={pending}>
            <SelectTrigger size="sm" className="text-xs" aria-label="Grading key">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="server">Site default (free model)</SelectItem>
              {status.state !== "none" && (
                <SelectItem value="user">
                  Your key {masked && `(${masked})`}
                </SelectItem>
              )}
              {view.classrooms.map((c) => (
                <SelectItem
                  key={c.classroomId}
                  value={`classroom:${c.classroomId}`}
                >
                  {c.classroomName} (····{c.last4})
                  {!c.usable && " — unavailable"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {editing ? (
        <form
          className={`flex flex-wrap items-center gap-2${hasChoice ? " mt-2" : ""}`}
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
        <div
          className={`flex flex-wrap items-center justify-between gap-2${hasChoice ? " mt-1" : ""}`}
        >
          <p className="text-muted-foreground">
            Optional: grade with your own OpenRouter API key.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Add key
          </Button>
        </div>
      ) : (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          {status.state === "active" ? (
            <p className="text-muted-foreground">
              Your OpenRouter key <span className="font-mono">({masked})</span>.
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
