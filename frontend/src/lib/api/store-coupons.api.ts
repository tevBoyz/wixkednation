import { apiData } from "@/lib/api/client";
import type { Coupon, CouponType } from "@/lib/api/types";

export type ValidateCouponResult = {
  valid: boolean;
  coupon: Coupon;
  productDiscount: string;
  deliveryFee: string;
  subtotal: string;
  total: string;
  type: CouponType;
};

export async function validateStoreCoupon(body: {
  code: string;
  subtotal: number;
  phone?: string;
  email?: string;
}) {
  return apiData<ValidateCouponResult>("/api/store/coupons/validate", {
    method: "POST",
    auth: false,
    body,
  });
}

export type ClaimCampaignInfo = {
  name: string;
  type: CouponType;
  claimSlug: string;
  endsAt?: string | null;
  description?: string;
};

export async function listClaimCampaigns() {
  try {
    const data = await apiData<{
      campaigns: Array<{
        claimSlug: string;
        name: string;
        updatedAt?: string;
      }>;
    }>("/api/store/claims", { auth: false });
    return data.campaigns ?? [];
  } catch {
    return [];
  }
}

export async function fetchClaimCampaign(slug: string) {
  const data = await apiData<{ campaign: ClaimCampaignInfo }>(
    `/api/store/claims/${encodeURIComponent(slug)}`,
    { auth: false },
  );
  return data.campaign;
}

export async function claimCampaignCoupon(
  slug: string,
  body: { email: string; source?: string },
) {
  return apiData<{
    resent: boolean;
    email: string;
    campaignName: string;
  }>(`/api/store/claims/${encodeURIComponent(slug)}`, {
    method: "POST",
    auth: false,
    body,
  });
}
