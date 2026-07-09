"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RubricCriterion, WritingSection } from "@/lib/content/types";

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export type WritingValues = Record<string, string>;

export interface WritingEditorProps {
  sections: WritingSection[];
  rubric?: RubricCriterion[];
  minWords?: number;
  maxWords?: number;
  initialValues?: WritingValues;
  submitted?: boolean;
  submitLabel?: string;
  /** When provided, the editor autosaves a debounced draft on change. */
  onSaveDraft?: (values: WritingValues) => Promise<void> | void;
  /** When provided, renders a submit button wired to this handler. */
  onSubmit?: (values: WritingValues) => Promise<void> | void;
}

export function WritingEditor({
  sections,
  rubric,
  minWords,
  maxWords,
  initialValues,
  submitted = false,
  submitLabel = "Submit",
  onSaveDraft,
  onSubmit,
}: WritingEditorProps) {
  const [values, setValues] = useState<WritingValues>(() => initialValues ?? {});
  const [isSubmitted, setIsSubmitted] = useState(submitted);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [pending, startTransition] = useTransition();
  const skipFirstSave = useRef(true);
  // Keep the latest save handler in a ref so a changed bound-action identity
  // doesn't re-trigger the debounced autosave.
  const saveDraftRef = useRef(onSaveDraft);
  saveDraftRef.current = onSaveDraft;

  const totalWords = useMemo(
    () => sections.reduce((sum, s) => sum + countWords(values[s.id] ?? ""), 0),
    [values, sections],
  );

  useEffect(() => {
    if (!saveDraftRef.current || isSubmitted) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setSaveState("saving");
    const handle = setTimeout(async () => {
      await saveDraftRef.current?.(values);
      setSaveState("saved");
    }, 800);
    return () => clearTimeout(handle);
  }, [values, isSubmitted]);

  const setField = (id: string, value: string) =>
    setValues((prev) => ({ ...prev, [id]: value }));

  const submit = () => {
    if (!onSubmit) return;
    startTransition(async () => {
      try {
        await onSubmit(values);
        setIsSubmitted(true);
      } catch {
        toast.error("Couldn't submit. Please try again.");
      }
    });
  };

  const belowMin = minWords != null && totalWords < minWords;
  const aboveMax = maxWords != null && totalWords > maxWords;
  const multiSection = sections.length > 1;

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id} className="space-y-1.5">
          <Label htmlFor={`w-${section.id}`}>{section.label}</Label>
          {section.guidance && (
            <p className="text-muted-foreground text-xs">{section.guidance}</p>
          )}
          <Textarea
            id={`w-${section.id}`}
            value={values[section.id] ?? ""}
            placeholder={section.placeholder}
            onChange={(e) => setField(section.id, e.target.value)}
            disabled={isSubmitted}
            rows={multiSection ? 4 : 6}
            className="resize-y"
          />
        </div>
      ))}

      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={cn((belowMin || aboveMax) && "text-amber-600")}>
          {totalWords} words
          {minWords ? ` · min ${minWords}` : ""}
          {maxWords ? ` · max ${maxWords}` : ""}
        </span>
        {onSaveDraft && !isSubmitted && (
          <span>
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Draft saved"
                : ""}
          </span>
        )}
      </div>

      {rubric && rubric.length > 0 && (
        <div className="border-border rounded-lg border p-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Rubric
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {rubric.map((criterion) => (
              <li key={criterion.id}>
                <span className="font-medium">{criterion.label}</span>
                {criterion.description && (
                  <span className="text-muted-foreground"> — {criterion.description}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onSubmit ? (
        isSubmitted ? (
          <Badge variant="secondary">Submitted</Badge>
        ) : (
          <Button size="sm" onClick={submit} disabled={pending || belowMin}>
            {pending ? "Submitting…" : submitLabel}
          </Button>
        )
      ) : onSaveDraft ? null : (
        <p className="text-muted-foreground text-xs">
          Sign in to save and submit your work.
        </p>
      )}
    </div>
  );
}
