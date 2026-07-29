"use client";

import { useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { getProductCoverUrl, hasSellablePack } from "@/lib/catalog/format";
import type { Product } from "@/lib/api/types";

type AddToCartButtonProps = {
  product: Product;
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);

  if (!hasSellablePack(product) || product.price == null) {
    return null;
  }

  async function onAdd() {
    if (!hasSellablePack(product) || product.price == null) {
      return;
    }
    setPending(true);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        image: getProductCoverUrl(product),
        quantity: 1,
        volume: product.volume ?? null,
        measurementUnit: product.measurementUnit,
        price: product.price,
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
