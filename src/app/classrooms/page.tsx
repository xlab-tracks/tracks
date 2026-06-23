import type { Metadata } from "next";
import Link from "next/link";
import { LogIn, Plus, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyClassrooms } from "@/lib/classrooms";
import { getTrackById } from "@/lib/content";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Classrooms" };

export default async function ClassroomsPage() {
  const user = await requireUser();
  const memberships = await getMyClassrooms(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 lg:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Classrooms" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Classrooms</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/classrooms/join">
              <LogIn className="mr-1 size-4" aria-hidden /> Join
            </Link>
          </Button>
          <Button asChild>
            <Link href="/classrooms/new">
              <Plus className="mr-1 size-4" aria-hidden /> Create
            </Link>
          </Button>
        </div>
      </div>

      {memberships.length === 0 ? (
        <p className="text-muted-foreground mt-8">
          You're not in any classrooms yet. Create one as an instructor, or join
          with a code.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {memberships.map((m) => {
            const track = m.classroom.trackId
              ? getTrackById(m.classroom.trackId)
              : null;
            return (
              <Card key={m.classroom.id} className="shadow-soft flex flex-col">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.role === "instructor" ? "default" : "secondary"}>
                      {m.role}
                    </Badge>
                    {track && (
                      <Badge variant="outline">{track.shortTitle ?? track.title}</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-lg">{m.classroom.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden />
                    {m.classroom._count.memberships} members
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={`/classrooms/${m.classroom.id}`}>Open</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
