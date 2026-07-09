import type { MDXComponents } from "mdx/types";
import { Video } from "./video";
import { ArxivPaper } from "./arxiv-paper";
import { Callout } from "./callout";
import { Demo } from "./demo";
import { Exercise } from "./exercise";
import { Footnote } from "./footnote";

// Components available by name inside every lesson `.mdx` body. Authors drop
// <Video/>, <Demo/>, <Exercise/>, <Callout/>, <ArxivPaper/>, <Footnote/> directly into prose.
export const mdxComponents: MDXComponents = {
  Video,
  ArxivPaper,
  Callout,
  Demo,
  Exercise,
  Footnote,
};
