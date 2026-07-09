import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// No initOpenNextCloudflareForDev() here on purpose: with a hyperdrive binding
// it demands a local connection string even during `next build` (including
// remote Workers Builds). Local dev doesn't need emulated bindings — the DB
// client falls back to DATABASE_URL (src/lib/db.ts).
const nextConfig: NextConfig = {
  // Allow .md / .mdx files to be treated as pages and imports.
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // The Prisma packages must stay external so @opennextjs/cloudflare can patch
  // the generated client for workerd at build time.
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    // pg's conditional require of pg-cloudflare (the workerd socket shim) only
    // resolves under the workerd exports condition — keep both external so the
    // require happens at runtime in workerd instead of at bundle time.
    "pg",
    "pg-cloudflare",
  ],
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
