import { notFound } from "next/navigation";
import {
  getExerciseById,
  getLessonById,
  getTrackOutline,
  getTrackProgressContentIds,
  type Paper,
} from "@/lib/content";
import { EXERCISE_TYPE_LABELS } from "@/lib/content/types";
import { isAccessLocked } from "@/lib/content/prerequisites";
import { getCurrentUser } from "@/lib/auth";
import { getPaperArtifact } from "@/lib/arxiv/artifacts";
import { getCompletedLessonIds, getPrerequisiteStatus } from "@/lib/progress";
import {
  buildPaperNav,
  type PaperNavInsertion,
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
  const paperNavs: Record<string, PaperNavItem[]> = {};
  for (const paper of papers) {
    paperNavs[paper.id] = await buildNavForPaper(paper);
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
  const insertions: PaperNavInsertion[] = (paper.insertions ?? []).map(
    (insertion) => ({
      sectionId: insertion.sectionId,
      items: insertion.items.map((item) => ({
        ...item,
        title:
          item.kind === "lesson"
            ? (getLessonById(item.id)?.title ?? "Lesson")
            : exerciseLabel(item.id),
      })),
    }),
  );
  const artifact = await getPaperArtifact(paper.source.arxivId);
  // Non-ready artifacts still get insertion-only entries so the fallback
  // page's activities remain navigable.
  const toc = artifact.state === "ready" ? artifact.paper.toc : [];
  return buildPaperNav(toc, insertions);
}

function exerciseLabel(exerciseId: string): string {
  const exercise = getExerciseById(exerciseId);
  return exercise ? EXERCISE_TYPE_LABELS[exercise.type] : "Exercise";
}
