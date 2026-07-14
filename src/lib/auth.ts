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

// WorkOS owns identity/sessions; mirror the signed-in user into our DB so app
// data (progress, submissions, classrooms) can reference a local ID. Read
// first and only write when the row is missing or a mirrored field actually
// changed — this runs on every authenticated request, and on Workers each
// upsert is a DB round-trip through Hyperdrive (caching disabled).
async function upsertUser(workosUser: WorkosUserShape): Promise<AppUser> {
  const email = workosUser.email;
  const name = displayName(workosUser);
  const imageUrl = workosUser.profilePictureUrl ?? null;

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
    return existing;
  }

  // Missing row or drifted fields: upsert keeps the rare concurrent
  // first-insert safe via the workosUserId unique constraint.
  return prisma.user.upsert({
    where: { workosUserId: workosUser.id },
    create: { workosUserId: workosUser.id, email, name, imageUrl },
    update: { email, name, imageUrl },
    select: USER_SELECT,
  });
}

/**
 * The signed-in app user, or null when not authenticated.
 * `cache()` dedupes the WorkOS lookup + user upsert within a single request,
 * so layout + page calls don't each hit the DB.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const { user } = await withAuth();
  if (!user) return null;
  return upsertUser(user);
});

/** Like getCurrentUser, but redirects to sign-in when not authenticated. */
export const requireUser = cache(async (): Promise<AppUser> => {
  const { user } = await withAuth({ ensureSignedIn: true });
  return upsertUser(user);
});
