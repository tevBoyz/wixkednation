import { apiData } from "@/lib/api/client";
import type { PromoBanner } from "@/lib/api/types";

export async function listActiveStoreBanners(): Promise<PromoBanner[]> {
  const data = await apiData<{ banners: PromoBanner[] }>(
    "/api/store/banners",
    { auth: false },
  );
  return data.banners ?? [];
}
