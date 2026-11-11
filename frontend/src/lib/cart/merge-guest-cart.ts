import { mergeCart } from "@/lib/api/cart.api";
import type { Cart } from "@/lib/api/types";
import type { GuestCartLine } from "@/lib/cart/guest-cart";
import { useGuestCartStore } from "@/stores/guest-cart-store";

export type MergeGuestCartResult = {
  cart: Cart;
  merged: number;
  skipped: number;
  skippedProductIds: string[];
};

/**
 * POST /api/cart/merge with guest lines.
 * Caller should clear local guest cart only after success (see ensureGuestCartMerged).
 */
export async function mergeGuestCartWithServer(
  items: GuestCartLine[],
): Promise<MergeGuestCartResult> {
  const payload = items.map((item) => ({
    productId: item.productId,
    skuId: item.skuId,
    quantity: item.quantity,
  }));

  const data = await mergeCart(payload);

  return {
    cart: data.cart,
    merged: data.summary?.merged ?? 0,
    skipped: data.summary?.skipped ?? 0,
    skippedProductIds: data.summary?.skippedProductIds ?? [],
  };
}

/** Single-flight merge so React Strict Mode / remounts do not double-apply qty. */
let mergeFlight: Promise<MergeGuestCartResult | null> | null = null;

export function ensureGuestCartMerged(): Promise<MergeGuestCartResult | null> {
  if (mergeFlight) {
    return mergeFlight;
  }

  mergeFlight = (async () => {
    const items = useGuestCartStore.getState().items;
    if (items.length === 0) {
      return null;
    }

    const result = await mergeGuestCartWithServer(items);
    useGuestCartStore.getState().clear();
    return result;
  })().finally(() => {
    mergeFlight = null;
  });

  return mergeFlight;
}
