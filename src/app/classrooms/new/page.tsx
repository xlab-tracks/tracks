import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { tracks } from "@/lib/content";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CreateClassroomForm } from "@/components/classrooms/create-classroom-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create classroom" };

export default async function NewClassroomPage() {
  await requireUser();
  const trackOptions = tracks.map((t) => ({ id: t.id, title: t.title }));

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 lg:px-6">
      <Breadcrumbs
        items={[{ label: "Classrooms", href: "/classrooms" }, { label: "Create" }]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Create a classroom</h1>
      <p className="text-muted-foreground mt-2">
        You'll be the instructor. Share the join code with your students.
      </p>
      <Card className="shadow-soft mt-6">
        <CardContent className="pt-6">
          <CreateClassroomForm trackOptions={trackOptions} />
        </CardContent>
      </Card>
    </main>
  );
}
