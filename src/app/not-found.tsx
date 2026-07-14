import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-muted-foreground font-mono text-sm">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        This page doesn&apos;t exist, or you may no longer have access to it (for
        example, if you were removed from a classroom).
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/tracks">Browse tracks</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
