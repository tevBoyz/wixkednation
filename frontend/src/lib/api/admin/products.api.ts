import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import { sortAdminProducts } from "@/lib/admin/sort-admin-products";
import type { Product } from "@/lib/api/types";
import { toQuery } from "@/lib/api/types";

export type AdminProductSkuBody = {
  id?: string;
  label?: string | null;
  volume: number;
  measurementUnit: string;
  price: number;
  sortOrder: number;
  isVisible: boolean;
};

export type AdminProductBody = {
  name: string;
  categoryId: string;
  /** Pack price; null with null volume = contact for price (legacy / no sellable packs). */
  price: number | null;
  measurementUnit: string;
  volume?: number | null;
  /** Prefer nested SKUs (1–3). Replaces full set on update when sent. */
  skus?: AdminProductSkuBody[];
  description?: string | null;
  productType?: string;
  strainType?: string | null;
  thcPercent?: number | null;
  cbdPercent?: number | null;
  flavors?: string[];
  effects?: string[];
  isVisible?: boolean;
  isFeatured?: boolean;
  slug?: string;
};

export type AdminProductsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  includeDeleted?: boolean;
};

export type AdminProductsListResult = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function listAdminProducts(
  params?: AdminProductsQuery,
): Promise<AdminProductsListResult> {
  const data = await apiData<AdminProductsListResult>(
    `/api/admin/products${toQuery({
      includeDeleted: true,
      ...params,
    })}`,
  );

  return {
    ...data,
    products: sortAdminProducts(data.products ?? []),
  };
}

export async function fetchAdminProduct(id: string): Promise<Product> {
  const data = await apiData<{ product: Product }>(
    `/api/admin/products/${id}`,
  );
  return data.product;
}

export async function createAdminProduct(
  body: AdminProductBody,
): Promise<Product> {
  const data = await apiData<{ product: Product }>("/api/admin/products", {
    method: "POST",
    body,
  });
  return data.product;
}

export async function updateAdminProduct(
  id: string,
  body: Partial<AdminProductBody>,
): Promise<Product> {
  const data = await apiData<{ product: Product }>(
    `/api/admin/products/${id}`,
    {
      method: "PATCH",
      body,
    },
  );
  return data.product;
}

export async function setAdminProductVisibility(
  id: string,
  isVisible: boolean,
): Promise<Product> {
  const data = await apiData<{ product: Product }>(
    `/api/admin/products/${id}/visibility`,
    {
      method: "PATCH",
      body: { isVisible },
    },
  );
  return data.product;
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await apiRequest<ApiEnvelope<unknown>>(`/api/admin/products/${id}`, {
    method: "DELETE",
  });
}

export async function restoreAdminProduct(id: string): Promise<Product> {
  const data = await apiData<{ product: Product }>(
    `/api/admin/products/${id}/restore`,
    { method: "PATCH" },
  );
  return data.product;
}

export async function reorderAdminProductImages(
  id: string,
  imageIds: string[],
): Promise<Product> {
  const data = await apiData<{ product: Product }>(
    `/api/admin/products/${id}/images/reorder`,
    { method: "PATCH", body: { imageIds } },
  );
  return data.product;
}

export async function setAdminProductCoverImage(
  productId: string,
  imageId: string,
): Promise<Product> {
  const data = await apiData<{ product: Product }>(
    `/api/admin/products/${productId}/images/${imageId}/cover`,
    { method: "PATCH" },
  );
  return data.product;
}

export async function deleteAdminProductImage(
  productId: string,
  imageId: string,
): Promise<Product> {
  const data = await apiData<{ product: Product }>(
    `/api/admin/products/${productId}/images/${imageId}`,
    { method: "DELETE" },
  );
  return data.product;
}
