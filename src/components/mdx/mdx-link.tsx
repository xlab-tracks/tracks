import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { resolveInternalReadingHref } from "@/lib/readings/resolve";

/**
 * Renderer for markdown links in lesson MDX. Substack / LessWrong post links
 * open in the internal reader when a course page or linked reading exists
 * (the same resolver post-sourced papers use); anything unresolved — other
 * domains, comment permalinks, anchored links — stays a plain external link.
 * Links written as literal JSX `<a href>` bypass this renderer entirely (MDX
 * only maps markdown-derived elements): that is the authoring opt-out for
 * links that must stay external, e.g. a verbatim-reproduced lesson's
 * attribution line, and `npm run readings:build` skips them for the same
 * reason.
 */
export function MdxLink({
  href,
  children,
  ...rest
}: ComponentPropsWithoutRef<"a">) {
  const internal = href ? resolveInternalReadingHref(href) : null;
  if (internal) {
    return (
      <Link href={internal} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
