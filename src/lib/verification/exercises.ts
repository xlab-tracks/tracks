/**
 * Registry of the Verification track's interactives (native React widgets in
 * `src/components/verification/widgets/`, keyed by the same id and rendered via
 * the `<VerificationExercise/>` MDX component).
 *
 * `bridged` widgets have a real finish event (quiz done, report filed, run
 * finished); they call their `onComplete` to record platform progress, and the
 * hosting lesson's scroll-based auto-complete is disabled so only finishing
 * (or the explicit button) completes it. Unbridged widgets are view-style
 * explorables with no finish event and keep normal scroll-to-complete.
 *
 * `id` is the widget id; the matching content-graph lesson id is always
 * `v-<id>` (enforced by src/lib/verification/widgets.test.ts).
 */
export interface VerificationExerciseDef {
  /** Widget id (also the widgets/registry.tsx key and the v-<id> lesson id). */
  id: string;
  /** Display title. */
  title: string;
  /** True when the widget reports a finish event via its onComplete. */
  bridged: boolean;
}

export const verificationExercises: VerificationExerciseDef[] = [
  { id: "what-do-they-say", title: "Why Are We Concerned About Superintelligence?", bridged: false },
  { id: "verification-landscape", title: "The Verification Landscape", bridged: false },
  { id: "policy-scoping", title: "Scoping an Anti-ASI Policy", bridged: true },
  { id: "policy-cost", title: "Everything Comes With a Cost", bridged: true },
  { id: "dissection-table", title: "The Dissection Table", bridged: true },
  { id: "anatomy-drill", title: "The Anatomy Drill", bridged: true },
  { id: "protocol-actors", title: "Who's in the Treaty?", bridged: true },
  { id: "game-theory-primer", title: "Game Theory for Verification", bridged: true },
  { id: "ir-primer", title: "IR for People Who Build Things", bridged: true },
  { id: "change-the-game", title: "Change the Game: The Race Dilemma Lab", bridged: true },
  { id: "evolution-of-verification", title: "The Evolution of Verification", bridged: true },
  { id: "interactive-map", title: "The Compute Supply Chain", bridged: false },
  { id: "report-constructor", title: "One Inspection, Three Readers", bridged: true },
  { id: "tamper-trace", title: "Tamper & Trace", bridged: true },
  { id: "inspection-game", title: "The Inspection Game", bridged: true },
  { id: "verification-timeline-game", title: "The Verification Game", bridged: true },
  { id: "facilitator-guide", title: "Facilitator Field Guide", bridged: false },
];

export function getVerificationExercise(id: string): VerificationExerciseDef | undefined {
  return verificationExercises.find((e) => e.id === id);
}

/** Registry entry for a content-graph lesson id, if it hosts an interactive. */
export function getVerificationExerciseForLesson(
  lessonId: string,
): VerificationExerciseDef | undefined {
  return verificationExercises.find((e) => verificationLessonId(e.id) === lessonId);
}

/** Content-graph lesson id for an exercise id. */
export function verificationLessonId(id: string): string {
  return `v-${id}`;
}
