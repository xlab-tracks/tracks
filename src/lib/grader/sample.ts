import {
  getAssessmentById,
  getExerciseById,
} from "@/lib/content";
import {
  DELIVERABLE_FORMAT_LABELS,
  isWritingExercise,
  type DeliverableFormat,
} from "@/lib/content/types";
import type {
  ArgueRevealConstructionEntry,
  ArgueRevealItemEntry,
} from "@/lib/content/exercise-view";
import type { SampleContext } from "./prompts";

// Assembles the text the grader sees from a submission's responseJson, plus
// the user-prompt context slots, for each free-text submission shape. Section
// labels and (for argue-reveal) the critiques are included as bracketed
// context lines so the grader can follow the structure; only the learner's
// own prose is the graded sample.

export interface AssembledSample {
  sample: string;
  context: SampleContext;
}

const AUDIENCE = "course graders in an AI-safety curriculum";

function formatLabel(format: string): string {
  return DELIVERABLE_FORMAT_LABELS[format as DeliverableFormat] ?? format;
}

/** Writing exercises and assessments: labeled sections of free text. */
export function assembleWriting(
  contentId: string,
  kind: "exercise" | "assessment",
  values: Record<string, unknown>,
): AssembledSample | null {
  if (kind === "assessment") {
    const assessment = getAssessmentById(contentId);
    if (!assessment) return null;
    const parts = assessment.sections
      .map((section) => {
        const text = values[section.id];
        return typeof text === "string" && text.trim()
          ? `[Section: ${section.label}]\n${text.trim()}`
          : null;
      })
      .filter(Boolean);
    if (!parts.length) return null;
    return {
      sample: parts.join("\n\n"),
      context: {
        documentType: `end-of-module assessment (${formatLabel(assessment.format)})`,
        stakes: `graded course deliverable: "${assessment.title}"`,
        audience: AUDIENCE,
      },
    };
  }

  const exercise = getExerciseById(contentId);
  if (!exercise || !isWritingExercise(exercise)) return null;
  const sections = exercise.sections ?? [{ id: "response", label: "Response" }];
  const parts = sections
    .map((section) => {
      const text = values[section.id];
      if (typeof text !== "string" || !text.trim()) return null;
      return sections.length > 1
        ? `[Section: ${section.label}]\n${text.trim()}`
        : text.trim();
    })
    .filter(Boolean);
  if (!parts.length) return null;
  return {
    sample: parts.join("\n\n"),
    context: {
      documentType: `course writing exercise (${formatLabel(exercise.format)})`,
      stakes: "practice writing inside a lesson",
      audience: AUDIENCE,
    },
  };
}

/** Argue-reveal: the learner's counterarguments plus the construction step. */
export function assembleArgueReveal(
  contentId: string,
  responseJson: {
    items?: Record<string, ArgueRevealItemEntry>;
    construction?: ArgueRevealConstructionEntry;
  },
): AssembledSample | null {
  const exercise = getExerciseById(contentId);
  if (!exercise || exercise.type !== "argue-reveal") return null;

  const parts: string[] = [];
  for (const item of exercise.items) {
    const entry = responseJson.items?.[item.id];
    if (!entry) continue;
    item.rounds.forEach((round, k) => {
      const response = entry.rounds?.[k]?.response;
      if (typeof response !== "string" || !response.trim()) return;
      parts.push(
        `[Context — the critic argued: "${round.critique}"]\nLearner's counterargument:\n${response.trim()}`,
      );
    });
  }
  const construction = responseJson.construction;
  if (construction?.argument?.trim()) {
    parts.push(
      `[Construction — the learner's own argument against control]\nArgument: ${construction.argument.trim()}\nBest response to it: ${(construction.bestResponse ?? "").trim()}\nResidual: ${(construction.residual ?? "").trim()}`,
    );
  }
  if (!parts.length) return null;
  return {
    sample: parts.join("\n\n"),
    context: {
      documentType:
        "short debate-exercise responses (counterarguments to given critiques)",
      stakes: `course exercise: "${exercise.title}"`,
      audience: AUDIENCE,
    },
  };
}
