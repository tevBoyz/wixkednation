"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";

import { AdminOrderStatusDialog } from "@/components/admin/orders/admin-order-status-dialog";
import {
  AdminOrderFlags,
  orderHasRiskFlags,
} from "@/components/admin/orders/admin-order-flags";
import { adminOrdersQueryKey } from "@/components/admin/orders/admin-orders-client";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { getAdminOrder } from "@/lib/api/admin/orders.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import { formatVolumeUnit } from "@/lib/catalog/format";
import { formatOrderStatus } from "@/lib/orders/status";
import type {
  AdminOrder,
  OrderAddressSnapshot,
  OrderItemSnapshot,
  OrderStatusHistoryEntry,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy · h:mm a");
}

function formatAddressLines(address: OrderAddressSnapshot) {
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
}

function OrderItemsList({ items }: { items: OrderItemSnapshot[] }) {
  const formatPrice = useFormatPrice();

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => {
        const packLabel = formatVolumeUnit(item.volume, item.measurementUnit);
        const totalVolumeLabel = formatVolumeUnit(
          item.effectiveVolume ??
            (item.volume != null
              ? Number(item.volume) * item.quantity
              : null),
          item.measurementUnit,
        );

        return (
          <li
            key={`${item.productId}-${item.name}-${item.unitPrice}`}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPrice(item.unitPrice)}
                {packLabel ? ` / ${packLabel}` : null}
                {" · "}
                Qty {item.quantity}
              </p>
              {totalVolumeLabel ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Total {totalVolumeLabel}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-semibold">
              {formatPrice(item.lineTotal)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function StatusTimeline({ history }: { history: OrderStatusHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No status updates yet.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {history.map((entry) => (
        <li key={entry.id} className="relative pl-6">
          <span
            className="absolute top-1.5 left-0 size-2 rounded-full bg-primary"
            aria-hidden
          />
          <p className="font-medium">{formatOrderStatus(entry.newStatus)}</p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(entry.createdAt)}
          </p>
          {entry.note ? (
            <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function ReputationPanel({ order }: { order: AdminOrder }) {
  const user = order.user;
  if (!user) {
    return null;
  }

  const reputation = user.reputation;
  const lowRep =
    order.risk?.lowReputation ||
    (reputation != null && reputation.reputationScore < 0);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        orderHasRiskFlags(order.risk) && "border-destructive/30 bg-destructive/5",
      )}
    >
      <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
      <p className="mt-2 font-medium">{user.name || user.phone || "Customer"}</p>
      {user.phone ? (
        <p className="text-sm text-muted-foreground">{user.phone}</p>
      ) : null}
      {user.email ? (
        <p className="text-sm text-muted-foreground">{user.email}</p>
      ) : null}
      <AdminOrderFlags order={order} className="mt-3" />
      {user.id ? (
        <Button
          render={<Link href={`/admin/customers/${user.id}`} />}
          nativeButton={false}
          variant="link"
          className="mt-2 h-auto p-0"
        >
          View customer profile
        </Button>
      ) : null}

      {reputation ? (
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Reputation</dt>
            <dd
              className={cn(
                "mt-1 font-semibold tabular-nums",
                lowRep && "text-destructive",
              )}
            >
              {reputation.reputationScore}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Delivered</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {reputation.deliveredOrderCount}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cancelled</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {reputation.cancelledOrderCount}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

type AdminOrderDetailClientProps = {
  orderId: string;
};

export function AdminOrderDetailClient({ orderId }: AdminOrderDetailClientProps) {
  const formatPrice = useFormatPrice();
  const queryClient = useQueryClient();
  const [statusOpen, setStatusOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState<AdminOrder | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "orders", orderId],
    queryFn: () => getAdminOrder(orderId),
  });

  const order = localOrder ?? data;
  const reference = order?.orderNumber || order?.id;
  const canUpdateStatus =
    order &&
    order.status !== "Delivered" &&
    order.status !== "Cancelled";

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading order…</p>;
  }

  if (isError || !order) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Order not found</h2>
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Could not load this order")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
          <Button
            render={<Link href="/admin/orders" />}
            nativeButton={false}
            variant="outline"
          >
            Back to orders
          </Button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            render={<Link href="/admin/orders" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="mb-4 gap-2"
          >
            <ArrowLeftIcon className="size-4" />
            Back to orders
          </Button>
          <p className="text-sm text-muted-foreground">Order detail</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {reference}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDateTime(order.createdAt)}
          </p>
          <AdminOrderFlags order={order} className="mt-3" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {canUpdateStatus ? (
            <Button type="button" onClick={() => setStatusOpen(true)}>
              Update status
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <section className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Payment
              </h3>
              <p>Cash on Delivery</p>
              <p className="text-sm text-muted-foreground">
                Total {formatPrice(order.totalAmount)}
              </p>
            </div>

            {order.deliveryAddress ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Delivery address
                </h3>
                <div className="text-sm">
                  <p className="font-medium">
                    {order.deliveryAddress.label?.trim() ||
                      order.deliveryAddress.fullName}
                  </p>
                  {order.deliveryAddress.label?.trim() ? (
                    <p className="text-muted-foreground">
                      {order.deliveryAddress.fullName}
                    </p>
                  ) : null}
                  <div className="mt-1 space-y-0.5 text-muted-foreground">
                    {formatAddressLines(order.deliveryAddress).map(
                      (line, index) => (
                        <p key={`${order.id}-addr-${index}`}>{line}</p>
                      ),
                    )}
                    <p>{order.deliveryAddress.phone}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Items</h3>
            {items.length > 0 ? (
              <OrderItemsList items={items} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No items recorded.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Status history
            </h3>
            <StatusTimeline history={history} />
          </section>
        </div>

        <aside>
          <ReputationPanel order={order} />
        </aside>
      </div>

      <AdminOrderStatusDialog
        order={order}
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onUpdated={(next) => {
          setLocalOrder(next);
          void queryClient.invalidateQueries({ queryKey: adminOrdersQueryKey });
          void queryClient.invalidateQueries({
            queryKey: ["admin", "orders", orderId],
          });
          void queryClient.invalidateQueries({
            queryKey: ["admin", "dashboard", "recent-orders"],
          });
        }}
      />
    </div>
  );
}
