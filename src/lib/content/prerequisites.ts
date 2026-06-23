import type { PrerequisiteEnforcement } from "./types";

/**
 * A module is locked only under hard enforcement and while at least one
 * prerequisite is incomplete. Pure so it can be unit-tested without a DB.
 */
export function isAccessLocked(
  enforcement: PrerequisiteEnforcement,
  prerequisiteCompletion: boolean[],
): boolean {
  return enforcement === "hard" && prerequisiteCompletion.some((done) => !done);
}
