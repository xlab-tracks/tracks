import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// Deliberately the deprecated `middleware` convention, NOT Next 16's proxy.ts:
// proxy.ts compiles to Node middleware, which @opennextjs/cloudflare rejects at
// build time (opennextjs-cloudflare#1277). middleware.ts compiles as Edge
// middleware, which the adapter supports; AuthKit only refreshes the session
// cookie here (WebCrypto/fetch — edge-safe), and per-page/action sign-in
// enforcement uses `ensureSignedIn`.
export default authkitMiddleware();

export const config = {
  matcher: [
    // Skip static assets, the public chrome-less demo embed routes, and the
    // committed arXiv figure files under /arxiv/ — session refresh there
    // wastes invocations and poisons CDN cacheability.
    "/((?!_next/static|_next/image|favicon.ico|arxiv/|.*/embed$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
