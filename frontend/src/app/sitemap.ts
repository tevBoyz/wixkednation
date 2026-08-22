import type { MetadataRoute } from "next";

import { listCategories } from "@/lib/api/categories.api";
import {
  fetchBlogPostsPage,
  listPublicBlogTags,
} from "@/lib/api/blog.api";
import { fetchProductsPage } from "@/lib/api/products.api";
import { flattenCategoryTree } from "@/lib/catalog/category-tree";
import { SEO_LOCATIONS } from "@/content/seo-locations";
import { getSiteOrigin } from "@/lib/seo/site-metadata";

function entry(
  path: string,
  options?: {
    lastModified?: Date;
    changeFrequency?: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority?: number;
  },
): MetadataRoute.Sitemap[0] {
  return {
    url: `${getSiteOrigin()}${path}`,
    lastModified: options?.lastModified ?? new Date(),
    changeFrequency: options?.changeFrequency ?? "weekly",
    priority: options?.priority,
  };
}

async function fetchAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await fetchProductsPage({ page, limit: 100 });
    for (const product of result.products ?? []) {
      if (product.slug) {
        slugs.push(product.slug);
      }
    }
    totalPages = result.pagination?.totalPages ?? 1;
    page += 1;
  }

  return slugs;
}

async function fetchAllBlogEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await fetchBlogPostsPage({ page, limit: 100 });
    for (const post of result.posts ?? []) {
      if (post.slug) {
        entries.push(
          entry(`/blog/${post.slug}`, {
            changeFrequency: "weekly",
            priority: 0.65,
            lastModified: post.updatedAt
              ? new Date(post.updatedAt)
              : post.publishedAt
                ? new Date(post.publishedAt)
                : new Date(),
          }),
        );
      }
    }
    totalPages = result.pagination?.totalPages ?? 1;
    page += 1;
  }

  return entries;
}

async function fetchAllBlogTagEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const tags = await listPublicBlogTags();
    return tags
      .filter((tag) => tag.slug)
      .map((tag) =>
        entry(`/tag/${tag.slug}`, {
          changeFrequency: "weekly",
          priority: 0.55,
          lastModified: tag.updatedAt ? new Date(tag.updatedAt) : new Date(),
        }),
      );
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/products", { changeFrequency: "daily", priority: 0.9 }),
    entry("/categories", { changeFrequency: "weekly", priority: 0.8 }),
    entry("/delivery", { changeFrequency: "weekly", priority: 0.9 }),
    ...SEO_LOCATIONS.map((location) =>
      entry(`/delivery/${location.slug}`, {
        changeFrequency: "weekly",
        priority: location.kind === "region" ? 0.85 : 0.75,
      }),
    ),
    entry("/blog", { changeFrequency: "daily", priority: 0.8 }),
    entry("/faqs", { changeFrequency: "monthly", priority: 0.7 }),
    entry("/about", { changeFrequency: "monthly", priority: 0.6 }),
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];
  let tagRoutes: MetadataRoute.Sitemap = [];

  try {
    const categories = await listCategories();
    categoryRoutes = flattenCategoryTree(categories)
      .filter((item) => item.category.slug)
      .map((item) =>
        entry(`/categories/${item.category.slug}`, { priority: 0.7 }),
      );
  } catch {
    categoryRoutes = [];
  }

  try {
    const slugs = await fetchAllProductSlugs();
    productRoutes = slugs.map((slug) =>
      entry(`/products/${slug}`, { changeFrequency: "weekly", priority: 0.6 }),
    );
  } catch {
    productRoutes = [];
  }

  try {
    blogRoutes = await fetchAllBlogEntries();
  } catch {
    blogRoutes = [];
  }

  try {
    tagRoutes = await fetchAllBlogTagEntries();
  } catch {
    tagRoutes = [];
  }

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...blogRoutes,
    ...tagRoutes,
  ];
}
