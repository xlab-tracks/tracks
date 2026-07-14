import { Skeleton } from "@/components/ui/skeleton";

// Streamed while the signed-in progress/prerequisite reads resolve; the static
// content then swaps in. Mirrors the sidebar + content column layout.
export default function TrackLoading() {
  return (
    <div className="flex w-full flex-1 flex-col lg:flex-row">
      <aside className="border-border bg-card/40 hidden w-72 shrink-0 border-r p-4 lg:block">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-6 w-40" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 lg:px-8">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-9 w-2/3" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
