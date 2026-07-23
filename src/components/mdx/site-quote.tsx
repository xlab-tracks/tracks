import type { ReactNode } from "react";
import { SiteQuoteTrigger } from "./site-quote-trigger";

/**
 * External-site quote for lesson MDX:
 *
 *   <SiteQuote
 *     href="https://example.com/page"
 *     site="Site Name"
 *     title="Optional page title"
 *     excerpt="The verbatim quoted sentence(s) from the page."
 *   >the inline trigger phrase</SiteQuote>
 *
 * The trigger is a real external link (click / Enter opens the page in a
 * new tab) that previews the excerpt in the shared glossary hover card
 * (hover-intent on desktop, tap on touch — where the card's linked
 * attribution is the way through). All data is inline props — there is no
 * registry; the excerpt must be verbatim from the linked page and the
 * attribution (`site`, optional `title`) names where it came from.
 *
 * Everything is assembled server-side into finished nodes, like <Term/>.
 * The rendered anchor is literal JSX, so it is never internalized by
 * MdxLink and never scanned by `npm run readings:build` — a SiteQuote
 * always points at the real external URL.
 *
 * A usage missing its required props renders its children unstyled (plus a
 * dev-only inline marker) instead of a broken card.
 */
export function SiteQuote({
  href,
  site,
  title,
  excerpt,
  children,
}: {
  href: string;
  site: string;
  title?: string;
  excerpt: string;
  children?: ReactNode;
}) {
  // MDX bodies aren't type-checked, so guard the required props at runtime
  // (mirrors <Term/>'s unresolvable-ref behavior).
  if (!href || !site || !excerpt) {
    const missing = [
      !href && "href",
      !site && "site",
      !excerpt && "excerpt",
    ]
      .filter(Boolean)
      .join(", ");
    return (
      <>
        {children}
        {process.env.NODE_ENV !== "production" && (
          <span className="text-destructive align-super text-xs">
            {" "}
            [SiteQuote missing {missing}]
          </span>
        )}
      </>
    );
  }

  return (
    <SiteQuoteTrigger
      href={href}
      card={{
        term: title ?? site,
        definition: (
          // A block-styled span (not a blockquote): the shared card renders
          // the definition inside a <p>, where only phrasing content is
          // valid HTML.
          <span className="border-border block border-l-2 pl-2.5 italic">
            &ldquo;{excerpt}&rdquo;
          </span>
        ),
        related: [],
        source: {
          label: `${title ? site : (hostnameOf(href) ?? site)} ↗`,
          url: href,
        },
      }}
    >
      {children ?? title ?? site}
    </SiteQuoteTrigger>
  );
}

/** Display hostname for the attribution line when no page title is given. */
function hostnameOf(href: string): string | undefined {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}
