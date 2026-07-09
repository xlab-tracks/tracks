import type { MDXComponents } from "mdx/types";
import { Video } from "./video";
import { ArxivPaper } from "./arxiv-paper";
import { Callout } from "./callout";
import { Demo } from "./demo";
import { Exercise } from "./exercise";
import { ExerciseSequence } from "./exercise-sequence";
import { Footnote } from "./footnote";
import { TracksAddition } from "./tracks-addition";

// Components available by name inside every lesson `.mdx` body. Authors drop
// <Video/>, <Demo/>, <Exercise/>, <ExerciseSequence/>, <Callout/>, <ArxivPaper/>,
// <Footnote/>, <TracksAddition/> directly into prose.
export const mdxComponents: MDXComponents = {
  Video,
  ArxivPaper,
  Callout,
  Demo,
  Exercise,
  ExerciseSequence,
  Footnote,
  TracksAddition,
};
