/**
 * Contract every native Verification widget receives from the host dispatcher.
 *
 * Widgets are self-contained client components registered by id in
 * `src/components/verification/widgets/registry.tsx`. The host resolves the
 * signed-in user's completion state server-side and hands each widget a single
 * `onComplete` it calls at its genuine finish event (bridged widgets only) —
 * the host routes that to platform progress via `useVerificationCompletion`.
 */
export interface VerificationWidgetProps {
  /**
   * Call at the widget's real finish event (quiz done, report filed, run
   * finished). No-op for unbridged widgets or signed-out learners — the host
   * decides whether it records progress.
   */
  onComplete: () => void;
  /** Whether this content was already completed (for resumable UI hints). */
  initialCompleted: boolean;
}
