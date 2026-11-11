"use client";

import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type BlogPostTagItem = {
  id?: string;
  name: string;
  slug: string;
};

type BlogPostTagsProps = {
  tags: BlogPostTagItem[];
  className?: string;
};

/** One-line tag strip with expand/collapse when tags wrap. */
export function BlogPostTags({ tags, className }: BlogPostTagsProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }

    function measure() {
      if (!listRef.current) {
        return;
      }
      // Measure in collapsed mode so we know whether content overflows one line.
      const wasExpanded = expanded;
      if (wasExpanded) {
        listRef.current.classList.add("max-h-9", "overflow-hidden");
      }
      const overflows =
        listRef.current.scrollHeight > listRef.current.clientHeight + 2;
      if (wasExpanded) {
        listRef.current.classList.remove("max-h-9", "overflow-hidden");
      }
      setCanToggle(overflows);
    }

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [tags, expanded]);

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-4 flex items-start gap-1.5", className)}>
      <ul
        ref={listRef}
        aria-label="Tags"
        className={cn(
          "flex min-w-0 flex-1 flex-wrap gap-2",
          !expanded && "max-h-9 overflow-hidden",
        )}
      >
        {tags.map((tag) => (
          <li key={tag.id || tag.slug}>
            <Link
              href={`/tag/${tag.slug}`}
              className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {tag.name}
            </Link>
          </li>
        ))}
      </ul>
      {canToggle ? (
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse tags" : "Expand tags"}
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
