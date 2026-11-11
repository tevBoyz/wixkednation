import { apiData } from "@/lib/api/client";
import type { Coupon, CouponType } from "@/lib/api/types";

export type AdminCouponBody = {
  code?: string | null;
  name: string;
  type: CouponType;
  amount?: number | string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptions?: number | null;
  maxPerCustomer?: number;
  minSubtotal?: number | string | null;
  newCustomersOnly?: boolean;
  isUniqueIssue?: boolean;
  claimSlug?: string | null;
  status?: "active" | "archived";
};

export async function listAdminCoupons() {
  const data = await apiData<{ coupons: Coupon[] }>("/api/admin/coupons");
  return data.coupons;
}

export async function fetchAdminCoupon(id: string) {
  const data = await apiData<{ coupon: Coupon }>(`/api/admin/coupons/${id}`);
  return data.coupon;
}

export async function createAdminCoupon(body: AdminCouponBody) {
  const data = await apiData<{ coupon: Coupon }>("/api/admin/coupons", {
    method: "POST",
    body,
  });
  return data.coupon;
}

export async function updateAdminCoupon(
  id: string,
  body: Partial<AdminCouponBody>,
) {
  const data = await apiData<{ coupon: Coupon }>(`/api/admin/coupons/${id}`, {
    method: "PATCH",
    body,
  });
  return data.coupon;
}

export async function archiveAdminCoupon(id: string) {
  const data = await apiData<{ coupon: Coupon }>(
    `/api/admin/coupons/${id}/archive`,
    { method: "POST" },
  );
  return data.coupon;
}
