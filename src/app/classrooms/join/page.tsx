import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JoinClassroomForm } from "@/components/classrooms/join-classroom-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Join classroom" };

export default async function JoinClassroomPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 lg:px-6">
      <Breadcrumbs
        items={[{ label: "Classrooms", href: "/classrooms" }, { label: "Join" }]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Join a classroom</h1>
      <p className="text-muted-foreground mt-2">
        Enter the code your instructor shared with you.
      </p>
      <Card className="shadow-soft mt-6">
        <CardContent className="pt-6">
          <JoinClassroomForm />
        </CardContent>
      </Card>
    </main>
  );
}
