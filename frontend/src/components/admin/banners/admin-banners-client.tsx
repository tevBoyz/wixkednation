"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAdminBanner,
  listAdminBanners,
  restoreAdminBanner,
  updateAdminBanner,
} from "@/lib/api/admin/banners.api";
import { getErrorMessage } from "@/lib/api/errors";
import { sortDeletedLast } from "@/lib/admin/sort-deleted-last";
import type { PromoBanner } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const adminBannersQueryKey = ["admin", "banners"] as const;

function formatMoney(value: number | string) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n)) {
    return String(value);
  }
  return `$${n.toFixed(2)}`;
}

function bannerStatus(banner: PromoBanner): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (banner.deletedAt) {
    return { label: "Deleted", variant: "destructive" };
  }
  if (!banner.isActive) {
    return { label: "Off", variant: "secondary" };
  }
  const now = Date.now();
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) {
    return { label: "Scheduled", variant: "outline" };
  }
  if (banner.endsAt && new Date(banner.endsAt).getTime() < now) {
    return { label: "Ended", variant: "secondary" };
  }
  return { label: "Live", variant: "default" };
}

export function AdminBannersClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const bannersQuery = useQuery({
    queryKey: adminBannersQueryKey,
    queryFn: listAdminBanners,
  });

  const rows = useMemo(() => {
    const list = sortDeletedLast(bannersQuery.data ?? [], {
      secondaryCompare: (a, b) => a.sortOrder - b.sortOrder,
    });
    const q = search.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((banner) => {
      const hay = [banner.title, banner.subtitle, banner.product?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [bannersQuery.data, search]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminBanner(id, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminBannersQueryKey });
      toast.success("Banner updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update banner"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminBanner(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminBannersQueryKey });
      toast.success("Banner deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete banner"));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreAdminBanner(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminBannersQueryKey });
      toast.success("Banner restored");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not restore banner"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sale and happy hour deals that replace the homepage hero when live.
          </p>
        </div>
        <Button render={<Link href="/admin/banners/new" />} nativeButton={false}>
          Create banner
        </Button>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search banners…"
        className="max-w-sm"
      />

      {bannersQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : null}

      {bannersQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(bannersQuery.error, "Could not load banners")}
        </p>
      ) : null}

      {!bannersQuery.isLoading && !bannersQuery.isError ? (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Sale</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No banners yet. Create one to replace the homepage hero during
                    sales.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((banner) => {
                  const status = bannerStatus(banner);
                  const thumb =
                    banner.imageUrl || banner.product?.coverImageUrl || null;
                  return (
                    <TableRow
                      key={banner.id}
                      className={cn(banner.deletedAt && "opacity-60")}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{banner.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {banner.imageMode === "uploaded"
                                ? "Uploaded image"
                                : "Built with product photo"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate">
                        {banner.product?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-primary">
                          {formatMoney(banner.salePrice)}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground line-through">
                          {formatMoney(banner.compareAtPrice)}
                        </span>
                      </TableCell>
                      <TableCell>{banner.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {!banner.deletedAt ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                render={
                                  <Link href={`/admin/banners/${banner.id}`} />
                                }
                                nativeButton={false}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={toggleMutation.isPending}
                                onClick={() =>
                                  toggleMutation.mutate({
                                    id: banner.id,
                                    isActive: !banner.isActive,
                                  })
                                }
                              >
                                {banner.isActive ? "Turn off" : "Turn on"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Delete “${banner.title}”? You can restore it later.`,
                                    )
                                  ) {
                                    deleteMutation.mutate(banner.id);
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={restoreMutation.isPending}
                              onClick={() => restoreMutation.mutate(banner.id)}
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
