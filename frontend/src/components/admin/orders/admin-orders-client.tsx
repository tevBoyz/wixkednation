"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import {
  AdminOrdersFilters,
  adminOrdersPaginationHref,
} from "@/components/admin/orders/admin-orders-filters";
import {
  AdminOrderFlags,
  orderHasRiskFlags,
} from "@/components/admin/orders/admin-order-flags";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { listAdminOrders } from "@/lib/api/admin/orders.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import type { OrderStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export const adminOrdersQueryKey = ["admin", "orders"] as const;

function formatOrderDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy · h:mm a");
}

function OrdersTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function customerLabel(order: {
  user?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}) {
  return (
    order.user?.name ||
    order.user?.phone ||
    order.user?.email ||
    "-"
  );
}

function AdminOrdersContent() {
  const formatPrice = useFormatPrice();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const search = searchParams.get("search")?.trim() || undefined;
  const status = (searchParams.get("status")?.trim() || undefined) as
    | OrderStatus
    | undefined;

  const filters = { search, status };

  const ordersQuery = useQuery({
    queryKey: [...adminOrdersQueryKey, { page, search, status }],
    queryFn: () =>
      listAdminOrders({
        page,
        limit: PAGE_SIZE,
        search,
        status,
      }),
    staleTime: 0,
  });

  const pagination = ordersQuery.data?.pagination;
  const orders = ordersQuery.data?.orders ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Fulfillment</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by order number, customer name, phone, or email. Open an order
          to update status.
        </p>
      </div>

      <AdminOrdersFilters />

      {ordersQuery.isLoading ? <OrdersTableSkeleton /> : null}

      {ordersQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(ordersQuery.error, "Could not load orders")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void ordersQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {ordersQuery.data && orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No orders match these filters.
          </p>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {pagination?.total ?? orders.length} order
            {(pagination?.total ?? orders.length) === 1 ? "" : "s"}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const atRisk = orderHasRiskFlags(order.risk);
                return (
                <TableRow
                  key={order.id}
                  className={cn(atRisk && "bg-destructive/5")}
                >
                  <TableCell>
                    <div className="space-y-1.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.orderNumber || order.id.slice(0, 8)}
                      </Link>
                      <AdminOrderFlags order={order} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customerLabel(order)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatOrderDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      render={<Link href={`/admin/orders/${order.id}`} />}
                      nativeButton={false}
                      variant="outline"
                      size="sm"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                {pagination.page > 1 ? (
                  <Button
                    render={
                      <Link
                        href={adminOrdersPaginationHref(
                          pagination.page - 1,
                          filters,
                        )}
                      />
                    }
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                ) : null}
                {pagination.page < pagination.totalPages ? (
                  <Button
                    render={
                      <Link
                        href={adminOrdersPaginationHref(
                          pagination.page + 1,
                          filters,
                        )}
                      />
                    }
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function AdminOrdersClient() {
  return (
    <Suspense fallback={<OrdersTableSkeleton />}>
      <AdminOrdersContent />
    </Suspense>
  );
}
