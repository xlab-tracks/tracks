"use client";

import { getDemo } from "@/lib/demos/registry";
import { DemoFrame } from "./demo-frame";

export interface DemoByIdProps {
  id: string;
  /** When false, render the bare demo without the titled frame. */
  framed?: boolean;
}

export function DemoById({ id, framed = true }: DemoByIdProps) {
  const demo = getDemo(id);
  if (!demo) {
    return (
      <div className="not-prose border-destructive/40 bg-destructive/5 text-destructive my-6 rounded-xl border p-4 text-sm">
        Unknown demo: <code>{id}</code>
      </div>
    );
  }
  const Component = demo.component;
  if (!framed) return <Component />;
  return (
    <DemoFrame title={demo.title} description={demo.description}>
      <Component />
    </DemoFrame>
  );
}
