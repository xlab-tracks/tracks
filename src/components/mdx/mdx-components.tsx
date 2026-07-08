import type { MDXComponents } from "mdx/types";
import { Video } from "./video";
import { Callout } from "./callout";
import { Demo } from "./demo";
import { Exercise } from "./exercise";
import { ExerciseSequence } from "./exercise-sequence";
import { Footnote } from "./footnote";
import { TracksAddition } from "./tracks-addition";

// Components available by name inside every lesson `.mdx` body. Authors drop
// <Video/>, <Demo/>, <Exercise/>, <ExerciseSequence/>, <Callout/>, <Footnote/>,
// <TracksAddition/> directly into prose.
export const mdxComponents: MDXComponents = {
  Video,
  Callout,
  Demo,
  Exercise,
  ExerciseSequence,
  Footnote,
  TracksAddition,
};
