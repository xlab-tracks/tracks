import { DemoById } from "@/components/demos/demo-renderer";

export interface DemoProps {
  /** Registry ID of the demo to render. */
  id: string;
}

// MDX entry point: <Demo id="…"/> renders the registered demo in its frame.
export function Demo({ id }: DemoProps) {
  return <DemoById id={id} />;
}
