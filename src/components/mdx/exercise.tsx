import { getExerciseById } from "@/lib/content";
import { isChoiceExercise, isWritingExercise } from "@/lib/content/types";
import { toPublicChoice } from "@/lib/content/exercise-view";
import { getCurrentUser } from "@/lib/auth";
import { getSubmission } from "@/lib/progress";
import { saveWritingDraft, submitWriting } from "@/app/actions/submissions";
import { ChoiceExerciseCard } from "@/components/exercises/choice-exercise";
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

  if (exercise.type === "understanding-check") {
    return (
      <UnderstandingCheckCard
        prompt={exercise.prompt}
        sampleAnswer={exercise.sampleAnswer}
      />
    );
  }

  if (isWritingExercise(exercise)) {
    const user = await getCurrentUser();
    if (!user) {
      return <WritingExerciseCard exercise={exercise} />;
    }
    const submission = await getSubmission(user.id, exercise.id, "exercise");
    return (
      <WritingExerciseCard
        exercise={exercise}
        initialValues={(submission?.responseJson as WritingValues | null) ?? undefined}
        submitted={submission?.status === "submitted"}
        onSaveDraft={saveWritingDraft.bind(null, exercise.id, "exercise", exercise.format)}
        onSubmit={submitWriting.bind(null, exercise.id, "exercise", exercise.format)}
      />
    );
  }

  return null;
}
