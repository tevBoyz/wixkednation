"use client";

import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import { DELIVERY_FEE } from "@/lib/cart/delivery-fee";
import { formatVolumeUnit } from "@/lib/catalog/format";

type CheckoutOrderSummaryProps = {
  productDiscount?: number;
  deliveryFee?: number;
  couponCode?: string | null;
  couponLabel?: string | null;
};

export function CheckoutOrderSummary({
  productDiscount = 0,
  deliveryFee = DELIVERY_FEE,
  couponCode = null,
  couponLabel = null,
}: CheckoutOrderSummaryProps) {
  const formatPrice = useFormatPrice();
  const { items, subtotal } = useCart();
  const discount = Math.max(0, productDiscount);
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  return (
    <aside className="h-fit rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Order summary
      </h2>

      <ul className="mt-4 space-y-3">
        {items.map((line) => {
          const packLabel = formatVolumeUnit(line.volume, line.measurementUnit);
          const totalVolumeLabel = formatVolumeUnit(
            line.effectiveVolume,
            line.measurementUnit,
          );

          return (
            <li
              key={line.key}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{line.name}</p>
                <p className="text-muted-foreground">
                  Qty {line.quantity}
                  {line.skuLabel
                    ? ` · ${formatPrice(line.price)} / ${line.skuLabel}`
                    : packLabel
                      ? ` · ${formatPrice(line.price)} / ${packLabel}`
                      : null}
                </p>
                {totalVolumeLabel ? (
                  <p className="text-xs text-muted-foreground">
                    Total {totalVolumeLabel}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 font-medium">{formatPrice(line.lineTotal)}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex items-baseline justify-between gap-3 text-emerald-700 dark:text-emerald-400">
            <span>
              Discount
              {couponCode ? ` (${couponCode})` : ""}
            </span>
            <span className="font-medium">−{formatPrice(discount)}</span>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">
            Delivery
            {deliveryFee === 0 && couponCode ? ` (${couponCode})` : ""}
          </span>
          <span className="font-medium">
            {deliveryFee === 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400">
                FREE
              </span>
            ) : (
              formatPrice(deliveryFee)
            )}
          </span>
        </div>
        {couponLabel && discount === 0 && deliveryFee > 0 ? (
          <p className="text-xs text-muted-foreground">{couponLabel}</p>
        ) : null}
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
          <span className="font-medium">Total</span>
          <span className="text-lg font-semibold">{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Cash on Delivery - pay when your order arrives.
        </p>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Need to change items?{" "}
        <Link href="/cart" className="underline underline-offset-4">
          Edit cart
        </Link>
      </p>
    </aside>
  );
}
