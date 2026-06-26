import { notFound } from "next/navigation";
import { getTrackLessonIds, getTrackOutline } from "@/lib/content";
import { isAccessLocked } from "@/lib/content/prerequisites";
import { getCurrentUser } from "@/lib/auth";
import { getCompletedLessonIds, getPrerequisiteStatus } from "@/lib/progress";
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
  const completedLessonIds = user
    ? await getCompletedLessonIds(user.id, getTrackLessonIds(outline.track.id))
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

  return (
    <div className="flex w-full flex-1 flex-col lg:flex-row">
      <TrackSidebar
        outline={outline}
        completedLessonIds={completedLessonIds}
        lockedModuleSlugs={lockedModuleSlugs}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
