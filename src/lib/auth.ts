import { cache } from "react";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { prisma } from "./db";

export interface AppUser {
  id: string;
  workosUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

interface WorkosUserShape {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
}

function displayName(user: WorkosUserShape): string | null {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || null;
}

const USER_SELECT = {
  id: true,
  workosUserId: true,
  email: true,
  name: true,
  imageUrl: true,
} as const;

// Isolate-lifetime mirror of the immutable workosUserId → AppUser mapping.
// `prisma.user` is written ONLY in this file, so a cached entry whose mirrored
// fields still match the (WorkOS-verified) session provably matches the DB row
// it was minted from — letting a warm authenticated request skip the mirror
// read entirely, which is otherwise 1 origin round trip on every request and
// every server action. This is data caching, not a TCP-holding client, so the
// per-request rule in db.ts does not apply. Bounded so it can't grow without
// limit over an isolate's life (a deleted User row — no in-app path — would
// serve stale until the isolate recycles; acceptable).
const MIRROR_CACHE_MAX = 5_000;
const userMirrorCache = new Map<string, AppUser>();

function rememberMirror(key: string, user: AppUser): void {
  if (userMirrorCache.size >= MIRROR_CACHE_MAX && !userMirrorCache.has(key)) {
    const oldest = userMirrorCache.keys().next().value;
    if (oldest !== undefined) userMirrorCache.delete(oldest);
  }
  userMirrorCache.set(key, user);
}

// WorkOS owns identity/sessions; mirror the signed-in user into our DB so app
// data (progress, submissions, classrooms) can reference a local ID. Serve from
// the isolate mirror when the session's fields match; otherwise read first and
// only write when the row is missing or a mirrored field actually changed.
async function upsertUser(workosUser: WorkosUserShape): Promise<AppUser> {
  const email = workosUser.email;
  const name = displayName(workosUser);
  const imageUrl = workosUser.profilePictureUrl ?? null;

  const cached = userMirrorCache.get(workosUser.id);
  if (
    cached &&
    cached.email === email &&
    cached.name === name &&
    cached.imageUrl === imageUrl
  ) {
    return cached;
  }

  const existing = await prisma.user.findUnique({
    where: { workosUserId: workosUser.id },
    select: USER_SELECT,
  });
  if (
    existing &&
    existing.email === email &&
    existing.name === name &&
    existing.imageUrl === imageUrl
  ) {
    rememberMirror(workosUser.id, existing);
    return existing;
  }

  // Missing row or drifted fields: upsert keeps the rare concurrent
  // first-insert safe via the workosUserId unique constraint.
  const upserted = await prisma.user.upsert({
    where: { workosUserId: workosUser.id },
    create: { workosUserId: workosUser.id, email, name, imageUrl },
    update: { email, name, imageUrl },
    select: USER_SELECT,
  });
  rememberMirror(workosUser.id, upserted);
  return upserted;
}

/**
 * The signed-in app user, or null when not authenticated.
 * `cache()` dedupes the WorkOS lookup + user upsert within a single request,
 * so layout + page calls don't each hit the DB.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const dev = devUser();
  if (dev) return upsertUser(dev);
  const { user } = await withAuth();
  if (!user) return null;
  return upsertUser(user);
});

/** Like getCurrentUser, but redirects to sign-in when not authenticated. */
export const requireUser = cache(async (): Promise<AppUser> => {
  const dev = devUser();
  if (dev) return upsertUser(dev);
  const { user } = await withAuth({ ensureSignedIn: true });
  return upsertUser(user);
});

/**
 * Dev-only auth bypass: with DEV_USER set in .env, every request resolves to
 * a placeholder account (no WorkOS round trip), so save/submit/grading flows
 * work under `next dev` without real credentials. DEV_USER=1 gives the
 * default "Dev User"; DEV_USER=alice@dev.local gives a distinct account per
 * email (handy for classroom instructor/student testing). Deliberately
 * double-gated: the flag AND NODE_ENV === "development" are both required,
 * so a stray DEV_USER in a production or preview environment can never open
 * a backdoor (`next build`/`start` and the Workers runtime set "production";
 * vitest sets "test"). Never expose a DEV_USER dev server to the network.
 */
function devUser(): WorkosUserShape | null {
  const flag = process.env.DEV_USER;
  if (!flag || process.env.NODE_ENV !== "development") return null;
  if (!flag.includes("@")) {
    // The plain DEV_USER=1 account keeps its historical id so existing local
    // dev DBs don't grow a second default user.
    return { id: "dev_dev", email: "dev@localhost", firstName: "Dev", lastName: "User" };
  }
  // Key on the FULL address — the documented contract is "a distinct account
  // per email", and the local part alone collides alice@a.test with
  // alice@b.test.
  const email = flag.trim().toLowerCase();
  return {
    id: `dev_${email.replace(/[^a-z0-9]+/g, "_")}`,
    email,
    firstName: email.split("@")[0],
    lastName: "(dev)",
  };
}
