import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import { sortCategoryTree } from "@/lib/catalog/category-tree";
import type { Category } from "@/lib/api/types";

export type AdminCategoryBody = {
  name: string;
  description?: string | null;
  isActive?: boolean;
  parentId?: string | null;
  sortOrder?: number;
};

/** Returns nested category roots (do not flatten here). */
export async function listAdminCategories(): Promise<Category[]> {
  const data = await apiData<{ categories: Category[] }>(
    "/api/admin/categories",
  );
  return sortCategoryTree(data.categories ?? []);
}

export async function fetchAdminCategory(id: string): Promise<Category> {
  const data = await apiData<{ category: Category }>(
    `/api/admin/categories/${id}`,
  );
  return data.category;
}

export async function createAdminCategory(
  body: AdminCategoryBody,
): Promise<Category> {
  const data = await apiData<{ category: Category }>("/api/admin/categories", {
    method: "POST",
    body,
  });
  return data.category;
}

export async function updateAdminCategory(
  id: string,
  body: Partial<AdminCategoryBody>,
): Promise<Category> {
  const data = await apiData<{ category: Category }>(
    `/api/admin/categories/${id}`,
    {
      method: "PATCH",
      body,
    },
  );
  return data.category;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await apiRequest<ApiEnvelope<unknown>>(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
}

export async function restoreAdminCategory(id: string): Promise<Category> {
  const data = await apiData<{ category: Category }>(
    `/api/admin/categories/${id}/restore`,
    { method: "PATCH" },
  );
  return data.category;
}
