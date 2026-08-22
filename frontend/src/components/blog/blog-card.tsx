import Link from "next/link";

import type { BlogPost } from "@/lib/api/blog.api";
import { resolveCatalogAssetUrl } from "@/lib/catalog/catalog-image-url";
import { cn } from "@/lib/utils";

type BlogCardProps = {
  post: BlogPost;
  className?: string;
};

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  try {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function BlogCard({ post, className }: BlogCardProps) {
  const cover =
    resolveCatalogAssetUrl(post.coverImageUrl) ||
    resolveCatalogAssetUrl(post.coverImagePath);
  const dateLabel = formatDate(post.publishedAt);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="size-full max-w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No cover
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        {dateLabel ? (
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {dateLabel}
          </p>
        ) : null}
        <h3 className="text-pretty text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt?.trim() ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt.trim()}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
