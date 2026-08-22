import Link from "next/link";

import type { BlogPost } from "@/lib/api/blog.api";
import { resolveCatalogAssetUrl } from "@/lib/catalog/catalog-image-url";
import { cn } from "@/lib/utils";

type BlogPostCardProps = {
  post: BlogPost;
  className?: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogPostCard({ post, className }: BlogPostCardProps) {
  const dateLabel = formatDate(post.publishedAt || post.createdAt);
  const cover =
    resolveCatalogAssetUrl(post.coverImageUrl) ||
    resolveCatalogAssetUrl(post.coverImagePath);

  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl border border-border bg-card/40",
        className,
      )}
    >
      <Link href={`/blog/${post.slug}`} className="block min-w-0">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="aspect-[16/10] h-auto w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/10] w-full bg-gradient-to-br from-[color-mix(in_srgb,#148547_18%,transparent)] to-muted" />
        )}
        <div className="space-y-2 p-4 sm:p-5">
          {dateLabel ? (
            <p className="text-xs text-muted-foreground">{dateLabel}</p>
          ) : null}
          <h3 className="text-lg font-semibold tracking-tight text-pretty">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}
          <span className="inline-flex text-sm font-medium text-primary underline-offset-4">
            Read more
          </span>
        </div>
      </Link>
    </article>
  );
}
