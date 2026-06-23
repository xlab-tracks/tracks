import type { ComponentType } from "react";

/**
 * A self-contained, embeddable demo. Each demo is a client component with no
 * dependence on app internals, so the same component renders inside lesson MDX,
 * the gallery, a standalone page, or an external <iframe> via the embed route.
 */
export interface DemoDefinition {
  id: string;
  title: string;
  description?: string;
  component: ComponentType;
  tags?: string[];
}
