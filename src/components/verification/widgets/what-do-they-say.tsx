"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  WDTS_COPY as C,
  WDTS_FIGURES,
  type WdtsFigure,
  type WdtsFigureKey,
} from "@/lib/verification/data/what-do-they-say";

const BY_KEY: Record<WdtsFigureKey, WdtsFigure> = Object.fromEntries(
  WDTS_FIGURES.map((f) => [f.key, f]),
) as Record<WdtsFigureKey, WdtsFigure>;

/**
 * "Why are we concerned about the development of superintelligence?" — a
 * view-style dossier of six frontier-lab leaders. The interactive core is a
 * grid of six profile cards and a shadcn Dialog that opens each leader's
 * dossier (photo, definition/risk quotes, relevance, and sources). The framing
 * prose (definitions, risks, synthesis) now lives in the lesson MDX. Unbridged:
 * this is a reading, so `onComplete` is intentionally ignored.
 */
export function WhatDoTheySay() {
  const [openKey, setOpenKey] = useState<WdtsFigureKey | null>(null);
  const active = openKey ? BY_KEY[openKey] : null;

  return (
    <div className="not-prose my-6">
      {/* ---------- Profiles grid ---------- */}
      <div className="grid gap-3 sm:grid-cols-2">
        {WDTS_FIGURES.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setOpenKey(f.key)}
            className="group border-border bg-card hover:border-primary/40 hover:bg-muted/40 hover:shadow-soft flex flex-col rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
            aria-label={`View profile: ${f.name}, ${f.role}`}
          >
            <div className="flex items-center gap-3">
              <Avatar figure={f} className="size-11 text-sm" />
              <div className="min-w-0">
                <p className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
                  {f.code}
                </p>
                <p className="text-foreground truncate text-sm font-semibold">
                  {f.name}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {f.role}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
              {f.teaser}
            </p>
            <span className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium">
              {C.viewProfile.replace(" →", "")}
              <ArrowRight
                className="size-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </button>
        ))}
      </div>

      {/* ---------- Dossier dialog ---------- */}
      <Dialog
        open={openKey !== null}
        onOpenChange={(o) => !o && setOpenKey(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar figure={active} className="size-16 text-lg" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
                      {active.code}
                    </p>
                    <DialogTitle className="text-lg">
                      {active.name}
                    </DialogTitle>
                    <p className="text-muted-foreground text-sm">
                      {active.role}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-2 space-y-4">
                {active.sections.map((s, si) => (
                  <div
                    key={si}
                    className={cn(
                      s.matters &&
                        "border-primary/40 bg-primary/5 rounded-lg border-l-2 p-3",
                    )}
                  >
                    <p
                      className={cn(
                        "font-mono text-[11px] tracking-[0.12em] uppercase",
                        s.matters ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </p>
                    {s.paragraphsHtml.map((html, pi) => (
                      <p
                        key={pi}
                        className="text-foreground/90 mt-1.5 text-sm leading-relaxed [&_em]:font-medium [&_em]:not-italic [&_q]:italic"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    ))}
                  </div>
                ))}

                <div className="border-border border-t pt-3">
                  <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
                    Sources
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    {active.sources.map((src) => (
                      <a
                        key={src.href}
                        href={src.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
                      >
                        {src.label}
                      </a>
                    ))}
                  </div>
                  {active.photoSource && (
                    <p className="text-muted-foreground mt-3 text-[11px]">
                      Portrait:{" "}
                      <a
                        href={active.photoSource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:no-underline"
                      >
                        Wikimedia Commons
                      </a>{" "}
                      (CC BY / CC BY-SA)
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Avatar({
  figure,
  className,
}: {
  figure: WdtsFigure;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground border-border flex shrink-0 items-center justify-center overflow-hidden rounded-full border font-semibold",
        className,
      )}
      aria-hidden
    >
      {figure.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={figure.photo}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        figure.initials
      )}
    </span>
  );
}
