import { Skeleton } from "@/components/ui/skeleton";

export default function ClassroomsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8">
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
