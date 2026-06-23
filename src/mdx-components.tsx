import type { MDXComponents } from "mdx/types";
import { mdxComponents } from "@/components/mdx/mdx-components";

// Global MDX component map. Lesson `.mdx` bodies render with these components,
// so authors can drop <Video/>, <Demo/>, <Exercise/>, <Callout/> etc. directly
// into prose. See src/components/mdx/mdx-components.tsx for the actual map.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
