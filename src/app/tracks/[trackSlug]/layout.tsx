import { notFound } from "next/navigation";
import {
  getExerciseById,
  getLessonById,
  getTrackOutline,
  getTrackProgressContentIds,
  type Paper,
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
import { getLessonSections } from "@/components/mdx/lesson-content";
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
  // The lesson/paper content itself is fully static; only the progress
  // checkmarks and prerequisite locks need the DB. If that read fails, degrade
  // to the signed-out view (no checkmarks, nothing locked) rather than crash a
  // page that would otherwise render entirely from the static content graph.
  let completedContentIds: string[] = [];
  let lockedModuleSlugs: string[] = [];
  if (user) {
    try {
      completedContentIds = await getCompletedLessonIds(
        user.id,
        getTrackProgressContentIds(outline.track.id),
      );
      if (outline.track.prerequisiteEnforcement === "hard") {
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
    } catch {
      completedContentIds = [];
      lockedModuleSlugs = [];
    }
  }

  // Per-item section navigation for the sidebar: papers get their toc plus
  // inserted activities; lessons get their ##/### heading tree (exported from
  // the compiled MDX by rehype-lesson-sections). Artifacts and MDX bodies are
  // statically bundled modules (cached); only the small nav reaches the client.
  const itemNavs: Record<string, PaperNavItem[]> = {};
  for (const { items } of outline.modules) {
    for (const item of items) {
      if (item.kind === "paper") {
        itemNavs[item.paper.id] = await buildNavForPaper(item.paper);
        continue;
      }
      const sections = await getLessonSections(item.lesson.contentRef);
      // A single entry is noise — dock the panel only for real multi-section
      // lessons (papers always dock: their toc is never this small).
      if (sections.length < 2) continue;
      itemNavs[item.lesson.id] = sections.map((section) => ({
        kind: "section",
        id: section.id,
        title: section.title,
        number: "",
        level: section.level,
      }));
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col lg:flex-row">
      <TrackSidebar
        outline={outline}
        completedContentIds={completedContentIds}
        lockedModuleSlugs={lockedModuleSlugs}
        itemNavs={itemNavs}
      />
      <main className="min-w-0 flex-1">{children}</main>
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
