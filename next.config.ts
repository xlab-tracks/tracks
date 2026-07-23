import { join } from "node:path";
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
  async headers() {
    return [
      {
        // Clickjacking hardening: only same-origin pages may frame the app.
        // Carve-out: /demos/*/embed exists to be iframed by external sites.
        source: "/((?!demos/.*/embed$).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

// String-form plugins are required for Turbopack (Next 16 default), which
// cannot pass JS functions to its Rust pipeline. The local plugin needs an
// absolute path: the loader resolves plugin strings relative to each MDX
// file's directory, so a relative "./src/…" would not resolve.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm", "remark-math"],
    rehypePlugins: [
      "rehype-slug",
      // Must come after rehype-slug: it reads the heading ids slug assigns.
      join(process.cwd(), "src/lib/mdx/rehype-lesson-sections.mjs"),
      // Before rehype-katex: it skips inline math while math is still a
      // `code` element, and never touches headings/links/inline JSX.
      join(process.cwd(), "src/lib/mdx/rehype-auto-gloss.mjs"),
      "rehype-katex",
    ],
  },
});

export default withMDX(nextConfig);
