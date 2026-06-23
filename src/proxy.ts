import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// Next 16 renamed Middleware to Proxy. AuthKit refreshes the session cookie on
// each request here; per-page/action sign-in enforcement uses `ensureSignedIn`.
export default authkitMiddleware();

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
