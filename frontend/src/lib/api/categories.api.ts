import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import { sortCategoryTree } from "@/lib/catalog/category-tree";
import type { Category } from "@/lib/api/types";

export async function getCategories() {
  return apiRequest<ApiEnvelope<{ categories: Category[] }>>("/api/categories", {
    auth: false,
  });
}

export async function getCategoryBySlug(slug: string) {
  return apiRequest<ApiEnvelope<{ category: Category }>>(
    `/api/categories/${encodeURIComponent(slug)}`,
    { auth: false },
  );
}

/** Nested public category roots. */
export async function listCategories(): Promise<Category[]> {
  const data = await apiData<{ categories: Category[] }>("/api/categories", {
    auth: false,
  });
  return sortCategoryTree(data.categories ?? []);
}

/** Normalized single-category helper for UI (includes direct children). */
export async function fetchCategoryBySlug(slug: string): Promise<Category> {
  const data = await apiData<{ category: Category }>(
    `/api/categories/${encodeURIComponent(slug)}`,
    { auth: false },
  );
  return data.category;
}
