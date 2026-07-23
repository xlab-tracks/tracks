import type { Metadata } from "next";
import Link from "next/link";
import { getModulesForTrack, tracks } from "@/lib/content";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Tracks" };

const KIND_LABEL: Record<string, string> = {
  foundations: "Foundations",
  technical: "Technical",
  governance: "Governance",
  example: "Example",
};

export default function TracksPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 lg:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tracks" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Tracks</h1>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {tracks.map((track) => {
          const moduleCount = getModulesForTrack(track.id).length;
          return (
            <Card key={track.id} className="shadow-soft flex flex-col">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{KIND_LABEL[track.kind]}</Badge>
                </div>
                <CardTitle className="mt-2 text-xl">{track.title}</CardTitle>
                <CardDescription>{track.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground mt-auto text-sm">
                {moduleCount} module{moduleCount === 1 ? "" : "s"}
                {track.estimatedHours ? ` · ~${track.estimatedHours}h` : ""}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/tracks/${track.slug}`}>Open track</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
