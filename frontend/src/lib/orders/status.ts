import type { OrderStatus } from "@/lib/api/types";

export const ADMIN_ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
] as const satisfies readonly OrderStatus[];

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

const CANCELLABLE: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "OutForDelivery",
];

export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return CANCELLABLE.includes(status);
}

export function formatOrderStatus(status: OrderStatus): string {
  switch (status) {
    case "OutForDelivery":
      return "Out for delivery";
    default:
      return status;
  }
}

export function orderStatusBadgeVariant(
  status: OrderStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Delivered":
      return "default";
    case "Cancelled":
      return "destructive";
    case "Pending":
      return "outline";
    default:
      return "secondary";
  }
}
