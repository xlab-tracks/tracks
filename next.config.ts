import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Allow .md / .mdx files to be treated as pages and imports.
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
};

// String-form plugins are required for Turbopack (Next 16 default), which
// cannot pass JS functions to its Rust pipeline.
//
// remark-math parses $inline$ and $$block$$ math into mdast math nodes;
// rehype-katex renders those nodes to KaTeX HTML (see globals.css for the
// katex stylesheet import).
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm", "remark-math"],
    rehypePlugins: ["rehype-slug", "rehype-katex"],
  },
});

export default withMDX(nextConfig);
