import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDemo } from "@/lib/demos/registry";
import { DemoById } from "@/components/demos/demo-renderer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ demoId: string }>;
}): Promise<Metadata> {
  const { demoId } = await params;
  return { title: getDemo(demoId)?.title ?? "Demo" };
}

// Chrome-less view for external <iframe> embedding (site header hides on /embed).
export default async function DemoEmbedPage({
  params,
}: {
  params: Promise<{ demoId: string }>;
}) {
  const { demoId } = await params;
  const demo = getDemo(demoId);
  if (!demo) notFound();

  return (
    <div className="p-4">
      <DemoById id={demo.id} />
    </div>
  );
}
