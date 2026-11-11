"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  archiveAdminCoupon,
  listAdminCoupons,
} from "@/lib/api/admin/coupons.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useStorefrontOrigin } from "@/hooks/use-storefront-origin";
import type { Coupon } from "@/lib/api/types";

export const adminCouponsQueryKey = ["admin", "coupons"] as const;

function typeLabel(coupon: Coupon) {
  if (coupon.type === "free_delivery") {
    return "Free delivery";
  }
  if (coupon.type === "percent_off") {
    return `${coupon.amount}% off`;
  }
  return `$${coupon.amount} off`;
}

export function AdminCouponsClient() {
  const queryClient = useQueryClient();
  const storefrontOrigin = useStorefrontOrigin();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: adminCouponsQueryKey,
    queryFn: listAdminCoupons,
  });

  const archiveMutation = useMutation({
    mutationFn: archiveAdminCoupon,
    onSuccess: async () => {
      toast.success("Coupon archived");
      await queryClient.invalidateQueries({ queryKey: adminCouponsQueryKey });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Could not archive coupon"));
    },
  });

  const coupons = data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Coupons</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create shared codes or claimable campaigns. Free delivery is only
            via coupons you create — never automatic.
          </p>
        </div>
        <Button render={<Link href="/admin/coupons/new" />} nativeButton={false}>
          New coupon
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading coupons…</p>
      ) : null}

      {isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            {getErrorMessage(error, "Could not load coupons")}
          </p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && coupons.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No coupons yet. Create one to start offering discounts or free
          delivery.
        </p>
      ) : null}

      {coupons.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Claim link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const claimUrl = coupon.claimSlug
                  ? `${storefrontOrigin}/claim/${coupon.claimSlug}`
                  : null;
                return (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono text-sm">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{coupon.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {typeLabel(coupon)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          coupon.status === "active" ? "default" : "secondary"
                        }
                      >
                        {coupon.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {coupon.redemptionCount ?? 0}
                      {coupon.maxRedemptions != null
                        ? ` / ${coupon.maxRedemptions}`
                        : ""}
                    </TableCell>
                    <TableCell className="min-w-[18rem] max-w-md">
                      {claimUrl ? (
                        <div className="flex flex-col items-start gap-1.5">
                          <p className="break-all font-mono text-xs text-foreground">
                            {claimUrl}
                          </p>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              void navigator.clipboard.writeText(claimUrl);
                              toast.success("Full claim URL copied");
                            }}
                          >
                            Copy full link
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          render={
                            <Link href={`/admin/coupons/${coupon.id}`} />
                          }
                          nativeButton={false}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        {coupon.status === "active" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={archiveMutation.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Archive ${coupon.code}? It can no longer be redeemed.`,
                                )
                              ) {
                                archiveMutation.mutate(coupon.id);
                              }
                            }}
                          >
                            Archive
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
