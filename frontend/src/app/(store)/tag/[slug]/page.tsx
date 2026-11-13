import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogCard } from "@/components/blog/blog-card";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchPublicBlogTagPage } from "@/lib/api/blog.api";
import { getErrorMessage } from "@/lib/api/errors";
import {
  buildBreadcrumbJsonLd,
  buildTagCollectionJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await fetchPublicBlogTagPage(slug, { page: 1, limit: 1 });
    const tag = data.tag;
    return buildPageMetadata({
      title: tag.seoTitle?.trim() || `${tag.name} | Wixked Nation Blog`,
      description:
        tag.seoDescription?.trim() ||
        tag.description?.trim() ||
        `Browse Wixked Nation posts about ${tag.name}.`,
      path: `/tag/${tag.slug}`,
    });
  } catch {
    return buildPageMetadata({
      title: "Blog tag",
      description: "Wixked Nation blog tag",
      path: `/tag/${slug}`,
    });
  }
}

export default async function BlogTagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const page = Math.max(1, Number.parseInt(query.page || "1", 10) || 1);

  let data: Awaited<ReturnType<typeof fetchPublicBlogTagPage>>;
  try {
    data = await fetchPublicBlogTagPage(slug, { page, limit: 12 });
  } catch (error) {
    const message = getErrorMessage(error, "");
    if (message.toLowerCase().includes("not found")) {
      notFound();
    }
    notFound();
  }

  const { tag, posts, pagination } = data;
  const totalPages = pagination?.totalPages ?? 1;
  const description =
    tag.description?.trim() ||
    tag.seoDescription?.trim() ||
    `Guides and posts about ${tag.name} from Wixked Nation.`;

  return (
    <main className="min-w-0 overflow-x-clip">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: tag.name, path: `/tag/${tag.slug}` },
        ])}
      />
      <JsonLd
        data={buildTagCollectionJsonLd({
          name: tag.name,
          description,
          slug: tag.slug,
          posts: posts.map((post) => ({
            title: post.title,
            slug: post.slug,
          })),
        })}
      />
      <Container className="min-w-0 py-10 sm:py-14">
        <header className="wn-page-head">
          <p className="text-sm text-muted-foreground">
            <Link href="/blog" className="hover:underline">
              Blog
            </Link>
            <span aria-hidden> / </span>
            Tag
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {tag.name}
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {description}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No published posts with this tag yet.
          </p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id} className="min-w-0">
                <BlogCard post={post} />
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            aria-label="Tag pagination"
          >
            {page > 1 ? (
              <Link
                href={
                  page === 2
                    ? `/tag/${tag.slug}`
                    : `/tag/${tag.slug}?page=${page - 1}`
                }
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
                href={`/tag/${tag.slug}?page=${page + 1}`}
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
