import type { MDXComponents } from "mdx/types";
import { Video } from "./video";
import { ArxivPaper } from "./arxiv-paper";
import { Callout } from "./callout";
import { Demo } from "./demo";
import { Exercise } from "./exercise";
import { ExerciseSequence } from "./exercise-sequence";
import { Footnote } from "./footnote";
import { MdxLink } from "./mdx-link";
import { SiteQuote } from "./site-quote";
import { Term } from "./term";
import { VerificationExercise } from "@/components/verification/verification-exercise";

// Components available by name inside every lesson `.mdx` body. Authors drop
// <Video/>, <Demo/>, <Exercise/>, <ExerciseSequence/>, <Callout/>,
// <ArxivPaper/>, <Footnote/>, <Term/>, <SiteQuote/>, <VerificationExercise/>
// directly into prose. Markdown links render through MdxLink, which routes
// known Substack / LessWrong posts to the internal reader.
export const mdxComponents: MDXComponents = {
  a: MdxLink,
  Video,
  ArxivPaper,
  Callout,
  Demo,
  Exercise,
  ExerciseSequence,
  Footnote,
  SiteQuote,
  Term,
  VerificationExercise,
};
