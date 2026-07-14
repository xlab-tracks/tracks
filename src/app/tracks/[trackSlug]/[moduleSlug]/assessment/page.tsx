import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getAssessmentForModule, getModuleBySlugs } from "@/lib/content";
import { DELIVERABLE_FORMAT_LABELS } from "@/lib/content/types";
import { isAccessLocked } from "@/lib/content/prerequisites";
import { getCurrentUser } from "@/lib/auth";
import { getPrerequisiteStatus, getSubmission } from "@/lib/progress";
import { saveWritingDraft, submitWriting } from "@/app/actions/submissions";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WritingEditor, type WritingValues } from "@/components/exercises/writing-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackSlug: string; moduleSlug: string }>;
}): Promise<Metadata> {
  const { trackSlug, moduleSlug } = await params;
  const resolved = getModuleBySlugs(trackSlug, moduleSlug);
  const assessment = resolved ? getAssessmentForModule(resolved.module.id) : undefined;
  return { title: assessment?.title ?? "Assessment" };
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ trackSlug: string; moduleSlug: string }>;
}) {
  const { trackSlug, moduleSlug } = await params;
  const resolved = getModuleBySlugs(trackSlug, moduleSlug);
  if (!resolved) notFound();
  const { track, module } = resolved;
  const assessment = getAssessmentForModule(module.id);
  if (!assessment) notFound();

  const user = await getCurrentUser();

  // Hard prerequisite enforcement: a locked module's assessment is off-limits
  // to signed-in learners too (mirrors the item and module pages). Signed-out
  // visitors may preview.
  if (user && track.prerequisiteEnforcement === "hard") {
    const prereqStatuses = await getPrerequisiteStatus(user.id, module.id);
    if (
      isAccessLocked(
        track.prerequisiteEnforcement,
        prereqStatuses.map((s) => s.completed),
      )
    ) {
      redirect(`/tracks/${track.slug}/${module.slug}`);
    }
  }

  const submission = user
    ? await getSubmission(user.id, assessment.id, "assessment")
    : null;

  return (
    <div className="max-w-3xl px-4 py-8 lg:px-8">
      <Breadcrumbs
        items={[
          { label: track.title, href: `/tracks/${track.slug}` },
          { label: module.title, href: `/tracks/${track.slug}/${module.slug}` },
          { label: "Assessment" },
        ]}
      />

      <p className="text-muted-foreground text-sm">
        Module {module.order}: {module.title}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <FileText className="size-4" aria-hidden />
        <Badge variant="secondary">
          {DELIVERABLE_FORMAT_LABELS[assessment.format]}
        </Badge>
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {assessment.title}
      </h1>
      <p className="text-muted-foreground mt-2">{assessment.prompt}</p>

      <Card className="shadow-soft mt-6">
        <CardContent className="pt-6">
          {user ? (
            <WritingEditor
              sections={assessment.sections}
              rubric={assessment.rubric}
              minWords={assessment.minWords}
              maxWords={assessment.maxWords}
              initialValues={(submission?.responseJson as WritingValues | null) ?? undefined}
              submitted={submission?.status === "submitted"}
              onSaveDraft={saveWritingDraft.bind(null, assessment.id, "assessment", assessment.format)}
              onSubmit={submitWriting.bind(null, assessment.id, "assessment", assessment.format)}
              submitLabel="Submit assessment"
            />
          ) : (
            <>
              <WritingEditor
                sections={assessment.sections}
                rubric={assessment.rubric}
                minWords={assessment.minWords}
                maxWords={assessment.maxWords}
              />
              <p className="text-muted-foreground mt-3 text-sm">
                <Link href="/login" className="underline">
                  Sign in
                </Link>{" "}
                to save a draft and submit.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
