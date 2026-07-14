/**
 * Pure fit-check engine for the "Report Constructor" Verification widget.
 *
 * Ported verbatim from the standalone HTML's `evaluate()` (public/verification/
 * report-constructor.html, ~line 966). All DOM / module-global reads are
 * threaded in as arguments: the ordered selection (`sel`) and the per-card
 * thread map (`threads`). Nothing here reads the DOM, so it is unit-testable and
 * reusable by the React widget.
 *
 * A card threaded to a reader "fits" that reader only when its `fits[reader].ok`
 * is true; a dead card is a selected entry threaded to nobody; a desk is
 * "buried" once it collects `CONFIG.buriedAt` misfit threads; a report is
 * "clean" when every reader need is met with zero misfits and zero dead cards.
 */

import {
  CARDS,
  CONFIG,
  NEEDS,
  READERS,
  cardById,
  type ReaderId,
} from "../data/report-constructor";

/** cardId -> set of readers it is threaded to. */
export type ThreadMap = Map<string, Set<ReaderId>>;

export interface Verdict {
  card: string;
  title: string;
  reader: ReaderId;
  ok: boolean;
  note: string;
}

export interface FitResult {
  verdicts: Verdict[];
  /** ids of NEEDS whose audience is served by at least one fitting thread. */
  needsMet: Set<string>;
  /** selected card ids threaded to nobody. */
  dead: string[];
  /** total misfit threads across all desks. */
  misfits: number;
  /** reader ids that collected >= CONFIG.buriedAt misfit threads. */
  buried: ReaderId[];
  /** all needs met, zero misfits, zero dead. */
  clean: boolean;
}

/**
 * Faithful port of `evaluate()`. `sel` is the ordered list of selected card ids;
 * `threads` maps a card id to the set of readers it is threaded to.
 */
export function evaluate(sel: string[], threads: ThreadMap): FitResult {
  const verdicts: Verdict[] = [];
  const needsMet = new Set<string>();
  const dead: string[] = [];
  const misfitCount: Record<ReaderId, number> = {
    committee: 0,
    authority: 0,
    cell: 0,
  };
  let misfits = 0;

  sel.forEach((cardId) => {
    const set = threads.get(cardId);
    const c = cardById[cardId];
    if (!set || set.size === 0) {
      dead.push(cardId);
      return;
    }
    set.forEach((readerId) => {
      const f = c.fits[readerId];
      verdicts.push({
        card: cardId,
        title: c.title,
        reader: readerId,
        ok: f.ok,
        note: f.note,
      });
      if (!f.ok) {
        misfits++;
        misfitCount[readerId]++;
      }
    });
  });

  NEEDS.forEach((n) => {
    const hit = n.cover.some(
      (cardId) =>
        sel.includes(cardId) &&
        !!threads.get(cardId) &&
        threads.get(cardId)!.has(n.aud) &&
        cardById[cardId].fits[n.aud].ok,
    );
    if (hit) needsMet.add(n.id);
  });

  const buried = READERS.filter(
    (r) => misfitCount[r.id] >= CONFIG.buriedAt,
  ).map((r) => r.id);
  const clean =
    needsMet.size === NEEDS.length && misfits === 0 && dead.length === 0;

  return { verdicts, needsMet, dead, misfits, buried, clean };
}

/** Sum of thread counts across all selected cards (drives the check button). */
export function threadTotal(sel: string[], threads: ThreadMap): number {
  return sel.reduce(
    (n, id) => n + (threads.get(id) ? threads.get(id)!.size : 0),
    0,
  );
}

/** The readers a given card actually fits (used to build the perfect solution). */
export function fitsOf(cardId: string): ReaderId[] {
  return READERS.filter((r) => cardById[cardId].fits[r.id].ok).map((r) => r.id);
}

/** True if the card is a pure trap — it fits no reader at all. */
export function isTrap(cardId: string): boolean {
  return READERS.every((r) => !cardById[cardId].fits[r.id].ok);
}

// Re-export the data the engine tests assert against.
export { CARDS, NEEDS, READERS, CONFIG };
