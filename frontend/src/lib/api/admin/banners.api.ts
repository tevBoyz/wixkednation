import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import type { PromoBanner, PromoBannerImageMode } from "@/lib/api/types";

export type AdminBannerBody = {
  title: string;
  subtitle?: string | null;
  productId: string;
  skuId: string;
  salePrice: number;
  compareAtPrice: number;
  imageMode: PromoBannerImageMode;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export async function listAdminBanners(): Promise<PromoBanner[]> {
  const data = await apiData<{ banners: PromoBanner[] }>("/api/admin/banners");
  return data.banners ?? [];
}

export async function fetchAdminBanner(id: string): Promise<PromoBanner> {
  const data = await apiData<{ banner: PromoBanner }>(
    `/api/admin/banners/${id}`,
  );
  return data.banner;
}

export async function createAdminBanner(
  body: AdminBannerBody,
): Promise<PromoBanner> {
  const data = await apiData<{ banner: PromoBanner }>("/api/admin/banners", {
    method: "POST",
    body,
  });
  return data.banner;
}

export async function updateAdminBanner(
  id: string,
  body: Partial<AdminBannerBody>,
): Promise<PromoBanner> {
  const data = await apiData<{ banner: PromoBanner }>(
    `/api/admin/banners/${id}`,
    {
      method: "PATCH",
      body,
    },
  );
  return data.banner;
}

export async function deleteAdminBanner(id: string): Promise<void> {
  await apiRequest<ApiEnvelope<unknown>>(`/api/admin/banners/${id}`, {
    method: "DELETE",
  });
}

export async function restoreAdminBanner(id: string): Promise<PromoBanner> {
  const data = await apiData<{ banner: PromoBanner }>(
    `/api/admin/banners/${id}/restore`,
    { method: "PATCH" },
  );
  return data.banner;
}
