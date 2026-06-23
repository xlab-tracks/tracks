import Link from "next/link";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import type { PrerequisiteStatus } from "@/lib/progress";
import type { PrerequisiteEnforcement } from "@/lib/content/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PrerequisitePanel({
  statuses,
  enforcement,
  currentTrackId,
}: {
  statuses: PrerequisiteStatus[];
  enforcement: PrerequisiteEnforcement;
  currentTrackId: string;
}) {
  if (statuses.length === 0) return null;

  return (
    <Card className="bg-muted/40 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="size-4" aria-hidden /> Prerequisites
        </CardTitle>
        <CardDescription>
          {enforcement === "hard"
            ? "Required — complete these to unlock this module."
            : "Recommended before you start this module."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {statuses.map((status) => {
            const crossTrack = status.module.trackId !== currentTrackId;
            return (
              <li key={status.module.id} className="flex items-center gap-2">
                {status.completed ? (
                  <CheckCircle2 className="text-foreground size-4 shrink-0" aria-hidden />
                ) : (
                  <Circle className="size-4 shrink-0 opacity-40" aria-hidden />
                )}
                {status.trackSlug ? (
                  <Link
                    href={`/tracks/${status.trackSlug}/${status.module.slug}`}
                    className="hover:underline"
                  >
                    {status.module.title}
                  </Link>
                ) : (
                  <span>{status.module.title}</span>
                )}
                {crossTrack && status.trackLabel && (
                  <Badge variant="outline" className="text-xs">
                    {status.trackLabel}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
