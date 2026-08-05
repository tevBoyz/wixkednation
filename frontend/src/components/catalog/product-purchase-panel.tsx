"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Product } from "@/lib/api/types";
import {
  formatSkuLabel,
  getProductCoverUrl,
  resolveProductSkus,
} from "@/lib/catalog/format";
import { cn } from "@/lib/utils";

type ProductPurchasePanelProps = {
  product: Product;
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const { addItem } = useCart();
  const formatPrice = useFormatPrice();
  const skus = useMemo(() => resolveProductSkus(product), [product]);
  const [selectedSkuId, setSelectedSkuId] = useState(skus[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!skus.some((sku) => sku.id === selectedSkuId)) {
      setSelectedSkuId(skus[0]?.id ?? "");
    }
  }, [selectedSkuId, skus]);

  const selected =
    skus.find((sku) => sku.id === selectedSkuId) ?? skus[0] ?? null;

  if (skus.length === 0 || !selected) {
    return (
      <p className="text-sm text-muted-foreground">
        Contact us for pricing on this strain.
      </p>
    );
  }

  async function onAdd() {
    if (!selected) {
      return;
    }
    setPending(true);
    try {
      await addItem({
        productId: product.id,
        skuId: selected.id,
        name: product.name,
        image: getProductCoverUrl(product),
        quantity,
        volume: selected.volume,
        measurementUnit: selected.measurementUnit,
        price: selected.price,
        skuLabel: formatSkuLabel(selected),
        slug: product.slug,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Pack size</legend>
        <div className="space-y-2">
          {skus.map((sku) => {
            const id = `sku-${sku.id}`;
            const checked = selected.id === sku.id;
            return (
              <label
                key={sku.id}
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    id={id}
                    type="radio"
                    name="product-sku"
                    value={sku.id}
                    checked={checked}
                    onChange={() => setSelectedSkuId(sku.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="font-medium">{formatSkuLabel(sku)}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatPrice(sku.price)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="product-qty">Quantity</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-none"
              aria-label="Decrease quantity"
              disabled={quantity <= 1 || pending}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <MinusIcon className="size-3.5" />
            </Button>
            <span
              id="product-qty"
              className="min-w-10 px-1 text-center text-sm tabular-nums"
            >
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-none"
              aria-label="Increase quantity"
              disabled={pending}
              onClick={() => setQuantity((q) => q + 1)}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
          <Button
            type="button"
            size="lg"
            className="flex-1 sm:flex-none"
            disabled={pending}
            onClick={() => void onAdd()}
          >
            {pending ? "Adding…" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
