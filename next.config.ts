import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Allow .md / .mdx files to be treated as pages and imports.
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
};

// String-form plugins are required for Turbopack (Next 16 default), which
// cannot pass JS functions to its Rust pipeline.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
