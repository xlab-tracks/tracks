import { tracks, modules, lessons } from "@/content/curriculum.data";
import { papers } from "@/content/papers.data";
import { readers } from "@/content/readers.data";
import { readerTocs } from "@/content/readers/tocs.generated";
import { exercises } from "@/content/exercises.data";
import { assessments } from "@/content/assessments.data";
import { resources } from "@/content/resources.data";
import type {
  Assessment,
  Exercise,
  ExternalResource,
  Lesson,
  Module,
  ModuleItem,
  Paper,
  Reader,
  ReaderTocEntry,
  Track,
} from "./types";

// In-memory indexes over the static content graph.
const trackById = new Map(tracks.map((t) => [t.id, t]));
const trackBySlug = new Map(tracks.map((t) => [t.slug, t]));
const moduleById = new Map(modules.map((m) => [m.id, m]));
const lessonById = new Map(lessons.map((l) => [l.id, l]));
const paperById = new Map(papers.map((p) => [p.id, p]));
const readerById = new Map(readers.map((r) => [r.id, r]));
const exerciseById = new Map(exercises.map((e) => [e.id, e]));
const assessmentById = new Map(assessments.map((a) => [a.id, a]));
const assessmentByModuleId = new Map(assessments.map((a) => [a.moduleId, a]));

// Inserted lessons live inside a paper's flow; map them back to their paper.
const paperByInsertedLessonId = new Map<string, Paper>(
  papers.flatMap((p) =>
    (p.insertions ?? []).flatMap((insertion) =>
      insertion.items
        .filter((item) => item.kind === "lesson")
        .map((item) => [item.id, p] as const),
    ),
  ),
);

// Concatenated lessons live inside a reader's page; map them back to the reader.
const readerByLessonId = new Map<string, Reader>(
  readers.flatMap((r) => r.lessonIds.map((id) => [id, r] as const)),
);

export { tracks, papers, readers, resources };
export type {
  Track,
  Module,
  Lesson,
  Paper,
  Reader,
  ReaderTocEntry,
  ModuleItem,
  Exercise,
  Assessment,
  ExternalResource,
};

// --- Basic lookups -------------------------------------------------------

export function getTrackBySlug(slug: string): Track | undefined {
  return trackBySlug.get(slug);
}
export function getTrackById(id: string): Track | undefined {
  return trackById.get(id);
}
export function getModuleById(id: string): Module | undefined {
  return moduleById.get(id);
}
export function getLessonById(id: string): Lesson | undefined {
  return lessonById.get(id);
}
export function getPaperById(id: string): Paper | undefined {
  return paperById.get(id);
}
export function getReaderById(id: string): Reader | undefined {
  return readerById.get(id);
}
/** A reader's precomputed section tree (from readers/tocs.generated.ts). */
export function getReaderToc(id: string): ReaderTocEntry[] {
  return readerTocs[id] ?? [];
}
export function getExerciseById(id: string): Exercise | undefined {
  return exerciseById.get(id);
}
export function getAssessmentById(id: string): Assessment | undefined {
  return assessmentById.get(id);
}
export function getAssessmentForModule(moduleId: string): Assessment | undefined {
  return assessmentByModuleId.get(moduleId);
}

export function getExercisesByIds(ids: string[]): Exercise[] {
  return ids
    .map((id) => exerciseById.get(id))
    .filter((e): e is Exercise => Boolean(e));
}

// --- Module items (lessons and papers, interleaved) ----------------------

/** Tiny discriminant unwrappers shared by pages and the sidebar. */
export function itemIdOf(item: ModuleItem): string {
  if (item.kind === "lesson") return item.lesson.id;
  if (item.kind === "paper") return item.paper.id;
  return item.reader.id;
}
export function itemSlugOf(item: ModuleItem): string {
  if (item.kind === "lesson") return item.lesson.slug;
  if (item.kind === "paper") return item.paper.slug;
  return item.reader.slug;
}
export function itemTitleOf(item: ModuleItem): string {
  if (item.kind === "lesson") return item.lesson.title;
  if (item.kind === "paper") return item.paper.title;
  return item.reader.title;
}

function resolveItem(id: string): ModuleItem | undefined {
  const lesson = lessonById.get(id);
  if (lesson) return { kind: "lesson", lesson };
  const paper = paperById.get(id);
  if (paper) return { kind: "paper", paper };
  const reader = readerById.get(id);
  if (reader) return { kind: "reader", reader };
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

/** Only the module's standalone lessons, in item order. */
export function getLessonsForModule(moduleId: string): Lesson[] {
  return getItemsForModule(moduleId)
    .filter((item) => item.kind === "lesson")
    .map((item) => item.lesson);
}

export function getTrackForModule(moduleId: string): Track | undefined {
  const mod = moduleById.get(moduleId);
  return mod ? trackById.get(mod.trackId) : undefined;
}

/** Inline lessons referenced by a paper's insertions, in insertion order. */
export function getInsertedLessonsForPaper(paperId: string): Lesson[] {
  const paper = paperById.get(paperId);
  if (!paper) return [];
  return (paper.insertions ?? [])
    .flatMap((insertion) => insertion.items)
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
  const moduleId =
    item.kind === "lesson"
      ? item.lesson.moduleId
      : item.kind === "reader"
        ? item.reader.moduleId
        : item.paper.moduleId;
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
  if (item.kind === "lesson") return [item.lesson.id];
  if (item.kind === "reader") return [item.reader.id];
  return [
    item.paper.id,
    ...getInsertedLessonsForPaper(item.paper.id).map((l) => l.id),
  ];
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
 * containing paper's page, and a reader's concatenated lessons resolve to the
 * reader's page (neither has a standalone route).
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
  const reader = readerById.get(contentId) ?? readerByLessonId.get(contentId);
  if (reader) {
    const mod = moduleById.get(reader.moduleId);
    const track = mod ? trackById.get(mod.trackId) : undefined;
    if (!mod || !track) return undefined;
    return {
      track,
      module: mod,
      href: `/tracks/${track.slug}/${mod.slug}/${reader.slug}`,
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

export function getResourcesByTopics(topics: string[]): ExternalResource[] {
  if (topics.length === 0) return [];
  const set = new Set(topics);
  return resources.filter((r) => r.topics.some((t) => set.has(t)));
}
