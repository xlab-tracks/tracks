import type { Metadata } from "next";
import { getAllResources } from "@/lib/content";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ResourceHub } from "@/components/resources/resource-hub";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Resources" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Resource hub</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        One curated place for what to read to get good at AI safety — including
        the background we deliberately don&apos;t teach. The whole point is to
        de-centralize the messy onboarding pipeline.
      </p>
      <ResourceHub resources={getAllResources()} />
    </main>
  );
}
