"use client";

import { Component, type ComponentType, type ReactNode } from "react";
import { getVerificationWidget } from "./widgets/registry";
import { useVerificationCompletion } from "./kit/use-completion";
import type { VerificationWidgetProps } from "./kit/types";

/**
 * Client host for a Verification interactive: looks up the native React widget
 * registered for this page id, wires its completion, and renders it inside an
 * error boundary. Every id has a widget (see widgets/registry.tsx); an unknown
 * id renders an inline error.
 */
export function VerificationWidgetHost({
  pageId,
  title,
  bridged,
  contentId,
  canTrack,
  initialCompleted,
}: {
  pageId: string;
  title: string;
  bridged: boolean;
  contentId: string;
  canTrack: boolean;
  initialCompleted: boolean;
}) {
  const Widget = getVerificationWidget(pageId);

  if (!Widget) {
    return (
      <div className="not-prose border-destructive/40 bg-destructive/5 text-destructive my-6 rounded-xl border p-4 text-sm">
        No widget registered for <code>{pageId}</code>.
      </div>
    );
  }

  return (
    <WidgetErrorBoundary title={title}>
      <MountedWidget
        Widget={Widget}
        contentId={contentId}
        bridged={bridged}
        canTrack={canTrack}
        initialCompleted={initialCompleted}
      />
    </WidgetErrorBoundary>
  );
}

function MountedWidget({
  Widget,
  contentId,
  bridged,
  canTrack,
  initialCompleted,
}: {
  Widget: ComponentType<VerificationWidgetProps>;
  contentId: string;
  bridged: boolean;
  canTrack: boolean;
  initialCompleted: boolean;
}) {
  const complete = useVerificationCompletion(contentId, {
    bridged,
    canTrack,
    initialCompleted,
  });
  return <Widget onComplete={complete} initialCompleted={initialCompleted} />;
}

class WidgetErrorBoundary extends Component<
  { title: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="not-prose border-destructive/40 bg-destructive/5 text-destructive my-6 rounded-xl border p-4 text-sm">
          This interactive failed to render.
        </div>
      );
    }
    return this.props.children;
  }
}
