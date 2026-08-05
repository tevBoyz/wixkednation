"use client";

import { useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import {
  formatSkuLabel,
  getProductCoverUrl,
  resolveProductSkus,
} from "@/lib/catalog/format";
import type { Product } from "@/lib/api/types";

type AddToCartButtonProps = {
  product: Product;
  /** Defaults to first visible SKU. */
  skuId?: string;
  quantity?: number;
};

/** Quick add using a specific SKU (defaults to first visible pack). Prefer ProductPurchasePanel on PDP. */
export function AddToCartButton({
  product,
  skuId,
  quantity = 1,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const skus = resolveProductSkus(product);
  const selected =
    skus.find((sku) => sku.id === skuId) ?? skus[0] ?? null;

  if (!selected) {
    return null;
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
    <Button
      type="button"
      size="lg"
      className="w-full sm:w-auto"
      disabled={pending}
      onClick={() => void onAdd()}
    >
      {pending ? "Adding…" : "Add to cart"}
    </Button>
  );
}
