"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { AdminCouponFormClient } from "@/components/admin/coupons/admin-coupon-form-client";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminCoupon } from "@/lib/api/admin/coupons.api";
import { getErrorMessage } from "@/lib/api/errors";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminEditCouponPage({ params }: PageProps) {
  const { id } = use(params);

  const couponQuery = useQuery({
    queryKey: ["admin", "coupons", id],
    queryFn: () => fetchAdminCoupon(id),
  });

  if (couponQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (couponQuery.isError || !couponQuery.data) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {getErrorMessage(couponQuery.error, "Coupon not found.")}
      </p>
    );
  }

  return <AdminCouponFormClient coupon={couponQuery.data} />;
}
