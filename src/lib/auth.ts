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

// WorkOS owns identity/sessions; mirror the signed-in user into our DB so app
// data (progress, submissions, capstone, classrooms) can reference a local ID.
async function upsertUser(workosUser: WorkosUserShape): Promise<AppUser> {
  return prisma.user.upsert({
    where: { workosUserId: workosUser.id },
    create: {
      workosUserId: workosUser.id,
      email: workosUser.email,
      name: displayName(workosUser),
      imageUrl: workosUser.profilePictureUrl ?? null,
    },
    update: {
      email: workosUser.email,
      name: displayName(workosUser),
      imageUrl: workosUser.profilePictureUrl ?? null,
    },
    select: {
      id: true,
      workosUserId: true,
      email: true,
      name: true,
      imageUrl: true,
    },
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
