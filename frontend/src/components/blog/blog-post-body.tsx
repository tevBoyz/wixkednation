import {
  BlogPostTags,
  type BlogPostTagItem,
} from "@/components/blog/blog-post-tags";
import { resolveCatalogAssetUrl } from "@/lib/catalog/catalog-image-url";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize-blog-html";
import { cn } from "@/lib/utils";

export { sanitizeBlogHtml } from "@/lib/blog/sanitize-blog-html";

type BlogPostBodyProps = {
  title?: string;
  bodyHtml?: string | null;
  /** @deprecated prefer bodyHtml alone for compact body-only render */
  html?: string | null;
  coverImageUrl?: string | null;
  coverImagePath?: string | null;
  publishedAt?: string | null;
  authorName?: string | null;
  excerpt?: string | null;
  tags?: BlogPostTagItem[];
  className?: string;
  /** Compact preview mode (admin). */
  compact?: boolean;
  /** When true, only render sanitized HTML (no title/cover chrome). */
  bodyOnly?: boolean;
};

function formatPublishedDate(value?: string | null): string | null {
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
      month: "long",
      day: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function BlogPostBody({
  title,
  bodyHtml,
  html,
  coverImageUrl,
  coverImagePath,
  publishedAt,
  authorName,
  excerpt,
  tags,
  className,
  compact = false,
  bodyOnly = false,
}: BlogPostBodyProps) {
  const coverSrc =
    resolveCatalogAssetUrl(coverImageUrl) ||
    resolveCatalogAssetUrl(coverImagePath);
  const dateLabel = formatPublishedDate(publishedAt);
  const author = authorName?.trim() || "Wixked Nation";
  const raw = (bodyHtml ?? html)?.trim() || "";
  const clean = sanitizeBlogHtml(raw);

  const prose = (
    <div
      className={cn(
        "blog-prose min-w-0 max-w-none overflow-x-clip text-base leading-relaxed text-foreground",
        "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight sm:[&_h1]:text-3xl",
        "[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight sm:[&_h2]:text-2xl",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_p]:my-3 [&_p]:text-pretty",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-1",
        "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
        "[&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
        "[&_hr]:my-8 [&_hr]:border-border",
        "[&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full",
        "[&_.aspect-video]:relative [&_.aspect-video]:my-4 [&_.aspect-video]:aspect-video [&_.aspect-video]:w-full [&_.aspect-video]:overflow-hidden [&_.aspect-video]:rounded-lg",
        "[&_[data-youtube-video]]:relative [&_[data-youtube-video]]:my-4 [&_[data-youtube-video]]:aspect-video [&_[data-youtube-video]]:w-full [&_[data-youtube-video]]:overflow-hidden [&_[data-youtube-video]]:rounded-lg",
      )}
      dangerouslySetInnerHTML={clean ? { __html: clean } : undefined}
    />
  );

  if (bodyOnly || (!title && !coverSrc && !excerpt)) {
    if (!clean) {
      return (
        <p className={cn("text-sm text-muted-foreground", className)}>
          No content yet.
        </p>
      );
    }
    return <div className={className}>{prose}</div>;
  }

  return (
    <article
      className={cn(
        "mx-auto w-full min-w-0 max-w-3xl",
        !compact && "px-0",
        className,
      )}
    >
      <header className="min-w-0">
        <h1
          className={cn(
            "text-pretty font-semibold tracking-tight text-foreground",
            compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
          )}
        >
          {title || "Untitled post"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          By {author}
          {dateLabel ? ` · ${dateLabel}` : null}
        </p>
        {excerpt?.trim() ? (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {excerpt.trim()}
          </p>
        ) : null}
        {tags && tags.length > 0 ? <BlogPostTags tags={tags} /> : null}
      </header>

      {coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSrc}
          alt=""
          className="mt-6 h-auto max-h-[28rem] w-full max-w-full rounded-xl border border-border object-cover"
        />
      ) : null}

      {clean ? (
        <div className="mt-8">{prose}</div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">No content yet.</p>
      )}
    </article>
  );
}
