import type { PrerequisiteEnforcement } from "./types";

/**
 * TEMPORARY kill-switch: while false, prerequisites don't matter anywhere —
 * no hard locks (isAccessLocked short-circuits), no prerequisite panel on
 * module pages, no "N prereq" badges on track pages. The data model, queries,
 * and enforcement logic all stay intact; flip to true to re-enable.
 */
export const PREREQUISITES_ENFORCED = false;

/**
 * A module is locked only under hard enforcement and while at least one
 * prerequisite is incomplete — and only while enforcement is globally on.
 */
export function isAccessLocked(
  enforcement: PrerequisiteEnforcement,
  prerequisiteCompletion: boolean[],
): boolean {
  if (!PREREQUISITES_ENFORCED) return false;
  return enforcementLocks(enforcement, prerequisiteCompletion);
}

/** The underlying rule, independent of the kill-switch. Pure so it can be unit-tested without a DB. */
export function enforcementLocks(
  enforcement: PrerequisiteEnforcement,
  prerequisiteCompletion: boolean[],
): boolean {
  return enforcement === "hard" && prerequisiteCompletion.some((done) => !done);
}
