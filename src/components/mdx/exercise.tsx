import { getExerciseById } from "@/lib/content";
import {
  isChoiceExercise,
  isWritingExercise,
  type FlowchartNode,
  type TapRevealRating,
} from "@/lib/content/types";
import {
  toPublicChoice,
  toPublicFlowchart,
  type AllocationScenarioEntry,
  type ArgueRevealConstructionEntry,
  type ArgueRevealItemEntry,
} from "@/lib/content/exercise-view";
import { writingPromptHtml } from "@/lib/content/writing-prompt-html";
import { getCurrentUser } from "@/lib/auth";
import { getSubmission } from "@/lib/progress";
import { saveWritingDraft, submitWriting } from "@/app/actions/submissions";
import { AllocationExerciseCard } from "@/components/exercises/allocation-exercise";
import { ArgueRevealExerciseCard } from "@/components/exercises/argue-reveal-exercise";
import { ChoiceExerciseCard } from "@/components/exercises/choice-exercise";
import { FlowchartExerciseCard } from "@/components/exercises/flowchart-exercise";
import { TapRevealCard } from "@/components/exercises/tap-reveal-exercise";
import { UnderstandingCheckCard } from "@/components/exercises/understanding-check";
import { WritingExerciseCard } from "@/components/exercises/writing-exercise";
import type { WritingValues } from "@/components/exercises/writing-editor";

export interface ExerciseProps {
  id: string;
}

// Server dispatcher: strips answer keys for choice types, and for writing
// exercises loads any saved draft and binds the persistence actions.
export async function Exercise({ id }: ExerciseProps) {
  const exercise = getExerciseById(id);
  if (!exercise) {
    return (
      <div className="not-prose border-destructive/40 bg-destructive/5 text-destructive my-6 rounded-xl border p-4 text-sm">
        Unknown exercise: <code>{id}</code>
      </div>
    );
  }

  if (isChoiceExercise(exercise)) {
    return <ChoiceExerciseCard exercise={toPublicChoice(exercise)} />;
  }

  if (exercise.type === "flowchart") {
    const user = await getCurrentUser();
    const submission = user
      ? await getSubmission(user.id, exercise.id, "exercise")
      : null;
    const initialStages = (
      submission?.responseJson as {
        stages?: Record<string, { attempt: FlowchartNode[]; correct: boolean }>;
      } | null
    )?.stages;
    return (
      <FlowchartExerciseCard
        exercise={toPublicFlowchart(exercise)}
        initialStages={initialStages}
      />
    );
  }

  if (exercise.type === "tap-reveal") {
    const user = await getCurrentUser();
    const submission = user
      ? await getSubmission(user.id, exercise.id, "exercise")
      : null;
    const initialRating =
      (submission?.responseJson as { rating?: TapRevealRating } | null)
        ?.rating ?? null;
    return <TapRevealCard exercise={exercise} initialRating={initialRating} />;
  }

  if (exercise.type === "allocation") {
    const user = await getCurrentUser();
    const submission = user
      ? await getSubmission(user.id, exercise.id, "exercise")
      : null;
    const initialScenarios = (
      submission?.responseJson as {
        scenarios?: Record<string, AllocationScenarioEntry>;
      } | null
    )?.scenarios;
    return (
      <AllocationExerciseCard
        exercise={exercise}
        initialScenarios={initialScenarios}
        initialCompletedAt={
          submission?.status === "submitted"
            ? submission.updatedAt.toISOString()
            : undefined
        }
        persist={user != null}
      />
    );
  }

  if (exercise.type === "argue-reveal") {
    const user = await getCurrentUser();
    const submission = user
      ? await getSubmission(user.id, exercise.id, "exercise")
      : null;
    const responseJson = submission?.responseJson as {
      items?: Record<string, ArgueRevealItemEntry>;
      construction?: ArgueRevealConstructionEntry;
    } | null;
    return (
      <ArgueRevealExerciseCard
        exercise={exercise}
        initialItems={responseJson?.items}
        initialConstruction={responseJson?.construction}
        initialCompletedAt={
          submission?.status === "submitted"
            ? submission.updatedAt.toISOString()
            : undefined
        }
        persist={user != null}
      />
    );
  }

  if (exercise.type === "understanding-check") {
    return (
      <UnderstandingCheckCard
        prompt={exercise.prompt}
        sampleAnswer={exercise.sampleAnswer}
      />
    );
  }

  if (isWritingExercise(exercise)) {
    const promptHtml = writingPromptHtml(exercise.prompt);
    const user = await getCurrentUser();
    if (!user) {
      return <WritingExerciseCard exercise={exercise} promptHtml={promptHtml} />;
    }
    const submission = await getSubmission(user.id, exercise.id, "exercise");
    return (
      <WritingExerciseCard
        exercise={exercise}
        promptHtml={promptHtml}
        initialValues={(submission?.responseJson as WritingValues | null) ?? undefined}
        submitted={submission?.status === "submitted"}
        onSaveDraft={saveWritingDraft.bind(null, exercise.id, "exercise", exercise.format)}
        onSubmit={submitWriting.bind(null, exercise.id, "exercise", exercise.format)}
      />
    );
  }

  return null;
}
