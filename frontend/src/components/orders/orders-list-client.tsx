"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { listMyOrders } from "@/lib/api/orders.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import type { Order } from "@/lib/api/types";

export const myOrdersQueryKey = ["orders", "me"] as const;

const PAGE_SIZE = 10;

function formatOrderDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy");
}

function OrderRow({ order }: { order: Order }) {
  const formatPrice = useFormatPrice();
  const reference = order.orderNumber || order.id;

  return (
    <li>
      <Link
        href={`/account/orders/${order.id}`}
        className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{reference}</p>
          <p className="text-sm text-muted-foreground">
            {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <OrderStatusBadge status={order.status} />
          <p className="text-sm font-semibold">
            {formatPrice(order.totalAmount)}
          </p>
        </div>
      </Link>
    </li>
  );
}

export function OrdersListClient() {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...myOrdersQueryKey, page],
    queryFn: () => listMyOrders({ page, limit: PAGE_SIZE }),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading orders…</p>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Could not load orders")}
        </p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { orders, pagination } = data;

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">No orders yet.</p>
        <Button
          render={<Link href="/products" />}
          nativeButton={false}
          className="mt-4"
        >
          Start shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </ul>

      {pagination.totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-between gap-3"
          aria-label="Orders pagination"
        >
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              render={
                <Link
                  href={
                    pagination.page > 1
                      ? `/account/orders?page=${pagination.page - 1}`
                      : "/account/orders"
                  }
                  aria-disabled={pagination.page <= 1}
                  tabIndex={pagination.page <= 1 ? -1 : undefined}
                />
              }
              nativeButton={false}
              variant="outline"
              disabled={pagination.page <= 1}
              className={
                pagination.page <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            >
              Previous
            </Button>
            <Button
              render={
                <Link
                  href={`/account/orders?page=${pagination.page + 1}`}
                  aria-disabled={pagination.page >= pagination.totalPages}
                  tabIndex={
                    pagination.page >= pagination.totalPages ? -1 : undefined
                  }
                />
              }
              nativeButton={false}
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              className={
                pagination.page >= pagination.totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            >
              Next
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
