"use client";

import { Component, type ReactNode, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

class DemoErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <p className="text-destructive text-sm">This demo failed to render.</p>
      );
    }
    return this.props.children;
  }
}

export interface DemoFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function DemoFrame({ title, description, children }: DemoFrameProps) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="not-prose border-border bg-card shadow-soft my-6 overflow-hidden rounded-xl border">
      <div className="border-border bg-muted/30 flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setResetKey((k) => k + 1)}
          className="text-muted-foreground hover:text-foreground gap-1 text-xs"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Reset
        </Button>
      </div>
      <div className="p-4">
        <DemoErrorBoundary key={resetKey}>{children}</DemoErrorBoundary>
      </div>
    </div>
  );
}
