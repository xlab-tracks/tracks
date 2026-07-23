"use client";

import { WritingEditor, type WritingValues } from "./writing-editor";
import { DELIVERABLE_FORMAT_LABELS, type WritingExercise } from "@/lib/content/types";

export interface WritingExerciseCardProps {
  exercise: WritingExercise;
  /** Server-rendered markdown of `exercise.prompt` (see writing-prompt-html.ts). */
  promptHtml?: string;
  initialValues?: WritingValues;
  submitted?: boolean;
  onSaveDraft?: (values: WritingValues) => Promise<void> | void;
  onSubmit?: (values: WritingValues) => Promise<void> | void;
  onReopen?: () => Promise<void> | void;
}

export function WritingExerciseCard({
  exercise,
  promptHtml,
  initialValues,
  submitted,
  onSaveDraft,
  onSubmit,
  onReopen,
}: WritingExerciseCardProps) {
  const sections = exercise.sections ?? [
    { id: "response", label: "Your response", placeholder: "Write your answer…" },
  ];
  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {DELIVERABLE_FORMAT_LABELS[exercise.format]}
      </p>
      {promptHtml ? (
        <div
          className="space-y-3 font-medium leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: promptHtml }}
        />
      ) : (
        <p className="font-medium">{exercise.prompt}</p>
      )}
      <div className="mt-4">
        <WritingEditor
          sections={sections}
          rubric={exercise.rubric}
          minWords={exercise.minWords}
          maxWords={exercise.maxWords}
          initialValues={initialValues}
          submitted={submitted}
          onSaveDraft={onSaveDraft}
          onSubmit={onSubmit}
          onReopen={onReopen}
        />
      </div>
    </aside>
  );
}
