"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { AdminBannerFormClient } from "@/components/admin/banners/admin-banner-form-client";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminBanner } from "@/lib/api/admin/banners.api";
import { getErrorMessage } from "@/lib/api/errors";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminBannerEditPage({ params }: PageProps) {
  const { id } = use(params);

  const bannerQuery = useQuery({
    queryKey: ["admin", "banners", id],
    queryFn: () => fetchAdminBanner(id),
  });

  if (bannerQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (bannerQuery.isError || !bannerQuery.data || bannerQuery.data.deletedAt) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {getErrorMessage(bannerQuery.error, "Banner not found.")}
      </p>
    );
  }

  return <AdminBannerFormClient mode="edit" banner={bannerQuery.data} />;
}
