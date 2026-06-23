import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemo } from "@/lib/demos/registry";
import { DemoById } from "@/components/demos/demo-renderer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ demoId: string }>;
}): Promise<Metadata> {
  const { demoId } = await params;
  return { title: getDemo(demoId)?.title ?? "Demo" };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ demoId: string }>;
}) {
  const { demoId } = await params;
  const demo = getDemo(demoId);
  if (!demo) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <Breadcrumbs
        items={[{ label: "Demos", href: "/demos" }, { label: demo.title }]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{demo.title}</h1>
      {demo.description && (
        <p className="text-muted-foreground mt-2">{demo.description}</p>
      )}

      <div className="mt-6">
        <DemoById id={demo.id} />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Embed this demo</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Use the chrome-less{" "}
          <Link href={`/demos/${demo.id}/embed`} className="underline">
            embed view
          </Link>{" "}
          inside an iframe:
        </p>
        <pre className="bg-muted text-muted-foreground mt-2 overflow-x-auto rounded-lg p-3 text-xs">
          <code>{`<iframe src="/demos/${demo.id}/embed" width="100%" height="360" style="border:0"></iframe>`}</code>
        </pre>
      </section>
    </main>
  );
}
