import { handleAuth } from "@workos-inc/authkit-nextjs";

// WorkOS redirects here after Google sign-in; AuthKit exchanges the code,
// seals the session cookie, and redirects back into the app.
export const GET = handleAuth();
