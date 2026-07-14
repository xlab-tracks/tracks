"use client";

import { Fragment, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Renders authored copy containing `[[term]]` or `[[term|definition]]` markup,
 * turning each term into a dotted-underline trigger with a hover/focus tooltip.
 * Definitions come inline (`[[term|def]]`) or from a supplied glossary. Copy is
 * trusted authored content; learner text must never be passed here.
 */
export function TermText({
  text,
  glossary = {},
  className,
}: {
  text: string;
  glossary?: Record<string, string>;
  className?: string;
}) {
  const parts = parseTerms(text, glossary);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.kind === "text" ? (
          <Fragment key={i}>{part.text}</Fragment>
        ) : (
          <Term key={i} definition={part.definition}>
            {part.term}
          </Term>
        ),
      )}
    </span>
  );
}

export function Term({
  children,
  definition,
}: {
  children: ReactNode;
  definition: string;
}) {
  if (!definition) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="decoration-muted-foreground/60 cursor-help underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1"
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-pretty">
        {definition}
      </TooltipContent>
    </Tooltip>
  );
}

type Part =
  | { kind: "text"; text: string }
  | { kind: "term"; term: string; definition: string };

const TERM_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function parseTerms(text: string, glossary: Record<string, string>): Part[] {
  const parts: Part[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TERM_RE.lastIndex = 0;
  while ((m = TERM_RE.exec(text))) {
    if (m.index > last) parts.push({ kind: "text", text: text.slice(last, m.index) });
    const term = m[1];
    const definition =
      m[2] ?? glossary[term.toLowerCase()] ?? glossary[term] ?? "";
    parts.push({ kind: "term", term, definition });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}
