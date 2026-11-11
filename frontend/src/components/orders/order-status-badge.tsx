import { Badge } from "@/components/ui/badge";
import {
  formatOrderStatus,
  orderStatusBadgeVariant,
} from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/api/types";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={orderStatusBadgeVariant(status)} className={className}>
      {formatOrderStatus(status)}
    </Badge>
  );
}
