"use client";

import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import { formatVolumeUnit } from "@/lib/catalog/format";

export function CheckoutOrderSummary() {
  const formatPrice = useFormatPrice();
  const { items, subtotal } = useCart();

  return (
    <aside className="h-fit rounded-lg border border-border p-4 lg:sticky lg:top-20">
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
                  {packLabel ? ` · ${formatPrice(line.price)} / ${packLabel}` : null}
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

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
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
