"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type {
  ExternalResource,
  ResourceLevel,
  ResourceType,
} from "@/lib/content/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LEVELS: (ResourceLevel | "all")[] = [
  "all",
  "intro",
  "intermediate",
  "advanced",
];

const selectClass =
  "border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm capitalize focus-visible:ring-2 focus-visible:outline-none";

function ResourceItem({ resource }: { resource: ExternalResource }) {
  const cardClass =
    "border-border hover:bg-muted shadow-soft block rounded-xl border p-4 transition-colors";
  const Icon = resource.internalHref ? ArrowRight : ExternalLink;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium">
          {resource.title}
          {resource.author && (
            <span className="text-muted-foreground font-normal">
              {" "}
              · {resource.author}
            </span>
          )}
        </span>
        <Icon
          className="text-muted-foreground mt-0.5 size-4 shrink-0"
          aria-hidden
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="capitalize">
          {resource.type}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {resource.level}
        </Badge>
        {resource.topics.map((t) => (
          <Badge key={t} variant="outline" className="text-muted-foreground">
            {t}
          </Badge>
        ))}
      </div>
      {resource.note && (
        <p className="text-muted-foreground mt-2 text-sm">{resource.note}</p>
      )}
    </>
  );
  return (
    <li>
      {resource.internalHref ? (
        <Link href={resource.internalHref} className={cardClass}>
          {body}
        </Link>
      ) : (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cardClass}
        >
          {body}
        </a>
      )}
    </li>
  );
}

function Section({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: ExternalResource[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <ResourceItem key={r.id} resource={r} />
        ))}
      </ul>
    </section>
  );
}

export function ResourceHub({ resources }: { resources: ExternalResource[] }) {
  const allTopics = useMemo(
    () => Array.from(new Set(resources.flatMap((r) => r.topics))).sort(),
    [resources],
  );
  const allTypes = useMemo(
    () => Array.from(new Set(resources.map((r) => r.type))).sort(),
    [resources],
  );

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [level, setLevel] = useState<ResourceLevel | "all">("all");
  const [type, setType] = useState<ResourceType | "all">("all");

  const filtered = resources.filter((r) => {
    if (topic && !r.topics.includes(topic)) return false;
    if (level !== "all" && r.level !== level) return false;
    if (type !== "all" && r.type !== type) return false;
    if (query) {
      const haystack =
        `${r.title} ${r.author ?? ""} ${r.note ?? ""} ${r.topics.join(" ")}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const core = filtered.filter((r) => r.coveredHere && r.level === "intro");
  const deeper = filtered.filter((r) => r.coveredHere && r.level !== "intro");
  const background = filtered.filter((r) => !r.coveredHere);
  const empty = filtered.length === 0;

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search resources…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <select
          aria-label="Level"
          value={level}
          onChange={(e) => setLevel(e.target.value as ResourceLevel | "all")}
          className={selectClass}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l === "all" ? "All levels" : l}
            </option>
          ))}
        </select>
        <select
          aria-label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as ResourceType | "all")}
          className={selectClass}
        >
          <option value="all">All types</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          aria-pressed={topic === null}
          onClick={() => setTopic(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            topic === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted",
          )}
        >
          All topics
        </button>
        {allTopics.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={topic === t}
            onClick={() => setTopic(topic === t ? null : t)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              topic === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {empty ? (
        <p className="text-muted-foreground mt-8 text-sm">
          No resources match your filters.
        </p>
      ) : (
        <>
          <Section
            title="Core reading"
            description="Start here — introductory material we recommend."
            items={core}
          />
          <Section
            title="Course Material References"
            description="Texts we used & referenced in tracks."
            items={deeper}
          />
          <Section
            title="Background we don't teach — learn it elsewhere"
            description="Prerequisite knowledge (e.g. ML fundamentals) we assume but don't cover."
            items={background}
          />
        </>
      )}
    </div>
  );
}
