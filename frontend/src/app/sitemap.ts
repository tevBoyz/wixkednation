import type { MetadataRoute } from "next";

import { listCategories } from "@/lib/api/categories.api";
import { fetchProductsPage } from "@/lib/api/products.api";
import { flattenCategoryTree } from "@/lib/catalog/category-tree";
import { getSiteOrigin } from "@/lib/seo/site-metadata";

function entry(
  path: string,
  options?: { lastModified?: Date; changeFrequency?: MetadataRoute.Sitemap[0]["changeFrequency"]; priority?: number },
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/products", { changeFrequency: "daily", priority: 0.9 }),
    entry("/categories", { changeFrequency: "weekly", priority: 0.8 }),
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

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

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
