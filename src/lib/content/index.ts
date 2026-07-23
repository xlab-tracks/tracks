import { tracks, modules, lessons } from "@/content/curriculum.data";
import { papers } from "@/content/papers.data";
import { exercises } from "@/content/exercises.data";
import { assessments } from "@/content/assessments.data";
import { resources } from "@/content/resources.data";
import { buildAbsUrl, parseArxivId } from "@/lib/arxiv/id";
import { isWritingExercise } from "./types";
import type {
  Assessment,
  Exercise,
  ExternalResource,
  Lesson,
  Module,
  ModuleItem,
  Paper,
  PaperSource,
  Track,
} from "./types";

// In-memory indexes over the static content graph.
const trackById = new Map(tracks.map((t) => [t.id, t]));
const trackBySlug = new Map(tracks.map((t) => [t.slug, t]));
const moduleById = new Map(modules.map((m) => [m.id, m]));
const lessonById = new Map(lessons.map((l) => [l.id, l]));
const paperById = new Map(papers.map((p) => [p.id, p]));
const exerciseById = new Map(exercises.map((e) => [e.id, e]));
const assessmentById = new Map(assessments.map((a) => [a.id, a]));
const assessmentByModuleId = new Map(assessments.map((a) => [a.moduleId, a]));

// Inserted lessons live inside a paper's flow; map them back to their paper.
const paperByInsertedLessonId = new Map<string, Paper>(
  papers.flatMap((p) =>
    (p.edits ?? [])
      .flatMap((edit) => (edit.op === "activity" ? edit.items : []))
      .filter((item) => item.kind === "lesson")
      .map((item) => [item.id, p] as const),
  ),
);

export { tracks, papers, resources };
export type {
  Track,
  Module,
  Lesson,
  Paper,
  ModuleItem,
  Exercise,
  Assessment,
  ExternalResource,
};

// --- Basic lookups -------------------------------------------------------

export function getTrackById(id: string): Track | undefined {
  return trackById.get(id);
}
export function getLessonById(id: string): Lesson | undefined {
  return lessonById.get(id);
}
export function getExerciseById(id: string): Exercise | undefined {
  return exerciseById.get(id);
}
export function getAssessmentForModule(moduleId: string): Assessment | undefined {
  return assessmentByModuleId.get(moduleId);
}
export function getAssessmentById(id: string): Assessment | undefined {
  return assessmentById.get(id);
}

/**
 * Resolves a writing submission target (assessment or open-ended exercise) to
 * its allowed section ids and server-derived format. Returns undefined for any
 * content id that is not a real writing deliverable of the given kind — so the
 * submission actions can reject direct-POST payloads with bogus ids the same
 * way the choice/allocation actions do. A writing exercise with no explicit
 * sections uses the single synthetic "response" section (see writing-exercise.tsx).
 */
export function getWritingTarget(
  contentId: string,
  kind: "assessment" | "exercise",
): { sectionIds: string[]; format: string } | undefined {
  if (kind === "assessment") {
    const assessment = assessmentById.get(contentId);
    if (!assessment) return undefined;
    return {
      sectionIds: assessment.sections.map((s) => s.id),
      format: assessment.format,
    };
  }
  const exercise = exerciseById.get(contentId);
  if (!exercise || !isWritingExercise(exercise)) return undefined;
  const sectionIds = (exercise.sections ?? [{ id: "response" }]).map((s) => s.id);
  return { sectionIds, format: exercise.format };
}

// --- Module items (lessons and papers, interleaved) ----------------------

/** Tiny discriminant unwrappers shared by pages and the sidebar. */
export function itemIdOf(item: ModuleItem): string {
  return item.kind === "lesson" ? item.lesson.id : item.paper.id;
}
export function itemSlugOf(item: ModuleItem): string {
  return item.kind === "lesson" ? item.lesson.slug : item.paper.slug;
}
export function itemTitleOf(item: ModuleItem): string {
  return item.kind === "lesson" ? item.lesson.title : item.paper.title;
}

function resolveItem(id: string): ModuleItem | undefined {
  const lesson = lessonById.get(id);
  if (lesson) return { kind: "lesson", lesson };
  const paper = paperById.get(id);
  if (paper) return { kind: "paper", paper };
  return undefined;
}

// --- Ordered collections -------------------------------------------------

export function getModulesForTrack(trackId: string): Module[] {
  const track = trackById.get(trackId);
  if (!track) return [];
  return track.moduleIds
    .map((id) => moduleById.get(id))
    .filter((m): m is Module => Boolean(m));
}

/** A module's content items in itemIds order. */
export function getItemsForModule(moduleId: string): ModuleItem[] {
  const mod = moduleById.get(moduleId);
  if (!mod) return [];
  return mod.itemIds
    .map(resolveItem)
    .filter((item): item is ModuleItem => Boolean(item));
}

export function getTrackForModule(moduleId: string): Track | undefined {
  const mod = moduleById.get(moduleId);
  return mod ? trackById.get(mod.trackId) : undefined;
}

/** Inline lessons referenced by a paper's activity edits, in edit order. */
export function getInsertedLessonsForPaper(paperId: string): Lesson[] {
  const paper = paperById.get(paperId);
  if (!paper) return [];
  return (paper.edits ?? [])
    .flatMap((edit) => (edit.op === "activity" ? edit.items : []))
    .filter((item) => item.kind === "lesson")
    .map((item) => lessonById.get(item.id))
    .filter((l): l is Lesson => Boolean(l));
}

// --- Slug resolution -----------------------------------------------------

export function getModuleBySlugs(
  trackSlug: string,
  moduleSlug: string,
): { track: Track; module: Module } | undefined {
  const track = trackBySlug.get(trackSlug);
  if (!track) return undefined;
  const mod = getModulesForTrack(track.id).find((m) => m.slug === moduleSlug);
  return mod ? { track, module: mod } : undefined;
}

export function getItemBySlugs(
  trackSlug: string,
  moduleSlug: string,
  itemSlug: string,
): { track: Track; module: Module; item: ModuleItem } | undefined {
  const resolved = getModuleBySlugs(trackSlug, moduleSlug);
  if (!resolved) return undefined;
  const item = getItemsForModule(resolved.module.id).find(
    (candidate) => itemSlugOf(candidate) === itemSlug,
  );
  return item ? { ...resolved, item } : undefined;
}

// --- Prerequisites -------------------------------------------------------

/** Resolved prerequisite modules for a module (cross-track allowed). */
export function getPrerequisiteModules(moduleId: string): Module[] {
  const mod = moduleById.get(moduleId);
  if (!mod) return [];
  return mod.prerequisiteModuleIds
    .map((id) => moduleById.get(id))
    .filter((m): m is Module => Boolean(m));
}

// --- Navigation ----------------------------------------------------------

export interface ItemRef {
  kind: ModuleItem["kind"];
  trackSlug: string;
  moduleSlug: string;
  itemSlug: string;
  title: string;
}

/** Flattened, ordered sequence of every content item in a track. */
export function getTrackItemSequence(
  trackSlug: string,
): Array<{ module: Module; item: ModuleItem }> {
  const track = trackBySlug.get(trackSlug);
  if (!track) return [];
  const sequence: Array<{ module: Module; item: ModuleItem }> = [];
  for (const mod of getModulesForTrack(track.id)) {
    for (const item of getItemsForModule(mod.id)) {
      sequence.push({ module: mod, item });
    }
  }
  return sequence;
}

/** Previous/next item within the same track (linear order). */
export function getItemNavigation(itemId: string): {
  prev: ItemRef | null;
  next: ItemRef | null;
} {
  const item = resolveItem(itemId);
  if (!item) return { prev: null, next: null };
  const moduleId = item.kind === "lesson" ? item.lesson.moduleId : item.paper.moduleId;
  const track = getTrackForModule(moduleId);
  if (!track) return { prev: null, next: null };

  const sequence = getTrackItemSequence(track.slug);
  const index = sequence.findIndex((entry) => itemIdOf(entry.item) === itemId);
  if (index === -1) return { prev: null, next: null };

  const toRef = (entry: { module: Module; item: ModuleItem }): ItemRef => ({
    kind: entry.item.kind,
    trackSlug: track.slug,
    moduleSlug: entry.module.slug,
    itemSlug: itemSlugOf(entry.item),
    title: itemTitleOf(entry.item),
  });

  return {
    prev: index > 0 ? toRef(sequence[index - 1]) : null,
    next: index < sequence.length - 1 ? toRef(sequence[index + 1]) : null,
  };
}

// --- Outline (for sidebar / track overview) ------------------------------

export interface TrackOutline {
  track: Track;
  modules: Array<{ module: Module; items: ModuleItem[] }>;
}

export function getTrackOutline(trackSlug: string): TrackOutline | undefined {
  const track = trackBySlug.get(trackSlug);
  if (!track) return undefined;
  return {
    track,
    modules: getModulesForTrack(track.id).map((module) => ({
      module,
      items: getItemsForModule(module.id),
    })),
  };
}

// --- Progress id sets ------------------------------------------------------
// Progress rows (LessonProgress) key on generic content ids: standalone
// lessons, papers, and papers' inserted lessons each count as one unit.

/**
 * A single item's progress-countable content ids: the item itself, plus a
 * paper's inserted lessons. An item's checkmark should light only when ALL
 * of these are complete, so overview rows agree with module/track totals.
 */
export function getItemProgressContentIds(item: ModuleItem): string[] {
  return item.kind === "lesson"
    ? [item.lesson.id]
    : [item.paper.id, ...getInsertedLessonsForPaper(item.paper.id).map((l) => l.id)];
}

/** A module's progress-countable content ids, in item order. */
export function getModuleProgressContentIds(moduleId: string): string[] {
  return getItemsForModule(moduleId).flatMap(getItemProgressContentIds);
}

/** All progress-countable content ids in a track (used for aggregation). */
export function getTrackProgressContentIds(trackId: string): string[] {
  return getModulesForTrack(trackId).flatMap((m) =>
    getModuleProgressContentIds(m.id),
  );
}

/**
 * Locate any progress-countable content id. Inserted lessons resolve to their
 * containing paper's page (they have no standalone route).
 */
export function getContentLocation(
  contentId: string,
): { track: Track; module: Module; href: string } | undefined {
  const paper = paperById.get(contentId) ?? paperByInsertedLessonId.get(contentId);
  if (paper) {
    const mod = moduleById.get(paper.moduleId);
    const track = mod ? trackById.get(mod.trackId) : undefined;
    if (!mod || !track) return undefined;
    return {
      track,
      module: mod,
      href: `/tracks/${track.slug}/${mod.slug}/${paper.slug}`,
    };
  }
  const lesson = lessonById.get(contentId);
  if (lesson) {
    const mod = moduleById.get(lesson.moduleId);
    const track = mod ? trackById.get(mod.trackId) : undefined;
    if (!mod || !track) return undefined;
    return {
      track,
      module: mod,
      href: `/tracks/${track.slug}/${mod.slug}/${lesson.slug}`,
    };
  }
  return undefined;
}

// --- Resources -----------------------------------------------------------

/** The public link for a paper's original source. */
function paperSourceUrl(source: PaperSource): string {
  if (source.kind === "arxiv") {
    const parsed = parseArxivId(source.arxivId);
    return parsed ? buildAbsUrl(parsed) : `https://arxiv.org/abs/${source.arxivId}`;
  }
  return source.postUrl;
}

/**
 * Resource-hub entries derived from the content graph: every paper item in a
 * real track (the Example track is a feature reference, not curriculum). The
 * hub links each to its in-course viewer (`internalHref`); `url` keeps the
 * original source, which stays the dedupe/coverage key. All fields are
 * factual — title from papers.data.ts, URL from the paper's source ref, note
 * naming where the course teaches it — nothing is authored here. Curriculum
 * order; a source shared by several papers keeps its first appearance.
 */
export const paperResources: ExternalResource[] = (() => {
  const derived: ExternalResource[] = [];
  const seenUrls = new Set<string>();
  for (const track of tracks) {
    if (track.kind === "example") continue;
    for (const mod of getModulesForTrack(track.id)) {
      for (const item of getItemsForModule(mod.id)) {
        if (item.kind !== "paper") continue;
        const url = paperSourceUrl(item.paper.source);
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        derived.push({
          id: `paper-res-${item.paper.id}`,
          title: item.paper.title,
          url,
          internalHref: `/tracks/${track.slug}/${mod.slug}/${item.paper.slug}`,
          type: item.paper.source.kind === "arxiv" ? "paper" : "blog",
          topics: [track.slug],
          level: "intermediate",
          note: `Course reading in the ${track.title} track (${mod.title}).`,
          coveredHere: true,
        });
      }
    }
  }
  return derived;
})();

/** Hand-curated entries plus the paper-derived ones — what the hub renders. */
export function getAllResources(): ExternalResource[] {
  return [...resources, ...paperResources];
}

export function getResourcesByTopics(topics: string[]): ExternalResource[] {
  if (topics.length === 0) return [];
  const set = new Set(topics);
  // Hand-curated entries only: modules' "further reading" should not offer a
  // paper the curriculum already assigns as a reading.
  return resources.filter((r) => r.topics.some((t) => set.has(t)));
}
