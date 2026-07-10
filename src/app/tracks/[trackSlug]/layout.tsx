import { notFound } from "next/navigation";
import {
  getExerciseById,
  getLessonById,
  getReaderToc,
  getTrackOutline,
  getTrackProgressContentIds,
  type Paper,
  type Reader,
} from "@/lib/content";
import {
  EXERCISE_TYPE_LABELS,
  getExerciseDisplayTitle,
} from "@/lib/content/types";
import { isAccessLocked } from "@/lib/content/prerequisites";
import { getCurrentUser } from "@/lib/auth";
import { getDemo } from "@/lib/demos/registry";
import { getPaperArtifact } from "@/lib/arxiv/artifacts";
import { getCompletedLessonIds, getPrerequisiteStatus } from "@/lib/progress";
import {
  buildPaperNav,
  type PaperNavActivity,
  type PaperNavItem,
} from "@/lib/papers/paper-nav";
import { TrackSidebar } from "@/components/layout/track-sidebar";

export default async function TrackLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  const outline = getTrackOutline(trackSlug);
  if (!outline) notFound();

  const user = await getCurrentUser();
  const completedContentIds = user
    ? await getCompletedLessonIds(
        user.id,
        getTrackProgressContentIds(outline.track.id),
      )
    : [];

  let lockedModuleSlugs: string[] = [];
  if (user && outline.track.prerequisiteEnforcement === "hard") {
    const results = await Promise.all(
      outline.modules.map(async ({ module }) => {
        const statuses = await getPrerequisiteStatus(user.id, module.id);
        return isAccessLocked(
          outline.track.prerequisiteEnforcement,
          statuses.map((s) => s.completed),
        )
          ? module.slug
          : null;
      }),
    );
    lockedModuleSlugs = results.filter((s): s is string => s !== null);
  }

  // Per-paper section navigation for the sidebar. Artifacts are statically
  // imported JSON modules (cached); only the small toc reaches the client.
  const papers = outline.modules.flatMap(({ items }) =>
    items.flatMap((item) => (item.kind === "paper" ? [item.paper] : [])),
  );
  const readers = outline.modules.flatMap(({ items }) =>
    items.flatMap((item) => (item.kind === "reader" ? [item.reader] : [])),
  );
  // Papers and readers both dock a section panel keyed by item id in one map.
  const paperNavs: Record<string, PaperNavItem[]> = {};
  for (const paper of papers) {
    paperNavs[paper.id] = await buildNavForPaper(paper);
  }
  for (const reader of readers) {
    paperNavs[reader.id] = buildNavForReader(reader);
  }

  return (
    <div className="flex w-full flex-1 flex-col lg:flex-row">
      <TrackSidebar
        outline={outline}
        completedContentIds={completedContentIds}
        lockedModuleSlugs={lockedModuleSlugs}
        paperNavs={paperNavs}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

async function buildNavForPaper(paper: Paper): Promise<PaperNavItem[]> {
  const activities: PaperNavActivity[] = (paper.edits ?? [])
    .filter((edit) => edit.op === "activity")
    .map((edit) => ({
      after:
        "sectionEnd" in edit.after
          ? { sectionEnd: edit.after.sectionEnd }
          : { anchor: edit.after.anchor, s: edit.after.s },
      items: edit.items.map((item) => ({
        ...item,
        title:
          item.kind === "lesson"
            ? (getLessonById(item.id)?.title ?? "Lesson")
            : item.kind === "demo"
              ? (getDemo(item.id)?.title ?? "Demo")
              : item.kind === "sequence"
                ? // Same default as ExerciseSequenceCard's eyebrow.
                  (item.label ?? EXERCISE_TYPE_LABELS["understanding-check"])
                : exerciseLabel(item.id),
      })),
    }));
  const artifact = await getPaperArtifact(paper.source.arxivId);
  // Non-ready artifacts still get activity-only entries so the fallback
  // page's activities remain navigable.
  const toc = artifact.state === "ready" ? artifact.paper.toc : [];
  return buildPaperNav(toc, activities);
}

function exerciseLabel(exerciseId: string): string {
  const exercise = getExerciseById(exerciseId);
  return exercise ? getExerciseDisplayTitle(exercise) : "Exercise";
}

// A reader's markdown toc has no inserted activities, so it maps straight to
// section nav items. Levels are bumped by one (a reader's level-1 lesson title
// sits where a paper's level-2 top section does) so PaperSectionNav indents it
// consistently with papers.
function buildNavForReader(reader: Reader): PaperNavItem[] {
  return getReaderToc(reader.id).map((entry) => ({
    kind: "section",
    id: entry.id,
    title: entry.title,
    number: entry.number,
    level: entry.level + 1,
  }));
}
