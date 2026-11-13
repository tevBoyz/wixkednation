import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogPostBody } from "@/components/blog/blog-post-body";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchBlogPostBySlug } from "@/lib/api/blog.api";
import { resolveCatalogAssetUrl } from "@/lib/catalog/catalog-image-url";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await fetchBlogPostBySlug(slug);
    return buildPageMetadata({
      title: post.seoTitle?.trim() || post.title,
      description:
        post.seoDescription?.trim() ||
        post.excerpt?.trim() ||
        `Read ${post.title} on the Wixked Nation blog.`,
      path: `/blog/${post.slug}`,
    });
  } catch {
    return buildPageMetadata({
      title: "Blog post",
      description: "Wixked Nation blog post",
      path: `/blog/${slug}`,
    });
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    post = await fetchBlogPostBySlug(slug);
  } catch {
    notFound();
  }

  if (!post) {
    notFound();
  }

  const coverUrl =
    resolveCatalogAssetUrl(post.coverImageUrl) ||
    resolveCatalogAssetUrl(post.coverImagePath);

  return (
    <main className="min-w-0 overflow-x-clip py-10 sm:py-14">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: post.title,
          description:
            post.seoDescription?.trim() ||
            post.excerpt?.trim() ||
            post.title,
          slug: post.slug,
          imageUrl: coverUrl,
          publishedAt: post.publishedAt,
          modifiedAt: post.updatedAt,
          authorName: post.authorName,
        })}
      />
      <Container className="min-w-0">
        <BlogPostBody
          title={post.title}
          excerpt={post.excerpt}
          bodyHtml={post.bodyHtml}
          coverImageUrl={post.coverImageUrl}
          coverImagePath={post.coverImagePath}
          publishedAt={post.publishedAt}
          authorName={post.authorName}
          tags={post.tags}
        />
      </Container>
    </main>
  );
}
