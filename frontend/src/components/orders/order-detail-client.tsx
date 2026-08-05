"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";

import { CancelOrderDialog } from "@/components/orders/cancel-order-dialog";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMyOrder } from "@/lib/api/orders.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import { formatVolumeUnit } from "@/lib/catalog/format";
import { canCustomerCancelOrder, formatOrderStatus } from "@/lib/orders/status";
import type {
  Order,
  OrderAddressSnapshot,
  OrderItemSnapshot,
  OrderStatusHistoryEntry,
} from "@/lib/api/types";

function OrderBackButton({ className }: { className?: string }) {
  return (
    <Button
      render={<Link href="/account/orders" />}
      nativeButton={false}
      variant="outline"
      size="lg"
      className={cn(
        "gap-2 border-primary/40 bg-accent px-4 text-accent-foreground shadow-sm hover:border-primary hover:bg-[color-mix(in_srgb,var(--primary)_16%,var(--accent))] hover:text-accent-foreground",
        className,
      )}
    >
      <ArrowLeftIcon className="size-4" />
      Back to orders
    </Button>
  );
}
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
        const packLabel =
          item.skuLabel?.trim() ||
          formatVolumeUnit(item.volume, item.measurementUnit);
        const totalVolumeLabel = formatVolumeUnit(
          item.effectiveVolume ??
            (item.volume != null
              ? Number(item.volume) * item.quantity
              : null),
          item.measurementUnit,
        );

        return (
          <li
            key={`${item.skuId ?? item.productId}-${item.name}-${item.unitPrice}`}
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

type OrderDetailClientProps = {
  orderId: string;
};

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const formatPrice = useFormatPrice();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState<Order | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", "me", orderId],
    queryFn: () => getMyOrder(orderId),
  });

  const order = localOrder ?? data;
  const reference = order?.orderNumber || order?.id;
  const cancellable = order ? canCustomerCancelOrder(order.status) : false;

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
          <OrderBackButton />
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <OrderBackButton className="mb-4" />
          <h2 className="text-lg font-medium">{reference}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Payment</h3>
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
                {formatAddressLines(order.deliveryAddress).map((line, index) => (
                  <p key={`${order.id}-addr-${index}`}>{line}</p>
                ))}
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
          <p className="text-sm text-muted-foreground">No items recorded.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Status history
        </h3>
        <StatusTimeline history={history} />
      </section>

      {cancellable ? (
        <div className="border-t border-border pt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setCancelOpen(true)}
          >
            Cancel order
          </Button>
        </div>
      ) : null}

      <CancelOrderDialog
        order={order}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onCancelled={(next) => {
          setLocalOrder(next);
          void refetch();
        }}
        onStatusConflict={() => {
          setLocalOrder(null);
          void refetch();
        }}
      />
    </div>
  );
}
