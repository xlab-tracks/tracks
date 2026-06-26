import { handleAuth } from "@workos-inc/authkit-nextjs";

// WorkOS redirects here after Google sign-in; AuthKit exchanges the code,
// seals the session cookie, and redirects back into the app.
//
// On Netlify the function sees the deploy-specific permalink host (e.g.
// <deploy-id>--site.netlify.app) in request.url, so without an explicit baseURL
// handleAuth bounces the user to that permalink instead of the primary domain.
// Pin the post-login redirect to the site origin from the configured redirect URI.
const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;

export const GET = handleAuth(
  redirectUri ? { baseURL: new URL(redirectUri).origin } : {},
);
