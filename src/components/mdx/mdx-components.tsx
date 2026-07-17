import type { MDXComponents } from "mdx/types";
import { Video } from "./video";
import { ArxivPaper } from "./arxiv-paper";
import { Callout } from "./callout";
import { Demo } from "./demo";
import { Exercise } from "./exercise";
import { ExerciseSequence } from "./exercise-sequence";
import { Footnote } from "./footnote";
import { Gate } from "./gate";
import { PaperText } from "./paper-text";
import { VerificationExercise } from "@/components/verification/verification-exercise";

// Components available by name inside every lesson `.mdx` body. Authors drop
// <Video/>, <Demo/>, <Exercise/>, <ExerciseSequence/>, <Callout/>,
// <ArxivPaper/>, <Footnote/>, <VerificationExercise/> directly into prose.
export const mdxComponents: MDXComponents = {
  Video,
  ArxivPaper,
  Callout,
  Demo,
  Exercise,
  ExerciseSequence,
  Footnote,
  Gate,
  PaperText,
  VerificationExercise,
};
