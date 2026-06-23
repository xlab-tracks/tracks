import type { Metadata } from "next";
import Link from "next/link";
import { listDemos } from "@/lib/demos/registry";
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

export const metadata: Metadata = { title: "Demos" };

export default function DemosPage() {
  const demos = listDemos();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 lg:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Demos" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Interactive demos</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        Lorem ipsum — reusable demos that embed inside any lesson, stand alone, or
        drop into an external page via an iframe.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {demos.map((demo) => (
          <Card key={demo.id} className="shadow-soft flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{demo.title}</CardTitle>
              {demo.description && (
                <CardDescription>{demo.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap gap-1.5">
              {demo.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </CardContent>
            <CardFooter className="gap-2">
              <Button asChild>
                <Link href={`/demos/${demo.id}`}>Open</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/demos/${demo.id}/embed`}>Embed</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
