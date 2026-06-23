import type { MDXComponents } from "mdx/types";
import { Video } from "./video";
import { Callout } from "./callout";
import { Demo } from "./demo";
import { Exercise } from "./exercise";

// Components available by name inside every lesson `.mdx` body. Authors drop
// <Video/>, <Demo/>, <Exercise/>, <Callout/> directly into prose.
export const mdxComponents: MDXComponents = {
  Video,
  Callout,
  Demo,
  Exercise,
};
