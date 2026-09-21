import { Badge } from "@/components/ui/badge";
import type { AdminOrder, OrderRisk } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function orderHasRiskFlags(risk?: OrderRisk | null) {
  return Boolean(risk?.lowReputation || risk?.pendingPileUp);
}

export function guestPlacementLabel(order: {
  placedAsGuest?: boolean;
  matchedExistingAccount?: boolean;
}) {
  if (!order.placedAsGuest) {
    return "Registered";
  }
  if (order.matchedExistingAccount) {
    return "Guest (existing customer)";
  }
  return "Guest";
}

type AdminOrderFlagsProps = {
  order: Pick<
    AdminOrder,
    | "placedAsGuest"
    | "matchedExistingAccount"
    | "risk"
    | "deliveryFee"
    | "couponCode"
  >;
  className?: string;
};

export function AdminOrderFlags({ order, className }: AdminOrderFlagsProps) {
  const deliveryFee =
    order.deliveryFee != null ? Number(order.deliveryFee) : null;
  const freeDelivery = deliveryFee === 0 && Boolean(order.couponCode);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Badge variant={order.placedAsGuest ? "secondary" : "outline"}>
        {guestPlacementLabel(order)}
      </Badge>
      {freeDelivery ? (
        <Badge variant="default">FREE DELIVERY</Badge>
      ) : order.couponCode ? (
        <Badge variant="secondary">COUPON: {order.couponCode}</Badge>
      ) : null}
      {order.risk?.lowReputation ? (
        <Badge variant="destructive">Low reputation</Badge>
      ) : null}
      {order.risk?.pendingPileUp ? (
        <Badge variant="destructive">Pending pile-up</Badge>
      ) : null}
    </div>
  );
}
