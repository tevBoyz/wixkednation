import type { Metadata } from "next";
import Link from "next/link";

import { BlogCard } from "@/components/blog/blog-card";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchBlogPostsPage } from "@/lib/api/blog.api";
import { getErrorMessage } from "@/lib/api/errors";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog | Cannabis Guides & Delivery Tips",
  description:
    "Guides, local delivery tips, and product education from GasNation — premium cannabis delivery across Northern Virginia and Washington, DC.",
  path: "/blog",
});

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  let posts: Awaited<ReturnType<typeof fetchBlogPostsPage>>["posts"] = [];
  let totalPages = 1;
  let error: string | null = null;

  try {
    const result = await fetchBlogPostsPage({ page, limit: 12 });
    posts = result.posts;
    totalPages = result.pagination?.totalPages ?? 1;
  } catch (err) {
    error = getErrorMessage(err, "Could not load blog posts");
  }

  return (
    <main className="min-w-0 overflow-x-clip">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <Container className="min-w-0 py-10 sm:py-14">
        <header className="mx-auto max-w-3xl px-0 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Blog
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Guides, local tips, and product education from GasNation.
          </p>
        </header>

        {error ? (
          <p className="mt-10 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {!error && posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No published posts yet. Check back soon.
          </p>
        ) : null}

        {!error && posts.length > 0 ? (
          <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id} className="min-w-0">
                <BlogCard post={post} />
              </li>
            ))}
          </ul>
        ) : null}

        {totalPages > 1 ? (
          <nav
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            aria-label="Blog pagination"
          >
            {page > 1 ? (
              <Link
                href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}
                className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                Previous
              </Link>
            ) : null}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/blog?page=${page + 1}`}
                className="rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}
      </Container>
    </main>
  );
}
