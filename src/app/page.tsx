import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          XLab · AI Safety Learning
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Tracks
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-lg text-balance">
          A modular, hands-on path into AI safety — technical and governance
          tracks, interactive demos, real writing practice, and a curated
          resource hub.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/tracks">Browse tracks</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/resources">Resource hub</Link>
        </Button>
      </div>
    </main>
  );
}
