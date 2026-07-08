import { getExerciseById } from "@/lib/content";
import {
  ExerciseSequenceCard,
  type SequencePart,
} from "@/components/exercises/exercise-sequence";

export interface ExerciseSequenceProps {
  /** Exercise IDs, in order. Only `understanding-check` exercises are supported. */
  ids: string[];
  label?: string;
}

// Groups several understanding-check exercises into one stepped, multi-part
// card — shown one part at a time, each unlocked by submitting the previous.
export function ExerciseSequence({ ids, label }: ExerciseSequenceProps) {
  const parts: SequencePart[] = [];
  for (const id of ids) {
    const exercise = getExerciseById(id);
    if (exercise?.type === "understanding-check") {
      parts.push({ id: exercise.id, prompt: exercise.prompt, sampleAnswer: exercise.sampleAnswer });
    }
  }

  if (parts.length === 0) {
    return (
      <div className="not-prose border-destructive/40 bg-destructive/5 text-destructive my-6 rounded-xl border p-4 text-sm">
        No understanding-check exercises found for: <code>{ids.join(", ")}</code>
      </div>
    );
  }

  return <ExerciseSequenceCard label={label} parts={parts} />;
}
