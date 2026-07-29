import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import type { Product, ProductsListResult } from "@/lib/api/types";
import { toQuery } from "@/lib/api/types";

export type ProductsQuery = {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function getProducts(params?: ProductsQuery) {
  return apiRequest<ApiEnvelope<ProductsListResult>>(
    `/api/products${toQuery(params)}`,
    { auth: false },
  );
}

export async function getFeaturedProducts(params?: {
  page?: number;
  limit?: number;
}) {
  return apiRequest<ApiEnvelope<ProductsListResult>>(
    `/api/products/featured${toQuery(params)}`,
    { auth: false },
  );
}

export async function getProductBySlug(slug: string) {
  return apiRequest<ApiEnvelope<{ product: Product }>>(
    `/api/products/${encodeURIComponent(slug)}`,
    { auth: false },
  );
}

/** Paginated public product list. */
export async function fetchProductsPage(
  params?: ProductsQuery,
): Promise<ProductsListResult> {
  return apiData<ProductsListResult>(`/api/products${toQuery(params)}`, {
    auth: false,
  });
}

/** Normalized list helper (products only). */
export async function listProducts(
  params?: ProductsQuery,
): Promise<Product[]> {
  const result = await fetchProductsPage(params);
  return result.products ?? [];
}

export async function listFeaturedProducts(params?: {
  page?: number;
  limit?: number;
}): Promise<Product[]> {
  const result = await apiData<ProductsListResult>(
    `/api/products/featured${toQuery(params)}`,
    { auth: false },
  );
  return result.products ?? [];
}

/** Single public product by slug. */
export async function fetchProductBySlug(slug: string): Promise<Product> {
  const data = await apiData<{ product: Product }>(
    `/api/products/${encodeURIComponent(slug)}`,
    { auth: false },
  );
  return data.product;
}

